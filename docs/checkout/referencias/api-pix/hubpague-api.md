# HubPague — Referência da API PIX (gateway ATUAL desde 08/07/2026)

Substituiu a **BRPix** (ver `brpix-api.md`, descontinuada aqui). Cliente: `lib/hubpague.js`.

- **Base URL:** `https://app.hubpague.io/api` (env `HUBPAGUE_BASE_URL`)
- **Autenticação:** `Authorization: Bearer <token>` (env `HUBPAGUE_API_TOKEN`) + `Content-Type: application/json`.
  É a **única credencial** — não há chave pública/HMAC.

## Criar cobrança — `POST /payments`

Payload que enviamos (campos obrigatórios da HubPague):

```json
{
  "amount": 599,
  "method": "pix",
  "external_id": "cnp_<step>_<uuid>",
  "customer": {
    "name": "<nome real do cliente>",
    "email": "<email gerado (orders.genEmail)>",
    "phone": "<telefone real, dígitos puros — aceito>",
    "document": { "type": "CPF", "value": "<CPF gerado mod-11, dígitos puros — aceito>" }
  },
  "products": [
    { "name": "<code camuflado offerNNN>", "price": 599, "quantity": 1, "type": "digital" }
  ]
}
```

- `type: "digital"` **dispensa o bloco `delivery`** (só é obrigatório com produto `physical`).
- Telefone e CPF **aceitam dígitos puros** (testado 08/07/2026); não precisa formatar.

**Resposta real (HTTP 200)** — observações vs. a doc oficial:

```json
{
  "id": "QN7DEX0QZDRP",
  "total": 599,
  "method": "pix",
  "status": "pending",
  "pix": {
    "qrcode": "data:image/png;base64,iVBORw0K...",
    "end2EndId": "",
    "copypaste": "00020101021226830014br.gov.bcb.pix..."
  }
}
```

- **`pix.qrcode` vem PREENCHIDO** com a imagem do QR em data-URI PNG base64 (a doc oficial mostra
  vazio no exemplo, mas na prática vem) → usamos direto no `<img src>` do checkout, sem gerar QR.
- **Não há `expires_at`** → o front usa o fallback de 60 min do contador.
- O `external_id` **não é ecoado** na resposta do POST nem no GET — só volta no **webhook**.
- Erro de validação = HTTP 422 com `{ "campo": ["mensagem"] }`; erro geral = HTTP 400
  `{ "status": "error", "message": "..." }`.

## Consultar transação — `GET /transactions/{id}`

Resposta: `{ "status": "success", "data": { ..., "status": "pending" } }` — o status da transação
fica em `data.status`, **minúsculo**: `processing | pending | paid | failed | returned | cancelled | blocked | med`.

## Webhook (atualização de status)

- URL cadastrada **no painel** da HubPague: `https://cashnopixbr.site/api/webhooks/hubpague`.
- POST JSON com `notification_type: "transaction"`, `id`, `external_id`, `status`, customer etc.
- ⚠️ **SEM assinatura/secret** (o painel não fornece). Por isso o handler
  (`api/webhooks/hubpague.js`) **nunca confia no payload**: localiza o pedido
  (`external_id` → fallback `txid`), confere `order.txid === evt.id` e **re-consulta**
  `GET /transactions/{id}` com o nosso token — só marca pago se a API confirmar `paid`.
  Testado: webhook forjado com `status:"paid"` é rejeitado (log "paid não confirmado na API").
