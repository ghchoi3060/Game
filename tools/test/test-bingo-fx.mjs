// 빙고 이펙트 눈으로 확인: 봇 대전을 자동으로 두며 줄 완성(공돌이)·승리(웃는 공·하트 비)·패배(졸린 공) 순간을 캡처
import { serve, launch, sleep, until } from './cdp.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = process.argv[2] || '.';
const { server, base } = await serve(ROOT);
const b = await launch();
const U = base + '/' + encodeURIComponent('빙고') + '/';
const got = {};
try {
  const P = await b.page(U);
  await P.ev(`localStorage.setItem('bingo.prefs',JSON.stringify({bots:1,level:0,target:3}));1`); await P.nav(U);
  for (let game = 0; game < 6 && !(got.win && got.sad && got.line); game++) {
    await P.ev(`(()=>{const r=document.getElementById('result');if(!r.hidden){const b=[...r.querySelectorAll('button')].find(x=>/한 판 더/.test(x.textContent));b&&b.click();}const s=[...document.querySelectorAll('#actions button')].find(x=>x.textContent==='시작');s&&s.click();return 1;})()`);
    const t = Date.now();
    while (Date.now() - t < 90000) {
      const st = await P.ev(`(()=>{const m=document.querySelector('#wrap .mascot');const rain=!!document.querySelector('.rain');const intro=document.getElementById('intro');if(intro&&!intro.hidden){const ok=document.getElementById('introOk');ok&&ok.click();}
        const res=!document.getElementById('result').hidden;
        if(!m&&!res){const c=[...document.querySelectorAll('#board .cell')].filter(x=>!/on|mark|hit|called/.test(x.className));if(c.length)c[Math.floor(Math.random()*c.length)].click();}
        return {m:m?(m.className.replace('mascot','').trim()||'line'):null,rain,res};})()`);
      if (st.m && !got[st.m]) { await sleep(450); await P.shot(`${OUT}/fx-${st.m}.png`); got[st.m] = 1; console.log('captured', st.m, st.rain ? '(rain)' : ''); }
      if (st.res) break;
      await sleep(180);
    }
  }
  const errs = P.logs.filter(l => /EXC|error/i.test(l)); console.log('errors:', errs.slice(0, 3));
} catch (e) { console.log('ERROR', e.message); }
finally { console.log('got', JSON.stringify(got)); b.close(); server.close(); process.exit(0); }
