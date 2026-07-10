/* 1D — La Línea */
(function () {
  const canvas = document.getElementById('canvas-1d');
  const ctx = canvas.getContext('2d');

  let player = 0.5;            // posición 0..1 sobre la línea
  let target = 0.5;
  let dragging = false;

  // Habitantes fijos de la línea (posición, tamaño, tono)
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

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    const lineY = h * 0.62;

    player += (target - player) * 0.07;   // movimiento suave

    // --- La línea (su universo entero) ---
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(w, lineY);
    ctx.stroke();

    // Habitantes: solo pueden vibrar en su sitio
    for (const b of beings) {
      const bx = b.p * w;
      const wob = Math.sin(t * 0.003 + b.p * 20) * 3 * dpr;
      ctx.fillStyle = `hsl(${b.hue}, 90%, 65%)`;
      ctx.beginPath();
      ctx.arc(bx + wob, lineY, b.s * dpr * 0.9, 0, Math.PI * 2);
      ctx.fill();
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

    // --- "Lo que él ve": franja superior con UN punto ---
    // Busca al vecino más cercano a la derecha (mira hacia adelante)
    let seen = null, minD = Infinity;
    for (const b of beings) {
      const d = b.p - player;
      if (d > 0 && d < minD) { minD = d; seen = b; }
    }

    const visY = h * 0.18;
    ctx.font = `${11 * dpr}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('SU CAMPO VISUAL COMPLETO:', w * 0.05, visY - 22 * dpr);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(w * 0.05, visY - 14 * dpr, w * 0.9, 28 * dpr);

    if (seen) {
      // Más cerca = más grande y brillante (única pista de profundidad en 1D)
      const size = Math.max(2, 14 - minD * 40) * dpr;
      ctx.fillStyle = `hsl(${seen.hue}, 90%, 65%)`;
      ctx.beginPath();
      ctx.arc(w / 2, visY, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText('el vacío', w / 2 - 24 * dpr, visY + 4 * dpr);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();