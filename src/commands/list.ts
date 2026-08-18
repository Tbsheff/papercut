import { Cli, z } from 'incur'

import { severities, statuses } from '../store/store.js'
import { humanList, presentPapercutSummary, withStore } from './shared.js'

export const listCommand = Cli.command({
  description: 'List papercuts, newest first.',
  options: z.object({
    limit: z.number().int().min(1).max(500).default(50).describe('Maximum rows to return.'),
    repo: z.string().trim().min(1).optional().describe('Exact normalized repository name.'),
    severity: z.enum(severities).optional().describe('Filter by severity.'),
    status: z.enum(statuses).default('open').describe('Filter by lifecycle status.'),
  }),
  run(context) {
    return withStore((store) => {
      const papercuts = store.list(context.options)
      if (!context.agent && !context.formatExplicit) return humanList(papercuts)
      return papercuts.map(presentPapercutSummary)
    })
  },
})
