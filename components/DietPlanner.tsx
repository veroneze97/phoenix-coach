'use client'

/**
 * DietPlanner — Phoenix Coach (UI/UX Premium)
 * - Donut de Progresso (kcal) + análise semanal (Recharts)
 * - Layout 2 colunas (desktop) / 1 coluna (mobile)
 * - Optimistic UI total (add/update/delete) + rollback
 * - Realtime Supabase + refetch coerente
 */

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// shadcn/ui
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// UX
import { toast } from 'sonner'

// Ícones / Charts
import {
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
  Flame,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// (opcional) se você já usa esse componente, mantenha; senão, pode remover a import abaixo.
import PhoenixOracle from './PhoenixOracle'

// ------------------------------------
// Tipos
// ------------------------------------
type UUID = string

interface DailyIntake {
  total_kcal?: number
  goal_kcal?: number
  total_carbs_g?: number
  goal_carbs_g?: number
  total_protein_g?: number
  goal_protein_g?: number
  total_fat_g?: number
  goal_fat_g?: number
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface MealTotal {
  meal_type: MealType
  total_kcal?: number
  total_carbs_g?: number
  total_protein_g?: number
  total_fat_g?: number
}

interface MealItem {
  id: UUID
  meal_type: MealType
  food_id: UUID
  food_name: string
  grams_per_unit?: number
  quantity_grams?: number
  grams_total?: number
  item_kcal?: number
  __optimistic__?: boolean
}

interface WeeklyPoint {
  date: string
  avg_adherence_pct?: number
}

interface MealConfig {
  id: MealType
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  emoji: string
  gradient: string
}

type SelectedFood = {
  id: UUID
  name: string
  grams_per_unit?: number
  kcal_per_100g?: number
  carbs_g_per_100g?: number
  protein_g_per_100g?: number
  fat_g_per_100g?: number
}

// ------------------------------------
// Design Tokens (sem depender de cores customizadas)
// ------------------------------------
const TOKENS = {
  radius: { lg: 'rounded-2xl', xl: 'rounded-3xl' },
  shadow: { soft: 'shadow-lg', deep: 'shadow-2xl' },
  blur: 'backdrop-blur-xl',
  border: 'border border-white/15 dark:border-zinc-700/40',
  surface: 'bg-white/70 dark:bg-zinc-900/60',
  textMuted: 'text-muted-foreground',
  gradientAction: 'bg-gradient-to-r from-amber-500 to-orange-600',
}
const cardBase = `${TOKENS.surface} ${TOKENS.blur} ${TOKENS.border} ${TOKENS.shadow.deep} ${TOKENS.radius.xl}`

const MEALS: MealConfig[] = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, emoji: '☀️', gradient: 'from-yellow-400 to-amber-400' },
  { id: 'lunch',     name: 'Almoço',         icon: Sun,    emoji: '🌞', gradient: 'from-amber-400 to-orange-400' },
  { id: 'dinner',    name: 'Jantar',         icon: Sunset, emoji: '🌙', gradient: 'from-indigo-400 to-blue-400' },
  { id: 'snacks',    name: 'Lanches',        icon: Cookie, emoji: '🍪', gradient: 'from-orange-400 to-red-400' },
]

// ------------------------------------
// Helpers nutricionais
// ------------------------------------
function num(n?: number) { return Number.isFinite(n) ? (n as number) : 0 }
function gramsFromUnits(units: number, gramsPerUnit?: number) {
  const gpu = gramsPerUnit && gramsPerUnit > 0 ? gramsPerUnit : 1
  return units * gpu
}

function computeDeltaFromFood(food: SelectedFood, gramsTotal: number) {
  const factor = gramsTotal / 100
  return {
    kcal: num(food.kcal_per_100g) * factor,
    carbs: num(food.carbs_g_per_100g) * factor,
    protein: num(food.protein_g_per_100g) * factor,
    fat: num(food.fat_g_per_100g) * factor,
  }
}

function applyDailyDelta(d: DailyIntake | null, delta: { kcal: number; carbs: number; protein: number; fat: number }) {
  const base: DailyIntake = d ? { ...d } : {}
  base.total_kcal = num(base.total_kcal) + delta.kcal
  base.total_carbs_g = num(base.total_carbs_g) + delta.carbs
  base.total_protein_g = num(base.total_protein_g) + delta.protein
  base.total_fat_g = num(base.total_fat_g) + delta.fat
  return base
}

