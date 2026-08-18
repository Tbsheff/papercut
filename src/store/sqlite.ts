import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ulid } from 'ulid'

import { migrate } from './migrations.js'
import {
  fingerprintFor,
  type ListPapercutsFilter,
  type LogPapercutInput,
  type LogPapercutResult,
  type PapercutStore,
  type PapercutWithOccurrences,
  type Severity,
  type Source,
  type Status,
} from './store.js'

type PapercutRow = {
  agent: string | null
  branch: string | null
  command: string | null
  commit_sha: string | null
  context_json: string | null
  created_at: string
  cwd: string | null
  fingerprint: string
  id: string
  message: string
  model: string | null
  occurrences: number
  repo: string | null
  repo_root: string | null
  resolved_at: string | null
  severity: Severity
  source: Source
  status: Status
  task: string | null
  updated_at: string
}

const selectColumns = `
  p.*,
  COUNT(o.id) AS occurrences
`

export class SqlitePapercutStore implements PapercutStore {
  readonly database: DatabaseSync

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA busy_timeout = 5000')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.database.exec('PRAGMA foreign_keys = ON')
    migrate(this.database)
  }

  close(): void {
    this.database.close()
  }

  log(input: LogPapercutInput): LogPapercutResult {
    const message = input.message.trim()
    if (!message) throw new Error('Papercut message cannot be empty.')

    const now = new Date().toISOString()
    const fingerprint = fingerprintFor(input.repo, message)
    const papercutId = `pc_${ulid()}`
    const occurrenceId = `occ_${ulid()}`
    const contextJson = input.context ? JSON.stringify(input.context) : null

    this.database.exec('BEGIN IMMEDIATE')
    try {
      const insert = this.database
        .prepare(`
          INSERT OR IGNORE INTO papercuts (
            id, created_at, updated_at, status, severity, source, message,
            repo, repo_root, cwd, branch, commit_sha, agent, model, task,
            command, fingerprint, context_json
          ) VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          papercutId,
          now,
          now,
          input.severity,
          input.source,
          message,
          input.repo ?? null,
          input.repoRoot ?? null,
          input.cwd ?? null,
          input.branch ?? null,
          input.sha ?? null,
          input.agent ?? null,
          input.model ?? null,
          input.task ?? null,
          input.command ?? null,
          fingerprint,
          contextJson,
        )

      const created = insert.changes === 1
      const id = created
        ? papercutId
        : (
            this.database
              .prepare('SELECT id FROM papercuts WHERE fingerprint = ?')
              .get(fingerprint) as { id: string }
          ).id

      this.database
        .prepare(`
          INSERT INTO papercut_occurrences (
            id, papercut_id, created_at, cwd, branch, commit_sha,
            agent, model, task, command, context_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          occurrenceId,
          id,
          now,
          input.cwd ?? null,
          input.branch ?? null,
          input.sha ?? null,
          input.agent ?? null,
          input.model ?? null,
          input.task ?? null,
          input.command ?? null,
          contextJson,
        )

      if (!created) {
        this.database.prepare('UPDATE papercuts SET updated_at = ? WHERE id = ?').run(now, id)
      }
      this.database.exec('COMMIT')

      return { created, papercut: this.get(id)! }
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  get(id: string): PapercutWithOccurrences | undefined {
    const row = this.database
      .prepare(`
        SELECT ${selectColumns}
        FROM papercuts p
        LEFT JOIN papercut_occurrences o ON o.papercut_id = p.id
        WHERE p.id = ?
        GROUP BY p.id
      `)
      .get(id) as PapercutRow | undefined
    return row ? mapRow(row) : undefined
  }

  list(filter: ListPapercutsFilter = {}): PapercutWithOccurrences[] {
    const conditions: string[] = []
    const values: Array<string | number> = []
    if (filter.repo) {
      conditions.push('p.repo = ?')
      values.push(filter.repo)
    }
    if (filter.status) {
      conditions.push('p.status = ?')
      values.push(filter.status)
    }
    if (filter.severity) {
      conditions.push('p.severity = ?')
      values.push(filter.severity)
    }
    values.push(Math.min(Math.max(filter.limit ?? 50, 1), 500))

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = this.database
      .prepare(`
        SELECT ${selectColumns}
        FROM papercuts p
        LEFT JOIN papercut_occurrences o ON o.papercut_id = p.id
        ${where}
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?
      `)
      .all(...values) as unknown as PapercutRow[]
    return rows.map(mapRow)
  }

  search(query: string, limit = 50): PapercutWithOccurrences[] {
    const escaped = query.replace(/[\\%_]/g, '\\$&')
    const term = `%${escaped}%`
    const rows = this.database
      .prepare(`
        SELECT ${selectColumns}
        FROM papercuts p
        LEFT JOIN papercut_occurrences o ON o.papercut_id = p.id
        WHERE p.message LIKE ? ESCAPE '\\' OR p.repo LIKE ? ESCAPE '\\'
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?
      `)
      .all(term, term, Math.min(Math.max(limit, 1), 500)) as unknown as PapercutRow[]
    return rows.map(mapRow)
  }

  resolve(id: string): PapercutWithOccurrences | undefined {
    return this.setStatus(id, 'resolved')
  }

  reopen(id: string): PapercutWithOccurrences | undefined {
    return this.setStatus(id, 'open')
  }

  private setStatus(id: string, status: Status): PapercutWithOccurrences | undefined {
    const now = new Date().toISOString()
    const result = this.database
      .prepare(`
        UPDATE papercuts
        SET status = ?,
            updated_at = ?,
            resolved_at = CASE
              WHEN ? = 'resolved' THEN COALESCE(resolved_at, ?)
              ELSE NULL
            END
        WHERE id = ?
      `)
      .run(status, now, status, now, id)
    return result.changes === 0 ? undefined : this.get(id)
  }
}

function mapRow(row: PapercutRow): PapercutWithOccurrences {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.resolved_at ? { resolvedAt: row.resolved_at } : {}),
    status: row.status,
    severity: row.severity,
    source: row.source,
    message: row.message,
    ...(row.repo ? { repo: row.repo } : {}),
    ...(row.repo_root ? { repoRoot: row.repo_root } : {}),
    ...(row.cwd ? { cwd: row.cwd } : {}),
    ...(row.branch ? { branch: row.branch } : {}),
    ...(row.commit_sha ? { sha: row.commit_sha } : {}),
    ...(row.agent ? { agent: row.agent } : {}),
    ...(row.model ? { model: row.model } : {}),
    ...(row.task ? { task: row.task } : {}),
    ...(row.command ? { command: row.command } : {}),
    fingerprint: row.fingerprint,
    ...(row.context_json
      ? { context: JSON.parse(row.context_json) as Record<string, unknown> }
      : {}),
    occurrences: Number(row.occurrences),
  }
}
