import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function checkPolicies() {
  try {
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    console.log('Current RLS Policies:');
    console.log(JSON.stringify(policies, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkPolicies();
