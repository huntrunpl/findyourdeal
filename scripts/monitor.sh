#!/bin/bash
# Monitor script: scan recent logs for critical patterns
# Usage: ./scripts/monitor.sh [--since 5m]

SINCE="${1:---since 5m}"
ALERT_FOUND=0

echo "=== Scanning recent logs for critical patterns ==="
echo "Timeframe: $SINCE"
echo ""

# Patterns to monitor
PATTERNS=(
  "429.*sendTelegram"
  "UnhandledPromiseRejection"
  "FATAL"
  "Playwright.*crash"
  "browser disconnected"
  "ECONNREFUSED"
  "OutOfMemory"
  "Error.*connecting"
)

# Scan logs for each pattern
for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(docker compose logs $SINCE 2>&1 | grep -i "$pattern" | wc -l)
  
  if [ "$MATCHES" -gt 0 ]; then
    echo "🚨 ALERT: Pattern '$pattern' found $MATCHES times"
    echo "   Last occurrences:"
    docker compose logs $SINCE 2>&1 | grep -i "$pattern" | tail -3 | sed 's/^/   /'
    echo ""
    ALERT_FOUND=1
  fi
done

if [ "$ALERT_FOUND" -eq 0 ]; then
  echo "✅ OK: No critical patterns found in logs"
  exit 0
else
  echo "⚠️  Alerts detected. Check docker compose logs for details."
  exit 1
fi
