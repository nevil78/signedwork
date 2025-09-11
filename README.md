# Signedwork - Professional Networking & Freelancer Marketplace Platform

![Signedwork Logo](./attached_assets/Signed-work-Logo%20(1)_1755168042120.png)

## 🚀 Mission Statement

**Signedwork** is a revolutionary platform that combines the best of LinkedIn, Upwork, and GitHub to create a comprehensive professional ecosystem. Our mission is to transform how professionals connect, collaborate, and grow by providing:

- **Verified Professional Networking** - LinkedIn-like profiles with enterprise-grade verification
- **Transparent Freelancer Marketplace** - Upwork functionality with just 2% flat fees (vs 0-15% variable)
- **Authenticated Work Tracking** - GitHub-inspired verified work diary system
- **Enterprise HRMS Integration** - Complete company management with hierarchical structures

## 🎯 Project Vision

Create a dynamic and efficient online space where professionals and companies can connect, manage their work, and discover opportunities while supporting complex organizational structures. Our platform bridges the gap between professional networking, project management, and freelance marketplaces with unprecedented transparency and verification.

## 👥 User Categories

### 1. **Employee** 👨‍💼
- Works for companies AND can freelance independently
- LinkedIn-like professional profiles with CV sections
- Access to work diary for company projects
- Can bid on freelance projects in their spare time
- Comprehensive skills tracking and endorsements

### 2. **Company** 🏢
- Hires full-time employees and manages teams
- Enterprise hierarchical structure: Company → Branches → Teams
- Work diary verification and approval workflows
- Company recruitment and job posting capabilities
- Advanced organizational management tools

### 3. **Client** 💼
- Freelancers and businesses who hire talent for projects
- Post projects and review proposals
- Contract management and milestone tracking
- Access to verified professional talent pool
- Transparent fee structure (2% flat rate)

## ✨ Core Features

### 🔐 **Authentication & Security**
- Multi-tier authentication (Employee/Company/Client)
- Session-based security with 24-hour rolling sessions
- Password reset with OTP verification
- Google OAuth integration for employees
- Admin panel with role-based access control

### 👤 **Professional Profiles**
- LinkedIn-style profile management
- Comprehensive CV sections (experience, education, certifications)
- Profile picture upload with object storage
- Skills tracking and endorsements
- Professional verification badges

### 🏗️ **Enterprise Hierarchical Structure**
- Multi-level organizational support
- **Company** → **Branches** → **Teams** structure
- Role-based permissions system:
  - Company Admin → Branch Manager → Team Lead → Employee
- Real-time capacity tracking and health indicators
- Interactive organizational charts

### 📝 **Verified Work Diary System**
- Company-based work tracking with timestamps
- Multi-level approval workflows
- Hierarchical verification (Team Lead → Branch Manager → Company Admin)
- Immutable protection for approved entries
- Dual display system (external/internal verification views)

