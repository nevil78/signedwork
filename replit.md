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