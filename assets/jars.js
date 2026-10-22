// Drawing adapted from LockedTony/kink-jars, index.html.
const INK = "#151311";
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (a, al = 1) => `rgba(${a.map(Math.round).join(",")},${al})`;
const lighten = (a, t) => css(mix(a, [255, 255, 255], t));
const darken = (a, t) => css(mix(a, [0, 0, 0], t));
export const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ===== jar drawing (local box: 96 wide, 170 tall, lid at top) ===== */
function roundRect(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function bodyPath(c) {
  c.beginPath(); c.moveTo(14, 32);
  c.quadraticCurveTo(4, 36, 4, 60); c.lineTo(4, 146); c.quadraticCurveTo(4, 170, 28, 170);
  c.lineTo(68, 170); c.quadraticCurveTo(92, 170, 92, 146); c.lineTo(92, 60); c.quadraticCurveTo(92, 36, 82, 32);
  c.closePath();
}
function drawLid(c, dx = 0, dy = 0, rot = 0) {
  c.save(); c.translate(48 + dx, 12 + dy); c.rotate(rot); c.translate(-48, -12);
  c.beginPath(); roundRect(c, 6, 0, 84, 24, 6); c.fillStyle = "#fff"; c.fill();
  c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 2.4; c.beginPath();
  for (const y of [8, 16]) { c.moveTo(10, y); c.quadraticCurveTo(48, y + 3, 86, y); }
  c.stroke(); c.restore();
}
function teardrop(c, x, y, r, ox, oy) { // tail points toward (ox,oy)
  const a = Math.atan2(oy - y, ox - x);
  c.moveTo(x + Math.cos(a) * r * 2.5, y + Math.sin(a) * r * 2.5);
  c.arc(x, y, r, a + Math.PI / 2, a + Math.PI * 1.5, false); c.closePath();
}
function heart(c, x, y, s) {
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.8, y - s * 1.3, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.8, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s * 0.9); c.closePath();
}
function blob(c, pts) {
  const n = pts.length, mid = i => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let m = mid(n - 1); c.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { m = mid(i); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  c.closePath();
}
function makeDrips(r, n, base, minL, maxL) {
  const span = 100 / n, out = [];
  for (let i = 0; i < n; i++) {
    const w = 9 + r() * 6;
    out.push({ cx: -2 + span * (i + 0.5) + (r() - 0.5) * span * 0.35, w, L: minL + r() * (maxL - minL) });
  }
  out.forEach(d => d.L = Math.min(d.L, 164 - base - d.w * 0.6));
  return out;
}
function collar(c, base, drips) {
  c.moveTo(4, 18); c.lineTo(92, 18);
  c.quadraticCurveTo(100, 22, 99, base - 4); c.quadraticCurveTo(99, base, 95, base);
  for (const d of [...drips].sort((a, b) => b.cx - a.cx)) {
    const r = d.w / 2;
    c.lineTo(d.cx + r + 4, base); c.quadraticCurveTo(d.cx + r, base, d.cx + r, base + 5);
    c.lineTo(d.cx + r * 0.8, base + d.L);
    c.arc(d.cx, base + d.L, r * 1.12, 0, Math.PI, false);
    c.lineTo(d.cx - r, base + 5); c.quadraticCurveTo(d.cx - r, base, d.cx - r - 4, base);
  }
  c.lineTo(1, base); c.quadraticCurveTo(-3, base, -3, base - 4); c.quadraticCurveTo(-4, 22, 4, 18); c.closePath();
}

// Original drawing styles, with stable details per jar. See THIRD_PARTY_NOTICES.md.
function jarParams(idx, style) {
  const r = rng(idx * 7919 + 101);
  const side = r() < 0.5 ? -1 : 1;
  const P = { style, phase: r() * 6.28, r };
  if (style === 0) { P.base = 40 + r() * 8; P.drips = makeDrips(r, 4 + (r() < 0.5 ? 1 : 0), P.base, 8, 125); }
  if (style === 1) {
    P.base = 40; P.drips = makeDrips(r, 3, P.base, 30, 90); P.drips[Math.floor(r() * 3)].L = 999;
    P.drips.forEach(d => d.L = Math.min(d.L, 164 - P.base - d.w * 0.6));
    const pts = [], rx = 64 + r() * 10, ry = 10 + r() * 3;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, k = 0.86 + r() * 0.24; pts.push([48 + Math.cos(a) * rx * k, 170 + Math.sin(a) * ry * k]); }
    P.puddle = pts;
  }
  if (style === 2) {
    P.base = 38; P.drips = makeDrips(r, 3, P.base, 6, 45);
    P.foam = [];
    for (let i = 0; i < 14; i++) { const x = 48 + (r() - 0.5) * 88; P.foam.push([x, 28 - (1 - Math.abs(x - 48) / 46) * 34 - r() * 6, 7 + r() * 8]); }
    P.lid = { dx: side * (14 + r() * 8), dy: -24, rot: side * (0.2 + r() * 0.12) };
  }
  if (style === 3) {
    P.base = 40; P.drips = makeDrips(r, 4, P.base, 6, 70);
    P.drops = [[2 + r() * 8, -26, 4], [-10, -4 + r() * 6, 3.5], [-15, 20 + r() * 8, 3], [92 + r() * 6, -24, 4], [106, -2 + r() * 6, 3.5], [111, 22 + r() * 8, 3]];
    P.origin = [48, -20];
    P.lid = { dx: side * 36, dy: -26, rot: side * 0.6 };
  }
  if (style === 4) {
    P.base = 42; P.drips = makeDrips(r, 4, P.base, 10, 95);
    P.drops = []; P.origin = [48, 24];
    for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; P.drops.push([48 + s * (60 + r() * 12), 4 + r() * 100, 2.6 + r() * 2]); }
    P.splats = [[-12 - r() * 6, 172, 7], [108 + r() * 6, 173, 6], [118, 166, 2.5], [-22, 166, 2.5]];
  }
  if (style === 5) {
    P.base = 44; P.drips = makeDrips(r, 5, P.base, 6, 105);
    P.hearts = [[14 + r() * 8, -14 - r() * 6, 7 + r() * 2], [48 + (r() - 0.5) * 10, -26, 9 + r() * 2], [80 + r() * 8, -12 - r() * 6, 6 + r() * 2]];
  }
  return P;
}

