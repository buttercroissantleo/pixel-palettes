/* Progressive enhancement: native overflow remains usable without JavaScript. */
(() => {
  document.querySelectorAll('.scroll-shell').forEach((shell, index) => {
    const viewport = shell.querySelector('.scroll-viewport');
    const content = viewport.querySelector('.scroll-content');
    if (!viewport.id) viewport.id = `scroll-region-${index}`;
    const label = shell.dataset.scrollLabel || 'Document';
    const bar = document.createElement('div');
    bar.className = 'mac-scrollbar';
    bar.innerHTML = `<button class="scroll-arrow up" type="button" aria-label="Scroll up"><img src="assets/figma/scroll-imgBaseElementsScrollArrow8Bit.svg" alt=""></button><div class="scroll-track"><button class="scroll-page before" type="button" tabindex="-1" aria-label="Scroll up one page"></button><div class="scroll-thumb" tabindex="0" role="scrollbar" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100"></div><button class="scroll-page after" type="button" tabindex="-1" aria-label="Scroll down one page"></button></div><button class="scroll-arrow down" type="button" aria-label="Scroll down"><img src="assets/figma/scroll-imgBaseElementsScrollArrow8Bit.svg" alt=""></button>`;
    const track = bar.querySelector('.scroll-track'), thumb = bar.querySelector('.scroll-thumb');
    const up = bar.querySelector('.up'), down = bar.querySelector('.down');
    const before = bar.querySelector('.before'), after = bar.querySelector('.after');
    thumb.setAttribute('aria-controls', viewport.id);
    thumb.setAttribute('aria-label', `${label} scroll position`);
    for (const button of bar.querySelectorAll('button')) button.setAttribute('aria-controls', viewport.id);
    shell.append(bar);
    shell.classList.add('scroll-enhanced');
    let scheduled = false, max = 0, travel = 0, drag = null;
    function update() {
      scheduled = false;
      max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      shell.classList.toggle('has-overflow', max > 1);
      const height = track.clientHeight;
      const size = Math.min(height, Math.max(32, height * viewport.clientHeight / Math.max(1, viewport.scrollHeight)));
      travel = Math.max(0, height - size);
      const fraction = max ? Math.max(0, Math.min(1, viewport.scrollTop / max)) : 0;
      const top = fraction * travel;
      thumb.style.height = `${size}px`;
      thumb.style.top = `${top}px`;
      thumb.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
      thumb.setAttribute('aria-valuetext', `${Math.round(fraction * 100)}%`);
      thumb.setAttribute('aria-disabled', String(max <= 1));
      up.setAttribute('aria-disabled', String(viewport.scrollTop <= 1));
      down.setAttribute('aria-disabled', String(viewport.scrollTop >= max - 1));
      before.style.top = '0'; before.style.height = `${top}px`;
      after.style.top = `${top + size}px`; after.style.height = `${Math.max(0, height - top - size)}px`;
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
    function move(amount) { viewport.scrollTop += amount; schedule(); }
    up.addEventListener('click', () => move(-64));
    down.addEventListener('click', () => move(64));
    before.addEventListener('click', () => move(-viewport.clientHeight * .9));
    after.addEventListener('click', () => move(viewport.clientHeight * .9));
    function keys(event) {
      if (event.target !== thumb && event.target !== viewport) return;
      const amounts = { ArrowUp: -40, ArrowDown: 40, PageUp: -viewport.clientHeight * .9, PageDown: viewport.clientHeight * .9, Home: -viewport.scrollHeight, End: viewport.scrollHeight, ' ': viewport.clientHeight * (event.shiftKey ? -.9 : .9) };
      if (Object.hasOwn(amounts, event.key)) { event.preventDefault(); move(amounts[event.key]); }
    }
    thumb.addEventListener('keydown', keys); viewport.addEventListener('keydown', keys);
    thumb.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !max) return;
      event.preventDefault(); thumb.focus(); update();
      drag = { y: event.clientY, top: viewport.scrollTop };
      thumb.setPointerCapture(event.pointerId);
    });
    thumb.addEventListener('pointermove', event => {
      if (!drag || !travel) return;
      viewport.scrollTop = drag.top + (event.clientY - drag.y) * max / travel;
      schedule();
    });
    const release = () => { drag = null; };
    thumb.addEventListener('pointerup', release); thumb.addEventListener('pointercancel', release); thumb.addEventListener('lostpointercapture', release);
    bar.addEventListener('wheel', event => {
      if (event.ctrlKey || !max) return;
      event.preventDefault();
      move(event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? viewport.clientHeight : 1));
    }, { passive: false });
    viewport.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport); observer.observe(content);
    new MutationObserver(schedule).observe(content, { subtree: true, childList: true, characterData: true });
    document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    window.addEventListener('resize', schedule);
    update(); schedule();
  });
})();
