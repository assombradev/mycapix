"use strict";
/* POST /api/webhooks/hubpague
   Recebe notificações de transação da HubPague (notification_type: "transaction").
   A HubPague NÃO assina o webhook (sem secret/assinatura no painel), então NUNCA
   confiamos no payload: antes de marcar pago, re-consultamos a transação na API
   (com o nosso token) e conferimos que o status lá é "paid" e que o id bate com
   o txid do pedido. Um webhook forjado não passa dessa verificação. */

var hubpague = require("../../lib/hubpague");
var mongo = require("../../lib/mongo");
var markPaid = require("../../lib/markPaid");

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
  if (req.method !== "POST") { res.status(405).end(); return; }
  try {
    var evt = await readBody(req);
    if (evt.notification_type !== "transaction" || !evt.id) {
      res.status(200).json({ received: true }); return;
    }

    // Localiza o pedido: preferindo external_id (nosso ref); fallback pelo txid.
    var col = await mongo.getOrders();
    var order = null;
    if (evt.external_id) order = await col.findOne({ _id: evt.external_id });
    if (!order) order = await col.findOne({ txid: evt.id });
    if (!order) { res.status(200).json({ received: true }); return; }

    // O txid do pedido tem que bater com o id notificado.
    if (order.txid !== evt.id) {
      console.warn("[webhook hubpague] txid divergente", order._id, evt.id);
      res.status(200).json({ received: true }); return;
    }

    if (evt.status === "paid" && order.status !== "paid") {
      // Verificação server-side obrigatória (webhook sem assinatura).
      var tx = await hubpague.getTransaction(order.txid);
      if (tx.ok && tx.txStatus === "paid") {
        await markPaid(order._id, "webhook");
      } else {
        console.warn("[webhook hubpague] paid não confirmado na API", order._id, tx.status, tx.txStatus);
      }
    } else if ((evt.status === "failed" || evt.status === "cancelled") && order.status === "pending") {
      await col.updateOne({ _id: order._id, status: { $ne: "paid" } }, { $set: { status: "expired" } });
    }
    // Demais status (processing/returned/blocked/med) só logamos por enquanto.
    else if (evt.status && evt.status !== "paid" && evt.status !== "pending") {
      console.log("[webhook hubpague] status", evt.status, order._id);
    }

    // Sempre 200 rápido para a HubPague não re-tentar à toa.
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook hubpague] erro", err);
    res.status(200).json({ received: true }); // evita retries infinitos; já logamos
  }
};
