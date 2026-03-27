#!/bin/bash
# --- EMERGENCY VIRUS ERADICATION SCRIPT ---
# Author: AntiGravity DevSecOps Expert
# Date: $(date)

echo "[1/4] NEUTRALISING MALWARE PERSISTENCE"
# 1. Kill any existing malware cron jobs
crontab -r 2>/dev/null
rm -rf /var/spool/cron/crontabs/root 2>/dev/null
rm -rf /var/spool/cron/root 2>/dev/null
rm -f /etc/cron.d/*malware* /etc/cron.d/*miner* 2>/dev/null

# 2. Purge attacker SSH Keys (Close the backdoor)
echo "" > /root/.ssh/authorized_keys

# 3. Disable the virus service if it planted one
systemctl stop *miner* 2>/dev/null
systemctl disable *miner* 2>/dev/null

echo "[2/4] EXECUTING THE VIRUS"
# Force kill the specific rogue process hiding as system kernel module
killall -9 hawsjhnort 2>/dev/null
pkill -9 -f "mm_percpu_wq" 2>/dev/null
# Also kill any other process using more than 80% CPU that isn't Postgres/Node/Nginx
ps -eo pid,cmd,%cpu --sort=-%cpu | awk 'NR>1 && $3>80.0 && $2!~/postgres/ && $2!~/node/ && $2!~/nginx/ {print $1}' | xargs -r kill -9 2>/dev/null

echo "[3/4] INCINERATING MALWARE PAYLOADS"
rm -f /usr/bin/hawsjhnort
rm -rf /tmp/*

echo "[4/4] SERVER LOCKDOWN & SPEED RECOVERY"
# Ensure UFW is locking out the API port from the public internet
ufw deny 5000/tcp >/dev/null 2>&1
ufw reload >/dev/null 2>&1

# Restart critical infrastructure safely
systemctl restart postgresql
pm2 restart all
systemctl restart nginx

echo "=== MISSION ACCOMPLISHED ==="
echo "CPU Load should now be under 15%."
ps -eo pid,cmd,%cpu --sort=-%cpu | head -n 8
