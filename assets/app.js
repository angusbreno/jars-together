import { CATALOG } from './catalog.js';
import { LOCALES, STORAGE_KEY, PRESETS, freshState, sanitizeState, nextAnswer, clearMode, hexToRgb, rgbToHex } from './state.js';
import { lum } from './jars.js';
import { drawMini, drawPoster } from './poster.js';

const $ = id => document.getElementById(id);
let state = freshState(), storageAvailable = true;
try { state = sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
catch { /* A corrupt save should not prevent using the questionnaire. */ }
let dictionaries, minis = [], imageUrl, saving = false, frame;
const dictionary = () => dictionaries[state.locale];
const t = (key, values = {}) => dictionary().ui[key].replace(/\{(\w+)\}/g, (_, token) => values[token] ?? `{${token}}`);

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('storageWarning').hidden = storageAvailable;
  $('storageWarning').textContent = t('storageError');
}

function closeTips() {
  document.querySelectorAll('.help-button').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    button.dataset.pinned = 'false';
    $(button.getAttribute('aria-controls')).hidden = true;
  });
}

function buildQuestions() {
  closeTips(); minis = []; $('questions').replaceChildren();
  CATALOG[state.mode].forEach((id, index) => {
    const [label, description] = dictionary().items[state.mode][index];
    const row = $('question-template').content.firstElementChild.cloneNode(true);
    row.dataset.item = id;
    row.querySelector('.qnum').textContent = t('of', { n: index + 1, total: CATALOG[state.mode].length });
    const heading = row.querySelector('.qlabel'); heading.textContent = label; heading.id = `label-${id}`;
    const help = row.querySelector('.help'), button = help.querySelector('button'), tip = help.querySelector('.tooltip');
    tip.id = `tip-${id}`; tip.textContent = description;
    button.setAttribute('aria-label', t('explain', { label }));
    button.setAttribute('aria-controls', tip.id); button.setAttribute('aria-describedby', tip.id);
    const show = () => { closeTips(); tip.hidden = false; button.setAttribute('aria-expanded', 'true'); };
    const hide = () => { if (button.dataset.pinned !== 'true') { tip.hidden = true; button.setAttribute('aria-expanded', 'false'); } };
    help.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(); });
    help.addEventListener('pointerleave', () => { if (document.activeElement !== button) hide(); });
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
    button.addEventListener('click', () => {
      const pin = button.dataset.pinned !== 'true';
      closeTips();
      if (pin) { tip.hidden = false; button.dataset.pinned = 'true'; button.setAttribute('aria-expanded', 'true'); }
    });
    const scale = row.querySelector('.scale'); scale.setAttribute('aria-labelledby', heading.id);
    for (let value = 0; value <= 5; value++) {
      const rating = document.createElement('button'); rating.type = 'button'; rating.textContent = value;
      rating.setAttribute('aria-label', t('rating', { label, value }));
      rating.title = value === 0 ? t('empty') : value === 5 ? t('fillHint') : String(value);
      rating.addEventListener('click', () => {
        state.answers[state.mode][id] = nextAnswer(state.answers[state.mode][id], value);
        persist(); render();
      });
      scale.append(rating);
    }
    row.querySelector('.ends span:first-child').textContent = t('empty');
    row.querySelector('.ends span:last-child').textContent = t('full');
    minis.push({ id, canvas: row.querySelector('canvas'), buttons: [...scale.children], status: row.querySelector('.answer-status') });
    $('questions').append(row);
  });
}

function translate() {
  document.documentElement.lang = state.locale; document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-step]').forEach(element => { element.textContent = t('step', { n: element.dataset.step }); });
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === state.mode));
  $('collectionHeading').textContent = t(state.mode + 'Title');
  $('adultNote').hidden = state.mode !== 'kink';
  $('language').value = state.locale;
  $('name').placeholder = t('namePlaceholder');
  $('swatches').setAttribute('aria-label', t('colorChoices'));
  $('hex').setAttribute('aria-label', t('colorCode'));
  $('poster').setAttribute('aria-label', t('preview'));
  $('modalImg').alt = t('imageAlt');
  $('storageWarning').textContent = t('storageError');
  [...$('swatches').children].forEach(button => button.setAttribute('aria-label', t('colorSwatch', { color: button.dataset.hex })));
  buildQuestions(); render();
}

