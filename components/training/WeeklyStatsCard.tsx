'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Flame, BarChart3, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function WeeklyStatsCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('weekly_stats_view')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)

      if (error) console.error(error)
      else setStats(data[0])
      setLoading(false)
    }
    fetchStats()
  }, [user])

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-4 text-muted-foreground">
        Carregando estatísticas...
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        Nenhum treino registrado nesta semana.
      </Card>
    )
  }

  const weekLabel = `${format(new Date(stats.week_start), "dd 'de' MMMM", {
    locale: ptBR,
  })} – semana atual`

  return (
    <Card className="rounded-xl border border-phoenix-amber/30 bg-gradient-to-br from-phoenix-amber/10 to-phoenix-gold/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-phoenix-amber" />
          Desempenho semanal
        </h3>
        <span className="text-xs text-muted-foreground">{weekLabel}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div>
          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          <p className="text-sm font-medium">{stats.workouts_done}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
        <div>
          <XCircle className="mx-auto h-5 w-5 text-red-600" />
          <p className="text-sm font-medium">{stats.workouts_missed}</p>
          <p className="text-xs text-muted-foreground">Perdidos</p>
        </div>
        <div>
          <Flame className="mx-auto h-5 w-5 text-orange-500" />
          <p className="text-sm font-medium">{stats.total_volume} kg</p>
          <p className="text-xs text-muted-foreground">Volume total</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-phoenix-amber">{stats.adherence_percent}%</p>
          <p className="text-xs text-muted-foreground">Adesão</p>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground">
        RPE médio: <strong>{stats.avg_rpe ?? '–'}</strong>
      </div>
    </Card>
  )
}
