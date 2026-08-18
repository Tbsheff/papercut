import { createHash } from 'node:crypto'

export const severities = ['minor', 'major', 'blocker'] as const
export const statuses = ['open', 'resolved'] as const
export const sources = ['live', 'session-review'] as const

export type Severity = (typeof severities)[number]
export type Status = (typeof statuses)[number]
export type Source = (typeof sources)[number]

export type LogPapercutInput = {
  agent?: string
  branch?: string
  command?: string
  context?: Record<string, unknown>
  cwd?: string
  message: string
  model?: string
  repo?: string
  repoRoot?: string
  severity: Severity
  sha?: string
  source: Source
  task?: string
}

export type Papercut = {
  agent?: string
  branch?: string
  command?: string
  context?: Record<string, unknown>
  createdAt: string
  cwd?: string
  fingerprint: string
  id: string
  message: string
  model?: string
  repo?: string
  repoRoot?: string
  resolvedAt?: string
  severity: Severity
  sha?: string
  source: Source
  status: Status
  task?: string
  updatedAt: string
}

export type PapercutWithOccurrences = Papercut & { occurrences: number }

export type PapercutOccurrence = {
  agent?: string
  branch?: string
  command?: string
  context?: Record<string, unknown>
  createdAt: string
  cwd?: string
  id: string
  model?: string
  papercutId: string
  sha?: string
  task?: string
}

export type ListPapercutsFilter = {
  limit?: number
  repo?: string
  severity?: Severity
  status?: Status
}

export type LogPapercutResult = {
  created: boolean
  occurrence: PapercutOccurrence
  papercut: PapercutWithOccurrences
}

export interface PapercutStore {
  close(): void
  get(id: string): PapercutWithOccurrences | undefined
  list(filter?: ListPapercutsFilter): PapercutWithOccurrences[]
  log(input: LogPapercutInput): LogPapercutResult
  reopen(id: string): PapercutWithOccurrences | undefined
  resolve(id: string): PapercutWithOccurrences | undefined
  search(query: string, limit?: number): PapercutWithOccurrences[]
}

export function normalizeMessage(message: string): string {
  return message
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function fingerprintFor(repo: string | undefined, message: string): string {
  const normalizedMessage = normalizeMessage(message)
  const fingerprintMessage =
    normalizedMessage || message.normalize('NFKC').toLowerCase().trim()

  return createHash('sha256')
    .update(`${repo ?? ''}\n${fingerprintMessage}`)
    .digest('hex')
}
