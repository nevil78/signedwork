# Emergency Recovery Checklist

## When Things Go Wrong - Step by Step

### 🚨 IMMEDIATE ACTIONS (5 minutes)

1. **Don't Panic** - Your work is backed up
2. **Stop making changes** - Avoid making things worse  
3. **Document the problem** - What exactly broke?
4. **Check if it's temporary** - Restart the application first

### 📋 RECOVERY PROCESS

#### Step 1: Assess the Damage
- [ ] Can you access the Replit project?
- [ ] Is the code corrupted or just not running?
- [ ] Is the database accessible?
- [ ] Are environment variables intact?

#### Step 2: Quick Fixes (Try First)
- [ ] Restart the workflow: Stop and start "Start application"
- [ ] Check console logs for specific errors
- [ ] Verify environment variables in Replit secrets
- [ ] Run `npm install` to restore dependencies

#### Step 3: Code Recovery (if needed)
- [ ] Download backup: `signedwork-backup-20250823-075939.tar.gz`
- [ ] Extract files: `tar -xzf signedwork-backup-*.tar.gz`
- [ ] Restore dependencies: `npm install`
- [ ] Check file permissions and structure

#### Step 4: Database Recovery (if needed)
- [ ] Try connecting to existing database
- [ ] Check DATABASE_URL in environment
- [ ] If data lost, restore from SQL backup
- [ ] If no backup, recreate schema: `npm run db:push`

#### Step 5: Environment Setup
- [ ] Verify all required secrets are set:
  - DATABASE_URL
  - GOOGLE_CLIENT_ID 
  - GOOGLE_CLIENT_SECRET
  - SENDGRID_API_KEY
  - OPENAI_API_KEY
  - SESSION_SECRET
- [ ] Test database connection
- [ ] Verify external service access

#### Step 6: Testing & Verification
- [ ] Application starts without errors
- [ ] Employee login works
- [ ] Company login works  
- [ ] Work diary functionality
- [ ] Job discovery features
- [ ] Admin panel access

### 🔧 SPECIFIC ERROR SOLUTIONS

#### "Database connection failed"
1. Check DATABASE_URL format
2. Verify Neon database is active
3. Test connection manually
4. Recreate database if needed

#### "Module not found" errors  
1. Run `npm install`
2. Check package.json integrity
3. Clear node_modules and reinstall
4. Verify import paths

#### "Authentication failed"
1. Check Google OAuth credentials
2. Verify SESSION_SECRET is set
3. Clear browser cookies
4. Test with fresh browser session

#### "Cannot start server"
1. Check port conflicts
2. Verify all files are present
3. Look for syntax errors in logs
4. Restart Replit workspace

### 💾 BACKUP LOCATIONS

Your data is safe in these locations:
1. **Code Backup**: `signedwork-backup-20250823-075939.tar.gz`
2. **Database Backup**: `signedwork-db-backup-*.sql` (if created)
3. **CSV Exports**: Use `export_critical_data.sql` script
4. **Recovery Guide**: `DISASTER_RECOVERY_GUIDE.md`

### 📞 ESCALATION PATH

If you can't recover:
1. **Simple issues**: Ask in Replit community
2. **Database issues**: Contact Neon support
3. **OAuth issues**: Check Google Cloud Console
4. **Complex recovery**: Seek developer assistance

### ⏱️ EXPECTED RECOVERY TIMES

- **Simple restart**: 2-5 minutes
- **Code restoration**: 10-15 minutes  
- **Database recovery**: 20-30 minutes
- **Full system rebuild**: 1-2 hours

### ✅ SUCCESS CRITERIA

Recovery is complete when:
- Application loads at localhost:5000
- You can login as employee
- You can login as company
- Work entries can be created
- Job applications work
- No console errors

---

**Remember**: Most problems are fixable. Your backup contains everything needed to restore the platform completely.