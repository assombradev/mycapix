# Fase 2 — Lógica do Checkout próprio

> Desenho funcional do checkout PIX próprio (BRPix API + Utmify), substituindo os links `/c/...`
> em todo o funil. Base: [`referencias/api-pix/brpix-api.md`](referencias/api-pix/brpix-api.md) e
> [`../BRAND.md`](../BRAND.md). Lógica definida com o cliente em 2026-06-24.

---

## 1. Princípio central (o que resolve o tracking)

A **BRPix cuida só do dinheiro** (criar cobrança / confirmar pagamento). Ela **não recebe nem
devolve UTMs**. Quem é "dono do pedido" e fala com a **Utmify** é o **nosso backend**:

```
Browser (checkout)  →  Nosso backend  →  BRPix  (cria PIX)
                                      →  Utmify (registra pedido + UTMs)
BRPix (webhook pago) →  Nosso backend  →  Utmify (marca pago)  ✅ venda trackeada
```

O **elo de correlação** é o `external_reference`: geramos um ID por cobrança, mandamos no
cash-in, ele **volta idêntico** no webhook `charge.paid`. Assim ligamos "pagou" ↔ "pedido X com
tais UTMs e cliente".

---

## 2. Dois modos de checkout

O funil tem **um produto front** e **upsells**. Os campos do cliente são captados **uma vez** (no front).

### 2.1 Checkout FRONT — `acesso`, `back1`, `back2` (mesmo produto, R$37)
Capta as **únicas 3 informações reais** que o produto precisa:

| Campo | Por quê |
|---|---|
| **Nome** | identificação / narrativa do cashback |
| **Telefone** | contato |
| **Chave PIX** | "a chave que vai receber o valor do cashback" (parte da narrativa do produto) |

Ao concluir, esses dados são **salvos** (ver §4) para reuso nas próximas etapas.

### 2.2 Checkout UPSELL — `upsell1`, `dws1`, `upsell2`, `upsell3`
Os dados do cliente **já vêm validados**. A tela mostra um bloco **"Informações validadas"**
(somente leitura, sem novo preenchimento) com nome/telefone/chave PIX já salvos. O usuário só
confirma e paga. Menos atrito = mais conversão no upsell.

> Se, por algum motivo, não houver dados salvos (ex.: usuário caiu direto no upsell), o checkout
> faz **fallback** para o formulário completo (modo front).

---

## 3. Dados reais × dados genéricos

| Dado | Origem | Usado por |
|---|---|---|
| Nome | **real** (digitado no front) | Utmify (customer.name) |
| Telefone | **real** (digitado no front) | Utmify (customer.phone) |
| Chave PIX | **real** (digitado no front) | nosso registro (CRM/narrativa) |
| **Email** | **genérico** gerado por pedido | Utmify (customer.email) |
| **CPF** | **genérico válido** gerado por pedido | Utmify (customer.document) |

**Por que genérico funciona:** a Utmify atribui a venda pelas **UTMs**, não pelo cliente. Os campos
email/CPF existem só porque o schema dela pede. Cuidados:
- **CPF** deve ser **estruturalmente válido** (dígitos verificadores mod-11) ou a Utmify pode rejeitar.
  → geramos um CPF válido aleatório por pedido.
- **Email** único por pedido (ex.: `pedido+<external_reference>@cashnopixbr.site`) para a Utmify não
  fundir pedidos.
- A **BRPix não recebe nenhum desses** — cash-in só leva `amount/description/external_id/external_reference/expires_in`.

> 💡 Melhoria opcional (futuro): se a chave PIX digitada for um CPF/email/telefone, podemos usá-la
> como dado real na Utmify em vez do genérico. Por ora: **genérico**, como você definiu.

---

## 4. Persistência (dois níveis)

### 4.1 No browser — `localStorage` (reuso entre etapas)
Mesma origem em todo o funil → guardamos o "perfil do comprador" e as UTMs:
```js
cnp_customer = { name, phone, pixKey }      // captado no front
cnp_utms     = { utm_source, utm_medium, utm_campaign, utm_content, utm_term, ... }  // captado na entrada
```
- `cnp_utms` é gravado **na 1ª página** a partir de `location.search` (e mantido mesmo que upsells
  não tragam query string).
