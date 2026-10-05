/*!
 * RenBotIA — widget de chat para sitios web.
 * Uso: <script src="https://renbotia.com/widget.js" data-key="TU_LLAVE" async></script>
 * Dibuja un botón flotante; al abrirlo carga el chat del negocio en un iframe.
 */
(function () {
  'use strict';
  if (window.__renbotiaWidget) return;

  var script =
    document.currentScript ||
    (function () {
      var all = document.querySelectorAll('script[data-key][src*="widget.js"]');
      return all[all.length - 1];
    })();
  if (!script) return;
  var key = script.getAttribute('data-key');
  if (!key || !/^[A-Za-z0-9_-]{16,40}$/.test(key)) return;
  window.__renbotiaWidget = true;

  var origin;
  try {
    origin = new URL(script.src, window.location.href).origin;
  } catch (e) {
    origin = 'https://renbotia.com';
  }

  var Z = 2147483000;
  var CHAT_ICON =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>';
  var CLOSE_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function textOn(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#fff';
    var n = parseInt(m[1], 16);
    var l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return l > 170 ? '#0f172a' : '#fff';
  }

  function css(el, styles) {
    for (var k in styles) el.style.setProperty(k, styles[k], 'important');
  }

  function mount(cfg) {
    var color = /^#[0-9a-f]{6}$/i.test(cfg.color || '') ? cfg.color : '#4f46e5';
    var side = cfg.position === 'left' ? 'left' : 'right';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var open = false;
    var loaded = false;

    // Botón flotante
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Abrir chat de ' + (cfg.businessName || 'atención'));
    btn.innerHTML = CHAT_ICON;
    css(btn, {
      position: 'fixed',
      bottom: '20px',
      width: '58px',
      height: '58px',
      'border-radius': '50%',
      border: '0',
      padding: '0',
      margin: '0',
      cursor: 'pointer',
      background: color,
      color: textOn(color),
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'box-shadow': '0 8px 24px rgba(15,23,42,.22)',
      'z-index': String(Z),
      transition: reduce ? 'none' : 'transform .18s cubic-bezier(.23,1,.32,1)',
    });
    btn.style.setProperty(side, '20px', 'important');
    btn.addEventListener('mouseenter', function () {
      btn.style.setProperty('transform', 'scale(1.05)', 'important');
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.setProperty('transform', 'none', 'important');
    });

    // Panel con el iframe (se carga la primera vez que se abre)
    var panel = document.createElement('div');
    css(panel, {
      position: 'fixed',
      bottom: '90px',
      width: '370px',
      height: '600px',
      'max-height': 'calc(100vh - 110px)',
      'border-radius': '16px',
      overflow: 'hidden',
      'box-shadow': '0 16px 48px rgba(15,23,42,.28)',
      'z-index': String(Z),
      display: 'none',
      opacity: '0',
      transform: 'translateY(8px) scale(.98)',
      'transform-origin': 'bottom ' + side,
      transition: reduce ? 'none' : 'opacity .2s ease, transform .2s cubic-bezier(.23,1,.32,1)',
      background: '#fff',
    });
    panel.style.setProperty(side, '20px', 'important');
    var frame = document.createElement('iframe');
    frame.title = 'Chat de ' + (cfg.businessName || 'atención');
    frame.setAttribute('allow', 'clipboard-write');
    css(frame, { width: '100%', height: '100%', border: '0', display: 'block' });
    panel.appendChild(frame);

    // Burbuja de saludo (una vez por visita)
    var bubble = null;
    if (cfg.greeting) {
      var seen = false;
      try {
        seen = sessionStorage.getItem('rb_w_greet') === '1';
      } catch (e) {}
      if (!seen) {
        bubble = document.createElement('div');
        bubble.textContent = cfg.greeting;
        bubble.setAttribute('role', 'status');
        css(bubble, {
          position: 'fixed',
          bottom: '88px',
          'max-width': '240px',
          padding: '10px 14px',
          'border-radius': '14px',
          background: '#fff',
          color: '#0f172a',
          font: '14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
          'box-shadow': '0 8px 24px rgba(15,23,42,.18)',
          'z-index': String(Z),
          cursor: 'pointer',
          display: 'none',
        });
        bubble.style.setProperty(side, '20px', 'important');
        bubble.addEventListener('click', function () {
          toggle(true);
        });
        setTimeout(function () {
          if (!open && bubble) bubble.style.setProperty('display', 'block', 'important');
        }, 2500);
      }
    }

    function hideBubble() {
      if (!bubble) return;
      bubble.remove();
      bubble = null;
      try {
        sessionStorage.setItem('rb_w_greet', '1');
      } catch (e) {}
    }

    function applyMobile() {
      var small = window.innerWidth < 480;
      if (small) {
        css(panel, { inset: '0', width: '100%', height: '100%', 'max-height': '100%', 'border-radius': '0', bottom: '0' });
      } else {
        panel.style.removeProperty('inset');
        css(panel, { top: 'auto', bottom: '90px', width: '370px', height: '600px', 'max-height': 'calc(100vh - 110px)', 'border-radius': '16px' });
        panel.style.setProperty(side, '20px', 'important');
        panel.style.setProperty(side === 'right' ? 'left' : 'right', 'auto', 'important');
      }
      // En móvil el panel ocupa la pantalla: el botón se oculta mientras está abierto.
      btn.style.setProperty('display', small && open ? 'none' : 'flex', 'important');
    }

    function toggle(next) {
      open = typeof next === 'boolean' ? next : !open;
      hideBubble();
      if (open && !loaded) {
        frame.src = origin + '/w/' + encodeURIComponent(key);
        loaded = true;
      }
      btn.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
      btn.setAttribute('aria-label', open ? 'Cerrar chat' : 'Abrir chat de ' + (cfg.businessName || 'atención'));
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        panel.style.setProperty('display', 'block', 'important');
        requestAnimationFrame(function () {
          panel.style.setProperty('opacity', '1', 'important');
          panel.style.setProperty('transform', 'none', 'important');
        });
      } else {
        panel.style.setProperty('opacity', '0', 'important');
        panel.style.setProperty('transform', 'translateY(8px) scale(.98)', 'important');
        setTimeout(function () {
          if (!open) panel.style.setProperty('display', 'none', 'important');
        }, reduce ? 0 : 200);
      }
      applyMobile();
    }

    btn.addEventListener('click', function () {
      toggle();
    });
    window.addEventListener('resize', applyMobile);
    window.addEventListener('message', function (ev) {
      if (ev.origin !== origin || !ev.data || ev.data.type !== 'renbotia:close') return;
      toggle(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && open) toggle(false);
    });

    document.body.appendChild(panel);
    if (bubble) document.body.appendChild(bubble);
    document.body.appendChild(btn);
    applyMobile();
  }

  function start() {
    fetch(origin + '/api/widget/public/' + encodeURIComponent(key), { credentials: 'omit' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (body) {
        if (body && body.success && body.data) mount(body.data);
      })
      .catch(function () {
        /* widget inactivo o sin red: no se dibuja nada */
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
