# Manager Authentication System Design

## Current Problem
- Company accounts are single entities with one login
- Managers need separate accounts to access company resources
- Need to distinguish between company owners and managers

## Proposed Solution: Hybrid Authentication Model

### 1. Account Types
```
COMPANY_OWNER: Original company account creator (has all admin rights)
COMPANY_MANAGER: Invited manager with limited permissions
EMPLOYEE: Regular employee accounts
```

### 2. Authentication Flow

#### For Company Owners (Current System)
- Login with company email/password
- Automatically assigned COMPANY_ADMIN role
- Full access to all company features

#### For Managers (New System)  
- Receive invitation email with secure token
- Create manager account linked to company
- Login with their own email/password
- Assigned MANAGER role with specific permissions

### 3. Database Schema Updates
```sql
-- Add manager accounts table
CREATE TABLE company_managers (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL, 
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR DEFAULT 'MANAGER', -- MANAGER, COMPANY_ADMIN
  invited_by UUID REFERENCES companies(id),
  invite_token VARCHAR,
  invite_accepted BOOLEAN DEFAULT FALSE,
  permissions JSONB, -- Fine-grained permissions
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Manager invitations table
CREATE TABLE manager_invitations (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  invite_token VARCHAR UNIQUE NOT NULL,
  invited_by UUID,
  expires_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending', -- pending, accepted, expired
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Authentication Routes
- `/api/auth/company/login` - Company owner login
- `/api/auth/manager/login` - Manager login  
- `/api/auth/manager/accept-invite/:token` - Accept manager invitation
- `/api/auth/manager/signup` - Complete manager registration

### 5. Session Management
```javascript
// Session structure
{
  id: "user_id",
  email: "user@email.com", 
  type: "company" | "manager" | "employee",
  companyId: "linked_company_id",
  companySubRole: "COMPANY_ADMIN" | "MANAGER" | "EMPLOYEE",
  permissions: ["permission1", "permission2"]
}
```

This design maintains backward compatibility while enabling proper manager authentication.