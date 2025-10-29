'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Flame, TrendingUp, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'

export default function PhoenixScoreCard() {
  const { user } = useAuth()
  const [score, setScore] = useState<number | null>(null)
  const [label, setLabel] = useState<string>('—')
  const [week, setWeek] = useState<string>('')

  useEffect(() => {
    if (!user) return
    const fetchScore = async () => {
      const { data, error } = await supabase
        .from('phoenix_score_view')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
      if (error) console.error(error)
      else if (data && data.length > 0) {
        const s = data[0].phoenix_score ?? 0
        setScore(Math.round(s))
        setWeek(
          format(new Date(data[0].week_start), "dd 'de' MMMM", {
            locale: ptBR,
          }),
        )
        if (s >= 85) setLabel('🔥 Excelente')
        else if (s >= 70) setLabel('💪 Muito bom')
        else if (s >= 50) setLabel('⚡ Regular')
        else setLabel('🌀 Precisa melhorar')
      }
    }
    fetchScore()
  }, [user])

  return (
    <Card className="rounded-xl border border-phoenix-amber/30 bg-gradient-to-br from-phoenix-amber/10 to-phoenix-gold/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Flame className="h-5 w-5 text-phoenix-amber" />
          Phoenix Score
        </h3>
        {week && <span className="text-xs text-muted-foreground">{week}</span>}
      </div>

      {score === null ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="text-center"
        >
          <div className="text-5xl font-bold text-phoenix-amber">{score}</div>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </motion.div>
      )}

      {score !== null && (
        <div className="mt-4 flex justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" /> Adesão
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" /> Volume
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-red-500" /> RPE
          </div>
        </div>
      )}
    </Card>
  )
}
