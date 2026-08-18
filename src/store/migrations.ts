import type { DatabaseSync } from 'node:sqlite'

const migrations = [
  `
    CREATE TABLE papercuts (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
      severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'blocker')),
      source TEXT NOT NULL DEFAULT 'live',
      message TEXT NOT NULL,
      repo TEXT,
      repo_root TEXT,
      cwd TEXT,
      branch TEXT,
      commit_sha TEXT,
      agent TEXT,
      model TEXT,
      task TEXT,
      command TEXT,
      fingerprint TEXT NOT NULL UNIQUE,
      context_json TEXT
    );

    CREATE TABLE papercut_occurrences (
      id TEXT PRIMARY KEY,
      papercut_id TEXT NOT NULL REFERENCES papercuts(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      cwd TEXT,
      branch TEXT,
      commit_sha TEXT,
      agent TEXT,
      model TEXT,
      task TEXT,
      command TEXT,
      context_json TEXT
    );

    CREATE INDEX papercuts_repo_idx ON papercuts(repo);
    CREATE INDEX papercuts_status_idx ON papercuts(status);
    CREATE INDEX papercuts_created_at_idx ON papercuts(created_at);
    CREATE INDEX papercut_occurrences_papercut_idx
      ON papercut_occurrences(papercut_id, created_at);
  `,
] as const

export function migrate(database: DatabaseSync): void {
  const initial = database.prepare('PRAGMA user_version').get() as { user_version: number }
  if (initial.user_version >= migrations.length) return

  while (true) {
    database.exec('BEGIN IMMEDIATE')
    try {
      const current = database.prepare('PRAGMA user_version').get() as { user_version: number }
      if (current.user_version >= migrations.length) {
        database.exec('COMMIT')
        return
      }
      database.exec(migrations[current.user_version]!)
      database.exec(`PRAGMA user_version = ${current.user_version + 1}`)
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }
}
