'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { format as dfFormat } from 'date-fns'
import { toast } from 'sonner'
import { Flame } from 'lucide-react'

type DayMetrics = {
  day: string
  status: 'planned' | 'done' | 'missed'
  adherence: number
  sets_total: number
  volume_total_kg: number
  phoenix_score: number
}

export default function PhoenixScoreCard({
  userId,
  date,
}: {
  userId: string
  date: Date
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DayMetrics | null>(null)

  const isoDate = useMemo(() => dfFormat(date, 'yyyy-MM-dd'), [date])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data, error } = await supabase.rpc('get_day_metrics', {
          p_user: userId,
          p_date: isoDate,
        })
        if (error) throw error

        // get_day_metrics retorna table; o supabase embala como array
        const row = Array.isArray(data) ? data[0] : data
        if (mounted) setData(row as DayMetrics)
      } catch (err) {
        console.error(err)
        toast.error('Não foi possível carregar o Phoenix Score do dia.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (userId && isoDate) load()
    return () => {
      mounted = false
    }
  }, [userId, isoDate])

  const score = Math.round(Number(data?.phoenix_score ?? 0))
  const adherencePct = Math.round((Number(data?.adherence ?? 0)) * 100)
  const sets = Number(data?.sets_total ?? 0)
  const volume = Number(data?.volume_total_kg ?? 0)
  const status = (data?.status ?? 'planned') as 'planned' | 'done' | 'missed'

  return (
    <Card className="flex items-center justify-between rounded-xl border bg-white/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative grid place-items-center">
          {/* círculo de progresso simples */}
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="6" fill="none" />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              className={`
                ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}
              `}
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - score / 100)}
            />
          </svg>
          <span className="absolute text-sm font-semibold">{score}</span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Phoenix Score</span>
            <StatusPill status={status} />
          </div>
          <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
            <span>Adesão: <strong className="text-foreground">{adherencePct}%</strong></span>
            <span>Sets: <strong className="text-foreground">{sets}</strong></span>
            <span>Volume: <strong className="text-foreground">{Intl.NumberFormat('pt-BR').format(volume)} kg</strong></span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Baseado em adesão (70%) + volume (30%)
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {loading ? (
          <span className="text-xs text-muted-foreground">Carregando…</span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-4 w-4 text-phoenix-amber" />
            {isoDate}
          </span>
        )}
      </div>
    </Card>
  )
}

function StatusPill({ status }: { status: 'planned' | 'done' | 'missed' }) {
  const map: Record<typeof status, { label: string; cls: string }> = {
    planned: { label: 'Planejado', cls: 'bg-amber-100 text-amber-700' },
    done: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
    missed: { label: 'Perdido', cls: 'bg-red-100 text-red-700' },
  }
  const s = map[status]
  return (
    <span className={`rounded-full px-2 py-[2px] text-[11px] ${s.cls}`}>
      {s.label}
    </span>
  )
}
