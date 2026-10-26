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
    toggle.disabled = highContrast || preference.matches;
    toggle.querySelector('span:last-child').textContent = (highContrast || preference.matches) ? 'Motion paused' : paused ? 'Resume motion' : 'Stop motion';
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
    let ctx;
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
    if (confetti.getContext) {
      folder.hidden = false;
      toggle.hidden = false;
      folder.addEventListener('click', () => {
        if (paused || highContrast || preference.matches) {
          status.textContent = 'Confetti is off while motion is stopped or reduced motion is enabled.';
          return;
        }
        ctx ||= confetti.getContext('2d');
        if (!ctx) return;
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
  // Load the GPU implementation only if movement is wanted and supported.
  // Both the exported still and all controls work independently of WebGPU.
  if (!canvas || !navigator.gpu) return;
  const FRAME_INTERVAL = 1000 / 30;
  const MAX_PIXELS = 1500000;
  let device, context, frame, format;
  let initializing = false;
  let stopped = false;
  let raf = 0;
  let timer = 0;
  let idle = 0;
  let last = 0;
  let elapsed = 0;
  let sizeDirty = true;
  let ready = document.readyState === 'complete';
  function cancelWork() {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    if (idle && window.cancelIdleCallback) cancelIdleCallback(idle);
    idle = 0;
    last = 0;
  }
  function fail() {
    if (stopped) return;
    stopped = true;
    cancelWork();
    canvas.hidden = true;
    canvas.dataset.renderer = 'fallback';
    toggle.hidden = !folder;
    if (device) device.destroy();
  }
  function resizeCanvas() {
    const width = Math.max(1, innerWidth);
    const height = Math.max(1, innerHeight);
    // Smooth artwork needs fewer pixels than the crisp HTML text above it.
    const scale = Math.min(devicePixelRatio || 1, 1, Math.sqrt(MAX_PIXELS / (width * height)), device.limits.maxTextureDimension2D / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    sizeDirty = false;
  }
  function schedule() {
    if (stopped || paused || highContrast || document.hidden) return;
    // A timer avoids executing an animation callback on every 60/120-Hz refresh.
    timer = setTimeout(() => { raf = requestAnimationFrame(draw); }, Math.max(0, FRAME_INTERVAL - (performance.now() - last) - 2));
  }
  function draw(now) {
    if (stopped || paused || highContrast || document.hidden) return;
    if (last && now - last < FRAME_INTERVAL - 1) { schedule(); return; }
    if (last) elapsed += Math.min(now - last, 100);
    last = now;
    try {
      if (sizeDirty) resizeCanvas();
      frame.time = elapsed;
      frame.output = context.getCurrentTexture();
      window.PixelPalettesShader.render(device, frame);
      if (canvas.dataset.renderer !== 'webgpu') canvas.dataset.renderer = 'webgpu';
    } catch { fail(); return; }
    schedule();
  }
  async function initialize() {
    idle = 0;
    if (initializing || device || stopped || paused || highContrast || document.hidden) return;
    initializing = true;
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' });
      if (!adapter) { fail(); return; }
      if (paused || highContrast || document.hidden) return;
      if (!window.PixelPalettesShader) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'assets/moving-gradient.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.append(script);
        });
      }
      if (paused || highContrast || document.hidden) return;
      device = await adapter.requestDevice();
      if (stopped) { device.destroy(); return; }
      context = canvas.getContext('webgpu');
      if (!context) { fail(); return; }
      format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: 'opaque' });
      frame = { state: {}, time: 0, params: {
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
      toggle.hidden = false;
      if (!paused && !highContrast && !document.hidden) raf = requestAnimationFrame(draw);
    } catch { fail(); }
    finally { initializing = false; }
  }
  function restart() {
    cancelWork();
    if (!ready || stopped || paused || highContrast || document.hidden) return;
    if (frame) raf = requestAnimationFrame(draw);
    else if (!initializing) {
      if (window.requestIdleCallback) idle = requestIdleCallback(initialize, { timeout: 1000 });
      else timer = setTimeout(initialize, 0);
    }
  }
  refreshMotion = restart;
  document.addEventListener('visibilitychange', restart);
  addEventListener('resize', () => { sizeDirty = true; });
  addEventListener('pagehide', cancelWork);
  addEventListener('pageshow', restart);
  if (!ready) addEventListener('load', () => { ready = true; restart(); }, { once: true });
  restart();
})();
