"use strict";
/* Marca um pedido como pago de forma IDEMPOTENTE e envia Utmify(paid) uma única vez.
   Usado pelo webhook (charge.paid) e pelo polling de status (fallback). */
var mongo = require("./mongo");
var utmify = require("./utmify");

module.exports = async function markPaid(ref, source) {
  var col = await mongo.getOrders();
  var now = new Date();

  // Transição atômica pending -> paid (só o primeiro vencedor envia à Utmify)
  var upd = await col.findOneAndUpdate(
    { _id: ref, status: { $ne: "paid" } },
    { $set: { status: "paid", paidAt: now, paidSource: source || "unknown" } },
    { returnDocument: "after" }
  );
  var order = upd && (upd.value || upd); // compat driver
  if (!order || !order._id) {
    // já estava pago (ou não existe) — nada a fazer
    return { alreadyPaid: true };
  }

  // Envia Utmify(paid) apenas se ainda não enviou
  if (!order.utmifySent || !order.utmifySent.paid) {
    try {
      var r = await utmify.sendOrder({
        orderId: order._id,
        productId: order.funnelStep,
        productName: order.productCode || order.productName,
        amount: order.amount,
        customer: { name: order.customer.name, email: order.customer.email, phone: order.customer.phone, document: order.customer.document },
        utms: order.utms,
        status: "paid",
        createdAt: order.createdAt || now,
        approvedDate: now,
        isTest: process.env.UTMIFY_TEST === "true"
      });
      if (r.ok) await col.updateOne({ _id: ref }, { $set: { "utmifySent.paid": true } });
      else console.error("[markPaid] utmify recusou", r.status, JSON.stringify(r.data).slice(0, 200));
    } catch (e) { console.error("[markPaid] utmify erro", e.message); }
  }
  return { ok: true, order: order };
};
