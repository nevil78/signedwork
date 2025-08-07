# Overview

This is a comprehensive LinkedIn-like professional networking platform built with Express.js and React. The application provides advanced profile management for employees with dedicated profile pages featuring sidebar navigation for experience, education, certifications, projects, and endorsements sections. Companies can register with detailed business information including industry categorization, legal registration details, and optional company descriptions. The platform features a modern UI built with shadcn/ui components and handles complex user data with PostgreSQL and session-based authentication.

## Recent Changes (August 2025)
- ✅ Updated employee navigation from "overview" to "profile" 
- ✅ Created comprehensive profile page with LinkedIn-like sidebar navigation
- ✅ Implemented sections: profile overview, experience, education, certifications (removed projects and endorsements per user request)
- ✅ Added proper routing and redirects for employee profile access
- ✅ Each section displays empty states with helpful user guidance
- ✅ Fixed all API request errors - all Add buttons now work properly
- ✅ Implemented profile picture upload with object storage integration
- ✅ Added edit button functionality for changing profile pictures with tooltip
- ✅ Added short, memorable employee IDs (EMP-ABC123 format) replacing long UUIDs
- ✅ Enhanced profile overview with comprehensive CV fields including:
  * Personal information (address, phone, date of birth, nationality, marital status)
  * Professional summary (headline, summary, current position/company, industry)
  * Skills and languages with proper badge displays
  * Hobbies and interests section
  * Online presence (website, portfolio, GitHub, LinkedIn, Twitter links)
  * Key achievements section
- ✅ Created comprehensive "Edit Profile" functionality with organized sections for all CV fields
- ✅ Connected edit profile form to backend API with proper validation and user feedback
- ✅ Implemented "Work Diary" page as the second main page alongside Profile
- ✅ Added navigation header between Profile and Work Diary pages
- ✅ Built complete Work Diary functionality with:
  * Task creation and management with status tracking (todo, in_progress, completed)
  * Priority levels (low, medium, high) with color-coded badges
  * Time tracking (estimated vs actual hours)
  * Tagging system for categorizing work entries
  * Search and filter capabilities by status and keywords
  * Full CRUD operations (create, read, update, delete) for work entries
  * Database schema and API endpoints for work entries management
- ✅ Restructured Work Diary to be company-based with hierarchical organization:
  * Added companies table and employee_companies relationship table for many-to-many associations
  * Work entries now belong to specific companies instead of directly to employees
  * Main Work Diary page shows list of companies with "Add Company" functionality
  * Clicking a company navigates to a dedicated page showing work entries for that company
  * Full CRUD operations for both companies and work entries within companies
- ✅ Implemented company invitation system (August 4, 2025):
  * Companies have unique IDs (e.g., CMP-ABC123) and can generate 15-minute temporary invitation codes
  * Employees join companies using invitation codes instead of manual addition
  * Created Company Dashboard for companies to generate codes and view employee lists
  * Fixed company data immutability - companies cannot be deleted after employees join
  * Added status-based employment tracking ("employed" vs "ex-employee") 
  * Replaced delete functionality with "Leave Company" option that updates status
  * Added companyEmployees table with status, joinedAt, and leftAt fields
- ✅ Fixed routing issues for company recruiter dashboard:
  * Added Company Recruiter navigation link to company dashboard
  * Fixed TypeScript errors and authentication flow for job applications
  * Added missing employee work diary route (/employee-work-diary/:employeeId) to router
  * Job applications now persist properly after company relogin
- ✅ Implemented comprehensive admin panel (August 4, 2025):
  * Created admin table in database schema with role-based permissions
  * Built admin authentication system with login and setup pages
  * Added super admin creation flow for first admin account
  * Implemented admin dashboard with user management capabilities
  * Added isActive fields to employees and companies tables for account control
  * Created admin APIs for viewing/managing all employees and companies
  * Implemented toggle functionality to activate/deactivate user accounts
  * Added statistics overview showing platform metrics
- ✅ Enhanced Professional Employee System (August 5, 2025):
  * Created comprehensive ProfessionalProfile component with LinkedIn-like interface
  * Enhanced employee database schema with professional fields (experience level, salary expectations, availability status, notice period, work preferences)
  * Built advanced work diary system with professional tracking (billable hours, project categorization, client tracking, achievements, challenges, learnings)
  * Implemented professional analytics dashboard with profile completion scoring, view tracking, and work performance metrics
  * Added enhanced work entry management with status tracking, time estimation vs actual, and comprehensive categorization
  * Created ProfessionalWorkDiary with filtering, search, and advanced work type categorization
  * Integrated professional UI components (Progress, Tabs, Popover) for enhanced user experience
  * Enhanced database schema with work entry improvements (estimated/actual hours, billable tracking, work types, categories, achievements, challenges)
  * Added professional analytics endpoints for profile insights and work performance tracking
- ✅ Unified Navigation System (August 5, 2025):
  * Created consistent EmployeeNavHeader component with tab-based navigation
  * Replaced inconsistent headers across all employee pages (Profile, Work Diary, Job Discovery)
  * Implemented unified design with "Employee Dashboard" title and consistent tab navigation
  * Fixed "Join Company" button in professional work diary to open invitation code dialog
  * Standardized navigation experience across the entire employee interface
