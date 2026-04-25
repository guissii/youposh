const { Client } = require('ssh2');

const vpsPassword = process.env.VPS_SSH_PASSWORD;

if (!vpsPassword) {
    throw new Error('Missing VPS_SSH_PASSWORD environment variable');
}

const conn = new Client();
conn.on('ready', () => {
    console.log('Connexion établie. Envoi de la commande de redémarrage...');
    conn.exec('sudo reboot', (err, stream) => {
        if (err) {
            console.error('Erreur lors du redémarrage:', err);
            return;
        }
        stream.on('close', (code, signal) => {
            console.log('Le serveur redémarre (connexion fermée).');
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).connect({
    host: process.env.VPS_HOST || '84.247.184.208',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASSWORD
});
