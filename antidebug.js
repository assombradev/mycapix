(function () {
  // ===================================================================
  // KILL-SWITCH TEMPORARIO — coloque false para REATIVAR a proteção.
  // Enquanto true, NADA é executado: sem redirect, sem bloqueio de
  // teclas (F12 etc.) e sem bloqueio de clique direito. Use para testar
  // as páginas com o DevTools/console abertos.
  // LEMBRE de voltar para false antes de subir para produção!
  var _DISABLED = false;
  if (_DISABLED) return;
  // ===================================================================

  var _url = 'https://www.youtube.com/shorts/leVBxu2QsuI';
  var _fired = false;

  function _redirect() {
    if (_fired) return;
    _fired = true;
    window.location.replace(_url);
  }

  // Só executa em desktop — mobile não tem DevTools
  var _isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (_isMobile) return;

  // Detecta DevTools encaixado na lateral (muda a largura)
  function _checkDevTools() {
    if (window.outerWidth - window.innerWidth > 200) {
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
