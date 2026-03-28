const { Client } = require('ssh2');
const fs = require('fs');

const commands = [
  // STEP 1: Kill ALL miner processes aggressively
  { label: 'KILL all miner processes', cmd: 'kill -9 31057 2>/dev/null; killall -9 shzwnqkzby nlqstnawgt xxjgrjulyg frodubycza qmhjjgfqhf clemxaynty rczlxqeprc umbrvnnnzw 2>/dev/null; ps -eo pid,pcpu,comm --sort=-pcpu | awk "NR>1 && \\$2+0>50 && \\$3!~/node/ && \\$3!~/postgres/ && \\$3!~/nginx/ && \\$3!~/pm2/ && \\$3!~/sshd/ && \\$3!~/ps/ {print \\$1}" | xargs -r kill -9 2>/dev/null; echo "All miners killed"' },
  
  // STEP 2: Delete init.d malware scripts
  { label: 'DELETE /etc/init.d malware', cmd: 'rm -f /etc/init.d/shzwnqkzby /etc/init.d/nlqstnawgt /etc/init.d/xxjgrjulyg /etc/init.d/frodubycza; ls /etc/init.d/ | while read f; do SIZE=$(stat -c%s "/etc/init.d/$f" 2>/dev/null); if [ "$SIZE" = "323" ]; then echo "Deleting suspicious init.d/$f (323 bytes)"; rm -f "/etc/init.d/$f"; fi; done; echo "init.d cleaned"' },

  // STEP 3: Delete /usr/bin malware binaries  
  { label: 'DELETE /usr/bin malware', cmd: 'rm -f /usr/bin/shzwnqkzby /usr/bin/qmhjjgfqhf /usr/bin/clemxaynty /usr/bin/rczlxqeprc /usr/bin/nlqstnawgt /usr/bin/xxjgrjulyg /usr/bin/frodubycza /usr/bin/umbrvnnnzw /usr/bin/hawsjhnort; echo "Binaries deleted"' },

  // STEP 4: Remove any systemd service links for malware
  { label: 'DISABLE malware systemd links', cmd: 'for svc in shzwnqkzby nlqstnawgt xxjgrjulyg frodubycza qmhjjgfqhf clemxaynty rczlxqeprc umbrvnnnzw; do systemctl stop $svc 2>/dev/null; systemctl disable $svc 2>/dev/null; rm -f /etc/systemd/system/$svc.service 2>/dev/null; rm -f /etc/systemd/system/multi-user.target.wants/$svc.service 2>/dev/null; done; echo "Systemd cleaned"' },

  // STEP 5: Check suspicious systemd services (YDService, tat_agent, aegis)
  { label: 'CHECK suspicious systemd services', cmd: 'echo "=== YDService ===" && systemctl cat YDService.service 2>&1 | head -5 && echo "=== tat_agent ===" && systemctl cat tat_agent.service 2>&1 | head -5 && echo "=== aegis ===" && systemctl cat aegis.service 2>&1 | head -5' },

  // STEP 6: Block miner C2 server IP
  { label: 'BLOCK miner C2 IP 141.98.10.115', cmd: 'iptables -A OUTPUT -d 141.98.10.115 -j DROP 2>/dev/null; ufw deny out to 141.98.10.115 2>/dev/null; echo "C2 IP blocked"' },

  // STEP 7: Kill any remaining deleted-binary processes
  { label: 'KILL deleted-binary processes', cmd: 'ls -la /proc/*/exe 2>/dev/null | grep deleted | grep -v "node\\|nginx\\|postgres" | awk -F/ "{print \\$3}" | xargs -r kill -9 2>/dev/null; echo "Deleted-exe processes killed"' },

  // STEP 8: Clean /tmp and temporary dirs
  { label: 'CLEAN temp directories', cmd: 'rm -rf /tmp/.* /tmp/* 2>/dev/null; echo "Temp cleaned"' },

  // STEP 9: Update systemd and restart services
  { label: 'RELOAD systemd and restart services', cmd: 'systemctl daemon-reload && pm2 restart all 2>/dev/null && systemctl restart nginx 2>/dev/null; echo "Services restarted"' },

  // STEP 10: Final verification
  { label: 'VERIFY - Wait and check CPU', cmd: 'sleep 5 && ps -eo pid,comm,pcpu --sort=-pcpu | head -n 10' },
  { label: 'VERIFY - Load average', cmd: 'cat /proc/loadavg' },
  { label: 'VERIFY - Check init.d is clean', cmd: 'ls -la /etc/init.d/ | head -15' },
  { label: 'VERIFY - No more suspicious in /usr/bin', cmd: 'find /usr/bin -maxdepth 1 -size 323c -type f 2>/dev/null || echo "No suspicious files found"' },
  { label: 'VERIFY - No deleted exe processes', cmd: 'ls -la /proc/*/exe 2>/dev/null | grep deleted | grep -v "node\\|nginx\\|postgres" || echo "No deleted-exe processes"' },
  { label: 'VERIFY - No miner network connections', cmd: 'ss -tnp | grep 141.98 || echo "No miner connections"' },
];

const conn = new Client();
let results = '';
let idx = 0;

function runNext() {
  if (idx >= commands.length) {
    fs.writeFileSync('vps_nuke_result.txt', results, 'utf8');
    console.log('\n=== NUCLEAR CLEANUP COMPLETE ===');
    conn.end();
    return;
  }
  const { label, cmd } = commands[idx];
  results += `\n--- ${label} ---\n`;
  conn.exec(cmd, (err, stream) => {
    if (err) { results += `ERROR: ${err.message}\n`; idx++; runNext(); return; }
    let out = '';
    stream.on('close', () => {
      results += out + '\n';
      console.log(`[${idx+1}/${commands.length}] ${label}: ${out.trim().substring(0, 100)}`);
      idx++; runNext();
    }).on('data', (d) => { out += d.toString(); });
    stream.stderr.on('data', (d) => { out += d.toString(); });
  });
}

conn.on('ready', () => {
  console.log('🔥 Connected! NUCLEAR CLEANUP starting...');
  runNext();
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '84.247.184.208', port: 22, username: 'root',
  privateKey: fs.readFileSync('C:/Users/MSI/Desktop/vps_ssh_key', 'utf8'),
  readyTimeout: 30000, keepaliveInterval: 5000,
});
