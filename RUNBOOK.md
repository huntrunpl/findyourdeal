# Production Runbook (FindYourDeal)

## Quick Links

- **Status**: `docker compose ps`
- **Health check**: `./scripts/monitor.sh`
- **Deploy guide**: [DEPLOY.md](./DEPLOY.md)

---

## Section 1: Viewing Logs

### View all services (last 100 lines)
```bash
docker compose logs --tail=100
```

### Follow specific service in real-time
```bash
docker compose logs -f telegram-bot-1        # Bot
docker compose logs -f worker-1              # Link processor
docker compose logs -f api-1                 # API
docker compose logs -f panel-1               # Panel frontend
docker compose logs -f db-1                  # PostgreSQL
```

### View logs from last N minutes
```bash
docker compose logs --since 30m               # Last 30 minutes
docker compose logs --since 2h                # Last 2 hours
```

### Search logs for specific pattern
```bash
docker compose logs --since 1h | grep "429"
docker compose logs --since 1h | grep "ERROR"
```

---

## Section 2: Common Issues & Solutions

### Issue: 429 (Rate Limited by Telegram)

**Symptom**: Bot unable to send messages, logs show `429 sendTelegram`

**Check**:
```bash
docker compose logs --since 5m telegram-bot-1 | grep 429
```

**Immediate Action**:
1. The bot **automatically backs off** and retries (built-in)
2. Wait 30-60 seconds, check if recovery happens
3. If persists, check Telegram API status

**Root Cause Check**:
- Too many messages/sec to same chat
- Telegram server under load
- Bot token corrupted (very rare)

**Recovery**:
- Wait (no action needed in most cases)
- Manually restart if needed: `docker restart findyourdeal-tg-bot-1`

---

### Issue: Worker Stuck (No Links Processing)

**Symptom**: User links not being checked, no offer updates

**Check**:
```bash
./scripts/monitor_offers.sh                  # Check worker activity
docker compose logs --since 1h worker-1 | grep -c "processed"
```

**Immediate Action**:
1. Check worker is running: `docker compose ps | grep worker`
2. If not running, restart: `docker restart findyourdeal-worker-1`
3. Check Playwright/Chrome status: `docker compose logs --since 5m worker-1`

**Common Causes**:
- Chromium process crashed
- Out of memory (check: `docker stats findyourdeal-worker-1`)
- Database connection timeout
- Too many concurrent browsers (limit is 35)

**Recovery**:
```bash
docker restart findyourdeal-worker-1
sleep 5
docker compose logs -f worker-1              # Watch startup
```

---

### Issue: Playwright / Browser Crash

**Symptom**: Logs show `Playwright.*crash` or `browser disconnected`

**Check**:
```bash
docker compose logs --since 30m worker-1 | grep -i "crash\|disconnected"
```

**Memory Issue?**:
```bash
docker stats findyourdeal-worker-1           # Check memory
```

If memory > 1.5GB → restart worker
```bash
docker restart findyourdeal-worker-1
```

**Kill stuck Chromium**:
```bash
docker compose exec worker-1 pkill -9 chrome
sleep 3
docker restart findyourdeal-worker-1
```

---

### Issue: Database Offline

**Symptom**: API/Worker/Panel all failing, logs show connection errors

**Check**:
```bash
docker compose ps | grep db
docker compose logs --since 5m db-1
```

**Immediate Action**:
```bash
docker restart findyourdeal-db-1
sleep 10
docker compose logs -f db-1                  # Wait for "database system is ready"
```

**If Database Corrupted**:
```bash
# Backup (BEFORE recovery)
docker exec findyourdeal-db-1 pg_dump -U fyd fyd > /tmp/fyd_backup_$(date +%s).sql

# Restart from last clean state
docker restart findyourdeal-db-1
```

---

### Issue: API Not Responding / 500 Errors

**Symptom**: Requests to /health return timeout, logs show errors

**Check**:
```bash
curl -v http://localhost:3000/health
docker compose logs --since 5m api-1 | grep ERROR
```

**Restart API**:
```bash
docker restart findyourdeal-api-1
sleep 5
curl http://localhost:3000/health            # Verify recovery
```

