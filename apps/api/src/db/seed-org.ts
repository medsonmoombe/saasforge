import 'dotenv/config';
import { db } from './connection';
import { organizations } from './schema';

async function seedOrg() {
  try {
    // Insert your Clerk organization
    await db.insert(organizations).values({
      slug: 'xyz-demo-1777385349269321586',
      name: 'Demo Organization',
      plan: 'free',
    }).onConflictDoNothing();
    
    console.log('✅ Organization synced to database');
  } catch (error) {
    console.error('❌ Failed to seed org:', error);
  }
}

seedOrg();
