import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SqlitePapercutStore } from '../src/store/sqlite.js'

const tempDirectories: string[] = []

async function makeStore() {
  const directory = await mkdtemp(join(tmpdir(), 'papercut-store-'))
  tempDirectories.push(directory)
  return new SqlitePapercutStore(join(directory, 'papercuts.db'))
}

afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  )
})

describe('SqlitePapercutStore', () => {
  it('records duplicates as occurrences of one papercut', async () => {
    const store = await makeStore()
    const input = {
      message: 'Vitest paths unexpectedly use apps/web.',
      severity: 'minor' as const,
      source: 'live' as const,
      repo: 'enzo-health/bonaparte',
      cwd: '/tmp/repo',
    }

    const first = store.log(input)
    const second = store.log({
      ...input,
      message: 'VITEST paths unexpectedly use apps web!',
      branch: 'fix/tests',
    })

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.papercut.id).toBe(first.papercut.id)
    expect(store.get(first.papercut.id)?.occurrences).toBe(2)
    store.close()
  })

  it('keeps distinct symbol-only messages as separate papercuts', async () => {
    const store = await makeStore()
    const input = {
      severity: 'minor' as const,
      source: 'live' as const,
      repo: 'enzo-health/bonaparte',
    }

    const fire = store.log({ ...input, message: '🔥' })
    const warning = store.log({ ...input, message: '⚠️' })
    const repeatedFire = store.log({ ...input, message: '  🔥  ' })

    expect(fire.created).toBe(true)
    expect(warning.created).toBe(true)
    expect(warning.papercut.id).not.toBe(fire.papercut.id)
    expect(repeatedFire.created).toBe(false)
    expect(repeatedFire.papercut.id).toBe(fire.papercut.id)
    store.close()
  })

  it('keeps the first resolve time until the papercut is reopened', async () => {
    vi.useFakeTimers()
    vi.setSystemTime('2026-08-17T12:00:00.000Z')

    const store = await makeStore()
    const papercut = store.log({
      message: 'Resolve timestamps must be stable.',
      severity: 'minor',
      source: 'live',
    }).papercut

    const firstResolve = store.resolve(papercut.id)
    vi.setSystemTime('2026-08-17T13:00:00.000Z')
    const repeatedResolve = store.resolve(papercut.id)

    expect(firstResolve?.resolvedAt).toBe('2026-08-17T12:00:00.000Z')
    expect(repeatedResolve?.resolvedAt).toBe(firstResolve?.resolvedAt)

    expect(store.reopen(papercut.id)?.resolvedAt).toBeUndefined()
    vi.setSystemTime('2026-08-17T14:00:00.000Z')
    expect(store.resolve(papercut.id)?.resolvedAt).toBe('2026-08-17T14:00:00.000Z')
    store.close()
  })

  it('filters, resolves, reopens, and searches entries', async () => {
    const store = await makeStore()
    const major = store.log({
      message: 'Prisma generation needs a global command.',
      severity: 'major',
      source: 'live',
      repo: 'enzo-health/bonaparte',
    }).papercut
    store.log({
      message: 'OCR setup is not documented.',
      severity: 'minor',
      source: 'live',
      repo: 'enzo-health/poulet',
    })

    expect(store.list({ severity: 'major' })).toHaveLength(1)
    expect(store.search('Prisma')).toHaveLength(1)

    expect(store.resolve(major.id)?.status).toBe('resolved')
    expect(store.list({ status: 'open' })).toHaveLength(1)
    expect(store.reopen(major.id)?.status).toBe('open')
    store.close()
  })
})
