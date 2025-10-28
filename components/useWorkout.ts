'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { isPR } from '@/lib/workout-helpers'

/**
 * Hook responsável por gerenciar todo o ciclo de vida do treino:
 * - Cria ou busca treino do dia
 * - Carrega exercícios, PRs e biblioteca
 * - Faz salvamento otimista com debounce
 * - Gera feedbacks automáticos (PR, sucesso, erro)
 */
export function useWorkout(user: any, selectedDate: Date) {
  const [workout, setWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([])
  const [prs, setPRs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // 🔄 Carrega tudo ao iniciar
  useEffect(() => {
    if (user) {
      loadWorkout()
      loadExerciseLibrary()
      loadPRs()
    }
  }, [user, selectedDate])

  // 🧠 Buscar ou criar treino do dia
  const loadWorkout = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (workoutData) {
        setWorkout(workoutData)
        const { data: exercisesData } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workoutData.id)
          .order('order_index', { ascending: true })
        setExercises(exercisesData || [])
      } else {
        const { data: newWorkout } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            date: dateStr,
            title: 'Treino',
            completed: false,
          })
          .select()
          .single()
        setWorkout(newWorkout)
      }
    } catch (error) {
      console.error('Erro ao carregar treino:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🗂️ Carrega biblioteca de exercícios
  const loadExerciseLibrary = async () => {
    try {
      const { data } = await supabase
        .from('exercise_library')
        .select('*')
        .order('category', { ascending: true })
        .order('name_pt', { ascending: true })
      setExerciseLibrary(data || [])
    } catch (error) {
      console.error('Erro ao carregar biblioteca:', error)
    }
  }

  // 🏆 Carrega PRs
  const loadPRs = async () => {
    try {
      const { data } = await supabase
        .from('prs')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        const prsMap: Record<string, any> = {}
        data.forEach((pr) => {
          prsMap[pr.exercise_name] = pr
        })
        setPRs(prsMap)
      }
    } catch (error) {
      console.error('Erro ao carregar PRs:', error)
    }
  }

  // ➕ Adiciona novo exercício
  const addExerciseToWorkout = async (exerciseFromLibrary: any) => {
    if (!workout) return
    try {
      const newExercise = {
        workout_id: workout.id,
        exercise_library_id: exerciseFromLibrary.id,
        name: exerciseFromLibrary.name_pt || exerciseFromLibrary.name,
        order_index: exercises.length,
        sets: 3,
        reps: 10,
        load_kg: 0,
        rest_s: 60,
        rpe: 7,
        notes: '',
        is_custom: false,
      }
      const { data, error } = await supabase
        .from('exercises')
        .insert(newExercise)
        .select()
        .single()
      if (error) throw error
      setExercises([...exercises, data])
      toast.success(`${data.name} adicionado! 💪`)
    } catch (error) {
      toast.error('Erro ao adicionar exercício')
    }
  }

  // ❌ Remove exercício
  const removeExercise = async (id: number) => {
    try {
      await supabase.from('exercises').delete().eq('id', id)
      setExercises((prev) => prev.filter((ex) => ex.id !== id))
      toast.success('Exercício removido')
    } catch {
      toast.error('Erro ao remover exercício')
    }
  }

  // 🔁 Duplicar exercício
  const duplicateExercise = async (exercise: any) => {
    try {
      const copy = { ...exercise }
      delete copy.id
      copy.order_index = exercises.length
      const { data, error } = await supabase
        .from('exercises')
        .insert(copy)
        .select()
        .single()
      if (error) throw error
      setExercises((prev) => [...prev, data])
      toast.success('Exercício duplicado ⚡')
    } catch {
      toast.error('Erro ao duplicar exercício')
    }
  }

  // 💾 Atualiza exercício com debounce otimista
  const updateExercise = useCallback(
    async (id: number, updates: any) => {
      setExercises((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
      )

      // Debounce
      const existingTimer = debounceTimers.current.get(id)
      if (existingTimer) clearTimeout(existingTimer)

      const timer = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('exercises')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
          if (error) throw error

          // PR check
          const ex = exercises.find((e) => e.id === id)
          if (ex?.load_kg && ex?.reps) {
            const currentPR = prs[ex.name]
            if (isPR(ex.load_kg, ex.reps, currentPR)) {
              await savePR(ex)
            }
          }
        } catch (err) {
          toast.error('Erro ao atualizar exercício')
        }
      }, 500)

      debounceTimers.current.set(id, timer)
    },
    [exercises, prs]
  )

  // 🏅 Salva PR
  const savePR = async (exercise: any) => {
    try {
      const volume = exercise.load_kg * exercise.reps * exercise.sets
      await supabase.from('prs').upsert(
        {
          user_id: user.id,
          exercise_name: exercise.name,
          best_load: exercise.load_kg,
          best_reps: exercise.reps,
          best_volume: volume,
          date: workout.date,
          workout_id: workout.id,
        },
        { onConflict: 'user_id,exercise_name' }
      )
      toast.success(`🔥 Novo PR em ${exercise.name}!`)
      loadPRs()
    } catch {
      toast.error('Erro ao salvar PR')
    }
  }

  // ✅ Salvar treino completo
  const saveWorkout = async () => {
    if (!workout) return
    setSaving(true)
    try {
      const validRPEs = exercises.filter((e) => e.rpe).map((e) => e.rpe)
      const avgRPE =
        validRPEs.length > 0
          ? validRPEs.reduce((a, b) => a + b, 0) / validRPEs.length
          : null
      await supabase
        .from('workouts')
        .update({
          rpe_avg: avgRPE,
          completed: exercises.length > 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workout.id)
      toast.success('Treino salvo com sucesso! 🔥')
    } catch {
      toast.error('Erro ao salvar treino')
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
