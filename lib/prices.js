"use strict";
/* Fonte da verdade dos preços/produtos por etapa — resolvido SEMPRE no servidor.
   O browser manda só `step` (e `tier` no upsell3); nunca o valor. */

/* `code` = nome CAMUFLADO enviado à intermediadora (BRPix) e à Utmify.
   `productName` = nome real (uso interno/registro). A UI do checkout mostra os nomes reais
   (definidos no frontend), independente disto. */
var STEPS = {
  front:   { mode: "front",  amount: 3700, code: "offer001", productName: "Ativação de cadastro" },
  back1:   { mode: "front",  amount: 2700, code: "offer001", productName: "Ativação de cadastro" },
  back2:   { mode: "front",  amount: 1990, code: "offer001", productName: "Ativação de cadastro" },
  upsell1: { mode: "upsell", amount: 6700, code: "offer002", productName: "Taxa anti-fraude" },
  dws1:    { mode: "upsell", amount: 4700, code: "offer003", productName: "Oferta especial" },
  upsell2: { mode: "upsell", amount: 4893, code: "offer004", productName: "Taxa IOF" },
  "upsell3:silver":  { mode: "upsell", amount: 6700, code: "offer005", productName: "Plano Silver" },
  "upsell3:gold":    { mode: "upsell", amount: 9700, code: "offer006", productName: "Plano Gold" },
  "upsell3:diamond": { mode: "upsell", amount: 5700, code: "offer007", productName: "Plano Diamond" }
};

function resolveStep(step, tier) {
  var key = step || "front";
  if (key === "upsell3" && tier) key = "upsell3:" + tier;
  return STEPS[key] ? { key: key, cfg: STEPS[key] } : null;
}

module.exports = { STEPS: STEPS, resolveStep: resolveStep };
