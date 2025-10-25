-- Phoenix Coach - Training Module Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Exercise Library (pre-populated + custom exercises)
CREATE TABLE IF NOT EXISTS public.exercise_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  name_pt TEXT,
  category TEXT NOT NULL,
  muscle_groups TEXT[],
  is_default BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Workout Plans (ABC, Upper/Lower, Push/Pull/Legs templates)
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template_type TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts (daily training sessions)
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT DEFAULT 'Treino',
  duration_min INTEGER,
  rpe_avg DECIMAL(3,1),
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within a workout
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_library_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER,
  reps_min INTEGER,
  reps_max INTEGER,
  load_kg DECIMAL(6,2),
  rest_s INTEGER DEFAULT 60,
  rpe DECIMAL(3,1),
  notes TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Records
CREATE TABLE IF NOT EXISTS public.prs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  best_load DECIMAL(6,2),
  best_reps INTEGER,
  best_volume DECIMAL(8,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_name)
);

-- Enable Row Level Security
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_library
CREATE POLICY "Users can view default exercises"
  ON public.exercise_library FOR SELECT
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create custom exercises"
  ON public.exercise_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom exercises"
  ON public.exercise_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom exercises"
  ON public.exercise_library FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_plans
CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workouts
CREATE POLICY "Users can view own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for exercises
CREATE POLICY "Users can view exercises in own workouts"
  ON public.exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workouts w 
    WHERE w.id = exercises.workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can create exercises in own workouts"
  ON public.exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workouts w 
    WHERE w.id = exercises.workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can update exercises in own workouts"
  ON public.exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w 
    WHERE w.id = exercises.workout_id AND w.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete exercises in own workouts"
  ON public.exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w 
    WHERE w.id = exercises.workout_id AND w.user_id = auth.uid()
  ));

-- RLS Policies for prs
CREATE POLICY "Users can view own PRs"
  ON public.prs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own PRs"
  ON public.prs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PRs"
  ON public.prs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PRs"
  ON public.prs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, date DESC);
CREATE INDEX idx_exercises_workout ON public.exercises(workout_id, order_index);
CREATE INDEX idx_prs_user ON public.prs(user_id, exercise_name);
CREATE INDEX idx_workout_plans_user ON public.workout_plans(user_id, is_active);
CREATE INDEX idx_exercise_library_category ON public.exercise_library(category, is_default);
