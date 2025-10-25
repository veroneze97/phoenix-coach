-- Phoenix Coach - Coach Messages Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Coach Messages (weekly personalized messages)
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_ref TEXT NOT NULL, -- Format: 'YYYY-WW' (e.g., '2025-W03')
  tone TEXT NOT NULL CHECK (tone IN ('excellent', 'good', 'low')),
  message TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_ref)
);

-- Enable Row Level Security
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_messages
CREATE POLICY "Users can view own coach messages"
  ON public.coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coach messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach messages"
  ON public.coach_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach messages"
  ON public.coach_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_coach_messages_user_week ON public.coach_messages(user_id, week_ref DESC);
CREATE INDEX idx_coach_messages_created ON public.coach_messages(created_at DESC);

-- Trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION update_coach_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coach_timestamp
  BEFORE UPDATE ON public.coach_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_timestamp();

-- Success message
SELECT 'Coach messages schema created successfully! 🔥' as message;