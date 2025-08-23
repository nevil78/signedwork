# Overview
This project is a LinkedIn-like professional networking platform built with Express.js and React. Its main purpose is to provide advanced profile management for employees and detailed company registration capabilities. The platform aims to facilitate professional networking, job discovery, and work tracking, fostering a robust ecosystem for professional growth and business collaboration. Key capabilities include comprehensive employee profiles with CV fields, company-based work diary management, an invitation system for company joining, and an administrative panel for user and platform control. The business vision is to create a dynamic and efficient online space for professionals and companies to connect, manage their work, and discover opportunities.

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
- **Company Sub-Roles**: Enterprise-level role system with COMPANY_ADMIN, MANAGER, and BRANCH_ADMIN roles
- **Permission System**: Fine-grained permissions map for company context roles with server-side enforcement

## UI/UX Decisions
- Modern UI built with shadcn/ui components.
- Consistent navigation system across all employee pages.
- Interactive elements like 5-star rating system and real-time verification status indicators.
- Visual feedback for actions (e.g., login error animations, immutable badges).
- Dashboard reorganized with Management Tools section prioritizing employee management functionality.
- Clean card-based layout with proper spacing and visual hierarchy for company dashboard.
- Platform branding is "Signedwork" with a colorful PNG logo used consistently.
- Admin panel is accessible only via direct URL navigation for security.
- Re-structured authentication flow to prioritize login page as the default entry.

## Feature Specifications
- **Employee Profiles**: LinkedIn-like profiles with sections for experience, education, certifications, and comprehensive CV fields. Includes profile picture upload.
- **Work Diary**: Company-based work tracking system with task creation, status, priority, time tracking, tagging, and CRUD operations. Features company invitation system and approval workflows with rating and feedback. Includes shared documents system for job applications, allowing companies to view verified work entries and shared profile data.
- **Company Management**: Company registration with detailed business info, invitation code generation, and employee management (employment status tracking).
- **Admin Panel**: Role-based access for managing users (employees and companies), platform statistics, and comprehensive data deletion with backup and confirmation safeguards. Uses direct SQL execution via Drizzle's sql template literals to ensure reliable deletion operations.
- **Company Role System**: Enterprise-grade role-based access control with automatic login redirects, protected routes, and permission-based middleware for fine-grained access control within company contexts.
- **Enhanced Security**: Secure password reset flow (OTP-based), immutable protection for approved work entries.
- **Job Discovery Page**: Comprehensive job discovery platform with AI-powered search, advanced filtering, and application management.
- **Trending Skills Module**: Advanced skills discovery and personalization system with market insights and analytics.
- **Email Verification System**: OTP-based email verification for employee sign-up and profile updates.
- **Legal Documentation**: Professional Terms of Service and Privacy Policy pages with comprehensive coverage of platform usage, data handling, user rights, and legal compliance.
- **Performance Optimizations**: Lazy loading for legal pages, React.memo optimizations, prefetch on hover, query parameter-based navigation, and optimized form components for faster interactions.

# External Dependencies
- **Database Provider**: Neon PostgreSQL
- **Email Service**: SendGrid
- **Object Storage**: For profile picture uploads
- **UI Framework Components**: Radix UI
- **Validation Library**: Zod
- **Build Tool**: Vite
- **Development Tool**: Replit
- **Google OAuth**: For employee authentication
- **WebSocket**: Socket.IO for real-time communication