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

Gateway atual: **brpix** (links `https://app.cashnopixbr.site/c/<hash>`). O gateway antigo
(**disrupt**) foi descontinuado — ver "Mecanismo de gateway" abaixo.

| Página | Link de checkout (brpix) | Onde fica no código |
|---|---|---|
| acesso | `/c/356d908237858cf1` | hardcoded no chunk da página |
| back1 | `/c/b44d252fca359cfa` | hardcoded no chunk da página |
| back2 | `/c/4eb17cb7f7aee527` | hardcoded no chunk da página |
| upsell1 | `/c/7dbcb6dd50e88f2e` | config `up1P.pay` |
| dws1 | `/c/41f21fa2a8708379` | config `dws1P.pay` |
| upsell2 | `/c/7b14b3428db56842` | config `up2P.pay` |
| upsell3 | ⚠️ **sem link** (ainda no gateway antigo) | config `up3P.pay` (silver/gold/diamond vazios) |

### Mecanismo de gateway (IMPORTANTE)

As páginas upsell1/2/3 e dws1 montam o botão de compra a partir de um **objeto de config**
bundlado no chunk da página, com uma entrada por página/fluxo:

```js
{ up1P:{pay,disru}, dws1P:{pay,disru}, up2P:{pay,disru}, up3P:{pay:{silver,gold,diamond}, disru:{...}}, ...Sr }
```

- A função resolver `t({page,flow})` devolve a entrada certa: `page:"up1"→up1P`, `"dws1"→dws1P`,
  `"up2"→up2P`, `"up3"→up3P` (sufixo `Sr` = fluxo secundário; `P` = principal).
- **`pay`** = link de checkout do gateway **novo (brpix)**.
- **`disru`** = código do gateway **antigo (disrupt)**, hoje descontinuado.

**Regra de seleção do gateway no botão** (componente `V1`, chunk `327`):

```
disru COM valor  → renderiza <a data-fornpay="<disru>"> → usa o gateway ANTIGO e IGNORA o pay
disru VAZIO      → renderiza <button> que navega para o link `pay` → usa o brpix
```

➡️ **Para uma página usar o brpix:** a chave que ela lê precisa ter `pay` preenchido **E** `disru` vazio.
Se o `disru` tiver qualquer valor, o `pay` é ignorado e o botão tenta o gateway antigo (morto).

> **Regra dos dois locais:** todo chunk de página existe em **duas** cópias que precisam ficar idênticas:
> `funil-2/<page>/js/page-<hash>.js` **e** `funil-2/_next/static/chunks/app/<page>/page-<hash>.js`.
> Alterações de checkout devem ser feitas nas **duas**. Confirme também qual `page-<hash>.js` o
> `index.html` daquela página realmente carrega (há chunks órfãos de versões antigas na pasta).
> Sempre rode `node --check <arquivo>.js` após editar um chunk.

---

## Pixels de Rastreamento

A partir de **17/06/2026**, o funil usa **um único** rastreador: o Pixel da Utmify.
Todos os pixels antigos foram removidos (ver seção "Consolidação do trackeamento" abaixo).

| Plataforma | ID |
|---|---|
| Utmify Pixel (único) | `6a37161ef69cce7d66a18fcb` |

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
  window.pixelId = "6a37161ef69cce7d66a18fcb";
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
(`6a37161ef69cce7d66a18fcb`) como único rastreador em todas as páginas.

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
- Novo pixel `6a37161ef69cce7d66a18fcb` → exatamente **1×** por página (8 páginas).
- Tags `<script>`/`</script>` balanceadas; um único `</head>`/`<body>`/`</body></html>` por página.
- A duplicata morta `funil-2/funil-2/acesso/index.html` (artefato de build, não servida) teve o pixel
  Utmify antigo removido (sem inserir o novo, pois não é uma página real).

---

## Checkout / gateway brpix e dev local — Sessão 17/06/2026

### 1. Links de checkout (dws1, upsell1, upsell2)
Alteração de links que não estava surtindo efeito. Causas e correções:
- **upsell2** fora editado no chunk **errado** (`page-7e1442d84f3b6bce.js`), mas a página carrega
  `page-95048fca631c14c5.js`. Aplicado o link no chunk ativo correto (`up2P.pay`).
- **dws1** recebera o link em `up1P/up2P`, mas a página dws1 lê `dws1P` (resolver `t({page:"dws1"})`).
  Movido para `dws1P.pay`.
- Tudo replicado nas **duas localizações** (pasta da página + `_next/.../app/<page>/`).

### 2. Migração para o gateway brpix (esvaziar `disru`)
Descoberto que o botão usa o gateway **antigo (disrupt)** sempre que `disru` tem valor, **ignorando o
`pay` (brpix)** — ver "Mecanismo de gateway" na seção Checkouts. Como o disrupt foi descontinuado,
**esvaziei `dws1P.disru` e `up2P.disru`** para esses botões passarem a usar o link `pay`/brpix
(mesmo padrão do `up1P`, que já funcionava). Validado com `node --check`.
> ⚠️ **upsell3** continua no gateway antigo (`up3P.disru` preenchido) e **sem link brpix** — checkout
> dele provavelmente não funciona. Pendente: receber os 3 links (silver/gold/diamond) e migrar.

