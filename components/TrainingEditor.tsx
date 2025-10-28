'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

import WorkoutHeader from './WorkoutHeader'
import ExerciseCard from './ExerciseCard'
import ExerciseLibraryDialog from './ExerciseLibraryDialog'
import EmptyState from './EmptyState'
import { useWorkout } from './useWorkout'
import { WORKOUT_TEMPLATES } from '@/lib/workout-helpers'

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

  useEffect(() => {
    if (workout?.status) setStatus(workout.status)
  }, [workout])

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

  // ✅ Atualiza status via RPC
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
      toast.success(
        newStatus === 'done'
          ? '✅ Treino concluído com sucesso!'
          : '❌ Treino marcado como perdido.'
      )
    } catch (err) {
      toast.error('Erro ao atualizar status do treino')
      console.error(err)
    }
  }

  // ⏩ Navegação entre dias
  const changeDay = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'prev' ? -1 : 1)
    setSelectedDate(newDate)
    loadWorkout() // refaz a busca do treino
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Flame className="w-8 h-8 text-phoenix-amber animate-pulse" />
        <span className="ml-2 text-sm">Carregando treino...</span>
      </div>
    )
  }

  const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-4 pb-28">
      {/* 📆 Navegação entre dias */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          onClick={() => changeDay('prev')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </Button>

        <h2 className="text-lg font-semibold text-center capitalize">
          {formattedDate}
        </h2>

        <Button
          variant="ghost"
          onClick={() => changeDay('next')}
          className="flex items-center gap-1"
        >
          Próximo <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 🔝 Cabeçalho */}
      <WorkoutHeader
        selectedDate={selectedDate}
        exercisesCount={exercises.length}
        totalWeekDays={5}
        completedDays={3}
        onSave={saveWorkout}
        saving={saving}
      />

      {/* 🏁 Status atual */}
      {workout && (
        <Card className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10 border border-phoenix-amber/30 rounded-xl">
          <div className="flex items-center gap-2 text-sm">
            {status === 'done' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : status === 'missed' ? (
              <XCircle className="w-4 h-4 text-red-600" />
            ) : (
              <Flame className="w-4 h-4 text-phoenix-amber animate-pulse" />
            )}
            <span>
              Status atual:{' '}
              <strong className="capitalize">
                {status === 'done'
                  ? 'Concluído'
                  : status === 'missed'
                  ? 'Perdido'
                  : 'Planejado'}
              </strong>
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatus('done')}
              disabled={status === 'done'}
              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
            >
              ✅ Concluir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatus('missed')}
              disabled={status === 'missed'}
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
            >
              ❌ Perdido
            </Button>
          </div>
        </Card>
      )}

      {/* 📦 Conteúdo */}
      <AnimatePresence mode="wait">
        {exercises.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  currentPR={prs[exercise.name]}
                  isExpanded={expandedExercise === exercise.id}
                  onToggleExpand={() =>
                    setExpandedExercise(
                      expandedExercise === exercise.id ? null : exercise.id
                    )
                  }
                  onUpdate={(updates) => updateExercise(exercise.id, updates)}
                  onRemove={() => removeExercise(exercise.id)}
                  onDuplicate={() => duplicateExercise(exercise)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ➕ Botão para adicionar exercício */}
      {exercises.length > 0 && (
        <Card className="glass-card border-dashed border-2 border-phoenix-amber/30 hover:bg-phoenix-amber/5 transition-all">
          <Button
            variant="ghost"
            className="w-full py-6 text-phoenix-amber flex items-center justify-center gap-2"
            onClick={() => setIsLibraryOpen(true)}
          >
            <Flame className="w-4 h-4" />
            Adicionar novo exercício
          </Button>
        </Card>
      )}

      <ExerciseLibraryDialog
        isOpen={isLibraryOpen}
        setIsOpen={setIsLibraryOpen}
        exerciseLibrary={exerciseLibrary}
        onAddExercise={addExerciseToWorkout}
      />
    </div>
  )
}
