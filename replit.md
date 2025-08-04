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