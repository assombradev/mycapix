(function (window) {
    loadUpsellData();
})(this);

function loadUpsellData() {
    var urlParams = new URLSearchParams(window.location.search);
    var venda = urlParams.get('fpay');
    var domain = urlParams.get('domain');

    var newDomain = (typeof domain !== 'undefined' && domain !== null && domain !== 'null') ? domain : '';
    var fpay = (typeof venda !== 'undefined' && venda !== null && venda !== 'null') ? venda : '';

    var upsells = document.querySelectorAll('[data-fornpay]') || [];
    upsells.forEach(upsell => {
        var hash_upsell = upsell.getAttribute('data-fornpay');

        // Remover a verificação de compra anterior
        upsell.addEventListener('click', event => {
            if (event.target.innerHTML === "Liberar saque") {
                window.location.href = "https://app.cashnopixbr.site/payment/checkout/c84e9ceb-266d-419d-9c63-7c5e4b5acdc2";
                return;
            }

            event.target.innerHTML = "Aguarde, processando pagamento...";
            event.target.remove();

            window.location.href = `${newDomain}/process-upsell?uh=${hash_upsell}&fpay=${venda}&domain=${newDomain}`;
        });
    });

    var downsell = document.querySelectorAll('[data-downsell]') || [];
    downsell.forEach(downsell => {
        var url_downsell = downsell.getAttribute('data-downsell');

        // Adicionar verificação para o botão "QUERO DESBLOQUEAR MEU SALDO"
        downsell.addEventListener('click', event => {
            if (event.target.innerHTML === "QUERO DESBLOQUEAR MEU SALDO") {
                window.location.href = "https://app.cashnopixbr.site/payment/checkout/31282adb-043d-4d3f-82b4-b9fe609a7b12";
                return;
            }

            event.target.innerHTML = "Aguarde, processando pagamento...";
            event.target.remove();

            window.location.href = `${url_downsell}?fpay=${venda}&domain=${newDomain}`;
        });
    });
}