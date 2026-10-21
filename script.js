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
  function updateSettings() {
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('motion-paused', paused);
    accessibility.setAttribute('aria-pressed', String(highContrast));
    toggle.disabled = highContrast;
    toggle.textContent = highContrast ? 'Motion paused' : paused ? 'Resume motion' : 'Pause all motion';
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
    toggle.hidden = true;
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
      intensity: 3.740000009536743,
      gradient: { stops: [
        { position: .21153846383094788, color: { r: .192946195602417, g: .7757474184036255, b: .6591872572898865, a: 1 } },
        { position: .4375, color: { r: .2022777795791626, g: .398171067237854, b: .713303804397583, a: 1 } },
        { position: .6682692170143127, color: { r: .5839129686355591, g: .25114062428474426, b: .790771484375, a: 1 } },
        { position: .8509615659713745, color: { r: .15447954833507538, g: .5618787407875061, b: .7364783883094788, a: 1 } }
      ] },
      gradientBalance: -30, material: 4, morphSpeed: .25,
      detail: 2.809999942779541, twist: .019999999552965164,
      zoom: 70, gradientMethod: 0, warp: .8299999833106995, rotationSpeed: 1
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
