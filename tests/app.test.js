import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG } from '../assets/catalog.js';
import { LOCALES, freshState, nextAnswer, sanitizeState, clearMode } from '../assets/state.js';
import { drawJar, overflowParams, OVERFLOW_STAGES } from '../assets/jars.js';
import { drawPoster, wrapText } from '../assets/poster.js';

const readLocale = async locale => JSON.parse(await readFile(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8'));

test('5 starts full, grows on every click, and stays at the maximum', () => {
  let answer = { level: 0, overflow: 0 };
  answer = nextAnswer(answer, 5);
  assert.deepEqual(answer, { level: 5, overflow: 0 });
  for (let stage = 1; stage <= 6; stage++) {
    answer = nextAnswer(answer, 5);
    assert.deepEqual(answer, { level: 5, overflow: stage });
  }
  for (let click = 0; click < 30; click++) answer = nextAnswer(answer, 5);
  assert.deepEqual(answer, { level: 5, overflow: 6 });
});

test('every lower rating clears overflow; returning to 5 always starts full', () => {
  for (let value = 0; value < 5; value++) {
    const lower = nextAnswer({ level: 5, overflow: 6 }, value);
    assert.deepEqual(lower, { level: value, overflow: 0 });
    assert.deepEqual(nextAnswer(lower, 5), { level: 5, overflow: 0 });
    assert.deepEqual(nextAnswer(lower, value), { level: 0, overflow: 0 });
  }
});

test('collections retain independent answers through language changes and reloads', () => {
  const state = freshState();
  state.answers.kink.dom = { level: 5, overflow: 4 };
  state.answers.romance['hug-behind-give'] = { level: 3, overflow: 0 };
  state.mode = 'romance'; state.locale = 'zh-CN'; state.name = 'Teste 测试'; state.color = '#2ec4b6';
  const restored = sanitizeState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  clearMode(restored, 'romance');
  assert.deepEqual(restored.answers.kink.dom, { level: 5, overflow: 4 });
  assert.ok(Object.values(restored.answers.romance).every(answer => answer.level === 0 && answer.overflow === 0));
  assert.equal(restored.name, 'Teste 测试');
});

test('corrupt saved data cannot inject invalid colors, locales, ratings, or item IDs', () => {
  const clean = sanitizeState({
    name: 'a'.repeat(50), locale: '../bad', mode: '__proto__', color: 'url(bad)',
    answers: { kink: { dom: { level: 5, overflow: 999 }, sub: { level: 2, overflow: 4 }, switch: { level: -1, overflow: 9 }, fake: { level: 4 } } }
  });
  assert.equal(clean.locale, 'en-US'); assert.equal(clean.mode, 'kink'); assert.equal(clean.name.length, 24);
  assert.equal(clean.color, '#e63946');
  assert.deepEqual(clean.answers.kink.dom, { level: 5, overflow: 6 });
  assert.deepEqual(clean.answers.kink.sub, { level: 2, overflow: 0 });
  assert.deepEqual(clean.answers.kink.switch, { level: 0, overflow: 0 });
  assert.equal(Object.hasOwn(clean.answers.kink, 'fake'), false);
  assert.deepEqual(sanitizeState(null), freshState());
});

test('all six locales cover all 56 original items, controls, and placeholders', async () => {
  assert.equal(LOCALES.length, 6); assert.equal(freshState().locale, 'en-US');
  const english = await readLocale('en-US');
  for (const locale of LOCALES) {
    const dictionary = await readLocale(locale);
    assert.deepEqual(Object.keys(dictionary.ui).sort(), Object.keys(english.ui).sort(), locale);
    for (const [key, text] of Object.entries(dictionary.ui)) {
      assert.ok(typeof text === 'string' && text.trim(), `${locale}: ${key}`);
      assert.deepEqual([...text.matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), [...english.ui[key].matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), `${locale}: ${key}`);
    }
    for (const [mode, ids] of Object.entries(CATALOG)) {
      assert.equal(ids.length, 28); assert.equal(new Set(ids).size, 28);
      assert.equal(dictionary.items[mode].length, ids.length, `${locale}: ${mode}`);
      for (const item of dictionary.items[mode]) {
        assert.equal(item.length, 2);
        assert.ok(item.every(text => typeof text === 'string' && text.trim()), locale);
      }
    }
  }
});

function recordingContext() {
  const calls = [];
  const target = {
    calls, font: '28px sans-serif',
    measureText(text) { return { width: [...text].length * (parseFloat(this.font.match(/\d+px/)?.[0]) || 28) * 0.55 }; },
    createLinearGradient(...args) { calls.push(['gradient', ...args]); return { addColorStop: (...args) => calls.push(['stop', ...args]) }; }
  };
  return new Proxy(target, {
    get(object, key) { return key in object ? object[key] : (...args) => calls.push([key, ...args]); },
    set(object, key, value) { object[key] = value; return true; }
  });
}

test('each spill adds features, produces a distinct drawing, and remains deterministic', () => {
  const recordings = [];
  for (let stage = 0; stage < OVERFLOW_STAGES.length; stage++) {
    const a = recordingContext(), b = recordingContext();
    drawJar(a, 3, 5, [230, 57, 70], stage); drawJar(b, 3, 5, [230, 57, 70], stage);
    assert.deepEqual(a.calls, b.calls);
    recordings.push(JSON.stringify(a.calls));
    const params = overflowParams(3, stage);
    if (stage >= 2) assert.ok(params.puddle);
    if (stage >= 3) assert.ok(params.hearts);
    if (stage >= 4) assert.ok(params.splats);
    if (stage >= 5) assert.ok(params.foam);
    if (stage === 6) assert.equal(params.style, 3);
  }
  assert.equal(new Set(recordings).size, 7);
  const lowerA = recordingContext(), lowerB = recordingContext();
  drawJar(lowerA, 3, 4, [230, 57, 70], 0); drawJar(lowerB, 3, 4, [230, 57, 70], 6);
  assert.deepEqual(lowerA.calls, lowerB.calls);
});

test('poster uses the selected locale and answers for every collection, including Chinese', async () => {
  for (const locale of LOCALES) {
    const dictionary = await readLocale(locale), state = freshState();
    state.locale = locale; state.name = 'Teste 测试';
    for (const mode of Object.keys(CATALOG)) {
      state.mode = mode;
      CATALOG[mode].forEach((id, i) => { state.answers[mode][id] = { level: 5, overflow: i % 7 }; });
      const context = recordingContext(), canvas = { getContext: () => context };
      drawPoster(canvas, state, dictionary, 2);
      assert.equal(canvas.width, 2400); assert.equal(canvas.height, 3460);
      assert.ok(context.calls.some(call => call[0] === 'fillText' && call[1] === dictionary.ui[mode + 'Title']));
      assert.ok(context.calls.some(call => call[0] === 'fillText' && call[1] === state.name));
      assert.ok(context.calls.filter(call => call[0] === 'fillText').length >= 30);
      for (const call of context.calls) assert.ok(call.every(value => typeof value !== 'number' || Number.isFinite(value)));
    }
  }
});

test('label wrapping keeps words together and supports scripts without spaces', () => {
  const context = { measureText: text => ({ width: [...text].length }) };
  assert.deepEqual(wrapText(context, 'Being choked', 11), ['Being', 'choked']);
  assert.deepEqual(wrapText(context, '从背后拥抱对方', 3), ['从背后', '拥抱对', '方']);
  assert.ok(wrapText(context, 'Orgasmenkontrolle', 5).every(line => line.length <= 5));
});
