#!/bin/bash
# 1. Kill the miner process
kill -9 143876

# 2. Prevent it from restarting
rm -f /usr/bin/hawsjhnort

# 3. Check for any systemd services that might have triggered it
echo "--- CHECKING SYSTEMD FOR MINER ---"
grep -rn "hawsjhnort" /etc/systemd/system/ /lib/systemd/system/

# 4. Check for cron jobs again
echo "--- CHECKING CRON ---"
ls -la /etc/cron.* /var/spool/cron/crontabs

# 5. Show current CPU after killing
echo "--- CPU AFTER KILL ---"
sleep 2
ps -eo pid,cmd,%cpu --sort=-%cpu | head -n 10
