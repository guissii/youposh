const { Client } = require('ssh2');
const fs = require('fs');

const commands = [
  'echo "===TOP_CPU===" && ps -eo pid,comm,pcpu --sort=-pcpu | head -n 20',
  'echo "===LOAD===" && cat /proc/loadavg',
  'echo "===PM2===" && pm2 jlist 2>/dev/null | head -c 2000',
  'echo "===CRONTAB===" && crontab -l 2>&1',
  'echo "===SUSPICIOUS===" && ps aux | grep -iE "miner|hawsjhnort|mingetty|mm_percpu|crypto|xmrig|kdevtmpfsi|kinsing" | grep -v grep',
  'echo "===HIGH_CPU===" && ps -eo pid,comm,pcpu --sort=-pcpu | awk "NR>1 && $3+0>10.0"',
  'echo "===SYSTEMD_SUSPECT===" && systemctl list-units --type=service --state=running | grep -ivE "ssh|nginx|postgresql|pm2|fail2ban|ufw|system|network|cron|dbus|login|journal|snap|cloud|rsyslog|unattended" || true',
  'echo "===UPTIME===" && uptime',
  'echo "===MEMORY===" && free -h'
];

const fullCmd = commands.join(' && ');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS, running diagnostics...');
  conn.exec(fullCmd, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }
    let out = '';
    let errOut = '';
    stream.on('close', (code) => {
      fs.writeFileSync('vps_diag_result.txt', out + '\n---STDERR---\n' + errOut, 'utf8');
      console.log('Diagnostics saved to vps_diag_result.txt');
      console.log(out);
      conn.end();
    }).on('data', (d) => {
      out += d.toString();
    });
    stream.stderr.on('data', (d) => {
      errOut += d.toString();
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '84.247.184.208',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/MSI/Desktop/vps_ssh_key', 'utf8')
});
