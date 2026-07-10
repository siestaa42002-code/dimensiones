/* 4D — El Teseracto (reconstruido) */
(function () {
  const canvas = document.getElementById('canvas-4d');
  const ctx = canvas.getContext('2d');

  const sXW = document.getElementById('rot-xw');
  const sYW = document.getElementById('rot-yw');
  const sZW = document.getElementById('rot-zw');

  /* ---------- Geometría del hipercubo ---------- */

  // 16 vértices: combinaciones de ±1 en (x, y, z, w)
  const verts = [];
  for (let i = 0; i < 16; i++) {
    verts.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1
    ]);
  }

  // 32 aristas: vértices que difieren en exactamente un bit
  const edges = [];
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 16; b++) {
      const diff = a ^ b;
      if ((diff & (diff - 1)) === 0) edges.push([a, b]);
    }
  }

  /* ---------- Rotaciones ---------- */

  // Rotación en el plano de los ejes i, j
  function rot(v, i, j, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const vi = v[i], vj = v[j];
    v[i] = vi * c - vj * s;
    v[j] = vi * s + vj * c;
  }

  /* ---------- Interacción ---------- */

  // Los sliders controlan la VELOCIDAD de rotación en cada plano 4D.
  // Los ángulos se acumulan, así que mover un slider tiene efecto inmediato
  // y ponerlo en 0 congela ese plano.
  let angXW = 0, angYW = 0, angZW = 0;

  // Arrastre: rotación 3D de la vista, con inercia
  let rx = -0.35, ry = 0.5;
  let vrx = 0, vry = 0;
  let dragging = false, lastX = 0, lastY = 0;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    vry = (e.clientX - lastX) * 0.006;
    vrx = (e.clientY - lastY) * 0.006;
    ry += vry; rx += vrx;
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => dragging = false);
  canvas.addEventListener('pointercancel', () => dragging = false);

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#d400ff';
  }

  const clamp01 = v => Math.max(0, Math.min(1, v));

  /* ---------- Bucle ---------- */

  function loop() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const col = accent();

    // Velocidades desde los sliders (0 = quieto)
    angXW += (sXW.value / 100) * 0.02;
    angYW += (sYW.value / 100) * 0.02;
    angZW += (sZW.value / 100) * 0.02;

    // Inercia del arrastre
    if (!dragging) {
      ry += vry; rx += vrx;
      vry *= 0.95; vrx *= 0.95;
    }

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.16;
    const D4 = 3;    // distancia de la "cámara 4D" en el eje W
    const D3 = 4;    // distancia de la cámara 3D

    const cosRy = Math.cos(ry), sinRy = Math.sin(ry);
    const cosRx = Math.cos(rx), sinRx = Math.sin(rx);

    const projected = [];

    for (const src of verts) {
      const v = src.slice();

      // Rotaciones en los tres planos que involucran W
      rot(v, 0, 3, angXW);
      rot(v, 1, 3, angYW);
      rot(v, 2, 3, angZW);

      // Proyección perspectiva 4D → 3D
      const pw = 1 / (D4 - v[3]);
      let x = v[0] * pw * D4;
      let y = v[1] * pw * D4;
      let z = v[2] * pw * D4;

      // Vista 3D del usuario (yaw + pitch)
      let tx = x * cosRy - z * sinRy;
      let tz = x * sinRy + z * cosRy;
      x = tx; z = tz;
      let ty = y * cosRx - z * sinRx;
      tz = y * sinRx + z * cosRx;
      y = ty; z = tz;

      // Proyección perspectiva 3D → 2D
      const pz = 1 / (D3 - z);
      projected.push({
        x: cx + x * pz * D3 * scale,
        y: cy + y * pz * D3 * scale,
        // wNorm: posición en la 4.ª dimensión, normalizada a 0..1
        wNorm: clamp01((v[3] + 1.6) / 3.2),
        zNorm: clamp01((z + 1.6) / 3.2)
      });
    }

    // Aristas ordenadas: primero las lejanas en W, encima las cercanas
    const sorted = edges
      .map(([a, b]) => ({ a: projected[a], b: projected[b], d: (projected[a].wNorm + projected[b].wNorm) / 2 }))
      .sort((e1, e2) => e1.d - e2.d);

    for (const e of sorted) {
      // Cercano en W → color de acento, brillante y grueso
      // Lejano en W → blanco tenue y fino
      const t = e.d;
      ctx.globalAlpha = 0.18 + 0.72 * t;
      ctx.strokeStyle = t > 0.5 ? col : 'rgba(255,255,255,0.9)';
      ctx.lineWidth = (0.7 + 2.3 * t) * dpr;
      ctx.shadowColor = col;
      ctx.shadowBlur = t > 0.7 ? 10 * t : 0;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Vértices
    for (const p of projected) {
      ctx.globalAlpha = 0.35 + 0.65 * p.wNorm;
      ctx.fillStyle = p.wNorm > 0.5 ? '#ffffff' : col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1.2 + 2.8 * p.wNorm) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();