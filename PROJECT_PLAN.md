# GDG Opportunities Platform - Detailed Implementation Plan

## Project Overview

A student-shared platform where GDG club members can discover and submit job opportunities, internships, research positions, fellowships, and scholarships. The platform uses AI (Gemini) to automatically parse job postings and extract relevant information, making it easy for students to find opportunities sorted by deadline and filtered by type.

### Key Goals
- Enable students to submit and discover opportunities
- Automatically parse job postings using AI
- Organize opportunities by deadline and type
- Scale to support the entire school in the future
- Zero-cost hosting solution

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui or Radix UI
- **Icons**: Lucide React
- **State Management**: React Context or Zustand (if needed)
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for future resume uploads)
- **AI Service**: Google Gemini API
- **Web Scraping**: Cheerio or Puppeteer
- **Cron Jobs**: Vercel Cron (for auto-expiring opportunities)

### Hosting
- **Platform**: Vercel (free tier)
- **Database**: Supabase (free tier)
- **Domain**: Custom domain (optional)

## Project Structure

```
gdg-opportunities-platform/
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── opportunities/
│   │   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx        # Homepage
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── opportunities/
│   │   │   │   ├── route.ts    # GET, POST
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts # GET, PUT, DELETE
│   │   │   │   └── submit/
│   │   │   │       └── route.ts # POST with AI parsing
│   │   │   └── parse/
│   │   │       └── route.ts    # AI parsing endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── opportunities/
│   │   │   ├── OpportunityCard.tsx
│   │   │   ├── OpportunityList.tsx
│   │   │   ├── OpportunityDetails.tsx
│   │   │   ├── SubmitModal.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── SortDropdown.tsx
│   │   ├── admin/
│   │   │   └── AdminPanel.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── ai/
│   │   │   └── gemini.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useOpportunities.ts
│   │   └── useAuth.ts
│   ├── styles/
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                     # Optional: separate backend logic
│   ├── services/
│   │   ├── ai-parser.ts        # Gemini parsing logic
│   │   ├── web-scraper.ts      # Web scraping logic
│   │   └── opportunity-service.ts
│   ├── utils/
│   │   ├── date-utils.ts
│   │   └── validation.ts
│   └── cron/
│       └── expire-opportunities.ts
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
├── .env.local.example
├── .gitignore
├── README.md
└── package.json
```

## Database Schema

### Tables

**users**
- id (uuid, primary key)
- email (text, unique)
- name (text)
- major (text, nullable)
- role (enum: 'student', 'admin')
- created_at (timestamp)
- updated_at (timestamp)

**opportunities**
- id (uuid, primary key)
- url (text, unique, indexed)
- company_name (text)
- job_title (text)
- opportunity_type (enum: 'internship', 'full_time', 'research', 'fellowship', 'scholarship')
- role_type (text) - e.g., "Software Engineering", "Product Management"
- relevant_majors (jsonb) - array of majors
- deadline (date, nullable)
- requirements (text)
- location (text)
- description (text)
- submitted_by (uuid, foreign key -> users.id)
- status (enum: 'active', 'expired')
- created_at (timestamp)
- expired_at (timestamp, nullable)
- ai_parsed_data (jsonb) - raw AI response for debugging

**Indexes**
- opportunities.url (unique)
- opportunities.deadline
- opportunities.status
- opportunities.opportunity_type
- opportunities.role_type

## Core Features

### 1. Authentication
- Sign up with email/password
- Sign in
- Session management
- Protected routes
- Admin role check

### 2. Homepage (Modern & Catchy)
**Design Elements:**
- Hero section with compelling headline
- Statistics (total opportunities, active users)
- Quick filter buttons
- Featured opportunities carousel
- Call-to-action for submission
- Modern gradient backgrounds
- Smooth animations

