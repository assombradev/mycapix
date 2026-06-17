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
| Tracking | Utmify Pixel (único rastreador) |
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
│   │       │   └── app/<page>/page-<hash>.js  ← chunk de CADA página (o webpack carrega daqui)
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

A partir de **17/06/2026**, o funil usa **um único** rastreador: o Pixel da Utmify.
Todos os pixels antigos foram removidos (ver seção "Consolidação do trackeamento" abaixo).

| Plataforma | ID |
|---|---|
| Utmify Pixel (único) | `6a32e6e2d07604ad6574982c` |

O script é idêntico em todas as 8 páginas (`acesso`, `upsell1/2/3`, `dws1`, `back1/2`, `login`),
inserido no fim do `<head>`, logo antes de `</head>`:

```html
<!-- UTMIFY: rastreamento de UTMs -->
<script
  src="https://cdn.utmify.com.br/scripts/utms/latest.js"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  async
  defer
></script>
<!-- UTMIFY: pixel -->
<script>
  window.pixelId = "6a32e6e2d07604ad6574982c";
  var a = document.createElement("script");
  a.setAttribute("async", "");
  a.setAttribute("defer", "");
  a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  document.head.appendChild(a);
</script>
```

### Pixels removidos (não usar mais)
| Plataforma | ID antigo |
|---|---|
| Meta Pixel (acesso/back/dws/upsell) | `1039380481627093` |
| Meta Pixel (login) | `3959699630937334` |
| Utmify Pixel 1 (antigo) | `69083169bcebef921e6ed8a1` |
| Utmify Pixel 2 (antigo) | `69128d2ba9ec6c562f2ceb38` |
| Kwai Pixel | `690ab0af41847a838d969a7b` |
| Wustats (`waust.at`) | `zlx1l003k4` |

---

## Vídeos VSL (Vturb / Converteai)

Conta Converteai/VTurb: `78d130da-9008-4e8e-aed9-46a76c1217ce`. São 4 VSLs no funil, mapeadas por página
(o player é renderizado pelo chunk React de cada página):

| VSL | ID do Player | m3u8 | Página | Obs |
|---|---|---|---|---|
| VSL 1 | `6a2c7a3cc24e5836ece8e8ac` | `6a2c7a28f04e41ecc574edd6` | acesso | botão 769s (~12min) |
| VSL 2 | `6a2c79064eb77420ee4aec07` | `6a2c78fe57b5fea2c937cb63` | acesso | botão 355s (~6min) |
| VSL 3 | `6a2edaffe3ec81421df549cd` | `6a2edae2bcb27b44d3e236ee` | upsell1 | |
| VSL 4 | `6a2eef74d33ef46eda9d6e48` | `6a2eef5d5b719ab8be0e66df` | upsell2 | |

**Dica dev:** adicione `?nodelay=true` na URL para mostrar os botões imediatamente sem assistir o vídeo. Está programado nativamente no código da página.

### Speed code do VTurb (otimização de carregamento) — 17/06/2026
Cada página de vídeo recebeu no início do `<head>` (logo após a meta `viewport`) o "speed code" do VTurb:
script inline `_plt` (marca o timeOrigin cedo) + `<link rel="preload">` do(s) `player.js`, do `smartplayer.js`
e do(s) `main.m3u8`, mais `<link rel="dns-prefetch">` dos domínios converteai/vturb. O `acesso` traz os dois
players (VSL 1 e VSL 2) combinados, com `smartplayer.js` e dns-prefetch uma única vez.

> **upsell2 — limpeza:** havia referências órfãs de um player antigo (conta `2e8fc70c-…`, vídeo
> `68cd7140713fc4a5132560c0`) num `<link rel="preload">` no head e num `<script>` no body. Esse player
> não existia na página (o chunk renderiza o VSL 4) — ambos foram removidos.

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

**Kill-switch para testes:** no topo do `antidebug.js` há a flag `var _DISABLED`. Coloque `true` para **desligar tudo** (sem redirect, sem bloqueio de teclas/clique direito) e poder testar as páginas com o DevTools aberto. **Volte para `false` antes de subir para produção.**

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

## Problemas Resolvidos — Sessão 14/06/2026 (sub-páginas com tela branca)

As sub-páginas do funil (`upsell1/2/3`, `dws1`, `back1/2`, `login`) ficavam travadas numa tela branca escrita "CARREGANDO...". Só o `acesso` tinha sido corrigido antes. Foram **três causas** distintas:

### 1. CSS/JS com caminhos relativos (mesma causa do acesso)
Cada `index.html` referenciava CSS/JS como `css/x.css` e `js/x.js`. Servida em `/funil-2/<page>` (sem barra final), o navegador resolvia para `/funil-2/css/...` → **404** → o React nunca hidratava. **Solução:** converter para absolutos `/funil-2/<page>/css/...` e `/funil-2/<page>/js/...` em todas as sub-páginas.

