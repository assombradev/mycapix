"use strict";
/* POST /api/checkout/criar-pix
   body: { step, tier?, customer:{name,phone,pixKey}, utms:{...} }
   -> cria cobrança BRPix + salva pedido (Mongo) + Utmify(waiting_payment) -> { ref, txid, qr_code, qr_code_image, expires_at } */

var prices = require("../../lib/prices");
var brpix = require("../../lib/brpix");
var utmify = require("../../lib/utmify");
var orders = require("../../lib/orders");
var mongo = require("../../lib/mongo");

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); } }
  return new Promise(function (resolve) {
    var d = ""; req.on("data", function (c) { d += c; });
    req.on("end", function () { try { resolve(JSON.parse(d || "{}")); } catch (e) { resolve({}); } });
    req.on("error", function () { resolve({}); });
  });
}

module.exports = async function (req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  try {
    var body = await readBody(req);
    var resolved = prices.resolveStep(body.step, body.tier);
    if (!resolved) { res.status(400).json({ error: "invalid_step" }); return; }

    var cfg = resolved.cfg;
    var customer = orders.sanitizeCustomer(body.customer);
    // front exige dados; upsell deveria reusar os salvos, mas validamos o mínimo sempre.
    if (!customer.name || customer.phone.length < 10 || !customer.pixKey) {
      res.status(400).json({ error: "invalid_customer" }); return;
    }

    var ref = orders.genExternalRef(resolved.key);
    var cpf = orders.genCpf();
    var email = orders.genEmail(ref);
    var utms = orders.pickUtms(body.utms);

    // 1) Cria a cobrança na BRPix (resposta normalizada no lib).
    //    description = code camuflado (offerNNN), não o nome real.
    var charge = await brpix.createCashIn({
      amount: cfg.amount,
      description: cfg.code,
      external_reference: ref,
      expires_in: "3600"
    });
    if (!charge.ok || (!charge.qr_code && !charge.qr_code_image)) {
      res.status(502).json({ error: "brpix_failed", detail: charge.error });
      return;
    }
    var txid = charge.txid;

    // 2) Persiste o pedido (correlação do webhook)
    var now = new Date();
    var orderDoc = {
      _id: ref, externalReference: ref, txid: txid,
      funnelStep: resolved.key, amount: cfg.amount,
      productName: cfg.productName, productCode: cfg.code,
      status: "pending",
      customer: { name: customer.name, phone: customer.phone, pixKey: customer.pixKey, email: email, document: cpf },
      utms: utms,
      utmifySent: { pending: false, paid: false },
      createdAt: now, paidAt: null
    };
    try {
      var col = await mongo.getOrders();
      await col.insertOne(orderDoc);
    } catch (e) { /* não bloqueia o checkout se o Mongo falhar; loga */ console.error("[criar-pix] mongo", e.message); }

    // 3) Utmify — pedido pendente. AWAIT obrigatório: em serverless a função congela
    //    assim que responde, então um .then() fire-and-forget nunca completaria.
    try {
      var up = await utmify.sendOrder({
        orderId: ref, productId: resolved.key, productName: cfg.code, amount: cfg.amount,
        customer: { name: customer.name, email: email, phone: customer.phone, document: cpf },
        utms: utms, status: "waiting_payment", createdAt: now, approvedDate: null,
        isTest: process.env.UTMIFY_TEST === "true"
      });
      if (up.ok) await mongoMark(ref, "utmifySent.pending", true);
      else console.error("[criar-pix] utmify pending HTTP", up.status, JSON.stringify(up.data).slice(0, 150));
    } catch (e) { console.error("[criar-pix] utmify", e.message); }

    // 4) Responde ao browser
    res.status(200).json({
      ref: ref, txid: txid,
      qr_code: charge.qr_code,
      qr_code_image: charge.qr_code_image,
      expires_at: charge.expires_at
    });
  } catch (err) {
    console.error("[criar-pix] erro", err);
    res.status(500).json({ error: "internal" });
  }
};

async function mongoMark(ref, field, val) {
  try { var col = await mongo.getOrders(); var s = {}; s[field] = val; await col.updateOne({ _id: ref }, { $set: s }); }
  catch (e) { console.error("[mongoMark]", e.message); }
}
