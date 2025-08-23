# Practical Work Diary Management - Business Requirements

## What Companies Actually Need

### 1. Simple Team Structure
- Companies have departments/teams (Sales, Engineering, Marketing, etc.)
- Each team has a manager
- Employees belong to one primary team
- Manager sees their team's work entries

### 2. Work Entry Approval Process
- Employees submit work diary entries
- Entries are automatically assigned to their team manager
- Manager can:
  - Approve (with optional rating/comments)
  - Reject (with required reason)
  - Request changes (with feedback)
- Once approved → immutable (cannot be changed)

### 3. Manager Dashboard (Via Company Login)
- Managers use company login with MANAGER role
- See pending work entries from their team members
- Approve/reject entries with one click
- View team performance metrics
- Submit their own work entries (goes to company admin)

### 4. Company Admin Oversight
- Company admin sees ALL work entries from all teams
- Can approve entries if manager is unavailable (fallback)
- Can reassign employees to different teams
- Manage team structure and manager assignments
- View company-wide analytics

### 5. Employee Experience (Unchanged)
- Join company with 8-digit code
- Submit work diary entries
- See approval status and feedback
- Entries automatically route to their team manager

## Key Simplifications Needed

1. **Remove Matrix Teams** → Simple one-team-per-employee
2. **Remove Separate Manager Login** → Use company login with MANAGER role
3. **Remove Complex Hierarchies** → Manager → Company Admin (2 levels only)
4. **Focus on Approval Workflow** → The core business value
5. **Add Team Management UI** → Easy team creation and employee assignment

## Success Criteria
- Manager logs in via company portal, sees their team's pending work
- One-click approval with optional feedback
- Company admin can see everything and provide fallback approval
- Simple team management interface
- Clear audit trail of all approvals

This approach focuses on real business value instead of technical complexity.