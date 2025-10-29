'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { isPR } from '@/lib/workout-helpers'

/** Normaliza data local para YYYY-MM-DD */
function todayISO(date: Date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

/** ---- Adapters: DB <-> UI ---------------------------------------
 * UI espera: { id, name, sets, reps, load_kg, rest, rpe?, notes, order_index, exercise_name? }
 * DB tem:    { id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, order_index, user_id, training_date }
 */
function dbRowToUI(row: any) {
  return {
    ...row,
    name: row.exercise_name,             // compat para componentes que usam "name"
    load_kg: row.weight_kg ?? 0,
    rest: row.rest_seconds ?? 60,
    rpe: row.rpe ?? null,                // pode não existir na tabela; mantemos no estado
  }
}

function uiUpdatesToDB(upd: any) {
  const out: any = { ...upd }
  if ('name' in out && !('exercise_name' in out)) out.exercise_name = out.name
  if ('load_kg' in out && !('weight_kg' in out)) out.weight_kg = out.load_kg
  if ('rest' in out && !('rest_seconds' in out)) out.rest_seconds = out.rest
  // Remover aliases de UI para não quebrar o update no DB:
  delete out.name
  delete out.load_kg
  delete out.rest
  delete out.rpe // rpe não existe no DB por padrão; se quiser persistir, adicione a coluna
  return out
}

export function useWorkout(user: any, selectedDate: Date) {
  const [exercises, setExercises] = useState<any[]>([])
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([])
  const [prs, setPRs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workout, setWorkout] = useState<any>(null)

  const debounceTimers = useRef<Map<string | number, NodeJS.Timeout>>(new Map())

  /** ===== Loaders memoizados (evita loop no TrainingEditor) ===== */
  const loadWorkout = useCallback(async () => {
    setLoading(true)
    try {
      if (!user?.id) {
        setExercises([])
        setWorkout(null)
        return
      }
      const date = todayISO(selectedDate)
      const { data, error } = await supabase
        .from('training_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('training_date', date)
        .order('order_index', { ascending: true })

      if (error) throw error
      // adapta todos os rows para o shape esperado pela UI
      setExercises((data || []).map(dbRowToUI))
      setWorkout({ user_id: user.id, date })
    } catch (err) {
      console.error('Erro ao carregar treino:', err)
      toast.error('Falha ao carregar treino do dia.')
      setExercises([])
      setWorkout(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedDate])

  const loadExerciseLibrary = useCallback(async () => {
    try {
      if (!user?.id) return
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
  }, [user?.id])

  const loadPRs = useCallback(async () => {
    try {
      if (!user?.id) return
      const { data, error } = await supabase.from('prs').select('*').eq('user_id', user.id)
      if (error) throw error
      const map: Record<string, any> = {}
      data?.forEach((pr) => {
        map[pr.exercise_name] = pr
      })
      setPRs(map)
    } catch (error) {
      console.error('Erro ao carregar PRs:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      loadWorkout()
      loadExerciseLibrary()
      loadPRs()
    } else {
      setLoading(false)
    }
  }, [user, selectedDate, loadWorkout, loadExerciseLibrary, loadPRs])

  /** ===== Mutations ===== */

  // Adiciona a partir da biblioteca (ou objeto similar)
  const addExerciseToWorkout = async (exercise: any) => {
    if (!user?.id) return
    try {
      const payloadDB = {
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
        .insert([payloadDB])
        .select()
        .single()
      if (error) throw error

      // adiciona em memória já no formato da UI
      setExercises((prev) => [...prev, dbRowToUI(data)])
      toast.success(`${payloadDB.exercise_name} adicionado! 💪`)
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error)
      toast.error('Falha ao adicionar exercício.')
    }
  }

  const removeExercise = async (id: string) => {
    try {
      const { error } = await supabase.from('training_exercises').delete().eq('id', id)
      if (error) throw error
      setExercises((prev) => prev.filter((ex) => ex.id !== id))
      toast.success('Exercício removido.')
    } catch {
      toast.error('Erro ao remover exercício.')
    }
  }

  const duplicateExercise = async (exercise: any) => {
    try {
      // converter para o shape do DB antes de duplicar
      const copyDB = {
        user_id: user.id,
        training_date: todayISO(selectedDate),
        exercise_name: exercise.exercise_name || exercise.name,
        sets: exercise.sets ?? 3,
        reps: exercise.reps ?? 10,
        weight_kg: exercise.load_kg ?? exercise.weight_kg ?? 0,
        rest_seconds: exercise.rest ?? exercise.rest_seconds ?? 60,
        order_index: exercises.length,
        notes: exercise.notes ?? '',
      }

      const { data, error } = await supabase
        .from('training_exercises')
        .insert([copyDB])
        .select()
        .single()
      if (error) throw error

      setExercises((prev) => [...prev, dbRowToUI(data)])
      toast.success('Exercício duplicado ⚡')
    } catch {
      toast.error('Erro ao duplicar exercício.')
    }
  }

  const updateExercise = useCallback(
    async (id: string, updates: any) => {
      // aplica otimista na UI
      setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)))

      const existingTimer = debounceTimers.current.get(id)
      if (existingTimer) clearTimeout(existingTimer)

      const timer = setTimeout(async () => {
        try {
          const dbUpd = uiUpdatesToDB(updates)
          const { error } = await supabase
            .from('training_exercises')
            .update({ ...dbUpd, updated_at: new Date().toISOString() })
            .eq('id', id)
          if (error) throw error

          // PR check (usa aliases seguros)
          const ex = exercises.find((e) => e.id === id)
          const w = (ex?.load_kg ?? ex?.weight_kg) as number | undefined
          const r = ex?.reps as number | undefined
          const name = ex?.exercise_name || ex?.name
          if (w && r && name) {
            const currentPR = prs[name]
            if (isPR(w, r, currentPR)) {
              await savePR({ ...ex, exercise_name: name, weight_kg: w })
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

  const savePR = async (exercise: any) => {
    try {
      const name = exercise.exercise_name || exercise.name
      const weight = exercise.weight_kg ?? exercise.load_kg ?? 0
      const volume = weight * (exercise.reps || 0) * (exercise.sets || 0)

      await supabase.from('prs').upsert(
        {
          user_id: user.id,
          exercise_name: name,
          best_load: weight,
          best_reps: exercise.reps,
          best_volume: volume,
          date: todayISO(selectedDate),
        },
        { onConflict: 'user_id,exercise_name' },
      )
      toast.success(`🔥 Novo PR em ${name}!`)
      loadPRs()
    } catch {
      toast.error('Erro ao salvar PR')
    }
  }

  const saveWorkout = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
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
