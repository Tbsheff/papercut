import { Cli, z } from 'incur';
export declare const contextCommand: Cli.FileCommand<undefined, undefined, undefined, z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    execution: z.ZodObject<{
        cwd: z.ZodString;
        repo: z.ZodNullable<z.ZodString>;
        repo_root: z.ZodNullable<z.ZodString>;
        branch: z.ZodNullable<z.ZodString>;
        commit_sha: z.ZodNullable<z.ZodString>;
        agent: z.ZodNullable<z.ZodString>;
        model: z.ZodNullable<z.ZodString>;
        task: z.ZodNullable<z.ZodString>;
        command: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    storage: z.ZodObject<{
        home: z.ZodString;
        database: z.ZodString;
        database_exists: z.ZodBoolean;
        artifacts: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>>;