function applyMealDelta(totals: MealTotal[], mealType: MealType, delta: { kcal: number; carbs: number; protein: number; fat: number }) {
  const arr = [...totals]
  const idx = arr.findIndex(t => t.meal_type === mealType)
  if (idx === -1) {
    arr.push({
      meal_type: mealType,
      total_kcal: delta.kcal,
      total_carbs_g: delta.carbs,
      total_protein_g: delta.protein,
      total_fat_g: delta.fat,
    })
  } else {
    const t = { ...arr[idx] }
    t.total_kcal = num(t.total_kcal) + delta.kcal
    t.total_carbs_g = num(t.total_carbs_g) + delta.carbs
    t.total_protein_g = num(t.total_protein_g) + delta.protein
    t.total_fat_g = num(t.total_fat_g) + delta.fat
    arr[idx] = t
  }
  return arr
}

// ------------------------------------
// Debounce
// ------------------------------------
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// ------------------------------------
// Hook de dados (com Optimistic UI total)
// ------------------------------------
const useDietData = (userId?: UUID) => {
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [dailyIntake, setDailyIntake] = useState<DailyIntake | null>(null)
  const [dailyAdherence, setDailyAdherence] = useState<any>(null)
  const [mealTotals, setMealTotals] = useState<MealTotal[]>([])
  const [mealItems, setMealItems] = useState<MealItem[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklyPoint[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const safeSetState = <T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value)
  }

  const fetchAllData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
        const { data } = intakeResult.value as { data: DailyIntake | null }
        safeSetState(setDailyIntake, data ?? null)
      }
      if (adherenceResult.status === 'fulfilled') {
        const { data } = adherenceResult.value as { data: any | null }
        safeSetState(setDailyAdherence, data ?? null)
      }
      if (totalsResult.status === 'fulfilled') {
        const { data } = totalsResult.value as { data: MealTotal[] | null }
        safeSetState(setMealTotals, Array.isArray(data) ? data : [])
      }
      if (itemsResult.status === 'fulfilled') {
        const { data } = itemsResult.value as { data: MealItem[] | null }
        safeSetState(setMealItems, Array.isArray(data) ? data : [])
      }
      if (summaryResult.status === 'fulfilled') {
        const { data } = summaryResult.value as { data: WeeklyPoint[] | null }
        safeSetState(setWeeklySummary, Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados da dieta:', error)
      toast.error('Erro ao carregar dados da dieta.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // Realtime
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('meal_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_items', filter: `user_id=eq.${userId}` },
        async () => {
          await new Promise(r => setTimeout(r, 150))
          fetchAllData()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchAllData])

  const recalculateGoals = useCallback(async () => {
    setRecalculating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase.rpc('fn_calc_goals', { p_user_id: userId, p_date: today })
      if (error) {
        if (error.message?.includes('does not exist')) toast.error('Função de recálculo não encontrada.')
        else throw error
      } else {
        toast.success('Metas recalculadas! 🔥')
        await new Promise(r => setTimeout(r, 250))
        await fetchAllData()
      }
    } catch (error) {
      console.error('Erro ao recalcular metas:', error)
      toast.error('Erro ao recalcular metas.')
    } finally {
      setRecalculating(false)
    }
  }, [userId, fetchAllData])

  // Optimistic CRUD --------------------------------
  const addFood = useCallback(async (foodData: {
    selectedMealType: MealType
    selectedFood: SelectedFood
    quantity: number // unidades
  }) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }

      const today = new Date().toISOString().split('T')[0]
      const qtyUnits = parseFloat(String(foodData.quantity)) || 0
      const gramsTotal = gramsFromUnits(qtyUnits, foodData.selectedFood.grams_per_unit || 1)
      const delta = computeDeltaFromFood(foodData.selectedFood, gramsTotal)

      // snapshots
      const sItems = [...mealItems]
      const sTotals = [...mealTotals]
      const sDaily = dailyIntake ? { ...dailyIntake } : null

      // 1) optimistic item
      const tempId = (`temp-${Date.now()}`) as UUID
      const optimisticItem: MealItem = {
        id: tempId,
        meal_type: foodData.selectedMealType,
        food_id: foodData.selectedFood.id,
        food_name: foodData.selectedFood.name,
        grams_per_unit: foodData.selectedFood.grams_per_unit,
        quantity_grams: gramsTotal,
        grams_total: gramsTotal,
        item_kcal: Math.round(delta.kcal) || undefined,
        __optimistic__: true,
      }
      setMealItems(prev => [...prev, optimisticItem])

      // 2) optimistic totals
      setMealTotals(prev => applyMealDelta(prev, foodData.selectedMealType, delta))
      setDailyIntake(prev => applyDailyDelta(prev, delta))

      // 3) server
      const { data, error } = await supabase.from('meal_items').insert({
        user_id: userId,
        date: today,
        meal_type: foodData.selectedMealType,
        food_id: foodData.selectedFood.id,
        quantity_grams: gramsTotal,
        grams_total: gramsTotal,
      }).select('id').single()

      if (error) throw error

      // 4) replace temp id
      if (data?.id) {
        setMealItems(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id, __optimistic__: false } : i))
      }

      toast.success('Alimento adicionado! 🎉')
      await new Promise(r => setTimeout(r, 120))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao adicionar alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao adicionar alimento.')
      // rollback
      setMealItems(mealItems)
      setMealTotals(mealTotals)
      setDailyIntake(dailyIntake)
    }
  }, [userId, mealItems, mealTotals, dailyIntake, fetchAllData])

  const updateFood = useCallback(async (
    itemId: UUID,
    foodData: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }
  ) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }

      // snapshots
      const sItems = [...mealItems]
      const sTotals = [...mealTotals]
      const sDaily = dailyIntake ? { ...dailyIntake } : null

      const current = mealItems.find(i => i.id === itemId)
      if (!current) throw new Error('Item não encontrado.')

      // delta antigo (pseudomacros = 0 se desconhecido)
      const oldGrams = num(current.quantity_grams ?? current.grams_total)
      const oldFood: SelectedFood = {
        id: current.food_id,
        name: current.food_name,
        grams_per_unit: current.grams_per_unit ?? 100,
        kcal_per_100g: 0, carbs_g_per_100g: 0, protein_g_per_100g: 0, fat_g_per_100g: 0,
      }
      const oldDelta = computeDeltaFromFood(oldFood, oldGrams)

      // novo delta
      const qtyUnits = parseFloat(String(foodData.quantity)) || 0
      const gramsTotal = gramsFromUnits(qtyUnits, foodData.selectedFood.grams_per_unit || 1)
      const newDelta = computeDeltaFromFood(foodData.selectedFood, gramsTotal)

      // 1) optimistic item
      setMealItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                meal_type: foodData.selectedMealType,
                food_id: foodData.selectedFood.id,
                food_name: foodData.selectedFood.name ?? i.food_name,
                grams_per_unit: foodData.selectedFood.grams_per_unit,
                quantity_grams: gramsTotal,
                grams_total: gramsTotal,
                item_kcal: Math.round(newDelta.kcal) || i.item_kcal,
                __optimistic__: true,
              }
            : i
        )
      )

      // 2) optimistic totals (remove antigo + adiciona novo)
      setMealTotals(prev => applyMealDelta(prev, current.meal_type, {
        kcal: -oldDelta.kcal, carbs: -oldDelta.carbs, protein: -oldDelta.protein, fat: -oldDelta.fat
      }))
      setMealTotals(prev => applyMealDelta(prev, foodData.selectedMealType, newDelta))

      setDailyIntake(prev => applyDailyDelta(applyDailyDelta(prev, {
        kcal: -oldDelta.kcal, carbs: -oldDelta.carbs, protein: -oldDelta.protein, fat: -oldDelta.fat
      }), newDelta))

      // 3) server
      const { error } = await supabase.from('meal_items').update({
        meal_type: foodData.selectedMealType,
        food_id: foodData.selectedFood.id,
        quantity_grams: gramsTotal,
        grams_total: gramsTotal,
      }).eq('id', itemId)

      if (error) throw error

      // 4) limpar flag
      setMealItems(prev => prev.map(i => (i.id === itemId ? { ...i, __optimistic__: false } : i)))

      toast.success('Alimento atualizado! ✅')
      await new Promise(r => setTimeout(r, 120))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao atualizar alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao atualizar alimento.')
      setMealItems(mealItems); setMealTotals(mealTotals); setDailyIntake(dailyIntake)
    }
  }, [userId, mealItems, mealTotals, dailyIntake, fetchAllData])

  const deleteFood = useCallback(async (itemId: UUID) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }

      const target = mealItems.find(i => i.id === itemId)
      if (!target) return

      const grams = num(target.quantity_grams ?? target.grams_total)
      const pseudoFood: SelectedFood = {
        id: target.food_id,
        name: target.food_name,
        grams_per_unit: target.grams_per_unit ?? 100,
        kcal_per_100g: 0, carbs_g_per_100g: 0, protein_g_per_100g: 0, fat_g_per_100g: 0,
      }
      const delta = computeDeltaFromFood(pseudoFood, grams)

      // optimistic
      setMealItems(prev => prev.filter(i => i.id !== itemId))
      setMealTotals(prev => applyMealDelta(prev, target.meal_type, {
        kcal: -delta.kcal, carbs: -delta.carbs, protein: -delta.protein, fat: -delta.fat
      }))
      setDailyIntake(prev => applyDailyDelta(prev, {
        kcal: -delta.kcal, carbs: -delta.carbs, protein: -delta.protein, fat: -delta.fat
      }))

      const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
      if (error) throw error

      toast.success('Alimento removido! 🗑️')
      await new Promise(r => setTimeout(r, 120))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao remover alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao remover alimento.')
      setMealItems(mealItems); setMealTotals(mealTotals); setDailyIntake(dailyIntake)
    }
  }, [userId, mealItems, mealTotals, dailyIntake, fetchAllData])

  return {
    loading,
    recalculating,
    dailyIntake,
    dailyAdherence,
    mealTotals,
    mealItems,
    weeklySummary,
    actions: { fetchAllData, recalculateGoals, addFood, updateFood, deleteFood },
  }
}

