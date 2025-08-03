# Overview

This is a comprehensive LinkedIn-like professional networking platform built with Express.js and React. The application provides advanced profile management for employees with features including professional experience, education, certifications, projects, and skills tracking. Companies can register with detailed business information including industry categorization, legal registration details, and optional company descriptions. The platform features a modern UI built with shadcn/ui components and handles complex user data with PostgreSQL and session-based authentication.

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