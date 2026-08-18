import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, resolve } from 'node:path'

export type PapercutPaths = {
  artifacts: string
  database: string
  home: string
}

function isInsideGitWorkTree(path: string): boolean {
  let ancestor = path

  while (true) {
    if (existsSync(resolve(ancestor, '.git'))) return true

    const parent = dirname(ancestor)
    if (parent === ancestor) return false
    ancestor = parent
  }
}

export function getPapercutPaths(env: NodeJS.ProcessEnv = process.env): PapercutPaths {
  const configuredHome = env.PAPERCUT_HOME
  if (configuredHome && !isAbsolute(configuredHome)) {
    throw new Error('PAPERCUT_HOME must be an absolute path.')
  }
  const home = resolve(configuredHome || `${homedir()}/.papercut`)
  if (isInsideGitWorkTree(home)) {
    throw new Error('PAPERCUT_HOME must be outside a Git work tree.')
  }
  return {
    home,
    database: resolve(home, 'papercuts.db'),
    artifacts: resolve(home, 'artifacts'),
  }
}
