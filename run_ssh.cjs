const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(process.argv[2] || 'uptime', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '84.247.184.208',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\MSI\\Desktop\\vps_ssh_key', 'utf8')
});
