# FindYourDeal refactor – progress

## Done (verified)
- Git repo exists, .gitignore ignores .env*, node_modules, backups
- Healthcheck exists (Dockerfile) + /health endpoint exists
- DB pool unified (per git history commits)

## In progress
- Modularize API "god files": worker.js, telegram-bot.js, index.js

## TODO (programmer notes)
- Remove secrets/hardcoded config from code (env only)
- Split huge files into modules (no behavior change)
- Decide TS strategy (phase later)
- Panel: move DB access behind server actions (phase later)
- Minimal smoke checks + README/runbook

## Notes
- Keep changes small, one logical move per commit.
- Always verify before doing a step.
