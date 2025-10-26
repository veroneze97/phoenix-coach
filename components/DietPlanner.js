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
  Edit2,
  Trash2,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// --- DESIGN SYSTEM TOKENS ---
// NOTA: Este objeto agora é menos necessário, pois usamos classes Tailwind.
// Mantido para compatibilidade, mas pode ser refatorado no futuro.
const COLORS = {
  phoenix: 'hsl(var(--phoenix-500))',
  gold: 'hsl(var(--phoenix-600))',
  protein: '#3B82F6',
  carbs: '#10B981',
  fat: '#F97316',
}

// Estilos de cartões para reutilização, com suporte a dark mode
const cardStyles = {
  main: "bg-card/80 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-fluid dark:bg-gray-900/80",
  secondary: "bg-card/70 backdrop-blur-lg border border-border shadow-lg rounded-xl p-fluid dark:bg-gray-900/70",
  interactive: "bg-card/60 backdrop-blur-md border border-border shadow-md rounded-xl p-fluid transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer dark:bg-gray-800/60",
  sidebar: "bg-card/90 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-fluid dark:bg-gray-900/90",
}

const MEALS = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, emoji: '☀️', gradient: 'from-phoenix-400 to-phoenix-500' },
  { id: 'lunch', name: 'Almoço', icon: Sun, emoji: '🌞', gradient: 'from-phoenix-500 to-phoenix-600' },
  { id: 'dinner', name: 'Jantar', icon: Sunset, emoji: '🌙', gradient: 'from-blue-400 to-blue-600' },
  { id: 'snacks', name: 'Lanches', icon: Cookie, emoji: '🍪', gradient: 'from-phoenix-400 to-red-500' },
]

// =================================================================
// HOOK CUSTOMIZADO PARA GESTÃO DE DADOS (VERSÃO ATUALIZADA DA ETAPA 2)
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

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const recalculateGoals = useCallback(async () => {
    setRecalculating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase.rpc('fn_calc_goals', {
        p_user_id: userId,
        p_date: today
      })

      if (error) throw error
      toast.success('Metas recalculadas com sucesso! 🔥')
      await fetchAllData()
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
      await fetchAllData()
    } catch (error) {
      console.error('Error adding food:', error)
      toast.error('Erro ao adicionar alimento.')
    }
  }, [userId, fetchAllData])

  const updateFood = useCallback(async (itemId, foodData) => {
    const { selectedMealType, selectedFood, quantity } = foodData
    try {
      const qty = parseFloat(quantity) || 0
      const gramsPerUnit = selectedFood.grams_per_unit || 1
      const gramsTotal = qty * gramsPerUnit

      const { error } = await supabase.from('meal_items').update({
        meal_type: selectedMealType,
        food_id: selectedFood.id,
        qty_units: qty,
        grams_total: gramsTotal,
      }).eq('id', itemId)

      if (error) throw error
      toast.success('Alimento atualizado! ✅')
      await fetchAllData()
    } catch (error) {
      console.error('Error updating food:', error)
      toast.error('Erro ao atualizar alimento.')
    }
  }, [userId, fetchAllData])

  const deleteFood = useCallback(async (itemId) => {
    try {
      const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
      if (error) throw error
      toast.success('Alimento removido! 🗑️')
      await fetchAllData()
    } catch (error) {
      console.error('Error deleting food:', error)
      toast.error('Erro ao remover alimento.')
    }
  }, [userId, fetchAllData])

  return {
    loading,
    recalculating,
    dailyIntake,
    dailyAdherence,
    mealTotals,
    mealItems,
    weeklySummary,
    actions: { 
      fetchAllData,
      recalculateGoals, 
      addFood, 
      updateFood,
      deleteFood
    }
  }
}

