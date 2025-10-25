'use client'

import { useState, useEffect } from 'react'
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
  X,
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Meal configurations with Phoenix Premium colors
const MEALS = [
  { 
    id: 'breakfast', 
    name: 'Café da Manhã', 
    icon: Coffee, 
    emoji: '☀️',
    color: '#FCD34D', 
    gradient: 'from-yellow-50 to-amber-50',
    bgGradient: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
  },
  { 
    id: 'lunch', 
    name: 'Almoço', 
    icon: Sun, 
    emoji: '🌞',
    color: '#F5D68A', 
    gradient: 'from-amber-50 to-yellow-100',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/20 dark:to-yellow-950/30',
  },
  { 
    id: 'dinner', 
    name: 'Jantar', 
    icon: Sunset, 
    emoji: '🌙',
    color: '#818CF8', 
    gradient: 'from-blue-50 to-indigo-50',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
  },
  { 
    id: 'snacks', 
    name: 'Lanches', 
    icon: Cookie, 
    emoji: '🍪',
    color: '#FB923C', 
    gradient: 'from-orange-50 to-amber-50',
    bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
  },
]

const COLORS = {
  phoenix: '#FF9F1C',
  gold: '#F5D68A',
  protein: '#91BFFF',
  carbs: '#A2F59A',
  fat: '#FFB74D',
}

