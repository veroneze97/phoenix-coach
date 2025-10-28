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
      className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-gradient-to-b from-white to-phoenix-amber/5 border border-phoenix-amber/20 backdrop-blur-lg"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
      >
        <Flame className="w-12 h-12 text-phoenix-amber mb-4" />
      </motion.div>

      <h3 className="text-lg font-semibold text-gray-800">
        Seu treino ainda está vazio 💪
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        Comece escolhendo um template pronto ou monte seu treino do zero.
        Dê o primeiro passo hoje — a consistência constrói resultados!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
                className="text-sm px-4 py-2 border-phoenix-amber/40 hover:bg-phoenix-amber/10 transition-all"
              >
                <Dumbbell className="w-4 h-4 mr-1" />
                {template.name}
              </Button>
            ))}
          </motion.div>
        )}

        <Button
          onClick={onAddExercise}
          className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white px-6 py-2 flex items-center gap-2 hover:opacity-90 shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          Adicionar Exercício
        </Button>
      </div>
    </motion.div>
  )
}