// ------------------------------------
// BG dinâmico (glow Phoenix)
// ------------------------------------
const PhoenixBackground = memo(({ progress }: { progress: number }) => {
  const opacity = Math.min(progress / 100, 0.8)
  return (
    <motion.div
      className="fixed inset-0 -z-10"
      style={{
        background: `
          radial-gradient(circle at 50% 50%, rgba(251,146,60,${opacity * 0.28}), rgba(251,146,60,0) 48%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(var(--muted)))
        `,
      }}
      aria-hidden
    />
  )
})

// ------------------------------------
// Donut de progresso (kcal)
// ------------------------------------
const DonutProgress = memo(({ current, goal }: { current: number; goal: number }) => {
  const reduce = useReducedMotion()
  const pct = Math.max(0, Math.min(100, goal > 0 ? (current / goal) * 100 : 0))
  const size = 220
  const stroke = 16
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="url(#phoenix-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0 } : { duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(251,146,60,.35))' }}
        />
        <defs>
          <linearGradient id="phoenix-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />   {/* amber-500 */}
            <stop offset="100%" stopColor="#ea580c" />  {/* orange-600 */}
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute text-center rotate-0">
        <div className="flex items-center justify-center gap-1 text-3xl font-bold text-foreground">
          <Flame className="w-6 h-6 text-orange-500" /> {Math.round(pct)}%
        </div>
        <p className="text-sm mt-1 text-muted-foreground">
          {Math.round(current)} / {Math.round(goal)} kcal
        </p>
      </div>
    </div>
  )
})

