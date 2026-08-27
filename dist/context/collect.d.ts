import { type EnvironmentContext } from './environment.js';
export type CollectedContext = EnvironmentContext & {
    branch?: string;
    cwd: string;
    repo?: string;
    repoRoot?: string;
    sha?: string;
};
export declare function collectContext(options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    overrides?: Partial<EnvironmentContext>;
}): Promise<CollectedContext>;
