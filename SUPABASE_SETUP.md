# Phoenix Coach - Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Create a new project:
   - **Project name**: `phoenix-coach`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for MVP
4. Wait 2-3 minutes for project to initialize

## Step 2: Get Your Credentials

1. Once project is ready, go to **Settings** → **API**
2. Find and copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
3. Save these - you'll add them to `.env.local` file

## Step 3: Create Database Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Paste and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  goals_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily checks table
CREATE TABLE public.checks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INTEGER DEFAULT 0,
  steps INTEGER DEFAULT 0,
  sleep_min INTEGER DEFAULT 0,
  training_completed BOOLEAN DEFAULT FALSE,
  diet_adherence INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for checks table
CREATE POLICY "Users can view own checks"
  ON public.checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checks"
  ON public.checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checks"
  ON public.checks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checks"
  ON public.checks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_checks_user_date ON public.checks(user_id, date DESC);
CREATE INDEX idx_checks_user_id ON public.checks(user_id);
```

## Step 4: Configure Google OAuth (Optional - for Google Sign-In)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and enable it
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
4. Save changes

## Step 5: Update Your Project Environment Variables

1. Create `/app/.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# Future LLM integration (not used yet in MVP)
LLM_PROVIDER=emergent
LLM_API_KEY=YOUR-EMERGENT-KEY
```

2. Replace:
   - `YOUR-PROJECT` with your actual project ID
   - `YOUR-ANON-KEY` with your anon/public key

## Step 6: Verify Setup

1. Check that tables are created: **Database** → **Tables**
2. You should see: `users`, `checks`
3. Verify RLS is enabled (green shield icon)

## Troubleshooting

**Problem**: Tables not created
- **Solution**: Make sure you ran the SQL in Step 3 completely

**Problem**: RLS errors when testing
- **Solution**: Verify policies are created (check Policies tab in table view)

**Problem**: Google OAuth not working
- **Solution**: Double-check redirect URI matches exactly

---

✅ Once complete, come back and let me know - the app is ready to connect!
