'use client'

import { motion } from 'framer-motion'
import { Save, Dumbbell, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

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
  const weekday = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const formattedDay = weekday.replace(/^\w/, (c) => c.toUpperCase())

  const progress = Math.min((completedDays / totalWeekDays) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-card sticky top-0 z-40 border-phoenix-amber/30 shadow-md backdrop-blur-md">
        <CardHeader className="flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-phoenix-amber" />
              <CardTitle className="text-lg sm:text-xl">{formattedDay}</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {exercisesCount} {exercisesCount === 1 ? 'exercício' : 'exercícios'} no treino de hoje
            </CardDescription>
          </div>

          <Button
            onClick={onSave}
            disabled={saving || exercisesCount === 0}
            className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white shadow-sm transition-all hover:opacity-90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardHeader>

        <div className="px-6 pb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Semana</span>
            <span>
              {completedDays}/{totalWeekDays} dias
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </div>

        {completedDays === totalWeekDays && (
          <motion.div
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-phoenix-amber"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Flame className="h-4 w-4 animate-pulse" />
            Semana completa! Excelente consistência 🔥
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
