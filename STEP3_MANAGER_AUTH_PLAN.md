# STEP 3: Manager Authentication Implementation Plan

## Problem Identified by User
- Company managers cannot log in separately
- Only company owners can access the system
- No distinction between company owner and manager accounts

## Solution: Separate Manager Authentication

### Phase 1: Database Schema (READY)
✓ Add manager authentication tables
✓ Add manager invitation system
✓ Link managers to companies

### Phase 2: Authentication Flow
- Manager invitation with secure token
- Separate manager signup/login routes  
- Session management for managers
- Role-based access control

### Phase 3: UI Implementation
- Manager login page
- Manager invitation flow
- Manager dashboard access

### Technical Implementation:
1. **Manager Invitation Flow:**
   - Company Admin invites manager via email
   - Secure token sent to manager
   - Manager creates account and accepts invitation

2. **Manager Login:**
   - Separate authentication route
   - Links to company context
   - Role-based permissions

3. **Session Management:**
   - Unified session structure for all user types
   - Company context maintained
   - Permission-based access control

This enables proper separation between company owners and managers while maintaining security.