# Steps Module - Supabase Integration Guide

## Overview

The Steps Module allows users to track their daily step count with a goal of 8,000 steps per day. It includes manual entry, weekly progress visualization, and preparation for iOS Shortcut integration.

## Database Schema

### Table: `steps_logs`

**Columns:**

- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `date` (DATE): The date of the step entry (defaults to today)
- `steps` (INTEGER): Number of steps taken (must be >= 0)
- `goal` (INTEGER): Daily step goal (defaults to 8000)
- `notes` (TEXT): Optional notes
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints:**

- UNIQUE constraint on (user_id, date) - ensures one entry per day per user
- CHECK constraint on steps (>= 0)
- CHECK constraint on goal (> 0)

**RLS Policies:**

- Users can only view, create, update, and delete their own steps logs
- Policy: `auth.uid() = user_id`

## Setup Instructions

### 1. Run SQL Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `STEPS_SUPABASE_SCHEMA.sql`
4. Click **Run** to execute the schema
5. Verify success message: "Steps module schema created successfully! 👟"

### 2. Verify Table Creation

1. Go to **Table Editor** in Supabase
2. Confirm `steps_logs` table exists
3. Check that RLS is enabled (shield icon should be visible)

### 3. Component Integration

The `StepsTracker.js` component includes:

**Features:**

- ✅ Fetch today's steps on component mount
- ✅ Save/update steps (upsert operation for same day)
- ✅ Real-time progress ring visualization
- ✅ Weekly chart showing last 7 days
- ✅ Goal line at 8,000 steps
- ✅ Motivational messages based on progress
- ✅ Distance estimation (km)
- ✅ iOS Shortcut integration placeholder

**Supabase Operations:**

1. **Load Today's Steps:** `SELECT` query filtered by user_id and today's date
2. **Save Steps:** `UPSERT` operation (updates if exists, inserts if new)
3. **Load Weekly Data:** `SELECT` last 7 days for chart visualization

## API Endpoints (Future)

For iOS Shortcut integration, you'll need:

### POST `/api/steps/sync`

**Request Body:**

```json
{
  "user_id": "uuid",
  "steps": 8234,
  "date": "2025-01-20"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "steps": 8234,
    "goal": 8000,
    "progress": 102.9
  }
}
```

## Testing

### Manual Testing Steps

1. **Load Component:**
   - Navigate to the Home tab
   - Verify initial state shows 0 steps

2. **Save Steps:**
   - Enter a step count (e.g., 5000)
   - Click "Salvar"
   - Verify toast notification
   - Verify progress ring updates

3. **Reload Page:**
   - Refresh the browser
   - Verify saved steps persist

4. **Update Steps:**
   - Enter a new step count for the same day
   - Click "Salvar"
   - Verify it overwrites (not duplicates)

5. **Weekly Chart:**
   - Add steps for multiple days
   - Check that chart displays correctly
   - Verify goal line is visible

### Expected Behavior

- ✅ One entry per day (overwrites on save)
- ✅ Data persists across sessions
- ✅ Progress updates in real-time
- ✅ Charts render with Recharts
- ✅ RLS prevents access to other users' data

## Troubleshooting

### Steps not saving?

1. Check Supabase credentials in `.env.local`
2. Verify RLS policies are created
3. Check browser console for errors
4. Confirm user is authenticated

### Chart not rendering?

1. Verify Recharts is installed: `yarn add recharts`
2. Check that weekly data is fetched successfully
3. Ensure data format matches expected structure

### Duplicate entries?

1. Verify UNIQUE constraint exists on (user_id, date)
2. Use `UPSERT` (`.upsert()`) instead of `.insert()`

## Future Enhancements

- [ ] iOS Shortcut webhook endpoint
- [ ] Weekly/monthly statistics
- [ ] Streak tracking
- [ ] Step challenges
- [ ] Integration with other fitness trackers
- [ ] Export data to CSV

---

**Last Updated:** January 2025
**Module Status:** ✅ Supabase Integration Complete
