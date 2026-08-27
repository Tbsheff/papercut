export type PapercutPaths = {
    artifacts: string;
    database: string;
    home: string;
};
export declare function getPapercutPaths(env?: NodeJS.ProcessEnv): PapercutPaths;
