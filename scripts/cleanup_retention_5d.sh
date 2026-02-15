#!/bin/bash
# cleanup_retention_5d.sh
# Cleanup historii DB - kasowanie rekordów starszych niż 5 dni (lub wygasłych)
# Użycie:
#   DRY_RUN=1 ./cleanup_retention_5d.sh  # test (tylko SELECT COUNT)
#   DRY_RUN=0 ./cleanup_retention_5d.sh  # kasowanie

set -euo pipefail

# Konfiguracja
DRY_RUN="${DRY_RUN:-1}"  # domyślnie DRY_RUN (bezpieczne)
DB_CONTAINER="${DB_CONTAINER:-findyourdeal-db-1}"
DB_USER="${DB_USER:-fyd}"
DB_NAME="${DB_NAME:-fyd}"
LOG_FILE="${LOG_FILE:-/var/log/cleanup_retention_5d.log}"

# Funkcja: log z timestampem
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Funkcja: wykonaj cleanup dla jednej tabeli
cleanup_table() {
  local table_name="$1"
  local where_clause="$2"
  local description="$3"
  
  log "=== Czyszczenie: $table_name ($description) ==="
  
  if [[ "$DRY_RUN" == "1" ]]; then
    # DRY RUN: tylko policz ile zostałoby usuniętych
    local count
    count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
      "SELECT COUNT(*) FROM $table_name WHERE $where_clause" 2>&1 | tr -d ' ' || echo "ERROR")
    
    if [[ "$count" == "ERROR" ]] || [[ -z "$count" ]]; then
      log "❌ BŁĄD: Nie można policzyć rekordów w $table_name"
      return 1
    fi
    
    log "🔍 DRY RUN: Zostałoby usuniętych $count rekordów z $table_name"
  else
    # PRODUKCJA: kasuj
    local result
    result=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
      "DELETE FROM $table_name WHERE $where_clause" 2>&1 || echo "ERROR")
    
    if echo "$result" | grep -q "ERROR"; then
      log "❌ BŁĄD podczas kasowania z $table_name: $result"
      return 1
    fi
    
    # Wyciągnij liczbę z "DELETE 123"
    local deleted
    deleted=$(echo "$result" | grep -oP 'DELETE \K\d+' || echo "0")
    log "✅ Usunięto $deleted rekordów z $table_name"
  fi
  
  return 0
}

# START
log "========================================="
log "Cleanup Retention 5d - START"
log "DRY_RUN=$DRY_RUN (1=test, 0=kasowanie)"
log "========================================="

# Sprawdź połączenie z DB
if ! docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
  log "❌ BŁĄD: Nie można połączyć się z bazą danych"
  exit 1
fi

log "✅ Połączenie z bazą OK"

# Licznik sukcesów/błędów
success_count=0
error_count=0

# 1. link_items (>5 dni)
if cleanup_table "link_items" \
  "first_seen_at < NOW() - interval '5 days'" \
  "Historia ofert >5 dni"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 2. sent_offers (>5 dni)
if cleanup_table "sent_offers" \
  "sent_at < NOW() - interval '5 days'" \
  "Wysłane powiadomienia >5 dni"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 3. stripe_webhook_events (>5 dni, tylko processed)
if cleanup_table "stripe_webhook_events" \
  "received_at < NOW() - interval '5 days' AND status = 'processed'" \
  "Przetworzone webhooks Stripe >5 dni"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 4. panel_login_tokens (wygasłe)
if cleanup_table "panel_login_tokens" \
  "expires_at < NOW()" \
  "Wygasłe tokeny logowania"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 5. panel_sessions (wygasłe)
if cleanup_table "panel_sessions" \
  "expires_at < NOW()" \
  "Wygasłe sesje panelu"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 6. stripe_idempotency (>5 dni)
if cleanup_table "stripe_idempotency" \
  "created_at < NOW() - interval '5 days'" \
  "Cache idempotency Stripe >5 dni"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# 7. daily_notifications_usage (>30 dni - nie 5!)
if cleanup_table "daily_notifications_usage" \
  "day < CURRENT_DATE - interval '30 days'" \
  "Liczniki dzienne >30 dni"; then
  success_count=$((success_count + 1))
else
  error_count=$((error_count + 1))
fi

# PODSUMOWANIE
log "========================================="
log "Cleanup Retention 5d - KONIEC"
log "Sukces: $success_count tabel"
log "Błędy: $error_count tabel"
if [[ "$DRY_RUN" == "1" ]]; then
  log "⚠️  To był DRY RUN - żadne dane nie zostały usunięte"
  log "💡 Uruchom z DRY_RUN=0 aby wykonać kasowanie"
fi
log "========================================="

# Exit code
if [[ $error_count -gt 0 ]]; then
  exit 1
fi

exit 0
