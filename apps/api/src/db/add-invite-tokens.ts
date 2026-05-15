import { db } from './connection.ts';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      token varchar(64) NOT NULL,
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email varchar(255) NOT NULL,
      role role DEFAULT 'member' NOT NULL,
      used_at timestamp with time zone,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT invite_tokens_token_unique UNIQUE(token)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS invite_token_idx ON invite_tokens(token)`);
  console.log('✅ invite_tokens table created');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