---

### Issue: Panel (Frontend) Down

**Symptom**: Cannot access panel.findyourdeal.pl, or blank/500 page

**Check**:
```bash
curl -v http://localhost:3001/
docker compose logs --since 5m panel-1
```

**Restart Panel**:
```bash
docker restart findyourdeal-panel-1
sleep 5
curl http://localhost:3001/                  # Verify it loads
```

---

## Section 3: Health Checks

### Quick Health Summary
```bash
./scripts/monitor.sh                         # Scan logs for critical patterns
./scripts/monitor_offers.sh                  # Check offers + worker
docker compose ps                            # Check container status
```

### Full Health Check Sequence
```bash
echo "=== Container Status ==="
docker compose ps

echo "=== Health Endpoints ==="
curl -s http://localhost:3000/health && echo "API OK"
curl -s http://localhost:3001/api/health && echo "Panel OK"

echo "=== Recent Errors ==="
./scripts/monitor.sh

echo "=== Offer Processing ==="
./scripts/monitor_offers.sh
```

---

## Section 4: Rollback to Previous Version

### If New Deployment Breaks Everything

1. **Find Previous Commit**:
```bash
git log --oneline -n 10
```

2. **Revert to Working Tag** (if available):
```bash
git checkout prod-20260126-0648              # Use known good tag
docker compose up -d --build
```

3. **Or Revert to Previous Commit**:
```bash
git checkout <commit-hash>
docker compose up -d --build
```

4. **Verify Recovery**:
```bash
sleep 10
./scripts/monitor.sh
docker compose ps | grep healthy
```

5. **After Fix, Push Proper Commit**:
```bash
git checkout master
# Apply fix
git add .
git commit -m "Fix(issue): description"
git push origin master
./scripts/deploy.sh
```

---

## Section 5: Monitoring & Alerting (Optional Setup)

### Add Cron Job for Periodic Checks
```bash
# Edit crontab
crontab -e

# Add these lines:
*/5 * * * * cd /opt/findyourdeal && ./scripts/monitor.sh >> /tmp/monitor.log 2>&1
*/15 * * * * cd /opt/findyourdeal && ./scripts/monitor_offers.sh >> /tmp/monitor_offers.log 2>&1

# View logs
tail -f /tmp/monitor.log
```

### Or Use systemd Timer (systemctl)
```bash
# Create /etc/systemd/system/findyourdeal-monitor.service
[Unit]
Description=FindYourDeal Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/findyourdeal/scripts/monitor.sh
StandardOutput=journal
StandardError=journal

# Create /etc/systemd/system/findyourdeal-monitor.timer
[Unit]
Description=Run FindYourDeal Monitor every 5 minutes
Requires=findyourdeal-monitor.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=1sec

[Install]
WantedBy=timers.target

# Enable
sudo systemctl daemon-reload
sudo systemctl enable --now findyourdeal-monitor.timer
sudo systemctl status findyourdeal-monitor.timer
```

---

## Section 6: Key Commands Cheatsheet

```bash
# Status
docker compose ps
./scripts/monitor.sh
./scripts/monitor_offers.sh

# Logs
docker compose logs -f <service>
docker compose logs --since 1h

# Restart single service
docker restart findyourdeal-tg-bot-1

# Restart all
docker compose restart

# Deploy new version
./scripts/deploy.sh

# Rollback
git checkout <tag-or-hash>
docker compose up -d --build

# View database
docker exec findyourdeal-db-1 psql -U fyd -d fyd -c "SELECT count(*) FROM users;"

# Backup database
docker exec findyourdeal-db-1 pg_dump -U fyd fyd > /tmp/backup.sql

# Check disk space
df -h /var/lib/docker/volumes/

# Check memory/CPU
docker stats
```

---

## When to Escalate

Contact DevOps/Team Lead if:
- Database won't restart
- Multiple services in crash loop
- Disk space < 5% available
- Worker memory > 2GB consistently
- 429 errors persist > 5 minutes
- Unable to rollback (git issues)

---

**Last Updated**: 2026-01-26  
**Current Production Tag**: `prod-20260126-0648`  
**Runbook Owner**: DevOps Team
