import { Cli, z } from 'incur'

import { papercutNotFoundError, withStore } from './shared.js'

export const resolveCommand = Cli.command({
  description: 'Mark a papercut as resolved.',
  destructive: true,
  args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
  run(context) {
    return withStore((store) => {
      const papercut = store.resolve(context.args.id)
      if (!papercut) {
        return context.error(papercutNotFoundError(context.args.id))
      }
      const output = {
        id: papercut.id,
        status: papercut.status,
        resolved_at: papercut.resolvedAt ?? null,
      }
      if (!context.agent && !context.formatExplicit) return `Resolved ${papercut.id}`
      return output
    })
  },
})
