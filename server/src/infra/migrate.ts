import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './db.js';

export async function runMigrations(): Promise<void> {
  const dir = join(process.cwd(), 'migrations');
  let files: string[] = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort(); }
  catch { console.log('无 migrations 目录，跳过'); return; }

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now()
  )`);
  const applied = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r: { name: string }) => r.name));

  for (const f of files) {
    if (applied.has(f)) continue;
    console.log(`→ 应用 ${f}`);
    const sql = readFileSync(join(dir, f), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations(name) VALUES($1)', [f]);
      await pool.query('COMMIT');
      console.log(`✓ ${f}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
  console.log('migrations 完成');
}

// 直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
