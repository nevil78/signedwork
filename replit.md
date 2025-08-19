# Overview

This project is a LinkedIn-like professional networking platform built with Express.js and React. Its main purpose is to provide advanced profile management for employees and detailed company registration capabilities. The platform aims to facilitate professional networking, job discovery, and work tracking, fostering a robust ecosystem for professional growth and business collaboration. Key capabilities include comprehensive employee profiles with CV fields, company-based work diary management, an invitation system for company joining, and an administrative panel for user and platform control. The business vision is to create a dynamic and efficient online space for professionals and companies to connect, manage their work, and discover opportunities.

## Recent Updates (August 2025)
- Fixed company verification request system - corrected API endpoint parameter order for proper functionality
- Enhanced login page UX by making entire employee/company selection boxes fully clickable with proper radio button implementation
- Implemented complete admin verification workflow with approve/reject functionality
- Completed comprehensive password management system with OTP-based forgot password flow and secure change password functionality
- Added account settings dropdown menus to both employee and company navigation headers with change password access
- Integrated automatic dashboard redirection after successful password changes based on user type
- **CRITICAL FIX**: Implemented PostgreSQL session storage with connect-pg-simple to prevent logout on page refresh
- Added session heartbeat system with rolling session renewal to maintain authentication persistence
- Enhanced session debugging and validation with better error handling for invalid or expired sessions
- Implemented real-time WebSocket system with Socket.IO for bidirectional communication between companies and employees
- All core authentication, session management, and verification systems are now fully operational
- **BRANDING UPDATE**: Rebranded platform to "Signedwork" across all professional areas including HTML titles, navigation headers, email templates, and authentication pages
- Successfully added feedback button to employee dashboard header for seamless user feedback collection
- **COMPREHENSIVE LOGO IMPLEMENTATION**: Added user-provided colorful PNG logo throughout ALL professional areas of the platform including:
  * Authentication pages (welcome, login, registration, success)
  * Employee navigation header and all employee pages  
  * Company dashboard and company areas
  * Admin login and admin dashboard
  * Feedback system pages
  * Password management pages (forgot password, change password)
  * Browser favicon for consistent branding
  * Professional headers with vibrant coral, teal, and orange circular design for complete brand consistency
- **ADMIN PANEL ACCESS**: Admin panel is accessible only via direct URL navigation for security:
  * Admin setup available at `/admin/setup` for initial configuration
  * Admin login available at `/admin/login` for authentication
  * Admin dashboard available at `/admin/dashboard` for platform management
  * Provides comprehensive user control, verification system, and feedback management
  * No visible UI elements or buttons provide admin access - URL-only access for enhanced security
- **EMAIL SYSTEM**: Email verification and editing functionality available through existing profile management system
- **EMPLOYEE JOB DISCOVERY PAGE**: Built comprehensive and responsive job discovery platform with advanced features:
  * AI-powered search with intelligent job matching based on employee profile and skills
  * Four main navigation tabs: Discover, Saved Jobs, Applications, Job Alerts
  * Advanced filtering system with desktop sidebar and mobile drawer design
  * Smart sections: Perfect Matches, Trending Skills, Quick Apply functionality
  * Comprehensive filters: location, employment type, experience level, work style, salary range
  * Dynamic search with category chips for quick filtering (Remote, Full-time, Entry Level, etc.)
  * Detailed job cards with save/bookmark and apply functionality
  * Real-time application status tracking synced with recruiter dashboard
  * Application dialog with cover letter, profile sharing, and file upload capabilities
  * Responsive design optimized for desktop, tablet, and mobile devices
  * Fixed mobile filter drawer scrolling for better user experience
- **COMPREHENSIVE TRENDING SKILLS MODULE**: Implemented advanced skills discovery and personalization system:
  * Personalized trending skills API with user profile integration and skill preferences
  * Comprehensive database schema: skills, skill_trends, user_skill_preferences, skill_analytics tables
  * Advanced skills dialog with search, filtering, and market insights
  * Pin/hide functionality for personalized skill recommendations
  * Skills categorization: Technical vs Soft Skills, Profile-matched skills
  * Real-time market data: job counts, growth percentages, trending scores
  * Analytics tracking for skill interactions (view, pin, hide events)
  * Skills search functionality with intelligent matching algorithms
  * Interactive skill cards with detailed market insights and growth indicators
  * Complete API endpoints for skills management and preference tracking
- **GLOBAL HEADER USER NAME DISPLAY**: Enhanced employee navigation header with consistent name display:
  * Dynamic user name fetching from authenticated session and profile data
  * Responsive design with adaptive text display (full name on desktop, first name on mobile)
  * Real-time updates when user edits their profile information
  * Consistent "Signedwork – [User Name]" format across all employee pages
  * Query invalidation system for immediate name updates after profile changes
  * Smart name resolution with fallback priority: props > employee API > auth user API
- **EMAIL VERIFICATION SYSTEM**: Traditional OTP-based email verification system with manual trigger:
  * OTPEmailService with secure 6-digit code generation and professional email templates
  * OTPEmailVerification component with auto-submit, countdown timers, and real-time status
  * Complete API endpoints for send/verify/resend/status with 60-second cooldown and rate limiting
  * Available in professional profile with manual "Verify Email" button trigger
  * Email editing allowed until verification is completed, then locked for security
  * Comprehensive audit logging and real-time UI feedback for verification status
