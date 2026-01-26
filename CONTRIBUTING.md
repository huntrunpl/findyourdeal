# Contributing Guide

## Workflow

**1 Task = 1 Branch = 1 PR**

### Branch Naming

```
feature/task-description        # New feature
fix/bug-description            # Bug fix
chore/maintenance-task         # Refactor, cleanup
docs/documentation-update      # Documentation
```

Example:
```bash
git checkout -b fix/status-i18n-slovak
```

### Commit Messages

Format:
```
Type(scope): short description

feat(tg-bot): add Polish status message
fix(panel): fix language sync on login
chore(repo): remove backup files
docs(deploy): add deployment guide
```

Types: `feat`, `fix`, `chore`, `docs`, `test`

### Definition of Done (DoD)

Before pushing PR, ensure **all** are checked:

- [ ] Feature/fix works locally (or tested on staging)
- [ ] Code reviewed by team member
- [ ] No console errors/warnings
- [ ] If bot changes: `/status`, `/lang` verified in all supported languages
- [ ] If panel changes: language switch tested (PL/EN)
- [ ] If DB changes: migration file in `db_migrations/YYYYMMDD_*.sql` with description
- [ ] No breaking changes to existing API/commands
- [ ] Commit message follows format above
- [ ] Pushed to GitHub, PR description filled out

### PR Description Template

```markdown
## Root cause
Brief 1-line explanation of the problem or feature request.

## What changed
- Point 1
- Point 2

## Files changed
- src/file1.ts
- db.js

## Evidence (logs/screenshots)
Screenshots or terminal output proving the fix works.

## Checklist
- [ ] Works on server (docker logs confirmed)
- [ ] No regression in /status or /lang (if applicable)
- [ ] DB migrations applied (if applicable)
```

## Rules

❌ **Forbidden:**
- Direct commits to `master` (branch + PR only)
- Hotfixes on server without commit + PR
- Untracked changes in production

✅ **Required:**
- Branch from latest master
- One logical change per commit
- PR review before merge
- All tests pass locally

## Deployment

After PR merge to master:

```bash
cd /opt/findyourdeal
git pull --ff-only origin master
docker compose up -d --build
docker compose logs -f telegram-bot-1
```

See [DEPLOY.md](./DEPLOY.md) for full deployment guide.

## Questions?

Check existing commits for patterns:
```bash
git log --oneline --all | head -20
```
