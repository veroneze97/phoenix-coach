// Exercise library data and helpers for Phoenix Coach Training Module

export const EXERCISE_CATEGORIES = {
  chest: { name: 'Peito', icon: '💪', color: 'bg-red-500/10 text-red-600' },
  back: { name: 'Costas', icon: '🔙', color: 'bg-blue-500/10 text-blue-600' },
  legs: { name: 'Pernas', icon: '🦵', color: 'bg-green-500/10 text-green-600' },
  shoulders: {
    name: 'Ombros',
    icon: '🏋️',
    color: 'bg-yellow-500/10 text-yellow-600',
  },
  arms: {
    name: 'Braços',
    icon: '💪',
    color: 'bg-purple-500/10 text-purple-600',
  },
  core: { name: 'Core', icon: '🎯', color: 'bg-orange-500/10 text-orange-600' },
  cardio: { name: 'Cardio', icon: '❤️', color: 'bg-pink-500/10 text-pink-600' },
}

// Workout templates
export const WORKOUT_TEMPLATES = {
  abc: {
    name: 'ABC (3x semana)',
    description: 'Treino dividido em 3 dias: A=Peito+Ombro+Tríceps, B=Costas+Bíceps, C=Pernas+Core',
    days: [
      {
        title: 'Treino A - Peito, Ombro e Tríceps',
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: 10, rest: 90 },
          { name: 'Supino Inclinado Halteres', sets: 3, reps: 12, rest: 60 },
          { name: 'Crossover', sets: 3, reps: 15, rest: 45 },
          { name: 'Desenvolvimento Halteres', sets: 4, reps: 10, rest: 60 },
          { name: 'Elevação Lateral', sets: 3, reps: 15, rest: 45 },
          { name: 'Triceps Pulley', sets: 3, reps: 15, rest: 45 },
          { name: 'Triceps Francês', sets: 3, reps: 12, rest: 45 },
        ],
      },
      {
        title: 'Treino B - Costas e Bíceps',
        exercises: [
          { name: 'Levantamento Terra', sets: 4, reps: 8, rest: 120 },
          { name: 'Remada Curvada', sets: 4, reps: 10, rest: 90 },
          { name: 'Puxada Frontal', sets: 3, reps: 12, rest: 60 },
          { name: 'Remada Sentado', sets: 3, reps: 12, rest: 60 },
          { name: 'Puxada Face', sets: 3, reps: 15, rest: 45 },
          { name: 'Rosca Direta', sets: 3, reps: 12, rest: 45 },
          { name: 'Rosca Martelo', sets: 3, reps: 12, rest: 45 },
        ],
      },
      {
        title: 'Treino C - Pernas e Core',
        exercises: [
          { name: 'Agachamento', sets: 4, reps: 10, rest: 120 },
          { name: 'Leg Press', sets: 4, reps: 12, rest: 90 },
          { name: 'Levantamento Romeno', sets: 3, reps: 12, rest: 60 },
          { name: 'Mesa Flexora', sets: 3, reps: 15, rest: 45 },
          { name: 'Cadeira Extensora', sets: 3, reps: 15, rest: 45 },
          { name: 'Panturrilha', sets: 4, reps: 20, rest: 45 },
          { name: 'Prancha', sets: 3, reps: 60, rest: 30 },
        ],
      },
    ],
  },
  upper_lower: {
    name: 'Upper/Lower (4x semana)',
    description: 'Treino dividido em superior e inferior, 2x por semana cada',
    days: [
      {
        title: 'Upper A - Membros Superiores',
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: 8, rest: 90 },
          { name: 'Remada Curvada', sets: 4, reps: 8, rest: 90 },
          { name: 'Desenvolvimento', sets: 3, reps: 10, rest: 60 },
          { name: 'Puxada Frontal', sets: 3, reps: 10, rest: 60 },
          { name: 'Rosca Direta', sets: 3, reps: 12, rest: 45 },
          { name: 'Triceps Pulley', sets: 3, reps: 12, rest: 45 },
        ],
      },
      {
        title: 'Lower A - Membros Inferiores',
        exercises: [
          { name: 'Agachamento', sets: 4, reps: 8, rest: 120 },
          { name: 'Levantamento Romeno', sets: 4, reps: 10, rest: 90 },
          { name: 'Leg Press', sets: 3, reps: 12, rest: 90 },
          { name: 'Mesa Flexora', sets: 3, reps: 12, rest: 60 },
          { name: 'Panturrilha', sets: 4, reps: 15, rest: 45 },
        ],
      },
    ],
  },
  ppl: {
    name: 'Push/Pull/Legs (6x semana)',
    description: 'Push (empurrar), Pull (puxar), Legs (pernas) - 2x por semana cada',
    days: [
      {
        title: 'Push - Peito, Ombro e Tríceps',
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: 8, rest: 90 },
          { name: 'Supino Inclinado', sets: 3, reps: 10, rest: 60 },
          { name: 'Desenvolvimento Halteres', sets: 4, reps: 10, rest: 60 },
          { name: 'Elevação Lateral', sets: 3, reps: 15, rest: 45 },
          { name: 'Triceps Pulley', sets: 3, reps: 12, rest: 45 },
          { name: 'Mergulho Triceps', sets: 3, reps: 12, rest: 45 },
        ],
      },
      {
        title: 'Pull - Costas e Bíceps',
        exercises: [
          { name: 'Levantamento Terra', sets: 4, reps: 6, rest: 120 },
          { name: 'Barra Fixa', sets: 4, reps: 10, rest: 90 },
          { name: 'Remada Curvada', sets: 3, reps: 10, rest: 60 },
          { name: 'Remada Sentado', sets: 3, reps: 12, rest: 60 },
          { name: 'Rosca Direta', sets: 3, reps: 12, rest: 45 },
          { name: 'Rosca Martelo', sets: 3, reps: 12, rest: 45 },
        ],
      },
      {
        title: 'Legs - Pernas Completo',
        exercises: [
          { name: 'Agachamento', sets: 4, reps: 8, rest: 120 },
          { name: 'Leg Press', sets: 4, reps: 12, rest: 90 },
          { name: 'Levantamento Romeno', sets: 3, reps: 10, rest: 60 },
          { name: 'Mesa Flexora', sets: 3, reps: 12, rest: 60 },
          { name: 'Afundo', sets: 3, reps: 12, rest: 60 },
          { name: 'Panturrilha', sets: 4, reps: 20, rest: 45 },
        ],
      },
    ],
  },
}

// Helper to check if exercise is a new PR
export function isPR(currentLoad, currentReps, previousPR) {
  if (!previousPR) return true

  const currentVolume = currentLoad * currentReps
  const prVolume = (previousPR.best_load || 0) * (previousPR.best_reps || 0)

  return (
    currentVolume > prVolume ||
    (currentLoad > (previousPR.best_load || 0) && currentReps >= (previousPR.best_reps || 0))
  )
}

// Calculate RPE description
export function getRPEDescription(rpe) {
  if (rpe >= 9.5) return { text: 'Máximo', color: 'text-red-500' }
  if (rpe >= 9) return { text: 'Muito difícil', color: 'text-orange-500' }
  if (rpe >= 8) return { text: 'Difícil', color: 'text-yellow-500' }
  if (rpe >= 7) return { text: 'Moderado', color: 'text-blue-500' }
  if (rpe >= 5) return { text: 'Confortável', color: 'text-green-500' }
  return { text: 'Fácil', color: 'text-green-400' }
}

// Format time for rest periods
export function formatRestTime(seconds) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`
}
