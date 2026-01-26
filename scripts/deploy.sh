#!/bin/bash
set -e

# Deploy script: deterministic, repeatable master deploy
# Usage: ./scripts/deploy.sh

REPO_PATH="/opt/findyourdeal"
BRANCH="master"

echo "=== FindYourDeal Deploy ==="
echo "Time: $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Step 1: Fetch latest
echo "[1/4] Fetching from origin..."
cd "$REPO_PATH"
git fetch origin
echo "✓ Fetch complete"
echo ""

# Step 2: Verify we're on master and pull --ff-only
echo "[2/4] Pulling master (fast-forward only)..."
git checkout "$BRANCH"
if ! git pull --ff-only origin "$BRANCH"; then
  echo "✗ Fast-forward pull failed. Manual merge required."
  exit 1
fi
echo "✓ Pull successful"
echo ""

# Step 3: Build containers
echo "[3/4] Building and starting containers..."
docker compose up -d --build
if [ $? -ne 0 ]; then
  echo "✗ docker compose up failed"
  exit 1
fi
echo "✓ Containers built and started"
echo ""

# Step 4: Verify key services
echo "[4/4] Verifying deployment..."
sleep 2

# Check telegram-bot logs for errors
BOT_ERRORS=$(docker compose logs telegram-bot-1 2>&1 | grep -i "error" | wc -l)
if [ "$BOT_ERRORS" -gt 0 ]; then
  echo "⚠ Warning: ERROR lines found in telegram-bot logs"
  docker compose logs --tail=20 telegram-bot-1
else
  echo "✓ Telegram bot: OK"
fi

# Check panel logs
PANEL_ERRORS=$(docker compose logs panel-1 2>&1 | grep -i "error" | grep -v "404" | wc -l)
if [ "$PANEL_ERRORS" -gt 0 ]; then
  echo "⚠ Warning: ERROR lines found in panel logs"
  docker compose logs --tail=20 panel-1
else
  echo "✓ Panel: OK"
fi

echo ""
echo "=== Deploy Complete ==="
echo "Revision: $(git rev-parse HEAD)"
echo "Branch: $(git branch --show-current)"
echo ""
echo "To view logs: docker compose logs -f <service>"
echo "Services: telegram-bot-1, panel-1, worker-1, api-1, db-1"
