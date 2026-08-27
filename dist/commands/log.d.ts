import { Cli, z } from 'incur';
export declare const logCommand: Cli.FileCommand<z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>, undefined, z.ZodObject<{
    severity: z.ZodOptional<z.ZodEnum<{
        minor: "minor";
        major: "major";
        blocker: "blocker";
    }>>;
    task: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    action: z.ZodEnum<{
        created: "created";
        occurrence_recorded: "occurrence_recorded";
    }>;
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
    occurrence: z.ZodObject<{
        id: z.ZodString;
        papercut_id: z.ZodString;
        created_at: z.ZodString;
        cwd: z.ZodNullable<z.ZodString>;
        branch: z.ZodNullable<z.ZodString>;
        commit_sha: z.ZodNullable<z.ZodString>;
        agent: z.ZodNullable<z.ZodString>;
        model: z.ZodNullable<z.ZodString>;
        task: z.ZodNullable<z.ZodString>;
        command: z.ZodNullable<z.ZodString>;
        context: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
}, z.core.$strip>>;
