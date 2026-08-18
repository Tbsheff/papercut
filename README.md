# papercut

`papercut` is a global, local-first CLI for recording development friction. It stores data in SQLite and uses a Git repository only as read-only context.

## Install

Papercut requires Node.js 22.13 or newer.

```bash
npm install
npm run build
npm install --global .
```

Set `PAPERCUT_HOME` to place the database somewhere other than `~/.papercut`.

## Use

```bash
papercut log "Vitest test paths resolve relative to apps/web."
papercut log "The migration command needs a global CLI." --severity major --task PRD-4202
papercut list
papercut show <id>
papercut search "vitest"
papercut resolve <id>
papercut reopen <id>
```

Use `--json` or `--format jsonl` for structured agent output. Run `papercut --llms` to inspect the machine-readable command contract.

Optional agent context comes from these environment variables:

```text
PAPERCUT_AGENT
PAPERCUT_MODEL
PAPERCUT_TASK
PAPERCUT_COMMAND
```

The database uses WAL mode and a write timeout so several local agents can record papercuts at the same time. A normalized duplicate creates an occurrence instead of a second papercut.

## Data boundary

Papercut writes only under `PAPERCUT_HOME` or `~/.papercut`. It never writes to the current repository, `.git`, `AGENTS.md`, or `package.json`.

## Develop

```bash
npm test
npm run typecheck
npm run build
```
