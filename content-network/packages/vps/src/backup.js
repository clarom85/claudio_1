/**
 * Backup — pg_dump del DB Neon + snapshot /var/www
 *
 * Eseguito ogni domenica alle 08:xx dallo scheduler.
 * Salva in /opt/backups/ — mantiene gli ultimi 7 backup.
 * Manda alert email se il backup fallisce.
 *
 * Richiede pg_dump installato sul VPS:
 *   apt-get install -y postgresql-client
 */
import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { alertCritical, alertReport } from './alert.js';

const BACKUP_DIR  = process.env.BACKUP_DIR || '/opt/backups';
const WWW_ROOT    = process.env.WWW_ROOT   || '/var/www';
const KEEP_LAST   = 7; // numero di backup da mantenere

function timestamp() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function pruneOldBackups(subdir) {
  const dir = join(BACKUP_DIR, subdir);
  if (!existsSync(dir)) return;

  const files = readdirSync(dir)
    .map(f => ({ name: f, path: join(dir, f), mtime: statSync(join(dir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  // Rimuovi tutto oltre KEEP_LAST
  for (const f of files.slice(KEEP_LAST)) {
    unlinkSync(f.path);
    console.log(`  🗑️  Pruned old backup: ${f.name}`);
  }
}

export async function runBackup() {
  console.log('\n💾 Running backup...');
  mkdirSync(join(BACKUP_DIR, 'db'),  { recursive: true });
  mkdirSync(join(BACKUP_DIR, 'www'), { recursive: true });

  const date    = timestamp();
  const results = {};

  // ── 1. DB backup (pg_dump) ────────────────────────────────────────────
  const dbFile = join(BACKUP_DIR, 'db', `db-${date}.dump`);
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL not set');

    // Parsing URL → parametri separati per evitare problemi con caratteri speciali
    // e parametri SSL (channel_binding, sslmode) che confondono pg_dump
    const parsed   = new URL(dbUrl);
    const host     = parsed.hostname;
    const port     = parsed.port || '5432';
    const user     = parsed.username;
    const dbName   = parsed.pathname.replace(/^\//, '');
    const password = parsed.password;

    execSync(
      `/usr/lib/postgresql/17/bin/pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -Fc -f "${dbFile}"`,
      {
        timeout: 120000,
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: password, PGSSLMODE: 'require' }
      }
    );

    const size = statSync(dbFile).size;
    if (size < 10_000) {
      throw new Error(`pg_dump output troppo piccolo (${formatSize(size)}) — backup probabilmente vuoto o corrotto`);
    }
    results.db = `${dbFile} (${formatSize(size)})`;
    console.log(`  ✅ DB backup: ${formatSize(size)}`);
    pruneOldBackups('db');
  } catch (e) {
    const msg = e.message?.slice(0, 200) || 'unknown error';
    console.error(`  ❌ DB backup failed: ${msg}`);
    results.dbError = msg;
    await alertCritical('DB backup failed', msg);
  }

  // ── 2. WWW snapshot (tar delle cartelle siti) ─────────────────────────
  const wwwFile = join(BACKUP_DIR, 'www', `www-${date}.tar.gz`);
  try {
    if (!existsSync(WWW_ROOT)) throw new Error(`WWW_ROOT not found: ${WWW_ROOT}`);

    execSync(`tar -czf "${wwwFile}" -C "${WWW_ROOT}" .`, {
      timeout: 300000,
      stdio: 'pipe'
    });

    const size = statSync(wwwFile).size;
    if (size < 100_000) {
      throw new Error(`tar output troppo piccolo (${formatSize(size)}) — backup probabilmente vuoto`);
    }
    results.www = `${wwwFile} (${formatSize(size)})`;
    console.log(`  ✅ WWW backup: ${formatSize(size)}`);
    pruneOldBackups('www');
  } catch (e) {
    const msg = e.message?.slice(0, 200) || 'unknown error';
    console.error(`  ❌ WWW backup failed: ${msg}`);
    results.wwwError = msg;
    await alertCritical('WWW backup failed', msg);
  }

  // ── 3. Lista backup esistenti ─────────────────────────────────────────
  const dbBackups  = readdirSync(join(BACKUP_DIR, 'db')).filter(f => f.endsWith('.dump'));
  const wwwBackups = readdirSync(join(BACKUP_DIR, 'www')).filter(f => f.endsWith('.tar.gz'));

  console.log(`  📦 DB backups stored: ${dbBackups.length}`);
  console.log(`  📦 WWW backups stored: ${wwwBackups.length}`);

  const hasErrors = results.dbError;

  if (!hasErrors) {
    console.log('  ✅ Backup completed successfully');
  }

  return { ...results, dbCount: dbBackups.length, wwwCount: wwwBackups.length };
}
