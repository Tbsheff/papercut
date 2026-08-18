import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

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
        { cwd, home },
      ),
    )
    expect(logged.created).toBe(true)
    expect(logged.repo).toBeNull()

    const listed = JSON.parse(
      await runPapercut(['list', '--json'], { cwd, home }),
    )
    expect(listed).toHaveLength(1)

    const id = logged.id as string
    const shown = JSON.parse(
      await runPapercut(['show', id, '--json'], { cwd, home }),
    )
    expect(shown.message).toBe('Homebrew package setup is unclear.')

    const resolved = JSON.parse(
      await runPapercut(['resolve', id, '--json'], { cwd, home }),
    )
    expect(resolved.status).toBe('resolved')

    const reopened = JSON.parse(
      await runPapercut(['reopen', id, '--json'], { cwd, home }),
    )
    expect(reopened.status).toBe('open')
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
    const logged = JSON.parse(
      await runPapercut(['log', 'Test command uses a surprising cwd.', '--json'], {
        cwd,
        home,
      }),
    )
    await runPapercut(['list', '--json'], { cwd, home })
    await runPapercut(['show', logged.id, '--json'], { cwd, home })
    await runPapercut(['resolve', logged.id, '--json'], { cwd, home })
    const filesAfter = await snapshotRepositoryFiles(cwd)
    const after = (await execFileAsync('git', ['status', '--porcelain'], { cwd })).stdout

    expect(before).toBe('')
    expect(after).toBe('')
    expect(filesAfter).toEqual(filesBefore)
    expect(logged.repo).toBe('example/repo')
    expect(await readFile(join(cwd, 'README.md'), 'utf8')).toBe('# test\n')
  })

  it('handles concurrent duplicate logs as occurrences', async () => {
    const cwd = await makeTemp('papercut-cwd-')
    const home = await makeTemp('papercut-home-')

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        runPapercut(['log', 'The same flaky command needed a retry.', '--json'], {
          cwd,
          home,
        }),
      ),
    )
    const ids = new Set(results.map((result) => JSON.parse(result).id))
    expect(ids.size).toBe(1)

    const listed = JSON.parse(
      await runPapercut(['list', '--json'], { cwd, home }),
    )
    expect(listed[0].occurrences).toBe(8)
  })
})
