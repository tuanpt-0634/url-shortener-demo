import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Initialize the database
const sqlite = new Database('local.db');
const db = drizzle(sqlite, { schema });

// Read and execute migration
const migrationPath = path.join(
  process.cwd(),
  'src/lib/db/migrations/0000_slippery_joystick.sql'
);
const migration = fs.readFileSync(migrationPath, 'utf8');

// Execute migration
const statements = migration.split(';').filter((stmt) => stmt.trim());
for (const statement of statements) {
  if (statement.trim()) {
    sqlite.exec(statement);
  }
}

console.log('✅ Database initialized and migrations applied successfully!');
sqlite.close();
