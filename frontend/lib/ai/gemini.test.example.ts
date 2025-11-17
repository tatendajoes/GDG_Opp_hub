/**
 * Gemini AI Parser - Test Examples
 * 
 * This file contains examples of how to use the Gemini parser.
 * You can run these in a test environment or API route.
 */

import {
  parseJobPostingFromUrl,
  parseJobPostingFromText,
  parseJobPosting,
  ParsedJobData,
  GeminiAPIError,
  RateLimitError
} from './gemini'

/**
 * Example 1: Parse from URL (Primary Method)
 */
export async function testParseFromUrl() {
  try {
    const url = 'https://www.google.com/about/careers/applications/jobs/results/123456'
    
    console.log('Parsing job from URL...')
    const result = await parseJobPostingFromUrl(url)
    
    console.log('✅ Successfully parsed job posting:')
    console.log(JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('❌ Rate limit exceeded:', error.message)
    } else if (error instanceof GeminiAPIError) {
      console.error('❌ Gemini API error:', error.message, error.code)
    } else {
      console.error('❌ Unexpected error:', error)
    }
    throw error
  }
}

/**
 * Example 2: Parse from Text (Fallback Method)
 */
export async function testParseFromText() {
  const sampleText = `
    Software Engineering Intern - Summer 2025
    Google LLC
    
    Location: Mountain View, CA (Hybrid)
    
    Google is seeking talented software engineering interns for Summer 2025.
    
    Requirements:
    - Currently pursuing a Bachelor's or Master's degree in Computer Science or related field
    - Experience with one or more programming languages (Java, C++, Python)
    - Strong problem-solving skills
    
    Application Deadline: December 15, 2025
    
    About the Role:
    As a Software Engineering Intern, you'll work on real projects that impact billions of users.
    You'll collaborate with experienced engineers and contribute to products used worldwide.
  `

  try {
    console.log('Parsing job from text...')
    const result = await parseJobPostingFromText(sampleText)
    
    console.log('✅ Successfully parsed job posting:')
    console.log(JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    console.error('❌ Error parsing text:', error)
    throw error
  }
}

/**
 * Example 3: Parse with Custom Options
 */
export async function testParseWithOptions() {
  const sampleText = 'Your job posting text here...'
  
  try {
    const result = await parseJobPostingFromText(sampleText, {
      timeout: 60000,      // 60 seconds
      maxRetries: 5,       // Retry up to 5 times
      retryDelay: 2000     // Wait 2 seconds between retries
    })
    
    console.log('✅ Parsed with custom options:', result)
    return result
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

/**
 * Example 4: Handle Different Opportunity Types
 */
export async function testOpportunityTypes() {
  const examples = [
    {
      type: 'Internship',
      text: 'Summer 2025 Software Engineering Internship at Microsoft...'
    },
    {
      type: 'Full-time',
      text: 'Senior Software Engineer (Full-time) at Amazon...'
    },
    {
      type: 'Research',
      text: 'Research Assistant Position in AI Lab at MIT...'
    },
    {
      type: 'Fellowship',
      text: 'Google AI Fellowship Program 2025...'
    },
    {
      type: 'Scholarship',
      text: 'Merit-based Scholarship for Computer Science Students...'
    }
  ]

  for (const example of examples) {
    try {
      console.log(`\nTesting ${example.type}...`)
      const result = await parseJobPostingFromText(example.text)
      console.log(`✅ Detected as: ${result.opportunity_type}`)
    } catch (error) {
      console.error(`❌ Failed to parse ${example.type}:`, error)
    }
  }
}

/**
 * Example 5: Validate Parsed Data
 */
export function validateParsedData(data: ParsedJobData): boolean {
  const errors: string[] = []

  // Required fields check
  if (!data.company_name) {
    errors.push('Missing company_name')
  }
  if (!data.job_title) {
    errors.push('Missing job_title')
  }
  if (!data.opportunity_type) {
    errors.push('Missing opportunity_type')
  }

  // Date format check
  if (data.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(data.deadline)) {
    errors.push('Invalid deadline format (should be YYYY-MM-DD)')
  }

  // Opportunity type check
  const validTypes = ['internship', 'full_time', 'research', 'fellowship', 'scholarship']
  if (data.opportunity_type && !validTypes.includes(data.opportunity_type)) {
    errors.push(`Invalid opportunity_type: ${data.opportunity_type}`)
  }

  if (errors.length > 0) {
    console.error('❌ Validation errors:', errors)
    return false
  }

  console.log('✅ Data validation passed')
  return true
}

/**
 * Example 6: Error Handling
 */
export async function testErrorHandling() {
  // Test 1: Empty content
  try {
    await parseJobPostingFromText('')
  } catch (error) {
    if (error instanceof GeminiAPIError && error.code === 'INVALID_CONTENT') {
      console.log('✅ Correctly handled empty content')
    }
  }

  // Test 2: Rate limiting (simulated)
  try {
    // This would trigger if you hit rate limits
    await parseJobPostingFromText('Sample text', { maxRetries: 1 })
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('✅ Correctly handled rate limit')
    }
  }

  // Test 3: Timeout
  try {
    await parseJobPostingFromText('Sample text', { timeout: 1 }) // 1ms timeout
  } catch (error) {
    if (error instanceof GeminiAPIError && error.code === 'TIMEOUT') {
      console.log('✅ Correctly handled timeout')
    }
  }
}

/**
 * Example 7: Complete Workflow
 */
export async function completeWorkflow(url: string, fallbackText?: string) {
  console.log('🚀 Starting complete parsing workflow...')
  
  // Step 1: Try parsing from URL
  try {
    console.log('Step 1: Attempting URL parse...')
    const result = await parseJobPostingFromUrl(url, { timeout: 30000 })
    
    // Step 2: Validate result
    console.log('Step 2: Validating parsed data...')
    if (validateParsedData(result)) {
      console.log('✅ Workflow complete! Result:', result)
      return { success: true, data: result, method: 'url' }
    }
  } catch (error) {
    console.warn('⚠️ URL parsing failed, trying fallback...', error)
  }

  // Step 3: Fallback to text parsing if URL fails
  if (fallbackText) {
    try {
      console.log('Step 3: Attempting text parse...')
      const result = await parseJobPostingFromText(fallbackText, { timeout: 30000 })
      
      console.log('Step 4: Validating parsed data...')
      if (validateParsedData(result)) {
        console.log('✅ Workflow complete via fallback! Result:', result)
        return { success: true, data: result, method: 'text' }
      }
    } catch (error) {
      console.error('❌ Text parsing also failed:', error)
      return { success: false, error, method: 'none' }
    }
  }

  return { success: false, error: 'No fallback text provided', method: 'none' }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Running all Gemini parser tests...\n')
  
  try {
    await testParseFromText()
    await testOpportunityTypes()
    await testErrorHandling()
    
    console.log('\n✅ All tests completed!')
  } catch (error) {
    console.error('\n❌ Tests failed:', error)
  }
}