// Each stage keeps the previous spill and adds another original drawing style.
export const OVERFLOW_STAGES = ["full", "drips", "puddle", "hearts", "splash", "foam", "geyser"];
export function overflowParams(idx, stage) {
  stage = Math.max(0, Math.min(6, Math.trunc(stage) || 0));
  const P = jarParams(idx, 0);
  P.base = 40;
  P.drips = makeDrips(rng(idx * 7919 + 707), 3 + Math.floor(stage / 2), P.base, 4 + stage * 4, 10 + stage * 20);
  for (const [minimum, style, keys] of [
    [2, 1, ["puddle"]], [3, 5, ["hearts"]], [4, 4, ["drops", "origin", "splats"]],
    [5, 2, ["foam", "lid"]], [6, 3, ["drops", "origin", "lid"]]
  ]) {
    if (stage < minimum) continue;
    const extra = jarParams(idx, style);
    for (const key of keys) {
      if (key === "drops" && P.drops) P.drops = [...P.drops, ...extra.drops];
      else P[key] = extra[key];
    }
  }
  P.style = stage === 6 ? 3 : 0;
  return P;
}
export function drawJar(c, idx, level, rgb, overflow = 0) {
  const P = overflowParams(idx, overflow), r = P.r, fill = css(rgb);
  const spilling = level === 5 && overflow > 0;
  c.save(); c.lineJoin = "round"; c.lineCap = "round";

  // puddle sits under the jar
  if (spilling && P.puddle) {
    c.beginPath(); blob(c, P.puddle); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.fillStyle = fill; c.fill();
    c.beginPath(); c.ellipse(20, 172, 10, 2.5, 0, 0, 7); c.fillStyle = "rgba(255,255,255,.55)"; c.fill();
  }

  // liquid inside
  c.save(); bodyPath(c); c.fillStyle = "#fff"; c.fill(); c.clip();
  if (level > 0) {
    const top = 32, bottom = 170, frac = [0, .16, .36, .58, .8, 1][level];
    const ly = level === 5 ? 28 : bottom - (bottom - top) * frac, amp = level === 5 ? 0 : 2.2;
    const g = c.createLinearGradient(0, ly, 0, bottom); g.addColorStop(0, lighten(rgb, .12)); g.addColorStop(1, darken(rgb, .2));
    const surf = () => { for (let x = -4; x <= 100; x += 4) c.lineTo(x, ly + Math.sin(x * 0.11 + P.phase) * amp); };
    c.beginPath(); c.moveTo(-4, ly); surf(); c.lineTo(100, 180); c.lineTo(-4, 180); c.closePath(); c.fillStyle = g; c.fill();
    c.beginPath(); c.moveTo(-4, ly); surf(); c.strokeStyle = lighten(rgb, .45); c.lineWidth = 3; c.stroke();
    c.strokeStyle = css(mix(rgb, [255, 255, 255], .6), .85); c.lineWidth = 1.6;
    for (let i = 0; i < 2 + level; i++) {
      const bx = 18 + r() * 60, by = ly + 10 + r() * Math.max(0, bottom - ly - 22), br = 1.5 + r() * 2.6;
      c.beginPath(); c.arc(bx, by, br, 0, 7); c.stroke();
    }
  }
  c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); roundRect(c, 11, 50, 6, 78, 3); roundRect(c, 11, 134, 6, 10, 3); c.fill();
  c.restore();

  // glass
  bodyPath(c); c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 2.5; c.beginPath(); c.moveTo(18, 160); c.quadraticCurveTo(26, 165, 38, 164); c.moveTo(58, 164); c.quadraticCurveTo(70, 165, 78, 160); c.stroke();
  c.beginPath(); roundRect(c, 12, 20, 72, 14, 4); c.fillStyle = level === 5 ? fill : "#fff"; c.fill(); c.lineWidth = 4; c.stroke();

  // overflow!
  if (spilling) {
    const shapes = [];
    const foamFill = lighten(rgb, .55);
    if (P.style === 3) shapes.push({ fill, path: () => {
      c.moveTo(34, 24); c.quadraticCurveTo(40, 4, 36, -8);
      c.quadraticCurveTo(26, -20, 38, -24); c.quadraticCurveTo(44, -36, 52, -25);
      c.quadraticCurveTo(60, -34, 64, -21); c.quadraticCurveTo(72, -14, 60, -8);
      c.quadraticCurveTo(56, 4, 62, 24); c.closePath(); } });
    shapes.push({ fill, path: () => collar(c, P.base, P.drips) });
    if (P.foam) for (const [x, y, rad] of P.foam) shapes.push({ fill: foamFill, path: () => c.arc(x, y, rad, 0, 7) });
    if (P.drops) for (const [x, y, rad] of P.drops) shapes.push({ fill, path: () => teardrop(c, x, y, rad, P.origin[0], P.origin[1]) });
    if (P.splats) for (const [x, y, rad] of P.splats) shapes.push({ fill, path: () => c.ellipse(x, y, rad, rad * 0.4, 0, 0, 7) });
    if (P.hearts) for (const [x, y, s] of P.hearts) shapes.push({ fill, path: () => heart(c, x, y, s) });

    c.lineWidth = 7; c.strokeStyle = INK;
    for (const s of shapes) { c.beginPath(); s.path(); c.stroke(); }
    for (const s of shapes) { c.beginPath(); s.path(); c.fillStyle = s.fill; c.fill(); }

    // shine
    c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(6, P.base - 14); c.quadraticCurveTo(8, 24, 18, 22);
    for (const d of P.drips) if (d.L > 22) { c.moveTo(d.cx - d.w * 0.22, P.base + 6); c.lineTo(d.cx - d.w * 0.22, P.base + d.L - 6); }
    if (P.hearts) for (const [x, y, s] of P.hearts) { c.moveTo(x - s * 0.75, y - s * 0.25); c.quadraticCurveTo(x - s * 0.7, y - s * 0.7, x - s * 0.35, y - s * 0.75); }
    c.stroke();
    if (P.foam) { c.fillStyle = "rgba(255,255,255,.85)"; for (const [x, y, rad] of P.foam.slice(0, 6)) { c.beginPath(); c.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.22, 0, 7); c.fill(); } }
  }

  // lid
  if (spilling && P.lid) drawLid(c, P.lid.dx, P.lid.dy, P.lid.rot); else drawLid(c);
  c.restore();
}

