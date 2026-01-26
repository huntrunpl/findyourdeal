# Deploy Guide

## Quick Deploy (Master → Production)

```bash
cd /opt/findyourdeal
git fetch
git checkout master
git pull --ff-only origin master
docker compose up -d --build
```

### Verify Deployment

```bash
# Check container status
docker ps | grep findyourdeal

# Check logs (follow with -f)
docker compose logs -f telegram-bot-1      # Bot logs
docker compose logs -f panel-1             # Panel logs
docker compose logs -f worker-1            # Worker logs
docker compose logs -f db-1                # Database logs
```

## Rollback

To revert to previous version:

```bash
# Find previous commit hash
git log --oneline -n 10

# Checkout previous version
git checkout <hash>

# Rebuild
docker compose up -d --build

# Verify rollback succeeded
docker compose logs -f telegram-bot-1
```

Then push fix commit with proper message.

## Database Migrations

After pull, if new migrations exist in `db_migrations/`:

```bash
# Migrations run automatically on server startup
# Check if applied:
docker exec findyourdeal-db-1 psql -U fyd -d fyd -c \
  "SELECT * FROM pg_migrations ORDER BY date DESC LIMIT 5"
```

If manual apply needed:

```bash
MIGRATION_FILE="db_migrations/20260127_fix_lang_all_languages.sql"
docker exec -i -e PGPASSWORD='<password>' findyourdeal-db-1 psql -U fyd -d fyd < "$MIGRATION_FILE"
```

## Environment Variables

Key files:
- `.env` — secrets (kept out of repo)
- `.env.db` — database password only

Do not commit these files. Copy from secure location on first deploy.

## Deploy Checklist

- [ ] Feature branch merged to master via PR
- [ ] Tests/builds pass locally
- [ ] Code reviewed
- [ ] Migrations (if any) documented
- [ ] git pull --ff-only succeeds
- [ ] docker compose up -d --build completes without errors
- [ ] Logs show no ERROR lines
- [ ] /status works in bot
- [ ] Panel login works
