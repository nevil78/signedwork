// Simple test for manager authentication
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testManagerLogin(uniqueId, password) {
  try {
    console.log('🔍 Testing manager authentication for:', uniqueId);
    
    // Get manager from database
    const managerQuery = `
      SELECT cm.*, mp.can_approve_work, mp.can_view_analytics, mp.can_edit_employees 
      FROM company_managers cm 
      LEFT JOIN manager_permissions mp ON cm.id = mp.manager_id 
      WHERE cm.unique_id = $1 AND cm.is_active = true
    `;
    
    const result = await pool.query(managerQuery, [uniqueId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Manager not found or inactive');
      return false;
    }
    
    const manager = result.rows[0];
    console.log('✅ Manager found:', manager.manager_name);
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, manager.password);
    console.log('🔐 Password match:', passwordMatch);
    
    if (passwordMatch) {
      // Update last login
      await pool.query(
        'UPDATE company_managers SET last_login_at = NOW() WHERE id = $1',
        [manager.id]
      );
      console.log('✅ Login successful, last_login_at updated');
      
      return {
        id: manager.id,
        uniqueId: manager.unique_id,
        managerName: manager.manager_name,
        managerEmail: manager.manager_email,
        companyId: manager.company_id,
        permissionLevel: manager.permission_level,
        permissions: {
          canApproveWork: manager.can_approve_work || false,
          canViewAnalytics: manager.can_view_analytics || false,
          canEditEmployees: manager.can_edit_employees || false
        }
      };
    }
    
    console.log('❌ Invalid password');
    return false;
    
  } catch (error) {
    console.error('💥 Authentication error:', error);
    return false;
  }
}

// Test the authentication
testManagerLogin('AHM123', 'testpass123')
  .then(result => {
    if (result) {
      console.log('\n🎉 AUTHENTICATION SUCCESSFUL!');
      console.log('Manager Data:', JSON.stringify(result, null, 2));
    } else {
      console.log('\n❌ AUTHENTICATION FAILED!');
    }
  })
  .finally(() => {
    pool.end();
  });