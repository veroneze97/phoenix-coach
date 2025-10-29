'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Flame } from 'lucide-react'

interface ScorePoint {
  week_start: string
  phoenix_score: number
}

export default function PhoenixScoreHistory() {
  const { user } = useAuth()
  const [data, setData] = useState<ScorePoint[]>([])
  const [avg, setAvg] = useState<number>(0)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('phoenix_score_history_view')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: true })
      if (error) console.error(error)
      else if (data && data.length > 0) {
        const formatted = data.slice(-8).map((d) => ({
          week_start: format(new Date(d.week_start), 'dd/MM', { locale: ptBR }),
          phoenix_score: Math.round(d.phoenix_score),
        }))
        setData(formatted)
        const avgScore =
          formatted.reduce((acc, cur) => acc + cur.phoenix_score, 0) / formatted.length
        setAvg(Math.round(avgScore))
      }
    }
    fetchData()
  }, [user])

  return (
    <Card className="rounded-xl border border-phoenix-amber/30 bg-gradient-to-br from-phoenix-amber/5 to-phoenix-gold/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Flame className="h-5 w-5 text-phoenix-amber" />
          Histórico Phoenix Score
        </h3>
        <span className="text-xs text-muted-foreground">Média {avg || '–'}</span>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhum dado ainda 🔥</p>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week_start" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="phoenix_score"
                stroke="#EFB810"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
