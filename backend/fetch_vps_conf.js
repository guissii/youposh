const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec('cat /etc/nginx/sites-available/api.youposhmaroc.com && echo "---SEPARATOR---" && cat /etc/nginx/nginx.conf && echo "---SEPARATOR---" && htop -b -n 1 | head -n 20', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
            const fs = require('fs');
            fs.writeFileSync('vps_config.txt', output);
            console.log('Output saved to vps_config.txt');
        }).on('data', (data) => {
            output += data;
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).connect({
    host: '84.247.184.208',
    port: 22,
    username: 'root',
    password: 'Abc12345!'
});
