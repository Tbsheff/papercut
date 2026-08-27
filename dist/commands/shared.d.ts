import { z } from 'incur';
import type { PapercutOccurrence, PapercutWithOccurrences } from '../store/store.js';
import { SqlitePapercutStore } from '../store/sqlite.js';
export declare const schemaVersion: 1;
export declare const readOnlyMcp: {
    readonly annotations: {
        readonly destructiveHint: false;
        readonly idempotentHint: true;
        readonly openWorldHint: false;
        readonly readOnlyHint: true;
    };
};
export declare const additiveWriteMcp: {
    readonly annotations: {
        readonly destructiveHint: false;
        readonly idempotentHint: false;
        readonly openWorldHint: false;
        readonly readOnlyHint: false;
    };
};
export declare const destructiveWriteMcp: {
    readonly annotations: {
        readonly destructiveHint: true;
        readonly idempotentHint: false;
        readonly openWorldHint: false;
        readonly readOnlyHint: false;
    };
};
export declare const papercutOutputSchema: z.ZodObject<{
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
export declare const papercutSummaryOutputSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const occurrenceOutputSchema: z.ZodObject<{
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
export declare const schemaVersionOutput: z.ZodLiteral<1>;
export declare function openStore(): SqlitePapercutStore;
export declare function withStore<T>(callback: (store: SqlitePapercutStore) => T): T;
export declare function papercutNotFoundError(id: string): {
    code: string;
    exitCode: number;
    message: string;
};
export declare function presentPapercut(papercut: PapercutWithOccurrences): {
    id: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    status: "open" | "resolved";
    severity: "minor" | "major" | "blocker";
    source: "live" | "session-review";
    message: string;
    repo: string | null;
    repo_root: string | null;
    cwd: string | null;
    branch: string | null;
    commit_sha: string | null;
    agent: string | null;
    model: string | null;
    task: string | null;
    command: string | null;
    fingerprint: string;
    context: Record<string, unknown> | null;
    occurrences: number;
};
export declare function presentPapercutSummary(papercut: PapercutWithOccurrences): {
    id: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    status: "open" | "resolved";
    severity: "minor" | "major" | "blocker";
    repo: string | null;
    occurrences: number;
    message: string;
};
export declare function presentOccurrence(occurrence: PapercutOccurrence): {
    id: string;
    papercut_id: string;
    created_at: string;
    cwd: string | null;
    branch: string | null;
    commit_sha: string | null;
    agent: string | null;
    model: string | null;
    task: string | null;
    command: string | null;
    context: Record<string, unknown> | null;
};
