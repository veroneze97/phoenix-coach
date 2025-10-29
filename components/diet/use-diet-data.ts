// components/diet/use-diet-data.ts
'use client'

/**
 * useDietData — Hook de dados (DietPlanner)
 * - Carrega ingestão diária, totais por refeição, itens e resumo semanal
 * - Realtime supabase para sincronizar mudanças em meal_items
 * - CRUD otimista (add/update/delete) com rollback em falhas
 * - Sem console.* (compatível com sua config de ESLint)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Tipos centrais compartilhados
import type {
  UUID,
  MealType,
  MealItem,
  MealTotal,
  DailyIntake,
  WeeklyPoint,
  SelectedFood,
} from '@/components/diet/types'

/* ------------------------------------ *
 * Helpers numéricos e de macros
 * ------------------------------------ */
function num(n?: number) {
  return Number.isFinite(n) ? (n as number) : 0
}

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

function applyDailyDelta(
  d: DailyIntake | null,
  delta: { kcal: number; carbs: number; protein: number; fat: number },
) {
  const base: DailyIntake = d ? { ...d } : {}
  base.total_kcal = num(base.total_kcal) + delta.kcal
  base.total_carbs_g = num(base.total_carbs_g) + delta.carbs
  base.total_protein_g = num(base.total_protein_g) + delta.protein
  base.total_fat_g = num(base.total_fat_g) + delta.fat
  return base
}

