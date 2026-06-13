(function () {
  var _url = 'https://www.youtube.com/shorts/leVBxu2QsuI';
  var _fired = false;

  function _redirect() {
    if (_fired) return;
    _fired = true;
    window.location.replace(_url);
  }

  // Detecta DevTools encaixado (docked) — só funciona em desktop
  // Threshold 200px evita falso positivo da barra do browser mobile
  function _checkDevTools() {
    if (
      window.outerWidth - window.innerWidth > 200 ||
      window.outerHeight - window.innerHeight > 200
    ) {
      _redirect();
    }
  }

  // Bloqueia atalhos de teclado que abrem DevTools
  document.addEventListener('keydown', function (e) {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
      (e.ctrlKey && e.keyCode === 85)
    ) {
      e.preventDefault();
      e.stopPropagation();
      _redirect();
      return false;
    }
  }, true);

  // Desabilita clique direito
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // Verifica a cada 1 segundo
  setInterval(_checkDevTools, 1000);
})();
