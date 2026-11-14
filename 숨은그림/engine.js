// 솔솔퍼즐(숨은그림) 엔진: 씨앗 난수로 장면을 만들고 SVG 문자열로 그린다(그림 파일 없음, 전부 직접 그린 블록 친구·소품)
// 초급·중급: 틀린 그림 찾기(위·아래 두 장면, 3곳·6곳). 고급: 군중 속에서 보기와 똑같은 친구 3명 찾기(한 군데만 다른 닮은꼴이 많다)
function HiddenEngine(){
  'use strict';
  var VERSION=1;
  var LEVELS={
    easy:{mode:'diff',n:3,w:400,h:270},
    normal:{mode:'diff',n:6,w:400,h:270},
    hard:{mode:'crowd',n:3,w:600,h:900}
  };
  function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  function pick(r,a){return a[Math.floor(r()*a.length)];}
  function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
  function shuffle(r,a){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function clone(o){return JSON.parse(JSON.stringify(o));}

  // ---------- 블록 친구 ----------
  var SKIN=['#F7D046','#F2C59A','#C98E5D','#8A5A3B'];
  var SHIRT=['#E84A4A','#3E8EDE','#4DBA5A','#F29B30','#9B6BDF','#F07AB0','#2BB5B0','#F5F5F5','#333C46'];
  var PANTS=['#2F5FA8','#3A3A44','#6B4A2B','#2E7D46','#B0413E','#C9B48A'];
  var HATS=['none','cap','crown','tophat','beanie','spiky','ears','horns'];
  var HATC=['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#9B6BDF','#222831'];
  var FACES=['dots','happy','shades','wink','surprise'];
  var ACCS=['none','sword','balloon','backpack','cape'];
  var ACCC=['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F07AB0'];
  var PATS=['plain','stripe','heart','star'];
  var POSES=['down','wave'];
  var OPT={skin:SKIN,shirt:SHIRT,pants:PANTS,hat:HATS,hatC:HATC,face:FACES,acc:ACCS,accC:ACCC,pat:PATS,pose:POSES};
  var CKEYS=['skin','shirt','pants','hat','hatC','face','acc','accC','pat','pose'];
  // 보이는 속성만: 모자가 없거나 왕관이면 모자 색은 안 보이고, 칼·없음이면 소품 색이 안 보인다
  function visible(c,k){
    if(k==='hatC')return c.hat!==0&&HATS[c.hat]!=='crown';
    if(k==='accC')return ['balloon','backpack','cape'].indexOf(ACCS[c.acc])>=0;
    return true;
  }
  function sig(c){return CKEYS.map(function(k){return visible(c,k)?c[k]:'-';}).join('.');}
  function randChar(r){var c={};CKEYS.forEach(function(k){c[k]=Math.floor(r()*OPT[k].length);});
    if(r()<.3)c.hat=0;if(r()<.35)c.acc=0;if(r()<.5)c.pat=0;return c;}
  // 한 속성만 바꾼다(보이는 차이가 나게). keys 중에서 고른다
  function mutate(r,c,keys){
    var ks=shuffle(r,keys.slice());
    for(var i=0;i<ks.length;i++){
      var k=ks[i],n=clone(c);
      if(!visible(n,k))continue;
      var v;do{v=Math.floor(r()*OPT[k].length);}while(v===c[k]);
      n[k]=v;
      if(sig(n)!==sig(c))return {c:n,k:k};
    }
    return null;
  }
  function charSvg(c,x,y,s){
    var sk=SKIN[c.skin],sh=SHIRT[c.shirt],pa=PANTS[c.pants],hc=HATC[c.hatC],ac=ACCC[c.accC],hat=HATS[c.hat],acc=ACCS[c.acc],face=FACES[c.face],pat=PATS[c.pat],wave=POSES[c.pose]==='wave';
    var o='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+s.toFixed(3)+')" stroke="#1E2420" stroke-opacity=".38" stroke-width="1" stroke-linejoin="round">';
    if(acc==='cape')o+='<path d="M-12 -41L12 -41L17 -7L-17 -7Z" fill="'+ac+'"/>';
    if(acc==='balloon'){var hx=15.5,hy=wave?-60:-21,bx=wave?21:25,by=wave?-84:-74;
      o+='<path d="M'+hx+' '+hy+'L'+bx+' '+(by+10)+'" stroke="#555" stroke-opacity="1" fill="none"/><ellipse cx="'+bx+'" cy="'+by+'" rx="8" ry="10" fill="'+ac+'"/><path d="M'+(bx-3)+' '+(by-5)+'q2 -2 4 -1" stroke="#fff" stroke-opacity=".8" fill="none"/>';}
    // 다리·신발
    o+='<rect x="-11" y="-19" width="10" height="19" fill="'+pa+'"/><rect x="1" y="-19" width="10" height="19" fill="'+pa+'"/>';
    o+='<rect x="-11" y="-4" width="10" height="4" fill="#2A2A2A"/><rect x="1" y="-4" width="10" height="4" fill="#2A2A2A"/>';
    // 몸통·무늬
    o+='<rect x="-12" y="-41" width="24" height="23" rx="2" fill="'+sh+'"/>';
    var pc=c.shirt===7?'#333C46':'#FFFFFF';
    if(pat==='stripe')o+='<rect x="-12" y="-33" width="24" height="5" fill="'+pc+'" fill-opacity=".8" stroke="none"/>';
    else if(pat==='heart')o+='<path d="M0 -24C-7 -29 -6 -35 -2.5 -35C-1 -35 0 -34 0 -33C0 -34 1 -35 2.5 -35C6 -35 7 -29 0 -24Z" fill="'+pc+'" stroke="none"/>';
    else if(pat==='star')o+='<path d="M0 -36L2 -31.5L7 -31L3.2 -27.8L4.4 -23L0 -25.6L-4.4 -23L-3.2 -27.8L-7 -31L-2 -31.5Z" fill="'+pc+'" stroke="none"/>';
    if(acc==='backpack')o+='<rect x="-9" y="-45" width="18" height="5" rx="2" fill="'+ac+'"/><rect x="-8" y="-41" width="3" height="16" fill="'+ac+'" stroke="none"/><rect x="5" y="-41" width="3" height="16" fill="'+ac+'" stroke="none"/>';
    // 팔
    o+='<rect x="-19" y="-41" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="-19" y="-25" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
    if(wave)o+='<rect x="12" y="-61" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="12" y="-62" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
    else o+='<rect x="12" y="-41" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="12" y="-25" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
    if(acc==='sword')o+='<rect x="-17" y="-52" width="3" height="28" fill="#D5DCE3"/><rect x="-20.5" y="-26" width="10" height="3" fill="#8B5A2B"/>';
    // 머리·얼굴
    o+='<rect x="-10" y="-60" width="20" height="19" rx="4" fill="'+sk+'"/>';
    var d='#22301F';
    if(face==='dots')o+='<circle cx="-4.5" cy="-52" r="1.8" fill="'+d+'" stroke="none"/><circle cx="4.5" cy="-52" r="1.8" fill="'+d+'" stroke="none"/><path d="M-4 -46.5Q0 -43.5 4 -46.5" stroke="'+d+'" stroke-opacity="1" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    else if(face==='happy')o+='<path d="M-6.5 -51Q-4.5 -54.5 -2.5 -51M2.5 -51Q4.5 -54.5 6.5 -51" stroke="'+d+'" stroke-opacity="1" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-5 -47.5Q0 -41.5 5 -47.5Z" fill="'+d+'" stroke="none"/>';
    else if(face==='shades')o+='<rect x="-8.5" y="-54.5" width="17" height="4.5" rx="1.5" fill="'+d+'" stroke="none"/><path d="M-3.5 -46H3.5" stroke="'+d+'" stroke-opacity="1" stroke-width="1.4" stroke-linecap="round"/>';
    else if(face==='wink')o+='<circle cx="-4.5" cy="-52" r="1.8" fill="'+d+'" stroke="none"/><path d="M2.5 -52H6.5" stroke="'+d+'" stroke-opacity="1" stroke-width="1.5" stroke-linecap="round"/><path d="M-4 -46.5Q0 -43.5 4 -46.5" stroke="'+d+'" stroke-opacity="1" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    else o+='<circle cx="-4.5" cy="-52.5" r="1.8" fill="'+d+'" stroke="none"/><circle cx="4.5" cy="-52.5" r="1.8" fill="'+d+'" stroke="none"/><ellipse cx="0" cy="-45.5" rx="2" ry="2.5" fill="'+d+'" stroke="none"/>';
    // 모자
    if(hat==='cap')o+='<rect x="-10.5" y="-65" width="21" height="7" rx="2.5" fill="'+hc+'"/><rect x="2" y="-60.5" width="14" height="3" rx="1.5" fill="'+hc+'"/>';
    else if(hat==='crown')o+='<path d="M-9 -59L-9 -68L-5 -64L0 -70L5 -64L9 -68L9 -59Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
    else if(hat==='tophat')o+='<rect x="-12" y="-62" width="24" height="3" fill="'+hc+'"/><rect x="-8" y="-75" width="16" height="14" fill="'+hc+'"/><rect x="-8" y="-65" width="16" height="2.5" fill="#F5F5F5" stroke="none"/>';
    else if(hat==='beanie')o+='<path d="M-10.5 -58Q-10.5 -68.5 0 -68.5Q10.5 -68.5 10.5 -58Z" fill="'+hc+'"/><circle cx="0" cy="-69" r="2.6" fill="#F5F5F5"/>';
    else if(hat==='spiky')o+='<path d="M-10.5 -57L-10.5 -65L-7 -62L-4 -69L0 -63L4 -69L7 -62L10.5 -65L10.5 -57Z" fill="'+hc+'"/>';
    else if(hat==='ears')o+='<rect x="-8.5" y="-75" width="5" height="16" rx="2.5" fill="'+hc+'"/><rect x="3.5" y="-75" width="5" height="16" rx="2.5" fill="'+hc+'"/><rect x="-7.3" y="-73" width="2.6" height="10" rx="1.3" fill="#FFB3C7" stroke="none"/><rect x="4.7" y="-73" width="2.6" height="10" rx="1.3" fill="#FFB3C7" stroke="none"/>';
    else if(hat==='horns')o+='<path d="M-9 -59L-13 -69L-5 -60Z" fill="'+hc+'"/><path d="M9 -59L13 -69L5 -60Z" fill="'+hc+'"/>';
    return o+'</g>';
  }
  // 친구가 차지하는 칸(발 기준, 축척 전): 풍선은 위·오른쪽으로 더 나간다
  function charBox(c,x,y,s){
    var top=-76,right=20;if(ACCS[c.acc]==='balloon'){top=POSES[c.pose]==='wave'?-95:-85;right=34;}
    return [x-20*s,y+top*s,(right+20)*s,-top*s];
  }

  // ---------- 소품 ----------
  var TREEC=['#3FA34D','#2E8B57','#6CBF3A','#E58A2C'];
  var WALLC=['#F4E3C1','#F7B9A6','#BFE0F2','#D9E8B0','#FFFFFF'];
  var ROOFC=['#D9534F','#3E6FB0','#7A4B2A','#4DBA5A','#9B6BDF'];
  var CARC=['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F29B30','#9B6BDF'];
  var FLOWC=['#F07AB0','#E84A4A','#F7C531','#9B6BDF','#FFFFFF'];
  var PROP={
    tree:{box:[-17,-57,34,57],keys:{col:TREEC},draw:function(p){var c=TREEC[p.col];return '<rect x="-4" y="-20" width="8" height="20" fill="#8B5A2B"/><rect x="-16" y="-44" width="32" height="26" rx="4" fill="'+c+'"/><rect x="-11" y="-56" width="22" height="14" rx="4" fill="'+c+'"/><rect x="-11" y="-40" width="6" height="5" rx="1.5" fill="#fff" fill-opacity=".25" stroke="none"/>';}},
    house:{box:[-28,-56,56,56],keys:{wall:WALLC,roof:ROOFC,win:[1,2],door:['#7A4B2A','#3E6FB0','#D9534F']},draw:function(p){
      var o='<rect x="-24" y="-34" width="48" height="34" fill="'+WALLC[p.wall]+'"/><path d="M-28 -34L0 -56L28 -34Z" fill="'+ROOFC[p.roof]+'"/><rect x="-5" y="-18" width="10" height="18" fill="'+['#7A4B2A','#3E6FB0','#D9534F'][p.door]+'"/>';
      o+='<rect x="-19" y="-28" width="9" height="9" fill="#BFE6FF"/>';if(p.win===1)o+='<rect x="10" y="-28" width="9" height="9" fill="#BFE6FF"/>';return o;}},
    flower:{box:[-7,-21,14,21],keys:{col:FLOWC},draw:function(p){var c=FLOWC[p.col];return '<path d="M0 0V-12" stroke="#3E871C" stroke-opacity="1" stroke-width="2"/><circle cx="-3.5" cy="-14" r="3" fill="'+c+'"/><circle cx="3.5" cy="-14" r="3" fill="'+c+'"/><circle cx="0" cy="-17.5" r="3" fill="'+c+'"/><circle cx="0" cy="-10.5" r="3" fill="'+c+'"/><circle cx="0" cy="-14" r="2" fill="#F7C531" stroke="none"/>';}},
    cloud:{box:[-21,-19,42,19],keys:{},draw:function(){return '<rect x="-20" y="-10" width="40" height="10" rx="5" fill="#FFFFFF" stroke-opacity=".12"/><rect x="-11" y="-18" width="22" height="11" rx="5.5" fill="#FFFFFF" stroke-opacity=".12"/>';}},
    sun:{box:[-21,-42,42,42],keys:{face:[0,1]},draw:function(p){var o='<g stroke="none">';for(var i=0;i<8;i++){var a=i*Math.PI/4;o+='<rect x="-2" y="-20" width="4" height="6" rx="2" fill="#FFB12E" transform="translate(0 -21) rotate('+(i*45)+')"/>';}
      o+='</g><circle cx="0" cy="-21" r="13" fill="#FFD54A"/>';
      o+=p.face===0?'<circle cx="-4.5" cy="-23" r="1.6" fill="#7A4B10" stroke="none"/><circle cx="4.5" cy="-23" r="1.6" fill="#7A4B10" stroke="none"/><path d="M-4 -18Q0 -15 4 -18" stroke="#7A4B10" stroke-opacity="1" stroke-width="1.4" fill="none"/>':'<path d="M-6 -23Q-4.5 -25 -3 -23M3 -23Q4.5 -25 6 -23" stroke="#7A4B10" stroke-opacity="1" stroke-width="1.4" fill="none"/><path d="M-4 -18Q0 -15 4 -18" stroke="#7A4B10" stroke-opacity="1" stroke-width="1.4" fill="none"/>';return o;}},
    car:{box:[-23,-26,46,26],keys:{col:CARC},draw:function(p){var c=CARC[p.col];return '<rect x="-22" y="-16" width="44" height="11" rx="3" fill="'+c+'"/><rect x="-12" y="-25" width="22" height="10" rx="2" fill="'+c+'"/><rect x="-9" y="-23" width="7" height="6" fill="#BFE6FF"/><rect x="0" y="-23" width="7" height="6" fill="#BFE6FF"/><circle cx="-12" cy="-4.5" r="4.5" fill="#2A2A2A"/><circle cx="12" cy="-4.5" r="4.5" fill="#2A2A2A"/>';}},
    chest:{box:[-10,-17,20,17],keys:{},draw:function(){return '<rect x="-9" y="-12" width="18" height="12" fill="#A0642D"/><rect x="-9.5" y="-17" width="19" height="6" rx="2" fill="#7A4B1F"/><rect x="-1.5" y="-12" width="3" height="4" fill="#F7C531"/>';}},
    coin:{box:[-6,-12,12,12],keys:{},draw:function(){return '<circle cx="0" cy="-6" r="5.5" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/><rect x="-1" y="-9" width="2" height="6" fill="#B5850F" stroke="none"/>';}}
  };
  function propSvg(p){return '<g transform="translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+') scale('+p.s.toFixed(3)+')" stroke="#1E2420" stroke-opacity=".3" stroke-width="1" stroke-linejoin="round">'+PROP[p.t].draw(p)+'</g>';}
  function itemBox(it){
    if(it.t==='char')return charBox(it.c,it.x,it.y,it.s);
    var b=PROP[it.t].box;return [it.x+b[0]*it.s,it.y+b[1]*it.s,b[2]*it.s,b[3]*it.s];
  }
  function itemSvg(it){return it.t==='char'?charSvg(it.c,it.x,it.y,it.s):propSvg(it);}
  function overlap(a,b,m){return a[0]<b[0]+b[2]+m&&b[0]<a[0]+a[2]+m&&a[1]<b[1]+b[3]+m&&b[1]<a[1]+a[3]+m;}

  // ---------- 틀린 그림 ----------
  var SKIES=[['#8FD3FF','#DDF3FF','#7CC152'],['#FFC48A','#FFE9C9','#86C55A'],['#A9B8FF','#E3E8FF','#6DB86A'],['#9EE6E0','#E6FFFB','#8BCB5C']];
  // 바꿀 수 있는 것: 초급은 눈에 잘 띄는 것만, 중급은 표정·무늬·작은 색까지
  var EASYK={char:['shirt','pants','hat','acc','pose'],house:['roof','wall'],tree:['col'],car:['col'],flower:['col'],sun:[],cloud:[],chest:[],coin:[]};
  var NORMK={char:['shirt','pants','hat','hatC','face','acc','accC','pat','pose'],house:['roof','wall','win','door'],tree:['col'],car:['col'],flower:['col'],sun:['face'],cloud:[],chest:[],coin:[]};
  function genDiff(seed,lv){
    var L=LEVELS[lv],r=rng(seed),easy=lv==='easy',W=L.w,H=L.h,HZ=170,items=[],boxes=[];
    function place(make,xa,xb,ya,yb,tries){
      for(var t=0;t<(tries||40);t++){
        var it=make(),x=xa+r()*(xb-xa),y=ya+r()*(yb-ya);it.x=x;it.y=y;
        var b=itemBox(it);if(b[0]<2||b[0]+b[2]>W-2||b[1]<2||b[1]+b[3]>H-2)continue;
        if(boxes.some(function(o){return overlap(o,b,3);}))continue;
        items.push(it);boxes.push(b);return it;
      }
      return null;
    }
    var sky=pick(r,SKIES);
    place(function(){return {t:'sun',s:easy?1.25:1,face:ri(r,0,1),L:0};},20,W-20,48,70);
    for(var i=0;i<(easy?2:3);i++)place(function(){return {t:'cloud',s:easy?1.3:1+r()*.3,L:0};},25,W-25,30,95);
    var nh=easy?3:5;
    for(i=0;i<nh;i++)place(function(){return r()<.5?{t:'house',s:easy?1.15:.9,wall:ri(r,0,WALLC.length-1),roof:ri(r,0,ROOFC.length-1),win:ri(r,0,1),door:ri(r,0,2),L:1}:{t:'tree',s:easy?1.2:.95,col:ri(r,0,2),L:1};},20,W-20,HZ-2,HZ+8);
    var nc=easy?4:9,cs=easy?1.05:.68;
    for(i=0;i<nc;i++)place(function(){return {t:'char',s:cs,c:randChar(r),L:2};},20,W-20,easy?HZ+60:HZ+40,H-6,60);
    if(!easy||r()<.6)place(function(){return {t:'car',s:easy?1.1:.85,col:ri(r,0,CARC.length-1),L:2};},25,W-25,HZ+25,H-6);
    for(i=0;i<(easy?3:6);i++)place(function(){return {t:'flower',s:easy?1.15:.9,col:ri(r,0,FLOWC.length-1),L:2};},10,W-10,HZ+18,H-4);
    for(i=0;i<(easy?1:3);i++)place(function(){return {t:r()<.5?'chest':'coin',s:easy?1.2:1,L:2};},12,W-12,HZ+20,H-4);
    items.sort(function(a,b){return a.L-b.L||a.y-b.y;});
    items.forEach(function(it,k){it.id=k;});
    // 차이 고르기: 서로 겹치지 않는 물건 n개, 물건마다 바꿀 것 하나(또는 한쪽에서 없애기)
    var K=easy?EASYK:NORMK,A=items,B=clone(items),diffs=[];
    // 고르는 순서: 친구 → 집·차·나무 → 구름·해 → 꽃·상자·동전(작은 것). 초급은 큰 것 위주, 중급은 친구 몇 명 뒤에 골고루
    function ids(ts){return shuffle(r,items.filter(function(it){return ts.indexOf(it.t)>=0;}).map(function(it){return it.id;}));}
    var chars=ids(['char']),big=ids(['house','car','tree']),air=ids(['cloud','sun']),small=ids(['flower','chest','coin']),cand;
    if(easy)cand=chars.slice(0,2).concat(big.slice(0,2),chars.slice(2),big.slice(2),air,small);
    else cand=chars.slice(0,3).concat(shuffle(r,chars.slice(3).concat(big,air,small)));
    var removes=0,smalls=0,maxRemove=easy?1:2;
    for(var q=0;q<cand.length&&diffs.length<L.n;q++){
      var id=cand[q],it=A[id],keys=K[it.t],canRemove=it.t!=='sun'&&removes<maxRemove;
      var isSmall=['flower','chest','coin'].indexOf(it.t)>=0;if(isSmall&&smalls>=(easy?0:2))continue;
      var bx=itemBox(it);if(diffs.some(function(d){return overlap(d.box,bx,2);}))continue;
      if(!keys.length&&!canRemove)continue;
      var useRemove=canRemove&&(keys.length===0||r()<(easy?.3:.18));
      if(useRemove)removes++;if(isSmall)smalls++;
      var d={id:id,box:bx};
      if(useRemove){d.kind='remove';d.side=r()<.5?0:1;}
      else if(it.t==='char'){var m=mutate(r,it.c,keys);if(!m)continue;B[id].c=m.c;d.kind=m.k;}
      else{var k=pick(r,keys),opts=PROP[it.t].keys[k],v;do{v=Math.floor(r()*opts.length);}while(v===it[k]);B[id][k]=v;d.kind=k;}
      diffs.push(d);
    }
    return {mode:'diff',lv:lv,seed:seed,w:W,h:H,hz:HZ,sky:sky,items:[A,B],diffs:diffs};
  }
  function diffSvg(sc,side,uid){
    var W=sc.w,H=sc.h,g='g'+uid,o='';
    o+='<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+sc.sky[0]+'"/><stop offset="1" stop-color="'+sc.sky[1]+'"/></linearGradient>'+
      '<pattern id="p'+uid+'" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="3" fill="#FFFFFF" fill-opacity=".14"/></pattern></defs>';
    o+='<rect width="'+W+'" height="'+H+'" fill="url(#'+g+')"/><rect y="'+sc.hz+'" width="'+W+'" height="'+(H-sc.hz)+'" fill="'+sc.sky[2]+'"/><rect y="'+sc.hz+'" width="'+W+'" height="'+(H-sc.hz)+'" fill="url(#p'+uid+')"/>';
    o+='<rect y="'+sc.hz+'" width="'+W+'" height="3" fill="#000" fill-opacity=".08"/>';
    var hidden={};sc.diffs.forEach(function(d){if(d.kind==='remove'&&d.side===side)hidden[d.id]=1;});
    sc.items[side].forEach(function(it){if(!hidden[it.id])o+=itemSvg(it);});
    return o;
  }

  // ---------- 군중 속 찾기 ----------
  function genCrowd(seed){
    var L=LEVELS.hard,r=rng(seed),W=L.w,H=L.h,s=.5;
    // 연못(아무도 안 서는 곳)과 길
    var pond={x:ri(r,60,W-260),y:ri(r,120,H-320),w:ri(r,150,210),h:ri(r,110,150)};
    var pathY=ri(r,300,600),pathX=ri(r,150,450);
    var deco=[];
    for(var i=0;i<7;i++){var tx=ri(r,20,W-20),ty=ri(r,40,H-10);deco.push({t:'tree',x:tx,y:ty,s:.75,col:ri(r,0,3)});}
    for(i=0;i<10;i++)deco.push({t:'flower',x:ri(r,10,W-10),y:ri(r,20,H-5),s:.8,col:ri(r,0,FLOWC.length-1)});
    var spots=[],cols=13,rows=21,dx=W/cols,dy=(H-60)/rows;
    for(var rr=0;rr<rows;rr++)for(var cc=0;cc<cols;cc++){
      var x=dx*(cc+.5)+(r()*2-1)*12+(rr%2?dx*.25:0),y=60+dy*(rr+.85)+(r()*2-1)*8;
      if(x<14||x>W-14)continue;
      if(x>pond.x-14&&x<pond.x+pond.w+14&&y>pond.y-6&&y<pond.y+pond.h+40)continue;
      spots.push([x,y]);
    }
    shuffle(r,spots);
    // 똑같은 친구 3명은 바로 앞에 아무도 안 가리는 자리에 세운다(가려져 있으면 눌러도 앞사람이 눌린다)
    function clear(i){var a=spots[i];return spots.every(function(b,j){return j===i||!(Math.abs(b[0]-a[0])<24&&b[1]>a[1]&&b[1]-a[1]<42);});}
    for(var z=0,got=0;z<spots.length&&got<3;z++)if(clear(z)){var tmp=spots[got];spots[got]=spots[z];spots[z]=tmp;got++;}
    var target=randChar(r);
    // 보기는 무언가 들고 있거나 쓰고 있어야 더 재미있다
    if(target.hat===0)target.hat=ri(r,1,HATS.length-1);
    var tsig=sig(target),people=[],copies=[];
    var nDecoy=40;
    spots.forEach(function(p,k){
      var c,role;
      if(k<3){c=clone(target);role='copy';}
      else if(k<3+nDecoy){var m=mutate(r,target,CKEYS);c=m?m.c:randChar(r);role='decoy';}
      else{
        c=randChar(r);
        // 헷갈리게: 셋 중 하나는 보기와 같은 옷이나 모자를 입힌다
        if(r()<.35){c.shirt=target.shirt;if(r()<.5){c.hat=target.hat;c.hatC=target.hatC;}}
        role='other';
      }
      if(role!=='copy'&&sig(c)===tsig){c=clone(target);c.face=(target.face+1)%FACES.length;}
      people.push({t:'char',c:c,x:p[0],y:p[1],s:s,role:role});
    });
    people.sort(function(a,b){return a.y-b.y;});
    people.forEach(function(p,k){p.id=k;if(p.role==='copy')copies.push(k);});
    return {mode:'crowd',lv:'hard',seed:seed,w:W,h:H,pond:pond,pathX:pathX,pathY:pathY,deco:deco,target:target,people:people,copies:copies};
  }
  function crowdSvg(sc){
    var W=sc.w,H=sc.h,p=sc.pond,o='';
    o+='<defs><pattern id="cg" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3.4" fill="#FFFFFF" fill-opacity=".12"/></pattern></defs>';
    o+='<rect width="'+W+'" height="'+H+'" fill="#7CC152"/><rect width="'+W+'" height="'+H+'" fill="url(#cg)"/>';
    o+='<rect x="0" y="'+(sc.pathY-22)+'" width="'+W+'" height="44" fill="#E9D7A8"/><rect x="'+(sc.pathX-22)+'" y="0" width="44" height="'+H+'" fill="#E9D7A8"/>';
    o+='<rect x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" rx="40" fill="#5BB8E8" stroke="#3E8EB8" stroke-width="4"/><path d="M'+(p.x+30)+' '+(p.y+40)+'h40M'+(p.x+p.w-90)+' '+(p.y+p.h-40)+'h50" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>';
    sc.deco.forEach(function(d){o+=propSvg(d);});
    sc.people.forEach(function(it){o+=charSvg(it.c,it.x,it.y,it.s);});
    return o;
  }
  // 눌린 자리(장면 좌표)에 있는 친구: 앞(아래)에 그려진 친구부터
  function personAt(sc,x,y){
    for(var k=sc.people.length-1;k>=0;k--){var p=sc.people[k],b=charBox(p.c,p.x,p.y,p.s);if(x>=b[0]-2&&x<=b[0]+b[2]+2&&y>=b[1]-2&&y<=b[1]+b[3]+2)return k;}
    return -1;
  }
  function personBox(sc,k){var p=sc.people[k];return charBox(p.c,p.x,p.y,p.s);}

  return {VERSION:VERSION,LEVELS:LEVELS,rng:rng,sig:sig,charSvg:charSvg,genDiff:genDiff,diffSvg:diffSvg,genCrowd:genCrowd,crowdSvg:crowdSvg,personAt:personAt,personBox:personBox,itemBox:itemBox};
}
