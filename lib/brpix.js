"use strict";
/* Cliente BRPix — API PIX (HMAC-SHA256). Ref: docs/checkout/referencias/api-pix/brpix-api.md */
var crypto = require("crypto");

var BASE = process.env.BRPIX_BASE_URL || "https://api.brpixsolutions.com";
var PUBLIC = process.env.BRPIX_PUBLIC_KEY;
var SECRET = process.env.BRPIX_SECRET_KEY;
var WEBHOOK_SECRET = process.env.BRPIX_WEBHOOK_SECRET;

function buildHeaders(method, path, bodyStr) {
  var ts = Math.floor(Date.now() / 1000).toString();
  var nonce = crypto.randomUUID();
  var payload = method + "|" + path + "|" + ts + "|" + nonce + "|" + (bodyStr || "");
  var sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return {
    "X-API-Key": PUBLIC,
    "X-Timestamp": ts,
    "X-Nonce": nonce,
    "X-Signature": sig,
    "Content-Type": "application/json"
  };
}

/* Cria cobrança (cash-in). body: {amount, description, external_reference, expires_in?} */
async function createCashIn(body) {
  var path = "/pix/cash-in";
  var bodyStr = JSON.stringify(body);
  var res = await fetch(BASE + path, { method: "POST", headers: buildHeaders("POST", path, bodyStr), body: bodyStr });
  var data = await res.json().catch(function () { return {}; });
  return { ok: res.ok, status: res.status, data: data };
}

/* Consulta status da cobrança por txid (polling). */
async function getCharge(txid) {
  var path = "/pix/charge/" + encodeURIComponent(txid);
  var res = await fetch(BASE + path, { headers: buildHeaders("GET", path, "") });
  var data = await res.json().catch(function () { return {}; });
  return { ok: res.ok, status: res.status, data: data };
}

/* Verifica assinatura do webhook (header X-BRPix-Signature) sobre o corpo BRUTO. */
function verifyWebhook(rawBody, signature) {
  if (!signature || !WEBHOOK_SECRET) return false;
  var expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

module.exports = { buildHeaders: buildHeaders, createCashIn: createCashIn, getCharge: getCharge, verifyWebhook: verifyWebhook };
