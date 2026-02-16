#!/bin/bash
# cleanup-retention-5d.sh - Wrapper dla cron
# Instalacja: dodaj do /etc/cron.d/cleanup-retention-5d

cd /opt/findyourdeal || exit 1

# Produkcja: kasuj dane >5 dni
DRY_RUN=0 /opt/findyourdeal/scripts/cleanup_retention_5d.sh >> /var/log/cleanup_retention_5d.log 2>&1

exit $?
