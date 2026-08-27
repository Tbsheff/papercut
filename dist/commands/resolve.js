import { Cli, z } from 'incur';
import { destructiveWriteMcp, papercutNotFoundError, papercutOutputSchema, presentPapercut, schemaVersion, schemaVersionOutput, withStore, } from './shared.js';
export const resolveCommand = Cli.command({
    description: 'Mark a papercut as resolved.',
    destructive: true,
    args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
    output: z.object({
        schema_version: schemaVersionOutput,
        action: z.literal('resolved').describe('Lifecycle change that was applied.'),
        papercut: papercutOutputSchema,
    }),
    mcp: destructiveWriteMcp,
    run(context) {
        return withStore((store) => {
            const papercut = store.resolve(context.args.id);
            if (!papercut) {
                return context.error(papercutNotFoundError(context.args.id));
            }
            return {
                schema_version: schemaVersion,
                action: 'resolved',
                papercut: presentPapercut(papercut),
            };
        });
    },
});
