import { collectEnvironment, type EnvironmentContext } from './environment.js'
import { collectGitContext } from './git.js'

export type CollectedContext = EnvironmentContext & {
  branch?: string
  cwd: string
  repo?: string
  repoRoot?: string
  sha?: string
}

export async function collectContext(options: {
  cwd?: string
  env?: NodeJS.ProcessEnv
  overrides?: Partial<EnvironmentContext>
} = {}): Promise<CollectedContext> {
  const cwd = options.cwd ?? process.cwd()
  const [git, environment] = await Promise.all([
    collectGitContext(cwd),
    Promise.resolve(collectEnvironment(options.env, options.overrides)),
  ])

  return {
    cwd,
    ...environment,
    ...(git.repo ? { repo: git.repo } : {}),
    ...(git.root ? { repoRoot: git.root } : {}),
    ...(git.branch ? { branch: git.branch } : {}),
    ...(git.sha ? { sha: git.sha } : {}),
  }
}
