import { z } from 'incur'

import { getPapercutPaths } from '../config/config.js'
import type { PapercutOccurrence, PapercutWithOccurrences } from '../store/store.js'
import { severities, sources, statuses } from '../store/store.js'
import { SqlitePapercutStore } from '../store/sqlite.js'

export const schemaVersion = 1 as const

export const readOnlyMcp = {
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
  },
} as const

export const additiveWriteMcp = {
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
  },
} as const

export const destructiveWriteMcp = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
  },
} as const

const nullableString = z.string().nullable()

export const papercutOutputSchema = z
  .object({
    id: z.string().startsWith('pc_').describe('Stable papercut ID.'),
    created_at: z.string().describe('ISO 8601 creation time.'),
    updated_at: z.string().describe('ISO 8601 last update time.'),
    resolved_at: nullableString.describe('ISO 8601 resolution time, or null.'),
    status: z.enum(statuses).describe('Current lifecycle status.'),
    severity: z.enum(severities).describe('Recorded impact.'),
    source: z.enum(sources).describe('How the papercut was found.'),
    message: z.string().describe('The recorded development friction.'),
    repo: nullableString.describe('Normalized repository name, or null.'),
    repo_root: nullableString.describe('Absolute repository root, or null.'),
    cwd: nullableString.describe('Working directory when recorded, or null.'),
    branch: nullableString.describe('Git branch when recorded, or null.'),
    commit_sha: nullableString.describe('Git commit when recorded, or null.'),
    agent: nullableString.describe('Agent name supplied by PAPERCUT_AGENT, or null.'),
    model: nullableString.describe('Model name supplied by PAPERCUT_MODEL, or null.'),
    task: nullableString.describe('Task ID supplied by --task or PAPERCUT_TASK, or null.'),
    command: nullableString.describe('Command supplied by PAPERCUT_COMMAND, or null.'),
    fingerprint: z.string().describe('Stable duplicate-detection fingerprint.'),
    context: z
      .record(z.string(), z.unknown())
      .nullable()
      .describe('Extra structured context, or null.'),
    occurrences: z.number().int().min(1).describe('Number of matching observations.'),
  })
  .describe('Canonical papercut record.')

export const papercutSummaryOutputSchema = papercutOutputSchema.pick({
  id: true,
  created_at: true,
  updated_at: true,
  resolved_at: true,
  status: true,
  severity: true,
  message: true,
  repo: true,
  occurrences: true,
})

export const occurrenceOutputSchema = z
  .object({
    id: z.string().startsWith('occ_').describe('Stable occurrence ID.'),
    papercut_id: z.string().startsWith('pc_').describe('Canonical papercut ID.'),
    created_at: z.string().describe('ISO 8601 observation time.'),
    cwd: papercutOutputSchema.shape.cwd,
    branch: papercutOutputSchema.shape.branch,
    commit_sha: papercutOutputSchema.shape.commit_sha,
    agent: papercutOutputSchema.shape.agent,
    model: papercutOutputSchema.shape.model,
    task: papercutOutputSchema.shape.task,
    command: papercutOutputSchema.shape.command,
    context: papercutOutputSchema.shape.context,
  })
  .describe('Exact occurrence saved by this log call.')

export const schemaVersionOutput = z
  .literal(schemaVersion)
  .describe('Machine contract version for this result.')

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

export function presentPapercutSummary(papercut: PapercutWithOccurrences) {
  const presented = presentPapercut(papercut)
  return {
    id: presented.id,
    created_at: presented.created_at,
    updated_at: presented.updated_at,
    resolved_at: presented.resolved_at,
    status: presented.status,
    severity: presented.severity,
    repo: presented.repo,
    occurrences: presented.occurrences,
    message: presented.message,
  }
}

export function presentOccurrence(occurrence: PapercutOccurrence) {
  return {
    id: occurrence.id,
    papercut_id: occurrence.papercutId,
    created_at: occurrence.createdAt,
    cwd: occurrence.cwd ?? null,
    branch: occurrence.branch ?? null,
    commit_sha: occurrence.sha ?? null,
    agent: occurrence.agent ?? null,
    model: occurrence.model ?? null,
    task: occurrence.task ?? null,
    command: occurrence.command ?? null,
    context: occurrence.context ?? null,
  }
}
