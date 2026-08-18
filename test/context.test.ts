import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

import { getPapercutPaths } from '../src/config/config.js'
import { normalizeRemote } from '../src/context/git.js'
import { normalizeMessage } from '../src/store/store.js'

const execFileAsync = promisify(execFile)
const tempDirectories: string[] = []

async function makeTemp(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  )
})

describe('normalizeRemote', () => {
  it.each([
    ['git@github.com:enzo-health/bonaparte.git', 'enzo-health/bonaparte'],
    ['https://github.com/enzo-health/bonaparte.git', 'enzo-health/bonaparte'],
    ['ssh://git@github.com/enzo-health/bonaparte.git', 'enzo-health/bonaparte'],
  ])('normalizes %s', (remote, expected) => {
    expect(normalizeRemote(remote)).toBe(expected)
  })
})

describe('normalizeMessage', () => {
  it('normalizes punctuation, case, and whitespace', () => {
    expect(normalizeMessage('  Vitest PATHS... use   Apps/Web! ')).toBe(
      'vitest paths use apps web',
    )
  })
})

describe('getPapercutPaths', () => {
  it('rejects a relative PAPERCUT_HOME that could write into a repository', () => {
    expect(() => getPapercutPaths({ PAPERCUT_HOME: '.papercut' })).toThrow(
      'PAPERCUT_HOME must be an absolute path.',
    )
  })

  it('rejects a PAPERCUT_HOME inside a Git repository', async () => {
    const repository = await makeTemp('papercut-config-repo-')
    await execFileAsync('git', ['init', '-q'], { cwd: repository })

    expect(() =>
      getPapercutPaths({ PAPERCUT_HOME: join(repository, 'state', 'papercut') }),
    ).toThrow('PAPERCUT_HOME must be outside a Git work tree.')
  })

  it('rejects a PAPERCUT_HOME inside a linked Git worktree', async () => {
    const temporaryRoot = await makeTemp('papercut-config-worktree-')
    const repository = join(temporaryRoot, 'repository')
    const worktree = join(temporaryRoot, 'worktree')
    await mkdir(repository)
    await execFileAsync('git', ['init', '-q'], { cwd: repository })
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], {
      cwd: repository,
    })
    await execFileAsync('git', ['config', 'user.name', 'Papercut Test'], {
      cwd: repository,
    })
    await writeFile(join(repository, 'README.md'), '# test\n')
    await execFileAsync('git', ['add', 'README.md'], { cwd: repository })
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd: repository })
    await execFileAsync('git', ['worktree', 'add', '-q', '-b', 'linked-worktree', worktree], {
      cwd: repository,
    })

    expect(() =>
      getPapercutPaths({ PAPERCUT_HOME: join(worktree, 'state', 'papercut') }),
    ).toThrow('PAPERCUT_HOME must be outside a Git work tree.')
  })

  it('allows a PAPERCUT_HOME outside Git', async () => {
    const home = await makeTemp('papercut-config-home-')

    expect(getPapercutPaths({ PAPERCUT_HOME: home }).home).toBe(home)
  })
})
