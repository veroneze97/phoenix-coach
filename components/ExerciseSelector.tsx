'use client'

import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Option = { id: string; label: string }

export default function ExerciseSelector({
  exercises,          // array do dia: { exercise_id, name, name_pt } (qualquer forma com essas props)
  value,
  onChange,
}: {
  exercises: Array<{ exercise_id: string; name?: string; name_pt?: string }>
  value?: string
  onChange: (id: string) => void
}) {
  const options: Option[] = useMemo(() => {
    const seen = new Set<string>()
    return exercises
      .filter(e => !!e.exercise_id && !seen.has(e.exercise_id) && seen.add(e.exercise_id))
      .map(e => ({ id: String(e.exercise_id), label: e.name_pt || e.name || 'Exercício' }))
  }, [exercises])

  if (options.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Exercício:</span>
      <Select value={value} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Selecionar exercício" />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
