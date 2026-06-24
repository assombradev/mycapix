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
| **BRPix cash-in (criar cobrança)** | ❌ **HTTP 500 `BRPIX_ERROR`** no lado da BRPix |

### ⚠️ Blocker externo: BRPix cash-in 500
O `POST /pix/cash-in` retorna 500 (`"Erro ao processar cobrança Pix na BRPix"`) para qualquer payload
— erro de servidor da BRPix, não do nosso código. **Abrir chamado** no suporte BRPix (protocolos:
`BRP-20260624-221849-AEWB`, `-221939-NIX6`, `-221941-FCHB`, `-221943-KDEI`) perguntando se a conta
está **habilitada para cash-in (recebimento)**. Sem isso, não dá para gerar o PIX.

## Passos restantes (após BRPix liberar o cash-in)
1. Testar `criar-pix` real (gera QR) + receber o webhook `charge.paid` (validar assinatura).
2. **Wire do funil:** trocar o destino dos botões de compra (componente `V1` + links hardcoded de
   acesso/back) de `https://app.cashnopixbr.site/c/...` para `/checkout/?step=<etapa>&next=<próxima>`.
   **Só fazer depois** que o cash-in funcionar (senão quebra a compra em produção).
3. Configurar as env vars na Vercel + `0.0.0.0/0` no Atlas.
4. `DEV/mock` desligado em produção (já é o padrão; `?mock=1` é opt-in).
