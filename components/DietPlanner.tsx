'use client'

/**
 * DietPlanner — Phoenix Coach (modular)
 * - Usa hooks e componentes extraídos para reduzir o tamanho do arquivo
 * - DonutProgress, MealCard, FoodModal modulares
 * - TOKENS/cardBase centralizados
 */

import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

// shadcn/ui
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Diet modules
import { TOKENS, cardBase } from '@/components/diet/tokens'
import PhoenixBackground from '@/components/diet/PhoenixBackground'
import useDietData from '@/components/diet/use-diet-data'
import MealCard from '@/components/diet/MealCard'
import FoodModal from '@/components/diet/FoodModal'
import DonutProgress from '@/components/diet/DonutProgress'

// (opcional) se você já usa esse componente, mantenha
import PhoenixOracle from '@/components/PhoenixOracle.js'

// Ícones
import { Calendar, Plus, RefreshCw, Sparkles } from 'lucide-react'

// Tipos + catálogo de refeições
import type { MealType, MealItem, SelectedFood, UUID, MealConfig } from '@/types/diet'
import { MEALS } from '@/types/diet'

/* ------------------------------------ *
 * Helpers de apresentação das refeições
 * ------------------------------------ */
const MEAL_CONFIGS: Record<MealType, MealConfig> = {
  breakfast: {
    id: 'breakfast',
    name: 'Café da manhã',
    icon: () => null, // ícone opcional
    emoji: '🍳',
    gradient: 'from-amber-400 to-orange-500',
  },
  lunch: {
    id: 'lunch',
    name: 'Almoço',
    icon: () => null,
    emoji: '🍽️',
    gradient: 'from-emerald-400 to-green-600',
  },
  dinner: {
    id: 'dinner',
    name: 'Jantar',
    icon: () => null,
    emoji: '🌙',
    gradient: 'from-indigo-400 to-purple-600',
  },
  snacks: {
    id: 'snacks',
    name: 'Lanches',
    icon: () => null,
    emoji: '🥪',
    gradient: 'from-pink-400 to-rose-600',
  },
}

