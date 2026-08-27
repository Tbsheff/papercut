import { Cli, z } from 'incur';
export declare const listCommand: Cli.FileCommand<undefined, undefined, z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    repo: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<{
        minor: "minor";
        major: "major";
        blocker: "blocker";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        open: "open";
        resolved: "resolved";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    count: z.ZodNumber;
    filters: z.ZodObject<{
        limit: z.ZodNumber;
        repo: z.ZodNullable<z.ZodString>;
        severity: z.ZodNullable<z.ZodEnum<{
            minor: "minor";
            major: "major";
            blocker: "blocker";
        }>>;
        status: z.ZodEnum<{
            open: "open";
            resolved: "resolved";
        }>;
    }, z.core.$strip>;
    papercuts: z.ZodArray<z.ZodObject<{
        repo: z.ZodNullable<z.ZodString>;
        occurrences: z.ZodNumber;
        id: z.ZodString;
        message: z.ZodString;
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
    }, z.core.$strip>>;
}, z.core.$strip>>;
