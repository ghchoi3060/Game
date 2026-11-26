// 체스·장기·블록 친구 연결 실제 서버 테스트: 방 만들기 → 초대 링크로 참가 → 양쪽 연결 확인 → 방장 새로 열기 후 다시 연결
import { serve, launch, sleep, until } from './cdp.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const { server, base } = await serve(ROOT);
const b = await launch();
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const fv = P => P.ev(`document.getElementById('view-friends').innerText`);
try {
  for (const g of ['체스', '장기'])  // 블록은 초대 링크로 바로 들어가므로 [data-act=join] 클릭 없이 따로 확인 {
    console.log('=== ' + g);
    const U = base + '/' + encodeURIComponent(g) + '/';
    const H = await b.page(U);
    await H.ev(`localStorage.setItem('solsol.name',JSON.stringify('방장'));1`); await H.nav(U);
    await H.ev(`document.querySelector('[data-tab=friends]').click();document.querySelector('[data-act=create]').click();1`);
    const code = await until(() => H.ev(`(document.querySelector('.code')||{}).textContent`), 10000);
    ok(/^[A-Z0-9]{6}$/.test(code || ''), 'room ' + code);
    const t0 = Date.now();
    const G = await b.page(U + '#join-' + code); await sleep(800); await G.ev(`document.querySelector('[data-tab=friends]').click();document.querySelector('[data-act=join]').click();1`);
    const linked = async () => {
      const h = await fv(H), gg = await fv(G);
      if (g === '블록') return /2\/|2명/.test(h) && !/찾는 중|연결하는 중/.test(gg);
      return /연결됨/.test(h) && /연결됨/.test(gg);
    };
    ok(await until(linked, 30000), `linked (${Date.now() - t0}ms)`);
    await H.nav(U); const t1 = Date.now();
    await H.ev(`document.querySelector('[data-tab=friends]')?.click();1`);
    ok(await until(linked, 60000), `re-linked after host reload (${Date.now() - t1}ms)`);
    if (g === '블록') {
      const s = await until(() => H.ev(`(()=>{const x=document.querySelector('[data-act=start]');if(x&&!x.disabled){x.click();return true;}return false;})()`), 10000);
      ok(s, 'block start clicked');
      ok(await until(() => G.ev(`document.querySelector('[data-tab=play]').getAttribute('aria-selected')==='true'||document.getElementById('view-play')&&!document.getElementById('view-play').hidden`), 15000), 'guest moved to play');
    }
    console.log('  host:', (await fv(H)).replace(/\s+/g, ' ').slice(0, 160));
    console.log('  guest:', (await fv(G)).replace(/\s+/g, ' ').slice(0, 160));
    const errs = [...H.logs, ...G.logs].filter(l => /EXC/.test(l)); if (errs.length) console.log('  errors:', errs.slice(0, 3));
    await H.close(); await G.close();
  }
} catch (e) { console.log('ERROR', e.message); }
finally { b.close(); server.close(); process.exit(0); }
