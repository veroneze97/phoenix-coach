'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react'

// 🔎 Tipos centrais do módulo de dieta
import type { UUID, MealType, MealTotal, MealItem, MealConfig } from '@/types/diet'

/** Tokens visuais locais (devem casar com os usados na página) */
const TOKENS = {
  textMuted: 'text-muted-foreground',
  cardBase:
    'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/15 dark:border-zinc-700/40 shadow-2xl rounded-3xl',
}

interface MealCardProps {
  meal: MealConfig
  data?: MealTotal | null
  items: MealItem[]
  isExpanded: boolean
  onToggle: () => void
  onEditItem: (item: MealItem) => void
  onDeleteItem: (id: UUID) => void
}

/**
 * Card da Refeição + Lista de Itens (com edição/remoção)
 * - Sem dependências de contexto externo
 * - Focado em acessibilidade (aria-* e foco)
 */
const MealCard = memo(function MealCard({
  meal,
  data,
  items,
  isExpanded,
  onToggle,
  onEditItem,
  onDeleteItem,
}: MealCardProps) {
  const Icon = meal.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`${TOKENS.cardBase} p-5 transition-all hover:-translate-y-0.5`}>
        {/* Cabeçalho clicável */}
        <button
          type="button"
          className="flex w-full items-center justify-between text-left focus:outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-orange-500"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={`meal-${meal.id}`}
        >
          <div className="flex items-center gap-4">
            <span
              className={`rounded-full bg-gradient-to-br p-3 ${meal.gradient} shadow-md`}
              aria-hidden
            >
              {Icon ? (
                <Icon className="h-6 w-6 text-white" />
              ) : (
                <span className="text-lg text-white">{meal.emoji}</span>
              )}
            </span>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <span aria-hidden>{meal.emoji}</span> {meal.name}
              </h3>
              <p className={`${TOKENS.textMuted} text-sm`}>
                {Math.round(data?.total_kcal || 0)} kcal
              </p>
              <div className="mt-1 flex flex-wrap gap-3 text-[12px] font-medium">
                <span className="text-green-600 dark:text-green-400">
                  C: {Math.round(data?.total_carbs_g || 0)}g
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  P: {Math.round(data?.total_protein_g || 0)}g
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  G: {Math.round(data?.total_fat_g || 0)}g
                </span>
              </div>
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp className="h-5 w-5 opacity-70" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 opacity-70" aria-hidden />
          )}
        </button>

        {/* Lista de itens (expansível) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={`meal-${meal.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`group/item rounded-lg p-3 transition-colors ${
                        item.__optimistic__
                          ? 'bg-yellow-100/50 dark:bg-yellow-900/20'
                          : 'bg-accent/40 hover:bg-accent/60'
                      }`}
                      title={item.__optimistic__ ? 'Sincronizando…' : undefined}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {item.food_name}
                          {item.__optimistic__ ? ' (…)' : ''}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            {item.item_kcal ?? '—'} kcal
                          </span>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditItem(item)
                              }}
                              aria-label="Editar alimento"
                              disabled={!!item.__optimistic__}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                              }}
                              aria-label="Remover alimento"
                              disabled={!!item.__optimistic__}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`${TOKENS.textMuted} py-2 text-center text-sm`}>
                    Nenhum alimento adicionado.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

export default MealCard