**Layout:**
```
┌─────────────────────────────────────┐
│  Hero: "Discover Your Next          │
│        Opportunity"                 │
│  [Get Started] [Browse Opportunities]│
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Stats: 50+ Opportunities | 100+   │
│         Students | 5 Types          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Quick Filters:                      │
│  [Internships] [Full-time] [Research]│
│  [Fellowships] [Scholarships]        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Featured Opportunities (Carousel)   │
└─────────────────────────────────────┘
```

### 3. Dashboard
**Features:**
- All opportunities list
- Filter by type (Internship, Full-time, Research, Fellowship, Scholarship)
- Sort by deadline (closest first, farthest first)
- Search functionality (Phase 2)
- Submit new opportunity button
- Opportunity cards with key info

**Opportunity Card Design:**
```
┌─────────────────────────────────────┐
│  [Company Logo/Icon]                 │
│  Company Name                        │
│  Job Title                           │
│  📅 Deadline: Dec 31, 2024           │
│  🏷️ Type: Internship                  │
│  📍 Location: Remote                 │
│  [View Details] →                    │
└─────────────────────────────────────┘
```

### 4. Link Submission
**Flow:**
1. User clicks "Submit Opportunity" button
2. Modal opens with form
3. User enters URL (required) and company name (optional)
4. User selects opportunity type
5. Submit → Loading state
6. Backend fetches webpage, sends to Gemini
7. AI extracts: company, title, deadline, requirements, role type, relevant majors
8. Save to database
9. Success message, modal closes
10. New opportunity appears in list

**Modal Design:**
```
┌─────────────────────────────────────┐
│  Submit New Opportunity        [X]  │
├─────────────────────────────────────┤
│  URL *                              │
│  [https://company.com/job/...]      │
│                                     │
│  Company Name (optional)             │
│  [Company Inc.]                      │
│                                     │
│  Opportunity Type *                  │
│  [Select type ▼]                     │
│                                     │
│  [Cancel] [Submit]                   │
└─────────────────────────────────────┘
```

### 5. Opportunity Details Page
**Content:**
- Full job description
- Requirements
- Deadline (highlighted if approaching)
- Location
- Company name
- Role type
- Relevant majors
- Submitted by (user name)
- Apply Now button (external link)
- Review Resume button (disabled, "Coming Soon")
- Admin: Edit/Delete buttons

### 6. Admin Panel
**Features:**
- View all opportunities
- Edit opportunity details
- Delete opportunities
- Manual opportunity addition
- Statistics dashboard
- User management (future)

### 7. Auto-Expire System
**Implementation:**
- Vercel Cron job runs daily at midnight
- Queries opportunities where deadline < today AND status = 'active'
- Updates status to 'expired'
- Sets expired_at timestamp
- Frontend filters out expired opportunities by default

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/session` - Get current session

### Opportunities
- `GET /api/opportunities` - List all (with filters, sorting)
  - Query params: `type`, `status`, `sort`, `limit`, `offset`
- `GET /api/opportunities/[id]` - Get single opportunity
- `POST /api/opportunities/submit` - Submit new opportunity with AI parsing
- `PUT /api/opportunities/[id]` - Update opportunity (admin only)
- `DELETE /api/opportunities/[id]` - Delete opportunity (admin only)
- `POST /api/opportunities/parse` - Parse URL with AI (internal)

## AI Parsing Logic

### Gemini Prompt Structure
```
Extract the following information from this job posting:

Job Posting Content: {scraped_content}

Extract and return as JSON:
{
  "company_name": "string",
  "job_title": "string",
  "opportunity_type": "internship|full_time|research|fellowship|scholarship",
  "role_type": "Software Engineering|Product Management|Data Science|etc.",
  "relevant_majors": ["Computer Science", "Software Engineering", ...],
  "deadline": "YYYY-MM-DD or null",
  "requirements": "string",
  "location": "string",
  "description": "string"
}

