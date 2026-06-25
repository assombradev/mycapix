"use strict";
/* DIAGNÓSTICO TEMPORÁRIO — remover após resolver a conexão Mongo na Vercel.
   GET /api/checkout/diag -> reporta presença de env vars + resultado da conexão Mongo. */
var mongo = require("../../lib/mongo");

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  var uri = process.env.MONGODB_URI || "";
  var env = {
    BRPIX_PUBLIC_KEY: !!process.env.BRPIX_PUBLIC_KEY,
    BRPIX_SECRET_KEY: !!process.env.BRPIX_SECRET_KEY,
    BRPIX_WEBHOOK_SECRET: !!process.env.BRPIX_WEBHOOK_SECRET,
    UTMIFY_API_TOKEN: !!process.env.UTMIFY_API_TOKEN,
    MONGODB_URI_set: !!uri,
    MONGODB_DB: process.env.MONGODB_DB || null,
    MONGODB_URI_preview: uri.replace(/\/\/[^@]*@/, "//***:***@").slice(0, 70)
  };
  var mongoResult;
  try {
    var col = await mongo.getOrders();
    var n = await col.estimatedDocumentCount();
    mongoResult = { ok: true, count: n };
  } catch (e) {
    mongoResult = { ok: false, name: e.name, message: String(e.message).slice(0, 300) };
  }
  res.status(200).json({ env: env, mongo: mongoResult });
};
