export function collectEnvironment(env = process.env, overrides = {}) {
    return compact({
        agent: overrides.agent ?? env.PAPERCUT_AGENT,
        command: overrides.command ?? env.PAPERCUT_COMMAND,
        model: overrides.model ?? env.PAPERCUT_MODEL,
        task: overrides.task ?? env.PAPERCUT_TASK,
    });
}
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ''));
}
