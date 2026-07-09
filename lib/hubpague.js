"use strict";
/* Cliente HubPague — API PIX (Bearer token). Ref: docs/checkout/referencias/api-pix/hubpague-api.md
   Substitui a BRPix (descontinuada aqui em 08/07/2026). */

var BASE = process.env.HUBPAGUE_BASE_URL || "https://app.hubpague.io/api";
var TOKEN = process.env.HUBPAGUE_API_TOKEN;

function headers() {
  return {
    "Authorization": "Bearer " + TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
}

/* Cria cobrança PIX. body: { amount, external_id, code, customer:{name,email,phone,document} }
   Resposta real (HTTP 200): { id, total, status:"pending", customer, products,
   pix:{ qrcode:<data:image/png;base64,...>, end2EndId, copypaste } }.
   Não há expires_at (o front usa o fallback de 60min). Normalizamos p/ o shape do checkout. */
async function createPayment(body) {
  var payload = {
    amount: body.amount,
    method: "pix",
    external_id: body.external_id,
    customer: {
      name: body.customer.name,
      email: body.customer.email,
      phone: body.customer.phone,
      document: { type: "CPF", value: body.customer.document }
    },
    products: [
      { name: body.code, price: body.amount, quantity: 1, type: "digital" }
    ]
  };
  var res = await fetch(BASE + "/payments", {
    method: "POST", headers: headers(), body: JSON.stringify(payload)
  });
  var data = await res.json().catch(function () { return {}; });
  var pix = data.pix || {};
  return {
    ok: res.ok && !!data.id, status: res.status, raw: data,
    txid: data.id || null,
    qr_code: pix.copypaste || null,
    qr_code_image: pix.qrcode || null,
    expires_at: null,
    error: res.ok ? null : (data.message || JSON.stringify(data).slice(0, 200))
  };
}

/* Consulta uma transação por id (polling / verificação de webhook).
   Resposta: { status:"success", data:{ id, status:"pending|paid|failed|...", ... } }. */
async function getTransaction(id) {
  var res = await fetch(BASE + "/transactions/" + encodeURIComponent(id), { headers: headers() });
  var data = await res.json().catch(function () { return {}; });
  var tx = data.data || {};
  return { ok: res.ok, status: res.status, txStatus: tx.status || null, data: tx };
}

module.exports = { createPayment: createPayment, getTransaction: getTransaction };
