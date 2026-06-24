# 🎨 Brand Guide — Cash No Pix

> Fonte da verdade do design para o **checkout próprio** que vamos construir.
> Extraído diretamente do CSS (`funil-2/acesso/css/ecb48dab76efb701.css`) e dos chunks React do funil.
> Atualizado em 2026-06-24.

---

## 1. Identidade & conceito

- **Produto:** "Cash No Pix" — funil de *cashback/recompensa* com mecânica de pesquisa
  ("avalie produtos e ganhe PIX"). O usuário acumula saldo respondendo avaliações e precisa
  "ativar o cadastro" (R$37) para sacar.
- **Logo:** wordmark **branco** (SVG inline, ~225×49) sobre fundo verde. Puramente tipográfico,
  sem ícone separado.
- **Tom:** urgência + recompensa (timers, "valores esquecidos", saldo crescente, som de
  "dinheiro caindo").

---

## 2. Paleta de cores

Definidas em `:root` e nas classes Tailwind.

| Token | Hex | RGB | Uso |
|---|---|---|---|
| **primary** (verde) | `#58B947` | `88 185 71` | Cor-mãe: CTAs, destaques, splash, saldo |
| **background** | `#FFFFFF` | `255 255 255` | Fundo geral (tema claro) |
| **secondary** | `#F0F0F0` | `240 240 240` | Fundos suaves / cards neutros |
| **red-1** | `#DB282C` | `219 40 44` | Botão "secondary", alertas, erros |
| **gray-1** | `#37474F` | `55 71 79` | Texto escuro azulado / estados ativos |
| green-600 | `#16A34A` | `22 163 74` | Sucesso/confirmação |
| red-600 | `#DC2626` | `220 38 38` | Erros secundários |
| quiz: teal | `#14B8A6` | — | Botão "Eu gosto" (variante `third`) |
| quiz: âmbar | `#EAB308` | — | Botão "Não sou muito fã" |
| quiz: vermelho | `#EF4444` | — | Botão "Eu ODEIO" |

**Opacidades recorrentes:** `black/50`, `black/70`, `white/70`, `primary/15`.

➡️ **Verde `#58B947` é a assinatura.** O checkout novo deve liderar com essa cor nos CTAs.

---

## 3. Tipografia

- **Família única:** **Work Sans** (Google Font, self-hosted `.woff2`), variável `--font-work-sans`,
  aplicada no `html`.
- **Pesos:** arquivo traz 100–900; uso prático = **500 (medium)**, **600 (semibold)**, **700 (bold)**.
- **Fallback:** `Arial` com `size-adjust:111.93%`, `ascent-override:83.09%`, `descent-override:21.71%`
  (evita layout shift).
- **Padrões:**
  - Títulos: `font-bold leading-tight`
  - CTAs: `font-semibold leading-none`
  - Rótulos pequenos: `tracking-[0.08em]` + `uppercase`
- ⚠️ Existe um resquício de classe `font-rubik` no splash ("CARREGANDO…"), mas a **fonte oficial é
  Work Sans**.

---

## 4. Componentes & tokens de UI

### Botão primário (componente `KM`, chunk `327`) — peça-chave a replicar
```
w-full px-2 py-4 rounded-[7px] flex items-center justify-center gap-2
text-white font-semibold leading-none text-center
bg-primary  ·  enabled:animate-scale-down  ·  disabled:opacity-50 disabled:cursor-not-allowed
```
Variantes: `primary` (verde `#58B947`) · `secondary` (vermelho `#DB282C`) · `third` (teal `#14B8A6`).

### Animações (assinatura de movimento)
| Nome | Efeito | Onde |
|---|---|---|
| `scale-down` | `scale(1.05→0.95→1.05)` loop 1s | CTAs (botões "respiram") |
| `scale-down-money` | `scale(1.2→0.95→1.2)` loop 1s | Valor em destaque |
| `pulse` | opacidade 1→.5 | loaders / placeholders |
| `spin` | rotação | spinners |

