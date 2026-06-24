# BRPix — API PIX (referência)

> Documentação fornecida pela BRPix (holding brpix; intermediadora **somente API**, sem checkout).
> Salvo em 2026-06-24. Para o checkout usamos principalmente **Cash-In** (receber pagamento).

## Base URL
```
Produção: https://api.brpixsolutions.com
```
> ⚠️ Documentação **não menciona URL de sandbox/teste** — confirmar com a BRPix (ver "Pendências").

---

## Autenticação — HMAC-SHA256

Toda requisição (endpoints de integração) exige 4 headers:

| Header | Valor |
|---|---|
| `X-API-Key` | sua **public_key** |
| `X-Timestamp` | unix epoch em **segundos** |
| `X-Nonce` | **UUID** único por requisição (single-use) |
| `X-Signature` | `hex(HMAC-SHA256(signing_payload, secret_key))` |

**Signing payload:**
```
METHOD|PATH|TIMESTAMP|NONCE|BODY
```
- `BODY` = string JSON **bruta** (exatamente os bytes enviados); **string vazia** em GET.
- A assinatura precisa ser sobre **o mesmo string** que vai no corpo da request.

```js
const crypto = require("crypto");

function buildHeaders(method, path, body, secretKey, publicKey) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const bodyStr = body ? JSON.stringify(body) : "";
  const payload = `${method}|${path}|${timestamp}|${nonce}|${bodyStr}`;
  const signature = crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
  return {
    "X-API-Key": publicKey,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": signature,
    "Content-Type": "application/json"
  };
}
```
> Cuidado: o `bodyStr` assinado tem que ser **idêntico** ao `body` enviado no `fetch`
> (mesmo `JSON.stringify`). Não re-serializar diferente.

---

## Cash-In (receber) — criar cobrança PIX  ⭐ (núcleo do checkout)

`POST /pix/cash-in` (HMAC). *(Existe `/api/v1/pix/cash-in` via sessão dashboard — NÃO usar; para
integração é sempre `/pix/cash-in`.)*

**Body params:**
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `amount` | number | ✅ | Valor em **centavos** (1000 = R$10,00) |
| `description` | string | — | Descrição exibida ao pagador |
| `external_id` | string | — | Seu ID de referência único |
| `external_reference` | string | — | Seu ID interno (**retornado no webhook `charge.paid`**) |
| `expires_in` | string | — | Expiração em **segundos** (default 3600) |

> ⚠️ **Não há campos de cliente** (nome/email/CPF/telefone) **nem de UTM/metadata** no cash-in.
> O pagador é quem escaneia o QR; os dados dele chegam só no webhook `charge.paid`
> (`payer_name`, `payer_doc`...). Implicação importante em "Análise" abaixo.

**Resposta 200:**
```json
{
  "id": "92095db2-...",
  "txid": "92095db2-...",
  "status": "PENDING",
  "amount": 1500,
  "description": "Order #1234",
  "external_id": "order_1234",
  "pix": {
    "qr_code": "00020126580014br.gov.bcb.pix0136...",   // copia-e-cola
    "qr_code_image": "data:image/png;base64,iVBOR...",   // imagem do QR
    "expires_at": "2026-03-25T16:00:00-03:00"
  },
  "created_at": "2026-03-25T15:00:00-03:00",
  "expires_at": "2026-03-25T16:00:00-03:00"
}
```

---

## Consultar status (polling) — `GET /pix/charge/{txid}`
HMAC (GET → BODY vazio no payload de assinatura). Retorna status atual da cobrança.
Usado para **polling** enquanto o webhook não chega / fallback.

```js
const path = `/pix/charge/${txid}`;
const headers = buildHeaders("GET", path, null, SECRET, PUBLIC);
const res = await fetch(`https://api.brpixsolutions.com${path}`, { headers });
```

---

## Webhook — notificação em tempo real ⭐

- Configurado via **Dashboard** (API Keys) ou `POST /api/v1/webhooks/config` (Basic Auth de sessão).
- HMAC-SHA256 **sempre** ativo; secret de assinatura **auto-gerado** por webhook (não desativável).
- Verificar **sempre** o header `X-BRPix-Signature` no servidor.

**Eventos:** `charge.paid`, `charge.expired`, `charge.refunded`, `withdraw.completed`, `withdraw.failed`.

**Verificação de assinatura:**
```js
function verifySignature(payload, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**Payload `charge.paid` (o que importa pro checkout):**
```json
{
  "event": "charge.paid",
  "timestamp": "2026-01-15T10:23:08-03:00",
  "data": {
    "txid": "f1b2e3d4-...",
    "charge_id": "a1b2c3d4-...",
    "amount": 7500,
    "status": "PAID",
    "end_to_end": "E1234...",
    "external_id": null,
    "external_reference": "pedido_9876",   // ← nosso ID, correlaciona com a venda
    "description": "Order #1234",
    "payer_name": "CARLOS ALBERTO SOUZA",
    "payer_doc": "12345678900",
    "payer_doc_type": "CPF",
    "payer": { "name": "...", "document": "...", "bank_account": { "ispb": "...", "institution": "..." } }
  }
}
```

---

## Ciclo de status
- **Charge:** `PENDING → PAID / EXPIRED / CANCELLED`
- **Cash-out:** `PENDING → COMPLETED / FAILED`
- **Refund:** `REQUESTED → PROCESSING → COMPLETED / FAILED`

## Erros & rate limit
- HTTP: 400 / 401 / 403 / 404 / 422 / 429 / 500. Corpo: `{ "error": { code, message, status } }`.
- Rate limit por API key: **cash-in 100/min**, cash-out 30/min. 429 ao exceder.
  Headers `X-RateLimit-Limit / Remaining / Reset` em toda resposta.

---

## Outros endpoints (não usados no checkout agora)
- **Cash-Out (saque):** `POST /pix/cash-out` — `{ amount, pix_key, pix_key_type }`.
- **Transaction detail:** `GET /api/v1/transactions/{id}` (Basic Auth de sessão).

---

## Pendências / a confirmar com a BRPix
1. **Sandbox/teste:** existe ambiente de testes? Ou testamos com valores reais baixos?
2. **`X-BRPix-Signature`:** o `payload` verificado é o **corpo bruto** da request do webhook? Header em hex?
3. **Idempotência:** o webhook pode chegar **duplicado**? (tratar via `txid`/`external_reference`).
4. **Reembolso:** endpoint de refund (mencionado só no ciclo de status, sem rota/payload).
