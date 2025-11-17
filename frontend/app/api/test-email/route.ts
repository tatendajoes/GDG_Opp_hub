import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail, generateDailyDigestEmail, generateDeadlineReminderEmail, type Opportunity } from '@/lib/email/service'
import { Database } from '@/lib/supabase/types'

// Test endpoint to send test emails to all users with real opportunities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'daily_digest' } = body

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Use service role client to bypass RLS for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    // Create service role client (bypasses RLS)
    const supabase = supabaseServiceKey
      ? createServiceClient<Database>(supabaseUrl, supabaseServiceKey)
      : createClient() // Fallback to regular client if service key not available

    // Fetch all users with email notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, major, email_notifications_enabled')
      .eq('email_notifications_enabled', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found with email notifications enabled' },
        { status: 404 }
      )
    }

    // Send emails to all users
    const results = []
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      try {
        // For daily_digest, only get opportunities from last 24 hours
        // For deadline_reminder, get opportunities with deadlines in 3-7 days
        let query = supabase
          .from('opportunities')
          .select('id, company_name, job_title, opportunity_type, deadline, location, description, url, relevant_majors')
          .eq('status', 'active')

        if (type === 'daily_digest') {
          // Only get opportunities from last 24 hours
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          query = query.gte('created_at', yesterday.toISOString())
        } else if (type === 'deadline_reminder') {
          // Get opportunities with deadlines in 3-7 days
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
          const sevenDaysFromNow = new Date()
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
          query = query
            .not('deadline', 'is', null)
            .gte('deadline', threeDaysFromNow.toISOString().split('T')[0])
            .lte('deadline', sevenDaysFromNow.toISOString().split('T')[0])
        }

        query = query.order('created_at', { ascending: false }).limit(50)

        // Filter by major if user has one
        if (user.major) {
          const escapedMajor = (user.major as string).replace(/"/g, '\\"')
          query = query.or(`relevant_majors.cs.["${escapedMajor}"]`)
        }

        const { data: opportunities, error: oppError } = await query

        if (oppError) {
          console.error(`Error fetching opportunities for user ${user.email}:`, oppError)
          failCount++
          results.push({
            email: user.email,
            name: user.name,
            success: false,
            error: `Failed to fetch opportunities: ${oppError.message}`,
          })
          continue
        }

        // If no opportunities match, skip this user (don't send empty email)
        if (!opportunities || opportunities.length === 0) {
          continue
        }

        // Convert to Opportunity type for email service
        const userOpportunities: Opportunity[] = opportunities.map((opp) => ({
          id: opp.id,
          company_name: opp.company_name,
          job_title: opp.job_title,
          opportunity_type: opp.opportunity_type as Opportunity['opportunity_type'],
          deadline: opp.deadline,
          location: opp.location,
          description: opp.description,
          url: opp.url,
        }))

        let html: string
        let subject: string

        if (type === 'deadline_reminder') {
          html = generateDeadlineReminderEmail(user.name || 'User', userOpportunities, appUrl)
          subject = `⏰ Deadline Reminder - ${userOpportunities.length} ${userOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'} Ending Soon`
        } else {
          html = generateDailyDigestEmail(user.name || 'User', userOpportunities, appUrl)
          subject = `Your Daily Opportunities Digest - ${userOpportunities.length} New ${userOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}`
        }

        // Send the email
        const result = await sendEmail(user.email, subject, html)

        if (result.success) {
          successCount++
          results.push({
            email: user.email,
            name: user.name,
            success: true,
            messageId: result.messageId,
          })
        } else {
          failCount++
          results.push({
            email: user.email,
            name: user.name,
            success: false,
            error: result.error,
          })
        }
      } catch (error) {
        failCount++
        results.push({
          email: user.email,
          name: user.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        console.error(`Error sending email to ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Emails sent to ${successCount} users, ${failCount} failed`,
      totalUsers: users.length,
      successCount,
      failCount,
      type,
      note: 'Opportunities are filtered by each user\'s major preference',
      results: results.slice(0, 10), // Return first 10 results to avoid huge response
    })
  } catch (error) {
    console.error('Error in test email endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

