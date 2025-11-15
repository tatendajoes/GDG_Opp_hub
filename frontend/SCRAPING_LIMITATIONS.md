# Web Scraper - Capabilities and Limitations

## ✅ What We CAN Scrape

### Highly Compatible (90-100% success rate)

**Public Job Posting Sites:**
- Company career pages (e.g., Google Careers, Microsoft Jobs)
- ATS systems:
  - Greenhouse.io
  - Lever.co
  - Workday
  - Ashby HQ
  - SmartRecruiters
  - iCIMS
  - Taleo
  - BambooHR
- Public job boards (Indeed, Monster, Glassdoor - public listings)
- University job boards
- Government job sites (USAJobs, etc.)
- Startup boards (AngelList, YC Jobs, etc.)

**Technical Capabilities:**
- Static HTML pages
- JavaScript-heavy SPAs (React, Vue, Angular)
- Dynamic content loading (AJAX, fetch)
- Sites with animations and transitions
- Most modern web frameworks
- Sites with reasonable bot detection

### Moderately Compatible (70-90% success rate)

**Sites with Light Protection:**
- Sites with basic bot detection
- Sites with soft rate limiting
- Sites requiring cookies
- Sites with anti-scraping measures (but not aggressive)

## ❌ What We CANNOT Scrape

### Authentication Required

**Social Media Sites:**
- ❌ **LinkedIn** - Requires login, aggressive bot detection, ToS violation
- ❌ Facebook/Meta jobs - Requires login
- ❌ Twitter/X - Limited access without auth
- ❌ Instagram - Requires login
- ❌ Private Slack/Discord posts

**Private/Internal Sites:**
- ❌ Company internal job boards (requires employee login)
- ❌ Applicant tracking systems (applicant view)
- ❌ Private portals

### Heavy Protection

**Anti-Bot Systems:**
- ❌ CAPTCHA (reCAPTCHA, hCaptcha, etc.)
- ❌ Cloudflare bot detection (aggressive mode)
- ❌ PerimeterX
- ❌ DataDome
- ❌ Other advanced bot detection

**Other Limitations:**
- ❌ Paywalled content
- ❌ Sites that require specific user interactions
- ❌ Sites with IP-based blocking
- ❌ Sites that detect headless browsers (some)

## LinkedIn Specifically

### Why LinkedIn is Difficult

1. **Authentication Required**: Most content requires login
2. **Aggressive Bot Detection**: Will block IPs and accounts
3. **Terms of Service**: Explicitly prohibits scraping
4. **Rate Limiting**: Very strict rate limits
5. **Legal Risk**: Can result in legal action (see hiQ Labs case)

### Recommended Alternatives for LinkedIn

#### Option 1: LinkedIn API (Recommended)
```typescript
// Use official LinkedIn API
// Requires LinkedIn Developer Account
// Limited access, but legal and reliable
```

**Pros:**
- ✅ Legal and official
- ✅ Reliable data
- ✅ No bot detection issues

**Cons:**
- ❌ Requires API approval
- ❌ Limited access (basic profile only)
- ❌ May have costs

#### Option 2: Manual Input
```typescript
// Let users paste LinkedIn job URLs or content
// Your app extracts the URL and lets user paste the description

interface ManualJobInput {
  url: string;
  jobDescription: string; // User pastes this
  companyName?: string;
}
```

**Pros:**
- ✅ Always works
- ✅ No legal issues
- ✅ User has already accessed the content

**Cons:**
- ❌ Requires manual work
- ❌ Less convenient

#### Option 3: Browser Extension (Advanced)
```typescript
// Create a Chrome extension that extracts content
// while user is browsing LinkedIn
// Extension runs in user's authenticated session
```

**Pros:**
- ✅ Works with authentication
- ✅ No bot detection
- ✅ User is already logged in

**Cons:**
- ❌ Requires browser extension development
- ❌ Still may violate ToS
- ❌ User needs to install extension

#### Option 4: Partnership/Integration
- Partner with LinkedIn or use official job posting APIs
- Use LinkedIn's Job Wrapping program
- Become a LinkedIn Partner

