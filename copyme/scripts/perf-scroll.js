// Paste with evaluate_script on the page (tab in front!). Scrolls top→bottom→top over N frames.
async () => {
  const run = async (frames = 60) => {
    const f = []; const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 200)); let last = performance.now();
    for (let i = 0; i < frames; i++) { window.scrollTo(0, Math.sin((i / frames) * Math.PI) * max); await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); f.push(n - last); last = n; }
    f.sort((a, b) => a - b); const avg = f.reduce((s, x) => s + x, 0) / f.length;
    return { fps: Math.round(1000 / avg), p95Ms: +f[Math.floor(f.length * 0.95)].toFixed(1), worstMs: +f.at(-1).toFixed(1) };
  };
  const glass = [...document.querySelectorAll(".glass")];
  const withAll = await run();
  const saved = glass.map((e) => e.style.backdropFilter);
  glass.forEach((e) => e.style.removeProperty("backdrop-filter"));
  const withoutRefraction = await run();
  glass.forEach((e, i) => saved[i] && (e.style.backdropFilter = saved[i]));
  window.scrollTo(0, 0);
  return { withAll, withoutRefraction, refracted: glass.filter((e) => e.style.backdropFilter.includes("url")).map((e) => `${e.offsetWidth}x${e.offsetHeight}`) };
}
