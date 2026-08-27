import { DatabaseSync } from 'node:sqlite';
import { type ListPapercutsFilter, type LogPapercutInput, type LogPapercutResult, type PapercutStore, type PapercutWithOccurrences } from './store.js';
export declare class SqlitePapercutStore implements PapercutStore {
    readonly database: DatabaseSync;
    constructor(databasePath: string);
    close(): void;
    log(input: LogPapercutInput): LogPapercutResult;
    get(id: string): PapercutWithOccurrences | undefined;
    list(filter?: ListPapercutsFilter): PapercutWithOccurrences[];
    search(query: string, limit?: number): PapercutWithOccurrences[];
    resolve(id: string): PapercutWithOccurrences | undefined;
    reopen(id: string): PapercutWithOccurrences | undefined;
    private setStatus;
}
