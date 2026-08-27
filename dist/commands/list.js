import { Cli, z } from 'incur';
import { severities, statuses } from '../store/store.js';
import { papercutSummaryOutputSchema, presentPapercutSummary, readOnlyMcp, schemaVersion, schemaVersionOutput, withStore, } from './shared.js';
export const listCommand = Cli.command({
    description: 'List papercuts, newest first.',
    options: z.object({
        limit: z
            .number()
            .int()
            .min(1)
            .max(500)
            .optional()
            .describe('Maximum rows to return. Defaults to 50.'),
        repo: z.string().trim().min(1).optional().describe('Exact normalized repository name.'),
        severity: z.enum(severities).optional().describe('Filter by severity.'),
        status: z
            .enum(statuses)
            .optional()
            .describe('Filter by lifecycle status. Defaults to open.'),
    }),
    output: z.object({
        schema_version: schemaVersionOutput,
        count: z.number().int().min(0).describe('Number of returned papercuts.'),
        filters: z.object({
            limit: z.number().int(),
            repo: z.string().nullable(),
            severity: z.enum(severities).nullable(),
            status: z.enum(statuses),
        }),
        papercuts: z.array(papercutSummaryOutputSchema),
    }),
    mcp: readOnlyMcp,
    run(context) {
        return withStore((store) => {
            const limit = context.options.limit ?? 50;
            const status = context.options.status ?? 'open';
            const papercuts = store.list({ ...context.options, limit, status });
            return {
                schema_version: schemaVersion,
                count: papercuts.length,
                filters: {
                    limit,
                    repo: context.options.repo ?? null,
                    severity: context.options.severity ?? null,
                    status,
                },
                papercuts: papercuts.map(presentPapercutSummary),
            };
        });
    },
});
