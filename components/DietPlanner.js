'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  Activity,
  Target,
  Sparkles,
  Coffee,
  Sun,
  Sunset,
  Cookie,
  Calendar,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// --- DESIGN SYSTEM TOKENS ---
// Cores e gradientes definidos para consistência
const COLORS = {
  phoenix: '#FF9F1C',
  gold: '#F5D68A',
  protein: '#3B82F6', // Azul mais limpo
  carbs: '#10B981',   // Verde mais limpo
  fat: '#F97316',     // Laranja mais limpo
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  }
}

// Estilos de cartões para reutilização
const cardStyles = {
  main: "bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-8",
  secondary: "bg-white/70 backdrop-blur-lg border border-white/50 shadow-lg rounded-xl p-6",
  interactive: "bg-white/60 backdrop-blur-md border border-white/40 shadow-md rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
  sidebar: "bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg rounded-2xl p-6",
}

// Configurações das refeições com design unificado
const MEALS = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, emoji: '☀️', gradient: 'from-yellow-400 to-amber-400' },
  { id: 'lunch', name: 'Almoço', icon: Sun, emoji: '🌞', gradient: 'from-amber-400 to-orange-400' },
  { id: 'dinner', name: 'Jantar', icon: Sunset, emoji: '🌙', gradient: 'from-indigo-400 to-blue-400' },
  { id: 'snacks', name: 'Lanches', icon: Cookie, emoji: '🍪', gradient: 'from-orange-400 to-red-400' },
]

// =================================================================
// HOOK CUSTOMIZADO PARA GESTÃO DE DADOS (Centraliza a lógica)
// =================================================================
const useDietData = (userId) => {
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [dailyIntake, setDailyIntake] = useState(null)
  const [dailyAdherence, setDailyAdherence] = useState(null)
  const [mealTotals, setMealTotals] = useState([])
  const [mealItems, setMealItems] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])

  const fetchAllData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Executa todas as chamadas em paralelo para melhor performance
      const [
        { data: intake },
        { data: adherence },
        { data: totals },
        { data: items },
        { data: summary }
      ] = await Promise.all([
        supabase.from('v_daily_intake').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('v_daily_adherence').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('v_meal_totals').select('*').eq('user_id', userId).eq('date', today),
        supabase.from('v_meal_items_nutrients').select('*').eq('user_id', userId).eq('date', today),
        supabase.from('v_weekly_summary').select('*').eq('user_id', userId).gte('date', sevenDaysAgo).lte('date', today).order('date', { ascending: true }),
      ])

      setDailyIntake(intake)
      setDailyAdherence(adherence)
      setMealTotals(totals || [])
      setMealItems(items || [])
      setWeeklySummary(summary || [])
    } catch (error) {
      console.error('Error loading diet data:', error)
      toast.error('Erro ao carregar dados da dieta.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  const recalculateGoals = useCallback(async () => {
    setRecalculating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase.rpc('fn_calc_goals', { p_user_id: userId, p_date: today })
      if (error) throw error
      toast.success('Metas recalculadas com sucesso! 🔥')
      await fetchAllData() // Recarrega os dados após o cálculo
    } catch (error) {
      console.error('Error recalculating goals:', error)
      toast.error('Erro ao recalcular metas.')
    } finally {
      setRecalculating(false)
    }
  }, [userId, fetchAllData])

  const addFood = useCallback(async (foodData) => {
    const { selectedMealType, selectedFood, quantity } = foodData
    try {
      const today = new Date().toISOString().split('T')[0]
      const qty = parseFloat(quantity) || 0
      const gramsPerUnit = selectedFood.grams_per_unit || 1
      const gramsTotal = qty * gramsPerUnit

      const { error } = await supabase.from('meal_items').insert({
        user_id: userId,
        date: today,
        meal_type: selectedMealType,
        food_id: selectedFood.id,
        qty_units: qty,
        grams_total: gramsTotal,
      })

      if (error) throw error
      toast.success('Alimento adicionado! 🎉')
      await fetchAllData() // Recarrega apenas os dados necessários
    } catch (error) {
      console.error('Error adding food:', error)
      toast.error('Erro ao adicionar alimento.')
    }
  }, [userId, fetchAllData])

  return {
    loading, recalculating, dailyIntake, dailyAdherence, mealTotals, mealItems, weeklySummary,
    actions: { recalculateGoals, addFood }
  }
}

// =================================================================
// COMPONENTES MENORES E REUTILIZÁVEIS (Melhor organização)
// =================================================================

// Componente para o Anel de Progresso Principal
const ProgressRing = memo(({ progress, label, message }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-48 h-48 mb-6">
      <svg className="w-full h-full -rotate-90 transform">
        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-200" />
        <motion.circle
          cx="96" cy="96" r="88" stroke={COLORS.phoenix} strokeWidth="12" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 88}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - Math.min(progress / 100, 1)) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span key={progress} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl font-bold" style={{ color: COLORS.phoenix }}>
          {Math.round(progress)}%
        </motion.span>
        <span className="text-sm text-muted-foreground mt-1 font-medium">{label}</span>
      </div>
    </div>
    <motion.p key={progress} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-lg font-medium text-center max-w-sm" style={{ color: COLORS.phoenix }}>
      {message}
    </motion.p>
  </div>
))

