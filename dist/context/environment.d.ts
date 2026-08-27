export type EnvironmentContext = {
    agent?: string;
    command?: string;
    model?: string;
    task?: string;
};
export declare function collectEnvironment(env?: NodeJS.ProcessEnv, overrides?: Partial<EnvironmentContext>): EnvironmentContext;
