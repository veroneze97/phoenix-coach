# 🔥 Phoenix Coach PWA

**Rise stronger every day** - Your personal health and fitness companion

## ✨ Features Implemented (MVP)

### 🔐 Authentication
- ✅ Email/Password signup and login
- ✅ Google OAuth integration
- ✅ User profile management
- 🔜 Apple Sign-In (prepared, not enabled yet)

### 📊 Core Features
- ✅ **Phoenix Score**: Dynamic 0-100 score based on daily metrics
- ✅ **Daily Tracking**:
  - 💧 Water intake (ml)
  - 🚶 Steps counter
  - 😴 Sleep hours
  - 💪 Training completion
  - 🥗 Diet adherence (1-10 scale)
- ✅ **Weekly Stats**: Visual progress tracking
- ✅ **Smart Coach**: Rule-based personalized insights and motivation

### 🎨 Design
- ✅ Apple-inspired UI with Phoenix aesthetic
- ✅ Amber/Gold color scheme (#FFB300 → #D97706)
- ✅ Glassmorphism effects
- ✅ 20px border radius
- ✅ SF Pro / Inter font stack
- ✅ Dark/Light mode support
- ✅ Smooth animations with Framer Motion

### 📱 PWA Features
- ✅ Mobile-first responsive design
- ✅ Bottom tab navigation (6 tabs)
- ✅ PWA manifest configured
- ✅ Service worker ready
- ✅ Installable on mobile devices

### 🗄️ Database (Supabase)
- ✅ Row Level Security (RLS) enabled
- ✅ `users` table: Profile data (height, weight, goals)
- ✅ `checks` table: Daily metrics with unique constraint

## 🚀 Getting Started

### Step 1: Configure Supabase

**👉 Follow the complete setup guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Quick summary:
1. Create Supabase project at https://supabase.com
2. Run the SQL schema (creates tables + RLS policies)
3. Get your credentials (URL + anon key)
4. Update `.env.local`

### Step 2: Update Environment Variables

Edit `/app/.env.local`:

```bash
# Replace these with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# Future LLM integration (not used in MVP)
LLM_PROVIDER=emergent
LLM_API_KEY=YOUR-EMERGENT-KEY
```

### Step 3: Install Dependencies (if needed)

```bash
cd /app
yarn install
```

### Step 4: Run the App

The app should already be running on port 3000. If not:

```bash
sudo supervisorctl restart nextjs
```

Access at: `http://localhost:3000`

## 📱 App Structure

### Navigation Tabs

1. **🏠 Home**: Phoenix Score + Daily metrics input
2. **💪 Treino**: Training tracking (placeholder for future workout plans)
3. **🥗 Dieta**: Diet adherence (placeholder for meal plans)
4. **😴 Sono**: Sleep tracking with tips
5. **✨ Coach**: Personalized insights and consistency tracker
6. **👤 Perfil**: User profile and settings

## 🧪 Testing

Once Supabase is configured, test these flows:

1. **Auth Flow**:
   - Sign up with email
   - Sign in with existing account
   - Sign in with Google
   - Complete profile setup

2. **Daily Tracking**:
   - Adjust water, steps, sleep sliders
   - Toggle training completion
   - Set diet adherence
   - Save progress
   - Verify Phoenix Score updates

3. **Data Persistence**:
   - Reload page - today's data should persist
   - Check week stats display

4. **PWA Installation**:
   - Mobile: Look for "Add to Home Screen" prompt
   - Desktop Chrome: Check install icon in address bar

## 🔮 Future Enhancements (Post-MVP)

- 🤖 AI-powered coaching with Emergent LLM
- 📝 Custom workout plans
- 🍽️ Meal planning and calorie tracking
- 📈 Advanced analytics and insights
- 🏆 Achievements and streaks
- 👥 Social features and challenges
- 🍎 Apple Sign-In integration
- 📸 Progress photos
- 🔔 Smart notifications

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Animations**: Framer Motion
- **Auth & DB**: Supabase
- **PWA**: next-pwa
- **Icons**: Lucide React
- **Theme**: next-themes

## 📝 Database Schema

### users table
```sql
- id: UUID (FK to auth.users)
- name: TEXT
- email: TEXT
- height_cm: INTEGER
- weight_kg: DECIMAL(5,2)
- goals_json: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

### checks table
```sql
- id: UUID (PK)
- user_id: UUID (FK to users)
- date: DATE
- water_ml: INTEGER
- steps: INTEGER
- sleep_min: INTEGER
- training_completed: BOOLEAN
- diet_adherence: INTEGER (0-10)
- notes: TEXT
- created_at, updated_at: TIMESTAMPTZ
- UNIQUE(user_id, date)
```

## 🎯 Phoenix Score Calculation

- **Water**: 0-25 points (based on 2500ml target)
- **Steps**: 0-25 points (based on 10,000 steps target)
- **Sleep**: 0-25 points (based on 8 hours target)
- **Training**: 0-15 points (boolean)
- **Diet**: 0-10 points (direct 1-10 scale)

**Total**: 0-100 points

## 🐛 Troubleshooting

### "Can't connect to Supabase"
- Check that you've updated `.env.local` with real credentials
- Verify your Supabase project is active
- Restart the Next.js server: `sudo supervisorctl restart nextjs`

### RLS Errors
- Ensure you ran the complete SQL schema from SUPABASE_SETUP.md
- Check that RLS policies are enabled in Supabase dashboard

### Google OAuth not working
- Complete Google OAuth setup in Supabase (see SUPABASE_SETUP.md Step 4)
- Verify redirect URI matches your Supabase URL

### PWA not installing
- Make sure you're using HTTPS (or localhost)
- Check manifest.json is accessible at `/manifest.json`
- Replace placeholder icons with actual 192x192 and 512x512 PNG files

## 📄 License

Private project for personal use.

---

**Built with ❤️ and 🔥** 

*"Like the Phoenix, rise from the ashes, stronger every day"*
