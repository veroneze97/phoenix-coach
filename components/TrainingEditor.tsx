'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants, cubicBezier } from 'framer-motion'
import { Flame, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

import PhoenixScoreCard from '@/components/PhoenixScoreCard'
import StreaksBadge from '@/components/StreaksBadge'
import ExerciseHistoryCard from '@/components/ExerciseHistoryCard'
import WeeklyProgressCard from '@/components/WeeklyProgressCard'
import ExerciseSelector from '@/components/ExerciseSelector'

import WorkoutHeader from './WorkoutHeader'
import ExerciseCard from './ExerciseCard'
import ExerciseLibraryDialog from './ExerciseLibraryDialog'
import EmptyState from './EmptyState'
import { useWorkout } from './useWorkout'
import { WORKOUT_TEMPLATES } from '@/lib/workout-helpers'
import { WorkoutStatus } from '@/components/WorkoutStatus'
import WeekOverview from '@/components/WeekOverview'

// ===== Framer Motion variants (com easing válido) =====
const EASE = cubicBezier(0.16, 1, 0.3, 1)

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE } },
}

const slideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
}

export default function TrainingEditor({ selectedDate: initialDate = new Date() }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const {
    loading,
    saving,
    workout,
    exercises,
    exerciseLibrary,
    prs,
    addExerciseToWorkout,
    removeExercise,
    duplicateExercise,
    updateExercise,
    saveWorkout,
    loadWorkout,
  } = useWorkout(user, selectedDate)

  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [status, setStatus] = useState<'planned' | 'done' | 'missed'>('planned')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(undefined)

  // seleciona automaticamente o primeiro exercício do dia
  useEffect(() => {
    if (!selectedExerciseId && exercises.length > 0 && exercises[0]?.exercise_id) {
      setSelectedExerciseId(String(exercises[0].exercise_id))
    }
  }, [exercises, selectedExerciseId])

  // atualiza status local quando o treino muda
  useEffect(() => {
    if (workout?.status) setStatus(workout.status)
    else setStatus('planned')
  }, [workout])

  // recarrega treino ao mudar a data
  useEffect(() => {
    if (user) loadWorkout()
  }, [selectedDate, user, loadWorkout])

  // aplica template
  const handleApplyTemplate = async (templateKey: string) => {
    if (!workout) return
    if (exercises.length > 0) {
      return alert('Remova os exercícios atuais antes de aplicar um template.')
    }
    const template = WORKOUT_TEMPLATES[templateKey]
    const firstDay = template.days[0]
    for (const ex of firstDay.exercises) {
      await addExerciseToWorkout({
        id: Math.random(),
        name: ex.name,
        name_pt: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
      })
    }
  }

  // atualiza status via RPC
  const handleStatus = async (newStatus: 'done' | 'missed') => {
    if (!user || !workout) return
    try {
      const { error } = await supabase.rpc('set_workout_status', {
        p_user: user.id,
        p_date: workout.date,
        p_status: newStatus,
      })
      if (error) throw error
      setStatus(newStatus)
      toast.success(newStatus === 'done' ? '✅ Treino concluído com sucesso!' : '❌ Treino marcado como perdido.')
    } catch (err) {
      toast.error('Erro ao atualizar status do treino')
      console.error(err)
    }
  }

  // navegação entre dias
  const changeDay = (direction: 'prev' | 'next') => {
    setStatus('planned')
    setSelectedDate((prev) => addDays(prev, direction === 'prev' ? -1 : 1))
  }

  const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Flame className="h-8 w-8 animate-pulse text-phoenix-amber" />
        <span className="ml-2 text-sm">Carregando treino...</span>
      </div>
    )
  }

  return (
    <motion.div className="space-y-4 pb-28" variants={fadeIn} initial="hidden" animate="show">
      {/* Navegação entre dias */}
      <motion.div className="mb-2 flex items-center justify-between" variants={slideUp} initial="hidden" animate="show">
        <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Button variant="ghost" onClick={() => changeDay('prev')} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
        </motion.button>

        <motion.h2 className="text-center text-lg font-semibold capitalize" variants={slideUp}>
          {formattedDate}
        </motion.h2>

        <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Button variant="ghost" onClick={() => changeDay('next')} className="flex items-center gap-1">
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.button>
      </motion.div>

      {/* Cabeçalho */}
      <motion.div variants={slideUp} initial="hidden" animate="show">
        <WorkoutHeader
          selectedDate={selectedDate}
          exercisesCount={exercises.length}
          totalWeekDays={5}
          completedDays={3}
          onSave={saveWorkout}
          saving={saving}
        />
      </motion.div>

      {/* Progresso semanal */}
      {user && (
        <motion.div variants={slideUp} initial="hidden" animate="show">
          <WeekOverview userId={user.id || ''} anchorDate={selectedDate} />
        </motion.div>
      )}

      {/* Seletor + Cards (Histórico / Progresso) */}
      {user && exercises.length > 0 && (
        <motion.div variants={slideUp} initial="hidden" animate="show" className="flex flex-col gap-3">
          <ExerciseSelector
            exercises={exercises}
            value={selectedExerciseId}
            onChange={setSelectedExerciseId}
          />

          {selectedExerciseId && (
            <>
              <ExerciseHistoryCard userId={user.id || ''} exerciseId={selectedExerciseId} />
              <WeeklyProgressCard userId={user.id || ''} exerciseId={selectedExerciseId} />
            </>
          )}
        </motion.div>
      )}

      {/* Phoenix Score e Streaks */}
      {user && <PhoenixScoreCard userId={user.id || ''} date={selectedDate} />}
      {user && <StreaksBadge userId={user.id || ''} anchorDate={selectedDate} />}

      {/* Status atual */}
      {workout && (
        <motion.div variants={slideUp} initial="hidden" animate="show" whileHover={{ scale: 1.005 }} transition={{ duration: 0.15 }}>
          <Card className="flex items-center justify-between rounded-xl border border-phoenix-amber/30 bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {status === 'done' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : status === 'missed' ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Flame className="h-4 w-4 animate-pulse text-phoenix-amber" />
              )}
              <span>
                Status atual:{' '}
                <strong className="capitalize">
                  {status === 'done' ? 'Concluído' : status === 'missed' ? 'Perdido' : 'Planejado'}
                </strong>
              </span>
            </div>

            <div className="flex gap-2">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatus('done')}
                  disabled={status === 'done'}
                  className="border-green-600 text-green-600 transition-all hover:bg-green-600 hover:text-white"
                >
                  ✅ Concluir
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatus('missed')}
                  disabled={status === 'missed'}
                  className="border-red-600 text-red-600 transition-all hover:bg-red-600 hover:text-white"
                >
                  ❌ Perdido
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        {exercises.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <EmptyState
              onAddExercise={() => setIsLibraryOpen(true)}
              onApplyTemplate={handleApplyTemplate}
              hasTemplates
              templates={WORKOUT_TEMPLATES}
            />
          </motion.div>
        ) : (
          <motion.div
            key="exercises"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="space-y-3"
          >
            <AnimatePresence>
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  variants={slideUp}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    index={index}
                    currentPR={prs[exercise.name]}
                    isExpanded={expandedExercise === exercise.id}
                    onToggleExpand={() =>
                      setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)
                    }
                    onUpdate={(updates) => updateExercise(exercise.id, updates)}
                    onRemove={() => removeExercise(exercise.id)}
                    onDuplicate={() => duplicateExercise(exercise)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA adicionar exercício */}
      {exercises.length > 0 && (
        <motion.div variants={slideUp} initial="hidden" animate="show" whileHover={{ scale: 1.003 }}>
          <Card className="glass-card border-2 border-dashed border-phoenix-amber/30 transition-all hover:bg-phoenix-amber/5">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-center gap-2 py-6 text-phoenix-amber"
                onClick={() => setIsLibraryOpen(true)}
              >
                <Flame className="h-4 w-4" />
                Adicionar novo exercício
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}

      {/* Toggle secundário (opcional) */}
      {workout && (
        <motion.div variants={slideUp} initial="hidden" animate="show">
          <WorkoutStatus workoutId={workout.id} initialStatus={workout.status} />
        </motion.div>
      )}

      {/* Modal biblioteca */}
      <ExerciseLibraryDialog
        isOpen={isLibraryOpen}
        setIsOpen={setIsLibraryOpen}
        exerciseLibrary={exerciseLibrary}
        onAddExercise={addExerciseToWorkout}
      />
    </motion.div>
  )
}
