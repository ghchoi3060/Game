// 게임 모음 팝업: 친구와 실제로 연결됐을 때만 '연결된 방' 안내(저장된 옛 방 기록만 있으면 안 뜸)
import { serve, launch, sleep, until } from './cdp.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const { server, base } = await serve(ROOT);
const b = await launch();
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const U = g => base + '/' + encodeURIComponent(g) + '/';
const warn = P => P.ev(`(()=>{document.querySelector('.brand').click();const w=!!document.querySelector('#homeMsg .warn');document.querySelector('.home-bg [data-a=stay]').click();return w;})()`);
try {
  // 다른 게임(체스)의 옛 방 기록 + 빙고 옛 방 기록이 남아 있는 폰
  const H = await b.page(U('스도쿠'));
  await H.ev(`localStorage.setItem('solsol.room',JSON.stringify({id:'OLD123',host:true}));1`);
  await H.nav(U('스도쿠')); ok(!(await warn(H)), 'sudoku with stale chess room: no warning');
  await H.nav(U('빙고')); await H.ev(`document.querySelector('[data-tab=friends]').click();document.querySelector('[data-act=create]').click();1`);
  const code = await until(() => H.ev(`(document.querySelector('.code')||{}).textContent`), 10000);
  await sleep(1500); ok(!(await warn(H)), 'bingo host alone in room: no warning');
  const G = await b.page(U('빙고') + '#join-' + code);
  await until(async () => (await H.ev(`document.querySelectorAll('#view-friends .member').length`)) === 2, 30000);
  ok(await warn(H), 'bingo host with friend connected: warning shown');
  ok(await warn(G), 'bingo guest connected: warning shown');
  await G.ev(`document.querySelector('[data-tab=friends]').click();document.querySelector('[data-act=leave]').click();1`);
  await sleep(4000); ok(!(await warn(H)), 'after friend left: no warning');
} catch (e) { console.log('ERROR', e.message); }
finally { b.close(); server.close(); process.exit(0); }
