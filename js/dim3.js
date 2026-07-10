/* 3D — El Volumen (Three.js) */
(function () {
  const canvas = document.getElementById('canvas-3d');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 6;

  // Grupo principal
  const group = new THREE.Group();
  scene.add(group);

  // Cubo wireframe exterior
  const cubeGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
  const edges = new THREE.EdgesGeometry(cubeGeo);
  const wire = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.9 })
  );
  group.add(wire);

  // Núcleo: icosaedro brillante
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.7 })
  );
  group.add(core);

  // Nube de puntos orbitando (da sensación de profundidad)
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

  // --- Interacción: arrastre con inercia ---
  let dragging = false, lastX = 0, lastY = 0;
  let velX = 0.004, velY = 0.002;   // rotación inicial

  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.0012;
    velX = (e.clientY - lastY) * 0.0012;
    lastX = e.clientX; lastY = e.clientY;
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

  function loop(t) {
    resize();

    group.rotation.y += velY;
    group.rotation.x += velX;
    if (!dragging) { velX *= 0.985; velY *= 0.985; }
    // Nunca se detiene del todo
    if (Math.abs(velY) < 0.0015) velY = 0.0015 * Math.sign(velY || 1);

    core.rotation.x = t * 0.0007;
    core.rotation.y = t * 0.001;
    core.scale.setScalar(1 + Math.sin(t * 0.002) * 0.12);

    pts.rotation.y = t * 0.00012;

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();