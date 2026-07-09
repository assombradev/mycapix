"use strict";
/* GET /api/checkout/status?ref=<externalReference>
   Retorna o status do pedido. Como fallback (caso o webhook atrase), consulta a HubPague
   e, se já estiver pago, marca pago + dispara Utmify(paid) de forma idempotente. */

var hubpague = require("../../lib/hubpague");
var mongo = require("../../lib/mongo");
var markPaid = require("../../lib/markPaid");

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.status(405).json({ error: "method_not_allowed" }); return; }
  var ref = (req.query && req.query.ref) || new URL(req.url, "http://x").searchParams.get("ref");
  if (!ref) { res.status(400).json({ error: "missing_ref" }); return; }

  try {
    var col = await mongo.getOrders();
    var order = await col.findOne({ _id: ref });
    if (!order) { res.status(404).json({ error: "not_found" }); return; }

    if (order.status === "pending" && order.txid) {
      // fallback: confirma direto na HubPague (status minúsculo: pending/paid/failed/...)
      try {
        var charge = await hubpague.getTransaction(order.txid);
        var st = charge.txStatus;
        if (st === "paid") { await markPaid(ref, "polling"); order.status = "paid"; }
        else if (st === "failed" || st === "cancelled") { await col.updateOne({ _id: ref }, { $set: { status: "expired" } }); order.status = "expired"; }
      } catch (e) { /* ignora erro de polling; devolve o status atual */ }
    }

    res.status(200).json({ status: order.status });
  } catch (err) {
    console.error("[status] erro", err);
    res.status(500).json({ error: "internal" });
  }
};
