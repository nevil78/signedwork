// Script to create a test manager account for Arham company
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createManagerTables() {
  try {
    // Create company_managers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_managers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id varchar NOT NULL REFERENCES companies(id),
        manager_name varchar NOT NULL,
        manager_email varchar NOT NULL,
        unique_id varchar NOT NULL UNIQUE,
        permission_level varchar DEFAULT 'team_lead',
        password varchar NOT NULL,
        branch_id varchar,
        team_id varchar,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    // Create manager_permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manager_permissions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id varchar NOT NULL REFERENCES company_managers(id),
        can_approve_work boolean DEFAULT true,
        can_view_analytics boolean DEFAULT true,
        can_edit_employees boolean DEFAULT false,
        can_create_reports boolean DEFAULT false,
        can_manage_teams boolean DEFAULT false,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    console.log('✅ Manager tables created successfully');
    return true;
  } catch (error) {
    console.log('Tables might already exist:', error.message);
    return true; // Continue even if tables exist
  }
}

async function createTestManager() {
  try {
    // Hash password for "testpass123"
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    // Insert test manager
    const managerResult = await pool.query(`
      INSERT INTO company_managers (
        company_id, manager_name, manager_email, unique_id, permission_level, password
      ) VALUES (
        '8f392d4a-2259-44f6-b79d-ad9d6ff249f1',
        'Arham Test Manager',
        'manager@arham.com',
        'AHM123',
        'team_lead',
        $1
      ) 
      ON CONFLICT (unique_id) DO UPDATE SET 
        manager_name = EXCLUDED.manager_name,
        password = EXCLUDED.password
      RETURNING id, unique_id, manager_name;
    `, [hashedPassword]);

    const manager = managerResult.rows[0];
    console.log('✅ Manager created:', manager);

    // Create default permissions
    await pool.query(`
      INSERT INTO manager_permissions (
        manager_id, can_approve_work, can_view_analytics, can_edit_employees, can_create_reports
      ) VALUES (
        $1, true, true, false, true
      );
    `, [manager.id]);

    console.log('✅ Manager permissions set');

    return {
      managerId: manager.id,
      uniqueId: manager.unique_id,
      name: manager.manager_name,
      password: 'testpass123',
      loginUrl: '/manager/login'
    };

  } catch (error) {
    console.error('Error creating test manager:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating test manager account for Arham company...');
  
  try {
    await createManagerTables();
    const manager = await createTestManager();
    
    console.log('\n🎉 Test Manager Account Created Successfully!');
    console.log('==========================================');
    console.log('Company: Arham share');
    console.log('Manager ID:', manager.uniqueId);
    console.log('Manager Name:', manager.name);
    console.log('Password:', manager.password);
    console.log('Login URL: http://localhost:5000' + manager.loginUrl);
    console.log('\nYou can now test the manager login system!');
    
  } catch (error) {
    console.error('❌ Failed to create test manager:', error);
  } finally {
    await pool.end();
  }
}

main();