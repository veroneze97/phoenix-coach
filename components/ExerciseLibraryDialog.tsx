'use client'

import { useMemo, useState, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { EXERCISE_CATEGORIES } from '@/lib/workout-helpers'
import { motion, AnimatePresence } from 'framer-motion'

interface ExerciseLibraryDialogProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  exerciseLibrary: any[]
  onAddExercise: (exercise: any) => void
}

function ExerciseLibraryDialogComponent({
  isOpen,
  setIsOpen,
  exerciseLibrary,
  onAddExercise,
}: ExerciseLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return exerciseLibrary.filter((ex) => {
      const matchCategory = selectedCategory === 'all' || ex.category === selectedCategory
      const matchName =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        (ex.name_pt && ex.name_pt.toLowerCase().includes(q))
      return matchCategory && matchName
    })
  }, [exerciseLibrary, searchQuery, selectedCategory])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] glass-card backdrop-blur-xl border-phoenix-amber/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📚 Biblioteca de Exercícios
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Busque, filtre e adicione exercícios ao seu treino de forma rápida.
          </DialogDescription>
        </DialogHeader>

        {/* 🔍 Campo de busca */}
        <div className="relative my-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 focus-visible:ring-phoenix-amber"
          />
        </div>

        {/* 🏋️ Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={
              selectedCategory === 'all'
                ? 'bg-phoenix-amber text-white hover:opacity-90'
                : ''
            }
          >
            Todos
          </Button>

          {Object.entries(EXERCISE_CATEGORIES).map(([key, cat]) => (
            <Button
              key={key}
              size="sm"
              variant={selectedCategory === key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(key)}
              className={
                selectedCategory === key
                  ? 'bg-phoenix-amber text-white hover:opacity-90'
                  : ''
              }
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>

        {/* 🧱 Lista de exercícios */}
        <ScrollArea className="h-[400px] pr-3">
          <AnimatePresence>
            {filteredLibrary.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {filteredLibrary.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 px-4 rounded-xl hover:bg-phoenix-amber/10 transition-all"
                      onClick={() => {
                        onAddExercise(exercise)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {exercise.name_pt || exercise.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {EXERCISE_CATEGORIES[exercise.category]?.icon}{' '}
                          {exercise.muscle_groups?.join(', ') || '—'}
                        </span>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="text-phoenix-amber text-xs font-semibold"
                      >
                        + Adicionar
                      </motion.span>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-muted-foreground text-sm"
              >
                Nenhum exercício encontrado 💤
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>

      <DialogTrigger asChild></DialogTrigger>
    </Dialog>
  )
}

export default memo(ExerciseLibraryDialogComponent)
