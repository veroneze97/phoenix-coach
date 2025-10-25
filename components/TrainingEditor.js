'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  GripVertical,
  Trophy,
  Clock,
  Weight,
  Hash,
  Timer,
  Zap,
  Save,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Search,
  Flame,
} from 'lucide-react'
import { EXERCISE_CATEGORIES, WORKOUT_TEMPLATES, isPR, getRPEDescription, formatRestTime } from '@/lib/workout-helpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function TrainingEditor({ selectedDate = new Date() }) {
  const { user } = useAuth()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [prs, setPRs] = useState({})

  useEffect(() => {
    if (user) {
      loadWorkout()
      loadExerciseLibrary()
      loadPRs()
    }
  }, [user, selectedDate])

  const loadWorkout = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (workoutData) {
        setWorkout(workoutData)
        
        // Load exercises for this workout
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workoutData.id)
          .order('order_index', { ascending: true })

        if (exercisesData) {
          setExercises(exercisesData)
        }
      } else {
        // Create new workout
        const { data: newWorkout, error } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            date: dateStr,
            title: 'Treino',
            completed: false
          })
          .select()
          .single()

        if (newWorkout) {
          setWorkout(newWorkout)
          setExercises([])
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExerciseLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('category', { ascending: true })
        .order('name_pt', { ascending: true })

      if (data) {
        setExerciseLibrary(data)
      }
    } catch (error) {
      console.error('Error loading exercise library:', error)
    }
  }

  const loadPRs = async () => {
    try {
      const { data, error } = await supabase
        .from('prs')
        .select('*')
        .eq('user_id', user.id)

      if (data) {
        const prsMap = {}
        data.forEach(pr => {
          prsMap[pr.exercise_name] = pr
        })
        setPRs(prsMap)
      }
    } catch (error) {
      console.error('Error loading PRs:', error)
    }
  }

  const addExerciseToWorkout = async (exerciseFromLibrary) => {
    if (!workout) return

    try {
      const newExercise = {
        workout_id: workout.id,
        exercise_library_id: exerciseFromLibrary.id,
        name: exerciseFromLibrary.name_pt || exerciseFromLibrary.name,
        order_index: exercises.length,
        sets: 3,
        reps: 10,
        load_kg: 0,
        rest_s: 60,
        rpe: 7,
        notes: '',
        is_custom: false
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert(newExercise)
        .select()
        .single()

      if (error) throw error

      setExercises([...exercises, data])
      setIsExerciseDialogOpen(false)
      toast.success(`${data.name} adicionado! 💪`)
    } catch (error) {
      console.error('Error adding exercise:', error)
      toast.error('Erro ao adicionar exercício')
    }
  }

  const removeExercise = async (exerciseId) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error

      setExercises(exercises.filter(ex => ex.id !== exerciseId))
      toast.success('Exercício removido')
    } catch (error) {
      console.error('Error removing exercise:', error)
      toast.error('Erro ao remover exercício')
    }
  }

  const updateExercise = async (exerciseId, updates) => {
    try {
      const updatedExercises = exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
      setExercises(updatedExercises)

      // Debounce the save to avoid too many requests
      const { error } = await supabase
        .from('exercises')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', exerciseId)

      if (error) throw error

      // Check if it's a new PR
      const exercise = updatedExercises.find(ex => ex.id === exerciseId)
      if (exercise && exercise.load_kg && exercise.reps) {
        const currentPR = prs[exercise.name]
        if (isPR(exercise.load_kg, exercise.reps, currentPR)) {
          await savePR(exercise)
        }
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
    }
  }

  const savePR = async (exercise) => {
    try {
      const volume = exercise.load_kg * exercise.reps * exercise.sets

      const { error } = await supabase
        .from('prs')
        .upsert({
          user_id: user.id,
          exercise_name: exercise.name,
          best_load: exercise.load_kg,
          best_reps: exercise.reps,
          best_volume: volume,
          date: workout.date,
          workout_id: workout.id
        }, { onConflict: 'user_id,exercise_name' })

      if (error) throw error

      // Reload PRs
      await loadPRs()
      
      toast.success(`🔥 Novo PR em ${exercise.name}!`, {
        description: `${exercise.load_kg}kg x ${exercise.reps} reps`
      })
    } catch (error) {
      console.error('Error saving PR:', error)
    }
  }

  const saveWorkout = async () => {
    if (!workout) return
    
    setSaving(true)
    try {
      // Calculate average RPE
      const validRPEs = exercises.filter(ex => ex.rpe).map(ex => ex.rpe)
      const avgRPE = validRPEs.length > 0 
        ? validRPEs.reduce((a, b) => a + b, 0) / validRPEs.length 
        : null

      const { error } = await supabase
        .from('workouts')
        .update({
          rpe_avg: avgRPE,
          completed: exercises.length > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', workout.id)

      if (error) throw error

      toast.success('Treino salvo com sucesso! 🔥')
      await loadWorkout()
    } catch (error) {
      console.error('Error saving workout:', error)
      toast.error('Erro ao salvar treino')
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = async (template) => {
    if (!workout || exercises.length > 0) {
      toast.error('Remove os exercícios atuais antes de aplicar um template')
      return
    }

    try {
      const templateData = WORKOUT_TEMPLATES[template]
      const firstDay = templateData.days[0]

      const exercisesToAdd = firstDay.exercises.map((ex, idx) => ({
        workout_id: workout.id,
        name: ex.name,
        order_index: idx,
        sets: ex.sets,
        reps: ex.reps,
        rest_s: ex.rest,
        load_kg: 0,
        rpe: 7,
        is_custom: false
      }))

      const { data, error } = await supabase
        .from('exercises')
        .insert(exercisesToAdd)
        .select()

      if (error) throw error

      setExercises(data)
      toast.success(`Template ${templateData.name} aplicado! 💪`)
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error('Erro ao aplicar template')
    }
  }

  const filteredLibrary = exerciseLibrary.filter(ex => {
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory
    const matchesSearch = !searchQuery || 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.name_pt && ex.name_pt.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Flame className="w-8 h-8 text-phoenix-amber animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="glass-card border-phoenix-amber/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-phoenix-amber" />
                {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </CardTitle>
              <CardDescription>
                {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'}
              </CardDescription>
            </div>
            <Button
              onClick={saveWorkout}
              disabled={saving || exercises.length === 0}
              className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Templates Quick Access */}
      {exercises.length === 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Templates Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(WORKOUT_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto flex-col items-start p-3"
                  onClick={() => applyTemplate(key)}
                >
                  <span className="font-semibold text-sm">{template.name}</span>
                  <span className="text-xs text-muted-foreground text-left">
                    {template.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      <div className="space-y-3">
        <AnimatePresence>
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              onUpdate={(updates) => updateExercise(exercise.id, updates)}
              onRemove={() => removeExercise(exercise.id)}
              currentPR={prs[exercise.name]}
              isExpanded={expandedExercise === exercise.id}
              onToggleExpand={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Exercise Button */}
      <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-dashed border-2 h-16 text-phoenix-amber border-phoenix-amber/30 hover:bg-phoenix-amber/5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Exercício
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Biblioteca de Exercícios</DialogTitle>
            <DialogDescription>
              Escolha um exercício ou adicione um personalizado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-phoenix-amber' : ''}
              >
                Todos
              </Button>
              {Object.entries(EXERCISE_CATEGORIES).map(([key, cat]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(key)}
                  className={selectedCategory === key ? 'bg-phoenix-amber' : ''}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </div>

            {/* Exercise List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {filteredLibrary.map(exercise => (
                  <Button
                    key={exercise.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-4"
                    onClick={() => addExerciseToWorkout(exercise)}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium">{exercise.name_pt || exercise.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {EXERCISE_CATEGORIES[exercise.category]?.icon} {exercise.muscle_groups?.join(', ')}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 ml-2" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Exercise Card Component
function ExerciseCard({ exercise, index, onUpdate, onRemove, currentPR, isExpanded, onToggleExpand }) {
  const rpeInfo = getRPEDescription(exercise.rpe || 7)
  const isNewPR = currentPR && isPR(exercise.load_kg, exercise.reps, currentPR)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">{exercise.name}</CardTitle>
                {isNewPR && (
                  <Trophy className="w-4 h-4 text-phoenix-amber animate-pulse" />
                )}
              </div>
              <CardDescription className="text-xs">
                {exercise.sets}x{exercise.reps} • {exercise.load_kg}kg • {formatRestTime(exercise.rest_s)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleExpand}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
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

                {/* Rest Time */}
                <div>
                  <Label className="text-xs flex items-center gap-1 justify-between">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Descanso
                    </span>
                    <span>{formatRestTime(exercise.rest_s)}</span>
                  </Label>
                  <Slider
                    value={[exercise.rest_s]}
                    onValueChange={([value]) => onUpdate({ rest_s: value })}
                    min={15}
                    max={300}
                    step={15}
                    className="py-4"
                  />
                </div>

                {/* RPE */}
                <div>
                  <Label className="text-xs flex items-center gap-1 justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> RPE (Esforço)
                    </span>
                    <span className={rpeInfo.color}>{exercise.rpe?.toFixed(1)} - {rpeInfo.text}</span>
                  </Label>
                  <Slider
                    value={[exercise.rpe || 7]}
                    onValueChange={([value]) => onUpdate({ rpe: value })}
                    min={1}
                    max={10}
                    step={0.5}
                    className="py-4"
                  />
                </div>

                {/* PR Indicator */}
                {currentPR && (
                  <div className="p-2 rounded-lg bg-secondary/50 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="w-3 h-3" />
                      <span>PR atual: {currentPR.best_load}kg x {currentPR.best_reps} reps</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
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
}
