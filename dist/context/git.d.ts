export type GitContext = {
    branch?: string;
    repo?: string;
    root?: string;
    sha?: string;
};
export declare function normalizeRemote(remote: string): string;
export declare function collectGitContext(cwd?: string): Promise<GitContext>;
