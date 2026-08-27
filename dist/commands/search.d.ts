import { Cli, z } from 'incur';
export declare const searchCommand: Cli.FileCommand<z.ZodObject<{
    query: z.ZodString;
}, z.core.$strip>, undefined, z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    count: z.ZodNumber;
    query: z.ZodString;
    limit: z.ZodNumber;
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
