const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    const cmd = `sed -i 's/# gzip_vary on;/gzip_vary on;/' /etc/nginx/nginx.conf && ` +
                `sed -i 's/# gzip_proxied any;/gzip_proxied any;/' /etc/nginx/nginx.conf && ` +
                `sed -i 's/# gzip_comp_level 6;/gzip_comp_level 6;/' /etc/nginx/nginx.conf && ` +
                `sed -i 's/# gzip_buffers 16 8k;/gzip_buffers 16 8k;/' /etc/nginx/nginx.conf && ` +
                `sed -i 's/# gzip_http_version 1.1;/gzip_http_version 1.1;/' /etc/nginx/nginx.conf && ` +
                `sed -i 's/# gzip_types/gzip_types/' /etc/nginx/nginx.conf && ` +
                `systemctl reload nginx && echo "GZIP Optimised successfully"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
            console.log('Process completed with code', code);
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
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
