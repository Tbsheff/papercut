import { getPapercutPaths } from '../config/config.js'
import type { PapercutWithOccurrences } from '../store/store.js'
import { SqlitePapercutStore } from '../store/sqlite.js'

export function openStore(): SqlitePapercutStore {
  const paths = getPapercutPaths()
  return new SqlitePapercutStore(paths.database)
}

export function withStore<T>(callback: (store: SqlitePapercutStore) => T): T {
  const store = openStore()
  try {
    return callback(store)
  } finally {
    store.close()
  }
}

export function papercutNotFoundError(id: string) {
  return {
    code: 'PAPERCUT_NOT_FOUND',
    exitCode: 2,
    message: `Papercut ${id} was not found.`,
  }
}

export function presentPapercut(papercut: PapercutWithOccurrences) {
  return {
    id: papercut.id,
    created_at: papercut.createdAt,
    updated_at: papercut.updatedAt,
    resolved_at: papercut.resolvedAt ?? null,
    status: papercut.status,
    severity: papercut.severity,
    source: papercut.source,
    message: papercut.message,
    repo: papercut.repo ?? null,
    repo_root: papercut.repoRoot ?? null,
    cwd: papercut.cwd ?? null,
    branch: papercut.branch ?? null,
    commit_sha: papercut.sha ?? null,
    agent: papercut.agent ?? null,
    model: papercut.model ?? null,
    task: papercut.task ?? null,
    command: papercut.command ?? null,
    fingerprint: papercut.fingerprint,
    context: papercut.context ?? null,
    occurrences: papercut.occurrences,
  }
}

export function age(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

export function presentPapercutSummary(papercut: PapercutWithOccurrences) {
  return {
    id: papercut.id,
    status: papercut.status,
    severity: papercut.severity,
    repo: papercut.repo ?? null,
    age: age(papercut.createdAt),
    occurrences: papercut.occurrences,
    message: papercut.message,
    created_at: papercut.createdAt,
  }
}

export function humanList(papercuts: PapercutWithOccurrences[]): string {
  if (papercuts.length === 0) return 'No papercuts found.'
  const rows = papercuts.map((papercut) => [
    papercut.id,
    papercut.repo ?? '—',
    age(papercut.createdAt),
    String(papercut.occurrences),
    papercut.message,
  ])
  const headers = ['ID', 'REPO', 'AGE', 'OCC', 'PAPERCUT']
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]!.length)),
  )
  return [headers, ...rows]
    .map((row) => row.map((value, index) => value.padEnd(widths[index]!)).join('  ').trimEnd())
    .join('\n')
}

export function humanShow(papercut: PapercutWithOccurrences): string {
  const lines = [
    `${papercut.id} · ${papercut.status} · ${papercut.severity}`,
    papercut.message,
    '',
    `Occurrences: ${papercut.occurrences}`,
    `Created: ${papercut.createdAt}`,
    `Repository: ${papercut.repo ?? '—'}`,
    `Working directory: ${papercut.cwd ?? '—'}`,
    `Branch: ${papercut.branch ?? '—'}`,
    `Commit: ${papercut.sha ?? '—'}`,
    `Agent: ${papercut.agent ?? '—'}`,
    `Model: ${papercut.model ?? '—'}`,
    `Task: ${papercut.task ?? '—'}`,
  ]
  if (papercut.resolvedAt) lines.push(`Resolved: ${papercut.resolvedAt}`)
  return lines.join('\n')
}
