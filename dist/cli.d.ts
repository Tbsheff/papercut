import { Cli } from 'incur';
export declare const cli: Cli.Cli<{
    context: {
        args: {};
        options: {};
    };
} & {
    log: {
        args: {
            message: string;
        };
        options: {
            severity?: "minor" | "major" | "blocker" | undefined;
            task?: string | undefined;
        };
    };
} & {
    list: {
        args: {};
        options: {
            limit?: number | undefined;
            repo?: string | undefined;
            severity?: "minor" | "major" | "blocker" | undefined;
            status?: "open" | "resolved" | undefined;
        };
    };
} & {
    show: {
        args: {
            id: string;
        };
        options: {};
    };
} & {
    search: {
        args: {
            query: string;
        };
        options: {
            limit?: number | undefined;
        };
    };
} & {
    resolve: {
        args: {
            id: string;
        };
        options: {};
    };
} & {
    reopen: {
        args: {
            id: string;
        };
        options: {};
    };
}, undefined, undefined, undefined, "papercut">;