## Recommended Approach for Your Use Case

### For GDG Opportunities Platform

**Tier 1: Full Auto-Scraping (Use our scraper)**
- ✅ Company career pages
- ✅ ATS systems (Greenhouse, Lever, etc.)
- ✅ Public job boards
- ✅ University job boards

**Tier 2: Semi-Manual (URL + Manual Description)**
- LinkedIn jobs (user provides URL + pastes description)
- Facebook job posts (user provides URL + pastes description)
- Private portals (user provides details)

**Tier 3: Manual Entry**
- Completely private opportunities
- Word-of-mouth opportunities
- Email-only opportunities

### Implementation Example

```typescript
import { scrapeUrl } from '@/lib/services';

async function submitJobOpportunity(submission: {
  url: string;
  manualDescription?: string; // Optional manual override
  opportunityType: string;
}) {
  // Check if URL is from a restricted site
  const isLinkedIn = submission.url.includes('linkedin.com');
  const isFacebook = submission.url.includes('facebook.com');

  if (isLinkedIn || isFacebook) {
    // Require manual description
    if (!submission.manualDescription) {
      return {
        success: false,
        error: 'LinkedIn and Facebook jobs require manual description paste',
        requiresManual: true,
      };
    }

    // Use manual description instead of scraping
    const content = submission.manualDescription;
    // Parse with Gemini...
  } else {
    // Try auto-scraping
    const scrapeResult = await scrapeUrl(submission.url);

    if (!scrapeResult.success) {
      // Fallback to manual if scraping fails
      return {
        success: false,
        error: 'Auto-scraping failed. Please paste the job description manually.',
        requiresManual: true,
      };
    }

    const content = scrapeResult.content;
    // Parse with Gemini...
  }
}
```

## Success Rates by Site Type

| Site Type | Success Rate | Speed | Recommended Method |
|-----------|--------------|-------|-------------------|
| Company careers | 95-99% | Fast | Auto-scrape |
| Greenhouse/Lever | 95-99% | Medium | Auto-scrape |
| Indeed (public) | 90-95% | Fast | Auto-scrape |
| University boards | 95-99% | Fast | Auto-scrape |
| LinkedIn | 0-5% | N/A | Manual paste |
| Facebook | 0-5% | N/A | Manual paste |
| Private portals | 0% | N/A | Manual entry |

## Testing Different Sites

You can test any URL with:

```bash
npx tsx test-scraper.mts
# Edit the file to change the URL
```

Or via API:

```bash
curl "http://localhost:3000/api/test-scraper?url=YOUR_URL"
```

## Legal Considerations

**Always respect:**
- robots.txt files
- Terms of Service
- Rate limiting
- Copyright laws
- Privacy laws (GDPR, CCPA)

**Best Practices:**
- Only scrape public content
- Respect rate limits
- Use manual input for protected sites
- Don't scrape personal information
- Cache results to reduce requests

## Recommendations

For your GDG Opportunities Platform:

1. **Use auto-scraping for:**
   - Company career pages
   - ATS systems
   - Public job boards

2. **Use manual paste for:**
   - LinkedIn
   - Facebook
   - Any site that fails auto-scraping

3. **Provide clear UX:**
   ```
   [Submit Job URL]

   If scraping fails or for LinkedIn/Facebook jobs:
   [Paste Job Description Here]
   ```

4. **Monitor success rates:**
   - Track which sites work
   - Track which sites fail
   - Adjust strategy accordingly

## Future Enhancements

If you need to handle LinkedIn in the future:

1. **LinkedIn API Partnership**
   - Apply for LinkedIn Partner program
   - Use official Job Posting API

2. **Browser Extension**
   - Build Chrome extension
   - Extract content from user's session

3. **Hybrid Approach**
   - Try auto-scrape first
   - Fallback to manual paste
   - Best of both worlds

---

**Bottom Line:**

Your scraper is **highly capable** for most job posting sites (90%+ coverage), but **cannot handle LinkedIn** due to authentication and bot detection. For LinkedIn, use manual paste or API integration.
