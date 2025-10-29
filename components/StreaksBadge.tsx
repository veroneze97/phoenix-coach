'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { addDays, differenceInCalendarDays, eachDayOfInterval, endOfDay, format, startOfDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy, Flame, CalendarDays } from 'lucide-react'

type WRow = { workout_date: string; status: 'planned' | 'done' | 'missed' }

export default function StreaksBadge({
  userId,
  anchorDate,     // geralmente a data selecionada no TrainingEditor
  windowDays = 30 // janela de análise
}: {
  userId: string
  anchorDate: Date
  windowDays?: number
}) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<WRow[]>([])

  const startDate = useMemo(() => startOfDay(subDays(anchorDate, windowDays - 1)), [anchorDate, windowDays])
  const endDate   = useMemo(() => endOfDay(anchorDate), [anchorDate])
  const startStr  = useMemo(() => format(startDate, 'yyyy-MM-dd'), [startDate])
  const endStr    = useMemo(() => format(endDate, 'yyyy-MM-dd'), [endDate])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .select('workout_date,status')
        .eq('user_id', userId)
        .gte('workout_date', startStr)
        .lte('workout_date', endStr)
        .order('workout_date', { ascending: true })

      if (error) {
        console.error(error)
        if (mounted) setRows([])
      } else if (mounted) {
        // tipagem coerente
        setRows((data ?? []).map(d => ({
          workout_date: d.workout_date as string,
          status: (d.status ?? 'planned') as WRow['status']
        })))
      }
      if (mounted) setLoading(false)
    }
    if (userId) load()
    return () => { mounted = false }
  }, [userId, startStr, endStr])

  // Mapa rápido de status por dia (ISO)
  const statusByDay = useMemo(() => {
    const m = new Map<string, WRow['status']>()
    for (const r of rows) m.set(r.workout_date, r.status)
    return m
  }, [rows])

  // Consideramos que conta para streak apenas 'done'
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate])

  const { currentStreak, bestStreak } = useMemo(() => {
    let cur = 0
    let best = 0
    // calculamos varrendo do passado -> presente para best, e do presente para o passado para current
    // best
    let tmp = 0
    for (const d of days) {
      const iso = format(d, 'yyyy-MM-dd')
      const s = statusByDay.get(iso)
      if (s === 'done') { tmp += 1; best = Math.max(best, tmp) } else { tmp = 0 }
    }
    // current (contínuo até anchorDate)
    cur = 0
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i]
      const iso = format(d, 'yyyy-MM-dd')
      const s = statusByDay.get(iso)
      if (s === 'done') cur += 1
      else break
    }
    return { currentStreak: cur, bestStreak: best }
  }, [days, statusByDay])

  // Medalhas por bestStreak (ajuste à vontade)
  const medal = useMemo(() => {
    if (bestStreak >= 30) return { label: 'Lendário (30+)', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (bestStreak >= 14) return { label: 'Ouro (14+)',     color: 'text-amber-600',  bg: 'bg-amber-100' }
    if (bestStreak >= 7)  return { label: 'Prata (7+)',     color: 'text-slate-600',  bg: 'bg-slate-200' }
    if (bestStreak >= 3)  return { label: 'Bronze (3+)',    color: 'text-orange-700', bg: 'bg-orange-100' }
    return { label: 'Iniciante', color: 'text-gray-600', bg: 'bg-gray-100' }
  }, [bestStreak])

  // Mini grade de 7 dias (última semana) com ícones ✅ ❌ ⏳
  const last7 = useMemo(() => {
    const end = anchorDate
    const start = subDays(end, 6)
    const week = eachDayOfInterval({ start, end })
    return week.map(d => {
      const iso = format(d, 'yyyy-MM-dd')
      const s = statusByDay.get(iso) ?? 'planned'
      return {
        date: d,
        iso,
        status: s,
        icon: s === 'done' ? '✅' : s === 'missed' ? '❌' : '⏳',
      }
    })
  }, [anchorDate, statusByDay])

  return (
    <Card className="rounded-xl border bg-white/70 px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Esquerda: contadores de streak */}
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-full ${medal.bg}`}>
            <Trophy className={`h-5 w-5 ${medal.color}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-muted-foreground">Streak atual</span>
              <span className="text-xl font-semibold">{currentStreak}🔥</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Melhor sequência: <strong className="text-foreground">{bestStreak} dias</strong> • Medalha: <strong className={`${medal.color}`}>{medal.label}</strong>
            </div>
          </div>
        </div>

        {/* Direita: última semana */}
        <div className="mt-2 flex items-center gap-3 md:mt-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> Últimos 7 dias
          </span>
          <div className="flex items-center gap-2">
            {last7.map(item => (
              <div key={item.iso} className="flex flex-col items-center text-xs">
                <span className="text-[11px] text-muted-foreground">
                  {format(item.date, 'EE', { locale: ptBR }).charAt(0).toUpperCase()}
                </span>
                <span
                  className={`
                    text-base leading-none
                    ${item.status === 'done' ? 'text-green-600' : item.status === 'missed' ? 'text-red-500' : 'text-gray-400'}
                  `}
                  title={`${format(item.date, "dd/MM")} – ${item.status}`}
                >
                  {item.icon}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hint inferior opcional */}
      {!loading && currentStreak > 0 && (
        <div className="mt-2 text-[11px] text-gray-500">
          Dica: manter a cadeia ativa aumenta seu Phoenix Score por consistência semanal.
        </div>
      )}
      {!loading && currentStreak === 0 && (
        <div className="mt-2 text-[11px] text-gray-500">
          Comece hoje: conclua o treino para iniciar uma nova sequência.
        </div>
      )}
    </Card>
  )
}
