/* 1D — La Línea */
(function () {
  const canvas = document.getElementById('canvas-1d');
  const ctx = canvas.getContext('2d');

  let player = 0.5;
  let target = 0.5;
  let dragging = false;

  const beings = [
    { p: 0.12, s: 9, hue: 0 }, { p: 0.3, s: 6, hue: 40 },
    { p: 0.68, s: 8, hue: 180 }, { p: 0.87, s: 11, hue: 300 }
  ];

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0ff';
  }

  function setTarget(e) {
    const r = canvas.getBoundingClientRect();
    target = Math.min(0.97, Math.max(0.03, (e.clientX - r.left) / r.width));
  }
  canvas.addEventListener('pointerdown', e => { dragging = true; setTarget(e); });
  window.addEventListener('pointermove', e => { if (dragging) setTarget(e); });
  window.addEventListener('pointerup', () => dragging = false);

  // Dibuja lo que ve hacia un lado: el habitante más cercano en esa dirección
  function drawEye(dir, x0, boxW, visY, dpr) {
    let seen = null, minD = Infinity;
    for (const b of beings) {
      const d = (b.p - player) * dir;          // dir: +1 adelante, -1 atrás
      if (d > 0 && d < minD) { minD = d; seen = b; }
    }
    if (seen) {
      const size = Math.max(2, 14 - minD * 40) * dpr;
      ctx.fillStyle = `hsl(${seen.hue}, 90%, 65%)`;
      ctx.beginPath();
      ctx.arc(x0 + boxW / 2, visY, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
      ctx.fillText('vacío', x0 + boxW / 2 - 15 * dpr, visY + 4 * dpr);
    }
  }

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    const lineY = h * 0.66;

    player += (target - player) * 0.07;

    // La línea
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(w, lineY);
    ctx.stroke();

    // Habitantes + ping al cruzarlos (único sonido de esta sección)
    for (const b of beings) {
      const bx = b.p * w;
      const wob = Math.sin(t * 0.003 + b.p * 20) * 3 * dpr;
      ctx.fillStyle = `hsl(${b.hue}, 90%, 65%)`;
      ctx.beginPath();
      ctx.arc(bx + wob, lineY, b.s * dpr * 0.9, 0, Math.PI * 2);
      ctx.fill();

      if (Math.abs(b.p - player) < 0.015 && !b.pinged) { b.pinged = true; sfx.tap(b.hue / 360); }
      if (Math.abs(b.p - player) > 0.05) b.pinged = false;
    }

    // El jugador
    const px = player * w;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, lineY, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // --- Visión: dos "ojos", atrás y adelante ---
    const visY = h * 0.2;
    const boxW = w * 0.42;
    const xBack = w * 0.05;
    const xFront = w * 0.53;

    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('MIRANDO ATRÁS:', xBack, visY - 24 * dpr);
    ctx.fillText('MIRANDO ADELANTE:', xFront, visY - 24 * dpr);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(xBack, visY - 14 * dpr, boxW, 28 * dpr);
    ctx.strokeRect(xFront, visY - 14 * dpr, boxW, 28 * dpr);

    drawEye(-1, xBack, boxW, visY, dpr);
    drawEye(1, xFront, boxW, visY, dpr);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();