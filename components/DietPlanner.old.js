'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Utensils,
  Coffee,
  Sun,
  Sunset,
  Cookie,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Flame,
  Loader2,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const MEALS = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, color: 'text-yellow-500' },
  { id: 'lunch', name: 'Almoço', icon: Sun, color: 'text-orange-500' },
  { id: 'dinner', name: 'Jantar', icon: Sunset, color: 'text-purple-500' },
  { id: 'snacks', name: 'Lanches', icon: Cookie, color: 'text-pink-500' },
]

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Helper functions for date/week management
const getWeekNumber = (date) => {
  const target = new Date(date)
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000)
}

const getWeekRef = (weekOffset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + weekOffset * 7)
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

const getWeekDates = (weekOffset = 0) => {
  const dates = []
  const today = new Date()
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + i + (weekOffset * 7))
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

export default function DietPlanner() {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(0)
  const [weekData, setWeekData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load week data from Supabase on mount and week change
  useEffect(() => {
    if (user) {
      loadWeekData()
    }
  }, [user, currentWeek])

  const loadWeekData = async () => {
    setLoading(true)
    try {
      const weekDates = getWeekDates(currentWeek)
      
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('date', weekDates)

      if (error) throw error

      // Transform data to grid format
      const gridData = {}
      weekDates.forEach((date, dayIndex) => {
        gridData[dayIndex] = {}
        MEALS.forEach(meal => {
          const log = data?.find(l => l.date === date && l.meal_type === meal.id)
          gridData[dayIndex][meal.id] = log?.adherence_bool || false
        })
      })

      setWeekData(gridData)
    } catch (error) {
      console.error('Error loading week data:', error)
      toast.error('Erro ao carregar dados da semana')
    } finally {
      setLoading(false)
    }
  }

  // Toggle meal adherence with automatic save
  const toggleMeal = async (dayIndex, mealId) => {
    const weekDates = getWeekDates(currentWeek)
    const date = weekDates[dayIndex]
    const newValue = !weekData[dayIndex][mealId]

    // Optimistic update
    setWeekData(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [mealId]: newValue
      }
    }))

    try {
      const { error } = await supabase
        .from('meal_logs')
        .upsert({
          user_id: user.id,
          date: date,
          meal_type: mealId,
          adherence_bool: newValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date,meal_type'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error toggling meal:', error)
      toast.error('Erro ao salvar alteração')
      
      // Revert on error
      setWeekData(prev => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          [mealId]: !newValue
        }
      }))
    }
  }

  // Mark all meals as conform for the week
  const markAllConform = async () => {
    setSaving(true)
    try {
      const weekDates = getWeekDates(currentWeek)
      const logsToInsert = []

      weekDates.forEach((date, dayIndex) => {
        MEALS.forEach(meal => {
          logsToInsert.push({
            user_id: user.id,
            date: date,
            meal_type: meal.id,
            adherence_bool: true,
            updated_at: new Date().toISOString()
          })
        })
      })

      const { error } = await supabase
        .from('meal_logs')
        .upsert(logsToInsert, {
          onConflict: 'user_id,date,meal_type'
        })

      if (error) throw error

      await loadWeekData()
      toast.success('Semana marcada como conforme! 🔥')
    } catch (error) {
      console.error('Error marking all conform:', error)
      toast.error('Erro ao marcar semana')
    } finally {
      setSaving(false)
    }
  }

  // Clear all meals for the week
  const clearWeek = async () => {
    setSaving(true)
    try {
      const weekDates = getWeekDates(currentWeek)
      const logsToInsert = []

      weekDates.forEach((date, dayIndex) => {
        MEALS.forEach(meal => {
          logsToInsert.push({
            user_id: user.id,
            date: date,
            meal_type: meal.id,
            adherence_bool: false,
            updated_at: new Date().toISOString()
          })
        })
      })

      const { error } = await supabase
        .from('meal_logs')
        .upsert(logsToInsert, {
          onConflict: 'user_id,date,meal_type'
        })

      if (error) throw error

      await loadWeekData()
      toast.success('Semana limpa')
    } catch (error) {
      console.error('Error clearing week:', error)
      toast.error('Erro ao limpar semana')
    } finally {
      setSaving(false)
    }
  }

  // Calculate adherence percentage
  const calculateAdherence = () => {
    let totalMeals = 0
    let conformMeals = 0
    
    Object.values(weekData).forEach(day => {
      Object.values(day).forEach(isConform => {
        totalMeals++
        if (isConform) conformMeals++
      })
    })
    
    return totalMeals > 0 ? Math.round((conformMeals / totalMeals) * 100) : 0
  }

  const adherencePercent = calculateAdherence()

  const getAdherenceColor = () => {
    if (adherencePercent >= 90) return 'text-phoenix-amber'
    if (adherencePercent >= 75) return 'text-green-500'
    if (adherencePercent >= 60) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getAdherenceMessage = () => {
    if (adherencePercent >= 90) return 'Excelente! Continue assim! 🔥'
    if (adherencePercent >= 75) return 'Muito bem! Está no caminho certo 💪'
    if (adherencePercent >= 60) return 'Bom trabalho! Pode melhorar 👍'
    return 'Vamos focar na consistência! 🎯'
  }

  // Data for progress ring chart
  const chartData = [
    { name: 'Conforme', value: adherencePercent },
    { name: 'Pendente', value: 100 - adherencePercent },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-phoenix-amber animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="glass-card border-phoenix-amber/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-6 h-6 text-phoenix-amber" />
                Planejamento Alimentar
              </CardTitle>
              <CardDescription>Sua semana de nutrição</CardDescription>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentWeek(currentWeek - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                {currentWeek === 0 ? 'Esta Semana' : `Semana ${currentWeek > 0 ? '+' : ''}${currentWeek}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentWeek(currentWeek + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#FFB300" />
                    <Cell fill="rgba(255, 179, 0, 0.1)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getAdherenceColor()}`}>
                  {adherencePercent}%
                </span>
                <span className="text-xs text-muted-foreground">aderência</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Refeições Conformes</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(28 * (adherencePercent / 100))}/28
                  </span>
                </div>
                <Progress value={adherencePercent} className="h-2" />
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium">{getAdherenceMessage()}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {Math.round(28 * (adherencePercent / 100))}
                  </div>
                  <div className="text-xs text-muted-foreground">Conformes</div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {28 - Math.round(28 * (adherencePercent / 100))}
                  </div>
                  <div className="text-xs text-muted-foreground">Fora do plano</div>
                </div>
                <div className="p-2 rounded-lg bg-phoenix-amber/10">
                  <div className="text-lg font-bold text-phoenix-gold">
                    {adherencePercent >= 80 ? '🔥' : '💪'}
                  </div>
                  <div className="text-xs text-muted-foreground">Status</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5" />
            Grade Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header Row with Days */}
              <div className="grid grid-cols-8 gap-3 mb-3">
                <div className="text-sm font-medium text-muted-foreground"></div>
                {DAYS.map((day, idx) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold"
                  >
                    <div className={idx === new Date().getDay() - 1 ? 'text-phoenix-amber' : ''}>
                      {day}
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal Rows */}
              {MEALS.map((meal, mealIndex) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mealIndex * 0.1 }}
                  className="grid grid-cols-8 gap-3 mb-3"
                >
                  {/* Meal Label */}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <meal.icon className={`w-4 h-4 ${meal.color}`} />
                    <span className="hidden sm:inline">{meal.name}</span>
                  </div>

                  {/* Day Cells */}
                  {DAYS.map((_, dayIndex) => (
                    <MealCard
                      key={`${meal.id}-${dayIndex}`}
                      isConform={weekData[dayIndex][meal.id]}
                      onToggle={() => toggleMeal(dayIndex, meal.id)}
                      mealIcon={meal.icon}
                      mealColor={meal.color}
                    />
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={markAllConform}
              disabled={saving}
            >
              <Check className="w-5 h-5 mb-2 text-green-500" />
              <span className="font-semibold text-sm">Marcar Tudo Conforme</span>
              <span className="text-xs text-muted-foreground">
                Todas as refeições desta semana
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={clearWeek}
              disabled={saving}
            >
              <X className="w-5 h-5 mb-2 text-orange-500" />
              <span className="font-semibold text-sm">Limpar Semana</span>
              <span className="text-xs text-muted-foreground">
                Resetar todas as refeições
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="glass-card border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <TrendingUp className="w-12 h-12 text-phoenix-amber/50 mx-auto" />
            <h3 className="font-semibold text-sm">Em Breve</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Planejamento de refeições, contador de calorias, macros, receitas personalizadas e muito mais!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Meal Card Component
function MealCard({ isConform, onToggle, mealIcon: Icon, mealColor }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`
        relative h-20 rounded-lg backdrop-blur-md border-2 transition-all
        ${isConform 
          ? 'bg-green-500/20 border-green-500/40 shadow-lg shadow-green-500/10' 
          : 'bg-red-500/10 border-red-500/20'
        }
        hover:scale-105 active:scale-95
      `}
    >
      {/* Status Icon */}
      <div className="absolute top-2 right-2">
        {isConform ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Meal Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <Icon className={`w-8 h-8 ${mealColor}`} />
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-phoenix-amber/0 to-phoenix-gold/0 hover:from-phoenix-amber/10 hover:to-phoenix-gold/10 transition-all" />
    </motion.button>
  )
}
