import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitOpportunitySchema } from "@/lib/validations/opportunity"
import { smartScrape } from "@/backend/services/smart-scraper"
import { parseJobPostingFromText, GeminiAPIError, RateLimitError } from "@/lib/ai/gemini"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message || "No user found" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Validate request body with Zod schema
    const validationResult = submitOpportunitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { url, company_name: userProvidedCompany, opportunity_type: userProvidedType } = validationResult.data

    console.log(`[Submit] Starting submission for URL: ${url}`)

    // Step 1: Check if URL already exists
    const { data: existingOpportunity } = await (supabase
      .from('opportunities') as any)
      .select('id, job_title, company_name')
      .eq('url', url)
      .maybeSingle()

    if (existingOpportunity) {
      return NextResponse.json(
        { 
          error: "Duplicate opportunity",
          message: `This opportunity has already been submitted: ${existingOpportunity.company_name} - ${existingOpportunity.job_title}`
        },
        { status: 409 }
      )
    }

    // Step 2: Scrape the URL
    console.log(`[Submit] Scraping URL...`)
    const scrapeResult = await smartScrape({ 
      url,
      timeout: 30000 
    })

    if (!scrapeResult.success || !scrapeResult.content) {
      console.error(`[Submit] Scraping failed:`, scrapeResult.error)
      return NextResponse.json(
        { 
          error: "Failed to scrape URL",
          message: scrapeResult.error || "Could not extract content from the provided URL",
          requiresManual: scrapeResult.requiresManual,
          metadata: scrapeResult.metadata
        },
        { status: 400 }
      )
    }

    console.log(`[Submit] Scraping successful (${scrapeResult.content.length} chars, method: ${scrapeResult.method})`)

    // Step 3: Parse with Gemini AI
    console.log(`[Submit] Parsing with Gemini AI...`)
    let parsedData
    try {
      parsedData = await parseJobPostingFromText(scrapeResult.content, {
        timeout: 30000,
        maxRetries: 3
      })
      console.log(`[Submit] AI parsing successful`)
    } catch (error) {
      console.error(`[Submit] AI parsing failed:`, error)

      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again in 60 seconds."
          },
          { status: 429 }
        )
      }

      if (error instanceof GeminiAPIError) {
        return NextResponse.json(
          { 
            error: "AI parsing failed",
            message: error.message
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: "Parsing failed",
          message: "Failed to parse job posting with AI"
        },
        { status: 500 }
      )
    }

    // Step 4: Merge user-provided data with AI-parsed data (user data takes priority)
    const finalData = {
      url,
      company_name: userProvidedCompany || parsedData.company_name || 'Unknown Company',
      job_title: parsedData.job_title || 'Position Not Specified',
      opportunity_type: userProvidedType || parsedData.opportunity_type || 'internship',
      role_type: parsedData.role_type,
      relevant_majors: parsedData.relevant_majors || [],
      deadline: parsedData.deadline,
      requirements: parsedData.requirements,
      location: parsedData.location,
      description: parsedData.description,
      submitted_by: user.id,
      status: 'active',
      ai_parsed_data: parsedData, // Store original AI response
    }

    console.log(`[Submit] Saving to database...`)

    // Step 5: Insert into database
    const { data: opportunity, error: insertError } = await (supabase
      .from('opportunities') as any)
      .insert([finalData])
      .select(`
        *,
        users!submitted_by (
          name
        )
      `)
      .single()

    if (insertError) {
      console.error(`[Submit] Database insert failed:`, insertError)
      
      // Check for duplicate URL (in case of race condition)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { 
            error: "Duplicate opportunity",
            message: "This opportunity was just submitted by someone else"
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { 
          error: "Database error",
          message: "Failed to save opportunity to database"
        },
        { status: 500 }
      )
    }

    console.log(`[Submit] Success! Opportunity ID: ${opportunity?.id}`)

    // Step 6: Return success response
    return NextResponse.json({
      success: true,
      message: "Opportunity submitted successfully!",
      data: opportunity,
      metadata: {
        scrapeMethod: scrapeResult.method,
        aiParsed: true,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Submit] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
}

