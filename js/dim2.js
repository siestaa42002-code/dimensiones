/* 2D — El Plano */
(function () {
  const canvas = document.getElementById('canvas-2d');
  const ctx = canvas.getContext('2d');

  const mouse = { x: -9999, y: -9999, inside: false };
  const SPHERE_R = 55;
  let prevR = 0;

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

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.inside = true;
  });
  canvas.addEventListener('pointerleave', () => mouse.inside = false);

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#7cff00';
  }

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    const mx = mouse.x * dpr, my = mouse.y * dpr;

    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    const grid = 40 * dpr;
    for (let x = 0; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    let circR = 0;
    if (mouse.inside) {
      const phase = Math.sin(t * 0.0016);
      circR = Math.sqrt(Math.max(0, 1 - phase * phase)) * SPHERE_R * dpr;
      if (circR > 1 && prevR <= 1) sfx.sweep(0.5);   // la esfera emerge
      if (circR > 1) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, circR);
        g.addColorStop(0, 'rgba(255,255,255,0.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mx, my, circR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(mx, my, circR, 0, Math.PI * 2); ctx.stroke();
      }
    }
    prevR = circR;

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

    // "Lo que ellos ven"
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

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();