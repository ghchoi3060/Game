// headless Chrome + CDP 도우미. 게임 폴더를 로컬 서버로 열고, 저장소가 분리된 창(browser context)을 여러 개 만든다.
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
export function serve(root, extra = {}) {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (extra[p]) { rsp.setHeader('Content-Type', 'text/html; charset=utf-8'); return rsp.end(extra[p]); }
      let f = join(root, p);
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      if (!existsSync(f)) { rsp.statusCode = 404; return rsp.end(); }
      rsp.setHeader('Content-Type', MIME[extname(f)] || 'application/octet-stream'); rsp.end(readFileSync(f));
    });
    s.listen(0, '127.0.0.1', () => res({ server: s, base: `http://127.0.0.1:${s.address().port}` }));
  });
}

export async function launch() {
  const prof = mkdtempSync(join(tmpdir(), 'cdp-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${prof}`, '--remote-debugging-port=0', '--no-first-run', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 100 && !port; i++) { await new Promise(r => setTimeout(r, 100)); try { port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch {} }
  const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; const evh = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } else evh.forEach(f => f(m)); };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend[i] = m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  async function page(url) {
    const { browserContextId } = await send('Target.createBrowserContext');
    const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const logs = [];
    evh.push(m => { if (m.sessionId === sessionId && m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' ')); if (m.sessionId === sessionId && m.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + m.params.exceptionDetails.exception?.description); });
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const nav = async (u) => { await send('Page.navigate', { url: u }, sessionId); await new Promise(r => setTimeout(r, 300)); for (let i = 0; i < 50; i++) { if (await ev('document.readyState').catch(() => '') === 'complete') break; await new Promise(r => setTimeout(r, 100)); } };
    if (url) await nav(url);
    const shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }, sessionId); (await import('node:fs')).writeFileSync(file, Buffer.from(r.data, 'base64')); };
    return { ev, nav, shot, logs, sessionId, close: () => send('Target.disposeBrowserContext', { browserContextId }) };
  }
  return { page, close: () => { try { ws.close(); } catch {} chrome.kill(); } };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function until(fn, ms = 20000, step = 250) { const t = Date.now(); let v; while (Date.now() - t < ms) { v = await fn().catch(e => undefined); if (v) return v; await sleep(step); } return v; }
