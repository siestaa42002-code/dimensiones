/* ============================================
   main.js — fondo global, scroll, navegación
   ============================================ */

// Helper global: ajusta un canvas a su tamaño CSS con devicePixelRatio
window.fitCanvas = function (canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
};

/* ---------- Fondo: campo de partículas reactivo ---------- */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  const N = 120;
  const parts = [];
  const mouse = { x: -9999, y: -9999 };
  let scrollVel = 0;
  let lastScroll = window.scrollY;

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim();
  }

  for (let i = 0; i < N; i++) {
    parts.push({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,          // profundidad
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      r: 0.6 + Math.random() * 1.8,
      tw: Math.random() * Math.PI * 2         // fase de parpadeo
    });
  }

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // Velocidad de scroll → las partículas "fluyen"
    const sy = window.scrollY;
    scrollVel += (sy - lastScroll) * 0.002;
    scrollVel *= 0.92;
    lastScroll = sy;

    const col = accent();
    const mx = mouse.x * dpr, my = mouse.y * dpr;

    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy - scrollVel * 0.004 * p.z;
      if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
      if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;

      let px = p.x * w, py = p.y * h;

      // Repulsión suave del cursor
      const dx = px - mx, dy = py - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22000 * dpr) {
        const d = Math.sqrt(d2) || 1;
        const f = (150 * dpr - d) / (150 * dpr);
        if (f > 0) { px += (dx / d) * f * 26; py += (dy / d) * f * 26; }
      }

      const alpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.001 + p.tw)) * p.z;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, p.r * p.z * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ---------- Observador: secciones visibles + paleta + nav ---------- */
(function () {
  const sections = document.querySelectorAll('.dim-section');
  const dots = document.querySelectorAll('.dim-dot');

  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.2 });

  const activate = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;                       // "dim0" ... "dim4"
      document.body.dataset.dim = id.replace('dim', '');
      dots.forEach(d => d.classList.toggle('active', d.getAttribute('href') === '#' + id));
    });
  }, { threshold: 0.55 });

  sections.forEach(s => { reveal.observe(s); activate.observe(s); });
})();