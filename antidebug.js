(function () {
  var _url = 'https://www.youtube.com/shorts/leVBxu2QsuI';
  var _fired = false;

  function _redirect() {
    if (_fired) return;
    _fired = true;
    document.documentElement.innerHTML = '';
    window.location.replace(_url);
  }

  // Método 1: diferença de tamanho de janela (DevTools aberto/encaixado)
  function _checkSize() {
    if (
      window.outerWidth - window.innerWidth > 100 ||
      window.outerHeight - window.innerHeight > 100
    ) {
      _redirect();
    }
  }

  // Método 2: getter no console — dispara quando o objeto é inspecionado
  var _probe = new Image();
  Object.defineProperty(_probe, 'id', { get: function () { _redirect(); } });

  // Método 3: timing do debugger — DevTools aberto aumenta o tempo de execução
  function _checkTiming() {
    var t = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - t > 50) { _redirect(); }
  }

  // Bloqueia F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
  document.addEventListener('keydown', function (e) {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) ||
      (e.ctrlKey && e.keyCode === 85)
    ) {
      e.preventDefault();
      e.stopPropagation();
      _redirect();
      return false;
    }
  }, true);

  // Bloqueia clique direito
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // Verificação inicial
  _checkSize();
  _checkTiming();

  // Polling a cada 500ms
  setInterval(function () {
    _checkSize();
    console.log('%c', _probe);
  }, 500);
})();
