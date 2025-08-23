-- Create hierarchical company structure tables
-- This script creates the company_branches and company_teams tables

-- Company Branches Table (for HDFC Surat, HDFC Mumbai, etc.)
CREATE TABLE IF NOT EXISTS company_branches (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR UNIQUE NOT NULL,
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    location VARCHAR,
    address TEXT,
    phone VARCHAR,
    email VARCHAR,
    manager_employee_id VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Company Teams Table (for teams within branches)
CREATE TABLE IF NOT EXISTS company_teams (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id VARCHAR UNIQUE NOT NULL,
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR REFERENCES company_branches(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    team_lead_employee_id VARCHAR,
    max_members INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add hierarchical fields to existing company_employees table
ALTER TABLE company_employees 
ADD COLUMN IF NOT EXISTS hierarchy_role VARCHAR DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS branch_id VARCHAR REFERENCES company_branches(id),
ADD COLUMN IF NOT EXISTS team_id VARCHAR REFERENCES company_teams(id),
ADD COLUMN IF NOT EXISTS can_verify_work BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_employees BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_teams BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_scope VARCHAR DEFAULT 'none';

-- Add hierarchical verification fields to work_entries table
ALTER TABLE work_entries
ADD COLUMN IF NOT EXISTS verifier_hierarchy_role VARCHAR,
ADD COLUMN IF NOT EXISTS verifier_branch_id VARCHAR,
ADD COLUMN IF NOT EXISTS verifier_team_id VARCHAR;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_branches_company_id ON company_branches(company_id);
CREATE INDEX IF NOT EXISTS idx_company_branches_manager ON company_branches(manager_employee_id);
CREATE INDEX IF NOT EXISTS idx_company_teams_company_id ON company_teams(company_id);
CREATE INDEX IF NOT EXISTS idx_company_teams_branch_id ON company_teams(branch_id);
CREATE INDEX IF NOT EXISTS idx_company_teams_team_lead ON company_teams(team_lead_employee_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_branch_id ON company_employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_team_id ON company_employees(team_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_hierarchy_role ON company_employees(hierarchy_role);
CREATE INDEX IF NOT EXISTS idx_work_entries_verifier_branch ON work_entries(verifier_branch_id);
CREATE INDEX IF NOT EXISTS idx_work_entries_verifier_team ON work_entries(verifier_team_id);