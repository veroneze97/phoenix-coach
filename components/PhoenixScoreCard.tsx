'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// util data local YYYY-MM-DD
function toISO(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

type Props = {
  userId: string
  date: Date
}

export default function PhoenixScoreCard({ userId, date }: Props) {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState(0)
  const [sets, setSets] = useState(0)
  const [volume, setVolume] = useState<number>(0)
  const [adherence, setAdherence] = useState(0) // 0–100

  useEffect(() => {
    let active = true
    const run = async () => {
      setLoading(true)
      try {
        if (!userId) {
          if (active) {
            setExercises(0); setSets(0); setVolume(0); setAdherence(0)
          }
          return
        }
        const iso = toISO(date)

        const { data, error } = await supabase
          .from('v_phoenix_score_daily')
          .select('exercises_count, sets_total, volume_kg_total')
          .eq('user_id', userId)
          .eq('training_date', iso)
          .maybeSingle()

        // NUNCA quebrar a UI: se tiver erro, zera e segue
        if (error) {
          console.warn('[PhoenixScore] erro fetch:', error.message)
          if (active) {
            setExercises(0); setSets(0); setVolume(0); setAdherence(0)
          }
          return
        }

        const ex = data?.exercises_count ?? 0
        const st = data?.sets_total ?? 0
        const vol = Number(data?.volume_kg_total ?? 0)

        if (active) {
          setExercises(ex)
          setSets(st)
          setVolume(vol)
          setAdherence(ex > 0 ? 100 : 0) // regra simples; ajuste se tiver outra
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [userId, date])

  return (
    <Card className="flex items-center justify-between rounded-xl border border-phoenix-amber/30 bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-phoenix-amber" />
        <div className="text-sm">
          <div className="font-semibold">Phoenix Score</div>
          <div className="text-xs text-muted-foreground">
            {loading ? 'Calculando…' : `Aderência: ${adherence}% • Sets: ${sets} • Volume: ${volume.toFixed(0)} kg`}
          </div>
        </div>
      </div>
      {!loading && (
        <div className="text-right">
          <div className="text-2xl font-bold">{adherence}%</div>
          <div className="text-xs text-muted-foreground">hoje</div>
        </div>
      )}
    </Card>
  )
}