### 3. Speed code do VTurb
Adicionado em acesso/upsell1/upsell2 — ver seção "Vídeos VSL".

### 4. server.js — rewrites do dev local
O `server.js` não replicava os rewrites do `vercel.json`, então `/laco.webp` e `/lotties/*` davam 404
no `localhost` (página não carregava por completo). Adicionados os rewrites para o dev local espelhar a
produção.

## Projeto do Checkout próprio (BRPix API + Utmify) — Sessão 24/06/2026

Início do projeto para **substituir os links `/c/...` do gateway brpix por um checkout próprio**,
resolvendo o problema de **vendas "não trackeadas" na Utmify** (o gateway recebe as UTMs na URL mas
não as grava na transação nem as envia à Utmify). Toda a documentação vive em **`docs/checkout/`**.

**Diagnóstico (confirmado):** o funil **repassa as UTMs corretamente** ao checkout (botão `V1`,
chunk 327, copia `location.search` para a URL do gateway). O furo está no **gateway**. Solução: nosso
backend vira "dono do pedido" e fala direto com a Utmify (correlação via `external_reference`).

**Documentos criados:**
- `docs/BRAND.md` — guia de marca (cores `#58B947`/etc., Work Sans, botão `KM`, animações, lógica do funil).
- `docs/checkout/02-logica.md` — lógica: fluxo criar-PIX → QR → polling → webhook → Utmify; storage
  MongoDB; modos front/upsell; dados reais (nome/telefone/chave PIX) × genéricos (email/CPF p/ Utmify).
- `docs/checkout/03-ux.md` — UX: jornada (card único que troca de estado), estados, motion, produtos.
- `docs/checkout/referencias/api-pix/brpix-api.md` — referência da API BRPix.

**Infra validada (24/06/2026):** chaves BRPix (auth HMAC OK), MongoDB Atlas (conexão OK, db `cashnopix`),
webhook de produção cadastrado, token Utmify recebido. BRPix liberou **todos os IPs** → arquitetura
fica **tudo na Vercel + MongoDB**. Segredos em `.env.local` (gitignored); nomes em `.env.example`.

**Definições do produto:** preços por etapa (front R$37, back1 R$27, back2 R$19,90, upsell1 R$67,
dws1 R$47, upsell2 R$48,93, upsell3 Silver/Gold/Diamond 67/97/57). Saldos exibidos (front R$467,38,
upsell1/2 R$1.466,74). Nomes: front "Ativação de cadastro", upsell1 "Taxa anti-fraude", upsell2 "Taxa IOF".
Chip "verificada pelo Banco Central"; rodapé "CASH NO PIX LTDA — CNPJ 34.451.628/0001-25".

**Fase 4 (UI) — concluída (24/06/2026):** checkout próprio em **HTML+CSS+JS puro (sem build)** na
pasta **`checkout/`** (`index.html` + `css/checkout.css` + `js/checkout.js`), servido em `/checkout/`.
Stack escolhida pela simplicidade/zero-build (encaixa no deploy estático atual; backend será Vercel
Functions). Reaproveita os tokens da marca (verde `#58B947`, Work Sans, raio 7px, `scale-down`).
Recursos: card único que troca de estado (input → gerando → aguardando → pago/expirado), modos
front (form nome/telefone/chave PIX) e upsell ("Informações validadas"), selo RA em header **sticky**,
saldo, chip "Banco Central", contador, copia-e-cola, rodapé CNPJ. Lê `?step=` e captura UTMs de
`location.search`. **Backend ainda é STUB** (`createPix` mock + botão dev "simular pagamento",
`DEV=true`); QR é placeholder. Imagens em `checkout/{front,upsell1,upsell2,RA}.webp`.

**Fase 5 (integração) — backend construído (24/06/2026):** Vercel Functions + libs (ver
`docs/checkout/05-integracao.md`). Endpoints `/api/checkout/criar-pix`, `/api/checkout/status`,
`/api/webhooks/brpix`; libs em `lib/` (prices, brpix, utmify, mongo, orders, markPaid). Frontend
ligado ao backend real (polling + `?next=` para avançar no funil; `?mock=1` p/ preview de UI).
**Testado de verdade (24/06/2026):** fluxo completo de criação (BRPix cash-in **HTTP 202** com QR real
+ Mongo + Utmify `waiting_payment` com UTMs) ✅, status/polling ✅, `markPaid` idempotente + Utmify
`paid` ✅, `genCpf` mod-11 ✅. A BRPix habilitou o **cash-in** (era 500; resolvido). Resposta real da
BRPix é **flat** (`qr_code_text`/`qr_code_image` no topo) — `lib/brpix.js` normaliza.
**Camuflagem de produto:** nome real só na UI; BRPix `description` e Utmify `productName` recebem um
`code` (`offer001`..`007`, em `lib/prices.js`). Validado: cobrança grava `"offer001"`.
**Dev local:** `server.js` carrega `.env.local` e roteia `/api/*` para as Functions (testa o fluxo
todo no `npm run dev`); `UTMIFY_TEST=true` marca pedidos como teste na Utmify (só local).
**Falta testar:** webhook `charge.paid` real (precisa de pagamento; o polling cobre como fallback).
**Pendente:** env vars na Vercel + `0.0.0.0/0` no Atlas; depois, wire dos botões do funil → `/checkout/`.

