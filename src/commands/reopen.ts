import { Cli, z } from 'incur'

import { papercutNotFoundError, withStore } from './shared.js'

export const reopenCommand = Cli.command({
  description: 'Reopen a resolved papercut.',
  args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
  run(context) {
    return withStore((store) => {
      const papercut = store.reopen(context.args.id)
      if (!papercut) {
        return context.error(papercutNotFoundError(context.args.id))
      }
      const output = { id: papercut.id, status: papercut.status, resolved_at: null }
      if (!context.agent && !context.formatExplicit) return `Reopened ${papercut.id}`
      return output
    })
  },
})
