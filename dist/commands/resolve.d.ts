import { Cli, z } from 'incur';
export declare const resolveCommand: Cli.FileCommand<z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>, undefined, undefined, z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    action: z.ZodLiteral<"resolved">;
    papercut: z.ZodObject<{
        id: z.ZodString;
        created_at: z.ZodString;
        updated_at: z.ZodString;
        resolved_at: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            open: "open";
            resolved: "resolved";
        }>;
        severity: z.ZodEnum<{
            minor: "minor";
            major: "major";
            blocker: "blocker";
        }>;
        source: z.ZodEnum<{
            live: "live";
            "session-review": "session-review";
        }>;
        message: z.ZodString;
        repo: z.ZodNullable<z.ZodString>;
        repo_root: z.ZodNullable<z.ZodString>;
        cwd: z.ZodNullable<z.ZodString>;
        branch: z.ZodNullable<z.ZodString>;
        commit_sha: z.ZodNullable<z.ZodString>;
        agent: z.ZodNullable<z.ZodString>;
        model: z.ZodNullable<z.ZodString>;
        task: z.ZodNullable<z.ZodString>;
        command: z.ZodNullable<z.ZodString>;
        fingerprint: z.ZodString;
        context: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        occurrences: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>>;
