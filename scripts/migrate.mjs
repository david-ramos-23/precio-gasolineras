// scripts/migrate.mjs — runs before next build in Vercel
// Each migration must be idempotent (IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE)
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('DATABASE_URL not set — skipping migration (CI/local without DB)');
  process.exit(0);
}

const sql = neon(url);

const MIGRATIONS = [
  ['001_add_venta_restringida', () => sql`ALTER TABLE stations ADD COLUMN IF NOT EXISTS venta_restringida boolean NOT NULL DEFAULT false`],
];

for (const [name, run] of MIGRATIONS) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}:`, err.message);
    process.exit(1);
  }
}

console.log(`Migration complete (${MIGRATIONS.length} applied)`);
