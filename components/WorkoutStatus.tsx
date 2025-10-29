'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { toast } from 'sonner'

type Status = 'planned' | 'done' | 'missed'

export function WorkoutStatus({
  workoutId,
  initialStatus,
}: {
  workoutId: string
  initialStatus: Status
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [loading, setLoading] = useState(false)

  async function onChange(newStatus: Status) {
    try {
      setLoading(true)
      setStatus(newStatus)
      const { error } = await supabase
        .from('workouts')
        .update({ status: newStatus })
        .eq('id', workoutId)

      if (error) throw error
      toast.success(
        newStatus === 'done'
          ? '✅ Treino concluído!'
          : newStatus === 'missed'
          ? '❌ Treino perdido'
          : '📋 Treino planejado'
      )
    } catch (err) {
      toast.error('Erro ao atualizar status')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      {(['planned', 'done', 'missed'] as Status[]).map((v) => (
        <button
          key={v}
          disabled={loading}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-full border transition-all ${
            v === status
              ? v === 'done'
                ? 'bg-green-500 text-white border-green-500'
                : v === 'missed'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-orange-500 text-white border-orange-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          {v === 'planned'
            ? 'Planejado'
            : v === 'done'
            ? 'Concluído ✅'
            : 'Perdido ❌'}
        </button>
      ))}
    </div>
  )
}