- Em cada checkout, o browser envia `cnp_customer` + `cnp_utms` ao backend.

### 4.2 No servidor — coleção `orders` (correlação do webhook)
O webhook `charge.paid` traz `external_reference`, mas **não** traz UTMs/nome. Para marcar a venda
como paga na Utmify com os dados completos, precisamos **ter guardado o pedido** no momento da criação.

**Storage: MongoDB (Atlas) + Vercel** — coleção `orders` (DB `cashnopix`):
| Campo | Tipo | Nota |
|---|---|---|
| `_id` / `externalReference` | string | nosso ID (`cnp_<step>_<uuid>`) — índice único |
| `txid` | string | id da cobrança BRPix (índice) |
| `funnelStep` | string | `front` / `upsell1` / `dws1` / `upsell2` / `upsell3-<tier>` |
| `amount` | int | centavos |
| `status` | string | `pending` / `paid` / `expired` |
| `customer` | object | name, phone, pixKey, email(gen), cpf(gen) |
| `utms` | object | trackingParameters |
| `utmifySent` | object | `{ pending: bool, paid: bool }` (idempotência Utmify) |
| `createdAt` / `paidAt` | Date | |

---

## 5. Fluxo detalhado (happy path)

```
[Browser - checkout da etapa]
 1. Lê cnp_customer + cnp_utms do localStorage
    - modo FRONT: form (nome/telefone/chavePix) → salva cnp_customer
    - modo UPSELL: mostra "Informações validadas" (read-only)
 2. POST  /api/checkout/criar-pix   { step, customer, utms }

[Backend - /api/checkout/criar-pix]
 3. Resolve amount pelo step (server-side, tabela de preços — nunca confiar no client)
 4. Gera external_reference = cnp_<step>_<uuid>
 5. Gera email+cpf genéricos
 6. BRPix POST /pix/cash-in { amount, description, external_id, external_reference, expires_in }
    (headers HMAC via buildHeaders)
 7. Salva orders(external_reference, txid, step, amount, 'pending', customer, utms)
 8. Utmify: cria pedido status "waiting_payment" (UTMs + customer)
 9. Responde ao browser { txid, qr_code, qr_code_image, expires_at }

[Browser]
10. Exibe QR + copia-e-cola + contador de expiração
11. Polling: GET /api/checkout/status?ref=<external_reference>  (a cada ~3–5s)

[Backend - webhook]  POST /api/webhooks/brpix
12. Lê corpo bruto + header X-BRPix-Signature → verifySignature (secret do webhook)
13. event=charge.paid → acha orders por external_reference
14. Idempotência: se já 'paid', ignora (webhook pode duplicar)
15. orders.status='paid', paid_at=now
16. Utmify: atualiza pedido para "paid"   ✅
17. (200 OK rápido pra BRPix)

[Browser - polling vê 'paid']
18. Toca success.mp3 + lottie de sucesso → avança no funil (próximo upsell / login)
```

### Caminhos alternativos
- **Expirou** (`charge.expired` ou contador zera): oferecer "gerar novo PIX".
- **Webhook atrasa:** o polling de status (`GET /pix/charge/{txid}` via backend) é o **fallback** —
  quem confirmar primeiro (webhook ou polling) marca como pago (com idempotência).
- **Falha BRPix (4xx/5xx/429):** mostrar erro amigável + retry; respeitar rate limit (cash-in 100/min).

---

## 5.1 Infra: IP whitelisting (RESOLVIDO)

A BRPix exigia IP whitelisting (`403 IP_NOT_WHITELISTED`). Em 2026-06-24 o cliente **liberou todos
os IPs** no painel da BRPix → chamadas de saída passaram a funcionar de qualquer origem.

- ✅ **Decisão:** mantemos **tudo na Vercel** (frontend + Functions de pagamento + webhook). Sem
  necessidade de host com IP fixo nem proxy.
- ⚠️ **MongoDB Atlas:** liberar `0.0.0.0/0` em *Network Access* para as Vercel Functions conectarem
  (IPs dinâmicos).

