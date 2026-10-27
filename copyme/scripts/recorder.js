// Paste with Chrome DevTools MCP evaluate_script (waitForStableDom:false), then:
//   await window.__rec(() => document.querySelector('<trigger>').click(), 800 /*ms*/, '<optional selector to track>', /*brief*/ true)
//   brief (default) keeps ~1 sample per 40 ms + every peak/dip; pass false only when a curve needs every frame
// Returns { appeared: ["<ms> <element>"], tracks: { "<element>": ["<ms> op.. s.. x.. y.. clip=.. f=.. vis=.."] } }
() => {
  window.__rec = async (trigger, ms = 700, pick, brief = true) => {
    const t0 = performance.now();
    const touched = new Map();
    const mo = new MutationObserver((ms) => {
      for (const m of ms) {
        const els = m.type === "childList" ? [...m.addedNodes].filter((n) => n.nodeType === 1) : [m.target];
        for (const e of els) if (!touched.has(e) && touched.size < 12) touched.set(e, Math.round(performance.now() - t0));
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "class", "hidden", "data-open", "data-state", "aria-expanded", "style"] });
    trigger();
    const name = (e) => (e.id ? "#" + e.id : e.tagName.toLowerCase()) + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
    const tr = {};
    while (performance.now() - t0 < ms) {
      const t = Math.round(performance.now() - t0);
      const list = pick ? [...document.querySelectorAll(pick)] : [...touched.keys()];
      for (const e of list) {
        const cs = getComputedStyle(e);
        const m = cs.transform.match(/matrix\(([^)]+)\)/);
        const v = m ? m[1].split(",").map(Number) : null;
        const tf = v ? `s${Math.hypot(v[0], v[1]).toFixed(4)} sx${v[0].toFixed(4)} sy${v[3].toFixed(4)} x${v[4].toFixed(1)} y${v[5].toFixed(1)}` : "";
        const val = `op${(+cs.opacity).toFixed(2)} ${tf} ${cs.clipPath !== "none" ? "clip=" + cs.clipPath : ""} ${cs.filter !== "none" ? "f=" + cs.filter : ""} vis=${cs.visibility}`;
        const k = name(e);
        (tr[k] ||= []);
        if (tr[k].at(-1)?.split(" ").slice(1).join(" ") !== val) tr[k].push(`${t} ${val}`);
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
    mo.disconnect();
    // brief: keep a sample every ~40 ms plus every turning point (peak / dip of scale, opacity, x, y) — enough for linear()
    if (brief) for (const k in tr) {
      const rows = tr[k], num = (r, key) => +((r.match(new RegExp(" " + key + "(-?[\\d.]+)")) || [])[1] ?? NaN);
      let last = -1e9;
      tr[k] = rows.filter((r, i) => {
        const t = +r.split(" ")[0];
        const turn = i > 0 && i < rows.length - 1 && ["s", "op", "x", "y"].some((key) => { const a = num(rows[i - 1], key), b = num(r, key), c = num(rows[i + 1], key); return (b - a) * (c - b) < 0; });
        if (i === 0 || i === rows.length - 1 || turn || t - last >= 40) { last = t; return true; }
        return false;
      });
    }
    const anims = document.getAnimations().map((a) => { const t = a.effect?.getTiming?.() || {}; return `${a.constructor.name} ${a.animationName || a.transitionProperty || ""} ${t.duration}ms d${t.delay} ${t.easing}`; });
    return { appeared: [...touched].map(([e, t]) => `${t} ${name(e)}`), tracks: tr, cssAnimations: anims.slice(0, 20) };
  };
  return "recorder ready";
}
