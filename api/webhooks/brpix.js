"use strict";
/* POST /api/webhooks/brpix
   Recebe eventos da BRPix (charge.paid / charge.expired), valida a assinatura HMAC
   (X-BRPix-Signature sobre o corpo BRUTO) e atualiza o pedido + Utmify(paid). */

var brpix = require("../../lib/brpix");
var mongo = require("../../lib/mongo");
var markPaid = require("../../lib/markPaid");

function readRaw(req) {
  return new Promise(function (resolve) {
    var d = ""; req.on("data", function (c) { d += c; });
    req.on("end", function () { resolve(d); });
    req.on("error", function () { resolve(""); });
  });
}

module.exports = async function (req, res) {
  if (req.method !== "POST") { res.status(405).end(); return; }
  try {
    var raw = await readRaw(req);
    var sig = req.headers["x-brpix-signature"] || req.headers["X-BRPix-Signature"];
    if (!brpix.verifyWebhook(raw, sig)) {
      console.warn("[webhook] assinatura inválida");
      res.status(401).json({ error: "invalid_signature" });
      return;
    }

    var evt = {};
    try { evt = JSON.parse(raw || "{}"); } catch (e) { res.status(400).json({ error: "bad_json" }); return; }

    var data = evt.data || {};
    var ref = data.external_reference;

    if (evt.event === "charge.paid" && ref) {
      await markPaid(ref, "webhook");
    } else if (evt.event === "charge.expired" && ref) {
      try { var col = await mongo.getOrders(); await col.updateOne({ _id: ref, status: { $ne: "paid" } }, { $set: { status: "expired" } }); }
      catch (e) { console.error("[webhook] expire", e.message); }
    }

    // Sempre 200 rápido para a BRPix não re-tentar à toa.
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook] erro", err);
    res.status(200).json({ received: true }); // evita retries infinitos; já logamos
  }
};

// Desliga o body parser da Vercel para receber o corpo BRUTO (necessário p/ a assinatura).
// Definido APÓS o module.exports do handler para não ser sobrescrito.
module.exports.config = { api: { bodyParser: false } };
