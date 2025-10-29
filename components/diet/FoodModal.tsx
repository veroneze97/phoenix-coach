// components/diet/FoodModal.tsx
'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ✅ tipos centralizados
import type { UUID, MealType, MealItem, SelectedFood, MealConfig } from '@/types/diet'
// ✅ tokens centralizados
import { TOKENS, cardBase } from '@/components/diet/tokens'

interface FoodModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAddFood: (data: {
    selectedMealType: MealType
    selectedFood: SelectedFood
    quantity: number
  }) => Promise<void>
  onUpdateFood: (
    id: UUID,
    data: { selectedMealType: MealType; selectedFood: SelectedFood; quantity: number },
  ) => Promise<void>
  itemToEdit: MealItem | null
  meals: MealConfig[]
}

type FoodRow = {
  id: UUID
  name: string
  grams_per_unit?: number | null
  kcal_per_100g?: number | null
  carbs_g_per_100g?: number | null
  protein_g_per_100g?: number | null
  fat_g_per_100g?: number | null
}

const FoodModal = memo(function FoodModal({
  open,
  onOpenChange,
  onAddFood,
  onUpdateFood,
  itemToEdit,
  meals,
}: FoodModalProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<FoodRow[]>([])
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (itemToEdit) {
      setSelectedMealType(itemToEdit.meal_type)
      setFoodSearch(itemToEdit.food_name)
      setSelectedFood({
        id: itemToEdit.food_id,
        name: itemToEdit.food_name,
        grams_per_unit: itemToEdit.grams_per_unit,
      })
      const grams = itemToEdit.quantity_grams ?? itemToEdit.grams_total ?? 0
      const gpu = itemToEdit.grams_per_unit || 1
      const units = gpu ? grams / gpu : grams
      setQuantity(String(Number.isFinite(units) ? Math.max(0, +units) : 0))
    } else {
      setSelectedMealType('breakfast')
      setFoodSearch('')
      setSelectedFood(null)
      setQuantity('')
      setFoodResults([])
    }
  }, [itemToEdit, open])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (foodSearch.trim().length < 2) {
        setFoodResults([])
        return
      }
      const { data, error } = await supabase
        .from('foods')
        .select(
          'id,name,grams_per_unit,kcal_per_100g,carbs_g_per_100g,protein_g_per_100g,fat_g_per_100g',
        )
        .ilike('name', `%${foodSearch}%`)
        .limit(10)

      if (error) {
        toast.error('Erro ao buscar alimentos.')
        return
      }
      setFoodResults((data || []) as FoodRow[])
    }, 300)

    return () => clearTimeout(timeout)
  }, [foodSearch])

  const handleSave = async () => {
    const qty = parseFloat(quantity)
    if (!selectedFood) {
      toast.error('Selecione um alimento da lista.')
      return
    }
    if (!quantity || isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida (> 0).')
      return
    }

    setIsSaving(true)
    try {
      const payload = { selectedMealType, selectedFood, quantity: qty }
      if (itemToEdit) {
        await onUpdateFood(itemToEdit.id, payload)
      } else {
        await onAddFood(payload)
      }
      onOpenChange(false)
    } catch (e) {
      toast.error('Não foi possível salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !isSaving && onOpenChange(v)}>
      <DialogContent className={`sm:max-w-lg ${cardBase} p-6`}>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {itemToEdit ? 'Editar Alimento' : 'Adicionar Alimento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de refeição */}
          <div>
            <Label className="text-sm font-semibold">Para qual refeição?</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {meals.map((meal) => (
                <Button
                  key={meal.id}
                  variant={selectedMealType === meal.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMealType(meal.id)}
                  className={`rounded-xl py-3 transition-all ${
                    selectedMealType === meal.id
                      ? `bg-gradient-to-r ${meal.gradient} ${TOKENS.shadow.soft}`
                      : ''
                  }`}
                  aria-pressed={selectedMealType === meal.id}
                >
                  <span className="mr-2">{meal.emoji}</span> {meal.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Busca de alimento */}
          <div>
            <Label className="text-sm font-semibold">Buscar alimento</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden />
              <Input
                placeholder="Ex: Frango, Arroz..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && foodResults[0]) {
                    const f = foodResults[0]
                    setSelectedFood({
                      id: f.id,
                      name: f.name,
                      grams_per_unit: f.grams_per_unit ?? 100,
                      kcal_per_100g: f.kcal_per_100g ?? 0,
                      carbs_g_per_100g: f.carbs_g_per_100g ?? 0,
                      protein_g_per_100g: f.protein_g_per_100g ?? 0,
                      fat_g_per_100g: f.fat_g_per_100g ?? 0,
                    })
                    setFoodSearch(f.name)
                    setFoodResults([])
                  }
                }}
                className="h-11 rounded-xl pl-10"
              />
              {foodResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 max-h-56 overflow-y-auto rounded-xl border bg-accent/40 p-2"
                >
                  {foodResults.map((food) => (
                    <button
                      type="button"
                      key={food.id}
                      onClick={() => {
                        setSelectedFood({
                          id: food.id,
                          name: food.name,
                          grams_per_unit: food.grams_per_unit ?? 100,
                          kcal_per_100g: food.kcal_per_100g ?? 0,
                          carbs_g_per_100g: food.carbs_g_per_100g ?? 0,
                          protein_g_per_100g: food.protein_g_per_100g ?? 0,
                          fat_g_per_100g: food.fat_g_per_100g ?? 0,
                        })
                        setFoodSearch(food.name)
                        setFoodResults([])
                      }}
                      className="w-full rounded-md p-3 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <p className="font-medium text-foreground">{food.name}</p>
                      <p className="text-xs opacity-70">
                        {food.kcal_per_100g ?? 0} kcal / 100g — C:{food.carbs_g_per_100g ?? 0} P:
                        {food.protein_g_per_100g ?? 0} G:{food.fat_g_per_100g ?? 0}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <Label className="text-sm font-semibold">Quantidade (em unidades)</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 1 (ovo), 2..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-2 h-11 rounded-xl"
            />
            {selectedFood && quantity && (
              <p className="mt-1 text-xs opacity-70">
                Total: ~
                {Math.round((parseFloat(quantity) || 0) * (selectedFood.grams_per_unit || 1))}g
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-xl"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFood || !quantity || isSaving}
            className={`h-11 flex-1 rounded-xl ${TOKENS.gradientAction} ${TOKENS.shadow.soft} text-white transition-all hover:shadow-xl`}
          >
            {isSaving ? 'Salvando...' : itemToEdit ? 'Salvar alterações' : 'Adicionar alimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export default FoodModal
