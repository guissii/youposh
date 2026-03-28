const { Client } = require('ssh2');
const fs = require('fs');

const commands = [
  // FIND THE ROOT CAUSE - trace parent process
  { label: 'Find miner PID and parent', cmd: 'ps -eo pid,ppid,user,pcpu,comm --sort=-pcpu | head -n 5' },
  { label: 'Full process tree of top CPU', cmd: 'ps -eo pid,ppid,pcpu,args --sort=-pcpu | head -n 3 | tail -1 | awk "{print \\$1}" | xargs -I{} pstree -spalng {} 2>/dev/null || echo "pstree not available"' },
  { label: 'Parent PID details', cmd: 'MINER_PID=$(ps -eo pid,pcpu --sort=-pcpu | awk "NR==2{print \\$1}"); PPID=$(ps -o ppid= -p $MINER_PID 2>/dev/null); echo "Miner PID: $MINER_PID, Parent PID: $PPID"; ps -p $PPID -o pid,ppid,cmd 2>/dev/null' },
  { label: 'Check /dev/shm contents', cmd: 'ls -la /dev/shm/ && file /dev/shm/* 2>/dev/null && cat /dev/shm/* 2>/dev/null | head -c 500' },
  { label: 'Check /var/tmp contents', cmd: 'ls -laR /var/tmp/ 2>/dev/null | head -30' },
  { label: 'Check getty service', cmd: 'systemctl cat getty@tty1.service 2>/dev/null | head -30' },
  { label: 'Check mingetty override', cmd: 'which mingetty 2>/dev/null; file /sbin/mingetty 2>/dev/null; ls -la /sbin/mingetty 2>/dev/null; md5sum /sbin/mingetty 2>/dev/null' },
  { label: 'Check systemd overrides', cmd: 'find /etc/systemd/ -name "*.service" -newer /etc/hostname 2>/dev/null | head -10' },
  { label: 'Check LD_PRELOAD hijack', cmd: 'cat /etc/ld.so.preload 2>/dev/null || echo "No ld.so.preload"; echo "---"; env | grep -i preload 2>/dev/null || echo "No PRELOAD env"' },
  { label: 'Check /etc/init.d', cmd: 'ls -lt /etc/init.d/ | head -10' },
  { label: 'Recent modified files in /usr', cmd: 'find /usr/bin /usr/sbin /usr/local/bin -mtime -7 -type f 2>/dev/null | head -20' },
  { label: 'Check for hidden processes', cmd: 'ls -la /proc/*/exe 2>/dev/null | grep deleted | head -10' },
  { label: 'Network connections from miner', cmd: 'ss -tnp | grep -v "node\\|nginx\\|postgres\\|sshd\\|pm2" | head -15' },
];

const conn = new Client();
let results = '';
let idx = 0;

function runNext() {
  if (idx >= commands.length) {
    fs.writeFileSync('vps_rootcause.txt', results, 'utf8');
    console.log('\n=== INVESTIGATION COMPLETE ===');
    conn.end();
    return;
  }
  const { label, cmd } = commands[idx];
  results += `\n--- ${label} ---\n`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      results += `ERROR: ${err.message}\n`;
      idx++; runNext(); return;
    }
    let out = '';
    stream.on('close', () => {
      results += out + '\n';
      console.log(`[${idx+1}/${commands.length}] ${label}`);
      idx++; runNext();
    }).on('data', (d) => { out += d.toString(); });
    stream.stderr.on('data', (d) => { out += d.toString(); });
  });
}

conn.on('ready', () => {
  console.log('Connected! Investigating root cause...');
  runNext();
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '84.247.184.208', port: 22, username: 'root',
  privateKey: fs.readFileSync('C:/Users/MSI/Desktop/vps_ssh_key', 'utf8'),
  readyTimeout: 30000, keepaliveInterval: 5000,
});