- **SIMPLE EMAIL EDITING**: Clean email management system with verification-based locking:
  * EditableEmail component allowing free email changes until verification
  * Visual verification status indicators (verified badge with lock icon)
  * Automatic email locking after successful verification for security
  * Real-time validation and duplicate email checking
  * Available for both employee and company accounts
  * Session synchronization for immediate UI updates
- **OTP-BASED EMPLOYEE SIGNUP**: Comprehensive 6-digit email verification system for employee registration:
  * Secure OTP generation with 5-minute expiration and bcrypt password hashing
  * Responsive OTP verification page with countdown timer and resend functionality
  * Temporary pendingUsers table for secure data storage during verification process
  * Automatic account creation after successful OTP verification
  * Company signup process unchanged (maintains existing verification flow)
  * Professional email templates with SendGrid integration for reliable delivery
- **ENHANCED DASHBOARD UX**: Improved Work Activity Summary interaction in employee dashboard:
  * "View All" button now expands work entries view instead of immediate navigation
  * Dynamic button text changes ("View All" ↔ "Show Less") based on expanded state
  * Smart display showing all work entries when expanded vs. limited preview (3 items)
  * Secondary navigation to Work Diary for comprehensive work management
  * Helpful creation button for users with no work entries yet
- **SHARED DOCUMENTS SYSTEM**: Implemented proper shared document viewing for job applications:
  * Fixed authorization issues - companies can now access profiles of employees who applied to their jobs
  * Added /api/company/applications/:applicationId/shared-documents endpoint for secure access to shared content
  * Created dedicated shared documents page (/company-shared-documents/:applicationId) instead of general profile redirect
  * Companies view only what employees specifically chose to share: "include my profile page as a CV" and "include my work diary as experience"
  * Comprehensive document viewer with employee profile data, work experience, education, certifications, and work diary entries
  * Replaced "View Profile" button with "View Attachments" button in recruiter dashboard for clarity
  * Proper access control ensuring companies only see shared documents from their own job applications
  * Work diary entries organized by company with clear grouping and entry count badges for better readability
  * Individual work entry expansion functionality with chevron arrows and smooth transitions
  * **VERIFIED ENTRIES ONLY**: Recruiters can only view work entries that have been verified/approved by companies for enhanced credibility
  * **COMPREHENSIVE WORK DETAILS**: Expanded work entry view showing complete information including work description, timeline, hours worked, skills/technologies, company verification with ratings, and attachments
  * **VERIFICATION BADGES**: Added visual verification indicators with shield icons and "Verified" badges for approved work entries

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite
- **UI Components**: shadcn/ui library leveraging Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: `express-session` for session storage
- **Password Security**: `bcrypt` for hashing
- **Validation**: Zod schemas for shared validation between client and server
- **Error Handling**: Centralized middleware for structured error responses
- **Request Logging**: Custom middleware for API request and performance monitoring

## Data Storage
- **Database**: PostgreSQL via Neon serverless driver
- **ORM**: Drizzle ORM for type-safe operations
- **Schema Management**: Drizzle Kit for database migrations

## Authentication & Authorization
- **Strategy**: Session-based authentication with HTTP-only cookies
- **User Types**: Supports both employee and company accounts
- **Password Requirements**: Enforced complexity with real-time feedback
- **Session Security**: Configurable timeouts and secure cookie settings
- **Email Verification**: Optional email verification system with OTP and SendGrid integration
- **Google OAuth**: Employee sign-up and login integration

## UI/UX Decisions
- Modern UI built with shadcn/ui components.
- Consistent navigation system across all employee pages.
- Interactive elements like 5-star rating system and real-time verification status indicators.
- Visual feedback for actions (e.g., login error animations, immutable badges).
- Dashboard reorganized with Management Tools section prioritizing employee management functionality.
- Clean card-based layout with proper spacing and visual hierarchy for company dashboard.

## Feature Specifications
- **Employee Profiles**: LinkedIn-like profiles with sections for experience, education, certifications, and comprehensive CV fields (personal info, professional summary, skills, languages, online presence, achievements). Includes profile picture upload.
- **Work Diary**: Company-based work tracking system with task creation, status, priority, time tracking, tagging, and CRUD operations. Features company invitation system and approval workflows with rating and feedback.
- **Company Management**: Company registration with detailed business info, invitation code generation, and employee management (employment status tracking).
- **Admin Panel**: Role-based access for managing users (employees and companies) and viewing platform statistics.
- **Enhanced Security**: Secure password reset flow, immutable protection for approved work entries.

# External Dependencies

- **Database Provider**: Neon PostgreSQL
- **Email Service**: SendGrid
- **Object Storage**: For profile picture uploads
- **UI Framework Components**: Radix UI
- **Validation Library**: Zod
- **Build Tool**: Vite
- **Development Tool**: Replit (for integration and specific plugins)
- **Google OAuth**: For employee authentication