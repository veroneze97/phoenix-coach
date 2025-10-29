'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface WeeklyProgressCardProps {
  userId: string
  exerciseId?: string
}

interface WeeklyItem {
  week_start: string
  volume_total_kg: number
  max_weight_kg: number
}

export default function WeeklyProgressCard({ userId, exerciseId }: WeeklyProgressCardProps) {
  const [data, setData] = useState<WeeklyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('v_exercise_history_daily').select('*').eq('user_id', userId)
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      // Agrupar por semana
      const grouped = new Map<string, { volume: number; max: number }>()
      data.forEach((row) => {
        if (exerciseId && row.exercise_id !== exerciseId) return
        const week = startOfWeek(new Date(row.day), { weekStartsOn: 1 })
        const key = format(week, 'yyyy-MM-dd')
        if (!grouped.has(key)) grouped.set(key, { volume: 0, max: 0 })
        const g = grouped.get(key)!
        g.volume += row.volume_total_kg
        g.max = Math.max(g.max, row.max_weight_kg)
      })

      const arr: WeeklyItem[] = Array.from(grouped.entries()).map(([week_start, g]) => ({
        week_start,
        volume_total_kg: g.volume,
        max_weight_kg: g.max,
      }))

      arr.sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime())
      setData(arr)
      setLoading(false)
    }
    fetchData()
  }, [userId, exerciseId])

  const lastWeek = data[data.length - 1]
  const prevWeek = data[data.length - 2]
  const volumeChange =
    lastWeek && prevWeek
      ? ((lastWeek.volume_total_kg - prevWeek.volume_total_kg) / prevWeek.volume_total_kg) * 100
      : 0
  const trendPositive = volumeChange >= 0

  if (loading)
    return (
      <Card className="border border-phoenix-amber/20">
        <CardContent className="flex h-[180px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-phoenix-amber" />
          Carregando progresso semanal...
        </CardContent>
      </Card>
    )

  if (!data.length)
    return (
      <Card className="border border-phoenix-amber/20">
        <CardContent className="flex h-[180px] items-center justify-center text-muted-foreground">
          Nenhum dado semanal encontrado.
        </CardContent>
      </Card>
    )

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-gradient-to-b from-phoenix-gold/5 to-transparent border border-phoenix-gold/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            📈 Progresso Semanal
          </CardTitle>
          {lastWeek && prevWeek && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                trendPositive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trendPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {volumeChange.toFixed(1)}%
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <XAxis
                dataKey="week_start"
                tickFormatter={(d) =>
                  format(new Date(d), "dd/MM", { locale: ptBR })
                }
                stroke="#9ca3af"
                fontSize={11}
              />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip
                labelFormatter={(v) => format(new Date(v), "dd 'de' MMMM", { locale: ptBR })}
                formatter={(v: any, n: any) =>
                  n === 'volume_total_kg'
                    ? [`${v.toFixed(0)} kg`, 'Volume total']
                    : [`${v.toFixed(0)} kg`, 'Carga máxima']
                }
              />
              <Bar dataKey="volume_total_kg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="max_weight_kg" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {lastWeek && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <div className="text-muted-foreground">Volume semanal</div>
                <div className="font-semibold">{lastWeek.volume_total_kg.toFixed(0)} kg</div>
              </div>
              <div>
                <div className="text-muted-foreground">Carga máx.</div>
                <div className="font-semibold text-phoenix-amber">
                  {lastWeek.max_weight_kg.toFixed(0)} kg
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
