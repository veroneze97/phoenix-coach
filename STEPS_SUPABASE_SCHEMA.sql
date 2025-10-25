-- Phoenix Coach - Steps Module Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Steps Logs (daily steps tracking)
CREATE TABLE IF NOT EXISTS public.steps_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0),
  goal INTEGER DEFAULT 8000 CHECK (goal > 0),
  source TEXT DEFAULT 'manual', -- 'manual', 'ios_shortcut', 'api'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.steps_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for steps_logs
CREATE POLICY "Users can view own steps logs"
  ON public.steps_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own steps logs"
  ON public.steps_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps logs"
  ON public.steps_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps logs"
  ON public.steps_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_steps_logs_user_date ON public.steps_logs(user_id, date DESC);
CREATE INDEX idx_steps_logs_source ON public.steps_logs(source);

-- Trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION update_steps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_steps_timestamp
  BEFORE UPDATE ON public.steps_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_steps_timestamp();

-- Success message
SELECT 'Steps module schema created successfully! 👟' as message;