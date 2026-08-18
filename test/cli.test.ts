import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { Mcp } from 'incur'
import { afterEach, describe, expect, it } from 'vitest'

import { contextCommand } from '../src/commands/context.js'
import { listCommand } from '../src/commands/list.js'
import { logCommand } from '../src/commands/log.js'
import { reopenCommand } from '../src/commands/reopen.js'
import { resolveCommand } from '../src/commands/resolve.js'
import { searchCommand } from '../src/commands/search.js'
import { showCommand } from '../src/commands/show.js'

const execFileAsync = promisify(execFile)
const projectRoot = resolve(import.meta.dirname, '..')
const bin = join(projectRoot, 'src/bin.ts')
const tsxLoader = join(projectRoot, 'node_modules/tsx/dist/loader.mjs')
const tempDirectories: string[] = []

async function makeTemp(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  tempDirectories.push(directory)
  return directory
}

async function runPapercut(
  args: string[],
  options: { cwd: string; home: string; env?: NodeJS.ProcessEnv },
) {
  const result = await execFileAsync(
    process.execPath,
    ['--import', tsxLoader, bin, ...args],
    {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
        PAPERCUT_HOME: options.home,
      },
    },
  )
  return result.stdout
}

async function runPapercutResult(
  args: string[],
  options: { cwd: string; home: string; env?: NodeJS.ProcessEnv },
) {
  try {
    const result = await execFileAsync(
      process.execPath,
      ['--import', tsxLoader, bin, ...args],
      {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env,
          PAPERCUT_HOME: options.home,
        },
      },
    )
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    const failure = error as Error & {
      code?: number | string
      stderr?: string
      stdout?: string
    }
    if (typeof failure.code !== 'number') throw error
    return {
      exitCode: failure.code,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    }
  }
}

async function snapshotRepositoryFiles(root: string) {
  const files: Array<{ contents: string; path: string }> = []

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) {
          await visit(path)
          return
        }
        files.push({
          path: relative(root, path),
          contents: (await readFile(path)).toString('base64'),
        })
      }),
    )
  }

  await visit(root)
  return files.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  )
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  )
})