- ✅ Enhanced Email Verification System (August 6, 2025):
  * Modified registration flow to allow immediate login without mandatory email verification
  * Created EmailVerificationCard component for optional in-profile email verification
  * Integrated email verification card into professional profile overview section
  * Added SendGrid email service with verified sender configuration (noreply@signedwork.com)
  * Implemented 6-digit OTP code system with 15-minute expiration
  * Updated login system to work without mandatory email verification requirements
  * Added proper error handling for SendGrid API with graceful fallbacks
- ✅ Enhanced Contact Section with Verification Status (August 6, 2025):
  * Added email verification status icons (green checkmark for verified, orange warning for pending)
  * Implemented phone number editing functionality with dedicated dialog
  * Added real-time verification status display in profile contact section
  * Created phone update mutation with proper form validation
  * Enhanced contact section UI with edit buttons and status indicators
- ✅ Secured Password Reset Flow (August 6, 2025):
  * Modified password reset to require verified email addresses only
  * Added proper email verification status check before allowing OTP requests
  * Fixed forgot password routing issues (corrected /auth to / redirects)
  * Enhanced error messaging for unverified email password reset attempts
- ✅ CRITICAL FIX: Work Entry Creation Bug (August 7, 2025):
  * Fixed foreign key constraint violation causing work entry creation failures
  * Corrected getEmployeeCompanyRelations() to return actual company IDs instead of relation IDs
  * Added comprehensive form debugging and validation improvements
  * Implemented all solutions from external AI analysis (PDF guide)
  * Form submission now works with proper company ID mapping
- ✅ Company Verification Badge System (August 7, 2025):
  * Implemented verification badges for company-approved work entries
  * Added "Company Verified" badge with Shield icon when status = 'approved'
  * Created company rating display with Star icons showing 1-5 ratings
  * Built company feedback section with blue-themed review display
  * Enhanced work entry cards to show company approval status visually
- ✅ Interactive 5-Star Rating System (August 7, 2025):
  * Added comprehensive interactive rating dialog for company work entry approval
  * Implemented hover effects and visual feedback for star selection (1-5 stars)
  * Created optional feedback textarea for detailed company comments
  * Enhanced backend API to save ratings and feedback to work_entries table
  * Rating and feedback now persist in database and display on employee work diary
- ✅ Enhanced Login Error Handling (August 7, 2025):
  * Fixed 401 authentication errors to show user-friendly "Invalid ID or password" message
  * Replaced technical error codes with clear, actionable feedback for users
  * Improved error detection to handle various authentication failure scenarios
  * Added red blinking animation for input fields on login failure
- ✅ CRITICAL: Immutable Protection for Approved Work Entries (August 7, 2025):
  * Implemented comprehensive data integrity protection for company-approved work entries
  * Added backend API validation to prevent editing/deleting approved entries (status = 'approved')
  * Frontend UI disables edit buttons for approved entries with visual feedback
  * Added "🔒 Immutable" badge to clearly identify protected entries
  * When editing is attempted, user gets clear error message about data integrity
  * Backend returns 403 Forbidden status with descriptive error for immutable entries
  * Protection implemented on both PUT /api/work-entries/:id and PATCH/DELETE /api/work-diary/:id endpoints

## Current System State (August 6, 2025)
**Database Schema**: All tables properly synced with `npm run db:push` ✓
**Email System**: SendGrid fully configured with verified sender (noreply@signedwork.com) ✓  
**Authentication**: Session-based auth with optional email verification ✓
**Profile System**: Complete professional profiles with CV fields, experience, education, certifications ✓
**Work Diary**: Company-based work tracking with invitation system ✓
**Admin Panel**: Role-based admin system with user management ✓
**Object Storage**: Profile picture uploads with ACL system ✓

**Key Implementation Files**:
- `client/src/pages/professional-profile.tsx` - Main profile page with all sections
- `client/src/components/EmailVerificationCard.tsx` - Email verification component
- `server/emailService.ts` - SendGrid email service with OTP system
- `server/routes.ts` - All API endpoints for auth, profiles, work diary
- `shared/schema.ts` - Complete database schema with all tables
- `server/storage.ts` - Database operations and business logic

**External Dependencies**:
- SendGrid API key configured in environment secrets
- Object storage bucket setup for profile pictures
- PostgreSQL database with all schema changes applied

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: express-session with session storage
- **Password Security**: bcrypt for password hashing
- **Validation**: Zod schemas for request validation with shared types between client and server
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Request Logging**: Custom middleware for API request logging and performance monitoring

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations
- **Connection Pooling**: Neon connection pooling for serverless compatibility

## Authentication & Authorization
- **Strategy**: Session-based authentication with HTTP-only cookies
- **User Types**: Dual authentication system supporting both employees and companies
- **Password Requirements**: Enforced password complexity with real-time validation feedback
- **Session Security**: Configurable session timeouts and secure cookie settings

## External Dependencies
- **Database Provider**: Neon PostgreSQL for serverless database hosting
- **UI Framework**: Radix UI for accessible component primitives
- **Build Tools**: Vite for fast development and optimized production builds
- **Validation Library**: Zod for runtime type validation and schema generation
- **Development Tools**: Replit integration with development banner and cartographer plugin