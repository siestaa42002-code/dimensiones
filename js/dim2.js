/* 2D — El Plano (optimizado) */
(function () {
  const canvas = document.getElementById('canvas-2d');
  const ctx = canvas.getContext('2d');
  const cmp = document.getElementById('compare-2d');
  const cctx = cmp.getContext('2d');
  const panel = document.getElementById('panel-2d');

  const mouse = { x: -9999, y: -9999, inside: false };
  const SPHERE_R = 55;
  let prevR = 0;
  let idleTimer = null;
  let frame = 0;

  const beings = [];
  for (let i = 0; i < 7; i++) {
    beings.push({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.001, vy: (Math.random() - 0.5) * 0.001,
      sides: 3 + Math.floor(Math.random() * 4),
      size: 12 + Math.random() * 14,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.01,
      hue: Math.random() * 360
    });
  }

  function wake() {
    panel.classList.add('active');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => panel.classList.remove('active'), 1500);
  }

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.inside = true;
    wake();
  });
  canvas.addEventListener('pointerleave', () => mouse.inside = false);

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#7cff00';
  }

  function drawCompare(phase, col) {
    const { w, h } = fitCanvas(cmp);
    cctx.clearRect(0, 0, w, h);

    const planeY = h * 0.55;
    const R = h * 0.26;
    const sphereY = planeY - phase * R * 1.4;
    const cx = w / 2;

    cctx.strokeStyle = 'rgba(255,255,255,0.5)';
    cctx.lineWidth = 1.5;
    cctx.beginPath();
    cctx.moveTo(w * 0.08, planeY);
    cctx.lineTo(w * 0.92, planeY);
    cctx.stroke();

    cctx.strokeStyle = 'rgba(255,255,255,0.7)';
    cctx.lineWidth = 1.2;
    cctx.beginPath();
    cctx.arc(cx, sphereY, R, 0, Math.PI * 2);
    cctx.stroke();

    const dy = Math.abs(sphereY - planeY);
    if (dy < R) {
      const half = Math.sqrt(R * R - dy * dy);
      cctx.strokeStyle = col;
      cctx.lineWidth = 3;
      cctx.beginPath();
      cctx.moveTo(cx - half, planeY);
      cctx.lineTo(cx + half, planeY);
      cctx.stroke();
    }
  }

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    const mx = mouse.x * dpr, my = mouse.y * dpr;
    frame++;

    // Rejilla: todas las líneas en UN solo trazo
    const grid = 40 * dpr;
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += grid) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Intersección de la esfera con el plano
    const phase = Math.sin(t * 0.0016);
    let circR = 0;
    if (mouse.inside) {
      circR = Math.sqrt(Math.max(0, 1 - phase * phase)) * SPHERE_R * dpr;
      if (circR > 1 && prevR <= 1) sfx.sweep(0.5);
      if (circR > 1) {
        // Relleno simple en lugar de gradiente (mucho más rápido)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(mx, my, circR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(mx, my, circR, 0, Math.PI * 2); ctx.stroke();
      }
    }
    prevR = circR;

    // Habitantes
    for (const b of beings) {
      b.x += b.vx; b.y += b.vy; b.rot += b.vr;
      if (b.x < 0.05 || b.x > 0.95) b.vx *= -1;
      if (b.y < 0.05 || b.y > 0.95) b.vy *= -1;

      let bx = b.x * w, by = b.y * h;

      if (mouse.inside && circR > 1) {
        const dx = bx - mx, dy = by - my;
        const d = Math.hypot(dx, dy) || 1;
        const panic = circR + 70 * dpr;
        if (d < panic) {
          const f = (panic - d) / panic;
          b.vx += (dx / d) * f * 0.0006;
          b.vy += (dy / d) * f * 0.0006;
        }
      }
      b.vx = Math.max(-0.003, Math.min(0.003, b.vx * 0.995));
      b.vy = Math.max(-0.003, Math.min(0.003, b.vy * 0.995));

      ctx.fillStyle = `hsla(${b.hue}, 85%, 62%, 0.85)`;
      ctx.beginPath();
      for (let i = 0; i <= b.sides; i++) {
        const a = b.rot + (i / b.sides) * Math.PI * 2;
        const px = bx + Math.cos(a) * b.size * dpr;
        const py = by + Math.sin(a) * b.size * dpr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.fill();
    }

    // Proyección 1D (vista inferior)
    const visY = h - 34 * dpr;
    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('LO QUE UN HABITANTE VE (PROYECCIÓN 1D):', w * 0.05, visY - 12 * dpr);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(w * 0.05, visY - 5 * dpr, w * 0.9, 12 * dpr);

    for (const b of beings) {
      const sx = w * 0.05 + b.x * w * 0.9;
      const segW = b.size * dpr * 1.6;
      ctx.fillStyle = `hsla(${b.hue}, 85%, 62%, 0.9)`;
      ctx.fillRect(sx - segW / 2, visY - 4 * dpr, segW, 10 * dpr);
    }
    if (mouse.inside && circR > 1) {
      const sx = w * 0.05 + (mouse.x * dpr / w) * w * 0.9;
      ctx.fillStyle = col;
      ctx.fillRect(sx - circR * 0.9, visY - 4 * dpr, circR * 1.8, 10 * dpr);
    }

    // Panel superior: cada 2 frames basta
    if (frame % 2 === 0) drawCompare(phase, col);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();