'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  GripVertical,
  Hash,
  Weight,
  Zap,
  Timer,
  X,
  ChevronDown,
  ChevronUp,
  Trophy,
  Copy,
  Play,
  Pause,
} from 'lucide-react'
import { toast } from 'sonner'
import { getRPEDescription, isPR, formatRestTime } from '@/lib/workout-helpers'

interface ExerciseCardProps {
  exercise: any
  index: number
  currentPR?: any
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: any) => void
  onRemove: () => void
  onDuplicate: () => void
}

const ExerciseCard = memo(function ExerciseCard({
  exercise,
  index,
  currentPR,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
}: ExerciseCardProps) {
  const rpeInfo = getRPEDescription(exercise.rpe || 7)
  const isNewPR = currentPR && isPR(exercise.load_kg, exercise.reps, currentPR)

  // Timer de descanso
  const [timer, setTimer] = useState<number | null>(null)
  const [running, setRunning] = useState(false)

  const toggleTimer = useCallback(() => {
    if (running) {
      setRunning(false)
      setTimer(null)
      return
    }
    setTimer(exercise.rest_s || 60)
    setRunning(true)
  }, [running, exercise.rest_s])

  // Contagem regressiva
  if (running && timer !== null) {
    setTimeout(() => {
      if (timer > 0) setTimer(timer - 1)
      else {
        setRunning(false)
        setTimer(null)
        toast.success('⏱️ Descanso finalizado! Próxima série!')
      }
    }, 1000)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-card hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <CardTitle className="text-base">{exercise.name}</CardTitle>
                {isNewPR && (
                  <Trophy className="w-4 h-4 text-phoenix-amber animate-pulse" />
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {exercise.sets}x{exercise.reps} • {exercise.load_kg}kg • {formatRestTime(exercise.rest_s)}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button size="icon" variant="ghost" onClick={onDuplicate} title="Duplicar exercício">
                <Copy className="w-4 h-4" />
              </Button>

              <Button size="icon" variant="ghost" onClick={onToggleExpand}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-4 pt-0">
                {/* Quick Inputs */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Séries
                    </Label>
                    <Input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Reps
                    </Label>
                    <Input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Carga (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={exercise.load_kg}
                      onChange={(e) => onUpdate({ load_kg: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Rest Timer */}
                <div>
                  <Label className="text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Descanso
                    </span>
                    <span>{running ? `${timer}s restantes` : formatRestTime(exercise.rest_s)}</span>
                  </Label>
                  <div className="flex items-center gap-2 py-2">
                    <Slider
                      value={[exercise.rest_s]}
                      onValueChange={([v]) => onUpdate({ rest_s: v })}
                      min={15}
                      max={300}
                      step={15}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleTimer}
                      className="text-xs h-7 px-2"
                    >
                      {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* RPE */}
                <div>
                  <Label className="text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> RPE (Esforço)
                    </span>
                    <span className={rpeInfo.color}>{exercise.rpe?.toFixed(1)} – {rpeInfo.text}</span>
                  </Label>
                  <Slider
                    value={[exercise.rpe || 7]}
                    onValueChange={([v]) => onUpdate({ rpe: v })}
                    min={1}
                    max={10}
                    step={0.5}
                    className="py-3"
                  />
                </div>

                {/* PR */}
                {currentPR && (
                  <div className="p-2 rounded-lg bg-secondary/50 text-xs flex items-center gap-2 text-muted-foreground">
                    <Trophy className="w-3 h-3" />
                    <span>
                      PR atual: {currentPR.best_load}kg × {currentPR.best_reps} reps
                    </span>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <Label className="text-xs">Notas</Label>
                  <Input
                    placeholder="Observações sobre este exercício..."
                    value={exercise.notes || ''}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

export default ExerciseCard
