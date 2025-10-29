'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, PlusCircle } from 'lucide-react'

interface EmptyStateProps {
  onAddExercise: () => void
  onApplyTemplate?: (templateKey: string) => void
  hasTemplates?: boolean
  templates?: Record<string, any>
}

export default function EmptyState({
  onAddExercise,
  onApplyTemplate,
  hasTemplates = false,
  templates = {},
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center rounded-xl border border-phoenix-amber/20 bg-gradient-to-b from-white to-phoenix-amber/5 px-4 py-12 text-center backdrop-blur-lg"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
      >
        <Flame className="mb-4 h-12 w-12 text-phoenix-amber" />
      </motion.div>

      <h3 className="text-lg font-semibold text-gray-800">Seu treino ainda está vazio 💪</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Comece escolhendo um template pronto ou monte seu treino do zero. Dê o primeiro passo hoje —
        a consistência constrói resultados!
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {hasTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {Object.entries(templates).map(([key, template]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => onApplyTemplate?.(key)}
                className="border-phoenix-amber/40 px-4 py-2 text-sm transition-all hover:bg-phoenix-amber/10"
              >
                <Dumbbell className="mr-1 h-4 w-4" />
                {template.name}
              </Button>
            ))}
          </motion.div>
        )}

        <Button
          onClick={onAddExercise}
          className="flex items-center gap-2 bg-gradient-to-r from-phoenix-amber to-phoenix-gold px-6 py-2 text-white shadow-md hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar Exercício
        </Button>
      </div>
    </motion.div>
  )
}
