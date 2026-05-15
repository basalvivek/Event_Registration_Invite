const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT     = 3000;
const BASE_DIR = path.resolve(process.cwd());

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg' : 'image/jpeg',
  '.png' : 'image/png',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function serveHtml(res) {
  serveFile(res, path.join(BASE_DIR, 'index.html'));
}

http.createServer((req, res) => {
  const urlPath  = req.url.split('?')[0];
  const ext      = path.extname(urlPath).toLowerCase();
  const filePath = path.join(BASE_DIR, urlPath);

  if (ext && MIME[ext]) {
    fs.access(filePath, fs.constants.R_OK, err => {
      if (err) { serveHtml(res); return; }
      serveFile(res, filePath);
    });
  } else {
    serveHtml(res);
  }
}).listen(PORT, () => {
  console.log(`Base dir : ${BASE_DIR}`);
  console.log(`Running  : http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
