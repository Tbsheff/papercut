import { Cli, z } from 'incur'

import {
  papercutSummaryOutputSchema,
  presentPapercutSummary,
  readOnlyMcp,
  schemaVersion,
  schemaVersionOutput,
  withStore,
} from './shared.js'

export const searchCommand = Cli.command({
  description: 'Search papercut messages and repository names.',
  args: z.object({ query: z.string().trim().min(1).describe('Text to find.') }),
  options: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe('Maximum rows to return. Defaults to 50.'),
  }),
  output: z.object({
    schema_version: schemaVersionOutput,
    count: z.number().int().min(0).describe('Number of returned papercuts.'),
    query: z.string().describe('Search query that was used.'),
    limit: z.number().int().describe('Maximum rows requested.'),
    papercuts: z.array(papercutSummaryOutputSchema),
  }),
  mcp: readOnlyMcp,
  run(context) {
    return withStore((store) => {
      const limit = context.options.limit ?? 50
      const papercuts = store.search(context.args.query, limit)
      return {
        schema_version: schemaVersion,
        count: papercuts.length,
        query: context.args.query,
        limit,
        papercuts: papercuts.map(presentPapercutSummary),
      }
    })
  },
})
