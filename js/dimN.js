/* nD — El Abismo: hipercubo de n dimensiones */
(function () {
  const canvas = document.getElementById('canvas-nd');
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('nd-slider');
  const label = document.getElementById('nd-label');

  let N = 5;
  let verts = [], edges = [], planes = [];

  function build(n) {
    N = n;
    verts = [];
    const count = 1 << n;
    for (let i = 0; i < count; i++) {
      const v = [];
      for (let d = 0; d < n; d++) v.push((i >> d) & 1 ? 1 : -1);
      verts.push(v);
    }
    edges = [];
    for (let a = 0; a < count; a++) {
      for (let d = 0; d < n; d++) {
        const b = a ^ (1 << d);
        if (b > a) edges.push([a, b]);
      }
    }
    planes = [];
    for (let d = 3; d < n; d++) {
      planes.push({ i: d % 3, j: d, speed: 0.25 + (d - 3) * 0.12 });
    }
    planes.push({ i: 0, j: 1, speed: 0.1 });
  }

  build(5);
  slider.addEventListener('input', () => {
    label.textContent = slider.value;
    build(parseInt(slider.value, 10));
    sfx.hit((parseInt(slider.value, 10) - 4) / 4);
  });

  function rot(v, i, j, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const vi = v[i], vj = v[j];
    v[i] = vi * c - vj * s;
    v[j] = vi * s + vj * c;
  }

  let rx = -0.3, ry = 0.5;
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    sfx.sweep(0.5);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    ry += (e.clientX - lastX) * 0.006;
    rx += (e.clientY - lastY) * 0.006;
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => dragging = false);

  const clamp01 = v => Math.max(0, Math.min(1, v));

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ffd700';

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * (0.34 - N * 0.022);
    const time = t * 0.0005;

    const projected = [];

    for (const src of verts) {
      const v = src.slice();

      for (const p of planes) rot(v, p.i, p.j, time * p.speed);

      let dims = N;
      while (dims > 3) {
        const D = 2.8;
        const f = 1 / (D - v[dims - 1] * 0.8);
        for (let d = 0; d < dims - 1; d++) v[d] *= f * D;
        dims--;
      }

      let x = v[0], y = v[1], z = v[2];
      let tx = x * Math.cos(ry) - z * Math.sin(ry);
      let tz = x * Math.sin(ry) + z * Math.cos(ry);
      x = tx; z = tz;
      let ty = y * Math.cos(rx) - z * Math.sin(rx);
      tz = y * Math.sin(rx) + z * Math.cos(rx);
      y = ty; z = tz;

      const pz = 1 / (4.5 - z);
      projected.push({
        x: cx + x * pz * 4.5 * scale,
        y: cy + y * pz * 4.5 * scale,
        d: clamp01((src[N - 1] + 1.5) / 3)
      });
    }

    const baseAlpha = Math.max(0.06, 0.5 - (N - 4) * 0.09);

    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(0.5, 1.6 - (N - 4) * 0.22) * dpr;
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    for (const [a, b] of edges) {
      ctx.moveTo(projected[a].x, projected[a].y);
      ctx.lineTo(projected[b].x, projected[b].y);
    }
    ctx.stroke();

    for (const p of projected) {
      ctx.globalAlpha = 0.25 + 0.6 * p.d;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.8, 2.4 - (N - 4) * 0.35) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(`${verts.length} vértices · ${edges.length} aristas`, 14 * dpr, h - 14 * dpr);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();