// ------------------------------------
// MealCard
// ------------------------------------
const MealCard = memo(({
  meal, data, items, isExpanded, onToggle, onEditItem, onDeleteItem
}: {
  meal: MealConfig
  data?: MealTotal | null
  items: MealItem[]
  isExpanded: boolean
  onToggle: () => void
  onEditItem: (item: MealItem) => void
  onDeleteItem: (id: UUID) => void
}) => {
  const Icon = meal.icon
  const idx = MEALS.findIndex(m => m.id === meal.id)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}>
      <Card className={`${cardBase} p-5 transition-all hover:-translate-y-0.5`}>
        <button
          className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:rounded-xl"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={`meal-${meal.id}`}
        >
          <div className="flex items-center gap-4">
            <span className={`p-3 rounded-full bg-gradient-to-br ${meal.gradient} shadow-md`}>
              <Icon className="w-6 h-6 text-white" />
            </span>
            <div>
              <h3 className="font-semibold text-lg tracking-tight text-foreground flex items-center gap-2">
                <span aria-hidden>{meal.emoji}</span> {meal.name}
              </h3>
              <p className={`${TOKENS.textMuted} text-sm`}>{Math.round(data?.total_kcal || 0)} kcal</p>
              <div className="flex flex-wrap gap-3 font-medium text-[12px] mt-1">
                <span className="text-green-600 dark:text-green-400">C: {Math.round(data?.total_carbs_g || 0)}g</span>
                <span className="text-blue-600 dark:text-blue-400">P: {Math.round(data?.total_protein_g || 0)}g</span>
                <span className="text-orange-600 dark:text-orange-400">G: {Math.round(data?.total_fat_g || 0)}g</span>
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 opacity-70" /> : <ChevronDown className="w-5 h-5 opacity-70" />}
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={`meal-${meal.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {items.length > 0 ? items.map((item) => (
                  <div
                    key={item.id}
                    className={`group/item p-3 rounded-lg transition-colors ${
                      item.__optimistic__
                        ? 'bg-yellow-100/50 dark:bg-yellow-900/20'
                        : 'bg-accent/40 hover:bg-accent/60'
                    }`}
                    title={item.__optimistic__ ? 'Sincronizando…' : undefined}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {item.food_name}{item.__optimistic__ ? ' (…)' : ''}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{item.item_kcal ?? '—'} kcal</span>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                            onClick={(e) => { e.stopPropagation(); onEditItem(item) }}
                            aria-label="Editar alimento"
                            disabled={item.__optimistic__}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id) }}
                            aria-label="Remover alimento"
                            disabled={item.__optimistic__}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className={`${TOKENS.textMuted} text-sm text-center py-2`}>Nenhum alimento adicionado.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

// ------------------------------------
// Modal CRUD de Alimento
// ------------------------------------
const FoodModal = memo(({
  open, onOpenChange, onAddFood, onUpdateFood, itemToEdit
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAddFood: (data: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }) => Promise<void>
  onUpdateFood: (id: UUID, data: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }) => Promise<void>
  itemToEdit: MealItem | null
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<any[]>([])
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null)
  const [quantity, setQuantity] = useState<string>('')

  const [isSaving, setIsSaving] = useState(false)
  const debouncedSearchTerm = useDebounce(foodSearch, 300)

  useEffect(() => {
    if (itemToEdit) {
      setSelectedMealType(itemToEdit.meal_type)
      setFoodSearch(itemToEdit.food_name)
      setSelectedFood({ id: itemToEdit.food_id, name: itemToEdit.food_name, grams_per_unit: itemToEdit.grams_per_unit })
      const grams = itemToEdit.quantity_grams ?? itemToEdit.grams_total ?? 0
      const gpu = itemToEdit.grams_per_unit || 1
      const units = gpu ? grams / gpu : grams
      setQuantity(String(Number.isFinite(units) ? Math.max(0, +units) : 0))
    } else {
      setSelectedMealType('breakfast'); setFoodSearch(''); setSelectedFood(null); setQuantity(''); setFoodResults([])
    }
  }, [itemToEdit, open])

  useEffect(() => {
    const searchFoods = async (q: string) => {
      if (q.length < 2) { setFoodResults([]); return }
      const { data, error } = await supabase
        .from('foods')
        .select('id,name,grams_per_unit,kcal_per_100g,carbs_g_per_100g,protein_g_per_100g,fat_g_per_100g')
        .ilike('name', `%${q}%`)
        .limit(10)
      if (error) { console.error(error); toast.error('Erro ao buscar alimentos.'); return }
      setFoodResults(data || [])
    }
    if (debouncedSearchTerm) searchFoods(debouncedSearchTerm); else setFoodResults([])
  }, [debouncedSearchTerm])

  const handleSave = async () => {
    const qty = parseFloat(quantity)
    if (!selectedFood) return toast.error('Selecione um alimento da lista.')
    if (!quantity || isNaN(qty) || qty <= 0) return toast.error('Informe uma quantidade válida (> 0).')

    setIsSaving(true)
    const payload = { selectedMealType, selectedFood, quantity: qty }
    if (itemToEdit) await onUpdateFood(itemToEdit.id, payload)
    else await onAddFood(payload)
    setIsSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-lg ${cardBase} p-6`}>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {itemToEdit ? 'Editar Alimento' : 'Adicionar Alimento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Refeição */}
          <div>
            <Label className="text-sm font-semibold">Para qual refeição?</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {MEALS.map(meal => (
                <Button
                  key={meal.id}
                  variant={selectedMealType === meal.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMealType(meal.id)}
                  className={`rounded-xl py-3 transition-all ${selectedMealType === meal.id ? `bg-gradient-to-r ${meal.gradient} ${TOKENS.shadow.soft}` : ''}`}
                  aria-pressed={selectedMealType === meal.id}
                >
                  <span className="mr-2">{meal.emoji}</span> {meal.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Busca de Alimento */}
          <div>
            <Label className="text-sm font-semibold">Buscar alimento</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
              <Input
                placeholder="Ex: Frango, Arroz..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                aria-autocomplete="list"
              />
              {foodResults.length > 0 && (
                <div className="mt-2 max-h-56 overflow-y-auto border rounded-xl p-2 bg-accent/40">
                  {foodResults.map(food => (
                    <button
                      type="button"
                      key={food.id}
                      onClick={() => {
                        setSelectedFood({
                          id: food.id,
                          name: food.name,
                          grams_per_unit: food.grams_per_unit ?? 100,
                          kcal_per_100g: food.kcal_per_100g ?? 0,
                          carbs_g_per_100g: food.carbs_g_per_100g ?? 0,
                          protein_g_per_100g: food.protein_g_per_100g ?? 0,
                          fat_g_per_100g: food.fat_g_per_100g ?? 0,
                        })
                        setFoodSearch(food.name)
                        setFoodResults([])
                      }}
                      className="w-full text-left p-3 rounded-md hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <p className="font-medium text-foreground">{food.name}</p>
                      <p className="text-xs opacity-70">
                        {food.kcal_per_100g ?? 0} kcal / 100g — C:{food.carbs_g_per_100g ?? 0} P:{food.protein_g_per_100g ?? 0} G:{food.fat_g_per_100g ?? 0}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <Label className="text-sm font-semibold">Quantidade (em unidades)</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 1 (ovo), 2..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-2 h-11 rounded-xl"
            />
            {selectedFood && quantity && (
              <p className="text-xs opacity-70 mt-1">
                Total: ~{Math.round((parseFloat(quantity) || 0) * (selectedFood.grams_per_unit || 1))}g
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFood || !quantity || isSaving}
            className={`flex-1 h-11 rounded-xl ${TOKENS.gradientAction} ${TOKENS.shadow.soft} hover:shadow-xl transition-all text-white`}
          >
            {isSaving ? 'Salvando...' : (itemToEdit ? 'Salvar alterações' : 'Adicionar alimento')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// ------------------------------------
// Skeleton (loading)
// ------------------------------------
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200/70 dark:bg-zinc-800 ${TOKENS.radius.lg} ${className}`} />
)

// ------------------------------------
// Página principal
// ------------------------------------
export default function DietPlanner() {
  const { user } = useAuth()
  const {
    loading,
    recalculating,
    dailyIntake,
    mealTotals,
    mealItems,
    weeklySummary,
    actions,
  } = useDietData(user?.id as UUID | undefined)

  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set())
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MealItem | null>(null)

  const calorieProgress = useMemo(() => {
    if (!dailyIntake) return 0
    return ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100
  }, [dailyIntake])

  const weeklyChartData = useMemo(() => {
    if (!Array.isArray(weeklySummary)) return []
    return weeklySummary.map(day => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      adherence: Math.round(day.avg_adherence_pct || 0),
    }))
  }, [weeklySummary])

  const getMotivationalMessage = (progress: number) => {
    if (progress >= 100) return '🔥 Meta atingida! Você é lendário.'
    if (progress >= 90)  return '🌟 Quase lá! Sua consistência é incrível.'
    if (progress >= 70)  return '💪 Excelente! Você está no caminho certo.'
    if (progress >= 50)  return '👍 Bom progresso! Continue assim.'
    return '🌅 Vamos começar! Cada passo conta.'
  }

  const toggleMeal = (mealId: MealType) =>
    setExpandedMeals(prev => {
      const next = new Set(prev)
      next.has(mealId) ? next.delete(mealId) : next.add(mealId)
      return next
    })

  const handleAddFood = async (foodData: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }) => {
    await actions.addFood(foodData)
  }
  const handleUpdateFood = async (itemId: UUID, foodData: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }) => {
    await actions.updateFood(itemId, foodData)
  }
  const handleEditClick = (item: MealItem) => {
    setItemToEdit(item)
    setIsFoodModalOpen(true)
  }
  const handleDeleteClick = (itemId: UUID) => {
    actions.deleteFood(itemId)
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="w-full max-w-5xl">
          <div className="mb-10 space-y-3">
            <SkeletonBlock className="h-10 w-56" />
            <SkeletonBlock className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <SkeletonBlock className="h-80 xl:col-span-2" />
            <div className="space-y-6">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentKcal = Math.round(dailyIntake?.total_kcal || 0)
  const goalKcal = Math.round(dailyIntake?.goal_kcal || 2000)

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <PhoenixBackground progress={calorieProgress} />

      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Cabeçalho */}
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">Nutrição</h1>
                <p className={`${TOKENS.textMuted} text-lg sm:text-xl font-light`}>
                  {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                </p>
              </div>
              <Button
                onClick={() => setIsFoodModalOpen(true)}
                size="lg"
                className={`${TOKENS.gradientAction} text-white ${TOKENS.radius.lg} ${TOKENS.shadow.deep} hover:shadow-2xl transition-all`}
              >
                <Plus className="w-5 h-5 mr-2" /> Adicionar alimento
              </Button>
            </div>
          </motion.header>

          {/* Grid principal */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* Coluna esquerda (gráficos + IA) */}
            <div className="xl:col-span-2 space-y-8">
              {/* Donut premium */}
              <Card className={`${cardBase} p-8 lg:p-12 flex flex-col items-center`}>
                <DonutProgress current={currentKcal} goal={goalKcal} />
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl text-center font-medium text-foreground max-w-md mt-6 mx-auto">
                  {getMotivationalMessage(calorieProgress)}
                </motion.p>
              </Card>

              {/* (opcional) Insight/coach */}
              <Card className={`${cardBase} p-8 lg:p-12`}>
                <PhoenixOracle
                  dailyIntake={dailyIntake || {}}
                  mealTotals={Array.isArray(mealTotals) ? mealTotals : []}
                  weeklySummary={Array.isArray(weeklySummary) ? weeklySummary : []}
                />
              </Card>

              {/* Análise semanal */}
              {weeklySummary.length > 0 && (
                <Card className={`${cardBase} p-8 lg:p-12`}>
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-orange-500" /> Análise Semanal
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <defs>
                          <linearGradient id="phoenix-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ea580c" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                        <Line type="monotone" dataKey="adherence" stroke="url(#phoenix-gradient)" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>

            {/* Coluna direita (Refeições + Ações) */}
            <div className="xl:col-span-1 space-y-8">
              <Card className={`${cardBase} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Refeições</h2>
                  <Button
                    onClick={() => setIsFoodModalOpen(true)}
                    size="sm"
                    variant="outline"
                    className={`${TOKENS.radius.lg} border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-colors`}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {MEALS.map(meal => {
                    const data = Array.isArray(mealTotals) ? mealTotals.find(m => m.meal_type === meal.id) : null
                    const items = Array.isArray(mealItems) ? mealItems.filter(i => i.meal_type === meal.id) : []
                    return (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        data={data || null}
                        items={items}
                        isExpanded={expandedMeals.has(meal.id)}
                        onToggle={() => toggleMeal(meal.id)}
                        onEditItem={handleEditClick}
                        onDeleteItem={handleDeleteClick}
                      />
                    )
                  })}
                </div>
              </Card>

              <Card className={`${cardBase} p-6 text-center`}>
                <Sparkles className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-1">Nutricionista Phoenix</h3>
                <p className={`${TOKENS.textMuted} mb-5`}>Seu plano está otimizado para os melhores resultados.</p>
                <div className="space-y-3">
                  <Button
                    onClick={actions.recalculateGoals}
                    disabled={recalculating}
                    variant="outline"
                    className={`w-full ${TOKENS.radius.lg} border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-colors`}
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculando...' : 'Recalcular metas'}
                  </Button>
                  <Button
                    onClick={actions.fetchAllData}
                    variant="outline"
                    className={`w-full ${TOKENS.radius.lg} border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors`}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Atualizar dados
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <FoodModal
        open={isFoodModalOpen}
        onOpenChange={(open) => { setIsFoodModalOpen(open); if (!open) setItemToEdit(null) }}
        onAddFood={handleAddFood}
        onUpdateFood={handleUpdateFood}
        itemToEdit={itemToEdit}
      />
    </div>
  )
}
