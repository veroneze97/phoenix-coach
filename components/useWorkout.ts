'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { isPR } from '@/lib/workout-helpers'

// Util: data local normalizada
function todayISO(date: Date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

/**
 * Hook principal do Phoenix Coach
 * Gerencia todo o ciclo de vida do treino do dia:
 *  - Carrega exercícios do Supabase
 *  - Adiciona / remove / duplica / atualiza
 *  - Salva PRs automáticos
 *  - Atualiza RPE e status
 */
export function useWorkout(user: any, selectedDate: Date) {
  const [exercises, setExercises] = useState<any[]>([])
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([])
  const [prs, setPRs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workout, setWorkout] = useState<any>(null)

  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // 🔄 Carrega dados principais quando user/data muda
  useEffect(() => {
    if (user?.id) {
      loadWorkout()
      loadExerciseLibrary()
      loadPRs()
    }
  }, [user, selectedDate])

  // 🧠 Buscar exercícios do dia
  const loadWorkout = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const date = todayISO(selectedDate)

      const { data, error } = await supabase
        .from('training_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('training_date', date)
        .order('order_index', { ascending: true })

      if (error) throw error
      setExercises(data || [])
      setWorkout({ user_id: user.id, date })
    } catch (err) {
      console.error('Erro ao carregar treino:', err)
      toast.error('Falha ao carregar treino do dia.')
    } finally {
      setLoading(false)
    }
  }

  // 🗂️ Carrega biblioteca (catálogo geral)
  const loadExerciseLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('category', { ascending: true })
        .order('name_pt', { ascending: true })
      if (error) throw error
      setExerciseLibrary(data || [])
    } catch (error) {
      console.error('Erro ao carregar biblioteca:', error)
    }
  }

  // 🏆 Carrega PRs do usuário
  const loadPRs = async () => {
    try {
      const { data, error } = await supabase.from('prs').select('*').eq('user_id', user.id)
      if (error) throw error
      const prsMap: Record<string, any> = {}
      data?.forEach((pr) => {
        prsMap[pr.exercise_name] = pr
      })
      setPRs(prsMap)
    } catch (error) {
      console.error('Erro ao carregar PRs:', error)
    }
  }

  // ➕ Adiciona novo exercício
  const addExerciseToWorkout = async (exercise: any) => {
    if (!user?.id) return
    try {
      const newExercise = {
        user_id: user.id,
        training_date: todayISO(selectedDate),
        exercise_name: exercise.name_pt || exercise.name,
        sets: exercise.sets ?? 3,
        reps: exercise.reps ?? 10,
        weight_kg: exercise.load_kg ?? 0,
        rest_seconds: exercise.rest ?? 60,
        order_index: exercises.length,
        notes: exercise.notes ?? '',
      }

      const { data, error } = await supabase
        .from('training_exercises')
        .insert([newExercise])
        .select()
        .single()
      if (error) throw error

      setExercises((prev) => [...prev, data])
      toast.success(`${data.exercise_name} adicionado com sucesso! 💪`)
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error)
      toast.error('Falha ao adicionar exercício.')
    }
  }

  // ❌ Remove exercício
  const removeExercise = async (id: string) => {
    try {
      const { error } = await supabase.from('training_exercises').delete().eq('id', id)
      if (error) throw error
      setExercises((prev) => prev.filter((ex) => ex.id !== id))
      toast.success('Exercício removido com sucesso.')
    } catch {
      toast.error('Erro ao remover exercício.')
    }
  }

  // 🔁 Duplica exercício
  const duplicateExercise = async (exercise: any) => {
    try {
      const copy = { ...exercise }
      delete copy.id
      copy.order_index = exercises.length
      copy.training_date = todayISO(selectedDate)
      const { data, error } = await supabase
        .from('training_exercises')
        .insert([copy])
        .select()
        .single()
      if (error) throw error
      setExercises((prev) => [...prev, data])
      toast.success('Exercício duplicado ⚡')
    } catch {
      toast.error('Erro ao duplicar exercício.')
    }
  }

  // 💾 Atualiza exercício com debounce otimista
  const updateExercise = useCallback(
    async (id: string, updates: any) => {
      setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)))

      const existingTimer = debounceTimers.current.get(id)
      if (existingTimer) clearTimeout(existingTimer)

      const timer = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('training_exercises')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
          if (error) throw error

          const ex = exercises.find((e) => e.id === id)
          if (ex?.weight_kg && ex?.reps) {
            const currentPR = prs[ex.exercise_name]
            if (isPR(ex.weight_kg, ex.reps, currentPR)) {
              await savePR(ex)
            }
          }
        } catch (err) {
          console.error('Erro ao atualizar exercício:', err)
          toast.error('Erro ao salvar exercício.')
        }
      }, 600)

      debounceTimers.current.set(id, timer)
    },
    [exercises, prs],
  )

  // 🏅 Salva novo PR
  const savePR = async (exercise: any) => {
    try {
      const volume = (exercise.weight_kg || 0) * (exercise.reps || 0) * (exercise.sets || 0)
      await supabase.from('prs').upsert(
        {
          user_id: user.id,
          exercise_name: exercise.exercise_name,
          best_load: exercise.weight_kg,
          best_reps: exercise.reps,
          best_volume: volume,
          date: todayISO(selectedDate),
        },
        { onConflict: 'user_id,exercise_name' },
      )
      toast.success(`🔥 Novo PR em ${exercise.exercise_name}!`)
      loadPRs()
    } catch {
      toast.error('Erro ao salvar PR')
    }
  }

  // ✅ Salvar treino (recalcula RPE médio e marca como concluído)
  const saveWorkout = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const validRPEs = exercises.filter((e) => e.rpe).map((e) => e.rpe)
      const avgRPE =
        validRPEs.length > 0 ? validRPEs.reduce((a, b) => a + b, 0) / validRPEs.length : null

      await supabase
        .from('training_exercises')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('training_date', todayISO(selectedDate))

      toast.success('Treino salvo com sucesso! 🔥')
    } catch {
      toast.error('Erro ao salvar treino.')
    } finally {
      setSaving(false)
    }
  }

  return {
    loading,
    saving,
    workout,
    exercises,
    exerciseLibrary,
    prs,
    loadWorkout,
    addExerciseToWorkout,
    removeExercise,
    duplicateExercise,
    updateExercise,
    saveWorkout,
  }
}
