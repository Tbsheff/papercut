import { collectEnvironment } from './environment.js';
import { collectGitContext } from './git.js';
export async function collectContext(options = {}) {
    const cwd = options.cwd ?? process.cwd();
    const [git, environment] = await Promise.all([
        collectGitContext(cwd),
        Promise.resolve(collectEnvironment(options.env, options.overrides)),
    ]);
    return {
        cwd,
        ...environment,
        ...(git.repo ? { repo: git.repo } : {}),
        ...(git.root ? { repoRoot: git.root } : {}),
        ...(git.branch ? { branch: git.branch } : {}),
        ...(git.sha ? { sha: git.sha } : {}),
    };
}