function render() {
  const rgb = hexToRgb(state.color);
  document.documentElement.style.setProperty('--c', state.color);
  document.documentElement.style.setProperty('--on-c', lum(rgb) > 0.6 ? '#151311' : '#fff');
  ['r', 'g', 'b'].forEach((key, i) => {
    $(key).value = rgb[i]; $(key + 'v').textContent = rgb[i];
    const low = [...rgb], high = [...rgb]; low[i] = 0; high[i] = 255;
    $(key).style.background = `linear-gradient(to right, rgb(${low.join(',')}), rgb(${high.join(',')}))`;
  });
  if (document.activeElement !== $('hex')) $('hex').value = state.color.toUpperCase();
  [...$('swatches').children].forEach(button => button.setAttribute('aria-pressed', button.dataset.hex === state.color));
  drawMini($('pv1'), 3, { level: 2, overflow: 0 }, state.color);
  drawMini($('pv2'), 9, { level: 4, overflow: 0 }, state.color);
  drawMini($('pv3'), 2, { level: 5, overflow: 5 }, state.color);
  minis.forEach((mini, index) => {
    const answer = state.answers[state.mode][mini.id];
    drawMini(mini.canvas, index, answer, state.color);
    mini.buttons.forEach((button, value) => button.setAttribute('aria-pressed', value === answer.level));
    mini.status.textContent = answer.level === 0 ? t('empty') : answer.level === 5
      ? answer.overflow === 0 ? t('full') : answer.overflow === 6 ? t('maxOverflow') : t('overflow', { stage: answer.overflow })
      : `${answer.level}/5`;
    mini.canvas.dataset.level = answer.level; mini.canvas.dataset.overflow = answer.overflow;
  });
  const count = Object.values(state.answers[state.mode]).filter(answer => answer.level > 0).length;
  $('progress').textContent = t('progress', { n: count, total: CATALOG[state.mode].length });
  drawPoster($('poster'), state, dictionary());
}

function queueRender() {
  cancelAnimationFrame(frame); frame = requestAnimationFrame(render);
}

function setColor(color) { state.color = color; persist(); queueRender(); }

async function save() {
  if (saving) return;
  saving = true; $('save').disabled = true; $('saveBar').disabled = true;
  try {
    await prepareFonts();
    const canvas = document.createElement('canvas');
    drawPoster(canvas, state, dictionary(), 2);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = URL.createObjectURL(blob);
    const slug = state.name.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const link = document.createElement('a'); link.href = imageUrl;
    link.download = `${slug ? slug + '-' : ''}${state.mode}-jars-${state.locale}.png`;
    document.body.append(link); link.click(); link.remove();
    $('modalImg').src = imageUrl; $('modal').showModal();
  } catch { alert(t('saveError')); }
  finally { saving = false; $('save').disabled = false; $('saveBar').disabled = false; }
}

async function boot() {
  dictionaries = Object.fromEntries(await Promise.all(LOCALES.map(async locale => {
    const response = await fetch(new URL(`../locales/${locale}.json`, import.meta.url));
    if (!response.ok) throw new Error(`Missing locale: ${locale}`);
    return [locale, await response.json()];
  })));
  PRESETS.forEach(hex => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'sw';
    button.style.background = hex; button.dataset.hex = hex;
    button.addEventListener('click', () => setColor(hex)); $('swatches').append(button);
  });
  $('name').value = state.name;
  $('name').addEventListener('input', event => { state.name = event.target.value.slice(0, 24); persist(); queueRender(); });
  $('language').addEventListener('change', event => { state.locale = event.target.value; persist(); translate(); });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    state.mode = button.dataset.mode; persist(); translate();
  }));
  ['r', 'g', 'b'].forEach((key, index) => $(key).addEventListener('input', () => {
    const rgb = hexToRgb(state.color); rgb[index] = Number($(key).value); setColor(rgbToHex(rgb));
  }));
  $('hex').addEventListener('input', event => {
    let hex = event.target.value.trim(); if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[\da-f]{3}$/i.test(hex)) hex = '#' + [...hex.slice(1)].map(v => v + v).join('');
    if (/^#[\da-f]{6}$/i.test(hex)) setColor(hex.toLowerCase());
  });
  $('hex').addEventListener('blur', () => { $('hex').value = state.color.toUpperCase(); });
  $('surprise').addEventListener('click', () => setColor(PRESETS[Math.floor(Math.random() * PRESETS.length)]));
  $('save').addEventListener('click', save); $('saveBar').addEventListener('click', save);
  $('closeModal').addEventListener('click', () => $('modal').close());
  $('modal').addEventListener('click', event => { if (event.target === $('modal')) $('modal').close(); });
  $('reset').addEventListener('click', () => {
    if (!confirm(t('resetConfirm', { mode: t(state.mode) }))) return;
    clearMode(state, state.mode); persist(); render();
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.help')) closeTips(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeTips(); });
  translate(); persist();
  await prepareFonts(); render();
}

// The handwritten font is only used on canvas, so explicitly load it for export.
async function prepareFonts() {
  await Promise.all([
    document.fonts.load('700 30px Oswald'),
    document.fonts.load('600 28px Oswald'),
    document.fonts.load('400 24px Nunito'),
    document.fonts.load('400 66px "Permanent Marker"')
  ]);
  await document.fonts.ready;
}

boot().catch(error => { console.error(error); $('bootError').hidden = false; });
