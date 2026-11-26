// 빙고 친구 대전 실제 서버 테스트: 방장+친구 2명(저장소 분리), 초대 링크 참가, 방장 앱 새로 열기, 준비·시작·끝까지
import { serve, launch, sleep, until } from './cdp.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const { server, base } = await serve(ROOT);
const b = await launch();
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const URL0 = base + '/' + encodeURIComponent('빙고') + '/';
const clickText = (P, sel, re) => P.ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${re}.test(x.textContent)&&!x.disabled);if(b){b.click();return true;}return false;})()`);
try {
  const H = await b.page(URL0);
  await H.ev(`localStorage.setItem('solsol.name',JSON.stringify('방장'));document.querySelector('[data-tab=friends]').click();1`);
  await H.nav(URL0);
  await H.ev(`document.querySelector('[data-tab=friends]').click();document.querySelector('[data-act=create]').click();1`);
  const code = await until(() => H.ev(`(document.querySelector('.code')||{}).textContent`), 10000);
  ok(/^[A-Z0-9]{6}$/.test(code || ''), 'room created ' + code);
  await until(() => H.ev(`!/다시 연결/.test(document.getElementById('view-friends').textContent)`), 10000);
  const t0 = Date.now();
  const G1 = await b.page(URL0 + '#join-' + code), G2 = await b.page(URL0 + '#join-' + code);
  const members = P => P.ev(`document.querySelectorAll('#view-friends .member').length`);
  ok(await until(async () => (await members(H)) === 3, 30000), `host sees 3 members (${Date.now() - t0}ms)`);
  ok(await until(async () => (await members(G1)) === 3 && (await members(G2)) === 3, 15000), 'guests see 3 members');

  // 방장이 앱을 새로 엶(아이폰이 카카오톡 다녀온 뒤 페이지를 다시 불러오는 상황)
  await H.nav(URL0);
  const t1 = Date.now();
  ok(await until(async () => (await members(H)) === 3, 60000), `after host reload, host sees 3 members again (${Date.now() - t1}ms)`);

  // 준비 → 시작
  for (const P of [G1, G2, H]) { await P.ev(`document.querySelector('[data-tab=play]').click();1`); }
  for (const P of [G1, G2]) ok(await until(() => clickText(P, '#actions button', /준비 완료/), 10000), 'guest ready');
  await sleep(1500);
  ok(await until(() => clickText(H, '#actions button', /준비 완료/), 10000), 'host ready');
  ok(await until(() => clickText(H, '#actions button', /시작 \(3명\)/), 15000), 'host start enabled & clicked');
  // 끝까지(차례마다 5초 자동 선택)
  const resVisible = P => P.ev(`!document.getElementById('result').hidden`);
  const done = await until(async () => (await resVisible(H)) && (await resVisible(G1)) && (await resVisible(G2)), 300000, 1000);
  ok(done, 'game finished on all 3');
  const calls = P => P.ev(`[...document.querySelectorAll('#calls span:not(.lbl)')].map(s=>s.textContent).join(',')`);
  const info = P => P.ev(`document.getElementById('resInfo').textContent`);
  const [c1, c2, c3] = [await calls(H), await calls(G1), await calls(G2)];
  ok(c1 && c1 === c2 && c2 === c3, 'same called numbers: ' + c1);
  const [i1, i2, i3] = [await info(H), await info(G1), await info(G2)];
  console.log('result:', i1, '|', i2, '|', i3);
  const errs = [...H.logs, ...G1.logs, ...G2.logs].filter(l => /EXC|error/i.test(l));
  console.log('page errors:', errs.slice(0, 5));
} catch (e) { console.log('ERROR', e.message); }
finally { b.close(); server.close(); process.exit(0); }
