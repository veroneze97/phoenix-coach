// /lib/diet-utils.ts
// Funções utilitárias e hooks compartilhados pelo fluxo de Nutrição (DietPlanner)

import { useEffect, useState } from 'react';
import type {
  DailyIntake,
  MealTotal,
  MealType,
  SelectedFood,
} from '@/types/diet';

// -----------------------------
// Num seguro
// -----------------------------
export function num(n?: number) {
  return Number.isFinite(n) ? (n as number) : 0;
}

// -----------------------------
// Conversões de quantidade
// -----------------------------
/** Converte “unidades” (ex.: 2 ovos) em gramas com base no grams_per_unit. */
export function gramsFromUnits(units: number, gramsPerUnit?: number) {
  const gpu = gramsPerUnit && gramsPerUnit > 0 ? gramsPerUnit : 1;
  return units * gpu;
}

// -----------------------------
// Cálculo de deltas nutricionais
// -----------------------------
/** Calcula o impacto (kcal/macros) dado um alimento e o total em gramas. */
export function computeDeltaFromFood(food: SelectedFood, gramsTotal: number) {
  const factor = gramsTotal / 100;
  return {
    kcal: num(food.kcal_per_100g) * factor,
    carbs: num(food.carbs_g_per_100g) * factor,
    protein: num(food.protein_g_per_100g) * factor,
    fat: num(food.fat_g_per_100g) * factor,
  };
}

// -----------------------------
// Acúmulo em totais do dia/refeição
// -----------------------------
/** Soma/subtrai deltas no total diário. */
export function applyDailyDelta(
  d: DailyIntake | null,
  delta: { kcal: number; carbs: number; protein: number; fat: number },
): DailyIntake {
  const base: DailyIntake = d ? { ...d } : {};
  base.total_kcal = num(base.total_kcal) + delta.kcal;
  base.total_carbs_g = num(base.total_carbs_g) + delta.carbs;
  base.total_protein_g = num(base.total_protein_g) + delta.protein;
  base.total_fat_g = num(base.total_fat_g) + delta.fat;
  return base;
}

/** Soma/subtrai deltas nos totais por refeição. */
export function applyMealDelta(
  totals: MealTotal[],
  mealType: MealType,
  delta: { kcal: number; carbs: number; protein: number; fat: number },
): MealTotal[] {
  const arr = [...totals];
  const idx = arr.findIndex((t) => t.meal_type === mealType);
  if (idx === -1) {
    arr.push({
      meal_type: mealType,
      total_kcal: delta.kcal,
      total_carbs_g: delta.carbs,
      total_protein_g: delta.protein,
      total_fat_g: delta.fat,
    });
  } else {
    const t = { ...arr[idx] };
    t.total_kcal = num(t.total_kcal) + delta.kcal;
    t.total_carbs_g = num(t.total_carbs_g) + delta.carbs;
    t.total_protein_g = num(t.total_protein_g) + delta.protein;
    t.total_fat_g = num(t.total_fat_g) + delta.fat;
    arr[idx] = t;
  }
  return arr;
}

// -----------------------------
// Hook de debounce (uso em buscas)
// -----------------------------
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
