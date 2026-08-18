import { Cli, z } from 'incur'

import {
  papercutNotFoundError,
  papercutOutputSchema,
  presentPapercut,
  readOnlyMcp,
  schemaVersion,
  schemaVersionOutput,
  withStore,
} from './shared.js'

export const showCommand = Cli.command({
  description: 'Show one papercut and its captured context.',
  args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
  output: z.object({
    schema_version: schemaVersionOutput,
    papercut: papercutOutputSchema,
  }),
  mcp: readOnlyMcp,
  run(context) {
    return withStore((store) => {
      const papercut = store.get(context.args.id)
      if (!papercut) {
        return context.error(papercutNotFoundError(context.args.id))
      }
      return {
        schema_version: schemaVersion,
        papercut: presentPapercut(papercut),
      }
    })
  },
})