If any field cannot be determined, use null.
```

### Web Scraping Strategy
1. Fetch URL with fetch/axios
2. Parse HTML with Cheerio
3. Extract main content (remove nav, footer, ads)
4. Clean text (remove extra whitespace)
5. Send to Gemini API
6. Cache parsed results (check if URL exists before parsing)

## UI/UX Design Principles

### Modern Design Elements
- **Color Scheme**: Modern gradients (purple-blue, or GDG brand colors)
- **Typography**: Clean, readable fonts (Inter, Poppins)
- **Spacing**: Generous whitespace
- **Cards**: Rounded corners, subtle shadows
- **Animations**: Smooth transitions, hover effects
- **Responsive**: Mobile-first design
- **Dark Mode**: Optional (Phase 2)

### Key Pages

**Homepage:**
- Eye-catching hero section
- Clear value proposition
- Easy navigation
- Trust indicators

**Dashboard:**
- Clean, organized layout
- Prominent filter/sort controls
- Easy-to-scan opportunity cards
- Quick actions

**Details Page:**
- Well-structured information
- Clear call-to-action
- Related opportunities (future)

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Project setup (Next.js, Supabase)
- Database schema and migrations
- Authentication system
- Basic UI layout and navigation

### Phase 2: Core Features (Week 2)
- Link submission modal
- AI parsing integration (Gemini)
- Opportunity listing
- Filtering and sorting
- Opportunity details page

### Phase 3: Admin & Polish (Week 3)
- Admin panel
- Auto-expire cron job
- Error handling
- Loading states
- Form validation
- Testing

### Phase 4: Launch Prep (Week 4)
- Seed initial data
- Deploy to Vercel
- Documentation
- User onboarding flow
- Launch to club members

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini API
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Key Files to Create

### Frontend Priority Files
1. `frontend/app/page.tsx` - Homepage
2. `frontend/app/(dashboard)/dashboard/page.tsx` - Main dashboard
3. `frontend/components/opportunities/OpportunityCard.tsx` - Card component
4. `frontend/components/opportunities/SubmitModal.tsx` - Submission modal
5. `frontend/components/layout/Navbar.tsx` - Navigation
6. `frontend/app/api/opportunities/submit/route.ts` - Submission API
7. `frontend/lib/ai/gemini.ts` - Gemini integration

### Backend Priority Files
1. `backend/services/ai-parser.ts` - AI parsing logic
2. `backend/services/web-scraper.ts` - Web scraping
3. `supabase/migrations/001_initial_schema.sql` - Database schema

## Success Metrics

- Number of opportunities submitted
- Number of active users
- Opportunities viewed
- Successful AI parsing rate
- User engagement

## Future Enhancements (Post-MVP)

- Resume review feature
- Comments/notes per opportunity
- Major-based filtering
- Role-based filtering
- Search functionality
- Email notifications
- User profiles
- Application tracking
- Analytics dashboard

## MVP Feature Checklist

### Essential Features (Must Have)
- [x] User authentication (Sign up/Sign in)
- [x] Link submission with AI parsing
- [x] 5 opportunity types (Internship, Full-time, Research, Fellowship, Scholarship)
- [x] List view with deadline sorting
- [x] Filter by opportunity type
- [x] Opportunity details page
- [x] Admin features (edit/delete)
- [x] Auto-expire past deadlines

### Phase 2 Features (Nice to Have)
- [ ] Major-based filtering
- [ ] Role-based filtering
- [ ] Comments/notes per opportunity
- [ ] Search functionality
- [ ] Resume review (Coming Soon badge)

## Notes for Frontend Team

- Focus on modern, catchy design for homepage
- Use shadcn/ui for consistent component library
- Implement responsive design (mobile-first)
- Add loading states and error handling
- Use Tailwind CSS for styling
- Consider using Framer Motion for animations

## Notes for Backend Team

- Set up Supabase project and get API keys
- Create database schema and run migrations
- Implement Gemini API integration
- Set up web scraping with Cheerio
- Create API routes with proper error handling
- Set up Vercel Cron for auto-expiring opportunities
- Implement caching for AI parsing results

## Getting Started

1. Clone the repository
2. Set up Supabase project
3. Get Gemini API key from Google AI Studio
4. Install dependencies: `npm install`
5. Set up environment variables
6. Run database migrations
7. Start development server: `npm run dev`

