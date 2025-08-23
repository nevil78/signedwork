# Signedwork Platform - Disaster Recovery Guide

## Quick Recovery Steps

### 1. Restore Code from Backup
```bash
# Extract the backup archive
tar -xzf signedwork-backup-20250823-075939.tar.gz

# Restore dependencies
npm install

# Verify project structure
ls -la client/ server/ shared/
```

### 2. Database Recovery Options

#### Option A: Database Backup/Restore (Recommended)
```bash
# Create database backup (run this NOW as prevention)
pg_dump $DATABASE_URL > signedwork-db-backup-$(date +%Y%m%d).sql

# To restore database later:
psql $DATABASE_URL < signedwork-db-backup-YYYYMMDD.sql
```

#### Option B: Schema Recreation (if no backup exists)
```bash
# Recreate database schema from code
npm run db:push

# This will recreate all tables but lose data
# Only use if you have no database backup
```

#### Option C: Production Database Clone
```bash
# If you have production data, clone it to development
# This preserves user accounts, work entries, etc.
```

### 3. Environment Variables Recovery
Your `.env` file or Replit secrets need these keys:
```
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SENDGRID_API_KEY=...
OPENAI_API_KEY=...
SESSION_SECRET=...
```

### 4. Verification Steps
```bash
# 1. Start the application
npm run dev

# 2. Check database connection
curl http://localhost:5000/api/auth/session-status

# 3. Test core functionality
# - Employee login
# - Company login  
# - Work entry creation
# - Job application flow
```

## Emergency Scenarios & Solutions

### Scenario 1: "Everything is broken, nothing works"
1. Extract backup: `tar -xzf signedwork-backup-*.tar.gz`
2. Install dependencies: `npm install`
3. Restore database: `psql $DATABASE_URL < db-backup.sql`
4. Set environment variables
5. Restart: `npm run dev`

### Scenario 2: "Code is corrupted but database is fine"
1. Extract code backup only
2. Keep existing database
3. Verify database connectivity
4. Test application functionality

### Scenario 3: "Database is corrupted but code is fine"
1. Restore database from backup
2. OR recreate schema: `npm run db:push`
3. Manually re-enter critical data
4. Test all features

### Scenario 4: "Lost access to Replit completely"
1. Download backup file to local machine
2. Set up local development environment
3. Install Node.js, PostgreSQL locally
4. Extract backup and run locally
5. Deploy to new hosting provider

## Data Export Commands (Run NOW for safety)

### Export User Data
```sql
-- Export all users
COPY (SELECT * FROM employees) TO '/tmp/employees_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM companies) TO '/tmp/companies_backup.csv' WITH CSV HEADER;
```

### Export Work Entries
```sql
-- Export all work entries
COPY (SELECT * FROM work_entries) TO '/tmp/work_entries_backup.csv' WITH CSV HEADER;
```

### Export Job Applications  
```sql
-- Export job applications
COPY (SELECT * FROM job_applications) TO '/tmp/job_applications_backup.csv' WITH CSV HEADER;
```

## Prevention Strategy

### Daily Automated Backups
1. Set up automated database dumps
2. Regular code commits to Git repository
3. Environment variable documentation
4. User data exports

### Multiple Backup Locations
1. **Local backup**: Downloaded to your computer
2. **Cloud backup**: Google Drive, Dropbox, etc.
3. **Git repository**: GitHub, GitLab private repo
4. **Database backup**: Separate database dump files

### Recovery Testing
- Test backup restoration monthly
- Verify all functionality works after restore
- Document any missing pieces
- Update recovery procedures

## Contact Points for Help

### If Database is Lost
- Neon database support (if using Neon)
- PostgreSQL recovery documentation
- Database export tools

### If Code is Lost
- This backup file: `signedwork-backup-20250823-075939.tar.gz`
- Replit version history (if available)
- Git commit history

### If Hosting is Lost
- Local development setup
- Alternative hosting (Vercel, Railway, etc.)
- Docker containerization for portability

## Recovery Time Estimates

- **Code restoration**: 5-10 minutes
- **Database restoration**: 10-30 minutes  
- **Full system recovery**: 30-60 minutes
- **Testing and verification**: 30-60 minutes

**Total recovery time**: 1-3 hours maximum

## Success Criteria

Recovery is complete when:
- [ ] Application starts without errors
- [ ] Employee login works
- [ ] Company login works
- [ ] Work entries can be created
- [ ] Job applications function
- [ ] Admin panel accessible
- [ ] All major features working

---

**Remember**: The best disaster recovery is prevention. Run backups regularly and test restoration procedures before you need them.