// Componente para as Barras de Macronutrientes
const MacroBars = memo(({ macros }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
    {macros.map((macro, index) => {
      const Icon = macro.icon
      const progress = Math.min((macro.current / macro.goal) * 100, 100)
      return (
        <motion.div key={macro.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.1 }} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" style={{ color: macro.color }} />
              <span className="text-sm font-semibold text-secondary">{macro.label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: macro.color }}>
              {macro.current} / {macro.goal} {macro.unit}
            </span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className={`h-full bg-gradient-to-r ${macro.gradient}`} style={{ backgroundColor: macro.color }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }} />
          </div>
        </motion.div>
      )
    })}
  </div>
))

// Componente para o Card de Refeição
const MealCard = memo(({ meal, data, items, isExpanded, onToggle, onAddClick }) => {
  const Icon = meal.icon
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * MEALS.indexOf(meal) }}>
      <Card className={`${cardStyles.interactive} relative overflow-hidden`} onClick={onToggle}>
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-phoenix-400 to-phoenix-600" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-gradient-to-br ${meal.gradient} shadow-md`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>{meal.emoji}</span> {meal.name}
              </h3>
              <p className="text-sm text-muted-foreground">{data?.total_kcal || 0} kcal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground hidden sm:flex gap-3 font-medium">
              <span style={{ color: COLORS.carbs }}>C: {data?.total_carbs_g || 0}g</span>
              <span style={{ color: COLORS.protein }}>P: {data?.total_protein_g || 0}g</span>
              <span style={{ color: COLORS.fat }}>G: {data?.total_fat_g || 0}g</span>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {items.length > 0 ? items.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-accent/50">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.food_name}</span>
                      <span className="font-semibold">{item.item_kcal} kcal</span>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-2">Nenhum alimento adicionado.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

// Componente para o Modal de Adicionar Alimento
const AddFoodModal = memo(({ open, onOpenChange, onAddFood }) => {
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const searchFoods = async (query) => {
    if (query.length < 2) { setFoodResults([]); return }
    const { data, error } = await supabase.from('foods').select('*').ilike('name', `%${query}%`).limit(10)
    if (!error) setFoodResults(data)
  }

  const handleAdd = async () => {
    if (!selectedFood || !quantity) return
    setIsAdding(true)
    await onAddFood({ selectedMealType, selectedFood, quantity })
    setIsAdding(false)
    onOpenChange(false)
    // Reset form
    setFoodSearch(''); setSelectedFood(null); setQuantity(''); setFoodResults([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg backdrop-blur-xl bg-white/95 rounded-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-bold">Adicionar Alimento</DialogTitle></DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold">Para qual refeição?</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {MEALS.map(meal => (
                <Button key={meal.id} variant={selectedMealType === meal.id ? "default" : "outline"} size="sm" onClick={() => setSelectedMealType(meal.id)} className={`rounded-xl py-3 transition-all ${selectedMealType === meal.id ? `bg-gradient-to-r ${meal.gradient} shadow-lg` : ''}`}>
                  <span className="mr-2">{meal.emoji}</span> {meal.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Buscar Alimento</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Ex: Frango, Arroz..." value={foodSearch} onChange={(e) => { setFoodSearch(e.target.value); searchFoods(e.target.value) }} className="pl-10 h-11 rounded-lg" />
            </div>
            {foodResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-accent/30">
                {foodResults.map(food => (
                  <div key={food.id} onClick={() => { setSelectedFood(food); setFoodSearch(food.name); setFoodResults([]) }} className="p-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
                    <p className="font-medium">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.kcal_per_100g} kcal / 100g</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">Quantidade</Label>
            <Input type="number" placeholder="Ex: 150" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-2 h-11 rounded-lg" />
            {selectedFood && quantity && <p className="text-xs text-muted-foreground mt-1">Total: ~{Math.round((parseFloat(quantity) || 0) * (selectedFood.grams_per_unit || 1))}g</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-lg">Cancelar</Button>
          <Button onClick={handleAdd} disabled={!selectedFood || !quantity || isAdding} className="flex-1 h-11 rounded-lg bg-gradient-to-r from-phoenix-400 to-phoenix-600 shadow-lg hover:shadow-xl transition-all">
            {isAdding ? 'Adicionando...' : 'Adicionar Alimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})


// =================================================================
// COMPONENTE PRINCIPAL (Agora limpo e focado em organizar a UI)
// =================================================================
export default function DietPlanner() {
  const { user } = useAuth()
  const { loading, recalculating, dailyIntake, dailyAdherence, mealTotals, mealItems, weeklySummary, actions } = useDietData(user?.id)
  
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Memoização para evitar re-cálculos em cada renderização
  const calorieProgress = useMemo(() => dailyIntake ? ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100 : 0, [dailyIntake])
  
  const macroBarsData = useMemo(() => [
    { label: 'Calorias', icon: Flame, current: dailyIntake?.total_kcal || 0, goal: dailyIntake?.goal_kcal || 2000, unit: 'kcal', color: COLORS.phoenix, gradient: 'from-phoenix-400 to-amber-400' },
    { label: 'Proteínas', icon: Activity, current: dailyIntake?.total_protein_g || 0, goal: dailyIntake?.goal_protein_g || 150, unit: 'g', color: COLORS.protein, gradient: 'from-blue-400 to-blue-600' },
    { label: 'Carboidratos', icon: Target, current: dailyIntake?.total_carbs_g || 0, goal: dailyIntake?.goal_carbs_g || 250, unit: 'g', color: COLORS.carbs, gradient: 'from-green-400 to-green-600' },
    { label: 'Gorduras', icon: Sparkles, current: dailyIntake?.total_fat_g || 0, goal: dailyIntake?.goal_fat_g || 65, unit: 'g', color: COLORS.fat, gradient: 'from-orange-400 to-red-500' },
  ], [dailyIntake])

  const weeklyChartData = useMemo(() => weeklySummary.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    adherence: Math.round(day.avg_adherence_pct || 0)
  })), [weeklySummary])

  const getMotivationalMessage = (progress) => {
    if (progress >= 100) return '🔥 Meta atingida! Excelente trabalho hoje!'
    if (progress >= 90) return `🔥 Quase lá! Você está em ${Math.round(progress)}% da meta!`
    if (progress >= 70) return `💪 Continue assim, você está em ${Math.round(progress)}% da meta!`
    if (progress >= 50) return `👍 Bom progresso! ${Math.round(progress)}% da meta já alcançados.`
    return `🎯 Vamos começar! Você já está em ${Math.round(progress)}% da meta.`
  }

  const toggleMeal = (mealId) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) newSet.delete(mealId)
      else newSet.add(mealId)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Flame className="w-12 h-12 text-phoenix-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 max-w-7xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-phoenix-500 to-amber-500 bg-clip-text text-transparent">
            Nutrição
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
          </p>
        </div>
        <Button onClick={actions.recalculateGoals} disabled={recalculating} className="bg-white/80 backdrop-blur-md border border-white/70 shadow-lg hover:shadow-xl transition-all rounded-xl px-6 py-3 h-auto">
          <RefreshCw className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          Recalcular Metas
        </Button>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Coluna Principal (2/3) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Card de Progresso Principal */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cardStyles.main}>
            <ProgressRing progress={calorieProgress} label="Do seu objetivo" message={getMotivationalMessage(calorieProgress)} />
            <MacroBars macros={macroBarsData} />
          </motion.div>

          {/* Card de Análise Semanal */}
          {weeklySummary.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardStyles.secondary}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-phoenix-500" />
                Análise Semanal
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <XAxis dataKey="date" stroke={COLORS.text.muted} fontSize={12} />
                    <YAxis stroke={COLORS.text.muted} fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="adherence" stroke={COLORS.phoenix} strokeWidth={3} dot={{ fill: COLORS.phoenix, r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>

        {/* Coluna Lateral (1/3) */}
        <div className="xl:col-span-1 space-y-8">
          {/* Seção de Refeições */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Refeições de Hoje</h2>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-phoenix-400 to-phoenix-600 text-white rounded-xl px-5 py-2.5 shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-5 h-5 mr-2" /> Adicionar
              </Button>
            </div>
            <div className="space-y-4">
              {MEALS.map(meal => {
                const data = mealTotals.find(m => m.meal_type === meal.id)
                const items = mealItems.filter(item => item.meal_type === meal.id)
                return (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    data={data}
                    items={items}
                    isExpanded={expandedMeals.has(meal.id)}
                    onToggle={() => toggleMeal(meal.id)}
                    onAddClick={() => setIsAddModalOpen(true)}
                  />
                )
              })}
            </div>
          </div>

          {/* Card do Nutricionista */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cardStyles.sidebar}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-gradient-to-br from-phoenix-400 to-amber-400">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Nutricionista Phoenix</h3>
                <p className="text-sm text-muted-foreground">Plano otimizado!</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-phoenix-100 to-amber-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Calorias</span>
                  <span className="font-bold text-phoenix-600">{dailyIntake?.total_kcal || 0} / {dailyIntake?.goal_kcal || 2000}</span>
                </div>
              </div>
              <Button onClick={actions.recalculateGoals} disabled={recalculating} className="w-full bg-gradient-to-r from-phoenix-400 to-phoenix-600 text-white rounded-xl py-3 shadow-lg hover:shadow-xl transition-all">
                <RefreshCw className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando...' : 'Recalcular Plano'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Adicionar Alimento */}
      <AddFoodModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddFood={actions.addFood} />
    </div>
  )
}