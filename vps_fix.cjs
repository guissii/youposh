const { Client } = require('ssh2');
const fs = require('fs');

// Step-by-step: run commands one at a time, each with its own exec
const commands = [
  { label: 'STEP 1: Find top CPU process', cmd: 'ps -eo pid,comm,pcpu --sort=-pcpu | head -n 5' },
  { label: 'STEP 2: Kill all miners', cmd: 'killall -9 hawsjhnort 2>/dev/null; killall -9 mingetty 2>/dev/null; pkill -9 -f mm_percpu_wq 2>/dev/null; pkill -9 -f xmrig 2>/dev/null; pkill -9 -f kdevtmpfsi 2>/dev/null; pkill -9 -f kinsing 2>/dev/null; echo "Known miners killed"' },
  { label: 'STEP 3: Kill high CPU non-essential', cmd: "ps -eo pid,comm,pcpu --sort=-pcpu | awk 'NR>1 && $3+0>80.0 && $2!~/node/ && $2!~/postgres/ && $2!~/nginx/ && $2!~/pm2/ && $2!~/sshd/ {print $1}' | xargs -r kill -9 2>/dev/null; echo 'High CPU processes killed'" },
  { label: 'STEP 4: Clean crontab', cmd: 'crontab -r 2>/dev/null; echo "Crontab cleared"' },
  { label: 'STEP 5: Remove malware files', cmd: 'rm -f /usr/bin/hawsjhnort /sbin/mingetty /usr/bin/mingetty 2>/dev/null; rm -rf /tmp/.* /tmp/* 2>/dev/null; echo "Malware files removed"' },
  { label: 'STEP 6: Restart services', cmd: 'pm2 restart all 2>/dev/null && systemctl restart nginx 2>/dev/null; echo "Services restarted"' },
  { label: 'STEP 7: Verify CPU', cmd: 'sleep 2 && ps -eo pid,comm,pcpu --sort=-pcpu | head -n 10' },
  { label: 'STEP 8: Load average', cmd: 'cat /proc/loadavg' },
  { label: 'STEP 9: Check for remaining suspicious', cmd: 'ps aux | grep -iE "miner|hawsjhnort|mingetty|mm_percpu|crypto|xmrig|kdevtmpfsi|kinsing" | grep -v grep || echo "No suspicious processes found"' },
];

const conn = new Client();
let results = '';
let idx = 0;

function runNext() {
  if (idx >= commands.length) {
    fs.writeFileSync('vps_fix_result.txt', results, 'utf8');
    console.log('\n=== ALL DONE ===');
    console.log(results);
    conn.end();
    return;
  }
  const { label, cmd } = commands[idx];
  console.log(`\n>>> ${label}...`);
  results += `\n--- ${label} ---\n`;
  
  conn.exec(cmd, { pty: false }, (err, stream) => {
    if (err) {
      results += `ERROR: ${err.message}\n`;
      idx++;
      runNext();
      return;
    }
    let out = '';
    stream.on('close', () => {
      results += out + '\n';
      console.log(out);
      idx++;
      runNext();
    }).on('data', (d) => {
      out += d.toString();
    });
    stream.stderr.on('data', (d) => {
      out += d.toString();
    });
  });
}

conn.on('ready', () => {
  console.log('✅ Connected to VPS! Starting cleanup...');
  results += '=== VPS CLEANUP STARTED ===\n';
  runNext();
}).on('error', (err) => {
  console.error('❌ Connection error:', err.message);
}).connect({
  host: '84.247.184.208',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/MSI/Desktop/vps_ssh_key', 'utf8'),
  readyTimeout: 30000,
  keepaliveInterval: 5000,
});
