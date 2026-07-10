/* 0D — El Punto */
(function () {
  const canvas = document.getElementById('canvas-0d');
  const ctx = canvas.getContext('2d');
  const ripples = [];

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#fff';
  }

  canvas.addEventListener('pointerdown', () => {
    ripples.push({ r: 0, a: 1 });
    if (ripples.length > 12) ripples.shift();
    sfx.tap(Math.random());
  });

  function loop(t) {
    const { w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const col = accent();

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 3.5;
      rp.a *= 0.965;
      if (rp.a < 0.01) { ripples.splice(i, 1); continue; }
      ctx.globalAlpha = rp.a * 0.6;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const pulse = 5 + Math.sin(t * 0.0022) * 2.5;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 9);
    glow.addColorStop(0, col);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse * 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();