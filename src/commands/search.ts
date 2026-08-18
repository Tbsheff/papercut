import { Cli, z } from 'incur'

import { humanList, presentPapercutSummary, withStore } from './shared.js'

export const searchCommand = Cli.command({
  description: 'Search papercut messages and repository names.',
  args: z.object({ query: z.string().trim().min(1).describe('Text to find.') }),
  options: z.object({
    limit: z.number().int().min(1).max(500).default(50).describe('Maximum rows to return.'),
  }),
  run(context) {
    return withStore((store) => {
      const papercuts = store.search(context.args.query, context.options.limit)
      if (!context.agent && !context.formatExplicit) return humanList(papercuts)
      return papercuts.map(presentPapercutSummary)
    })
  },
})
