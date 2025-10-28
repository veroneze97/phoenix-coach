'use client'

/**
 * DietPlanner – UI/UX Premium (TypeScript)
 * - Mantém a lógica funcional (Supabase, hooks, estados)
 * - Ajustado para seu schema: quantity_grams + grams_total (+ meal_type enum)
 * - Visual premium, responsivo e comentado
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
  Flame,
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

// Componente existente
import PhoenixOracle from './PhoenixOracle'

// ------------------------------------
// Tipos mínimos
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
  quantity_grams?: number      // ✅ seu schema
  grams_total?: number
  item_kcal?: number
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

// ------------------------------------
// Design Tokens
// ------------------------------------
const TOKENS = {
  radius: { lg: 'rounded-2xl', xl: 'rounded-3xl' },
  shadow: { soft: 'shadow-lg', deep: 'shadow-2xl' },
  blur: 'backdrop-blur-xl',
  border: 'border border-white/15 dark:border-zinc-700/40',
  surface: 'bg-white/70 dark:bg-zinc-900/60',
  textMuted: 'text-muted-foreground',
  gradientAction: 'bg-gradient-to-r from-phoenix-500 to-phoenix-600',
}
const cardBase = `${TOKENS.surface} ${TOKENS.blur} ${TOKENS.border} ${TOKENS.shadow.deep} ${TOKENS.radius.xl}`

const MEALS: MealConfig[] = [
  { id: 'breakfast', name: 'Café da Manhã', icon: Coffee, emoji: '☀️', gradient: 'from-yellow-400 to-amber-400' },
  { id: 'lunch',     name: 'Almoço',         icon: Sun,    emoji: '🌞', gradient: 'from-amber-400 to-orange-400' },
  { id: 'dinner',    name: 'Jantar',         icon: Sunset, emoji: '🌙', gradient: 'from-indigo-400 to-blue-400' },
  { id: 'snacks',    name: 'Lanches',        icon: Cookie, emoji: '🍪', gradient: 'from-orange-400 to-red-400' },
]

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
// Hook de dados (com correções de atualização)
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
        supabase.from('v_daily_intake')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle(), // PostgrestMaybeSingleResponse
        supabase.from('v_daily_adherence')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle(),
        supabase.from('v_meal_totals')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today),
        supabase.from('v_meal_items_nutrients')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today),
        supabase.from('v_weekly_summary')
          .select('*')
          .eq('user_id', userId)
          .gte('date', sevenDaysAgo)
          .lte('date', today)
          .order('date', { ascending: true }),
      ])

      // ✅ Desempacotar .data corretamente e proteger contra undefined
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
          // Pequeno *debounce* para materializar views/cálculos
          await new Promise(r => setTimeout(r, 150))
          fetchAllData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

  const addFood = useCallback(async (foodData: {
    selectedMealType: MealType
    selectedFood: { id: UUID; grams_per_unit?: number }
    quantity: number   // unidades (ex.: 1 ovo = 1 unidade)
  }) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }
      const today = new Date().toISOString().split('T')[0]
      const qtyUnits = parseFloat(String(foodData.quantity)) || 0
      const gramsPerUnit = foodData.selectedFood.grams_per_unit || 1
      const gramsTotal = qtyUnits * gramsPerUnit

      const { error } = await supabase.from('meal_items').insert({
        user_id: userId,
        date: today,                          // se sua tabela não tiver "date", remova esta linha
        meal_type: foodData.selectedMealType,
        food_id: foodData.selectedFood.id,
        quantity_grams: gramsTotal,          // ✅ seu schema
        grams_total: gramsTotal,             // usado por views/cálculos
      }).select('id') // select leve para confirmar inserção

      if (error) throw error
      toast.success('Alimento adicionado! 🎉')
      await new Promise(r => setTimeout(r, 200))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao adicionar alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao adicionar alimento.')
    }
  }, [userId, fetchAllData])

  const updateFood = useCallback(async (
    itemId: UUID,
    foodData: { selectedMealType: MealType; selectedFood: { id: UUID; grams_per_unit?: number }; quantity: number }
  ) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }
      const qtyUnits = parseFloat(String(foodData.quantity)) || 0
      const gramsPerUnit = foodData.selectedFood.grams_per_unit || 1
      const gramsTotal = qtyUnits * gramsPerUnit

      const { error } = await supabase.from('meal_items').update({
        meal_type: foodData.selectedMealType,
        food_id: foodData.selectedFood.id,
        quantity_grams: gramsTotal,          // ✅
        grams_total: gramsTotal,             // mantém compatibilidade
      }).eq('id', itemId)

      if (error) throw error
      toast.success('Alimento atualizado! ✅')
      await new Promise(r => setTimeout(r, 200))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao atualizar alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao atualizar alimento.')
    }
  }, [userId, fetchAllData])

  const deleteFood = useCallback(async (itemId: UUID) => {
    try {
      if (!userId) { toast.error('Sessão não encontrada. Faça login.'); return }
      const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
      if (error) throw error
      toast.success('Alimento removido! 🗑️')
      await new Promise(r => setTimeout(r, 150))
      await fetchAllData()
    } catch (error: any) {
      console.error('Erro ao remover alimento:', error)
      toast.error(error?.message ? `Erro: ${error.message}` : 'Erro ao remover alimento.')
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
    actions: { fetchAllData, recalculateGoals, addFood, updateFood, deleteFood },
  }
}

// ------------------------------------
// BG dinâmico
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
// “Árvore” de macros
// ------------------------------------
const PhoenixTree = memo(({ dailyIntake }: { dailyIntake: DailyIntake | null }) => {
  const reduceMotion = useReducedMotion()
  const progress = useMemo(() => {
    if (!dailyIntake) return { c: 0, p: 0, g: 0, kcal: 0, kcalGoal: 2000 }
    return {
      c: Math.min((dailyIntake.total_carbs_g || 0) / (dailyIntake.goal_carbs_g || 250), 1),
      p: Math.min((dailyIntake.total_protein_g || 0) / (dailyIntake.goal_protein_g || 150), 1),
      g: Math.min((dailyIntake.total_fat_g || 0) / (dailyIntake.goal_fat_g || 65), 1),
      kcal: dailyIntake.total_kcal || 0,
      kcalGoal: dailyIntake.goal_kcal || 2000,
    }
  }, [dailyIntake])

  return (
    <div className="flex flex-col items-center justify-center w-full h-96">
      <svg width="320" height="320" viewBox="0 0 300 300" className="w-full h-full">
        <rect x="140" y="180" width="20" height="120" fill="hsl(24, 36%, 30%)" rx="6" />
        <motion.path
          d="M 150 180 Q 120 150 100 120"
          stroke="hsl(var(--phoenix-400))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.c }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.8, ease: 'easeOut' }}
        />
        <motion.path
          d="M 150 160 Q 180 130 200 100"
          stroke="hsl(var(--phoenix-500))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.p }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.8, delay: 0.15, ease: 'easeOut' }}
        />
        <motion.path
          d="M 150 140 Q 130 110 110 80"
          stroke="hsl(var(--phoenix-600))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress.g }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.8, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>

      <div className="mt-4 text-center">
        <p className="text-2xl font-bold text-foreground">
          {progress.kcal} / {progress.kcalGoal} kcal
        </p>
        <p className={TOKENS.textMuted}>Sua jornada hoje</p>
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
        {/* Cabeçalho clicável */}
        <button
          className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-phoenix-500 focus-visible:rounded-xl"
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
              <p className={`${TOKENS.textMuted} text-sm`}>{data?.total_kcal || 0} kcal</p>
              <div className="flex gap-3 font-medium text-[12px] mt-1">
                <span className="text-green-600 dark:text-green-400">C: {data?.total_carbs_g || 0}g</span>
                <span className="text-blue-600 dark:text-blue-400">P: {data?.total_protein_g || 0}g</span>
                <span className="text-phoenix-600 dark:text-phoenix-400">G: {data?.total_fat_g || 0}g</span>
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
                  <div key={item.id} className="group/item p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-colors">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.food_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{item.item_kcal} kcal</span>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                            onClick={(e) => { e.stopPropagation(); onEditItem(item) }}
                            aria-label="Editar alimento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id) }}
                            aria-label="Remover alimento"
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
  onAddFood: (data: { selectedMealType: MealType; selectedFood: { id: UUID; grams_per_unit?: number }; quantity: number }) => Promise<void>
  onUpdateFood: (id: UUID, data: { selectedMealType: MealType; selectedFood: { id: UUID; grams_per_unit?: number }; quantity: number }) => Promise<void>
  itemToEdit: MealItem | null
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<any[]>([])
  const [selectedFood, setSelectedFood] = useState<{ id: UUID; name: string; grams_per_unit?: number } | null>(null)
  const [quantity, setQuantity] = useState<string>('') // em UNIDADES (ex.: 1 ovo = 1)

  const [isSaving, setIsSaving] = useState(false)
  const debouncedSearchTerm = useDebounce(foodSearch, 300)

  useEffect(() => {
    if (itemToEdit) {
      setSelectedMealType(itemToEdit.meal_type)
      setFoodSearch(itemToEdit.food_name)
      setSelectedFood({ id: itemToEdit.food_id, name: itemToEdit.food_name, grams_per_unit: itemToEdit.grams_per_unit })

      // Pré-preenche unidades a partir das gramas salvas
      const grams = itemToEdit.quantity_grams ?? itemToEdit.grams_total ?? 0
      const gpu = itemToEdit.grams_per_unit || 1
      const units = gpu ? grams / gpu : grams
      setQuantity(String(Number.isFinite(units) ? Math.max(0, +units) : 0))
    } else {
      setSelectedMealType('breakfast')
      setFoodSearch('')
      setSelectedFood(null)
      setQuantity('')
      setFoodResults([])
    }
  }, [itemToEdit, open])

  useEffect(() => {
    const searchFoods = async (q: string) => {
      if (q.length < 2) { setFoodResults([]); return }
      const { data, error } = await supabase.from('foods').select('*').ilike('name', `%${q}%`).limit(10)
      if (error) { console.error(error); toast.error('Erro ao buscar alimentos.'); return }
      setFoodResults(data || [])
    }
    if (debouncedSearchTerm) searchFoods(debouncedSearchTerm)
    else setFoodResults([])
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
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl p-2 bg-accent/40">
                  {foodResults.map(food => (
                    <button
                      type="button"
                      key={food.id}
                      onClick={() => {
                        setSelectedFood({
                          id: food.id,                              // ✅ UUID real
                          name: food.name,
                          grams_per_unit: food.grams_per_unit ?? 100
                        })
                        setFoodSearch(food.name)
                        setFoodResults([])
                      }}
                      className="w-full text-left p-3 rounded-md hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <p className="font-medium text-foreground">{food.name}</p>
                      <p className="text-xs opacity-70">{food.kcal_per_100g} kcal / 100g</p>
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
            className={`flex-1 h-11 rounded-xl ${TOKENS.gradientAction} ${TOKENS.shadow.soft} hover:shadow-xl transition-all`}
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

  const handleAddFood = async (foodData: { selectedMealType: MealType; selectedFood: { id: UUID; grams_per_unit?: number }; quantity: number }) => {
    await actions.addFood(foodData)
  }
  const handleUpdateFood = async (itemId: UUID, foodData: { selectedMealType: MealType; selectedFood: { id: UUID; grams_per_unit?: number }; quantity: number }) => {
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

          {/* Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* Esquerda */}
            <div className="xl:col-span-2 space-y-8">
              <Card className={`${cardBase} p-8 lg:p-12`}>
                <PhoenixTree dailyIntake={dailyIntake} />
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl text-center font-medium text-foreground max-w-md mt-6 mx-auto">
                  {getMotivationalMessage(calorieProgress)}
                </motion.p>
              </Card>

              <Card className={`${cardBase} p-8 lg:p-12`}>
                <PhoenixOracle
                  dailyIntake={dailyIntake || {}}
                  mealTotals={Array.isArray(mealTotals) ? mealTotals : []}
                  weeklySummary={Array.isArray(weeklySummary) ? weeklySummary : []}
                />
              </Card>

              {weeklySummary.length > 0 && (
                <Card className={`${cardBase} p-8 lg:p-12`}>
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-phoenix-500" /> Análise Semanal
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

            {/* Direita */}
            <div className="xl:col-span-1 space-y-8">
              <Card className={`${cardBase} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Refeições</h2>
                  <Button
                    onClick={() => setIsFoodModalOpen(true)}
                    size="sm"
                    variant="outline"
                    className={`${TOKENS.radius.lg} border-phoenix-500 text-phoenix-600 hover:bg-phoenix-500 hover:text-white transition-colors`}
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
                        onEditItem={setItemToEdit}
                        onDeleteItem={handleDeleteClick}
                      />
                    )
                  })}
                </div>
              </Card>

              <Card className={`${cardBase} p-6 text-center`}>
                <Sparkles className="w-10 h-10 text-phoenix-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-1">Nutricionista Phoenix</h3>
                <p className={`${TOKENS.textMuted} mb-5`}>Seu plano está otimizado para os melhores resultados.</p>
                <div className="space-y-3">
                  <Button
                    onClick={actions.recalculateGoals}
                    disabled={recalculating}
                    variant="outline"
                    className={`w-full ${TOKENS.radius.lg} border-phoenix-500 text-phoenix-600 hover:bg-phoenix-500 hover:text-white transition-colors`}
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
