/* Run the original Figma shader without React or a build step. */
(async () => {
  const canvas = document.querySelector('#moving-background');
  const toggle = document.querySelector('#motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const accessibility = document.querySelector('#accessibility-toggle');
  const root = document.documentElement;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* Storage is optional. */ } };
  let highContrast = read('pixel-palettes-contrast') === 'true';
  let paused = highContrast || preference.matches || read('pixel-palettes-paused') === 'true';
  let refreshMotion = () => {};
  let stopConfetti = () => {};
  function updateSettings() {
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('motion-paused', paused);
    accessibility.setAttribute('aria-pressed', String(highContrast));
    toggle.disabled = highContrast;
    toggle.textContent = highContrast ? 'Motion paused' : paused ? 'Resume motion' : 'Stop motion';
    if (paused) stopConfetti();
    refreshMotion();
  }
  accessibility.addEventListener('click', () => {
    highContrast = !highContrast;
    if (highContrast) paused = true;
    save('pixel-palettes-contrast', highContrast);
    save('pixel-palettes-paused', paused);
    updateSettings();
  });
  toggle.addEventListener('click', () => {
    paused = !paused;
    save('pixel-palettes-paused', paused);
    updateSettings();
  });
  preference.addEventListener('change', () => {
    paused = highContrast || preference.matches || read('pixel-palettes-paused') === 'true';
    updateSettings();
  });
  // One bounded confetti shower at a time; no external animation library.
  const folder = document.querySelector('#confetti-button');
  const confetti = document.querySelector('#confetti-canvas');
  const status = document.querySelector('#confetti-status');
  if (folder && confetti) {
    const ctx = confetti.getContext('2d');
    let animation = 0;
    let pieces = [];
    let last = 0;
    let age = 0;
    stopConfetti = () => {
      cancelAnimationFrame(animation);
      pieces = [];
      confetti.hidden = true;
      confetti.dataset.active = 'false';
    };
    function fall(now) {
      if (paused || highContrast || document.hidden) { stopConfetti(); return; }
      const dt = Math.min((now - last) / 1000, .04);
      last = now;
      age += dt;
      const width = innerWidth;
      const height = innerHeight;
      const scale = Math.min(devicePixelRatio || 1, 2);
      if (confetti.width !== Math.round(width * scale) || confetti.height !== Math.round(height * scale)) {
        confetti.width = Math.round(width * scale); confetti.height = Math.round(height * scale);
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        piece.y += piece.speed * dt;
        piece.angle += piece.spin * dt;
        const x = piece.x * width + Math.sin(age * 2 + piece.phase) * 35;
        ctx.save(); ctx.translate(x, piece.y * height); ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color; ctx.fillRect(-4, -6, 8, 12); ctx.restore();
      }
      if (age > 5) { stopConfetti(); return; }
      animation = requestAnimationFrame(fall);
    }
    if (ctx) {
      folder.hidden = false;
      toggle.hidden = false;
      folder.addEventListener('click', () => {
        if (paused || highContrast || preference.matches) {
          status.textContent = 'Confetti is off while motion is stopped or reduced motion is enabled.';
          return;
        }
        stopConfetti();
        const colors = ['#ff347e', '#ffda00', '#7c4dff', '#19cfb1', '#ffffff', '#339dff'];
        pieces = Array.from({ length: innerWidth < 600 ? 70 : 130 }, () => ({
          x: Math.random(), y: -Math.random() * .8, speed: .4 + Math.random() * .25,
          angle: Math.random() * Math.PI, spin: Math.random() * 6 - 3,
          phase: Math.random() * Math.PI * 2, color: colors[Math.floor(Math.random() * colors.length)]
        }));
        age = 0; last = performance.now(); confetti.hidden = false; confetti.dataset.active = 'true';
        status.textContent = 'Confetti!';
        animation = requestAnimationFrame(fall);
      });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stopConfetti(); });
    }
  }
  document.querySelector('.accessibility-controls').hidden = false;
  updateSettings();
  // Contrast controls work even on browsers without WebGPU or on static pages.
  if (!canvas || !navigator.gpu || !window.PixelPalettesShader) return;
  let device;
  let request = 0;
  let stopped = false;
  let previous = 0;
  // Figma's time is milliseconds. Preserve the authored speed parameters.
  let elapsed = 0;
  const fail = () => {
    stopped = true;
    cancelAnimationFrame(request);
    canvas.hidden = true;
    toggle.hidden = !folder;
    canvas.dataset.renderer = 'fallback';
  };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return;
    device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    if (!context) return;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });
    const frame = { state: {}, time: 0, params: {
      intensity: 4.289999961853027,
      gradient: { stops: [
        { position: .12019230425357819, color: { r: .6651517152786255, g: .8660606741905212, b: 1, a: 1 } },
        { position: .29807692766189575, color: { r: .988457202911377, g: 1, b: .30742937326431274, a: 1 } },
        { position: .5, color: { r: 1, g: .4448993504047394, b: .8889797925949097, a: 1 } },
        { position: .6634615659713745, color: { r: .4373873174190521, g: 1, b: .9906231164932251, a: 1 } },
        { position: .8125, color: { r: .7495399117469788, g: .5580115914344788, b: 1, a: 1 } },
        { position: 1, color: { r: .5159817934036255, g: 1, b: .5643836259841919, a: 1 } }
      ] },
      gradientBalance: 21, material: 4, morphSpeed: .5099999904632568,
      detail: 3.069999933242798, twist: .44999998807907104,
      zoom: 42, gradientMethod: 0, warp: .17999999225139618, rotationSpeed: 12
    } };
    window.PixelPalettesShader.setup(device, frame);
    device.addEventListener('uncapturederror', fail);
    device.lost.then(fail);
    function draw(now) {
      if (stopped) return;
      if (!paused && previous) elapsed += Math.min(now - previous, 100);
      previous = now;
      const density = Math.min(devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(innerWidth * density));
      const height = Math.max(1, Math.round(innerHeight * density));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height;
      }
      frame.time = elapsed;
      frame.output = context.getCurrentTexture();
      try {
        window.PixelPalettesShader.render(device, frame);
        canvas.dataset.renderer = 'webgpu';
        canvas.dataset.time = String(Math.round(elapsed));
      } catch { fail(); return; }
      if (!paused && !document.hidden) request = requestAnimationFrame(draw);
    }
    function restart() {
      cancelAnimationFrame(request);
      previous = 0;
      if (!document.hidden) request = requestAnimationFrame(draw);
    }
    toggle.hidden = false;
    refreshMotion = restart;
    document.addEventListener('visibilitychange', restart);
    addEventListener('resize', restart);
    restart();
  } catch { fail(); }
})();
