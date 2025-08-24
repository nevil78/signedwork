# Overview
This project is a LinkedIn-like professional networking platform built with Express.js and React. Its main purpose is to provide advanced profile management for employees and detailed company registration capabilities with **enterprise-grade hierarchical company structure support**. The platform aims to facilitate professional networking, job discovery, and work tracking, fostering a robust ecosystem for professional growth and business collaboration. Key capabilities include comprehensive employee profiles with CV fields, **multi-level company hierarchy management (Company → Branches → Teams)**, company-based work diary management with **hierarchical verification workflows**, an invitation system for company joining, and an administrative panel for user and platform control. The business vision is to create a dynamic and efficient online space for professionals and companies to connect, manage their work, and discover opportunities while supporting complex organizational structures.

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
- **Enterprise Hierarchical Company Structure**: ✅ **FULLY IMPLEMENTED** - Complete multi-level organizational support with Company → Branches → Teams structure. Database tables created (company_branches, company_teams), storage interface extended with 20+ hierarchical methods, comprehensive API routes operational. Enables enterprise-scale companies (like HDFC with Surat/Mumbai branches) to manage complex organizational hierarchies with role-based permissions.
- **Work Diary with Hierarchical Verification**: ✅ **INFRASTRUCTURE READY** - Company-based work tracking system with multi-level approval workflows. Database schema includes hierarchical verification tracking where team leads verify team work, branch managers oversee branch verification, all rolling up to company brand. **Dual Display System**: External recruiters see "Verified by HDFC", internal users see "Verified by Manager X, HDFC Surat Branch".
- **Role-Based Permission System**: ✅ **FULLY IMPLEMENTED** - Four-tier hierarchy roles (Company Admin → Branch Manager → Team Lead → Employee) with granular permissions for work verification, employee management, and team creation. Database fields and API endpoints support complete permission matrix.
- **Company Management**: Company registration with detailed business info, invitation code generation, branch/team creation, and hierarchical employee management with employment status tracking.
- **Admin Panel**: Role-based access for managing users (employees and companies), platform statistics, and comprehensive data deletion with backup and confirmation safeguards. Uses direct SQL execution via Drizzle's sql template literals to ensure reliable deletion operations.
- **Enhanced Security**: Secure password reset flow (OTP-based), immutable protection for approved work entries, hierarchical access control.
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

# Recent Major Completions (August 24, 2025)
## ✅ Manager Sub-Account System - PHASE 1 FULLY COMPLETED (August 24, 2025)

**Revolutionary Feature Implemented:**
- Complete manager sub-account system allowing CEOs to create manager accounts with unique ID-based authentication (JNM123 format)
- Scoped data access enabling managers to approve work entries for their assigned team members only
- Single approval workflow where manager approval reflects company-wide, external view shows company approval
- Granular permission system with role-based access control (canApproveWork, canViewAnalytics, canEditEmployees, etc.)

**Technical Implementation:**
- Database schema: Added `company_managers` and `manager_permissions` tables with proper foreign key relations
- Enhanced `work_entries` with manager approval tracking: approvedByManagerId, approvedByManagerName, managerApprovalDate
- Extended `company_employees` with assignedManagerId for team assignment management
- Complete storage interface with 15+ manager-specific methods for CRUD operations, authentication, and data access
- Unique ID generation algorithm: extracts consonants from company name + random 3-digit suffix

**API Endpoints Operational:**
- Manager authentication: `/api/manager/auth/login`, `/api/manager/auth/logout`, `/api/manager/profile`
- CEO manager management: `/api/company/managers` (CRUD operations, password resets, employee assignments)
- Manager-scoped data access: `/api/manager/employees`, `/api/manager/work-entries`, `/api/manager/analytics`
- Permission-gated operations: Manager approval workflows with middleware validation
- Real-time employee assignment and work entry processing

**Security Features:**
- Session-based authentication with manager-specific scope data
- Permission middleware enforcing granular access control
- Database-level data filtering ensuring managers only access assigned employees
- Secure password hashing and temporary password generation for account setup

**Business Impact:**
- Scalable approval workflows: Eliminates CEO bottleneck for large teams (1000+ employees)
- Dual verification display: External recruiters see "Verified by Company", internal users see "Verified by Manager X"
- Enterprise hierarchy support: Managers can be assigned to specific branches and teams
- Audit trail: Complete tracking of manager actions and approval history

