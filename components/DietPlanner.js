'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
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
  Leaf,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PhoenixOracle from './PhoenixOracle';

// --- DESIGN SYSTEM TOKENS ---
const cardStyles = {
  interactive: "bg-white/60 dark:bg-zinc-800/60 backdrop-blur-lg border border-white/20 dark:border-zinc-700/50 shadow-xl rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer",
  sidebar: "bg-white/60 dark:bg-zinc-800/60 backdrop-blur-lg border border-white/20 dark:border-zinc-700/50 shadow-xl rounded-2xl p-6",
}

const MEALS = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, emoji: '☀️', gradient: 'from-yellow-400 to-amber-400' },
  { id: 'lunch', name: 'Almoço', icon: Sun, emoji: '🌞', gradient: 'from-amber-400 to-orange-400' },
  { id: 'dinner', name: 'Jantar', icon: Sunset, emoji: '🌙', gradient: 'from-indigo-400 to-blue-400' },
  { id: 'snacks', name: 'Lanches', icon: Cookie, emoji: '🍪', gradient: 'from-orange-400 to-red-400' },
]

// Hook de debounce para otimizar a busca de alimentos
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

      // Adicionando um parâmetro aleatório para evitar cache
      const cacheBuster = Date.now();

      const [
        intakeResult,
        adherenceResult,
        totalsResult,
        itemsResult,
        summaryResult
      ] = await Promise.allSettled([
        supabase.from('v_daily_intake').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('v_daily_adherence').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('v_meal_totals').select('*').eq('user_id', userId).eq('date', today),
        supabase.from('v_meal_items_nutrients').select('*').eq('user_id', userId).eq('date', today),
        supabase.from('v_weekly_summary').select('*').eq('user_id', userId).gte('date', sevenDaysAgo).lte('date', today).order('date', { ascending: true }),
      ])

      if (intakeResult.status === 'fulfilled') {
        console.log('Daily intake loaded:', intakeResult.value);
        setDailyIntake(intakeResult.value)
      }
      if (adherenceResult.status === 'fulfilled') setDailyAdherence(adherenceResult.value)
      if (totalsResult.status === 'fulfilled') {
        console.log('Meal totals loaded:', totalsResult.value);
        setMealTotals(totalsResult.value || [])
      }
      if (itemsResult.status === 'fulfilled') {
        console.log('Meal items loaded:', itemsResult.value);
        setMealItems(itemsResult.value || [])
      }
      if (summaryResult.status === 'fulfilled') {
        setWeeklySummary(summaryResult.value)
      } else {
        console.error('Could not fetch weekly summary:', summaryResult.reason)
      }

    } catch (error) {
      console.error('A critical error occurred while loading diet data:', error)
      toast.error('Erro ao carregar dados da dieta.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Adicionando subscrição em tempo real para atualizações automáticas
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('meal_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_items', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Change detected in meal_items:', payload);
          fetchAllData();
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [userId, fetchAllData]);

  const recalculateGoals = useCallback(async () => {
    setRecalculating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase.rpc('fn_calc_goals', {
        p_user_id: userId,
        p_date: today
      })

      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          toast.error('Função de recálculo não encontrada no banco de dados. Entre em contato com o suporte.')
        } else {
          throw error;
        }
      } else {
        toast.success('Metas recalculadas com sucesso! 🔥')
        await fetchAllData()
      }
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

      console.log('Adding food:', { userId, today, selectedMealType, foodId: selectedFood.id, qty, gramsTotal });

      const { data, error } = await supabase.from('meal_items').insert({
        user_id: userId,
        date: today,
        meal_type: selectedMealType,
        food_id: selectedFood.id,
        qty_units: qty,
        grams_total: gramsTotal,
      }).select();

      if (error) throw error
      
      console.log('Food added successfully:', data);
      toast.success('Alimento adicionado! 🎉')
      
      // Adicionando um pequeno delay para garantir que o banco de dados processe a atualização
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

      console.log('Updating food:', { itemId, selectedMealType, foodId: selectedFood.id, qty, gramsTotal });

      const { error } = await supabase.from('meal_items').update({
        meal_type: selectedMealType,
        food_id: selectedFood.id,
        qty_units: qty,
        grams_total: gramsTotal,
      }).eq('id', itemId)

      if (error) throw error
      toast.success('Alimento atualizado! ✅')
      
      // Adicionando um pequeno delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchAllData()
    } catch (error) {
      console.error('Error updating food:', error)
      toast.error('Erro ao atualizar alimento.')
    }
  }, [userId, fetchAllData])

  const deleteFood = useCallback(async (itemId) => {
    try {
      console.log('Deleting food:', itemId);
      
      const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
      if (error) throw error
      toast.success('Alimento removido! 🗑️')
      
      // Adicionando um pequeno delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

const PhoenixBackground = memo(({ progress }) => {
  const bgOpacity = Math.min(progress / 100, 0.8)
  const bgStyle = {
    background: `radial-gradient(circle at 50% 50%, rgba(251, 146, 60, ${bgOpacity * 0.3}), rgba(251, 146, 60, 0) 50%), linear-gradient(to bottom, #f8fafc, #e2e8f0)`
  }
  return <motion.div className="fixed inset-0 -z-10" style={bgStyle} pointerEvents="none" />
})

const PhoenixTree = memo(({ dailyIntake }) => {
  const progress = useMemo(() => {
    if (!dailyIntake) return { c: 0, p: 0, g: 0 }
    return {
      c: Math.min((dailyIntake.total_carbs_g || 0) / (dailyIntake.goal_carbs_g || 250), 1),
      p: Math.min((dailyIntake.total_protein_g || 0) / (dailyIntake.goal_protein_g || 150), 1),
      g: Math.min((dailyIntake.total_fat_g || 0) / (dailyIntake.goal_fat_g || 65), 1),
    }
  }, [dailyIntake])

  return (
    <div className="flex flex-col items-center justify-center w-full h-96">
      <svg width="300" height="300" viewBox="0 0 300 300" className="w-full h-full">
        <rect x="140" y="180" width="20" height="120" fill="#8B4513" />
        <motion.path
          d="M 150 180 Q 120 150 100 120"
          stroke="hsl(var(--phoenix-400))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.c }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <motion.path
          d="M 150 160 Q 180 130 200 100"
          stroke="hsl(var(--phoenix-500))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.p }}
          transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
        />
        <motion.path
          d="M 150 140 Q 130 110 110 80"
          stroke="hsl(var(--phoenix-600))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.g }}
          transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
        />
        <motion.circle
          cx="100"
          cy="120"
          r="8"
          fill="hsl(var(--phoenix-400))"
          initial={{ scale: 0 }}
          animate={{ scale: progress.c }}
          transition={{ delay: 1.5 }}
        />
        <motion.circle
          cx="200"
          cy="100"
          r="8"
          fill="hsl(var(--phoenix-500))"
          initial={{ scale: 0 }}
          animate={{ scale: progress.p }}
          transition={{ delay: 1.7 }}
        />
        <motion.circle
          cx="110"
          cy="80"
          r="8"
          fill="hsl(var(--phoenix-600))"
          initial={{ scale: 0 }}
          animate={{ scale: progress.g }}
          transition={{ delay: 1.9 }}
        />
      </svg>
      <div className="mt-4 text-center">
        <p className="text-2xl font-bold text-foreground">{dailyIntake?.total_kcal || 0} / {dailyIntake?.goal_kcal || 2000} kcal</p>
        <p className="text-sm text-muted-foreground">Sua jornada hoje</p>
      </div>
    </div>
  )
})

const MealCard = memo(({ meal, data, items, isExpanded, onToggle, onEditItem, onDeleteItem }) => {
  const Icon = meal.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * MEALS.indexOf(meal) }}
    >
      <Card className={cardStyles.interactive} onClick={onToggle}>
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
              <div className="flex gap-3 font-medium text-xs text-muted-foreground mt-1">
                <span className="text-green-600 dark:text-green-400">C: {data?.total_carbs_g || 0}g</span>
                <span className="text-blue-600 dark:text-blue-400">P: {data?.total_protein_g || 0}g</span>
                <span className="text-phoenix-600 dark:text-phoenix-400">G: {data?.total_fat_g || 0}g</span>
              </div>
            </div>
          </div>
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
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditItem(item)
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                              }}
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

const FoodModal = memo(({ open, onOpenChange, onAddFood, onUpdateFood, itemToEdit }) => {
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const debouncedSearchTerm = useDebounce(foodSearch, 300);

  useEffect(() => {
    if (itemToEdit) {
      setSelectedMealType(itemToEdit.meal_type)
      setFoodSearch(itemToEdit.food_name)
      setSelectedFood({
        id: itemToEdit.food_id,
        name: itemToEdit.food_name,
        grams_per_unit: itemToEdit.grams_per_unit,
      })
      setQuantity(itemToEdit.qty_units.toString())
    } else {
      setSelectedMealType('breakfast')
      setFoodSearch('')
      setSelectedFood(null)
      setQuantity('')
      setFoodResults([])
    }
  }, [itemToEdit, open])

  useEffect(() => {
    const searchFoods = async (query) => {
      console.log(`Buscando por: "${query}"`);
      
      if (query.length < 2) {
        setFoodResults([])
        return
      }
      
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)

      if (error) {
        console.error("Erro ao buscar alimentos no Supabase:", error);
        toast.error("Erro ao buscar alimentos. Verifique o console.");
        return;
      }

      console.log("Resultados encontrados:", data);
      if (!error) setFoodResults(data)
    }
    
    if (debouncedSearchTerm) {
      searchFoods(debouncedSearchTerm);
    } else {
      setFoodResults([]);
    }
  }, [debouncedSearchTerm])

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    if (!selectedFood) {
      toast.error('Por favor, selecione um alimento na lista de busca.');
      return;
    }
    if (!quantity || isNaN(qty) || qty <= 0) {
      toast.error('Por favor, insira uma quantidade válida e maior que zero.');
      return;
    }

    setIsSaving(true)
    const foodData = { selectedMealType, selectedFood, quantity: qty }
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
                  className={`rounded-xl py-3 transition-all ${
                    selectedMealType === meal.id
                      ? `bg-gradient-to-r ${meal.gradient} shadow-lg`
                      : ''
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
                onChange={(e) => setFoodSearch(e.target.value)}
                className="pl-10 h-11 rounded-lg"
              />
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

export default function DietPlanner() {
  const { user } = useAuth()
  const {
    loading,
    recalculating,
    dailyIntake,
    dailyAdherence,
    mealTotals,
    mealItems,
    weeklySummary,
    actions,
  } = useDietData(user?.id)

  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)

  const calorieProgress = useMemo(() => {
    if (!dailyIntake) return 0
    return ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100
  }, [dailyIntake])

  const weeklyChartData = useMemo(() => {
    if (!weeklySummary || !Array.isArray(weeklySummary)) {
      return [];
    }
    return weeklySummary.map(day => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      adherence: Math.round(day.avg_adherence_pct || 0),
    }))
  }, [weeklySummary])

  const getMotivationalMessage = (progress) => {
    if (progress >= 100) return '🔥 Meta atingida! Você é lendário.'
    if (progress >= 90) return `🌟 Quase lá! Sua consistência é incrível.`
    if (progress >= 70) return `💪 Excelente! Você está no caminho certo.`
    if (progress >= 50) return `👍 Bom progresso! Continue assim.`
    return `🌅 Vamos começar! Cada passo conta.`
  }

  const toggleMeal = mealId => {
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

  const handleAddFood = async foodData => {
    await actions.addFood(foodData)
  }
  const handleUpdateFood = async (itemId, foodData) => {
    await actions.updateFood(itemId, foodData)
  }
  const handleEditClick = item => {
    setItemToEdit(item)
    setIsFoodModalOpen(true)
  }
  const handleDeleteClick = itemId => {
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
    <div className="relative min-h-screen overflow-hidden">
      <PhoenixBackground progress={calorieProgress} />
      <div className="relative z-20 w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-screen-2xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center sm:text-left"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-2">
              Nutrição
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-light">
              {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </p>
          </motion.header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* COLUNA PRINCIPAL (ESQUERDA) */}
            <div className="xl:col-span-2 space-y-8 lg:space-y-12">
              
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-2xl rounded-3xl p-8 lg:p-12"
              >
                <PhoenixTree dailyIntake={dailyIntake} />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl text-center font-medium text-foreground max-w-md mt-6 mx-auto"
                >
                  {getMotivationalMessage(calorieProgress)}
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-2xl rounded-3xl p-8 lg:p-12"
              >
                <PhoenixOracle
                  dailyIntake={dailyIntake || {}}
                  mealTotals={Array.isArray(mealTotals) ? mealTotals : []}
                  weeklySummary={Array.isArray(weeklySummary) ? weeklySummary : []}
                />
              </motion.div>

              {weeklySummary.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-lg border border-white/20 dark:border-zinc-700/50 rounded-3xl p-8 lg:p-12"
                >
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-phoenix-500" />
                    Análise Semanal
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <defs>
                          <linearGradient id="phoenix-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--phoenix-500))" />
                            <stop offset="100%" stopColor="hsl(var(--phoenix-600))" />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={[0, 100]}
                          tickFormatter={value => `${value}%`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="adherence"
                          stroke="url(#phoenix-gradient)"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--phoenix-500))', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {/* COLUNA LATERAL (DIREITA) */}
            <div className="xl:col-span-1 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-foreground">Refeições</h2>
                  <Button
                    onClick={() => setIsFoodModalOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-phoenix-500 to-phoenix-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {MEALS.map(meal => {
                    const data = Array.isArray(mealTotals) ? mealTotals.find(m => m.meal_type === meal.id) : null;
                    const items = Array.isArray(mealItems) ? mealItems.filter(item => item.meal_type === meal.id) : [];
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
                className="bg-gradient-to-br from-phoenix-100 to-phoenix-200 dark:from-phoenix-900/50 dark:to-phoenix-800/50 border border-phoenix-300/50 dark:border-phoenix-700/50 rounded-3xl p-8 text-center"
              >
                <Sparkles className="w-12 h-12 text-phoenix-600 dark:text-phoenix-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Nutricionista Phoenix
                </h3>
                <p className="text-muted-foreground mb-6">
                  Seu plano está otimizado para os melhores resultados.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={actions.recalculateGoals}
                    disabled={recalculating}
                    variant="outline"
                    className="w-full rounded-2xl border-phoenix-500 text-phoenix-600 hover:bg-phoenix-500 hover:text-white transition-all"
                  >
                    <RefreshCw
                      className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`}
                    />
                    {recalculating ? 'Recalculando...' : 'Recalcular Metas'}
                  </Button>
                  <Button
                    onClick={actions.fetchAllData}
                    variant="outline"
                    className="w-full rounded-2xl border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Atualizar Dados
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <FoodModal
        open={isFoodModalOpen}
        onOpenChange={open => {
          setIsFoodModalOpen(open)
          if (!open) setItemToEdit(null)
        }}
        onAddFood={handleAddFood}
        onUpdateFood={handleUpdateFood}
        itemToEdit={itemToEdit}
      />
    </div>
  )
}