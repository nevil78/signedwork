# Simple Work Approval System - Implementation Plan

## What We're Building (Real Business Value)

### 1. Team-Based Work Management
- Companies create **departments/teams** (Sales, Engineering, Marketing)
- Each team has **one manager** (company assigns via MANAGER role)
- Employees are assigned to **one primary team**
- Work entries automatically route to the employee's team manager

### 2. Simple Manager Workflow (No Separate Login)
- Managers use **existing company login** with MANAGER role
- Dashboard shows:
  - **Pending work entries** from their team members
  - **One-click approve/reject** with optional feedback
  - **Team performance** overview
  - Can submit **their own work entries** (routes to company admin)

### 3. Company Admin Oversight
- Sees **all work entries** across all teams
- Can **approve any pending entry** (manager fallback)
- **Manages team structure** (create teams, assign managers, move employees)
- **Company-wide analytics** and reporting

### 4. Approval Rules (Simple & Clear)
- Work entry submitted → routes to team manager
- Manager approves/rejects → entry becomes **immutable**
- If manager unavailable → company can approve directly
- **First approval wins** (no double approvals)

## Implementation Steps

1. **Add Simple Teams Table**
   - `teams` table: id, name, description, managerId, companyId
   - Update `companyEmployees` with teamId
   
2. **Enhance Company Dashboard**
   - Team management section (for admins)
   - Manager dashboard view (for managers)
   - Work entry approval interface
   
3. **Update Work Entries**
   - Add teamId and assignedManagerId
   - Add approval status and approval metadata
   - Immutability enforcement
   
4. **Role-Based UI**
   - Company admins see everything + team management
   - Managers see only their team + approval interface
   - Employees unchanged (just see their entries)

## Success Metrics
- Manager can approve team work in < 30 seconds
- Company admin can reassign employees between teams
- Clear audit trail of all approvals
- Zero complex workflows or confusing permissions