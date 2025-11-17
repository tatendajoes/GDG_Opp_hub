import { NextResponse } from 'next/server'
import {
  parseJobPostingFromUrl,
  parseJobPostingFromText,
  GeminiAPIError,
  RateLimitError,
} from '@/lib/ai/gemini'

/**
 * Test Gemini AI Parser
 * 
 * GET /api/test-gemini?url=https://...
 * GET /api/test-gemini?text=job+posting+content
 * 
 * Examples:
 * - /api/test-gemini?url=https://jobs.google.com/123
 * - /api/test-gemini?text=Software+Engineering+Intern+at+Google
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const text = searchParams.get('text')

  // Validate input
  if (!url && !text) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameter: url or text',
        usage: {
          examples: [
            '/api/test-gemini?url=https://jobs.google.com/123',
            '/api/test-gemini?text=Software+Engineering+Intern+at+Google'
          ]
        }
      },
      { status: 400 }
    )
  }

  try {
    const startTime = Date.now()
    let result
    let method: 'url' | 'text' = 'text'

    // Parse from URL if provided
    if (url) {
      console.log(`[Gemini Test] Parsing from URL: ${url}`)
      result = await parseJobPostingFromUrl(url, { timeout: 30000 })
      method = 'url'
    } else if (text) {
      console.log(`[Gemini Test] Parsing from text (${text.length} chars)`)
      result = await parseJobPostingFromText(text, { timeout: 30000 })
      method = 'text'
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      method,
      duration: `${duration}ms`,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        input: method === 'url' ? url : `${text?.substring(0, 100)}...`,
      }
    })

  } catch (error: any) {
    console.error('[Gemini Test] Error:', error)

    // Handle specific error types
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: error.message,
          code: error.code,
          retryAfter: '60 seconds'
        },
        { status: 429 }
      )
    }

    if (error instanceof GeminiAPIError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API error',
          message: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse job posting',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for testing with request body
 * 
 * POST /api/test-gemini
 * Body: { "url": "...", "text": "...", "options": {...} }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, text, options = {} } = body

    if (!url && !text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: url or text'
        },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    let result
    let method: 'url' | 'text'

    if (url) {
      result = await parseJobPostingFromUrl(url, options)
      method = 'url'
    } else {
      result = await parseJobPostingFromText(text, options)
      method = 'text'
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      method,
      duration: `${duration}ms`,
      data: result,
    })

  } catch (error: any) {
    console.error('[Gemini Test POST] Error:', error)

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code
        },
        { status: 429 }
      )
    }

    if (error instanceof GeminiAPIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
