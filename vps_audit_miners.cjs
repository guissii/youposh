const { Client } = require('ssh2');
const fs = require('fs');

const privateKey = fs.readFileSync('C:\\Users\\MSI\\Desktop\\vps_ssh_key', 'utf8');
const conn = new Client();

conn.on('ready', () => {
  console.log('Client ready, running deep security audit...');
  
  const commands = [
    'echo "=== 1. ACTIVE CONNECTIONS (ESTABLISHED) ==="',
    'ss -tupna | grep ESTAB',
    
    'echo "\\n=== 2. EXECUTABLES IN TEMP DIRS (/tmp, /var/tmp, /dev/shm) ==="',
    'find /tmp /var/tmp /dev/shm -type f -executable 2>/dev/null',
    
    'echo "\\n=== 3. CHECKING SSH KEYS ==="',
    'cat /root/.ssh/authorized_keys',
    
    'echo "\\n=== 4. CHECKING FOR ROOTKITS (LD_PRELOAD) ==="',
    'cat /etc/ld.so.preload 2>/dev/null || echo "No ld.so.preload found (Good)"',
    
    'echo "\\n=== 5. CHECKING SUSPICIOUS SYSTEMD SERVICES ==="',
    'grep -lR -iE "xmrig|kinsing|kdevtmpfsi|minerd|monero|c3pool|hashvault" /etc/systemd/system/ 2>/dev/null || echo "No suspicious systemd services found"',
    
    'echo "\\n=== 6. CHECKING CRONTAB ==="',
    'cat /etc/crontab 2>/dev/null',
    
    'echo "\\n=== 7. CHECKING COMMON MINER PATHS ==="',
    'ls -la /opt/ /usr/local/bin/ /root/ 2>/dev/null | grep -iE "xmrig|kinsing|kdevtmpfsi|sysupdate|networkservice"',
    
    'echo "\\n=== 8. TOP PROCESSES ==="',
    'ps -eo pid,user,cmd,%cpu,%mem --sort=-%cpu | head -n 10'
  ];

  conn.exec(commands.join(' ; '), (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\\n--- Audit completed with code ' + code + ' ---');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write('ERROR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '84.247.184.208',
  port: 22,
  username: 'root',
  privateKey: privateKey
});
