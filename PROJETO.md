# Cash No Pix — Documentação Completa do Projeto

## Visão Geral

Site de funil de vendas chamado **Cash No Pix** (cashnopixbr.site), hospedado na Vercel, com repositório no GitHub em `assombradev/mycapix`. É um export estático de uma aplicação Next.js com `assetPrefix: "/funil-2"`.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (export estático) + React + Tailwind |
| Animações | Lottie (`.lottie` e `.json`) via DotLottie |
| Vídeos | Vturb / Converteai (VSL player) |
| Tracking | Meta Pixel, Utmify, Kwai Pixel |
| Servidor local | Node.js (server.js) — apenas para dev |
| Hospedagem | Vercel (static site, framework = Other) |
| Repositório | https://github.com/assombradev/mycapix |
| Domínio | https://cashnopixbr.site |

---

## Estrutura de Pastas

```
ofertacashnopix/
├── antidebug.js          ← proteção anti-clonagem (todas as páginas)
├── server.js             ← servidor local para npm run dev (porta 3000)
├── package.json          ← scripts: dev e start
├── vercel.json           ← config Vercel: rewrites e cache headers
├── .gitignore
├── PROJETO.md            ← este arquivo
├── favicon.ico
├── public_html.zip       ← arquivo original (gitignored, não vai ao GitHub)
├── funil-2/              ← FUNIL PRINCIPAL (Next.js export)
│   ├── _next/            ← chunks JS/CSS compartilhados do Next.js
│   │   └── static/
│   │       ├── chunks/   ← webpack, react, páginas compiladas
│   │       ├── css/      ← CSS global
│   │       └── fonts/
│   ├── acesso/           ← FRONT (página de oferta principal)
│   ├── upsell1/          ← Upsell 1
│   ├── upsell2/          ← Upsell 2
│   ├── upsell3/          ← Upsell 3
│   ├── back1/            ← Back redirect 1 (saída do acesso)
│   ├── back2/            ← Back redirect 2 (saída do back1)
│   ├── dws1/             ← Downsell do upsell1
│   ├── login/            ← Tela de acesso ao produto (última etapa)
│   ├── lotties/          ← Animações compartilhadas
│   ├── sound/            ← Áudios (cashing.mp3, success.mp3)
│   └── funil-2/          ← Artefatos do build Next.js (não é uma página)
└── login/                ← Páginas antigas (legado Hostinger, não em uso ativo)
```

---

## Fluxo do Funil

```
cashnopixbr.site/   →   acesso  (front — oferta principal R$37)
                              ↕ back redirect
                           back1
                              ↕ back redirect
                           back2

acesso (compra) →  upsell1  (1º upsell)
                       ↕ downsell
                      dws1

upsell1 (compra) →  upsell2  (2º upsell)

upsell2 (compra) →  upsell3  (3º upsell)

upsell3 (compra) →  login    (tela de acesso ao produto)
```

---

## Checkouts Configurados

| Página | UUID do checkout | Plataforma |
|---|---|---|
| acesso | via JS interno (R$37) | app.cashnopixbr.site |
| upsell1 | `f0693a31-1899-44a6-884b-0ade888a4094` | app.cashnopixbr.site |
| upsell2 | `e2f97f2c-fcae-4173-bdd5-70e387df61d5` | app.cashnopixbr.site |
| upsell3 | `f9c1c12b-031b-4dd8-bd37-d6c51659005a` (principal) | app.cashnopixbr.site |
| back2 | `0bd228f3-c1b7-4ca6-828a-0749e222f4ec` | app.cashnopixbr.site |
| dws1 | `f9e233c8-32d3-4e73-8176-6a6065e86cb8` | app.cashnopixbr.site |

---

## Pixels de Rastreamento

| Plataforma | ID |
|---|---|
| Meta Pixel (principal) | `1039380481627093` |
| Utmify Pixel 1 | `69083169bcebef921e6ed8a1` |
| Utmify Pixel 2 | `69128d2ba9ec6c562f2ceb38` |
| Kwai Pixel | `690ab0af41847a838d969a7b` |

---

## Vídeos VSL (Vturb / Converteai)

Há duas VSLs na página `acesso`:

