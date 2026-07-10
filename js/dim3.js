/* 3D — El Volumen (Three.js) + sombra 2D */
(function () {
  const canvas = document.getElementById('canvas-3d');
  const cmp = document.getElementById('compare-3d');
  const cctx = cmp.getContext('2d');
  const panel = document.getElementById('panel-3d');
  let idleTimer = null;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 6;

  const group = new THREE.Group();
  scene.add(group);

  const cubeGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
  const edges = new THREE.EdgesGeometry(cubeGeo);
  const wire = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.9 })
  );
  group.add(wire);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.7 })
  );
  group.add(core);

  const ptsGeo = new THREE.BufferGeometry();
  const P = 220, pos = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) {
    const r = 2.2 + Math.random() * 1.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    ptsGeo,
    new THREE.PointsMaterial({ color: 0xff9500, size: 0.035, transparent: true, opacity: 0.7 })
  );
  scene.add(pts);

  // Vértices y aristas del cubo para calcular su sombra
  const CV = [];
  for (let i = 0; i < 8; i++) {
    CV.push([(i & 1) ? 1.2 : -1.2, (i & 2) ? 1.2 : -1.2, (i & 4) ? 1.2 : -1.2]);
  }
  const CE = [];
  for (let a = 0; a < 8; a++) {
    for (let d = 0; d < 3; d++) {
      const b = a ^ (1 << d);
      if (b > a) CE.push([a, b]);
    }
  }

  let dragging = false, lastX = 0, lastY = 0;
  let velX = 0.004, velY = 0.002;

  function wake() {
    panel.classList.add('active');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => panel.classList.remove('active'), 1500);
  }

  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    sfx.sweep(0.5);
    wake();
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.0012;
    velX = (e.clientY - lastY) * 0.0012;
    lastX = e.clientX; lastY = e.clientY;
    wake();
  });
  window.addEventListener('pointerup', () => dragging = false);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(rect.width, rect.height, false);
    renderer.setPixelRatio(dpr);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  // Sombra: rota los vértices igual que el cubo y aplasta la Y (luz cenital)
  function drawShadow(rxA, ryA) {
    const { w, h } = fitCanvas(cmp);
    cctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const s = Math.min(w, h) * 0.26;

    const cosX = Math.cos(rxA), sinX = Math.sin(rxA);
    const cosY = Math.cos(ryA), sinY = Math.sin(ryA);

    const flat = CV.map(v => {
      let [x, y, z] = v;
      // Rotación X
      let ny = y * cosX - z * sinX;
      let nz = y * sinX + z * cosX;
      y = ny; z = nz;
      // Rotación Y
      let nx = x * cosY + z * sinY;
      nz = -x * sinY + z * cosY;
      x = nx; z = nz;
      // Sombra sobre el suelo: se descarta la altura (y)
      return { x: cx + x * s, y: cy + z * s };
    });

    cctx.strokeStyle = 'rgba(255,149,0,0.85)';
    cctx.lineWidth = 1.3;
    cctx.beginPath();
    for (const [a, b] of CE) {
      cctx.moveTo(flat[a].x, flat[a].y);
      cctx.lineTo(flat[b].x, flat[b].y);
    }
    cctx.stroke();
  }

  function loop(t) {
    resize();

    group.rotation.y += velY;
    group.rotation.x += velX;
    if (!dragging) { velX *= 0.985; velY *= 0.985; }
    if (Math.abs(velY) < 0.0015) velY = 0.0015 * Math.sign(velY || 1);

    core.rotation.x = t * 0.0007;
    core.rotation.y = t * 0.001;
    core.scale.setScalar(1 + Math.sin(t * 0.002) * 0.12);

    pts.rotation.y = t * 0.00012;

    drawShadow(group.rotation.x, group.rotation.y);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();