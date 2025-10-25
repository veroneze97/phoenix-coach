-- Phoenix Coach - Exercise Library Population
-- Run this AFTER running TREINO_SUPABASE_SCHEMA.sql

INSERT INTO public.exercise_library (name, name_pt, category, muscle_groups, is_default, user_id) VALUES
-- CHEST
('Bench Press', 'Supino Reto', 'chest', ARRAY['peitoral', 'triceps', 'ombros'], true, NULL),
('Incline Bench Press', 'Supino Inclinado', 'chest', ARRAY['peitoral superior', 'triceps'], true, NULL),
('Decline Bench Press', 'Supino Declinado', 'chest', ARRAY['peitoral inferior', 'triceps'], true, NULL),
('Dumbbell Press', 'Supino com Halteres', 'chest', ARRAY['peitoral', 'triceps'], true, NULL),
('Incline Dumbbell Press', 'Supino Inclinado Halteres', 'chest', ARRAY['peitoral superior'], true, NULL),
('Chest Fly', 'Crucifixo', 'chest', ARRAY['peitoral'], true, NULL),
('Cable Crossover', 'Crossover', 'chest', ARRAY['peitoral'], true, NULL),
('Push-Ups', 'Flexões', 'chest', ARRAY['peitoral', 'triceps', 'core'], true, NULL),
('Dips', 'Paralelas', 'chest', ARRAY['peitoral', 'triceps'], true, NULL),

-- BACK
('Deadlift', 'Levantamento Terra', 'back', ARRAY['costas', 'posterior', 'core'], true, NULL),
('Barbell Row', 'Remada Curvada', 'back', ARRAY['costas', 'biceps'], true, NULL),
('Dumbbell Row', 'Remada Unilateral', 'back', ARRAY['costas', 'biceps'], true, NULL),
('Lat Pulldown', 'Puxada Frontal', 'back', ARRAY['dorsais', 'biceps'], true, NULL),
('Pull-Ups', 'Barra Fixa', 'back', ARRAY['dorsais', 'biceps'], true, NULL),
('Chin-Ups', 'Barra Supinada', 'back', ARRAY['dorsais', 'biceps'], true, NULL),
('Seated Cable Row', 'Remada Sentado', 'back', ARRAY['costas', 'biceps'], true, NULL),
('T-Bar Row', 'Remada T', 'back', ARRAY['costas', 'biceps'], true, NULL),
('Face Pulls', 'Puxada Face', 'back', ARRAY['deltoides posterior', 'trapézio'], true, NULL),

-- LEGS
('Squat', 'Agachamento', 'legs', ARRAY['quadriceps', 'gluteos', 'posterior'], true, NULL),
('Front Squat', 'Agachamento Frontal', 'legs', ARRAY['quadriceps', 'core'], true, NULL),
('Leg Press', 'Leg Press', 'legs', ARRAY['quadriceps', 'gluteos'], true, NULL),
('Romanian Deadlift', 'Levantamento Romeno', 'legs', ARRAY['posterior', 'gluteos'], true, NULL),
('Leg Curl', 'Mesa Flexora', 'legs', ARRAY['posterior'], true, NULL),
('Leg Extension', 'Cadeira Extensora', 'legs', ARRAY['quadriceps'], true, NULL),
('Lunges', 'Afundo', 'legs', ARRAY['quadriceps', 'gluteos'], true, NULL),
('Bulgarian Split Squat', 'Afundo Búlgaro', 'legs', ARRAY['quadriceps', 'gluteos'], true, NULL),
('Calf Raise', 'Panturrilha', 'legs', ARRAY['panturrilha'], true, NULL),
('Hip Thrust', 'Elevação Quadril', 'legs', ARRAY['gluteos', 'posterior'], true, NULL),

-- SHOULDERS
('Overhead Press', 'Desenvolvimento', 'shoulders', ARRAY['ombros', 'triceps'], true, NULL),
('Dumbbell Shoulder Press', 'Desenvolvimento Halteres', 'shoulders', ARRAY['ombros'], true, NULL),
('Lateral Raise', 'Elevação Lateral', 'shoulders', ARRAY['deltoides lateral'], true, NULL),
('Front Raise', 'Elevação Frontal', 'shoulders', ARRAY['deltoides anterior'], true, NULL),
('Rear Delt Fly', 'Crucifixo Inverso', 'shoulders', ARRAY['deltoides posterior'], true, NULL),
('Arnold Press', 'Arnold Press', 'shoulders', ARRAY['ombros'], true, NULL),
('Upright Row', 'Remada Alta', 'shoulders', ARRAY['ombros', 'trapézio'], true, NULL),
('Shrugs', 'Encolhimento', 'shoulders', ARRAY['trapézio'], true, NULL),

-- ARMS
('Barbell Curl', 'Rosca Direta', 'arms', ARRAY['biceps'], true, NULL),
('Dumbbell Curl', 'Rosca Alternada', 'arms', ARRAY['biceps'], true, NULL),
('Hammer Curl', 'Rosca Martelo', 'arms', ARRAY['biceps', 'antebraço'], true, NULL),
('Preacher Curl', 'Rosca Scott', 'arms', ARRAY['biceps'], true, NULL),
('Concentration Curl', 'Rosca Concentrada', 'arms', ARRAY['biceps'], true, NULL),
('Tricep Dips', 'Mergulho Triceps', 'arms', ARRAY['triceps'], true, NULL),
('Tricep Pushdown', 'Triceps Pulley', 'arms', ARRAY['triceps'], true, NULL),
('Overhead Tricep Extension', 'Triceps Testa', 'arms', ARRAY['triceps'], true, NULL),
('Close-Grip Bench Press', 'Supino Fechado', 'arms', ARRAY['triceps', 'peitoral'], true, NULL),
('Skull Crushers', 'Triceps Francês', 'arms', ARRAY['triceps'], true, NULL),

-- CORE
('Plank', 'Prancha', 'core', ARRAY['core', 'abdomen'], true, NULL),
('Side Plank', 'Prancha Lateral', 'core', ARRAY['obliquos'], true, NULL),
('Crunches', 'Abdominal', 'core', ARRAY['abdomen'], true, NULL),
('Russian Twist', 'Twist Russo', 'core', ARRAY['obliquos'], true, NULL),
('Leg Raises', 'Elevação Pernas', 'core', ARRAY['abdomen inferior'], true, NULL),
('Cable Crunch', 'Abdominal Pulley', 'core', ARRAY['abdomen'], true, NULL),
('Ab Wheel', 'Roda Abdominal', 'core', ARRAY['core'], true, NULL),

-- CARDIO
('Running', 'Corrida', 'cardio', ARRAY['cardio'], true, NULL),
('Cycling', 'Bike', 'cardio', ARRAY['cardio', 'pernas'], true, NULL),
('Rowing', 'Remo', 'cardio', ARRAY['cardio', 'costas'], true, NULL),
('Jump Rope', 'Pular Corda', 'cardio', ARRAY['cardio', 'panturrilha'], true, NULL),
('Burpees', 'Burpees', 'cardio', ARRAY['cardio', 'corpo todo'], true, NULL)
ON CONFLICT (name, user_id) DO NOTHING;

SELECT 'Exercise library populated with 55 exercises! 💪' as message;
