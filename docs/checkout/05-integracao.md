# Fase 5 — Integração (backend BRPix + MongoDB + Utmify)

> Implementação do backend do checkout. Base: [`02-logica.md`](02-logica.md). Construído 24/06/2026.

## Arquitetura (tudo na Vercel + MongoDB)
```
checkout/js/checkout.js ──POST──► /api/checkout/criar-pix ──► BRPix cash-in
                                                          ├──► Mongo (orders: pending)
                                                          └──► Utmify (waiting_payment)
            (polling) ───GET───► /api/checkout/status ──► (fallback) BRPix getCharge
BRPix ─────webhook─────► /api/webhooks/brpix ──► verifica HMAC ──► Mongo(paid) + Utmify(paid)
```

## Arquivos
| Arquivo | Função |
|---|---|
| `lib/prices.js` | Preços/produtos por etapa (server-side, fonte da verdade) |
| `lib/brpix.js` | Cliente BRPix: `buildHeaders`, `createCashIn`, `getCharge`, `verifyWebhook` |
| `lib/utmify.js` | `sendOrder` (waiting_payment/paid) — payload validado |
| `lib/mongo.js` | Conexão Mongo cacheada (serverless) → coleção `orders` |
| `lib/orders.js` | `genExternalRef`, `genCpf` (mod-11 válido), `genEmail`, saneamento |
| `lib/markPaid.js` | Marca pago **idempotente** + Utmify(paid) — usado por webhook e polling |
| `api/checkout/criar-pix.js` | POST: cria cobrança + pedido + Utmify(pending) |
| `api/checkout/status.js` | GET `?ref=`: status + fallback de polling na BRPix |
| `api/webhooks/brpix.js` | POST: valida assinatura + atualiza pago/expirado (bodyParser off) |

## Endpoints
- **POST `/api/checkout/criar-pix`** — body `{ step, tier?, customer:{name,phone,pixKey}, utms }`
  → `{ ref, txid, qr_code, qr_code_image, expires_at }`. Valor resolvido no servidor por `step`.
- **GET `/api/checkout/status?ref=`** → `{ status: "pending"|"paid"|"expired" }`.
- **POST `/api/webhooks/brpix`** — eventos `charge.paid`/`charge.expired` (assinatura obrigatória).

## Frontend
`checkout/js/checkout.js`: `createPix()` chama o backend real; polling em `/status` a cada 4s;
`?mock=1` mantém preview de UI sem backend; após pago, redireciona para `?next=` (preservando UTMs).

## Camuflagem do nome do produto (24/06/2026)
O nome real do produto **não** vai para a intermediadora nem para a Utmify. Cada etapa tem um
`code` (`offerNNN`) em `lib/prices.js`:
| Etapa | code |
|---|---|
| front/back1/back2 | `offer001` |
| upsell1 | `offer002` |
| dws1 | `offer003` |
| upsell2 | `offer004` |
| upsell3 silver/gold/diamond | `offer005`/`006`/`007` |
- BRPix `description` = `code` (validado: a cobrança grava `"offer001"`).
- Utmify `productName` = `code` (criação e pagamento).
- A **UI do checkout** segue mostrando os nomes reais (frontend, `checkout/js/checkout.js`).
- O Mongo guarda os dois (`productName` real + `productCode`).

## Dev local com as Functions (`npm run dev`)
`server.js` agora carrega `.env.local` e roteia `/api/*` para as mesmas Functions (reusa `lib/`),
permitindo testar o fluxo completo localmente. `UTMIFY_TEST=true` no `.env.local` marca os pedidos
como teste na Utmify (não setar em produção).

## Variáveis de ambiente (Vercel → Project Settings → Environment Variables)
Replicar **todas** do `.env.local` (nomes em `.env.example`):
`BRPIX_BASE_URL`, `BRPIX_PUBLIC_KEY`, `BRPIX_SECRET_KEY`, `BRPIX_WEBHOOK_SECRET`,
`UTMIFY_API_TOKEN`, `MONGODB_URI`, `MONGODB_DB`.
> Atlas: liberar `0.0.0.0/0` em Network Access (Functions da Vercel têm IP dinâmico).

## Status dos testes (24/06/2026)
| Item | Resultado |
|---|---|
| Utmify orders (pending/paid + UTMs) | ✅ validado (HTTP 200 SUCCESS) |
| MongoDB (insert/read/update) | ✅ validado |
| `markPaid` idempotente + Utmify(paid) | ✅ validado |
| `genCpf` mod-11 (1000×) | ✅ válido |
| BRPix auth HMAC | ✅ validado (404 esperado) |
| **BRPix cash-in (criar cobrança)** | ✅ **validado** (HTTP 202, QR real) — habilitado pela BRPix em 24/06 |
| **Fluxo completo de criação** (cash-in + Mongo + Utmify pending) | ✅ validado ponta a ponta |

> A resposta da BRPix é **flat e HTTP 202** (≠ doc, que mostrava `pix:{}`). `lib/brpix.js` normaliza.
> Ver `referencias/api-pix/brpix-api.md`.

### Ainda não testado (precisa de pagamento real)
- **Webhook `charge.paid`**: só dispara quando alguém paga um PIX. A verificação de assinatura é HMAC
  padrão; além disso, o **polling de status** (`/api/checkout/status` → `getCharge`) confirma o
  pagamento como **fallback** mesmo se o webhook falhar. Validar pagando um PIX de R$1 após o deploy.

## Passos restantes
1. **Deploy:** push + configurar **env vars na Vercel** (mesmas do `.env.local`) + `0.0.0.0/0` no Atlas.
2. **Testar em produção:** abrir `/checkout/?step=front`, gerar PIX; pagar R$1 → confirmar webhook +
   Utmify(paid). (O polling cobre se o webhook falhar.)
3. **Wire do funil:** trocar o destino dos botões de compra (componente `V1` + links hardcoded de
   acesso/back) de `https://app.cashnopixbr.site/c/...` para `/checkout/?step=<etapa>&next=<próxima>`.
   Fazer por último, após o checkout estar validado em produção.
4. `DEV/mock` desligado em produção (já é o padrão; `?mock=1` é opt-in).