**Validações feitas em 2026-06-24 (scripts no scratchpad):**
- MongoDB: ping + insert + read + delete OK (db `cashnopix`).
- BRPix: `GET /pix/charge/<uuid>` → `404 Charge not found` = **auth HMAC + chaves válidas**.

## 6. Endpoints do nosso backend (Vercel Functions)

| Rota | Método | Função |
|---|---|---|
| `/api/checkout/criar-pix` | POST | cria cobrança BRPix + pedido + Utmify(pending); retorna QR |
| `/api/checkout/status` | GET | consulta status do pedido (polling do browser) |
| `/api/webhooks/brpix` | POST | recebe `charge.paid/expired`, valida assinatura, atualiza Utmify |

**Segredos (env vars na Vercel + `.env.local`, nunca no client):** ver `.env.example`.
`BRPIX_BASE_URL`, `BRPIX_PUBLIC_KEY`, `BRPIX_SECRET_KEY`, `BRPIX_WEBHOOK_SECRET`,
`BRPIX_SANDBOX_BASE_URL`, `UTMIFY_API_TOKEN`, `MONGODB_URI`, `MONGODB_DB`.
- `BRPIX_WEBHOOK_SECRET` e `UTMIFY_API_TOKEN` **já estão** no `.env.local` (gitignored).
- **Faltam:** `BRPIX_PUBLIC_KEY`, `BRPIX_SECRET_KEY`, `MONGODB_URI`, `BRPIX_SANDBOX_BASE_URL`.

---

## 7. Mapa de preços por etapa (confirmado)

| Etapa | Valor (R$) | Centavos |
|---|---|---|
| acesso (front) | 37,00 | 3700 |
| back1 | 27,00 | 2700 |
| back2 | 19,90 | 1990 |
| upsell1 | 67,00 | 6700 |
| dws1 (downsell 1) | 47,00 | 4700 |
| upsell2 | 48,93 | 4893 |
| upsell3 — Silver | 67,00 | 6700 |
| upsell3 — Gold | 97,00 | 9700 |
| upsell3 — Diamond | 57,00 | 5700 |

> Valores extraídos dos chunks (acesso/back1/back2 via `valuePaid`; upsell3 via planos
> silver/gold/diamond, Diamond ancorado em "de R$127"). O valor é resolvido **no servidor** por
> etapa/tier — o browser nunca manda o preço. O upsell3 manda só o **tier** escolhido.

---

## 8. Decisões — status

1. ✅ **Storage:** **MongoDB (Atlas) + Vercel**. (Falta `MONGODB_URI`.)
2. ✅ **Utmify:** token recebido (em `.env.local`).
3. ✅ **Sandbox BRPix:** existe. (Falta a **URL base de sandbox** e credenciais de teste.)
4. ✅ **Preços:** confirmados (§7).
5. ✅ **Webhook:** cadastrado para `https://cashnopixbr.site/api/webhooks/brpix`; secret em `.env.local`.

### Pré-requisitos da Fase 5 — STATUS (2026-06-24)
- ✅ `BRPIX_PUBLIC_KEY` + `BRPIX_SECRET_KEY` — recebidas e **validadas** (auth OK).
- ✅ `BRPIX_WEBHOOK_SECRET` (produção) — recebido.
- ✅ `MONGODB_URI` — cluster criado e **conexão validada** (db `cashnopix`).
- ✅ `UTMIFY_API_TOKEN` — recebido (falta validar o payload da API de orders).
- ✅ IP whitelisting BRPix — liberado (todos os IPs).
- ⏳ Sandbox BRPix — não finalizado; vamos testar em **produção** (cobranças PENDING expiram sem custo).
- ⏳ Atlas Network Access `0.0.0.0/0` — confirmar antes do deploy na Vercel.

### A confirmar com a Utmify (Fase 5)
- Formato exato do payload da API de orders (campos `orderId`, `customer`, `trackingParameters`,
  `commission`, `status`, `platform`, `isTest`...). Vou validar contra a doc da Utmify antes de codar.
