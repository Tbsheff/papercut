import { execFile } from 'node:child_process'
import { basename } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type GitContext = {
  branch?: string
  repo?: string
  root?: string
  sha?: string
}

async function git(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      timeout: 1500,
      windowsHide: true,
    })
    return stdout.trim() || undefined
  } catch {
    return undefined
  }
}

export function normalizeRemote(remote: string): string {
  const value = remote.trim().replace(/\/+$/, '').replace(/\.git$/i, '')
  const scp = value.match(/^[^@\s]+@[^:\s]+:(.+)$/)
  if (scp?.[1]) return scp[1].replace(/^\/+/, '')

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/^\/+/, '')
    return path || url.hostname
  } catch {
    return value.replace(/^\/+/, '')
  }
}

export async function collectGitContext(cwd = process.cwd()): Promise<GitContext> {
  const root = await git(cwd, ['rev-parse', '--show-toplevel'])
  if (!root) return {}

  const [remote, branch, sha] = await Promise.all([
    git(root, ['remote', 'get-url', 'origin']),
    git(root, ['branch', '--show-current']),
    git(root, ['rev-parse', 'HEAD']),
  ])

  return {
    root,
    repo: remote ? normalizeRemote(remote) : basename(root),
    ...(branch ? { branch } : {}),
    ...(sha ? { sha } : {}),
  }
}
