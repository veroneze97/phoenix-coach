import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/steps
 *
 * Receives step data from iOS Shortcuts or other external sources
 *
 * Request Body:
 * {
 *   "user_id": "uuid-string",  // Optional if using auth token
 *   "steps": 8234,
 *   "date": "2025-01-20",       // Optional, defaults to today
 *   "goal": 8000,               // Optional, defaults to 8000
 *   "source": "ios_shortcut"   // Optional, defaults to 'api'
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "steps": 8234,
 *     "date": "2025-01-20",
 *     "goal": 8000,
 *     "progress": 102.9
 *   }
 * }
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json()
    const { user_id, steps, date, goal = 8000, source = 'api' } = body

    // Validate required fields
    if (!steps || typeof steps !== 'number' || steps < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid steps value. Must be a positive number.',
        },
        { status: 400 },
      )
    }

    // Get user from Authorization header or use provided user_id
    let userId = user_id

    if (!userId) {
      // Try to get user from auth token
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token)

        if (authError || !user) {
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication required. Provide user_id or valid auth token.',
            },
            { status: 401 },
          )
        }
        userId = user.id
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'user_id is required when not authenticated',
          },
          { status: 400 },
        )
      }
    }

    // Default to today if date not provided
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(targetDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        },
        { status: 400 },
      )
    }

    // Upsert steps data (insert or update if exists)
    const { data, error } = await supabase
      .from('steps_logs')
      .upsert(
        {
          user_id: userId,
          date: targetDate,
          steps: steps,
          goal: goal,
          source: source,
        },
        {
          onConflict: 'user_id,date',
        },
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save steps data',
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Calculate progress percentage
    const progress = ((steps / goal) * 100).toFixed(1)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          steps: data.steps,
          date: data.date,
          goal: data.goal,
          source: data.source,
          progress: parseFloat(progress),
        },
        message: `Successfully saved ${steps.toLocaleString()} steps for ${targetDate}`,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/steps
 *
 * Retrieve steps data for a user
 *
 * Query Parameters:
 * - user_id: UUID (required if not authenticated)
 * - date: YYYY-MM-DD (optional, defaults to today)
 * - days: number (optional, returns last N days)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "steps": 8234,
 *       "date": "2025-01-20",
 *       "goal": 8000,
 *       "source": "ios_shortcut"
 *     }
 *   ]
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '1')

    // Get user from Authorization header or use provided user_id
    let userId = user_id

    if (!userId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token)

        if (authError || !user) {
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication required',
            },
            { status: 401 },
          )
        }
        userId = user.id
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'user_id is required when not authenticated',
          },
          { status: 400 },
        )
      }
    }

    // Build query
    let query = supabase
      .from('steps_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    // Filter by date or days
    if (date) {
      query = query.eq('date', date)
    } else if (days > 1) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (days - 1))
      const startDateStr = startDate.toISOString().split('T')[0]
      query = query.gte('date', startDateStr)
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('date', today)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch steps data',
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
        count: data.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
