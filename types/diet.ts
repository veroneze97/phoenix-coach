// /types/diet.ts
// Tipos compartilhados para as telas/fluxos de Nutrição (DietPlanner)
// Mantém contrato único entre hooks, componentes e serviços.

export type UUID = string;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DailyIntake {
  total_kcal?: number;
  goal_kcal?: number;
  total_carbs_g?: number;
  goal_carbs_g?: number;
  total_protein_g?: number;
  goal_protein_g?: number;
  total_fat_g?: number;
  goal_fat_g?: number;
}

export interface MealTotal {
  meal_type: MealType;
  total_kcal?: number;
  total_carbs_g?: number;
  total_protein_g?: number;
  total_fat_g?: number;
}

export interface MealItem {
  id: UUID;
  meal_type: MealType;
  food_id: UUID;
  food_name: string;
  grams_per_unit?: number;   // g por unidade (ex.: 1 ovo = 50g). Pode não existir.
  quantity_grams?: number;   // total em gramas derivado das "unidades"
  grams_total?: number;      // alias compatível com schemas antigos
  item_kcal?: number;        // cache local de kcal do item (opcional)
  __optimistic__?: boolean;  // flag de UI otimista
}

export interface WeeklyPoint {
  date: string;              // ISO date (YYYY-MM-DD)
  avg_adherence_pct?: number;
}

export interface MealConfig {
  id: MealType;
  name: string;
  // ícone é fornecido pelo chamador; manter como any para não acoplar com React aqui
  icon: any;
  emoji: string;
  gradient: string;
}

export type SelectedFood = {
  id: UUID;
  name: string;
  grams_per_unit?: number;
  kcal_per_100g?: number;
  carbs_g_per_100g?: number;
  protein_g_per_100g?: number;
  fat_g_per_100g?: number;
};
