import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { sanitizeState, freshState } from '../assets/state.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('CSP blocks inline scripts, external resources, plugins, base URL injection, and form submissions', async () => {
  const html = await read('index.html');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const directives = Object.fromEntries(policy.split(';').map(entry => entry.trim().split(/\s+/)).filter(([key]) => key).map(([key, ...values]) => [key, values]));
  assert.deepEqual(directives['default-src'], ["'none'"]);
  assert.deepEqual(directives['script-src'], ["'self'"]);
  assert.deepEqual(directives['script-src-attr'], ["'none'"]);
  assert.deepEqual(directives['connect-src'], ["'self'"]);
  assert.deepEqual(directives['font-src'], ["'self'"]);
  for (const key of ['object-src', 'base-uri', 'form-action']) assert.deepEqual(directives[key], ["'none'"]);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i);
  assert.doesNotMatch(html, /\son\w+\s*=/i);
});

test('all automatically loaded assets and fonts are local; credit links cannot control their opener', async () => {
  const html = await read('index.html');
  for (const match of html.matchAll(/<(script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/gi)) {
    assert.ok(match[2].startsWith('./'), match[0]);
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) assert.match(match[0], /rel="noopener noreferrer"/);
  const css = await read('assets/styles.css');
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/gi)) assert.ok(match[1].startsWith('./fonts/'), match[1]);
  for (const font of ['oswald.ttf', 'nunito.ttf', 'permanent-marker.ttf']) {
    const bytes = await readFile(new URL(`assets/fonts/${font}`, root));
    assert.equal(bytes.subarray(0, 4).toString('hex'), '00010000');
  }
});

test('application code has no HTML interpretation or JavaScript evaluation sinks', async () => {
  for (const file of await readdir(new URL('assets/', root))) {
    if (!file.endsWith('.js')) continue;
    const source = await read('assets/' + file);
    assert.doesNotMatch(source, /\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/, file);
  }
  const app = await read('assets/app.js');
  assert.match(app, /tip\.textContent = description/);
  assert.match(app, /heading\.textContent = label/);
  assert.match(app, /question-template/);
});

test('malicious saved preferences cannot control locale paths, CSS, object prototypes, or extra properties', () => {
  const input = JSON.parse('{"__proto__":{"polluted":true},"locale":"../../evil","mode":"constructor","color":"url(https://example.invalid)","answers":{"kink":{"__proto__":{"level":5},"dom":{"level":5,"overflow":-999,"extra":"ignored"}}}}');
  const state = sanitizeState(input);
  assert.equal(state.locale, 'en-US'); assert.equal(state.mode, 'kink');
  assert.equal(state.color, freshState().color);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.hasOwn(state, '__proto__'), false);
  assert.equal(Object.hasOwn(state.answers.kink, '__proto__'), false);
  assert.deepEqual(state.answers.kink.dom, { level: 5, overflow: 0 });
});

test('deployment actions are pinned and write permissions are isolated from code execution', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  const actions = [...workflow.matchAll(/uses:\s*([^\s@]+)@([^\s]+)/g)];
  assert.equal(actions.length, 4);
  for (const [, name, revision] of actions) {
    assert.ok(name.startsWith('actions/'), name);
    assert.match(revision, /^[a-f0-9]{40}$/, name);
  }
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /pull_request_target|write-all/);
  const build = workflow.slice(workflow.indexOf('  build:'), workflow.indexOf('  deploy:'));
  const deploy = workflow.slice(workflow.indexOf('  deploy:'));
  assert.doesNotMatch(build, /pages: write|id-token: write/);
  assert.match(deploy, /pages: write/);
  assert.match(deploy, /id-token: write/);
  assert.doesNotMatch(deploy, /run:|checkout@/);
});