### 💼 **Freelancer Marketplace**
- AI-powered job discovery and matching
- Advanced filtering and search capabilities
- Proposal management system
- Contract and milestone tracking
- **2% flat fee structure** (competitive advantage over Upwork's 0-15%)

### 🔍 **Intelligent Features**
- Automated conflict detection for organizational issues
- Smart optimization recommendations
- Real-time performance monitoring
- Advanced matrix-based organizational management
- Trending skills discovery and analytics

### 🛡️ **Admin Panel**
- Comprehensive user management (all user types)
- Platform statistics and analytics
- Document verification workflows
- Work diary access control
- Data deletion safeguards

## 🛠️ Technical Architecture

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and builds
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React + React Icons

### **Backend Stack**
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based with express-session
- **Validation**: Zod schemas shared between client/server
- **Password Security**: bcrypt for hashing
- **Email Service**: SendGrid for notifications

### **Infrastructure**
- **Platform**: Replit for development and deployment
- **Database Provider**: Neon PostgreSQL
- **Object Storage**: Google Cloud Storage for file uploads
- **Session Storage**: PostgreSQL-backed session store
- **Real-time Communication**: Socket.IO for live updates

## 📊 Database Schema Overview

### Core Tables
- **employees** - Professional profiles and CV data
- **companies** - Company information and verification
- **clients** - Freelancer client profiles
- **company_branches** - Hierarchical branch structure
- **company_teams** - Team organization within branches
- **work_diary_entries** - Time tracking and verification
- **freelance_projects** - Project listings and management
- **freelance_proposals** - Bid and proposal system

### Authentication & Security
- **user_sessions** - Secure session management
- **admin_users** - Platform administration
- **company_invitation_codes** - Secure company joining

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (for deployment)

### Environment Variables
```bash
# Database
DATABASE_URL=your_neon_postgres_url

# Session Security
SESSION_SECRET=your-secret-key-here

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Object Storage
GOOGLE_CLOUD_STORAGE_BUCKET=your_storage_bucket
```

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd signedwork
```

2. **Install dependencies**
```bash
npm install
```

3. **Database setup**
```bash
# Push schema to database
npm run db:push

# Or force push if needed
npm run db:push --force
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 Platform Access

### Main Application
- **Employee Portal**: `/employee/dashboard`
- **Company Dashboard**: `/company/dashboard` 
- **Client Dashboard**: `/client/dashboard`
- **Admin Panel**: `/admin/dashboard` (direct URL access only)

### Authentication
- **Login**: `/auth/login`
- **Company Signup**: `/auth/signup/company`
- **Employee Signup**: `/auth/signup/employee`
- **Client Signup**: `/auth/signup/client`

## 🔧 API Documentation

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/signup/employee
POST /api/auth/signup/company  
POST /api/auth/signup/client
POST /api/auth/logout
POST /api/auth/heartbeat
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Work Diary Management
```
GET /api/work-diary/entries
POST /api/work-diary/entries
PUT /api/work-diary/entries/:id
DELETE /api/work-diary/entries/:id
POST /api/work-diary/entries/:id/approve
```

### Freelance Marketplace
```
GET /api/freelance/projects
POST /api/freelance/projects
GET /api/freelance/proposals
POST /api/freelance/proposals
PUT /api/freelance/contracts/:id
```

### Company Management
```
GET /api/company/employees
POST /api/company/invitation-codes
GET /api/company/branches
POST /api/company/branches
GET /api/company/teams
POST /api/company/teams
```

## 🏆 Competitive Advantages

### **1. Unified Platform**
- Single platform for networking, employment, and freelancing
- Seamless transition between employee and freelancer roles
- Integrated professional identity across all interactions

### **2. Transparent Pricing**
- **2% flat fee** for all freelance transactions
- No confusing tier structures or variable rates
- Predictable costs for both clients and freelancers

### **3. Verified Work System**
- Blockchain-inspired immutable work entries
- Multi-level verification prevents fraud
- Authentic professional portfolios and track records

### **4. Enterprise-Grade Features**
- Complex organizational hierarchy support
- Real-time performance monitoring
- Advanced analytics and insights
- Scalable to large enterprise needs

## 🛣️ Development Roadmap

### **Phase 1: MVP (Completed) ✅**
- Core authentication for all user types
- Basic freelancer marketplace functionality
- Company management and work diary
- Admin panel with user management

### **Phase 2: Enhanced Features** 🚧
- Payment integration (Razorpay)
- Advanced matching algorithms
- Mobile application development
- Enhanced analytics dashboard

### **Phase 3: Scale & Optimize** 📋
- Enterprise API for integrations
- Advanced security features
- Performance optimizations
- Global market expansion

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write comprehensive tests for new features
- Update documentation for API changes

### Coding Standards
- **Frontend**: React functional components with hooks
- **Backend**: Express.js with middleware pattern
- **Database**: Type-safe Drizzle ORM queries
- **Validation**: Zod schemas for all data validation

## 📈 Platform Statistics

### Current Status
- **Multi-user Authentication**: ✅ Fully Implemented
- **Work Diary System**: ✅ Fully Implemented  
- **Freelancer Marketplace**: ✅ Fully Implemented
- **Company Management**: ✅ Fully Implemented
- **Admin Panel**: ✅ Fully Implemented
- **Session Management**: ✅ Fully Implemented

### Performance Metrics
- **Session Uptime**: 24-hour rolling sessions
- **Database**: PostgreSQL with connection pooling
- **Response Time**: < 300ms average API response
- **Security**: Session-based auth with CSRF protection

## 📞 Support & Contact

### Technical Support
- **Documentation**: Available in project README
- **API Reference**: Built-in API documentation
- **Issue Tracking**: Platform-based issue management

### Platform Features
- **Real-time Support**: Built-in messaging system
- **Help Center**: Comprehensive guides and tutorials
- **Community Forums**: User-driven support and discussions

---

## 📄 License

This project is proprietary software developed for Signedwork platform. All rights reserved.

---

**Built with ❤️ using React, Express.js, PostgreSQL, and deployed on Replit**

*Signedwork - Where Professionals Connect, Collaborate, and Grow*