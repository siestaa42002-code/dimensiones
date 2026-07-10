/* 5D — El Multiverso */
(function () {
  const canvas = document.getElementById('canvas-5d');
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('prob-5d');

  let wasCollapsed = false;
  slider.addEventListener('input', () => {
    const collapsed = slider.value < 5;
    if (collapsed && !wasCollapsed) sfx.hit(0.8);
    else sfx.chord(slider.value / 100);
    wasCollapsed = collapsed;
  });

  const ECHOES = 6;

  const verts = [];
  for (let i = 0; i < 16; i++) {
    verts.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  }
  const edges = [];
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 16; b++) {
      const diff = a ^ b;
      if ((diff & (diff - 1)) === 0) edges.push([a, b]);
    }
  }

  function rot(v, i, j, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const vi = v[i], vj = v[j];
    v[i] = vi * c - vj * s;
    v[j] = vi * s + vj * c;
  }

  const universes = [];
  for (let u = 0; u < ECHOES; u++) {
    universes.push({
      phaseXW: Math.random() * Math.PI * 2,
      phaseYW: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      hueShift: (u / ECHOES) * 90 - 45
    });
  }

  let rx = -0.3, ry = 0.4;
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

  function project(v4, ang1, ang2, cx, cy, scale) {
    const v = v4.slice();
    rot(v, 0, 3, ang1);
    rot(v, 1, 3, ang2);

    const pw = 1 / (3 - v[3]);
    let x = v[0] * pw * 3, y = v[1] * pw * 3, z = v[2] * pw * 3;

    let tx = x * Math.cos(ry) - z * Math.sin(ry);
    let tz = x * Math.sin(ry) + z * Math.cos(ry);
    x = tx; z = tz;
    let ty = y * Math.cos(rx) - z * Math.sin(rx);
    tz = y * Math.sin(rx) + z * Math.cos(rx);
    y = ty; z = tz;

    const pz = 1 / (4 - z);
    return { x: cx + x * pz * 4 * scale, y: cy + y * pz * 4 * scale };
  }

  function loop(t) {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.15;
    const spread = slider.value / 100;
    const base = t * 0.0004;

    for (let u = 0; u < ECHOES; u++) {
      const uni = universes[u];
      const a1 = base + uni.phaseXW * spread;
      const a2 = base * uni.speed * spread + uni.phaseYW * spread;

      const pts = verts.map(v => project(v, a1, a2, cx, cy, scale));

      const alpha = spread === 0
        ? (u === 0 ? 0.9 : 0)
        : 0.15 + 0.55 * (1 - u / ECHOES) * (0.4 + 0.6 * spread);
      if (alpha <= 0) continue;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `hsl(${330 + uni.hueShift * spread}, 90%, 62%)`;
      ctx.lineWidth = (u === 0 ? 1.8 : 1) * dpr;

      ctx.beginPath();
      for (const [a, b] of edges) {
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();