// =================================================================
// COMPONENTES MENORES E REUTILIZÁVEIS
// =================================================================
const ProgressRing = memo(({ progress, label, message }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-48 h-48 mb-6">
      <svg className="w-full h-full -rotate-90 transform">
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx="96"
          cy="96"
          r="88"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 88}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
          animate={{
            strokeDashoffset: 2 * Math.PI * 88 * (1 - Math.min(progress / 100, 1))
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-phoenix-500 dark:text-phoenix-400"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={progress}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold text-foreground"
        >
          {Math.round(progress)}%
        </motion.span>
        <span className="text-sm text-muted-foreground mt-1 font-medium">{label}</span>
      </div>
    </div>
    <motion.p
      key={progress}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center text-lg font-medium text-center max-w-sm text-phoenix-600 dark:text-phoenix-400"
    >
      {message}
    </motion.p>
  </div>
))

const MacroBars = memo(({ macros }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
    {macros.map((macro, index) => {
      const Icon = macro.icon
      const progress = Math.min((macro.current / macro.goal) * 100, 100)
      return (
        <motion.div
          key={macro.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" style={{ color: macro.color }} />
              <span className="text-sm font-semibold text-muted-foreground">{macro.label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: macro.color }}>
              {macro.current} / {macro.goal} {macro.unit}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${macro.gradient}`}
              style={{ backgroundColor: macro.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )
    })}
  </div>
))

// =================================================================
// COMPONENTE MealCard (VERSÃO COM LAYOUT ATUALIZADO)
// =================================================================
const MealCard = memo(({ meal, data, items, isExpanded, onToggle, onEditItem, onDeleteItem }) => {
  const Icon = meal.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * MEALS.indexOf(meal) }}
    >
      <Card className={`${cardStyles.interactive} relative overflow-hidden`} onClick={onToggle}>
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-phoenix-400 to-phoenix-600" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-gradient-to-br ${meal.gradient} shadow-md`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <span>{meal.emoji}</span> {meal.name}
              </h3>
              <p className="text-sm text-muted-foreground">{data?.total_kcal || 0} kcal</p>
              {/* --- MACRONUTRIENTES AQUI --- */}
              <div className="flex gap-3 font-medium text-xs text-muted-foreground mt-1">
                <span className="text-green-600 dark:text-green-400">C: {data?.total_carbs_g || 0}g</span>
                <span className="text-blue-600 dark:text-blue-400">P: {data?.total_protein_g || 0}g</span>
                <span className="text-phoenix-600 dark:text-phoenix-400">G: {data?.total_fat_g || 0}g</span>
              </div>
            </div>
          </div>
          {/* O ícone de expandir/contrair agora fica sozinho à direita */}
          <div className="flex items-center">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-accent/50 group/item transition-all">
                      <div className="flex justify-between text-sm items-center">
                        <span className="font-medium text-foreground">{item.food_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.item_kcal} kcal</span>
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-blue-600" 
                              onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-red-600" 
                              onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum alimento adicionado.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

// =================================================================
// MODAL GENÉRICO PARA ADICIONAR/EDITAR (NOVO COMPONENTE)
// =================================================================
const FoodModal = memo(({ open, onOpenChange, onAddFood, onUpdateFood, itemToEdit }) => {
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (itemToEdit) {
      setSelectedMealType(itemToEdit.meal_type)
      setFoodSearch(itemToEdit.food_name)
      setSelectedFood({ id: itemToEdit.food_id, name: itemToEdit.food_name, grams_per_unit: itemToEdit.grams_per_unit })
      setQuantity(itemToEdit.qty_units.toString())
    } else {
      setSelectedMealType('breakfast')
      setFoodSearch('')
      setSelectedFood(null)
      setQuantity('')
      setFoodResults([])
    }
  }, [itemToEdit, open])

  const searchFoods = async (query) => {
    if (query.length < 2) {
      setFoodResults([])
      return
    }
    const { data, error } = await supabase.from('foods').select('*').ilike('name', `%${query}%`).limit(10)
    if (!error) setFoodResults(data)
  }

  const handleSave = async () => {
    if (!selectedFood || !quantity) return
    setIsSaving(true)
    const foodData = { selectedMealType, selectedFood, quantity }
    
    if (itemToEdit) {
      await onUpdateFood(itemToEdit.id, foodData)
    } else {
      await onAddFood(foodData)
    }

    setIsSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg backdrop-blur-xl bg-background/95 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {itemToEdit ? 'Editar Alimento' : 'Adicionar Alimento'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-foreground">Para qual refeição?</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {MEALS.map(meal => (
                <Button
                  key={meal.id}
                  variant={selectedMealType === meal.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMealType(meal.id)}
                  className={`rounded-xl py-3 transition-all ${selectedMealType === meal.id ? `bg-gradient-to-r ${meal.gradient} shadow-lg` : ''
                    }`}
                >
                  <span className="mr-2">{meal.emoji}</span> {meal.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">Buscar Alimento</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ex: Frango, Arroz..."
                value={foodSearch}
                onChange={(e) => {
                  setFoodSearch(e.target.value)
                  searchFoods(e.target.value)
                }}
                className="pl-10 h-11 rounded-lg"
              />
            </div>
            {foodResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-accent/30">
                {foodResults.map(food => (
                  <div
                    key={food.id}
                    onClick={() => {
                      setSelectedFood(food)
                      setFoodSearch(food.name)
                      setFoodResults([])
                    }}
                    className="p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.kcal_per_100g} kcal / 100g</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">Quantidade</Label>
            <Input
              type="number"
              placeholder="Ex: 150"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-2 h-11 rounded-lg"
            />
            {selectedFood && quantity && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: ~{Math.round((parseFloat(quantity) || 0) * (selectedFood.grams_per_unit || 1))}g
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFood || !quantity || isSaving}
            className="flex-1 h-11 rounded-lg bg-gradient-to-r from-phoenix-500 to-phoenix-600 shadow-lg hover:shadow-xl transition-all"
          >
            {isSaving ? 'Salvando...' : (itemToEdit ? 'Salvar Alterações' : 'Adicionar Alimento')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})


// =================================================================
// COMPONENTE PRINCIPAL COM DESIGN FLUIDO (VERSÃO FINAL)
// =================================================================
export default function DietPlanner() {
  const { user } = useAuth()
  const { loading, recalculating, dailyIntake, dailyAdherence, mealTotals, mealItems, weeklySummary, actions } = useDietData(user?.id)

  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)

  const calorieProgress = useMemo(() => {
    if (!dailyIntake) return 0
    return ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100
  }, [dailyIntake])

  const macroBarsData = useMemo(() => [
    { label: 'Calorias', icon: Flame, current: dailyIntake?.total_kcal || 0, goal: dailyIntake?.goal_kcal || 2000, unit: 'kcal', color: COLORS.phoenix, gradient: 'from-phoenix-400 to-phoenix-600' },
    { label: 'Proteínas', icon: Activity, current: dailyIntake?.total_protein_g || 0, goal: dailyIntake?.goal_protein_g || 150, unit: 'g', color: COLORS.protein, gradient: 'from-blue-400 to-blue-600' },
    { label: 'Carboidratos', icon: Target, current: dailyIntake?.total_carbs_g || 0, goal: dailyIntake?.goal_carbs_g || 250, unit: 'g', color: COLORS.carbs, gradient: 'from-green-400 to-green-600' },
    { label: 'Gorduras', icon: Sparkles, current: dailyIntake?.total_fat_g || 0, goal: dailyIntake?.goal_fat_g || 65, unit: 'g', color: COLORS.fat, gradient: 'from-phoenix-400 to-red-500' },
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
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  // --- FUNÇÕES DE HANDLING (NOVO) ---
  const handleAddFood = async (foodData) => {
    await actions.addFood(foodData)
  }

  const handleUpdateFood = async (itemId, foodData) => {
    await actions.updateFood(itemId, foodData)
  }
  
  const handleEditClick = (item) => {
    setItemToEdit(item)
    setIsFoodModalOpen(true)
  }

  const handleDeleteClick = (itemId) => {
    actions.deleteFood(itemId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Flame className="w-12 h-12 text-phoenix-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-blue-50 dark:from-gray-950 dark:via-background dark:to-gray-900 rounded-3xl p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-fluid-h1 font-bold tracking-tight bg-gradient-to-r from-phoenix-500 to-phoenix-600 bg-clip-text text-transparent">
                Nutrição
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
              </p>
            </div>
            <Button
              onClick={actions.fetchAllData}
              disabled={loading}
              className="bg-card border-border shadow-lg hover:shadow-xl hover:bg-accent transition-all rounded-xl px-6 py-3 h-auto text-foreground"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
             Atualizar Dados
            </Button>
          </motion.div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Coluna Principal (2/3) */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cardStyles.main}
              >
                <ProgressRing
                  progress={calorieProgress}
                  label="Do seu objetivo"
                  message={getMotivationalMessage(calorieProgress)}
                />
                <MacroBars macros={macroBarsData} />
              </motion.div>

              {weeklySummary.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cardStyles.secondary}
                >
                  <h3 className="text-fluid-h2 font-bold mb-6 flex items-center gap-3 text-foreground">
                    <Calendar className="w-6 h-6 text-phoenix-500" />
                    Análise Semanal
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="adherence" stroke={COLORS.phoenix} strokeWidth={3} dot={{ fill: COLORS.phoenix, r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coluna Lateral (1/3) */}
            <div className="xl:col-span-1 space-y-6 lg:space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-fluid-h2 font-bold text-foreground">Refeições de Hoje</h2>
                  <Button
                    onClick={() => setIsFoodModalOpen(true)}
                    className="bg-gradient-to-r from-phoenix-500 to-phoenix-600 text-white rounded-xl px-5 py-2.5 shadow-lg hover:shadow-xl transition-all"
                  >
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
                        onEditItem={handleEditClick}
                        onDeleteItem={handleDeleteClick}
                      />
                    )
                  })}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cardStyles.sidebar}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-gradient-to-br from-phoenix-400 to-phoenix-500">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">Nutricionista Phoenix</h3>
                    <p className="text-sm text-muted-foreground">Plano otimizado!</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-phoenix-100 to-phoenix-200 dark:from-phoenix-900/30 dark:to-phoenix-800/30">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Calorias</span>
                      <span className="font-bold text-phoenix-600 dark:text-phoenix-400">{dailyIntake?.total_kcal || 0} / {dailyIntake?.goal_kcal || 2000}</span>
                    </div>
                  </div>
                  <Button
                    onClick={actions.recalculateGoals}
                    disabled={recalculating}
                    className="w-full bg-gradient-to-r from-phoenix-500 to-phoenix-600 dark:from-phoenix-600 dark:to-phoenix-700 text-white rounded-xl py-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculando...' : 'Recalcular Metas'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          <FoodModal
            open={isFoodModalOpen}
            onOpenChange={(open) => {
                setIsFoodModalOpen(open)
                if (!open) setItemToEdit(null)
            }}
            onAddFood={handleAddFood}
            onUpdateFood={handleUpdateFood}
            itemToEdit={itemToEdit}
          />
        </div>
      </div>
    </div>
  )
}