'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 🧩 Componentes
import WorkoutHeader from './WorkoutHeader'
import ExerciseCard from './ExerciseCard'
import ExerciseLibraryDialog from './ExerciseLibraryDialog'
import EmptyState from './EmptyState'

// 🧠 Hook principal
import { useWorkout } from './useWorkout'

// 🧱 Templates
import { WORKOUT_TEMPLATES } from '@/lib/workout-helpers'

export default function TrainingEditor({ selectedDate = new Date() }) {
  const { user } = useAuth()
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
  } = useWorkout(user, selectedDate)

  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Flame className="w-8 h-8 text-phoenix-amber animate-pulse" />
        <span className="ml-2 text-sm">Carregando treino...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* 🔝 Cabeçalho */}
      <WorkoutHeader
        selectedDate={selectedDate}
        exercisesCount={exercises.length}
        totalWeekDays={5}
        completedDays={3}
        onSave={saveWorkout}
        saving={saving}
      />

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

      {/* 📚 Modal da biblioteca */}
      <ExerciseLibraryDialog
        isOpen={isLibraryOpen}
        setIsOpen={setIsLibraryOpen}
        exerciseLibrary={exerciseLibrary}
        onAddExercise={addExerciseToWorkout}
      />
    </div>
  )
}
