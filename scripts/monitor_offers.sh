#!/bin/bash
# Monitor script: check for stuck worker and missing offers
# Usage: ./scripts/monitor_offers.sh [db_conn_string]

DB_CONN="${1:-postgresql://fyd:Victoria2014!@localhost:5432/fyd}"
ALERT_FOUND=0

echo "=== Monitoring offers and worker health ==="
echo ""

# Check 1: No offers sent in last N hours (e.g., 2 hours)
echo "[1/2] Checking for stalled offers (no sends in >2h)..."
STALLED=$(psql "$DB_CONN" -t -c "
  SELECT 
    u.id, 
    u.telegram_id,
    COUNT(l.id) as active_links,
    MAX(s.sent_at) as last_sent
  FROM users u
  LEFT JOIN links l ON l.user_id = u.id AND l.active = true
  LEFT JOIN status_log s ON s.user_id = u.id
  WHERE u.trial_used = true OR u.plan_name IN ('starter', 'growth', 'platinum')
  GROUP BY u.id, u.telegram_id
  HAVING COUNT(l.id) > 0 AND (MAX(s.sent_at) IS NULL OR MAX(s.sent_at) < NOW() - INTERVAL '2 hours')
  LIMIT 5
" 2>/dev/null)

if [ -n "$STALLED" ]; then
  echo "🚨 ALERT: Users with active links but no offers in 2+ hours:"
  echo "$STALLED" | while read user_id tg_id link_count last_sent; do
    echo "   User $user_id (TG: $tg_id) | Links: $link_count | Last offer: $last_sent"
  done
  echo ""
  ALERT_FOUND=1
else
  echo "✅ OK: Offers being sent regularly to active users"
  echo ""
fi

# Check 2: Worker processing (check recent worker logs)
echo "[2/2] Checking worker activity (last 1h)..."
WORKER_ACTIVITY=$(docker compose logs --since 1h worker 2>&1 | grep -c "processed\|link_id\|error" || echo "0")

if [ "$WORKER_ACTIVITY" -lt 5 ]; then
  echo "⚠️  WARNING: Low worker activity detected ($WORKER_ACTIVITY events in 1h)"
  docker compose logs --since 1h worker 2>&1 | tail -10 | sed 's/^/   /'
  echo ""
  ALERT_FOUND=1
else
  echo "✅ OK: Worker processing links normally ($WORKER_ACTIVITY events in 1h)"
  echo ""
fi

if [ "$ALERT_FOUND" -eq 0 ]; then
  echo "=== All checks PASSED ==="
  exit 0
else
  echo "=== ALERTS DETECTED ==="
  exit 1
fi