### Outros tokens
- **Raios de borda:** botões `7px` · vídeos/inputs `6px` · cards `13px` / `14px` / `20px` / `rounded-xl`.
- **Modais:** overlay `bg-black/50`, conteúdo branco centralizado, z-index altíssimo (`999999999`).
- **Inputs:** componente `w` (forwardRef), `inputMode` configurável (cpf/phone),
  placeholder `text-black/50`.
- **Spacing mobile-first:** utilitário próprio `px-mobile-18` (1.125rem). CTAs travados em
  `max-w-[290px]`, centralizados (`mx-auto`).

### Mídia de marca
- **Lotties:** `search-cashback`, `qr-code`, `success-circle-check`, `withdrawal-made`,
  `gift-box`, `success`.
- **Sons:** `cashing.mp3` (ao ganhar saldo) e `success.mp3` (reforço sensorial de "dinheiro").

---

## 5. Funcionamento & lógica do funil

**Estado global** (`UserProvider`, chunk `4898`): `balance` (inicia em 50), `pagePresell`,
`currentQuestion`, `pageUpsell1/2/3`. A navegação é uma **máquina de estados client-side**
(não há rotas reais entre as telas internas).

### Etapa `acesso` (presell) — roteador `pagePresell` → `{home, vsl, wallet, vsl-pr}`
```
home  (comp. I)  → fluxo de pesquisa/cashback:
        search-cashback → answer-question (avaliações 1–6, saldo sobe, toca cashing.mp3)
        → redeem-cashback → query-code
   ↓
vsl   (comp. L)  → VSL 1 (player 6a2c7a3c…, botão a 769s)
        botão "LIBERAR ACESSO!" → setPagePresell("wallet")
   ↓
wallet (comp. D) → formulário de chave PIX/CPF
   ↓
vsl-pr (comp. J) → VSL 2 (player 6a2c7906…, botão a 355s)
        botão de CHECKOUT (comp. V1) → /c/356d908237858cf1?hidecard=1  (R$37)
```
Saída lateral: hook de back-redirect manda para `/back1` ao tentar sair.

### Funil completo
```
acesso → upsell1 → (dws1) → upsell2 → upsell3 → login
```
Cada etapa tem seu próprio VSL e botão de checkout.

---

## 6. Como o checkout/UTM funciona hoje (ponte p/ o checkout próprio)

Botão de checkout atual (`V1`, chunk `327`) no clique:
```js
let url = new URL(href);                          // ex.: app.cashnopixbr.site/c/356d...
let qs  = new URLSearchParams(location.search);   // ← UTMs da página atual
extraParams.forEach((v,k) => qs.set(k, v));       // + {hidecard:1}
url.search = qs.toString();
window.location.assign(url);                       // redireciona com UTMs anexadas
```
➡️ O funil **repassa as UTMs corretamente**. O problema de tracking está no **gateway brpix**,
que recebe as UTMs na URL mas **não as grava na transação** nem as envia à Utmify.
No checkout próprio, esse mesmo padrão (ler UTMs de `location.search`) deve ser preservado —
mas o envio para a Utmify passa a ser **controlado por nós**.

---

## Resumo executivo (cheat-sheet do checkout novo)

| Elemento | Valor a manter |
|---|---|
| Cor primária | `#58B947` (verde) |
| Cores de apoio | branco `#FFF`, cinza `#F0F0F0`, vermelho `#DB282C`, gray-1 `#37474F` |
| Fonte | **Work Sans** (500 / 600 / 700) |
| Botão CTA | full-width, `rounded-[7px]`, `py-4`, branco semibold, **pulsando** (`scale-down`) |
| Layout | mobile-first, centralizado, max-width estreito (~290px nos CTAs) |
| Linguagem visual | recompensa/PIX: verde, lotties de dinheiro, som de "caixa" |
| UTMs | ler de `location.search` e enviar para a API PIX + Utmify (controle nosso) |
