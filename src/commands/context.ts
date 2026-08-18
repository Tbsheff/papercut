import { existsSync } from 'node:fs'
import { Cli, z } from 'incur'

import { getPapercutPaths } from '../config/config.js'
import { collectContext } from '../context/collect.js'
import {
  papercutOutputSchema,
  readOnlyMcp,
  schemaVersion,
  schemaVersionOutput,
} from './shared.js'

export const contextCommand = Cli.command({
  description: 'Inspect the context and storage paths papercut will use.',
  output: z.object({
    schema_version: schemaVersionOutput,
    execution: z.object({
      cwd: z.string().describe('Current working directory.'),
      repo: papercutOutputSchema.shape.repo,
      repo_root: papercutOutputSchema.shape.repo_root,
      branch: papercutOutputSchema.shape.branch,
      commit_sha: papercutOutputSchema.shape.commit_sha,
      agent: papercutOutputSchema.shape.agent,
      model: papercutOutputSchema.shape.model,
      task: papercutOutputSchema.shape.task,
      command: papercutOutputSchema.shape.command,
    }),
    storage: z.object({
      home: z.string().describe('Directory papercut can write to.'),
      database: z.string().describe('SQLite database path.'),
      database_exists: z.boolean().describe('Whether the database exists now.'),
      artifacts: z.string().describe('Reserved artifact directory.'),
    }),
  }),
  mcp: readOnlyMcp,
  async run() {
    const executionPromise = collectContext()
    const storage = getPapercutPaths()
    const execution = await executionPromise

    return {
      schema_version: schemaVersion,
      execution: {
        cwd: execution.cwd,
        repo: execution.repo ?? null,
        repo_root: execution.repoRoot ?? null,
        branch: execution.branch ?? null,
        commit_sha: execution.sha ?? null,
        agent: execution.agent ?? null,
        model: execution.model ?? null,
        task: execution.task ?? null,
        command: execution.command ?? null,
      },
      storage: {
        home: storage.home,
        database: storage.database,
        database_exists: existsSync(storage.database),
        artifacts: storage.artifacts,
      },
    }
  },
})
