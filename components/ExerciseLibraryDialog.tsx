'use client'

import { useMemo, useState, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null)

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return exerciseLibrary.filter((ex) => {
      const matchCategory = selectedCategory === 'all' || ex.category === selectedCategory
      const matchName =
        !q ||
        ex.name?.toLowerCase().includes(q) ||
        (ex.name_pt && ex.name_pt.toLowerCase().includes(q))
      return matchCategory && matchName
    })
  }, [exerciseLibrary, searchQuery, selectedCategory])

  // Mantém preview coerente ao filtrar/buscar
  const safeSelected = useMemo(() => {
    if (!selectedExercise) return null
    return filteredLibrary.find((e) => e.id === selectedExercise.id) ?? null
  }, [filteredLibrary, selectedExercise])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-card max-h-[85vh] w-full max-w-4xl border-phoenix-amber/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            📚 Biblioteca de Exercícios
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Busque, filtre, visualize os detalhes e adicione exercícios ao seu treino.
          </DialogDescription>
        </DialogHeader>

        {/* 🔎 Busca */}
        <div className="relative my-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 focus-visible:ring-phoenix-amber"
          />
        </div>

        {/* Grade: Lista (esquerda) + Preview (direita) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 🧱 Lista de exercícios */}
          <div className="rounded-xl border bg-white/70">
            {/* Categorias */}
            <div className="flex gap-2 overflow-x-auto p-3">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={
                  selectedCategory === 'all' ? 'bg-phoenix-amber text-white hover:opacity-90' : ''
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
                    selectedCategory === key ? 'bg-phoenix-amber text-white hover:opacity-90' : ''
                  }
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </div>

            {/* Lista */}
            <ScrollArea className="h-[460px] px-3 pb-3">
              <AnimatePresence mode="popLayout">
                {filteredLibrary.length > 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {filteredLibrary.map((exercise) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedExercise(exercise)}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all hover:bg-phoenix-amber/10 ${
                            safeSelected?.id === exercise.id ? 'border-phoenix-amber/50' : 'border-transparent'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {exercise.name_pt || exercise.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {EXERCISE_CATEGORIES[exercise.category]?.icon}{' '}
                              {exercise.muscle_groups?.join(', ') || '—'}
                              {exercise.level ? ` • ${exercise.level}` : ''}
                              {exercise.equipment ? ` • ${exercise.equipment}` : ''}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-phoenix-amber">Preview ›</span>
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum exercício encontrado 💤
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* 🔍 Preview do exercício */}
          <div className="rounded-xl border bg-white/70 p-4">
            {safeSelected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold leading-tight">
                    {safeSelected.name_pt || safeSelected.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {EXERCISE_CATEGORIES[safeSelected.category]?.icon}{' '}
                    {EXERCISE_CATEGORIES[safeSelected.category]?.name || 'Exercício'}
                  </span>
                </div>

                {safeSelected.image_url ? (
                  <img
                    src={safeSelected.image_url}
                    alt={safeSelected.name_pt || safeSelected.name}
                    className="aspect-video w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500">
                    Sem imagem disponível
                  </div>
                )}

                {safeSelected.description && (
                  <p className="text-sm text-gray-700">{safeSelected.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="block font-medium text-gray-700">Grupo</span>
                    <span>{safeSelected.muscle_groups?.join(', ') || 'Geral'}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="block font-medium text-gray-700">Nível</span>
                    <span>{safeSelected.level || '—'}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="block font-medium text-gray-700">Equipamento</span>
                    <span>{safeSelected.equipment || 'Livre'}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="block font-medium text-gray-700">Categoria</span>
                    <span>{safeSelected.category || '—'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 bg-phoenix-amber text-white hover:opacity-90"
                    onClick={() => {
                      onAddExercise(safeSelected)
                      setIsOpen(false)
                    }}
                  >
                    + Adicionar ao treino
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.open(safeSelected.video_url || '#', '_blank')
                    }}
                    disabled={!safeSelected.video_url}
                  >
                    Ver vídeo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[460px] items-center justify-center text-center text-sm text-muted-foreground">
                Selecione um exercício na lista à esquerda para visualizar o preview.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default memo(ExerciseLibraryDialogComponent)
