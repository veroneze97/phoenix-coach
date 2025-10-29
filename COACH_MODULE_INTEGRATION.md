# Coach Module - Supabase Integration

## Overview

The Coach Tab connects to Supabase to compute the Phoenix Score and generate personalized weekly coaching messages based on user performance across all modules.

## Phoenix Score Formula

```
Phoenix Score = 0.4·CT + 0.3·AD + 0.2·Sleep + 0.1·Steps
```

Where:

- **CT** = Training Consistency (% of days with workouts in last 7 days)
- **AD** = Diet Adherence (% of meals marked as adherent in last 7 days)
- **Sleep** = Sleep Quality (average quality score 1-5 converted to %)
- **Steps** = Steps Completion (average % of daily goal achieved in last 7 days)

## Database Schema

### Table: `coach_messages`

**Columns:**

- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `week_ref` (TEXT): Week reference in format 'YYYY-WW' (e.g., '2025-W03')
- `tone` (TEXT): Message tone - 'excellent', 'good', or 'low'
- `message` (TEXT): The generated coaching message
- `score` (INTEGER): Phoenix Score at time of generation (0-100)
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints:**

- UNIQUE constraint on (user_id, week_ref) - one message per week per user
- CHECK constraint on tone (must be 'excellent', 'good', or 'low')
- CHECK constraint on score (must be 0-100)

**RLS Policies:**

- Users can only view, create, update, and delete their own messages
- Policy: `auth.uid() = user_id`

## Data Sources

The Coach Tab fetches data from multiple tables:

1. **workouts** - Training consistency (count of workout days)
2. **meal_logs** - Diet adherence (% of meals with adherence_bool = true)
3. **sleep_logs** - Sleep quality (average quality score)
4. **steps_logs** - Steps completion (average % of goal achieved)

## Message Generation Logic

### Tone Categories

**Excellent (Score ≥ 80):**

- Tone: 'excellent'
- Message emphasizes exceptional consistency
- Encourages maintaining current level

**Good (Score ≥ 60):**

- Tone: 'good'
- Message acknowledges good progress
- Encourages improvement in weak areas

**Low (Score < 60):**

- Tone: 'low'
- Message provides encouragement
- Focuses on recovery and reorganization

### Auto-Generation

Messages are generated:

1. On demand via "Gerar Nova Mensagem Semanal" button
2. Uses current Phoenix Score
3. Stored with current week reference (YYYY-WW format)
4. Upserts to avoid duplicates (one message per week)

## Component Features

### CoachTab.js

**State Management:**

- `phoenixScore`: Calculated score (0-100)
- `metrics`: Object containing percentage and trend for each metric
- `latestMessage`: Most recent coach message from database
- `loading`: Loading state for data fetch
- `generating`: Loading state for message generation

**Key Functions:**

1. **loadCoachData()**
   - Fetches data from all 4 tables (workouts, meal_logs, sleep_logs, steps_logs)
   - Calculates metrics for last 7 days
   - Computes Phoenix Score using formula
   - Fetches latest coach message

2. **generateWeeklyMessage()**
   - Determines tone based on current Phoenix Score
   - Generates appropriate message
   - Upserts to coach_messages table
   - Updates UI with new message

3. **getWeekNumber(date)**
   - Helper function to calculate ISO week number
   - Used for week_ref formatting

## UI Components

### Top Banner

- Phoenix logo with glow animation
- Phoenix Score ring (0-100)
- Score-based message with color coding

### Latest Message Card

- Shows most recent weekly message
- Color-coded border based on tone
- Displays creation date

### Generate Message Button

- Triggers new message generation
- Shows loading state during generation
- Full-width with gradient styling

### Metrics Grid (2x2)

- Training Consistency card
- Diet Adherence card
- Sleep Quality card
- Steps Goal card
- Each shows: percentage, trend arrow, progress bar

### Recommendations Card

- Personalized insights based on metrics
- Dynamic tips for areas needing improvement
- Highlights achievements

### Formula Card

- Shows Phoenix Score calculation formula
- Educational reference for users

## Setup Instructions

### 1. Run SQL Schema

1. Open Supabase dashboard → SQL Editor
2. Copy contents of `COACH_SUPABASE_SCHEMA.sql`
3. Click "Run" to create the table
4. Verify success message: "Coach messages schema created successfully! 🔥"

### 2. Verify Dependencies

Ensure these tables exist:

- `workouts` (Training module)
- `meal_logs` (Diet module)
- `sleep_logs` (Sleep module)
- `steps_logs` (Steps module)

### 3. Test the Component

1. Navigate to Coach tab
2. Verify Phoenix Score calculation
3. Click "Gerar Nova Mensagem Semanal"
4. Verify message appears in card
5. Check Supabase to confirm data storage

## Trend Calculation

Trends are determined automatically:

- **Up (↗)**: Percentage ≥ 70%
- **Neutral (→)**: Percentage 40-69%
- **Down (↘)**: Percentage < 40%

## Performance Notes

- All data is fetched in parallel for fast loading
- Uses `.maybeSingle()` for optional message fetch
- Metrics calculated client-side (no database aggregation)
- 7-day rolling window for all calculations

## Future Enhancements

- [ ] AI-powered message generation using LLM
- [ ] Historical score tracking chart
- [ ] Weekly email summaries
- [ ] Achievement badges system
- [ ] Peer comparison (opt-in)
- [ ] Custom goal setting

---

**Status**: ✅ Supabase Integration Complete (Code Generated)
**Formula**: Phoenix Score = 0.4·CT + 0.3·AD + 0.2·Sleep + 0.1·Steps
**Tables**: coach_messages created with RLS