**Validação em produção (24–25/06/2026):** fluxo completo confirmado — QR gerado, pagamento real,
webhook (`paidSource: webhook`) e polling marcando pago, **venda aparecendo na Utmify com pending+paid
e as UTMs**. Dois bugs encontrados e corrigidos no caminho:
1. **Mongo na Vercel:** a env var `MONGODB_URI` foi truncada no painel (`?retryWrites` sem valor) →
   `lib/mongo.js` passou a **ignorar a query string** e definir as opções pelo driver (robusto).
2. **Utmify pending não enviava:** era *fire-and-forget* e a função serverless congelava após responder →
   passou a **aguardar (`await`)** o envio do `waiting_payment` antes de responder.
**Dica de teste (importante):** dá para validar a Utmify **sem pagar PIX** — basta enviar um pedido
`pending`+`paid` direto via `lib/utmify.sendOrder` (ex.: `orderId` reconhecível) e procurar no painel.
Produto de teste barato: `?step=teste` (R$5,99, code `offer000`).

**Wire do funil (25/06/2026):** todos os botões de compra passaram a apontar para o checkout próprio,
substituindo o gateway antigo (`app.cashnopixbr.site`).
- **Mecanismo:** o `V1` **sobrescreve a query string** com as UTMs, então `step`/`next` vão no **hash**
  (`/checkout/#step=<etapa>&tier=<>&next=/funil-2/<próxima>/`). O `V1` preserva o hash; o checkout lê
  `step`/`tier`/`next` do hash e as UTMs da search. Cadeia de UTMs validada por simulação.
- **`next` por etapa:** front/back1/back2 → upsell1; upsell1/dws1 → upsell2; upsell2 → upsell3;
  upsell3(silver/gold/diamond) → login. URLs reais = `/funil-2/<page>/` (os caminhos limpos `/upsell1`
  dão 404 em produção).
- **Onde editei:** o link foi trocado em **3 lugares** por página onde existem: o chunk em `js/`, a cópia
  em `_next/static/chunks/app/<page>/`, e o `<a href>` **estático** no `index.html` (render pré-hidratação
  de back1/back2/dws1/upsell3). `node --check` em todos.
- **Achados:** as duas cópias de chunk **divergiam** em algumas páginas (acesso `_next` tinha link órfão
  `/payment/checkout/`; upsell1 `_next` tinha 2x); o **upsell3** estava no gateway antigo (`up3P.disru`
  preenchido, `up3P.pay` vazio) → preenchi os `pay` por tier e esvaziei os `disru`. Órfãos não servidos
  (`upsell2/js/page-7e1442…`, `funil-2/funil-2/acesso/…`) foram deixados como estão.
- **Delay do acesso:** restaurado (a remoção de teste foi descartada via `git checkout`).

**Status:** Fases 1–5 concluídas e validadas; **wire do funil feito**. Testar o fluxo completo em
produção (sem pagar: carregar página → clicar comprar → conferir produto/preço/UTMs e o QR gerar).

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
| `2ab7232` | Documenta correções de sessão no PROJETO.md |
| `5b629ef` | Consolida tracking na Utmify (remove Meta/Kwai/Wustats) + speed code do VTurb + rewrites no server.js |
| `433946c` | Alterações de links de checkout (commit do usuário) |
| `52c9784` | Corrige checkout dws1/upsell2 (link na chave e no chunk corretos) |
| `59e6de6` | Migra checkout dws1/upsell2 para o gateway brpix (esvazia `disru`) |
| `8fcb16f` | Documenta projeto do checkout próprio (brand, lógica, UX) + skills UI/UX e `.env.example` |
| `39a24f6` | Fase 4: UI do checkout próprio (HTML+CSS+JS sem build, em `/checkout/`) |
| `854dc48` | Fase 5: backend do checkout (Vercel Functions BRPix + MongoDB + Utmify) |
| `46cef7f` | Fase 5: corrige leitura da resposta real da BRPix (cash-in 202, campos flat) |
| `bd7d717` | Fase 5: camufla nome do produto (offerNNN) + dev server roda Functions |
| `38ab073` | Fixa Node 22.x no engines (remove warning da Vercel) |
| `e6d3faa` | Fix conexão Mongo: ignora query string da URI (robusto a truncamento) |
| `c8d171e` | Fix Utmify pending: await em vez de fire-and-forget (serverless) |
| `ef05dc7` | Adiciona produto de teste (`?step=teste`, R$5,99) |
| `ce687db` | Wire do funil: botões de compra apontam para o checkout próprio |
