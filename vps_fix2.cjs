const { Client } = require('ssh2');
const fs = require('fs');

const commands = [
  { label: 'KILL umbrvnnnzw miner (PID 733)', cmd: 'kill -9 733 2>/dev/null; killall -9 umbrvnnnzw 2>/dev/null; echo "Killed umbrvnnnzw"' },
  { label: 'KILL mingetty', cmd: 'kill -9 31481 2>/dev/null; killall -9 mingetty 2>/dev/null; echo "Killed mingetty"' },
  { label: 'Find miner binary location', cmd: 'find / -name "umbrvnnnzw" -o -name "mingetty" 2>/dev/null | head -20' },
  { label: 'Check /usr/bin for suspicious', cmd: 'ls -la /usr/bin/umbrvnnnzw /sbin/mingetty /usr/bin/mingetty /usr/bin/hawsjhnort 2>&1' },
  { label: 'Delete miner binaries', cmd: 'rm -f /usr/bin/umbrvnnnzw /sbin/umbrvnnnzw /tmp/umbrvnnnzw /sbin/mingetty /usr/bin/mingetty /usr/bin/hawsjhnort 2>/dev/null; echo "Binaries deleted"' },
  { label: 'Check systemd for persistence', cmd: 'systemctl list-units --type=service --state=running --no-pager | grep -ivE "ssh|nginx|postgresql|pm2|fail2ban|ufw|system|network|cron|dbus|login|journal|snap|cloud|rsyslog|unattended|fwupd|polkit|certbot|accounts|multipathd|ModemManager|packagekit|udisks|thermald|avahi" || echo "No suspicious services"' },
  { label: 'Check systemd timers', cmd: 'systemctl list-timers --no-pager 2>/dev/null | head -20' },
  { label: 'Check ALL crontabs', cmd: 'for user in $(cut -f1 -d: /etc/passwd); do echo "==$user=="; crontab -u $user -l 2>&1; done' },
  { label: 'Check /etc/cron.d', cmd: 'ls -la /etc/cron.d/ && cat /etc/cron.d/* 2>/dev/null' },
  { label: 'Check rc.local', cmd: 'cat /etc/rc.local 2>/dev/null || echo "No rc.local"' },
  { label: 'Check /root/.bashrc for malware', cmd: 'tail -20 /root/.bashrc' },
  { label: 'Check /root/.profile for malware', cmd: 'tail -20 /root/.profile 2>/dev/null' },
  { label: 'Check known malware dirs', cmd: 'ls -la /var/tmp/ /dev/shm/ 2>/dev/null | head -30' },
  { label: 'VERIFY CPU after cleanup', cmd: 'sleep 3 && ps -eo pid,comm,pcpu --sort=-pcpu | head -n 10' },
  { label: 'LOAD AVERAGE', cmd: 'cat /proc/loadavg' },
];

const conn = new Client();
let results = '';
let idx = 0;

function runNext() {
  if (idx >= commands.length) {
    fs.writeFileSync('vps_fix2_result.txt', results, 'utf8');
    console.log('\n=== ALL DONE ===');
    conn.end();
    return;
  }
  const { label, cmd } = commands[idx];
  results += `\n--- ${label} ---\n`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      results += `ERROR: ${err.message}\n`;
      idx++;
      runNext();
      return;
    }
    let out = '';
    stream.on('close', () => {
      results += out + '\n';
      console.log(`[${idx+1}/${commands.length}] ${label}: ${out.trim().substring(0, 80)}`);
      idx++;
      runNext();
    }).on('data', (d) => { out += d.toString(); });
    stream.stderr.on('data', (d) => { out += d.toString(); });
  });
}

conn.on('ready', () => {
  console.log('Connected! Deep cleanup starting...');
  runNext();
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '84.247.184.208',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/MSI/Desktop/vps_ssh_key', 'utf8'),
  readyTimeout: 30000,
  keepaliveInterval: 5000,
});
