/* ============================================
   audio.js — SFX y ambiente independientes
   ============================================ */
(function () {
  const btnSfx = document.getElementById('sfx-toggle');
  const btnAmb = document.getElementById('ambient-toggle');
  let ready = false;
  let sfxOn = false;
  let ambOn = false;
  let currentDim = '0';

  let master, reverb, ambientSynth, ambientFilter, ambientGain;
  let pluck, blip, whoosh, subBass;

  const scales = {
    '0': ['C5'],
    '1': ['C4', 'D4', 'E4', 'G4', 'A4'],
    '2': ['E4', 'G4', 'A4', 'B4', 'D5'],
    '3': ['G3', 'A3', 'C4', 'D4', 'E4'],
    '4': ['C4', 'Eb4', 'F4', 'G4', 'Bb4'],
    '5': ['C4', 'Db4', 'E4', 'G4', 'B4'],
    'n': ['C3', 'F#3', 'C4', 'F#4', 'C5']
  };

  function scaleNote(i) {
    const s = scales[currentDim] || scales['0'];
    return s[Math.abs(Math.round(i)) % s.length];
  }

  async function init() {
    await Tone.start();

    master = new Tone.Gain(0.8).toDestination();
    reverb = new Tone.Reverb({ decay: 3, wet: 0.25 }).connect(master);

    // Ambiente: cadena propia, grave, filtrado y muy bajo
    ambientGain = new Tone.Gain(0).connect(master);
    ambientFilter = new Tone.Filter(300, 'lowpass').connect(ambientGain);
    ambientSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 1, sustain: 0.5, release: 6 },
      volume: -30
    }).connect(ambientFilter);

    pluck = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.25 },
      volume: -16
    }).connect(reverb);

    blip = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
      volume: -26
    }).connect(reverb);

    whoosh = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.04, decay: 0.3, sustain: 0, release: 0.25 },
      volume: -24
    }).connect(reverb);

    subBass = new Tone.MembraneSynth({
      pitchDecay: 0.08, octaves: 4,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0 },
      volume: -14
    }).connect(master);

    ready = true;
  }

  function startAmbient() {
    const s = scales[currentDim] || scales['0'];
    ambientSynth.releaseAll();
    ambientSynth.triggerAttack([s[0]]);
    ambientGain.gain.rampTo(1, 2);
  }

  function stopAmbient() {
    if (!ready) return;
    ambientGain.gain.rampTo(0, 1);
    setTimeout(() => ambientSynth.releaseAll(), 1100);
  }

  let lastBlip = 0, lastWhoosh = 0, lastTap = 0;

  window.sfx = {
    // Nota puntual (clics, cruces): con throttle propio
    tap(v = 0.5) {
      if (!sfxOn) return;
      const now = Tone.now();
      if (now - lastTap < 0.12) return;
      lastTap = now;
      pluck.triggerAttackRelease(scaleNote(v * 5), '16n');
    },

    // Golpe grave (eventos importantes)
    hit(v = 0.5) {
      if (!sfxOn) return;
      subBass.triggerAttackRelease(v > 0.5 ? 'C2' : 'C1', '8n');
      whoosh.triggerAttackRelease('4n');
    },

    // Tic sutil: SOLO para cambios discretos, no para arrastres continuos
    move(v = 0.5) {
      if (!sfxOn) return;
      const now = Tone.now();
      if (now - lastBlip < 0.25) return;
      lastBlip = now;
      blip.triggerAttackRelease(scaleNote(v * 8), '32n');
    },

    // Barrido de ruido (apariciones, inicio de rotación)
    sweep(v = 0.5) {
      if (!sfxOn) return;
      const now = Tone.now();
      if (now - lastWhoosh < 0.6) return;
      lastWhoosh = now;
      whoosh.triggerAttackRelease('8n');
    },

    // Acorde según valor de slider
    chord(v = 0.5) {
      if (!sfxOn) return;
      const now = Tone.now();
      if (now - lastTap < 0.15) return;
      lastTap = now;
      const s = scales[currentDim] || scales['0'];
      const idx = Math.floor(v * (s.length - 1));
      pluck.triggerAttackRelease([s[0], s[idx]], '8n');
    }
  };

  window.setAudioDim = function (dim) {
    if (dim === currentDim) return;
    currentDim = dim;
    if (sfxOn) {
      whoosh.triggerAttackRelease('4n');
      const s = scales[dim] || scales['0'];
      pluck.triggerAttackRelease([s[0], s[2] || s[0]], '8n', Tone.now() + 0.15);
    }
    if (ambOn) startAmbient();
  };

  btnSfx.addEventListener('click', async () => {
    if (!ready) { btnSfx.textContent = 'SFX: ...'; await init(); }
    sfxOn = !sfxOn;
    btnSfx.textContent = sfxOn ? 'SFX: ON' : 'SFX: OFF';
    btnSfx.classList.toggle('on', sfxOn);
    if (sfxOn) window.sfx.tap(0.6);
  });

  btnAmb.addEventListener('click', async () => {
    if (!ready) { btnAmb.textContent = 'AMBIENTE: ...'; await init(); }
    ambOn = !ambOn;
    btnAmb.textContent = ambOn ? 'AMBIENTE: ON' : 'AMBIENTE: OFF';
    btnAmb.classList.toggle('on', ambOn);
    ambOn ? startAmbient() : stopAmbient();
  });
})();