**System Status:** All endpoints operational, authentication working, database schema deployed, ready for frontend integration.

## ✅ React Select Component Error Resolution - FULLY COMPLETED (August 24, 2025)

**Problem Solved:**
- Fixed persistent React Select component error: "A <Select.Item /> must have a value prop that is not an empty string"
- Comprehensive solution applied across all Select components in the application
- Error was blocking proper functionality and user experience

**Technical Implementation:**
- Replaced all empty string SelectItem values with meaningful non-empty values:
  - `""` → `"no_manager"` (for manager assignment)
  - `""` → `"no_lead"` (for team lead assignment)
  - `""` → `"headquarters"` (for branch selection)
  - `""` → `"no_team"` (for team assignment)
- Added filtering to prevent null/empty IDs from being rendered in Select components
- Added fallback values for employee names and positions to prevent undefined display values
- Comprehensive verification confirmed no remaining empty string SelectItem values exist

**Files Updated:**
- `client/src/pages/work-verification.tsx` - Employee filter and work status selects
- `client/src/pages/company-hierarchy.tsx` - All branch, team, and employee assignment selects

**System Status:** All Select component errors resolved, work verification system fully operational with error-free UI.

## ✅ Work Entry Verification System - FULLY OPERATIONAL (August 23, 2025)

**Integration Completed:**
- New API endpoints: `/api/work-verification/*` (my-entries, pending, verify, submit)
- Frontend integration: Work verification page accessible from company dashboard
- Database integration: Built on existing work entry system using `storage.getWorkEntriesForCompany()`
- Authentication: Company and employee users properly authenticated and authorized

**Backend Implementation:**
- Fixed route conflicts by using unique endpoint paths instead of conflicting with existing `/api/company/work-entries`
- Resolved database schema issues by using existing storage methods instead of direct queries
- Real-time API functionality confirmed with 3 work entries returned successfully (200 status)
- Hierarchical verification workflows ready for team leads, branch managers, and company admins

**Frontend Implementation:**
- Updated React Query integration to use new endpoint paths
- Added navigation card in company dashboard for easy access
- Form validation and submission working with new API endpoints
- Error handling and user feedback implemented

**Key Benefits Achieved:**
- Seamless integration with existing work entry system (no data duplication)
- Company users can view and verify all employee work entries
- Employee users can submit and track their work verification status
- Scalable verification workflows ready for enterprise hierarchies
- Real-time updates and notifications

**Technical Status:** All endpoints operational, frontend integration complete, authentication working, database queries successful.

## ✅ Enterprise Hierarchical Company Structure System - FULLY OPERATIONAL

**Architecture Completed:**
- Database tables: `company_branches`, `company_teams` with proper relations and constraints
- Enhanced `company_employees` with hierarchy fields: hierarchyRole, branchId, teamId, permission flags
- Extended `work_entries` with verification tracking: verifiedBy, verifiedByRole, verifiedByName, external/internal display paths

**Backend Implementation:**
- Extended DatabaseStorage interface with 20+ hierarchical methods for complete CRUD operations
- Comprehensive API routes: `/api/company/branches`, `/api/company/teams`, `/api/company/structure`, `/api/company/work-entries/hierarchy`
- Real-time updates via WebSocket for all hierarchical operations
- Role-based permissions with four-tier system: Company Admin → Branch Manager → Team Lead → Employee

**Frontend Implementation:**
- Test page `/company-hierarchy-test` demonstrating all hierarchical functionality
- Graceful authentication handling with clear user feedback
- Form components for branch/team creation and management
- Visual dashboard showing company structure overview with live counts

**Key Benefits Achieved:**
- Scalable verification: Managers verify teams (10 employees each), eliminating single bottleneck for 1000+ employee verification
- Dual display system: External recruiters see "Verified by HDFC", internal users see "Verified by Manager X, HDFC Surat Branch"
- Enterprise structure support: Complex organizations like HDFC with multiple branches and specialized teams
- Granular access control: Role-based permissions for verification, employee management, and team creation

**Technical Status:** Database schema operational, API endpoints active, test interface functional, authentication system protecting routes correctly.