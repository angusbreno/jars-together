import { drawJar } from './jars.js';
import { CATALOG } from './catalog.js';
import { hexToRgb } from './state.js';

// Wrapping by character also handles Chinese text and long German words.
export function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const char of text) {
    const candidate = line + char;
    if (line && context.measureText(candidate).width > maxWidth) {
      const space = line.lastIndexOf(' ');
      if (space > 0) {
        lines.push(line.slice(0, space));
        line = line.slice(space + 1) + char;
      } else {
        lines.push(line.trim());
        line = char.trimStart();
      }
    } else line = candidate;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export function drawMini(canvas, index, answer, color) {
  canvas.width = 180; canvas.height = 268;
  const context = canvas.getContext('2d');
  context.translate(42, 64);
  drawJar(context, index, answer.level, hexToRgb(color), answer.overflow);
}

export function drawPoster(canvas, state, dictionary, scale = 1) {
  const ids = CATALOG[state.mode], labels = dictionary.items[state.mode];
  const width = 1200, columns = 7, rowHeight = 350, top = 300;
  const height = top + Math.ceil(ids.length / columns) * rowHeight + 30;
  canvas.width = width * scale; canvas.height = height * scale;
  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.fillStyle = '#fff'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#151311'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const title = dictionary.ui[state.mode + 'Title'];
  let size = 104;
  const titleFont = () => { c.font = `700 ${size}px Oswald, system-ui, sans-serif`; };
  titleFont();
  while (c.measureText(title).width > 720 && size > 32) { size -= 2; titleFont(); }
  const lineWidth = 300, gap = 26;
  const x = (width - lineWidth - gap - c.measureText(title).width) / 2;
  c.fillRect(x, 135, lineWidth, 6);
  c.fillText(title, x + lineWidth + gap, 140);
  const name = state.name.trim();
  if (name) {
    let nameSize = 66;
    const nameFont = () => { c.font = `${nameSize}px 'Permanent Marker', cursive, system-ui`; };
    nameFont();
    while (c.measureText(name).width > lineWidth - 14 && nameSize > 16) { nameSize -= 2; nameFont(); }
    c.textAlign = 'center'; c.fillText(name, x + lineWidth / 2, 119);
  }
  c.textAlign = 'center'; c.fillStyle = '#555';
  c.font = '500 24px Nunito, system-ui, sans-serif';
  wrapText(c, dictionary.ui.legend, 1080).forEach((line, i) => c.fillText(line, width / 2, 205 + i * 32));
  const rgb = hexToRgb(state.color);
  ids.forEach((id, index) => {
    const cx = width / 2 + (index % columns - 3) * 160;
    const y = top + Math.floor(index / columns) * rowHeight;
    const answer = state.answers[state.mode][id];
    c.save(); c.translate(cx - 48, y); drawJar(c, index, answer.level, rgb, answer.overflow); c.restore();
    let labelSize = 28, lines;
    do {
      c.font = `600 ${labelSize}px Oswald, system-ui, sans-serif`;
      lines = wrapText(c, labels[index][0], 145);
      if (lines.length <= 4 || labelSize <= 18) break;
      labelSize--;
    } while (true);
    c.fillStyle = '#151311'; c.textAlign = 'center';
    lines.forEach((line, n) => c.fillText(line, cx, y + 215 + n * (labelSize + 5)));
  });
}
