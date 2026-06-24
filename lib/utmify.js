"use strict";
/* Cliente Utmify — API de orders (server-side). Validado 24/06/2026:
   POST https://api.utmify.com.br/api-credentials/orders  (header x-api-token)
   -> 200 {"OK":true,"result":"SUCCESS"} */

var ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";
var TOKEN = process.env.UTMIFY_API_TOKEN;

/* Data UTC no formato "YYYY-MM-DD HH:MM:SS" exigido pela Utmify. */
function utcStamp(date) {
  return (date || new Date()).toISOString().slice(0, 19).replace("T", " ");
}

/* Envia/atualiza um pedido na Utmify.
   order: { orderId, productId, productName, amount(cents), customer{name,email,phone,document},
            utms{...}, status:"waiting_payment"|"paid", createdAt(Date), approvedDate(Date|null) } */
async function sendOrder(order) {
  var t = order.utms || {};
  var payload = {
    orderId: order.orderId,
    platform: "CashNoPix",
    paymentMethod: "pix",
    status: order.status,
    createdAt: utcStamp(order.createdAt),
    approvedDate: order.approvedDate ? utcStamp(order.approvedDate) : null,
    refundedAt: null,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone || null,
      document: order.customer.document || null,
      country: "BR"
    },
    products: [{
      id: order.productId,
      name: order.productName,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: order.amount
    }],
    trackingParameters: {
      src: t.src || null,
      sck: t.sck || null,
      utm_source: t.utm_source || null,
      utm_campaign: t.utm_campaign || null,
      utm_medium: t.utm_medium || null,
      utm_content: t.utm_content || null,
      utm_term: t.utm_term || null
    },
    commission: {
      totalPriceInCents: order.amount,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount,
      currency: "BRL"
    },
    isTest: !!order.isTest
  };

  var res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-api-token": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  var data = await res.json().catch(function () { return {}; });
  return { ok: res.ok, status: res.status, data: data };
}

module.exports = { sendOrder: sendOrder, utcStamp: utcStamp };
