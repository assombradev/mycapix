"use strict";
/* Fonte da verdade dos preços/produtos por etapa — resolvido SEMPRE no servidor.
   O browser manda só `step` (e `tier` no upsell3); nunca o valor. */

var STEPS = {
  front:   { mode: "front",  amount: 3700, description: "Ativação de cadastro", productName: "Ativação de cadastro" },
  back1:   { mode: "front",  amount: 2700, description: "Ativação de cadastro", productName: "Ativação de cadastro" },
  back2:   { mode: "front",  amount: 1990, description: "Ativação de cadastro", productName: "Ativação de cadastro" },
  upsell1: { mode: "upsell", amount: 6700, description: "Taxa anti-fraude",     productName: "Taxa anti-fraude" },
  upsell2: { mode: "upsell", amount: 4893, description: "Taxa IOF",             productName: "Taxa IOF" },
  dws1:    { mode: "upsell", amount: 4700, description: "Oferta especial",      productName: "Oferta especial" },
  "upsell3:silver":  { mode: "upsell", amount: 6700, description: "Plano Silver",  productName: "Plano Silver" },
  "upsell3:gold":    { mode: "upsell", amount: 9700, description: "Plano Gold",    productName: "Plano Gold" },
  "upsell3:diamond": { mode: "upsell", amount: 5700, description: "Plano Diamond", productName: "Plano Diamond" }
};

function resolveStep(step, tier) {
  var key = step || "front";
  if (key === "upsell3" && tier) key = "upsell3:" + tier;
  return STEPS[key] ? { key: key, cfg: STEPS[key] } : null;
}

module.exports = { STEPS: STEPS, resolveStep: resolveStep };
