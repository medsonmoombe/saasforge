import 'dotenv/config';
import { db } from './connection';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token varchar(64) NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      used_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT password_reset_tokens_token_unique UNIQUE(token)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS password_reset_token_idx ON password_reset_tokens(token)`);
  console.log('✅ password_reset_tokens table created');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