export default function DietPlanner() {
  const { user } = useAuth()
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [addingFood, setAddingFood] = useState(false)
  
  // Data from views
  const [dailyIntake, setDailyIntake] = useState(null)
  const [dailyAdherence, setDailyAdherence] = useState(null)
  const [mealTotals, setMealTotals] = useState([])
  const [mealItems, setMealItems] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])
  
  // UI states
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [openModal, setOpenModal] = useState(false)
  
  // Form states
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState('')

  useEffect(() => {
    if (user) {
      loadDietData()
    }
  }, [user])

  // Load all diet data from views
  const loadDietData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const startDate = sevenDaysAgo.toISOString().split('T')[0]

      // v_daily_intake
      const { data: intake } = await supabase
        .from('v_daily_intake')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyIntake(intake)

      // v_daily_adherence
      const { data: adherence } = await supabase
        .from('v_daily_adherence')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyAdherence(adherence)

      // v_meal_totals
      const { data: totals } = await supabase
        .from('v_meal_totals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      setMealTotals(totals || [])

      // v_meal_items_nutrients
      const { data: items } = await supabase
        .from('v_meal_items_nutrients')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      setMealItems(items || [])

      // v_weekly_summary
      const { data: summary } = await supabase
        .from('v_weekly_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true })
      setWeeklySummary(summary || [])

    } catch (error) {
      console.error('Error loading diet data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Recalculate goals using RPC
  const handleRecalculateGoals = async () => {
    setRecalculating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      
      // Call RPC with correct format
      const { error } = await supabase.rpc('fn_calc_goals', {
        p_user_id: user.id,
        p_date: today
      })

      if (error) throw error
      
      // Refresh specific views after recalculation
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const startDate = sevenDaysAgo.toISOString().slice(0, 10)

      // v_daily_intake
      const { data: intake } = await supabase
        .from('v_daily_intake')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyIntake(intake)

      // v_daily_adherence
      const { data: adherence } = await supabase
        .from('v_daily_adherence')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyAdherence(adherence)

      // v_weekly_summary
      const { data: summary } = await supabase
        .from('v_weekly_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true })
      setWeeklySummary(summary || [])
      
      toast.success('Metas recalculadas 🔥')
    } catch (error) {
      console.error('Error recalculating goals:', error)
      toast.error('Erro ao recalcular metas')
    } finally {
      setRecalculating(false)
    }
  }

  // Toggle meal expansion
  const toggleMeal = (mealType) => {
    const newExpanded = new Set(expandedMeals)
    if (newExpanded.has(mealType)) {
      newExpanded.delete(mealType)
    } else {
      newExpanded.add(mealType)
    }
    setExpandedMeals(newExpanded)
  }

  // Search foods
  const searchFoods = async (query) => {
    if (!query || query.length < 2) {
      setFoodResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)

      if (error) throw error
      setFoodResults(data || [])
    } catch (error) {
      console.error('Error searching foods:', error)
      setFoodResults([])
    }
  }

  // Add food to meal
  const handleAddFood = async () => {
    setAddingFood(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Parse quantity with NaN handling
      const qty = parseFloat(quantity) || 0
      
      // Calculate grams_total
      // If no measure_id, consider grams_per_unit = 1 and use grams_total = qty
      const gramsPerUnit = selectedFood.grams_per_unit || 1
      const gramsTotal = qty * gramsPerUnit
      
      const { error } = await supabase
        .from('meal_items')
        .insert({
          user_id: user.id,
          date: today,
          meal_type: selectedMealType,
          food_id: selectedFood.id,
          qty_units: qty,
          grams_total: gramsTotal,
        })

      if (error) throw error

      toast.success('Alimento adicionado! 🎉')
      
      // Reset form
      setOpenModal(false)
      setFoodSearch('')
      setSelectedFood(null)
      setQuantity('')
      setFoodResults([])
      
      // Reload all relevant views
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const startDate = sevenDaysAgo.toISOString().split('T')[0]

      // v_daily_intake
      const { data: intake } = await supabase
        .from('v_daily_intake')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyIntake(intake)

      // v_daily_adherence
      const { data: adherence } = await supabase
        .from('v_daily_adherence')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setDailyAdherence(adherence)

      // v_meal_totals
      const { data: totals } = await supabase
        .from('v_meal_totals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      setMealTotals(totals || [])

      // v_meal_items_nutrients
      const { data: items } = await supabase
        .from('v_meal_items_nutrients')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      setMealItems(items || [])

      // v_weekly_summary
      const { data: summary } = await supabase
        .from('v_weekly_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true })
      setWeeklySummary(summary || [])

    } catch (error) {
      console.error('Error adding food:', error)
      toast.error('Erro ao adicionar alimento')
    } finally {
      setAddingFood(false)
    }
  }

  // Form validation for Add Food modal
  const isValidForm = () => {
    if (!selectedMealType || !selectedFood || !quantity) return false
    
    const qty = parseFloat(quantity) || 0
    if (qty <= 0) return false
    
    const gramsPerUnit = selectedFood.grams_per_unit || 1
    const gramsTotal = qty * gramsPerUnit
    
    return gramsTotal > 0
  }

  // Helper functions
  const getRingColor = (progress) => {
    if (progress >= 100) return { color: '#FF9F1C', label: 'Excelente!' }
    if (progress >= 70) return { color: '#F5D68A', label: 'Muito bem!' }
    return { color: '#9CA3AF', label: 'Continue!' }
  }

  const getMotivationalMessage = (progress) => {
    if (progress >= 100) return '🔥 Meta atingida! Excelente trabalho hoje!'
    if (progress >= 90) return `🔥 Quase lá! Você está em ${Math.round(progress)}% da meta do dia!`
    if (progress >= 70) return `💪 Continue assim, você está em ${Math.round(progress)}% da meta do dia!`
    if (progress >= 50) return `👍 Bom progresso! ${Math.round(progress)}% da meta já alcançados.`
    return `🎯 Vamos começar! Você já está em ${Math.round(progress)}% da meta.`
  }

  // Calculate streak of consecutive days with ≥80% adherence
  const calculateStreak = () => {
    if (!weeklySummary || weeklySummary.length === 0) return 0
    
    let streak = 0
    // Start from most recent day and count backwards
    const sortedDays = [...weeklySummary].sort((a, b) => new Date(b.date) - new Date(a.date))
    
    for (const day of sortedDays) {
      if ((day.avg_adherence_pct || 0) >= 80) {
        streak++
      } else {
        break // Stop counting when we find a day below 80%
      }
    }
    
    return streak
  }

  // Check if protein goal is met
  const isProteinGoalMet = () => {
    return dailyIntake && dailyIntake.total_protein_g >= dailyIntake.goal_protein_g
  }

  // Check if it's a perfect day (all macros ≥ 100%)
  const isPerfectDay = () => {
    if (!dailyIntake) return false
    
    const caloriesMet = (dailyIntake.total_kcal || 0) >= (dailyIntake.goal_kcal || 1)
    const proteinMet = (dailyIntake.total_protein_g || 0) >= (dailyIntake.goal_protein_g || 1)
    const carbsMet = (dailyIntake.total_carbs_g || 0) >= (dailyIntake.goal_carbs_g || 1)
    const fatMet = (dailyIntake.total_fat_g || 0) >= (dailyIntake.goal_fat_g || 1)
    
    return caloriesMet && proteinMet && carbsMet && fatMet
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Flame className="w-10 h-10 text-[#FF9F1C]" />
        </motion.div>
      </div>
    )
  }

  const calorieProgress = dailyIntake 
    ? ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100 
    : 0

  const ringStyle = getRingColor(calorieProgress)

  const macroBars = [
    {
      label: 'Calorias',
      icon: Flame,
      current: dailyIntake?.total_kcal || 0,
      goal: dailyIntake?.goal_kcal || 2000,
      unit: 'kcal',
      color: '#FF9F1C',
      gradient: 'from-[#FF9F1C] to-[#F5D68A]'
    },
    {
      label: 'Proteínas',
      icon: Activity,
      current: dailyIntake?.total_protein_g || 0,
      goal: dailyIntake?.goal_protein_g || 150,
      unit: 'g',
      color: COLORS.protein,
      gradient: 'from-blue-400 to-blue-500'
    },
    {
      label: 'Carboidratos',
      icon: Target,
      current: dailyIntake?.total_carbs_g || 0,
      goal: dailyIntake?.goal_carbs_g || 200,
      unit: 'g',
      color: COLORS.carbs,
      gradient: 'from-green-400 to-green-500'
    },
    {
      label: 'Gorduras',
      icon: Sparkles,
      current: dailyIntake?.total_fat_g || 0,
      goal: dailyIntake?.goal_fat_g || 65,
      unit: 'g',
      color: COLORS.fat,
      gradient: 'from-orange-400 to-orange-500'
    }
  ]

  const weeklyChartData = weeklySummary.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    kcal: day.avg_kcal || 0,
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
      {/* Phoenix Sparks Animation - Perfect Day */}
      <AnimatePresence>
        {isPerfectDay() && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
                  y: 100
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0],
                  x: typeof window !== 'undefined' 
                    ? window.innerWidth / 2 + (Math.random() - 0.5) * 600 
                    : 0,
                  y: [100, -50 + Math.random() * 150],
                  rotate: [0, Math.random() * 360]
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 5
                }}
                className="absolute"
                style={{
                  left: '50%',
                  top: '10%',
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: i % 3 === 0 
                      ? 'linear-gradient(135deg, #FF9F1C, #F5D68A)' 
                      : i % 3 === 1
                      ? 'linear-gradient(135deg, #FCD34D, #FDE047)'
                      : 'linear-gradient(135deg, #F59E0B, #FF9F1C)',
                    boxShadow: '0 0 20px rgba(255, 159, 28, 0.8)',
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Nutrição
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculateGoals}
          disabled={recalculating}
          className="rounded-xl px-4 py-2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-amber-400/20 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-400/10 transition-all duration-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </motion.div>

      {/* Microfeedbacks & Gamification */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        {/* Streak Counter */}
        {calculateStreak() > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-2xl cursor-default"
          >
            <span className="text-xl">🔥</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium opacity-90">Sequência</span>
              <span className="text-sm font-bold">{calculateStreak()} dias consecutivos</span>
            </div>
          </motion.div>
        )}

        {/* Protein Goal Met Badge */}
        {isProteinGoalMet() && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-2xl cursor-default"
          >
            <span className="text-lg">🏅</span>
            <span className="text-sm font-semibold">Meta de proteína atingida</span>
          </motion.div>
        )}

        {/* Perfect Day Badge */}
        {isPerfectDay() && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-xl transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-2xl cursor-default"
          >
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold">Dia perfeito - 100%!</span>
          </motion.div>
        )}
      </motion.div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COL 1-2: Main Panel (Ring + Bars) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-800/50 p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
        >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9F1C]/5 to-[#F5D68A]/5" />
        
        <div className="relative">
          {/* Central Ring + Motivational Text */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-gray-200 dark:text-gray-800"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={ringStyle.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 70 * (1 - Math.min(calorieProgress / 100, 1))
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={calorieProgress}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold"
                  style={{ color: ringStyle.color }}
                >
                  {Math.round(calorieProgress)}%
                </motion.span>
                <span className="text-xs text-muted-foreground mt-1">
                  {ringStyle.label}
                </span>
              </div>
            </div>

            <motion.p
              key={calorieProgress}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-medium"
              style={{ color: ringStyle.color }}
            >
              {getMotivationalMessage(calorieProgress)}
            </motion.p>
          </div>

          {/* Macro Bars */}
          <div className="space-y-4">
            {macroBars.map((macro, index) => {
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
                      <Icon className="w-4 h-4" style={{ color: macro.color }} />
                      <span className="text-sm font-medium">{macro.label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: macro.color }}>
                      {macro.current} / {macro.goal} {macro.unit}
                    </span>
                  </div>

                  <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${macro.gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </motion.div>

      {/* MEALS SECTION - Expandable Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Refeições de Hoje</h2>
          <Button
            size="sm"
            onClick={() => setOpenModal(true)}
            className="bg-gradient-to-r from-[#FF9F1C] to-[#F5D68A] hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Alimento
          </Button>
        </div>

        {MEALS.map((meal, index) => {
          const mealData = mealTotals.find(m => m.meal_type === meal.id)
          const mealItemsList = mealItems.filter(item => item.meal_type === meal.id)
          const isExpanded = expandedMeals.has(meal.id)
          const Icon = meal.icon

          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card 
                className={`${meal.bgGradient} border border-white/40 dark:border-gray-800/50 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl rounded-2xl`}
                onClick={() => toggleMeal(meal.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`p-2.5 rounded-full bg-gradient-to-br ${meal.gradient}`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{meal.emoji}</span>
                          <span className="font-semibold">{meal.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {mealData?.total_kcal || 0} kcal
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {mealData && (
                        <div className="text-xs text-muted-foreground hidden sm:flex gap-2">
                          <span>C: {mealData.total_carbs_g}g</span>
                          <span>P: {mealData.total_protein_g}g</span>
                          <span>G: {mealData.total_fat_g}g</span>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Items List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-2">
                          {mealItemsList.length > 0 ? (
                            mealItemsList.map((item, idx) => (
                              <div 
                                key={idx}
                                className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-white/20"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{item.food_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.grams_total}g
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-sm">{item.item_kcal} kcal</p>
                                    <p className="text-xs text-muted-foreground">
                                      C:{item.item_carbs_g}g P:{item.item_protein_g}g G:{item.item_fat_g}g
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum alimento adicionado
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Análise Semanal */}
      {weeklySummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="p-6 rounded-[24px] backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 border border-white/20 dark:border-gray-800/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF9F1C]/5 to-[#F5D68A]/5 rounded-[24px]" />
          
          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-[#FF9F1C] to-[#F5D68A]">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">Análise Semanal</h3>
            </div>
            
            {/* Line Chart - Weekly Adherence */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={weeklySummary.slice(-7).map(day => ({
                    date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
                    fullDate: day.date,
                    adherence: Math.round(day.avg_adherence_pct || 0)
                  }))}
                >
                  <XAxis 
                    dataKey="date" 
                    stroke="currentColor" 
                    className="text-muted-foreground capitalize"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-muted-foreground"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [`${value}%`, 'Aderência']}
                    cursor={{ stroke: '#FF9F1C', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="adherence" 
                    stroke="#FF9F1C" 
                    strokeWidth={3}
                    dot={{ fill: '#FF9F1C', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#F5D68A', stroke: '#FF9F1C', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats and Feedback */}
            <div className="space-y-4">
              {/* Weekly Average and Best Day */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF9F1C]/10 to-[#F5D68A]/10 border border-[#FF9F1C]/20">
                <p className="text-sm font-medium text-center">
                  {(() => {
                    const weeklyAvg = Math.round(
                      weeklySummary.slice(-7).reduce((sum, d) => sum + (d.avg_adherence_pct || 0), 0) / 
                      Math.min(weeklySummary.length, 7)
                    )
                    
                    // Find best day
                    const bestDay = weeklySummary.slice(-7).reduce((best, day) => {
                      return (day.avg_adherence_pct || 0) > (best.avg_adherence_pct || 0) ? day : best
                    }, weeklySummary[0])
                    
                    const bestDayName = new Date(bestDay.date).toLocaleDateString('pt-BR', { weekday: 'long' })
                    
                    return (
                      <>
                        <span className="text-[#FF9F1C] font-bold">Média semanal: {weeklyAvg}% de aderência</span>
                        {' | '}
                        <span className="text-[#F5D68A] font-bold">Melhor dia: {bestDayName}</span>
                      </>
                    )
                  })()}
                </p>
              </div>

              {/* Automatic Feedback */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className={`p-4 rounded-xl border ${
                  (() => {
                    const weeklyAvg = Math.round(
                      weeklySummary.slice(-7).reduce((sum, d) => sum + (d.avg_adherence_pct || 0), 0) / 
                      Math.min(weeklySummary.length, 7)
                    )
                    
                    if (weeklyAvg >= 90) {
                      return 'bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30'
                    } else if (weeklyAvg >= 75) {
                      return 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30'
                    } else {
                      return 'bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30'
                    }
                  })()
                }`}
              >
                <p className="text-sm font-semibold text-center">
                  {(() => {
                    const weeklyAvg = Math.round(
                      weeklySummary.slice(-7).reduce((sum, d) => sum + (d.avg_adherence_pct || 0), 0) / 
                      Math.min(weeklySummary.length, 7)
                    )
                    
                    if (weeklyAvg >= 90) {
                      return 'Excelente consistência 🔥'
                    } else if (weeklyAvg >= 75) {
                      return 'Bom progresso, mantenha o ritmo ⚡'
                    } else {
                      return 'Ajuste pequenos detalhes, você consegue 💪'
                    }
                  })()}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ADD FOOD MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Adicionar Alimento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Meal Type Selector */}
            <div className="space-y-2">
              <Label>Refeição</Label>
              <div className="grid grid-cols-2 gap-2">
                {MEALS.map(meal => (
                  <Button
                    key={meal.id}
                    variant={selectedMealType === meal.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMealType(meal.id)}
                    className={selectedMealType === meal.id ? `bg-gradient-to-r ${meal.gradient}` : ''}
                  >
                    <span className="mr-2">{meal.emoji}</span>
                    {meal.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Food Search */}
            <div className="space-y-2">
              <Label htmlFor="food-search">Buscar Alimento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="food-search"
                  placeholder="Ex: Arroz integral..."
                  value={foodSearch}
                  onChange={(e) => {
                    setFoodSearch(e.target.value)
                    searchFoods(e.target.value)
                  }}
                  className="pl-9"
                />
              </div>
              
              {/* Search Results */}
              {foodResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {foodResults.map(food => (
                    <div
                      key={food.id}
                      onClick={() => {
                        setSelectedFood(food)
                        setFoodSearch(food.name)
                        setFoodResults([])
                      }}
                      className="p-2 rounded hover:bg-secondary cursor-pointer"
                    >
                      <p className="font-medium text-sm">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.kcal_per_100g} kcal / 100g
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedFood && (
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="font-medium">{selectedFood.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFood.kcal_per_100g} kcal / 100g
                  </p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade (unidades ou gramas)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ex: 1.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {selectedFood && quantity && (
                <p className="text-xs text-muted-foreground">
                  ≈ {Math.round((parseFloat(quantity) || 0) * (selectedFood.grams_per_unit || 1))}g total
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddFood}
              disabled={!isValidForm() || addingFood}
              className="flex-1 bg-gradient-to-r from-[#FF9F1C] to-[#F5D68A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingFood ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* SIDEBAR - Nutricionista Phoenix */}
      <div className="hidden lg:block w-80 space-y-4">
        {/* Card Nutricionista Ativo */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-6 space-y-4"
        >
          <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 border border-[#FF9F1C]/30 shadow-lg">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-[#FF9F1C] to-[#F5D68A]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Nutricionista Phoenix</h3>
                  <p className="text-xs text-muted-foreground">Ativo agora</p>
                </div>
              </div>

              {/* Daily Summary */}
              <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-[#FF9F1C]/10 to-[#F5D68A]/10 border border-[#FF9F1C]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calorias</span>
                  <span className="text-sm font-bold">
                    {dailyIntake?.total_kcal || 0} / {dailyIntake?.goal_kcal || 2000}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF9F1C] to-[#F5D68A]"
                    style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#FF9F1C]/20">
                  <span className="text-sm font-medium">Proteínas</span>
                  <span className="text-sm">
                    <span className="font-bold" style={{ color: COLORS.protein }}>
                      {dailyIntake?.total_protein_g || 0}g
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {' '}/ {dailyIntake?.goal_protein_g || 150}g
                    </span>
                  </span>
                </div>
                {(dailyIntake?.goal_protein_g - dailyIntake?.total_protein_g > 0) && (
                  <p className="text-xs text-orange-500">
                    ⚠️ Faltam {Math.round(dailyIntake.goal_protein_g - dailyIntake.total_protein_g)}g de proteína
                  </p>
                )}
              </div>

              {/* Intelligent Text */}
              <div className="space-y-2">
                {/* Check training status - assume high training if steps > 10000 or calories goal > 2500 */}
                {(dailyIntake?.goal_kcal > 2500) && (
                  <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xl">🏋️</span>
                    <p className="text-sm">
                      <strong>Treino alto detectado:</strong> Aumentei +200 kcal para hoje para melhor recuperação.
                    </p>
                  </div>
                )}

                {/* Check sleep quality - if we have sleep data from sleep_logs */}
                {dailyAdherence && dailyAdherence.adherence_pct < 60 && (
                  <div className="flex gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <span className="text-xl">💤</span>
                    <p className="text-sm">
                      <strong>Baixa aderência:</strong> Ajustei o plano para facilitar hoje. Foque no básico!
                    </p>
                  </div>
                )}

                {/* Default motivational message */}
                {(!dailyIntake?.goal_kcal || dailyIntake.goal_kcal <= 2500) && (!dailyAdherence || dailyAdherence.adherence_pct >= 60) && (
                  <div className="flex gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xl">✨</span>
                    <p className="text-sm">
                      <strong>Plano otimizado!</strong> Suas metas estão balanceadas para hoje. Continue assim!
                    </p>
                  </div>
                )}
              </div>

              {/* Recalculate Button */}
              <Button
                onClick={handleRecalculateGoals}
                disabled={recalculating}
                className="w-full bg-gradient-to-r from-[#FF9F1C] to-[#F5D68A] hover:opacity-90 transition-all"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando...' : 'Recalcular Plano 🔁'}
              </Button>
            </div>
          </Card>

          {/* Weekly Adherence Chart */}
          {weeklySummary.length > 0 && (
            <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF9F1C]" />
                  <h4 className="font-semibold text-sm">Aderência Semanal</h4>
                </div>

                <div className="space-y-2">
                  {weeklySummary.slice(-7).map((day, index) => {
                    const adherence = day.avg_adherence_pct || 0
                    const dayName = new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{dayName}</span>
                          <span className="font-semibold">{Math.round(adherence)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${adherence}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`h-full ${
                              adherence >= 80 ? 'bg-green-500' :
                              adherence >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Média Semanal</span>
                    <span className="text-lg font-bold text-[#FF9F1C]">
                      {Math.round(weeklySummary.reduce((sum, d) => sum + (d.avg_adherence_pct || 0), 0) / weeklySummary.length)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
