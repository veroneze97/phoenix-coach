'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Loader2, Trophy, BarChart2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface ExerciseHistoryCardProps {
  userId: string
  exerciseId: string
}

interface HistoryItem {
  day: string
  sets_total: number
  reps_total: number
  volume_total_kg: number
  max_weight_kg: number
  running_max_weight_kg: number
  is_pr: boolean
}

export default function ExerciseHistoryCard({ userId, exerciseId }: ExerciseHistoryCardProps) {
  const [data, setData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !exerciseId) return
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_exercise_history', {
        p_user: userId,
        p_exercise_id: exerciseId,
        p_days: 90,
      })
      if (error) console.error(error)
      else setData(data || [])
      setLoading(false)
    }
    fetchData()
  }, [userId, exerciseId])

  if (loading)
    return (
      <Card className="border border-phoenix-amber/20">
        <CardContent className="flex h-[180px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-phoenix-amber" />
          Carregando histórico...
        </CardContent>
      </Card>
    )

  if (!data.length)
    return (
      <Card className="border border-phoenix-amber/20">
        <CardContent className="flex h-[180px] items-center justify-center text-muted-foreground">
          Nenhum histórico encontrado.
        </CardContent>
      </Card>
    )

  const last = data[data.length - 1]
  const prs = data.filter((d) => d.is_pr)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-gradient-to-b from-phoenix-amber/5 to-transparent border border-phoenix-amber/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-phoenix-amber" />
            Histórico do Exercício
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Último PR:{' '}
            {prs.length > 0
              ? format(new Date(prs[prs.length - 1].day), "dd/MM", { locale: ptBR })
              : '—'}
          </span>
        </CardHeader>

        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickFormatter={(d) =>
                  format(new Date(d), 'dd/MM', { locale: ptBR })
                }
                stroke="#9ca3af"
                fontSize={11}
              />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip
                labelFormatter={(v) =>
                  format(new Date(v), "dd 'de' MMMM", { locale: ptBR })
                }
                formatter={(v: any, n: any) => {
                  if (n === 'volume_total_kg') return [`${v.toFixed(0)} kg`, 'Volume']
                  if (n === 'max_weight_kg') return [`${v.toFixed(0)} kg`, 'Carga Máx.']
                  return [v, n]
                }}
              />
              <Area
                type="monotone"
                dataKey="volume_total_kg"
                stroke="#f59e0b"
                fill="url(#colorVolume)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Últimos dados resumidos */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground">Volume</div>
              <div className="font-semibold">{last.volume_total_kg.toFixed(0)} kg</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sets</div>
              <div className="font-semibold">{last.sets_total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Máx. Carga</div>
              <div className="font-semibold text-phoenix-amber">
                {last.max_weight_kg.toFixed(0)} kg
              </div>
            </div>
          </div>

          {/* Lista de PRs */}
          {prs.length > 0 && (
            <div className="mt-4 border-t border-phoenix-amber/20 pt-2">
              <div className="text-xs mb-1 text-muted-foreground">🏆 PRs recentes:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {prs.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-phoenix-amber/40 bg-phoenix-amber/10 px-2 py-0.5 font-medium text-phoenix-amber flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    {format(new Date(p.day), 'dd/MM', { locale: ptBR })} —{' '}
                    {p.max_weight_kg.toFixed(0)} kg
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
