const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// --- Dev: carrega .env.local em process.env (para as Functions locais) ---
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(function (l) {
      if (!l || l.trimStart().startsWith('#') || !l.includes('=')) return;
      const i = l.indexOf('=');
      const k = l.slice(0, i).trim();
      if (!(k in process.env)) process.env[k] = l.slice(i + 1).trim();
    });
    console.log('[dev] .env.local carregado');
  } catch (e) { /* ignore */ }
})();

// --- Dev: roteia /api/* para as mesmas Vercel Functions (reusa lib/) ---
const API_ROUTES = {
  '/api/checkout/criar-pix': './api/checkout/criar-pix.js',
  '/api/checkout/status': './api/checkout/status.js',
  '/api/webhooks/hubpague': './api/webhooks/hubpague.js'
};
function shimRes(res) {
  if (!res.status) res.status = function (c) { res.statusCode = c; return res; };
  if (!res.json) res.json = function (o) { if (!res.headersSent) res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  return res;
}
function serveApi(pathname, req, res) {
  const file = API_ROUTES[pathname.replace(/\/$/, '')];
  if (!file) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not_found' })); return; }
  let handler;
  try { handler = require(file); } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'load_failed', detail: e.message })); return; }
  shimRes(res);
  Promise.resolve(handler(req, res)).catch(function (err) {
    console.error('[api]', err);
    if (!res.headersSent) { res.statusCode = 500; res.end(JSON.stringify({ error: 'internal' })); }
  });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.lottie': 'application/json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url).pathname);

  // Dev: Functions locais em /api/*
  if (pathname.startsWith('/api/')) { return serveApi(pathname, req, res); }

  // Raiz serve a página de oferta (acesso) sem redirecionar
  let resolvedPathname = pathname === '/' ? '/funil-2/acesso/index.html' : pathname;

  // Replica os rewrites do vercel.json para o dev local (assets carregados
  // pelo React com caminho relativo à raiz). Sem isso, /laco.webp e /lotties/*
  // dão 404 localmente e a página não carrega por completo.
  const rewrites = [
    [/^\/laco\.webp$/, '/funil-2/acesso/laco.webp'],
    [/^\/lotties\/(.*)$/, '/funil-2/acesso/lotties/$1'],
    [/^\/img\/(.*)$/, '/funil-2/acesso/img/$1'],
    [/^\/o\/pb622z43$/, '/funil-2/upsell1/index.html'],
    [/^\/o\/eaetc63e$/, '/funil-2/upsell2/index.html'],
    [/^\/o\/xi92jg6y$/, '/funil-2/upsell3/index.html'],
    [/^\/o\/x3eyn6it$/, '/funil-2/login/index.html']
  ];
  for (const [re, dest] of rewrites) {
    if (re.test(resolvedPathname)) {
      resolvedPathname = resolvedPathname.replace(re, dest);
      break;
    }
  }

  let filePath = path.join(__dirname, resolvedPathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - Página não encontrada</h1>');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Erro interno do servidor');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('\n====================================');
  console.log(`  Servidor rodando na porta ${PORT}`);
  console.log('====================================');
  console.log(`\n  Acesse: http://localhost:${PORT}`);
  console.log('\n  Pressione Ctrl+C para parar\n');
});