describe('papercut CLI', () => {
  it('logs, lists, shows, resolves, and reopens outside Git', async () => {
    const cwd = await makeTemp('papercut-cwd-')
    const home = await makeTemp('papercut-home-')

    const logged = JSON.parse(
      await runPapercut(
        ['log', 'Homebrew package setup is unclear.', '--severity', 'major', '--json'],
        {
          cwd,
          home,
          env: { PAPERCUT_AGENT: 'codex', PAPERCUT_TASK: 'task-123' },
        },
      ),
    )
    expect(logged.schema_version).toBe(1)
    expect(logged.action).toBe('created')
    expect(logged.papercut.repo).toBeNull()
    expect(logged.occurrence).toMatchObject({
      agent: 'codex',
      papercut_id: logged.papercut.id,
      task: 'task-123',
    })

    const listed = JSON.parse(
      await runPapercut(['list', '--json'], { cwd, home }),
    )
    expect(listed.schema_version).toBe(1)
    expect(listed.count).toBe(1)
    expect(listed.papercuts).toHaveLength(1)

    const id = logged.papercut.id as string
    const shown = JSON.parse(
      await runPapercut(['show', id, '--json'], { cwd, home }),
    )
    expect(shown.schema_version).toBe(1)
    expect(shown.papercut.message).toBe('Homebrew package setup is unclear.')

    const resolved = JSON.parse(
      await runPapercut(['resolve', id, '--json'], { cwd, home }),
    )
    expect(resolved.action).toBe('resolved')
    expect(resolved.papercut.status).toBe('resolved')

    const reopened = JSON.parse(
      await runPapercut(['reopen', id, '--json'], { cwd, home }),
    )
    expect(reopened.action).toBe('reopened')
    expect(reopened.papercut.status).toBe('open')

    const stableFields = ({ resolved_at, status, updated_at, ...stable }: any) => stable
    expect(stableFields(resolved.papercut)).toEqual(stableFields(logged.papercut))
    expect(stableFields(reopened.papercut)).toEqual(stableFields(logged.papercut))

    const shownAfterReopen = JSON.parse(
      await runPapercut(['show', id, '--json'], { cwd, home }),
    )
    expect(shownAfterReopen.papercut).toEqual(reopened.papercut)
  })

  it.each([
    ['show', ['--json']],
    ['show', ['--format', 'jsonl']],
    ['resolve', ['--json']],
    ['resolve', ['--format', 'jsonl']],
    ['reopen', ['--json']],
    ['reopen', ['--format', 'jsonl']],
  ])('%s reports an unknown ID with %s', async (command, format) => {
    const cwd = await makeTemp('papercut-not-found-cwd-')
    const home = await makeTemp('papercut-not-found-home-')
    const id = 'pc_00000000000000000000000000'

    const result = await runPapercutResult([command, id, ...format], { cwd, home })

    expect(result.exitCode).toBe(2)
    expect(result.stderr).toBe('')
    expect(JSON.parse(result.stdout)).toEqual({
      code: 'PAPERCUT_NOT_FOUND',
      message: `Papercut ${id} was not found.`,
    })
  })

  it('captures Git context without changing the repository', async () => {
    const cwd = await makeTemp('papercut-git-')
    const home = await makeTemp('papercut-home-')
    await execFileAsync('git', ['init', '-q'], { cwd })
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd })
    await execFileAsync('git', ['config', 'user.name', 'Papercut Test'], { cwd })
    await execFileAsync('git', ['remote', 'add', 'origin', 'git@github.com:example/repo.git'], {
      cwd,
    })
    await writeFile(join(cwd, 'README.md'), '# test\n')
    await execFileAsync('git', ['add', 'README.md'], { cwd })
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd })

    const before = (await execFileAsync('git', ['status', '--porcelain'], { cwd })).stdout
    const filesBefore = await snapshotRepositoryFiles(cwd)
    const context = JSON.parse(
      await runPapercut(['context', '--json'], { cwd, home }),
    )
    const logged = JSON.parse(
      await runPapercut(['log', 'Test command uses a surprising cwd.', '--json'], {
        cwd,
        home,
      }),
    )
    await runPapercut(['list', '--json'], { cwd, home })
    await runPapercut(['show', logged.papercut.id, '--json'], { cwd, home })
    await runPapercut(['resolve', logged.papercut.id, '--json'], { cwd, home })
    const filesAfter = await snapshotRepositoryFiles(cwd)
    const after = (await execFileAsync('git', ['status', '--porcelain'], { cwd })).stdout

    expect(before).toBe('')
    expect(after).toBe('')
    expect(filesAfter).toEqual(filesBefore)
    expect(context.execution).toMatchObject({
      branch: (await execFileAsync('git', ['branch', '--show-current'], { cwd })).stdout.trim(),
      commit_sha: (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd })).stdout.trim(),
      repo: 'example/repo',
      repo_root: await realpath(cwd),
    })
    expect(logged.papercut.repo).toBe('example/repo')
    expect(await readFile(join(cwd, 'README.md'), 'utf8')).toBe('# test\n')
  })

  it('handles concurrent duplicate logs as occurrences', async () => {
    const cwd = await makeTemp('papercut-cwd-')
    const home = await makeTemp('papercut-home-')

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        runPapercutResult(['log', 'The same flaky command needed a retry.', '--json'], {
          cwd,
          home,
          env: {
            PAPERCUT_AGENT: `agent-${index}`,
            PAPERCUT_TASK: `task-${index}`,
          },
        }),
      ),
    )
    for (const result of results) {
      expect(result.exitCode, result.stdout || result.stderr).toBe(0)
    }
    const outputs = results.map((result) => JSON.parse(result.stdout))
    const ids = new Set(outputs.map((result) => result.papercut.id))
    expect(ids.size).toBe(1)
    expect(outputs.filter((result) => result.action === 'created')).toHaveLength(1)
    expect(outputs.filter((result) => result.action === 'occurrence_recorded')).toHaveLength(7)
    expect(new Set(outputs.map((result) => result.occurrence.id)).size).toBe(8)
    outputs.forEach((result, index) => {
      expect(result.occurrence).toMatchObject({
        agent: `agent-${index}`,
        papercut_id: result.papercut.id,
        task: `task-${index}`,
      })
    })

    const listed = JSON.parse(
      await runPapercut(['list', '--json'], { cwd, home }),
    )
    expect(listed.papercuts[0].occurrences).toBe(8)
  })

  it('publishes input and output schemas for every agent command', async () => {
    const cwd = await makeTemp('papercut-schema-cwd-')
    const home = await makeTemp('papercut-schema-home-')

    const commands = ['context', 'list', 'log', 'reopen', 'resolve', 'search', 'show']
    const schemas = await Promise.all(
      commands.map(async (command) =>
        JSON.parse(
          await runPapercut([command, '--schema', '--format', 'json'], { cwd, home }),
        ),
      ),
    )

    const byCommand = new Map(commands.map((command, index) => [command, schemas[index]]))
    const expectedArgs = new Map([
      ['log', 'message'],
      ['reopen', 'id'],
      ['resolve', 'id'],
      ['search', 'query'],
      ['show', 'id'],
    ])

    for (const [index, schema] of schemas.entries()) {
      const command = commands[index]
      expect(schema.output, `${command} output schema`).toBeDefined()
      expect(schema.output.properties.schema_version.const).toBe(1)
      const requiredArg = expectedArgs.get(command)
      if (requiredArg) expect(schema.args.required).toContain(requiredArg)
    }

    expect(byCommand.get('list').options.required ?? []).toEqual([])
    expect(byCommand.get('log').options.required ?? []).toEqual([])
    expect(byCommand.get('search').options.required ?? []).toEqual([])
    expect(byCommand.get('list').options.properties.status.enum).toEqual([
      'open',
      'resolved',
    ])
    expect(byCommand.get('log').options.properties.severity.enum).toEqual([
      'minor',
      'major',
      'blocker',
    ])
  })

  it('publishes shell-safe examples that preserve multiword messages', async () => {
    const cwd = await makeTemp('papercut-example-cwd-')
    const home = await makeTemp('papercut-example-home-')
    const manifest = JSON.parse(
      await runPapercut(['--llms-full', '--format', 'json'], { cwd, home }),
    )
    const log = manifest.commands.find((command: any) => command.name === 'log')
    const example = log.examples[0].command as string

    expect(example).toBe("log 'Vitest paths resolve relative to apps/web.'")

    const result = await execFileAsync(
      '/bin/sh',
      [
        '-c',
        `"$NODE_BINARY" --import "$TSX_LOADER" "$PAPERCUT_BIN" ${example} --json`,
      ],
      {
        cwd,
        env: {
          ...process.env,
          NODE_BINARY: process.execPath,
          PAPERCUT_BIN: bin,
          PAPERCUT_HOME: home,
          TSX_LOADER: tsxLoader,
        },
      },
    )
    expect(JSON.parse(result.stdout).papercut.message).toBe(
      'Vitest paths resolve relative to apps/web.',
    )
  })

  it('marks MCP reads and writes with explicit behavior hints', () => {
    const commands = new Map<string, any>([
      ['context', contextCommand],
      ['list', listCommand],
      ['log', logCommand],
      ['reopen', reopenCommand],
      ['resolve', resolveCommand],
      ['search', searchCommand],
      ['show', showCommand],
    ])
    const tools = Mcp.collectTools(commands, [])
    const annotations = Object.fromEntries(
      tools.map((tool) => [tool.name, tool.annotations]),
    )

    for (const command of ['context', 'list', 'search', 'show']) {
      expect(annotations[command]).toEqual({
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      })
    }
    expect(annotations.log).toMatchObject({
      destructiveHint: false,
      idempotentHint: false,
      readOnlyHint: false,
    })
    expect(annotations.resolve).toMatchObject({
      destructiveHint: true,
      idempotentHint: false,
      readOnlyHint: false,
    })
    expect(annotations.reopen).toMatchObject({
      destructiveHint: false,
      idempotentHint: false,
      readOnlyHint: false,
    })
  })

  it('reports execution and storage context without writing to the repository', async () => {
    const cwd = await makeTemp('papercut-context-cwd-')
    const home = await makeTemp('papercut-context-home-')

    const output = JSON.parse(
      await runPapercut(['context', '--json'], {
        cwd,
        home,
        env: {
          PAPERCUT_AGENT: 'codex',
          PAPERCUT_MODEL: 'gpt-test',
          PAPERCUT_TASK: 'task-123',
        },
      }),
    )

    expect(output).toMatchObject({
      schema_version: 1,
      execution: {
        agent: 'codex',
        cwd: await realpath(cwd),
        model: 'gpt-test',
        repo: null,
        task: 'task-123',
      },
      storage: {
        database: join(home, 'papercuts.db'),
        home,
      },
    })
  })
})
