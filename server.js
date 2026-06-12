const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

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

// Barra de navegação injetada apenas no servidor local (não vai para produção)
const DEV_BAR = `
<style>
  #dev-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 2147483647;
    background: #1a1a2e; color: #fff; font-family: monospace; font-size: 12px;
    display: flex; align-items: center; gap: 6px; padding: 6px 10px;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.5); flex-wrap: wrap;
  }
  #dev-bar span { color: #888; margin-right: 4px; }
  #dev-bar a {
    background: #16213e; color: #e0e0e0; text-decoration: none;
    padding: 4px 8px; border-radius: 4px; border: 1px solid #333;
    white-space: nowrap;
  }
  #dev-bar a:hover { background: #0f3460; border-color: #e94560; }
  #dev-bar a.current { background: #e94560; color: #fff; border-color: #e94560; }
  #dev-bar button {
    background: #58B947; color: #fff; border: none; padding: 4px 10px;
    border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;
    margin-left: auto;
  }
  #dev-bar button:hover { background: #46a337; }
</style>
<div id="dev-bar">
  <span>DEV:</span>
  <a href="/?nodelay=true" id="nav-acesso">Acesso (front)</a>
  <a href="/funil-2/back1/?nodelay=true" id="nav-back1">Back 1</a>
  <a href="/funil-2/back2/?nodelay=true" id="nav-back2">Back 2</a>
  <a href="/funil-2/upsell1/?nodelay=true" id="nav-upsell1">Upsell 1</a>
  <a href="/funil-2/dws1/?nodelay=true" id="nav-dws1">Downsell</a>
  <a href="/funil-2/upsell2/?nodelay=true" id="nav-upsell2">Upsell 2</a>
  <a href="/funil-2/upsell3/?nodelay=true" id="nav-upsell3">Upsell 3</a>
  <a href="/login/?nodelay=true" id="nav-login">Login</a>
  <button onclick="skipVideo()">⏩ Pular Vídeo</button>
</div>
<script>
(function() {
  // Marca a página atual na barra
  var p = window.location.pathname;
  var map = {
    '/': 'nav-acesso', '/funil-2/acesso/': 'nav-acesso',
    '/funil-2/back1/': 'nav-back1', '/funil-2/back2/': 'nav-back2',
    '/funil-2/upsell1/': 'nav-upsell1', '/funil-2/dws1/': 'nav-dws1',
    '/funil-2/upsell2/': 'nav-upsell2', '/funil-2/upsell3/': 'nav-upsell3',
    '/login/': 'nav-login'
  };
  var id = map[p];
  if (id) { var el = document.getElementById(id); if (el) el.classList.add('current'); }
})();

function skipVideo() {
  // Dispara o parâmetro nodelay via URL se ainda não estiver
  if (!window.location.search.includes('nodelay=true')) {
    var sep = window.location.search ? '&' : '?';
    window.location.href = window.location.pathname + window.location.search + sep + 'nodelay=true';
    return;
  }
  // Tenta avançar o player vturb para o fim
  var player = document.querySelector('vturb-smartplayer');
  if (player && player.currentTime !== undefined) {
    try { player.currentTime = player.duration || 99999; } catch(e) {}
  }
  // Força exibir todos os elementos ocultos pela VSL
  document.querySelectorAll('[style*="display:none"], [style*="display: none"]').forEach(function(el) {
    el.style.display = '';
  });
  document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(function(el) {
    if (!el.closest('#dev-bar')) el.style.opacity = '1';
  });
  // Recarrega com nodelay=true para ativar o modo nativo da página
  window.location.href = window.location.pathname + '?nodelay=true';
}
</script>
`;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname);

  // Raiz serve a página de oferta (acesso) sem redirecionar
  const resolvedPathname = pathname === '/' ? '/funil-2/acesso/index.html' : pathname;

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

    // Injeta a barra de dev apenas em páginas HTML
    if (ext === '.html') {
      let html = content.toString('utf-8');
      html = html.replace('</body>', DEV_BAR + '</body>');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(html);
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
  console.log(`  Oferta: http://localhost:${PORT}/?nodelay=true`);
  console.log('\n  Pressione Ctrl+C para parar\n');
});
