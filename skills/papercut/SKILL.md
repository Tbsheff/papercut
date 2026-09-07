---
name: papercut
description: "Use the Papercut CLI for local development-friction memory: inspect context, list/search/show records, log new records, or reopen and resolve existing records."
metadata:
  requires_bin: papercut
---

# Papercut

Use Papercut as local memory for development friction. It stores records in its own local database; a repository only supplies context. Papercut does not modify or commit repository files.

## Safety and workflow

- Run `papercut context --format json` before the first `papercut log` in a task.
- Do not record secrets, credentials, PHI, customer data, or copied file contents.
- State the concrete cause and effect. Do not log normal test failures or product bugs tracked elsewhere.
- Ask for confirmation before `papercut resolve <id>` because it changes record state.
- If the `papercut` binary is unavailable, continue the task and report that memory was unavailable.

## Commands

Use `--format json` for machine-readable output. Add `--full-output` when the full response envelope is needed.

| Goal | Command |
|---|---|
| Inspect working context and storage | `papercut context` |
| List newest open records | `papercut list` |
| Filter a list | `papercut list --limit <n> --repo <name> --severity <minor\|major\|blocker> --status <open\|resolved>` |
| Search messages and repository names | `papercut search <query> [--limit <n>]` |
| Show one record and its captured context | `papercut show <id>` |
| Record friction | `papercut log <message> [--severity <minor\|major\|blocker>] [--task <id>]` |
| Mark a record resolved | `papercut resolve <id>` |
| Reopen a resolved record | `papercut reopen <id>` |

Outputs include a `schema_version`. List and search return `count` and `papercuts`; show returns one `papercut`; log, resolve, and reopen return an `action` and the changed `papercut`.
