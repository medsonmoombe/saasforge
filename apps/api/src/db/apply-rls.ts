import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function applyRLS() {
  try {
    const rlsSQL = readFileSync(join(__dirname, '../../drizzle/0001_rls_policies.sql'), 'utf-8');
    await sql.unsafe(rlsSQL);
    console.log('✅ RLS policies applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
  } finally {
    await sql.end();
  }
}

applyRLS();
