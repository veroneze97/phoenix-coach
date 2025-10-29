'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Dumbbell, Flame, Trophy, CheckCircle2, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface WorkoutHeaderProps {
  selectedDate: Date
  exercisesCount: number
  totalWeekDays: number
  completedDays: number
  onSave: () => void
  saving: boolean
}

export default function WorkoutHeader({
  selectedDate,
  exercisesCount,
  totalWeekDays = 5,
  completedDays = 0,
  onSave,
  saving,
}: WorkoutHeaderProps) {
  const [justSaved, setJustSaved] = useState(false)
  const wasSaving = useRef<boolean>(false)

  // Marca "Salvo!" quando saving muda de true -> false
  useEffect(() => {
    if (wasSaving.current && !saving) {
      setJustSaved(true)
      const t = setTimeout(() => setJustSaved(false), 1800)
      return () => clearTimeout(t)
    }
    wasSaving.current = saving
  }, [saving])

  // Formatação do dia
  const formattedDay = useMemo(() => {
    const weekday = selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return weekday.replace(/^\w/, (c) => c.toUpperCase())
  }, [selectedDate])

  // Progresso e cores dinâmicas
  const progress = Math.min((completedDays / Math.max(totalWeekDays, 1)) * 100, 100)
  const tone =
    progress >= 80 ? 'green' : progress >= 50 ? 'amber' : 'red' // cor de status da semana

  const barGradient =
    tone === 'green'
      ? 'from-green-500 to-emerald-400'
      : tone === 'amber'
      ? 'from-phoenix-amber to-phoenix-gold'
      : 'from-red-500 to-rose-500'

  // Cálculo simples de XP semanal (ajuste à vontade)
  const xp = Math.max(0, Math.floor(completedDays * 120 + exercisesCount * 15))

  // Micro-indicadores dos dias da semana (preenchidos até completedDays)
  const dayDots = Array.from({ length: totalWeekDays }, (_, i) => i < completedDays)

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className="glass-card sticky top-0 z-40 border border-phoenix-amber/30 shadow-md backdrop-blur-md">
        <CardHeader className="flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
          {/* Título e subtítulo */}
          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-phoenix-amber" />
              <CardTitle className="text-lg sm:text-xl">{formattedDay}</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {exercisesCount} {exercisesCount === 1 ? 'exercício' : 'exercícios'} no treino de hoje
            </CardDescription>
          </div>

          {/* Botão Salvar com feedback de estado */}
          <div className="flex items-center gap-2">
            {justSaved && (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="hidden text-sm font-medium text-green-600 sm:inline-flex"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Salvo!
              </motion.span>
            )}
            <Button
              onClick={onSave}
              disabled={saving || exercisesCount === 0}
              className={`bg-gradient-to-r ${barGradient} text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-70`}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>

        {/* Barra de progresso + meta info */}
        <div className="px-6 pb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              Semana
            </span>
            <span>
              {completedDays}/{totalWeekDays} dias
            </span>
          </div>

          {/* Progress visual com animação de preenchimento */}
          <div className="relative">
            <Progress value={progress} className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className={`h-full bg-gradient-to-r ${barGradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </Progress>

            {/* Etiqueta flutuante com % */}
            <motion.span
              className="pointer-events-none absolute -top-6 select-none rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ left: `calc(${Math.max(progress, 6)}% - 24px)` }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>

          {/* Micro-indicadores dos dias */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {dayDots.map((filled, idx) => (
                <motion.span
                  key={idx}
                  className={`h-2.5 w-2.5 rounded-full ${
                    filled
                      ? tone === 'green'
                        ? 'bg-emerald-500'
                        : tone === 'amber'
                        ? 'bg-phoenix-amber'
                        : 'bg-rose-500'
                      : 'bg-gray-300'
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.04 }}
                  title={`Dia ${idx + 1} ${filled ? 'concluído' : 'pendente'}`}
                />
              ))}
            </div>

            {/* XP da semana */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <Trophy className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-yellow-700">+{xp} XP</span>
            </div>
          </div>
        </div>

        {/* Mensagem de semana completa */}
        {completedDays === totalWeekDays && (
          <motion.div
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-phoenix-amber"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Flame className="h-4 w-4 animate-pulse" />
            Semana completa! Excelente consistência 🔥
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