> ⚠️ **Importante:** NÃO use `<base href>` para resolver isso — quebra os `clip-path="url(#id)"` dos SVGs (logos). Use sempre caminhos absolutos.

### 2. Page chunks faltando em `_next/static/chunks/app/<page>/`
O webpack carrega o componente da página **dinamicamente** de `_next/static/chunks/app/<page>/page-<hash>.js` (via RSC/flight). Essa pasta só existia para `acesso` e `upsell1`. Nas demais → `ChunkLoadError: Loading chunk 591 failed` → React #423.
**Solução:** copiar o page chunk de cada página (`<page>/js/page-<hash>.js`) para `_next/static/chunks/app/<page>/`.
**Regra geral:** ao adicionar/alterar uma sub-página, o `page-<hash>.js` precisa existir **nas duas** localizações (pasta da página E `_next/.../app/<page>/`), com conteúdo idêntico.

### 3. upsell2 — chunk corrompido (SyntaxError)
O `upsell2/js/page-95048fca631c14c5.js` tinha o bloco HTML da VSL (Vturb) colado **cru dentro do JS**, sem as aspas/parênteses que o envolviam: `(0,p.S)<vturb-smartplayer id=...>` em vez de `(0,p.S)('<vturb-smartplayer ...>')`. Gerava `SyntaxError: Unexpected identifier 'id'` → o chunk não fazia parse → ChunkLoadError.
**Solução:** re-envolver o HTML como string argumento do hook (igual ao `acesso`). O hook (módulo `3869`) recebe uma string e extrai `htmlBlock`/`scriptUrl`/`cleanId` por regex.
**Dica de verificação:** rode `node --check <arquivo>.js` em qualquer chunk editado antes de commitar.

---

## Consolidação do trackeamento — Sessão 17/06/2026

Os pixels haviam sido configurados de forma inconsistente e "se perderam": cada página disparava
para **vários** rastreadores ao mesmo tempo (Meta Pixel, duas instâncias da Utmify, Kwai, Wustats)
e blocos `fbq()` customizados (AddToCart/InitiateCheckout). Risco de enviar eventos para pixels errados.

**Ação:** remover TODO o trackeamento antigo e deixar **apenas** o novo Pixel Utmify
(`6a32e6e2d07604ad6574982c`) como único rastreador em todas as páginas.

### O que foi removido de cada `index.html`
- `<link rel="preload" ... utms/latest.js>` + as 2 instâncias antigas do pixel Utmify
- Bloco Meta Pixel (`<!-- Meta Pixel Code --> … <!-- End Meta Pixel Code -->`) + `<noscript>` do Facebook
- Bloco Kwai (`window.kwaiPixelId` + `pixel-kwai.js`)
- Div oculta do Wustats (`_wau` / `//waust.at/s.js`)
- Script customizado `(function(){…fbq…})()` (variantes `setupCheckoutButtons` e `setupButton`)

### Detalhe importante: HTML "sujo" das sub-páginas
`back1/2`, `dws1`, `upsell1/3` tinham **lixo anexado depois** do primeiro `</body></html>`
(custom fbq + Kwai + um segundo `antidebug.js` + segundo `</body></html>`). A limpeza **truncou tudo
após o primeiro `</body></html>`** — esse lixo NÃO continha o player VSL, então nada de funcional se perdeu.
O `upsell2` era diferente (tracking dentro do corpo, antes do fechamento único, + player `converteai`
que foi **preservado**).

### Preservados (não confundir com tracking)
- `antidebug.js`, chunks Next.js (`self.__next_f`), players VSL (Vturb/Converteai), CSS/fontes/lotties.

### Verificação feita
- `grep` por `fbq(`, `connect.facebook.net`, `kwaiPixelId`, `pixel-kwai`, `waust.at`, e os IDs antigos
  → **0 ocorrências** em qualquer `.html`.
- Novo pixel `6a32e6e2d07604ad6574982c` → exatamente **1×** por página (8 páginas).
- Tags `<script>`/`</script>` balanceadas; um único `</head>`/`<body>`/`</body></html>` por página.
- A duplicata morta `funil-2/funil-2/acesso/index.html` (artefato de build, não servida) teve o pixel
  Utmify antigo removido (sem inserir o novo, pois não é uma página real).

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
| `f7a73b9` | Documentação completa do projeto (PROJETO.md) |
| `14345d8` | Fix render das sub-páginas: paths absolutos, page chunks no `_next`, chunk corrompido do upsell2 |
| `f09c0a5` | Atualiza link de checkout do dws1 e sincroniza chunk do player do upsell2 |