/* ------------------------------------ *
 * Utilitários simples
 * ------------------------------------ */
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200/70 dark:bg-zinc-800 ${TOKENS.radius.lg} ${className}`} />
)

/* ------------------------------------ *
 * Página
 * ------------------------------------ */
export default function DietPlanner() {
  const { user } = useAuth()
  const {
    loading,
    recalculating,
    dailyIntake,
    mealTotals = [],
    mealItems = [],
    weeklySummary = [],
    actions,
  } = useDietData((user?.id as UUID) || undefined)

  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set())
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MealItem | null>(null)

  const calorieProgress = useMemo(() => {
    if (!dailyIntake) return 0
    return ((dailyIntake.total_kcal || 0) / (dailyIntake.goal_kcal || 2000)) * 100
  }, [dailyIntake])

  const weeklyChartData = useMemo(() => {
    if (!Array.isArray(weeklySummary)) return []
    return weeklySummary.map((day) => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      adherence: Math.round(day.avg_adherence_pct || 0),
    }))
  }, [weeklySummary])

  const getMotivationalMessage = (progress: number) => {
    if (progress >= 100) return '🔥 Meta atingida! Você é lendário.'
    if (progress >= 90) return '🌟 Quase lá! Sua consistência é incrível.'
    if (progress >= 70) return '💪 Excelente! Você está no caminho certo.'
    if (progress >= 50) return '👍 Bom progresso! Continue assim.'
    return '🌅 Vamos começar! Cada passo conta.'
  }

  const toggleMeal = (mealId: MealType) =>
    setExpandedMeals((prev) => {
      const next = new Set(prev)
      if (next.has(mealId)) {
        next.delete(mealId)
      } else {
        next.add(mealId)
      }
      return next
    })

  const handleAddFood = async (foodData: {
    selectedMealType: MealType
    selectedFood: SelectedFood
    quantity: number
  }) => {
    await actions.addFood(foodData)
  }

  const handleUpdateFood = async (
    itemId: UUID,
    data: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number },
  ) => {
    await actions.updateFood(itemId, data)
  }

  const handleEditClick = (item: MealItem) => {
    setItemToEdit(item)
    setIsFoodModalOpen(true)
  }
  const handleDeleteClick = (itemId: UUID) => {
    actions.deleteFood(itemId)
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-5xl">
          <div className="mb-10 space-y-3">
            <SkeletonBlock className="h-10 w-56" />
            <SkeletonBlock className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <SkeletonBlock className="h-80 xl:col-span-2" />
            <div className="space-y-6">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentKcal = Math.round(dailyIntake?.total_kcal || 0)
  const goalKcal = Math.round(dailyIntake?.goal_kcal || 2000)

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <PhoenixBackground progress={calorieProgress} />

      <div className="relative z-10 w-full px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-screen-2xl">
          {/* Cabeçalho */}
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">Nutrição</h1>
                <p className={`${TOKENS.textMuted} text-lg font-light sm:text-xl`}>
                  {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                </p>
              </div>
              <Button
                onClick={() => setIsFoodModalOpen(true)}
                className={`${TOKENS.gradientAction} text-white ${TOKENS.radius.lg} ${TOKENS.shadow.deep} transition-all hover:shadow-2xl`}
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" /> Adicionar alimento
              </Button>
            </div>
          </motion.header>

          {/* Grid principal */}
          <div className="grid grid-cols-1 gap-8 lg:gap-12 xl:grid-cols-3">
            {/* Coluna esquerda */}
            <div className="space-y-8 xl:col-span-2">
              {/* Donut */}
              <Card className={`${cardBase} flex flex-col items-center p-8 lg:p-12`}>
                <DonutProgress current={currentKcal} goal={goalKcal} />
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mt-6 max-w-md text-center text-xl font-medium text-foreground"
                >
                  {getMotivationalMessage(calorieProgress)}
                </motion.p>
              </Card>

              {/* Insight/coach (opcional) */}
              <Card className={`${cardBase} p-8 lg:p-12`}>
                <PhoenixOracle
                  dailyIntake={dailyIntake || {}}
                  mealTotals={Array.isArray(mealTotals) ? mealTotals : []}
                  weeklySummary={Array.isArray(weeklySummary) ? weeklySummary : []}
                />
              </Card>

              {/* Análise semanal — SEM && curto; usar ternário sempre */}
              {Array.isArray(weeklySummary) && weeklySummary.length > 0 ? (
                <Card className={`${cardBase} p-8 lg:p-12`}>
                  <h3 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-foreground">
                    <Calendar className="h-6 w-6 text-orange-500" /> Análise Semanal
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <defs>
                          <linearGradient id="phoenix-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ea580c" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                          }}
                        />
                        <Line type="monotone" dataKey="adherence" stroke="url(#phoenix-gradient)" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              ) : (
                null
              )}
            </div>

            {/* Coluna direita */}
            <div className="space-y-8 xl:col-span-1">
              {/* Lista de refeições */}
              <Card className={`${cardBase} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Refeições</h2>
                  <Button
                    onClick={() => setIsFoodModalOpen(true)}
                    size="sm"
                    variant="outline"
                    className={`${TOKENS.radius.lg} border-orange-500 text-orange-600 transition-colors hover:bg-orange-500 hover:text-white`}
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {MEALS.map((mealId) => {
                    const data = Array.isArray(mealTotals)
                      ? mealTotals.find((m) => m.meal_type === mealId)
                      : null
                    const items = Array.isArray(mealItems)
                      ? mealItems.filter((i) => i.meal_type === mealId)
                      : []
                    const mealCfg = MEAL_CONFIGS[mealId]
                    return (
                      <MealCard
                        key={mealId}
                        meal={mealCfg}
                        data={data || null}
                        items={items}
                        isExpanded={expandedMeals.has(mealId)}
                        onToggle={() => toggleMeal(mealId)}
                        onEditItem={handleEditClick}
                        onDeleteItem={handleDeleteClick}
                      />
                    )
                  })}
                </div>
              </Card>

              {/* Ações rápidas */}
              <Card className={`${cardBase} p-6 text-center`}>
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-orange-500" />
                <h3 className="mb-1 text-xl font-semibold">Nutricionista Phoenix</h3>
                <p className={`${TOKENS.textMuted} mb-5`}>Seu plano está otimizado para os melhores resultados.</p>
                <div className="space-y-3">
                  <Button
                    onClick={actions.recalculateGoals}
                    disabled={recalculating}
                    variant="outline"
                    className={`w-full ${TOKENS.radius.lg} border-orange-500 text-orange-600 transition-colors hover:bg-orange-500 hover:text-white`}
                  >
                    <RefreshCw className={`mr-2 h-5 w-5 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculando...' : 'Recalcular metas'}
                  </Button>
                  <Button
                    onClick={actions.fetchAllData}
                    variant="outline"
                    className={`w-full ${TOKENS.radius.lg} border-blue-500 text-blue-600 transition-colors hover:bg-blue-500 hover:text-white`}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Atualizar dados
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal CRUD */}
      <FoodModal
        open={isFoodModalOpen}
        onOpenChange={(open) => {
          setIsFoodModalOpen(open)
          if (!open) setItemToEdit(null)
        }}
        onAddFood={(payload) => handleAddFood(payload)}
        onUpdateFood={(id, payload) => handleUpdateFood(id, payload)}
        itemToEdit={itemToEdit}
        meals={Object.values(MEAL_CONFIGS)} // passa configs completas para o modal
      />
    </div>
  )
}
