# papercut

`papercut` gives coding agents local memory for development friction. It records small problems with repository, Git, agent, model, task, and command context. It stores all data in a local SQLite database and does not change the active repository.

## Install

Papercut requires Node.js 22.13 or newer.

```bash
npm install --global --prefix "$HOME/.local" --install-links git+https://github.com/Tbsheff/papercut.git
```

Add `$HOME/.local/bin` to `PATH` if your shell does not include it. This stable prefix keeps Papercut installed when a Node version manager changes the active Node version. `--install-links` makes npm copy the Git package instead of linking it to a short-lived clone.

To build from source:

```bash
git clone https://github.com/Tbsheff/papercut.git
cd papercut
npm install
npm install --global .
```

Set `PAPERCUT_HOME` to place the database somewhere other than `~/.papercut`.

## Set up an agent

The maintained agent skill is in [`skills/papercut`](skills/papercut).

Install it globally for Codex and Claude Code with the Skills CLI:

```bash
npx skills add Tbsheff/papercut --skill papercut --global --agent codex --agent claude-code
```

Omit `--global` to install the skill into the current project.

Install generated skill files so local agents can find the CLI:

```bash
papercut skills add
```

You can also register it as an MCP server:

```bash
papercut mcp add --agent codex
papercut mcp doctor
```

The skill route is the default choice because it uses fewer prompt tokens. MCP is useful when an agent client works best with tools.

## Agent contract

Every command has a declared input and output schema. Successful results include `schema_version: 1`. Write commands return the full saved record so an agent can check the result without a second call. `log` also returns the exact occurrence saved by that call.

```bash
papercut --llms-full
papercut log --schema --format json
papercut context --json
```

`papercut context` is read-only. It shows the repository context and exact database path that the next write will use.

Use `--json` for JSON. With no format flag, non-terminal callers get compact TOON output. Use `--full-output --json` when you also need the `ok`, `error`, command, and duration envelope.

## Use from a shell

```bash
papercut log "Vitest test paths resolve relative to apps/web." --json
papercut log "The migration command needs a global CLI." --severity major --task PRD-4202 --json
papercut list --json
papercut show <id> --json
papercut search "vitest" --json
papercut resolve <id> --json
papercut reopen <id> --json
```

Optional agent context comes from these environment variables:

```text
PAPERCUT_AGENT
PAPERCUT_MODEL
PAPERCUT_TASK
PAPERCUT_COMMAND
```

The database uses WAL mode and a write timeout so several local agents can record papercuts at the same time. A normalized duplicate adds an occurrence to the existing record instead of making a second papercut. The `action` field reports `created` or `occurrence_recorded`. The `occurrence` field contains the exact agent, task, command, and Git context saved by the call.

## Data boundary

Papercut writes only under `PAPERCUT_HOME` or `~/.papercut`. It never writes to the current repository, `.git`, `AGENTS.md`, or `package.json`.

## Develop

```bash
npm test
npm run typecheck
npm run build
```
