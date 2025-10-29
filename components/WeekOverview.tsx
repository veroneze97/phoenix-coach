'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type DayData = { date: Date; status: string }

export default function WeekOverview({ userId, anchorDate }: { userId: string; anchorDate: Date }) {
  const [week, setWeek] = useState<DayData[]>([])

  useEffect(() => {
    async function fetchWeek() {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 }) // segunda
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
      const startStr = format(days[0], 'yyyy-MM-dd')
      const endStr = format(days[6], 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('workouts')
        .select('workout_date,status')
        .eq('user_id', userId)
        .gte('workout_date', startStr)
        .lte('workout_date', endStr)

      if (error) console.error(error)

      const map = new Map(data?.map((d) => [d.workout_date, d.status]))
      setWeek(days.map((d) => ({ date: d, status: map.get(format(d, 'yyyy-MM-dd')) ?? 'planned' })))
    }

    if (userId) fetchWeek()
  }, [userId, anchorDate])

  return (
    <div className="flex justify-between items-center rounded-xl border px-3 py-2 bg-white/70">
      {week.map((d) => (
        <div key={d.date.toISOString()} className="flex flex-col items-center text-xs">
          <span className="text-muted-foreground">
            {format(d.date, 'EE', { locale: ptBR }).charAt(0).toUpperCase()}
          </span>
          <span
            className={`text-lg ${
              d.status === 'done'
                ? 'text-green-600'
                : d.status === 'missed'
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {d.status === 'done' ? '✅' : d.status === 'missed' ? '❌' : '⏳'}
          </span>
        </div>
      ))}
    </div>
  )
}
