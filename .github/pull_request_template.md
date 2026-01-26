## Root cause
<!-- 1-sentence explanation of the problem or feature request -->


## What changed
<!-- Bullet list of changes -->
- 
- 
- 


## Files changed
<!-- List of modified files -->
- 
- 
- 


## Evidence (logs/screenshots)
<!-- Provide docker logs output or screenshots proving the fix works -->

```
Paste terminal output or screenshot here
```

---

## Definition of Done Checklist

- [ ] Works on server (`docker logs` confirmed, no ERROR lines)
- [ ] No regression: `/status` and `/lang` tested in all languages (if applicable)
- [ ] DB migrations applied (if applicable) — file in `db_migrations/YYYYMMDD_*.sql`
- [ ] Code follows commit message format: `Type(scope): description`
- [ ] PR reviewed by at least 1 team member
- [ ] No hardcoded credentials or secrets in code
- [ ] No console errors/warnings in logs

---

**Before merge:**
1. Squash commits if needed (1 logical change per PR)
2. Ensure branch is up-to-date: `git pull origin master`
3. Get approval from reviewer
4. Merge via GitHub UI (not manual git merge on server)
