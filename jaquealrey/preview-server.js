/**
 * Servidor de previsualizacion para instalar la PWA de escritorio.
 *
 * Sirve dist/jaquealrey/browser y redirige /api y /socket.io al back en :3000.
 * Asi environment.prod.ts puede dejar apiUrl en '/api', igual que en produccion,
 * sin depender de CORS ni de tocar la configuracion del front.
 *
 * Uso: node preview-server.js [puerto]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 5500;
const API = { host: '127.0.0.1', port: Number(process.env.API_PORT) || 3000 };
const DIST = path.join(__dirname, 'dist', 'jaquealrey', 'browser');
const INDEX = path.join(DIST, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(INDEX)) {
  console.error('[preview] Falta dist/jaquealrey/browser. Ejecuta primero: npm run build');
  process.exit(1);
}

function proxy(req, res) {
  const opciones = {
    host: API.host,
    port: API.port,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: `${API.host}:${API.port}` },
  };
  const hacia = http.request(opciones, (resp) => {
    res.writeHead(resp.statusCode, resp.headers);
    resp.pipe(res);
  });
  hacia.on('error', (err) => {
    console.error('[preview] No se pudo contactar el back:', err.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: '0', msg: 'API no disponible', data: [] }));
  });
  req.pipe(hacia);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    return proxy(req, res);
  }

  // pathname decodificado + normalizado: evita traversals con .. o %2e%2e
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('URL invalida');
    return;
  }

  const relativo = path.normalize(pathname).replace(/^([/\\])+/, '');
  const destino = path.join(DIST, relativo);

  if (!destino.startsWith(DIST)) {
    res.writeHead(403).end('Prohibido');
    return;
  }

  const enviar = (archivo, cache) => {
    const ext = path.extname(archivo).toLowerCase();
    const esHashed = /-[A-Z0-9]{8,}\.(js|css)$/i.test(archivo);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': esHashed
        ? 'public, max-age=31536000, immutable'
        : cache || 'no-cache',
    });
    fs.createReadStream(archivo).pipe(res);
  };

  // Rutas del SPA (/admin, /privacidad, ...) siempre devuelven index.html
  if (fs.existsSync(destino) && fs.statSync(destino).isFile()) {
    return enviar(destino);
  }
  enviar(INDEX);
});

server.listen(PORT, () => {
  console.log(`[preview] PWA en http://localhost:${PORT}`);
  console.log(`[preview] Admin en http://localhost:${PORT}/admin`);
  console.log(`[preview] Proxy /api y /socket.io -> ${API.host}:${API.port}`);
});
