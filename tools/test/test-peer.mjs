// common/peer.js 단독 테스트(실제 Supabase 서버): 연결·주고받기·없는 방·방장 나감·방장 새로 열기
import { serve, launch, sleep, until } from './cdp.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const T = `<!DOCTYPE html><meta charset=utf-8><script src="/common/supabase-config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="/common/peer.js"></script><script>window.L=[];function log(s){L.push(s);}</script>`;
const { server, base } = await serve(ROOT, { '/__t.html': T });
const b = await launch();
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
try {
  const A = await b.page(base + '/__t.html'), G1 = await b.page(base + '/__t.html'), G2 = await b.page(base + '/__t.html');
  const HID = 'solsoltest-' + Math.random().toString(36).slice(2, 8);
  await A.ev(`window.h=new Peer('${HID}');h.on('open',id=>log('open '+id));h.on('error',e=>log('err '+e.type));
    h.on('connection',c=>{c.on('open',()=>log('conn '+c.peer));c.on('data',d=>{log('data '+JSON.stringify(d));c.send({pong:d.ping});});c.on('close',()=>log('close '+c.peer));});1`);
  ok(await until(() => A.ev(`L.includes('open ${HID}')`), 15000), 'host open');
  const guest = (P, name) => P.ev(`window.p=new Peer();p.on('error',e=>log('err '+e.type));p.on('open',()=>{log('open');window.c=p.connect('${HID}',{reliable:true});
    c.on('open',()=>{log('copen');c.send({ping:'${name}'});});c.on('data',d=>log('data '+JSON.stringify(d)));c.on('close',()=>log('cclose'));});1`);
  const t0 = Date.now();
  await guest(G1, 'g1'); await guest(G2, 'g2');
  ok(await until(() => G1.ev(`L.includes('data {"pong":"g1"}')`), 15000), `guest1 ping/pong (${Date.now() - t0}ms)`);
  ok(await until(() => G2.ev(`L.includes('data {"pong":"g2"}')`), 15000), 'guest2 ping/pong (no cross-talk: ' + !(await G2.ev(`L.some(x=>x.includes('g1'))`)) + ')');
  ok((await A.ev(`L.filter(x=>x.startsWith('conn ')).length`)) === 2, 'host saw 2 connections');
  // 순서 보장: 50개 연속
  await G1.ev(`for(let i=0;i<50;i++)c.send({ping:i});1`);
  const seq = await until(async () => { const v = await G1.ev(`L.filter(x=>/pong":\\d/.test(x)).map(x=>JSON.parse(x.slice(5)).pong)`); return v.length >= 50 ? v : null; }, 15000);
  ok(seq && seq.every((v, i) => v === i), 'ordered 50 messages');
  // 없는 방
  const N = await b.page(base + '/__t.html');
  await N.ev(`window.p=new Peer();p.on('error',e=>log('err '+e.type));p.on('open',()=>{const c=p.connect('solsoltest-nobody');c.on('open',()=>log('copen'));});1`);
  ok(await until(() => N.ev(`L.includes('err peer-unavailable')`), 12000), 'peer-unavailable for missing room');
  // 손님 나감 → 방장 close
  await G2.ev(`p.destroy();1`);
  ok(await until(() => A.ev(`L.some(x=>x.startsWith('close g'))`), 15000), 'host sees guest2 leave');
  // 방장 새로 열기(같은 id, 옛 실행 사라짐) → 손님 close
  await A.nav(base + '/__t.html');
  ok(await until(() => G1.ev(`L.includes('cclose')`), 40000), 'guest1 sees host restart/leave');
  console.log('host logs', JSON.stringify(await A.ev('L')).slice(0, 300));
} catch (e) { console.log('ERROR', e.message); }
finally { b.close(); server.close(); process.exit(0); }
