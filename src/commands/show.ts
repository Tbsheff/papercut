import { Cli, z } from 'incur'

import {
  humanShow,
  papercutNotFoundError,
  presentPapercut,
  withStore,
} from './shared.js'

export const showCommand = Cli.command({
  description: 'Show one papercut and its captured context.',
  args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
  run(context) {
    return withStore((store) => {
      const papercut = store.get(context.args.id)
      if (!papercut) {
        return context.error(papercutNotFoundError(context.args.id))
      }
      if (!context.agent && !context.formatExplicit) return humanShow(papercut)
      return presentPapercut(papercut)
    })
  },
})
