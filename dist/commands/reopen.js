import { Cli, z } from 'incur';
import { additiveWriteMcp, papercutNotFoundError, papercutOutputSchema, presentPapercut, schemaVersion, schemaVersionOutput, withStore, } from './shared.js';
export const reopenCommand = Cli.command({
    description: 'Reopen a resolved papercut.',
    args: z.object({ id: z.string().startsWith('pc_').describe('Papercut ID.') }),
    output: z.object({
        schema_version: schemaVersionOutput,
        action: z.literal('reopened').describe('Lifecycle change that was applied.'),
        papercut: papercutOutputSchema,
    }),
    mcp: additiveWriteMcp,
    run(context) {
        return withStore((store) => {
            const papercut = store.reopen(context.args.id);
            if (!papercut) {
                return context.error(papercutNotFoundError(context.args.id));
            }
            return {
                schema_version: schemaVersion,
                action: 'reopened',
                papercut: presentPapercut(papercut),
            };
        });
    },
});
