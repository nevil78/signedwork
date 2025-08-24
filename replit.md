# Overview
This project is a LinkedIn-like professional networking platform built with Express.js and React. Its main purpose is to provide advanced profile management for employees and detailed company registration capabilities with enterprise-grade hierarchical company structure support. The platform aims to facilitate professional networking, job discovery, and work tracking, fostering a robust ecosystem for professional growth and business collaboration. Key capabilities include comprehensive employee profiles with CV fields, multi-level company hierarchy management (Company → Branches → Teams), company-based work diary management with hierarchical verification workflows, an invitation system for company joining, and an administrative panel for user and platform control. The business vision is to create a dynamic and efficient online space for professionals and companies to connect, manage their work, and discover opportunities while supporting complex organizational structures.

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
- Platform branding is "Signedwork" with a colorful PNG logo used consistently.
- Admin panel is accessible only via direct URL navigation for security.
- Re-structured authentication flow to prioritize login page as the default entry.

## Feature Specifications
- **Employee Profiles**: LinkedIn-like profiles with sections for experience, education, certifications, and comprehensive CV fields. Includes profile picture upload.
- **Enterprise Hierarchical Company Structure**: Multi-level organizational support with Company → Branches → Teams structure and role-based permissions.
- **Work Diary with Hierarchical Verification**: Company-based work tracking system with multi-level approval workflows and dual display system (external/internal verification view).
- **Role-Based Permission System**: Four-tier hierarchy roles (Company Admin → Branch Manager → Team Lead → Employee) with granular permissions.
- **Company Management**: Company registration with business info, invitation code generation, branch/team creation, and hierarchical employee management with employment status tracking.
- **Advanced Matrix-Based Organizational Management**: Interactive visual organization charts with real-time capacity tracking, health indicators, smart navigation, and comprehensive relationship matrices showing employee-structure correlations (August 2024).
- **Intelligent Conflict Detection System**: Automated identification of organizational issues including multiple team assignments, missing leadership, over-capacity teams, and smart optimization recommendations (August 2024).
- **Real-time Matrix Performance System**: Live data updates with optimized caching strategies, performance monitoring, auto-refresh on tab focus, and intelligent view optimization for large datasets (August 2024).
- **Admin Panel**: Role-based access for managing users (employees and companies), platform statistics, and comprehensive data deletion with safeguards.
- **Enhanced Security**: Secure password reset flow (OTP-based), immutable protection for approved work entries, hierarchical access control.
- **Job Discovery Page**: Comprehensive job discovery platform with AI-powered search, advanced filtering, and application management.
- **Trending Skills Module**: Advanced skills discovery and personalization system with market insights and analytics.
- **Email Verification System**: OTP-based email verification for employee sign-up and profile updates.
- **Legal Documentation**: Professional Terms of Service and Privacy Policy pages.
- **Performance Optimizations**: Lazy loading for legal pages, React.memo optimizations, prefetch on hover, query parameter-based navigation, and optimized form components.

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