function applyMealDelta(
  totals: MealTotal[],
  mealType: MealType,
  delta: { kcal: number; carbs: number; protein: number; fat: number },
) {
  const arr = [...totals]
  const idx = arr.findIndex((t) => t.meal_type === mealType)
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

/* ------------------------------------ *
 * Hook principal
 * ------------------------------------ */
export default function useDietData(userId?: UUID) {
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
    return () => {
      mountedRef.current = false
    }
  }, [])

  const safeSet = <T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value)
  }

  const fetchAllData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const [intakeResult, adherenceResult, totalsResult, itemsResult, summaryResult] =
        await Promise.allSettled([
          supabase
            .from('v_daily_intake')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle(),
          supabase
            .from('v_daily_adherence')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle(),
          supabase.from('v_meal_totals').select('*').eq('user_id', userId).eq('date', today),
          supabase
            .from('v_meal_items_nutrients')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today),
          supabase
            .from('v_weekly_summary')
            .select('*')
            .eq('user_id', userId)
            .gte('date', sevenDaysAgo)
            .lte('date', today)
            .order('date', { ascending: true }),
        ])

      if (intakeResult.status === 'fulfilled') {
        const { data } = intakeResult.value as { data: DailyIntake | null }
        safeSet(setDailyIntake, data ?? null)
      }
      if (adherenceResult.status === 'fulfilled') {
        const { data } = adherenceResult.value as { data: any | null }
        safeSet(setDailyAdherence, data ?? null)
      }
      if (totalsResult.status === 'fulfilled') {
        const { data } = totalsResult.value as { data: MealTotal[] | null }
        safeSet(setMealTotals, Array.isArray(data) ? data : [])
      }
      if (itemsResult.status === 'fulfilled') {
        const { data } = itemsResult.value as { data: MealItem[] | null }
        safeSet(setMealItems, Array.isArray(data) ? data : [])
      }
      if (summaryResult.status === 'fulfilled') {
        const { data } = summaryResult.value as { data: WeeklyPoint[] | null }
        safeSet(setWeeklySummary, Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('Erro ao carregar dados da dieta.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [userId])

  // Primeiro carregamento
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Realtime: qualquer mudança em meal_items do usuário refaz o fetch
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('meal_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_items', filter: `user_id=eq.${userId}` },
        async () => {
          await new Promise((r) => setTimeout(r, 150))
          fetchAllData()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchAllData])

  // RPC para recalcular metas do dia
  const recalculateGoals = useCallback(
    async () => {
      setRecalculating(true)
      try {
        const today = new Date().toISOString().slice(0, 10)
        const { error } = await supabase.rpc('fn_calc_goals', { p_user_id: userId, p_date: today })
        if (error) {
          if (error.message?.includes('does not exist')) {
            toast.error('Função de recálculo não encontrada.')
          } else {
            throw error
          }
        } else {
          toast.success('Metas recalculadas! 🔥')
          await new Promise((r) => setTimeout(r, 250))
          await fetchAllData()
        }
      } catch {
        toast.error('Erro ao recalcular metas.')
      } finally {
        setRecalculating(false)
      }
    },
    [userId, fetchAllData],
  )

  /* ------------------------------------ *
   * CRUD Otimista
   * ------------------------------------ */
  const addFood = useCallback(
    async (foodData: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number }) => {
      try {
        if (!userId) {
          toast.error('Sessão não encontrada. Faça login.')
          return
        }

        const today = new Date().toISOString().split('T')[0]
        const qtyUnits = parseFloat(String(foodData.quantity)) || 0
        const gramsTotal = gramsFromUnits(qtyUnits, foodData.selectedFood.grams_per_unit || 1)
        const delta = computeDeltaFromFood(foodData.selectedFood, gramsTotal)

        // snapshots para rollback
        const sItems = [...mealItems]
        const sTotals = [...mealTotals]
        const sDaily = dailyIntake ? { ...dailyIntake } : null

        // 1) item otimista
        const tempId = `temp-${Date.now()}` as UUID
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
        setMealItems((prev) => [...prev, optimisticItem])

        // 2) totais otimistas
        setMealTotals((prev) => applyMealDelta(prev, foodData.selectedMealType, delta))
        setDailyIntake((prev) => applyDailyDelta(prev, delta))

        // 3) servidor
        const { data, error } = await supabase
          .from('meal_items')
          .insert({
            user_id: userId,
            date: today,
            meal_type: foodData.selectedMealType,
            food_id: foodData.selectedFood.id,
            quantity_grams: gramsTotal,
            grams_total: gramsTotal,
          })
          .select('id')
          .single()

        if (error) throw error

        // 4) trocar temp id
        if (data?.id) {
          setMealItems((prev) =>
            prev.map((i) => (i.id === tempId ? { ...i, id: data.id, __optimistic__: false } : i)),
          )
        }

        toast.success('Alimento adicionado! 🎉')
        await new Promise((r) => setTimeout(r, 120))
        await fetchAllData()
      } catch (e: any) {
        toast.error(e?.message ? `Erro: ${e.message}` : 'Erro ao adicionar alimento.')
        // rollback
        setMealItems(mealItems)
        setMealTotals(mealTotals)
        setDailyIntake(dailyIntake)
      }
    },
    [userId, mealItems, mealTotals, dailyIntake, fetchAllData],
  )

  const updateFood = useCallback(
    async (
      itemId: UUID,
      foodData: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number },
    ) => {
      try {
        if (!userId) {
          toast.error('Sessão não encontrada. Faça login.')
          return
        }

        // snapshots para rollback
        const sItems = [...mealItems]
        const sTotals = [...mealTotals]
        const sDaily = dailyIntake ? { ...dailyIntake } : null

        const current = mealItems.find((i) => i.id === itemId)
        if (!current) throw new Error('Item não encontrado.')

        // delta antigo (pseudomacros = 0 se desconhecido)
        const oldGrams = num(current.quantity_grams ?? current.grams_total)
        const oldFood: SelectedFood = {
          id: current.food_id,
          name: current.food_name,
          grams_per_unit: current.grams_per_unit ?? 100,
          kcal_per_100g: 0,
          carbs_g_per_100g: 0,
          protein_g_per_100g: 0,
          fat_g_per_100g: 0,
        }
        const oldDelta = computeDeltaFromFood(oldFood, oldGrams)

        // novo delta
        const qtyUnits = parseFloat(String(foodData.quantity)) || 0
        const gramsTotal = gramsFromUnits(qtyUnits, foodData.selectedFood.grams_per_unit || 1)
        const newDelta = computeDeltaFromFood(foodData.selectedFood, gramsTotal)

        // 1) otimista: atualizar item
        setMealItems((prev) =>
          prev.map((i) =>
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
              : i,
          ),
        )

        // 2) totais: remove antigo + adiciona novo
        setMealTotals((prev) =>
          applyMealDelta(prev, current.meal_type, {
            kcal: -oldDelta.kcal,
            carbs: -oldDelta.carbs,
            protein: -oldDelta.protein,
            fat: -oldDelta.fat,
          }),
        )
        setMealTotals((prev) => applyMealDelta(prev, foodData.selectedMealType, newDelta))

        setDailyIntake((prev) =>
          applyDailyDelta(
            applyDailyDelta(prev, {
              kcal: -oldDelta.kcal,
              carbs: -oldDelta.carbs,
              protein: -oldDelta.protein,
              fat: -oldDelta.fat,
            }),
            newDelta,
          ),
        )

        // 3) servidor
        const { error } = await supabase
          .from('meal_items')
          .update({
            meal_type: foodData.selectedMealType,
            food_id: foodData.selectedFood.id,
            quantity_grams: gramsTotal,
            grams_total: gramsTotal,
          })
          .eq('id', itemId)

        if (error) throw error

        // 4) limpar flag
        setMealItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, __optimistic__: false } : i)),
        )

        toast.success('Alimento atualizado! ✅')
        await new Promise((r) => setTimeout(r, 120))
        await fetchAllData()
      } catch (e: any) {
        toast.error(e?.message ? `Erro: ${e.message}` : 'Erro ao atualizar alimento.')
        setMealItems(mealItems)
        setMealTotals(mealTotals)
        setDailyIntake(dailyIntake)
      }
    },
    [userId, mealItems, mealTotals, dailyIntake, fetchAllData],
  )

  const deleteFood = useCallback(
    async (itemId: UUID) => {
      try {
        if (!userId) {
          toast.error('Sessão não encontrada. Faça login.')
          return
        }

        const target = mealItems.find((i) => i.id === itemId)
        if (!target) return

        const grams = num(target.quantity_grams ?? target.grams_total)
        const pseudoFood: SelectedFood = {
          id: target.food_id,
          name: target.food_name,
          grams_per_unit: target.grams_per_unit ?? 100,
          kcal_per_100g: 0,
          carbs_g_per_100g: 0,
          protein_g_per_100g: 0,
          fat_g_per_100g: 0,
        }
        const delta = computeDeltaFromFood(pseudoFood, grams)

        // otimista
        const sItems = [...mealItems]
        const sTotals = [...mealTotals]
        const sDaily = dailyIntake ? { ...dailyIntake } : null

        setMealItems((prev) => prev.filter((i) => i.id !== itemId))
        setMealTotals((prev) =>
          applyMealDelta(prev, target.meal_type, {
            kcal: -delta.kcal,
            carbs: -delta.carbs,
            protein: -delta.protein,
            fat: -delta.fat,
          }),
        )
        setDailyIntake((prev) =>
          applyDailyDelta(prev, {
            kcal: -delta.kcal,
            carbs: -delta.carbs,
            protein: -delta.protein,
            fat: -delta.fat,
          }),
        )

        const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
        if (error) throw error

        toast.success('Alimento removido! 🗑️')
        await new Promise((r) => setTimeout(r, 120))
        await fetchAllData()
      } catch (e: any) {
        toast.error(e?.message ? `Erro: ${e.message}` : 'Erro ao remover alimento.')
        // rollback
        setMealItems(mealItems)
        setMealTotals(mealTotals)
        setDailyIntake(dailyIntake)
      }
    },
    [userId, mealItems, mealTotals, dailyIntake, fetchAllData],
  )

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
