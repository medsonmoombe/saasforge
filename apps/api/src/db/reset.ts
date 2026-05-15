import postgres from 'postgres';
import 'dotenv/config';

async function reset() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  console.log('Dropping all tables and types...');

  await sql.unsafe(`
    DROP TABLE IF EXISTS
      notifications,
      stripe_events,
      activities,
      tasks,
      projects,
      memberships,
      organizations,
      users
    CASCADE;

    DROP TYPE IF EXISTS
      role,
      plan,
      project_status,
      task_status,
      task_priority,
      notification_type,
      status
    CASCADE;
  `);

  console.log('✅ Database reset complete. Run db:push now.');
  await sql.end();
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
