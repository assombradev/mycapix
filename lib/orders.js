"use strict";
/* Helpers de pedido: id externo, CPF/email genéricos (p/ Utmify), saneamento. */
var crypto = require("crypto");

function genExternalRef(stepKey) {
  return "cnp_" + String(stepKey).replace(/[^a-z0-9]+/gi, "-") + "_" + crypto.randomUUID();
}

/* Gera um CPF estruturalmente válido (dígitos mod-11) — a Utmify pede CPF; a BRPix não usa. */
function genCpf() {
  var n = [];
  for (var i = 0; i < 9; i++) n.push(Math.floor(Math.random() * 10));
  function dig(arr) {
    var f = arr.length + 1, sum = 0;
    for (var i = 0; i < arr.length; i++) sum += arr[i] * (f - i);
    var r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  }
  n.push(dig(n));
  n.push(dig(n));
  return n.join("");
}

function genEmail(ref) {
  return "pedido+" + String(ref).slice(-16) + "@cashnopixbr.site";
}

/* Saneia o cliente vindo do browser (nome/telefone/chave PIX reais). */
function sanitizeCustomer(c) {
  c = c || {};
  return {
    name: String(c.name || "").trim().slice(0, 120),
    phone: String(c.phone || "").replace(/\D/g, "").slice(0, 13),
    pixKey: String(c.pixKey || "").trim().slice(0, 140)
  };
}

/* Filtra apenas chaves UTM/tracking conhecidas. */
var UTM_KEYS = ["src", "sck", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
function pickUtms(obj) {
  obj = obj || {};
  var out = {};
  UTM_KEYS.forEach(function (k) { if (obj[k]) out[k] = String(obj[k]).slice(0, 200); });
  return out;
}

module.exports = {
  genExternalRef: genExternalRef,
  genCpf: genCpf,
  genEmail: genEmail,
  sanitizeCustomer: sanitizeCustomer,
  pickUtms: pickUtms
};
