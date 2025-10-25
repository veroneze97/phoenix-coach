-- Phoenix Coach - Sleep Module Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Sleep Logs (daily sleep tracking)
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bed_time TIME NOT NULL,
  wake_time TIME NOT NULL,
  latency_min INTEGER DEFAULT 15,
  quality INTEGER CHECK (quality >= 1 AND quality <= 5),
  notes TEXT,
  duration_min INTEGER, -- Calculated field
  sleep_cycles INTEGER, -- Number of complete cycles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sleep_logs
CREATE POLICY "Users can view own sleep logs"
  ON public.sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sleep logs"
  ON public.sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
  ON public.sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
  ON public.sleep_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, date DESC);

-- Function to calculate duration in minutes
CREATE OR REPLACE FUNCTION calculate_sleep_duration(
  bed_time TIME,
  wake_time TIME
)
RETURNS INTEGER AS $$
DECLARE
  bed_minutes INTEGER;
  wake_minutes INTEGER;
  duration INTEGER;
BEGIN
  bed_minutes := EXTRACT(HOUR FROM bed_time) * 60 + EXTRACT(MINUTE FROM bed_time);
  wake_minutes := EXTRACT(HOUR FROM wake_time) * 60 + EXTRACT(MINUTE FROM wake_time);
  
  -- Handle overnight sleep
  IF wake_minutes <= bed_minutes THEN
    wake_minutes := wake_minutes + 1440; -- Add 24 hours
  END IF;
  
  duration := wake_minutes - bed_minutes;
  RETURN duration;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate duration and cycles on insert/update
CREATE OR REPLACE FUNCTION update_sleep_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration
  NEW.duration_min := calculate_sleep_duration(NEW.bed_time, NEW.wake_time);
  
  -- Calculate approximate sleep cycles (90 min each)
  NEW.sleep_cycles := ROUND((NEW.duration_min - COALESCE(NEW.latency_min, 15))::NUMERIC / 90);
  
  -- Update timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sleep_calculations
  BEFORE INSERT OR UPDATE ON public.sleep_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_sleep_calculations();

-- Success message
SELECT 'Sleep module schema created successfully! 🌙' as message;
