'use client'

import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useDebouncedSave } from '@/lib/useDebouncedSave'
import { useState } from 'react'

async function upsertWorkoutExercise(payload: any) {
  const { error } = await supabase.from('workout_exercises').upsert(payload)
  if (error) throw error
}

export function ExerciseRow({ row }: { row: any }) {
  const { saving, debouncedSave } = useDebouncedSave(upsertWorkoutExercise)
  const [local, setLocal] = useState(row)

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-2 bg-white/60 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{local.exercise_name}</p>
        <span className="text-xs text-muted-foreground">
          {saving ? 'Salvando…' : 'Salvo ✅'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          className="border rounded-lg px-2 py-1"
          type="number"
          value={local.sets ?? 3}
          onChange={(e) => {
            const sets = Number(e.target.value)
            setLocal({ ...local, sets })
            debouncedSave({ ...local, sets })
          }}
        />
        <input
          className="border rounded-lg px-2 py-1"
          type="number"
          value={local.reps ?? 10}
          onChange={(e) => {
            const reps = Number(e.target.value)
            setLocal({ ...local, reps })
            debouncedSave({ ...local, reps })
          }}
        />
        <input
          className="border rounded-lg px-2 py-1"
          type="number"
          step="0.5"
          value={local.weight_kg ?? 0}
          onChange={(e) => {
            const weight_kg = Number(e.target.value)
            setLocal({ ...local, weight_kg })
            debouncedSave({ ...local, weight_kg })
          }}
        />
      </div>
    </div>
  )
}
