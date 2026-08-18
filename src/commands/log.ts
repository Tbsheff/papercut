import { Cli, z } from 'incur'

import { collectContext } from '../context/collect.js'
import { severities } from '../store/store.js'
import { withStore } from './shared.js'

export const logCommand = Cli.command({
  description: 'Record a development papercut with local context.',
  args: z.object({
    message: z.string().trim().min(1).describe('One or two sentences about the friction.'),
  }),
  options: z.object({
    severity: z.enum(severities).default('minor').describe('Impact of the papercut.'),
    task: z.string().trim().min(1).optional().describe('Related task or issue ID.'),
  }),
  examples: [
    { args: { message: 'Vitest paths resolve relative to apps/web.' } },
    {
      args: { message: 'The migration command needs a global CLI.' },
      options: { severity: 'major', task: 'PRD-4202' },
    },
  ],
  async run(context) {
    const collected = await collectContext({ overrides: { task: context.options.task } })
    return withStore((store) => {
      const result = store.log({
        message: context.args.message,
        severity: context.options.severity,
        source: 'live',
        ...collected,
      })
      const output = {
        id: result.papercut.id,
        status: result.papercut.status,
        severity: result.papercut.severity,
        repo: result.papercut.repo ?? null,
        created: result.created,
        occurrences: result.papercut.occurrences,
      }
      if (!context.agent && !context.formatExplicit) {
        const prefix = result.created
          ? `Recorded ${result.papercut.id}`
          : `Similar papercut already exists: ${result.papercut.id}\nRecorded occurrence.`
        return `${prefix}\n${result.papercut.repo ?? 'No repository'} · ${result.papercut.severity}`
      }
      return output
    })
  },
})
