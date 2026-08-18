export type EnvironmentContext = {
  agent?: string
  command?: string
  model?: string
  task?: string
}

export function collectEnvironment(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<EnvironmentContext> = {},
): EnvironmentContext {
  return compact({
    agent: overrides.agent ?? env.PAPERCUT_AGENT,
    command: overrides.command ?? env.PAPERCUT_COMMAND,
    model: overrides.model ?? env.PAPERCUT_MODEL,
    task: overrides.task ?? env.PAPERCUT_TASK,
  })
}

function compact<T extends Record<string, string | undefined>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ''),
  ) as T
}
