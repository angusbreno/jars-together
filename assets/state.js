import { CATALOG } from './catalog.js';

export const LOCALES = ['en-US', 'pt-BR', 'es', 'fr', 'de', 'zh-CN'];
export const STORAGE_KEY = 'jars-together-v1';
export const MAX_OVERFLOW = 6;
export const PRESETS = ['#e63946', '#ff5d8f', '#ff8c42', '#ffd23f', '#7bd389', '#2ec4b6', '#3a86ff', '#5b2a86', '#c77dff', '#8d1d3a', '#8d5524', '#2b2d42'];
export const hexToRgb = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16));
export const rgbToHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
export const emptyAnswer = () => ({ level: 0, overflow: 0 });

export function freshState() {
  return {
    locale: 'en-US', mode: 'kink', name: '', color: '#e63946',
    answers: Object.fromEntries(Object.entries(CATALOG).map(([mode, ids]) =>
      [mode, Object.fromEntries(ids.map(id => [id, emptyAnswer()]))]))
  };
}

// Treat saved browser data as untrusted. Never accept extra modes or item IDs.
export function sanitizeState(input) {
  const state = freshState();
  if (!input || typeof input !== 'object') return state;
  if (LOCALES.includes(input.locale)) state.locale = input.locale;
  if (Object.hasOwn(CATALOG, input.mode)) state.mode = input.mode;
  if (typeof input.name === 'string') state.name = input.name.slice(0, 24);
  if (typeof input.color === 'string' && /^#[\da-f]{6}$/i.test(input.color)) state.color = input.color.toLowerCase();
  for (const [mode, ids] of Object.entries(CATALOG)) {
    for (const id of ids) {
      const answer = input.answers?.[mode]?.[id];
      if (!Number.isInteger(answer?.level) || answer.level < 0 || answer.level > 5) continue;
      state.answers[mode][id] = {
        level: answer.level,
        overflow: answer.level === 5 && Number.isInteger(answer.overflow)
          ? Math.max(0, Math.min(MAX_OVERFLOW, answer.overflow)) : 0
      };
    }
  }
  return state;
}

export function nextAnswer(answer, value) {
  if (!Number.isInteger(value) || value < 0 || value > 5) return answer;
  if (value === 5) return {
    level: 5,
    overflow: answer.level === 5 ? Math.min(MAX_OVERFLOW, answer.overflow + 1) : 0
  };
  return { level: answer.level === value ? 0 : value, overflow: 0 };
}

export function clearMode(state, mode) {
  for (const id of CATALOG[mode]) state.answers[mode][id] = emptyAnswer();
}
