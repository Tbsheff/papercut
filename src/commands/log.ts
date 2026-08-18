import { Cli, z } from 'incur'

import { collectContext } from '../context/collect.js'
import { severities } from '../store/store.js'
import {
  additiveWriteMcp,
  occurrenceOutputSchema,
  papercutOutputSchema,
  presentPapercut,
  presentOccurrence,
  schemaVersion,
  schemaVersionOutput,
  withStore,
} from './shared.js'

export const logCommand = Cli.command({
  description: 'Record a development papercut with local context.',
  args: z.object({
    message: z.string().trim().min(1).describe('One or two sentences about the friction.'),
  }),
  options: z.object({
    severity: z
      .enum(severities)
      .optional()
      .describe('Impact of the papercut. Defaults to minor.'),
    task: z.string().trim().min(1).optional().describe('Related task or issue ID.'),
  }),
  output: z.object({
    schema_version: schemaVersionOutput,
    action: z
      .enum(['created', 'occurrence_recorded'])
      .describe('Whether this made a new papercut or added an occurrence.'),
    papercut: papercutOutputSchema,
    occurrence: occurrenceOutputSchema,
  }),
  examples: [
    { args: { message: "'Vitest paths resolve relative to apps/web.'" } },
    {
      args: { message: "'The migration command needs a global CLI.'" },
      options: { severity: 'major', task: 'PRD-4202' },
    },
  ],
  mcp: additiveWriteMcp,
  async run(context) {
    const collected = await collectContext({ overrides: { task: context.options.task } })
    return withStore((store) => {
      const result = store.log({
        message: context.args.message,
        severity: context.options.severity ?? 'minor',
        source: 'live',
        ...collected,
      })
      return {
        schema_version: schemaVersion,
        action: result.created ? ('created' as const) : ('occurrence_recorded' as const),
        papercut: presentPapercut(result.papercut),
        occurrence: presentOccurrence(result.occurrence),
      }
    })
  },
})
