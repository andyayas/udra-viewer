// `npm start`: packs screen/, serves it on the local network with live reload, and starts Expo.
// While this runs, the app on the phone loads the screen from here, so saving a file in screen/ reloads it instantly.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const pack = require('./pack');

const WEB = path.join(__dirname, '..', 'screen');
const PORT = Number(process.env.UDRA_WEB_PORT || 8090);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
const RELOAD = '\n<script>try{new EventSource("/__reload").onmessage=function(){location.reload()}}catch(e){}</script>\n';
const crypto = require('crypto');
// The model files' version (names, sizes, modification times): index.html adds it to the model URLs so the phone never
// mixes new model files with cached old ones.
const modelVersion = () => {
  const dir = path.join(WEB, 'model'), h = crypto.createHash('sha1');
  for (const f of fs.readdirSync(dir).sort()) { const st = fs.statSync(path.join(dir, f)); h.update(f + ':' + st.size + ':' + st.mtimeMs + ';'); }
  return h.digest('hex').slice(0, 12);
};

pack();

const clients = new Set();
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/__ping') { res.writeHead(200, { 'Access-Control-Allow-Origin': '*' }); return res.end('udra'); }
  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': hi\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.join(WEB, rel);
  if (!file.startsWith(WEB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  // Model files (several MB) revalidate on every load: unchanged ones answer with a cheap 304.
  if (rel.startsWith('model/')) {
    const st = fs.statSync(file), etag = '"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' }); return res.end(); }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', ETag: etag });
    return res.end(fs.readFileSync(file));
  }
  let body = fs.readFileSync(file);
  if (rel === 'index.html') body = Buffer.from(body.toString('utf8').replace('<head>', '<head>\n<script>window.__udraModelVersion="' + modelVersion() + '";</script>').replace('</body>', RELOAD + '</body>'));
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
});
server.listen(PORT, '0.0.0.0', () => console.log(`\nUDRA screen served on port ${PORT}. Edits in screen/ reload the phone.\n`));

let timer = null;
fs.watch(WEB, { recursive: true }, (evt, name) => {
  if (!name || name.startsWith('.')) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { pack(); } catch (e) { console.warn('pack failed:', e.message); }
    for (const c of clients) c.write('data: reload\n\n');
    console.log('screen/' + name.replace(/\\/g, '/') + ' changed, reloading the phone');
  }, 150);
});

const expo = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], { stdio: 'inherit', shell: process.platform === 'win32' });
expo.on('exit', (code) => { server.close(); process.exit(code || 0); });
process.on('SIGINT', () => { expo.kill('SIGINT'); });
