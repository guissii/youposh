#!/bin/bash
echo "=== 1. CURRENT CPU HUNGRY PROCESSES ==="
ps -eo pid,cmd,%cpu --sort=-%cpu | head -n 10

echo "=== 2. CHECKING ROOT CRONTAB ==="
crontab -l 2>/dev/null || echo "No root crontab"

echo "=== 3. CHECKING SYSTEM CRON FILES ==="
cat /etc/crontab
ls -la /etc/cron.d/
cat /var/spool/cron/crontabs/root 2>/dev/null

echo "=== 4. CHECKING AUTHORIZED_KEYS ==="
cat /root/.ssh/authorized_keys

echo "=== 5. CHECKING RECENT SYSTEMD SERVICES ==="
find /etc/systemd/system -type f -mtime -30 | grep -v "multi-user.target.wants"

echo "=== 6. CHECKING NETWORK CONNECTIONS (MINER POOLS) ==="
netstat -tulpn | grep -E "ESTABLISHED|LISTEN" | head -n 20
