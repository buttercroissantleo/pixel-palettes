/* Set the saved display mode before first paint; storage is optional. */
try {
  document.documentElement.classList.toggle('high-contrast', localStorage.getItem('pixel-palettes-contrast') === 'true');
  document.documentElement.classList.toggle('motion-paused', localStorage.getItem('pixel-palettes-paused') === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches);
} catch { /* Private browsing may deny storage. */ }