| ID do Player | Tempo do botão (segundos) |
|---|---|
| `vid-6a2c7a3cc24e5836ece8e8ac` | 769s (~12min) |
| `vid-6a2c79064eb77420ee4aec07` | 355s (~6min) |

**Dica dev:** adicione `?nodelay=true` na URL para mostrar os botões imediatamente sem assistir o vídeo. Está programado nativamente no código da página.

---

## Vercel — vercel.json

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/laco.webp",      "destination": "/funil-2/acesso/laco.webp" },
    { "source": "/lotties/:path*", "destination": "/funil-2/acesso/lotties/:path*" },
    { "source": "/img/:path*",     "destination": "/funil-2/acesso/img/:path*" },
    { "source": "/",               "destination": "/funil-2/acesso/index.html" }
  ],
  "headers": [
    { "source": "/(.*)",       "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*)\\.html","headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
  ]
}
```

**Por que esses rewrites existem:**
- A raiz `/` serve `acesso/index.html` sem mostrar slug na URL
- `laco.webp`, `lotties/` e `img/` são carregados pelo React com caminhos relativos à raiz — os rewrites os mapeiam para a pasta correta em `funil-2/acesso/`

---

## Servidor Local (npm run dev)

```bash
npm run dev
# Acesse: http://localhost:3000
```

O `server.js` serve estáticos da raiz do projeto na porta 3000. A raiz `/` serve `funil-2/acesso/index.html` diretamente (sem redirect, mantendo URL limpa).

**Para matar a porta 3000 se travar:**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Anti-Clonagem (antidebug.js)

Injetado em todas as páginas via tag `<script src="/antidebug.js"></script>`.

**O que detecta:**
- DevTools encaixado na lateral (diferença `outerWidth - innerWidth > 200px`)
- Teclas: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
- Clique direito (desabilitado)

**Comportamento ao detectar:** redireciona para `https://www.youtube.com/shorts/leVBxu2QsuI`

**Mobile:** o script encerra imediatamente em dispositivos móveis (sem falso positivo).

---

## Problemas Resolvidos Nesta Sessão

### 1. Caminhos de assets com 404 na Vercel
A página `acesso/index.html` referenciava CSS e JS com caminhos **relativos** (`css/x.css`, `js/x.js`). Quando a Vercel serve a página na raiz `/`, os caminhos viravam `/css/...` e `/js/...` — que não existem. **Solução:** converter para caminhos absolutos (`/funil-2/acesso/css/...`).

### 2. Assets do React também com 404
O React carregava `laco.webp`, `lotties/` e `img/presell/` com caminhos relativos via JS (não HTML). **Solução:** rewrites no vercel.json mapeando essas rotas para `funil-2/acesso/`.

### 3. antidebug.js com falso positivo no mobile
Versão inicial usava `debugger` com timing (dispara em celular lento) e checava `outerHeight - innerHeight` (barra do browser mobile gera diferença grande). **Solução:** remover `debugger`, ignorar mobile, checar só largura.

### 4. Servidor local servindo da pasta errada
O `server.js` estava dentro de `funil-2/` — ao servir na raiz `/`, os assets `/funil-2/_next/...` viravam `funil-2/funil-2/_next/...`. **Solução:** mover servidor para raiz do projeto.

---

## Deploy — Passo a Passo

1. Faça as alterações locais
2. Teste com `npm run dev` em `http://localhost:3000`
3. Commite e dê push:
   ```bash
   git add .
   git commit -m "descrição"
   git push
   ```
4. A Vercel faz redeploy automático ao detectar o push

---

## Configuração Vercel (primeira vez)

- **Framework:** Other
- **Build Command:** *(vazio)*
- **Output Directory:** *(vazio)*
- **Root Directory:** *(vazio — raiz do repositório)*

---

## Histórico de Commits Relevantes

| Commit | Descrição |
|---|---|
| `03e5556` | Reorganização inicial: package.json, server.js, vercel.json |
| `ce1095f` | Raiz `/` serve acesso diretamente (sem redirect) |
| `061a9e3` | Fix paths CSS/JS para absolutos no acesso |
| `de3c452` | Fix assets React (lotties, img, laco.webp) via rewrites Vercel |
| `ed3450a` | Proteção anti-clonagem em todas as páginas |
| `6963e1c` | Simplificação do antidebug (remove debugger) |
| `2e6b013` | Fix falso positivo mobile no antidebug |
