-- Critical Data Export Script for Signedwork Platform
-- Run this via: psql $DATABASE_URL -f export_critical_data.sql

-- Create exports directory structure
\echo 'Starting critical data export...'

-- Export Users (Employees)
\echo 'Exporting employees...'
\copy (SELECT id, email, "firstName", "lastName", headline, summary, "currentPosition", "currentCompany", industry, skills, languages, achievements, website, "portfolioUrl", "githubUrl", "linkedinUrl", phone, "dateOfBirth", gender, "profilePhoto", "isActive", "emailVerified", "createdAt", "updatedAt" FROM employees ORDER BY "createdAt") TO 'employees_backup.csv' WITH CSV HEADER;

-- Export Companies  
\echo 'Exporting companies...'
\copy (SELECT id, name, email, "businessType", industry, "companySize", website, description, "registrationNumber", "taxId", address, city, state, country, "postalCode", "contactPerson", "contactPhone", "isVerified", "verificationBadge", "invitationCode", "createdAt", "updatedAt" FROM companies ORDER BY "createdAt") TO 'companies_backup.csv' WITH CSV HEADER;

-- Export Work Entries (Most Critical)
\echo 'Exporting work entries...'
\copy (SELECT id, "employeeId", "companyId", title, description, "startDate", "endDate", hours, "actualHours", "estimatedHours", priority, status, "approvalStatus", "companyFeedback", "companyRating", "workType", category, project, client, billable, "billableRate", tags, achievements, challenges, learnings, attachments, "createdAt", "updatedAt" FROM work_entries ORDER BY "createdAt") TO 'work_entries_backup.csv' WITH CSV HEADER;

-- Export Employee-Company Relationships
\echo 'Exporting employee-company relationships...'
\copy (SELECT id, "employeeId", "companyId", "joinedAt", "leftAt", "isCurrent", "employmentStatus", "createdAt", "updatedAt" FROM employee_companies ORDER BY "createdAt") TO 'employee_companies_backup.csv' WITH CSV HEADER;

-- Export Job Listings
\echo 'Exporting job listings...'
\copy (SELECT id, "companyId", title, description, requirements, location, "remoteType", "employmentType", "experienceLevel", "salaryMin", "salaryMax", benefits, "isActive", "createdAt", "updatedAt" FROM job_listings ORDER BY "createdAt") TO 'job_listings_backup.csv' WITH CSV HEADER;

-- Export Job Applications
\echo 'Exporting job applications...'
\copy (SELECT id, "jobId", "employeeId", "coverLetter", "includeProfile", "includeWorkDiary", "attachmentUrl", "attachmentName", "salaryExpectation", status, "companyNotes", "interviewNotes", "rejectionReason", "appliedAt", "updatedAt" FROM job_applications ORDER BY "appliedAt") TO 'job_applications_backup.csv' WITH CSV HEADER;

-- Export Employee Experiences
\echo 'Exporting employee experiences...'
\copy (SELECT id, "employeeId", "jobTitle", company, location, "startDate", "endDate", "isCurrent", description, achievements, skills, "createdAt", "updatedAt" FROM employee_experiences ORDER BY "startDate") TO 'employee_experiences_backup.csv' WITH CSV HEADER;

-- Export Employee Education
\echo 'Exporting employee education...'
\copy (SELECT id, "employeeId", degree, institution, "fieldOfStudy", "startYear", "endYear", grade, description, "createdAt", "updatedAt" FROM employee_educations ORDER BY "startYear") TO 'employee_educations_backup.csv' WITH CSV HEADER;

-- Export Employee Certifications
\echo 'Exporting employee certifications...'
\copy (SELECT id, "employeeId", name, issuer, "issueDate", "expiryDate", "credentialId", "credentialUrl", description, "createdAt", "updatedAt" FROM employee_certifications ORDER BY "issueDate") TO 'employee_certifications_backup.csv' WITH CSV HEADER;

-- Export Admin Users
\echo 'Exporting admin users...'
\copy (SELECT id, username, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt" FROM admin_users ORDER BY "createdAt") TO 'admin_users_backup.csv' WITH CSV HEADER;

-- Export Sessions (for active users)
\echo 'Exporting current sessions...'
\copy (SELECT sid, sess, expire FROM sessions WHERE expire > NOW() ORDER BY expire) TO 'active_sessions_backup.csv' WITH CSV HEADER;

\echo 'Critical data export completed!'
\echo 'Files created:'
\echo '- employees_backup.csv'
\echo '- companies_backup.csv' 
\echo '- work_entries_backup.csv'
\echo '- employee_companies_backup.csv'
\echo '- job_listings_backup.csv'
\echo '- job_applications_backup.csv'
\echo '- employee_experiences_backup.csv'
\echo '- employee_educations_backup.csv'
\echo '- employee_certifications_backup.csv'
\echo '- admin_users_backup.csv'
\echo '- active_sessions_backup.csv'