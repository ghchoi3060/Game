// 솔솔퍼즐(숨은그림) 엔진: 씨앗 난수로 장면을 만들고 SVG 문자열로 그린다(그림 파일 없음, 전부 직접 그린 캐릭터·소품)
// 장르(THEMES)마다 배경·등장인물·소품이 다르다. 게임(블록 마을)·만화(벚꽃 학교)·영화(우주·바닷속·공룡 섬·겨울 동화)
// 초급·중급: 틀린 그림 찾기(위·아래 두 장면, 3곳·6곳). 고급: 군중 속에서 보기와 똑같은 친구 3명 찾기(한 군데만 다른 닮은꼴이 많다)
function HiddenEngine(){
  'use strict';
  var VERSION=2;
  var LEVELS={
    easy:{mode:'diff',n:3,w:400,h:270},
    normal:{mode:'diff',n:6,w:400,h:270},
    hard:{mode:'crowd',n:3,w:600,h:900}
  };
  function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  function pick(r,a){return a[Math.floor(r()*a.length)];}
  function ix(r,a){return Math.floor(r()*a.length);}
  function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
  function shuffle(r,a){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function clone(o){return JSON.parse(JSON.stringify(o));}
  var D='#22301F';
  function ln(d,c,w){return '<path d="'+d+'" fill="none" stroke="'+(c||D)+'" stroke-opacity="1" stroke-width="'+(w||1.4)+'" stroke-linecap="round" stroke-linejoin="round"/>';}
  function starD(cx,cy,R){var p='';for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,q=i%2?R*.45:R;p+=(i?'L':'M')+(cx+Math.cos(a)*q).toFixed(1)+' '+(cy+Math.sin(a)*q).toFixed(1);}return p+'Z';}
  var C6=['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F07AB0','#9B6BDF'];

  // ---------- 캐릭터 종류(CT) ----------
  // opt: 속성별 값 목록, keys: 속성 순서, vis(c,k): 그 속성이 그림에 보이는지, draw(c): 발 아래 가운데가 (0,0),
  // box: 차지하는 칸, ez: 초급에서 바꿀 속성, rand: 없음(none) 비율 조정, confuse: 고급에서 헷갈리게 보기와 맞출 속성 묶음
  var CT={};
  function sig(c){var T=CT[c.k];return c.k+':'+T.keys.map(function(k){return T.vis(c,k)?c[k]:'-';}).join('.');}
  function randChar(r,k){var T=CT[k],c={k:k};T.keys.forEach(function(q){c[q]=ix(r,T.opt[q]);});if(T.rand)T.rand(r,c);return c;}
  // 한 속성만 바꾼다(보이는 차이가 나게)
  function mutate(r,c,keys){
    var T=CT[c.k],ks=shuffle(r,keys.slice());
    for(var i=0;i<ks.length;i++){
      var k=ks[i],n=clone(c);
      if(!T.vis(n,k)||T.opt[k].length<2)continue;
      var v;do{v=ix(r,T.opt[k]);}while(v===c[k]);
      n[k]=v;
      if(sig(n)!==sig(c))return {c:n,k:k};
    }
    return null;
  }
  function charSvg(c,x,y,s){return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+s.toFixed(3)+')" stroke="#1E2420" stroke-opacity=".38" stroke-width="1" stroke-linejoin="round">'+CT[c.k].draw(c)+'</g>';}
  function charBox(c,x,y,s){var b=CT[c.k].box(c);return [x+b[0]*s,y+b[1]*s,b[2]*s,b[3]*s];}
  function charView(c){var b=CT[c.k].box(c),m=5;return (b[0]-m)+' '+(b[1]-m)+' '+(b[2]+2*m)+' '+(b[3]+2*m);}

  // 블록 친구(게임)
  CT.block={
    opt:{skin:['#F7D046','#F2C59A','#C98E5D','#8A5A3B'],shirt:['#E84A4A','#3E8EDE','#4DBA5A','#F29B30','#9B6BDF','#F07AB0','#2BB5B0','#F5F5F5','#333C46'],
      pants:['#2F5FA8','#3A3A44','#6B4A2B','#2E7D46','#B0413E','#C9B48A'],hat:['none','cap','crown','tophat','beanie','spiky','ears','horns'],
      hatC:['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#9B6BDF','#222831'],face:['dots','happy','shades','wink','surprise'],
      acc:['none','sword','balloon','backpack','cape'],accC:['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F07AB0'],pat:['plain','stripe','heart','star'],pose:['down','wave']},
    keys:['skin','shirt','pants','hat','hatC','face','acc','accC','pat','pose'],
    ez:['shirt','pants','hat','acc','pose'],nm:['shirt','pants','hat','hatC','face','acc','accC','pat','pose'],
    confuse:[['shirt'],['hat','hatC']],
    vis:function(c,k){var O=this.opt;if(k==='hatC')return c.hat!==0&&O.hat[c.hat]!=='crown';if(k==='accC')return ['balloon','backpack','cape'].indexOf(O.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.3)c.hat=0;if(r()<.35)c.acc=0;if(r()<.5)c.pat=0;},
    fix:function(r,c){if(c.hat===0)c.hat=ri(r,1,this.opt.hat.length-1);},
    box:function(c){var O=this.opt,top=-76,right=20;if(O.acc[c.acc]==='balloon'){top=O.pose[c.pose]==='wave'?-95:-85;right=34;}return [-20,top,right+20,-top];},
    draw:function(c){
      var O=this.opt,sk=O.skin[c.skin],sh=O.shirt[c.shirt],pa=O.pants[c.pants],hc=O.hatC[c.hatC],ac=O.accC[c.accC],hat=O.hat[c.hat],acc=O.acc[c.acc],face=O.face[c.face],pat=O.pat[c.pat],wave=O.pose[c.pose]==='wave',o='';
      if(acc==='cape')o+='<path d="M-12 -41L12 -41L17 -7L-17 -7Z" fill="'+ac+'"/>';
      if(acc==='balloon'){var hx=15.5,hy=wave?-60:-21,bx=wave?21:25,by=wave?-84:-74;
        o+='<path d="M'+hx+' '+hy+'L'+bx+' '+(by+10)+'" stroke="#555" stroke-opacity="1" fill="none"/><ellipse cx="'+bx+'" cy="'+by+'" rx="8" ry="10" fill="'+ac+'"/><path d="M'+(bx-3)+' '+(by-5)+'q2 -2 4 -1" stroke="#fff" stroke-opacity=".8" fill="none"/>';}
      o+='<rect x="-11" y="-19" width="10" height="19" fill="'+pa+'"/><rect x="1" y="-19" width="10" height="19" fill="'+pa+'"/>';
      o+='<rect x="-11" y="-4" width="10" height="4" fill="#2A2A2A"/><rect x="1" y="-4" width="10" height="4" fill="#2A2A2A"/>';
      o+='<rect x="-12" y="-41" width="24" height="23" rx="2" fill="'+sh+'"/>';
      var pc=c.shirt===7?'#333C46':'#FFFFFF';
      if(pat==='stripe')o+='<rect x="-12" y="-33" width="24" height="5" fill="'+pc+'" fill-opacity=".8" stroke="none"/>';
      else if(pat==='heart')o+='<path d="M0 -24C-7 -29 -6 -35 -2.5 -35C-1 -35 0 -34 0 -33C0 -34 1 -35 2.5 -35C6 -35 7 -29 0 -24Z" fill="'+pc+'" stroke="none"/>';
      else if(pat==='star')o+='<path d="'+starD(0,-30,6.5)+'" fill="'+pc+'" stroke="none"/>';
      if(acc==='backpack')o+='<rect x="-9" y="-45" width="18" height="5" rx="2" fill="'+ac+'"/><rect x="-8" y="-41" width="3" height="16" fill="'+ac+'" stroke="none"/><rect x="5" y="-41" width="3" height="16" fill="'+ac+'" stroke="none"/>';
      o+='<rect x="-19" y="-41" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="-19" y="-25" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
      if(wave)o+='<rect x="12" y="-61" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="12" y="-62" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
      else o+='<rect x="12" y="-41" width="7" height="20" rx="2" fill="'+sh+'"/><rect x="12" y="-25" width="7" height="5" rx="1.5" fill="'+sk+'"/>';
      if(acc==='sword')o+='<rect x="-17" y="-52" width="3" height="28" fill="#D5DCE3"/><rect x="-20.5" y="-26" width="10" height="3" fill="#8B5A2B"/>';
      o+='<rect x="-10" y="-60" width="20" height="19" rx="4" fill="'+sk+'"/>';
      if(face==='dots')o+='<circle cx="-4.5" cy="-52" r="1.8" fill="'+D+'" stroke="none"/><circle cx="4.5" cy="-52" r="1.8" fill="'+D+'" stroke="none"/>'+ln('M-4 -46.5Q0 -43.5 4 -46.5');
      else if(face==='happy')o+=ln('M-6.5 -51Q-4.5 -54.5 -2.5 -51M2.5 -51Q4.5 -54.5 6.5 -51',D,1.5)+'<path d="M-5 -47.5Q0 -41.5 5 -47.5Z" fill="'+D+'" stroke="none"/>';
      else if(face==='shades')o+='<rect x="-8.5" y="-54.5" width="17" height="4.5" rx="1.5" fill="'+D+'" stroke="none"/>'+ln('M-3.5 -46H3.5');
      else if(face==='wink')o+='<circle cx="-4.5" cy="-52" r="1.8" fill="'+D+'" stroke="none"/>'+ln('M2.5 -52H6.5',D,1.5)+ln('M-4 -46.5Q0 -43.5 4 -46.5');
      else o+='<circle cx="-4.5" cy="-52.5" r="1.8" fill="'+D+'" stroke="none"/><circle cx="4.5" cy="-52.5" r="1.8" fill="'+D+'" stroke="none"/><ellipse cx="0" cy="-45.5" rx="2" ry="2.5" fill="'+D+'" stroke="none"/>';
      if(hat==='cap')o+='<rect x="-10.5" y="-65" width="21" height="7" rx="2.5" fill="'+hc+'"/><rect x="2" y="-60.5" width="14" height="3" rx="1.5" fill="'+hc+'"/>';
      else if(hat==='crown')o+='<path d="M-9 -59L-9 -68L-5 -64L0 -70L5 -64L9 -68L9 -59Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
      else if(hat==='tophat')o+='<rect x="-12" y="-62" width="24" height="3" fill="'+hc+'"/><rect x="-8" y="-75" width="16" height="14" fill="'+hc+'"/><rect x="-8" y="-65" width="16" height="2.5" fill="#F5F5F5" stroke="none"/>';
      else if(hat==='beanie')o+='<path d="M-10.5 -58Q-10.5 -68.5 0 -68.5Q10.5 -68.5 10.5 -58Z" fill="'+hc+'"/><circle cx="0" cy="-69" r="2.6" fill="#F5F5F5"/>';
      else if(hat==='spiky')o+='<path d="M-10.5 -57L-10.5 -65L-7 -62L-4 -69L0 -63L4 -69L7 -62L10.5 -65L10.5 -57Z" fill="'+hc+'"/>';
      else if(hat==='ears')o+='<rect x="-8.5" y="-75" width="5" height="16" rx="2.5" fill="'+hc+'"/><rect x="3.5" y="-75" width="5" height="16" rx="2.5" fill="'+hc+'"/><rect x="-7.3" y="-73" width="2.6" height="10" rx="1.3" fill="#FFB3C7" stroke="none"/><rect x="4.7" y="-73" width="2.6" height="10" rx="1.3" fill="#FFB3C7" stroke="none"/>';
      else if(hat==='horns')o+='<path d="M-9 -59L-13 -69L-5 -60Z" fill="'+hc+'"/><path d="M9 -59L13 -69L5 -60Z" fill="'+hc+'"/>';
      return o;
    }
  };

  // 만화 주인공 같은 큰 눈 아이(만화)
  CT.kid={
    opt:{skin:['#FFE3CC','#F6C9A2','#C98C62'],hair:['short','spiky','bob','long','twin','pony'],hairC:['#2B2B38','#7A4A2A','#F2C94C','#F48FB8','#5AA0E8','#DADFE8','#F08A3C'],
      eye:['#6B3E26','#2E7FD9','#2FA35A','#D94848','#8E5BD9'],top:['tee','sailor','hoodie','dress'],topC:['#E84A4A','#3E8EDE','#4DBA5A','#F7C531','#9B6BDF','#F07AB0','#F5F5F5','#2C3E66'],
      botC:['#2C3E66','#3A3A44','#B0413E','#6B4A2B','#7FB0E0'],acc:['none','ribbon','glasses','star','cat'],accC:['#E84A4A','#F7C531','#F07AB0','#3E8EDE','#4DBA5A'],
      mouth:['smile','open','cat','flat'],pose:['down','wave']},
    keys:['skin','hair','hairC','eye','top','topC','botC','acc','accC','mouth','pose'],
    ez:['hair','hairC','top','topC','acc','pose'],nm:['hair','hairC','eye','top','topC','botC','acc','accC','mouth','pose'],
    confuse:[['topC'],['hair','hairC']],
    vis:function(c,k){var O=this.opt;if(k==='botC')return O.top[c.top]!=='dress';if(k==='accC')return ['ribbon','star','cat'].indexOf(O.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.35)c.acc=0;},
    box:function(){return [-27,-79,54,79];},
    draw:function(c){
      var O=this.opt,sk=O.skin[c.skin],hs=O.hair[c.hair],hc=O.hairC[c.hairC],ey=O.eye[c.eye],tp=O.top[c.top],tc=O.topC[c.topC],bc=O.botC[c.botC],ac=O.acc[c.acc],a2=O.accC[c.accC],mo=O.mouth[c.mouth],wave=O.pose[c.pose]==='wave',o='';
      if(hs==='long')o+='<path d="M-18 -54Q-18 -72 0 -72Q18 -72 18 -54L20 -28Q0 -24 -20 -28Z" fill="'+hc+'"/>';
      else if(hs==='bob')o+='<path d="M-19 -52Q-19 -72 0 -72Q19 -72 19 -52L20 -38Q0 -34 -20 -38Z" fill="'+hc+'"/>';
      else if(hs==='twin')o+='<ellipse cx="-21" cy="-46" rx="5.5" ry="13" fill="'+hc+'"/><ellipse cx="21" cy="-46" rx="5.5" ry="13" fill="'+hc+'"/>';
      else if(hs==='pony')o+='<path d="M10 -66Q32 -66 25 -36Q21 -50 12 -54Z" fill="'+hc+'"/>';
      if(tp==='dress')o+='<rect x="-7" y="-13" width="4" height="11" fill="'+sk+'"/><rect x="3" y="-13" width="4" height="11" fill="'+sk+'"/>';
      else o+='<rect x="-9" y="-15" width="8" height="13" fill="'+bc+'"/><rect x="1" y="-15" width="8" height="13" fill="'+bc+'"/>';
      o+='<rect x="-9.5" y="-3.5" width="8.5" height="3.5" rx="1.5" fill="#3A2E2A"/><rect x="1" y="-3.5" width="8.5" height="3.5" rx="1.5" fill="#3A2E2A"/>';
      o+='<rect x="-16" y="-35" width="5" height="17" rx="2.5" fill="'+tc+'"/><circle cx="-13.5" cy="-17.5" r="3" fill="'+sk+'"/>';
      if(!wave)o+='<rect x="11" y="-35" width="5" height="17" rx="2.5" fill="'+tc+'"/><circle cx="13.5" cy="-17.5" r="3" fill="'+sk+'"/>';
      if(tp==='dress')o+='<path d="M-9 -36L9 -36L14 -12L-14 -12Z" fill="'+tc+'"/><rect x="-9" y="-30" width="18" height="2.5" fill="#FFFFFF" fill-opacity=".8" stroke="none"/>';
      else o+='<rect x="-11" y="-36" width="22" height="22" rx="4" fill="'+tc+'"/>';
      if(tp==='sailor')o+='<path d="M-9 -36L0 -27L9 -36Z" fill="#FFFFFF"/><path d="M0 -28L-3.5 -31L-3.5 -25ZM0 -28L3.5 -31L3.5 -25Z" fill="#E84A4A"/>';
      else if(tp==='hoodie')o+=ln('M-9 -35Q0 -29 9 -35','#1E2420',1.5)+'<rect x="-6" y="-24" width="12" height="6" rx="2" fill="#000" fill-opacity=".14" stroke="none"/>';
      o+='<circle cx="0" cy="-53" r="17" fill="'+sk+'"/>';
      [-6.5,6.5].forEach(function(x){o+='<ellipse cx="'+x+'" cy="-50" rx="3.3" ry="4.4" fill="'+ey+'" stroke="#1E1E2A" stroke-opacity=".8"/><ellipse cx="'+x+'" cy="-49.2" rx="1.7" ry="2.5" fill="#1E1E2A" stroke="none"/><circle cx="'+(x-1.2)+'" cy="-51.8" r="1.3" fill="#fff" stroke="none"/>';});
      o+='<ellipse cx="-11" cy="-44.5" rx="2.6" ry="1.4" fill="#FF7A9A" fill-opacity=".45" stroke="none"/><ellipse cx="11" cy="-44.5" rx="2.6" ry="1.4" fill="#FF7A9A" fill-opacity=".45" stroke="none"/>';
      if(mo==='smile')o+=ln('M-3 -43Q0 -40 3 -43');
      else if(mo==='open')o+='<path d="M-3 -43.5Q0 -38 3 -43.5Z" fill="#C2414B" stroke="'+D+'" stroke-opacity=".9"/>';
      else if(mo==='cat')o+=ln('M-4 -43q2 2.2 4 0q2 2.2 4 0',D,1.2);
      else o+=ln('M-2.5 -42.5H2.5');
      var B={short:'M-17.5 -50Q-19 -71 0 -71Q19 -71 17.5 -50Q15 -60 8 -61Q4 -56 -2 -61Q-11 -60 -17.5 -50Z',
        spiky:'M-17 -49L-21 -60L-14 -63L-13 -73L-4 -68L2 -77L7 -68L15 -72L15 -63L21 -58L17 -49Q13 -60 0 -60Q-13 -60 -17 -49Z',
        bob:'M-18 -50Q-19 -71 0 -71Q19 -71 18 -50L17 -58Q0 -61 -17 -58Z',
        pony:'M-17.5 -50Q-19 -71 0 -71Q19 -71 17.5 -52Q10 -62 -6 -59Q-14 -57 -17.5 -50Z'};
      o+='<path d="'+(B[hs]||B.short)+'" fill="'+hc+'"/>'+'<path d="M-8 -66Q-2 -69 4 -67" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>';
      if(ac==='glasses')o+='<circle cx="-6.5" cy="-50" r="5.2" fill="#fff" fill-opacity=".15" stroke="#333" stroke-opacity="1" stroke-width="1.3"/><circle cx="6.5" cy="-50" r="5.2" fill="#fff" fill-opacity=".15" stroke="#333" stroke-opacity="1" stroke-width="1.3"/>'+ln('M-1.3 -50H1.3','#333',1.3);
      else if(ac==='ribbon')o+='<path d="M11 -68L4 -74L4 -62ZM11 -68L18 -74L18 -62Z" fill="'+a2+'"/><circle cx="11" cy="-68" r="2.2" fill="'+a2+'"/>';
      else if(ac==='cat')o+='<path d="M-15 -62L-14 -76L-5 -68Z" fill="'+a2+'"/><path d="M15 -62L14 -76L5 -68Z" fill="'+a2+'"/><path d="M-12.5 -65L-12.5 -72L-8 -68ZM12.5 -65L12.5 -72L8 -68Z" fill="#FFB3C7" stroke="none"/>';
      else if(ac==='star')o+=ln('M-13.5 -18L-19 -38','#8B5A2B',1.8)+'<path d="'+starD(-19,-41,6)+'" fill="'+a2+'"/>';
      if(wave)o+='<rect x="15" y="-52" width="5" height="18" rx="2.5" fill="'+tc+'"/><circle cx="17.5" cy="-54" r="3" fill="'+sk+'"/>';
      return o;
    }
  };

  // 물고기(바닷속 영화)
  CT.fish={
    opt:{shape:['round','long','puff'],body:['#F29B30','#3E8EDE','#F07AB0','#F7C531','#4DBA5A','#9B6BDF','#E84A4A'],tail:['#F7C531','#E84A4A','#3E8EDE','#F5F5F5','#4DBA5A','#F07AB0'],
      pat:['plain','stripe','dots','belly'],eye:['round','lash','sleepy'],mouth:['smile','o','teeth'],acc:['none','bow','crown','hat','bubble'],accC:['#E84A4A','#3E8EDE','#F7C531','#F07AB0','#222831']},
    keys:['shape','body','tail','pat','eye','mouth','acc','accC'],
    ez:['shape','body','tail','pat','acc'],nm:['shape','body','tail','pat','eye','mouth','acc','accC'],
    confuse:[['body'],['tail']],ds:.95,cs:.55,
    vis:function(c,k){if(k==='accC')return ['bow','hat'].indexOf(this.opt.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.35)c.acc=0;if(r()<.3)c.pat=0;},
    box:function(){return [-31,-46,63,46];},
    draw:function(c){
      var O=this.opt,sh=O.shape[c.shape],bc=O.body[c.body],tc=O.tail[c.tail],pat=O.pat[c.pat],ey=O.eye[c.eye],mo=O.mouth[c.mouth],ac=O.acc[c.acc],a2=O.accC[c.accC],o='';
      var rx=sh==='long'?20:sh==='puff'?15:17,ry=sh==='long'?10:sh==='puff'?14:13,cy=-20,top=cy-ry;
      o+='<path d="M'+(rx-3)+' '+cy+'L'+(rx+12)+' '+(cy-12)+'Q'+(rx+8)+' '+cy+' '+(rx+12)+' '+(cy+12)+'Z" fill="'+tc+'"/>';
      o+='<path d="M-6 '+(top+1)+'Q2 '+(top-10)+' 10 '+(top+2)+'Z" fill="'+tc+'"/><path d="M0 '+(cy+ry-2)+'q4 7 9 1Z" fill="'+tc+'"/>';
      if(sh==='puff')for(var i=0;i<9;i++){var a=Math.PI*(.55+i*.2),x1=Math.cos(a)*(rx-1),y1=cy+Math.sin(a)*(ry-1),x2=Math.cos(a)*(rx+5),y2=cy+Math.sin(a)*(ry+5);o+='<path d="M'+(x1-Math.sin(a)*2.5).toFixed(1)+' '+(y1+Math.cos(a)*2.5).toFixed(1)+'L'+x2.toFixed(1)+' '+y2.toFixed(1)+'L'+(x1+Math.sin(a)*2.5).toFixed(1)+' '+(y1-Math.cos(a)*2.5).toFixed(1)+'Z" fill="'+bc+'"/>';}
      o+='<ellipse cx="0" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+bc+'"/>';
      if(pat==='stripe')o+='<path d="M0 '+(top+1.5)+'V'+(cy+ry-1.5)+'M8 '+(top+3.5)+'V'+(cy+ry-3.5)+'" stroke="#fff" stroke-opacity=".75" stroke-width="3.5"/>';
      else if(pat==='dots')o+='<g fill="#fff" fill-opacity=".75" stroke="none"><circle cx="3" cy="'+(cy-5)+'" r="2.2"/><circle cx="9" cy="'+(cy+3)+'" r="2"/><circle cx="1" cy="'+(cy+6)+'" r="1.8"/></g>';
      else if(pat==='belly')o+='<ellipse cx="-2" cy="'+(cy+ry*.45)+'" rx="'+(rx*.65)+'" ry="'+(ry*.4)+'" fill="#fff" fill-opacity=".55" stroke="none"/>';
      var ex=-rx*.5,eyY=cy-3;
      o+='<circle cx="'+ex+'" cy="'+eyY+'" r="4.6" fill="#fff"/><circle cx="'+(ex-.8)+'" cy="'+eyY+'" r="2.4" fill="#1E1E2A" stroke="none"/><circle cx="'+(ex-1.6)+'" cy="'+(eyY-1)+'" r=".9" fill="#fff" stroke="none"/>';
      if(ey==='lash')o+=ln('M'+(ex-4)+' '+(eyY-4)+'l-2 -2.5M'+ex+' '+(eyY-5)+'v-3M'+(ex+4)+' '+(eyY-4)+'l2 -2.5',D,1.2);
      else if(ey==='sleepy')o+='<path d="M'+(ex-4.8)+' '+eyY+'A4.8 4.8 0 0 1 '+(ex+4.8)+' '+eyY+'Z" fill="'+bc+'" stroke="#1E2420" stroke-opacity=".6"/>';
      var mx=-rx+2.5,my=cy+4;
      if(mo==='smile')o+=ln('M'+mx+' '+(my-1)+'q2.2 2.6 4.4 0');
      else if(mo==='o')o+='<circle cx="'+(mx+1.5)+'" cy="'+my+'" r="2" fill="#C2414B" stroke="'+D+'" stroke-opacity=".9"/>';
      else o+='<rect x="'+mx+'" y="'+(my-2)+'" width="5" height="3.5" rx="1" fill="#fff" stroke="'+D+'" stroke-opacity=".9"/>'+ln('M'+(mx+2.5)+' '+(my-2)+'v3.5',D,.8);
      var hx=-rx*.45,hy=cy-ry*.82;
      if(ac==='bow')o+='<path d="M'+hx+' '+(hy-2)+'l-6 -4v8ZM'+hx+' '+(hy-2)+'l6 -4v8Z" fill="'+a2+'"/><circle cx="'+hx+'" cy="'+(hy-2)+'" r="1.8" fill="'+a2+'"/>';
      else if(ac==='crown')o+='<path d="M'+(hx-6)+' '+hy+'v-8l3 3l3 -5l3 5l3 -3v8Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
      else if(ac==='hat')o+='<rect x="'+(hx-7)+'" y="'+(hy-2)+'" width="14" height="2.5" fill="'+a2+'"/><rect x="'+(hx-4.5)+'" y="'+(hy-11)+'" width="9" height="9.5" fill="'+a2+'"/>';
      else if(ac==='bubble')o+='<g fill="#fff" fill-opacity=".35" stroke="#2E7FD9" stroke-opacity=".7"><circle cx="'+(-rx-5)+'" cy="'+(cy-10)+'" r="3.2"/><circle cx="'+(-rx-8)+'" cy="'+(cy-19)+'" r="2.2"/><circle cx="'+(-rx-5)+'" cy="'+(cy-25)+'" r="1.5"/></g>';
      return o;
    }
  };

  // 외계인(우주 영화)
  CT.alien={
    opt:{skin:['#7BD36A','#A98BF0','#6FC7E8','#F59CC8','#F5B04A'],eyes:[1,2,3],ant:['none','one','two','horns'],antC:['#F7C531','#E84A4A','#F5F5F5','#3E8EDE'],
      suit:['#3E6FB0','#E84A4A','#F5F5F5','#333C46','#F29B30','#4DBA5A'],helm:['none','glass'],mouth:['smile','o','teeth','flat'],acc:['none','raygun','flag','star'],accC:['#E84A4A','#F7C531','#3E8EDE','#F07AB0'],pose:['down','wave']},
    keys:['skin','eyes','ant','antC','suit','helm','mouth','acc','accC','pose'],
    ez:['skin','eyes','ant','suit','helm','acc','pose'],nm:['skin','eyes','ant','antC','suit','helm','mouth','acc','accC','pose'],
    confuse:[['suit'],['skin']],
    vis:function(c,k){var O=this.opt;if(k==='antC')return c.ant!==0;if(k==='accC')return ['flag','star'].indexOf(O.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.4)c.acc=0;if(r()<.5)c.helm=0;},
    box:function(){return [-24,-77,48,77];},
    draw:function(c){
      var O=this.opt,sk=O.skin[c.skin],ne=O.eyes[c.eyes],an=O.ant[c.ant],anc=O.antC[c.antC],su=O.suit[c.suit],hl=O.helm[c.helm]==='glass',mo=O.mouth[c.mouth],ac=O.acc[c.acc],a2=O.accC[c.accC],wave=O.pose[c.pose]==='wave',o='';
      if(an==='one')o+=ln('M0 -61V-70',sk,2.2)+'<circle cx="0" cy="-72" r="3" fill="'+anc+'"/>';
      else if(an==='two')o+=ln('M-6 -60L-10 -70M6 -60L10 -70',sk,2.2)+'<circle cx="-10.5" cy="-71.5" r="2.8" fill="'+anc+'"/><circle cx="10.5" cy="-71.5" r="2.8" fill="'+anc+'"/>';
      else if(an==='horns')o+='<path d="M-10 -59L-13 -71L-4 -62Z" fill="'+anc+'"/><path d="M10 -59L13 -71L4 -62Z" fill="'+anc+'"/>';
      o+='<rect x="-8" y="-15" width="6" height="15" fill="'+su+'"/><rect x="2" y="-15" width="6" height="15" fill="'+su+'"/><rect x="-9" y="-4" width="8" height="4" rx="1.5" fill="#2A2A2A"/><rect x="1" y="-4" width="8" height="4" rx="1.5" fill="#2A2A2A"/>';
      o+='<rect x="-15" y="-35" width="5" height="15" rx="2.5" fill="'+su+'"/><circle cx="-12.5" cy="-19" r="3" fill="'+sk+'"/>';
      if(!wave)o+='<rect x="10" y="-35" width="5" height="15" rx="2.5" fill="'+su+'"/><circle cx="12.5" cy="-19" r="3" fill="'+sk+'"/>';
      o+='<rect x="-10" y="-38" width="20" height="25" rx="7" fill="'+su+'"/><rect x="-10" y="-20" width="20" height="3" fill="#000" fill-opacity=".18" stroke="none"/><circle cx="0" cy="-30" r="2.5" fill="#F7C531" stroke="none"/>';
      o+='<ellipse cx="0" cy="-50" rx="16" ry="13" fill="'+sk+'"/>';
      var E3=ne===1?[[0,-52,6]]:ne===2?[[-6.5,-52,4.3],[6.5,-52,4.3]]:[[-8.5,-51,3.4],[0,-55,3.4],[8.5,-51,3.4]];
      E3.forEach(function(e){o+='<circle cx="'+e[0]+'" cy="'+e[1]+'" r="'+e[2]+'" fill="#fff"/><circle cx="'+e[0]+'" cy="'+(e[1]+.4)+'" r="'+(e[2]*.5)+'" fill="#1E1E2A" stroke="none"/><circle cx="'+(e[0]-e[2]*.3)+'" cy="'+(e[1]-e[2]*.3)+'" r="'+(e[2]*.22)+'" fill="#fff" stroke="none"/>';});
      if(mo==='smile')o+=ln('M-4 -43Q0 -39.5 4 -43');
      else if(mo==='o')o+='<ellipse cx="0" cy="-42.5" rx="2.2" ry="2.6" fill="#3A1E2A" stroke="none"/>';
      else if(mo==='teeth')o+='<path d="M-4.5 -44H4.5Q0 -38.5 -4.5 -44Z" fill="#fff" stroke="'+D+'" stroke-opacity=".9"/>';
      else o+=ln('M-3 -42.5H3');
      if(hl)o+='<circle cx="0" cy="-50" r="20" fill="#CFEFFF" fill-opacity=".25" stroke="#8FD0F0" stroke-opacity="1" stroke-width="1.6"/>'+ln('M-13 -58Q-10 -65 -3 -67','#fff',2);
      if(ac==='raygun')o+='<rect x="-23" y="-23" width="10" height="5" rx="1.5" fill="#9AA5B1"/><rect x="-27" y="-22" width="5" height="3" fill="#E84A4A"/>';
      else if(ac==='flag')o+=ln('M-12.5 -19V-52','#8B8F99',1.6)+'<path d="M-12.5 -52H-1V-44H-12.5Z" fill="'+a2+'"/>';
      else if(ac==='star')o+='<path d="'+starD(-13,-22,6)+'" fill="'+a2+'"/>';
      if(wave)o+='<rect x="13" y="-52" width="5" height="17" rx="2.5" fill="'+su+'"/><circle cx="15.5" cy="-54" r="3" fill="'+sk+'"/>';
      return o;
    }
  };

  // 아기 공룡(공룡 섬 영화). 왼쪽을 본다
  CT.dino={
    opt:{body:['#6CBF3A','#3FA34D','#F29B30','#5AA0E8','#B07AE0','#F07AB0','#E8C547'],belly:['#F7E6A8','#FFFFFF','#FFD0A0'],spike:['tri','round','none'],spC:['#E84A4A','#F7C531','#3E8EDE','#9B6BDF','#F5F5F5'],
      spots:['none','spots','stripes'],horn:['none','one','three'],eye:['round','happy','angry'],acc:['none','bow','egg','scarf','flower'],accC:['#E84A4A','#3E8EDE','#F7C531','#F07AB0','#9B6BDF']},
    keys:['body','belly','spike','spC','spots','horn','eye','acc','accC'],
    ez:['body','spike','spots','horn','acc'],nm:['body','belly','spike','spC','spots','horn','eye','acc','accC'],
    confuse:[['body'],['spike','spC']],ds:.95,cs:.47,
    vis:function(c,k){var O=this.opt;if(k==='spC')return c.spike!==2;if(k==='accC')return ['bow','scarf','flower'].indexOf(O.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.4)c.acc=0;},
    box:function(){return [-27,-58,63,58];},
    draw:function(c){
      var O=this.opt,bc=O.body[c.body],be=O.belly[c.belly],sp=O.spike[c.spike],spc=O.spC[c.spC],pt=O.spots[c.spots],hn=O.horn[c.horn],ey=O.eye[c.eye],ac=O.acc[c.acc],a2=O.accC[c.accC],o='';
      if(sp==='tri')[[-2,-33],[5,-34],[12,-32],[18,-28]].forEach(function(q){o+='<path d="M'+(q[0]-3.5)+' '+(q[1]+2)+'L'+q[0]+' '+(q[1]-6)+'L'+(q[0]+3.5)+' '+(q[1]+2)+'Z" fill="'+spc+'"/>';});
      else if(sp==='round')[[-2,-32],[5,-33],[12,-31],[18,-27]].forEach(function(q){o+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="3.4" fill="'+spc+'"/>';});
      o+='<path d="M16 -26Q30 -26 35 -10Q26 -13 16 -14Z" fill="'+bc+'"/>';
      o+='<rect x="-6" y="-12" width="7" height="12" rx="2" fill="'+bc+'"/><rect x="9" y="-12" width="7" height="12" rx="2" fill="'+bc+'"/>';
      o+='<ellipse cx="4" cy="-20" rx="17" ry="13" fill="'+bc+'"/><ellipse cx="-8" cy="-30" rx="7" ry="9" fill="'+bc+'" stroke="none"/>';
      o+='<ellipse cx="0" cy="-15" rx="10" ry="6" fill="'+be+'" stroke="none"/>';
      if(pt==='spots')o+='<g fill="#000" fill-opacity=".16" stroke="none"><circle cx="9" cy="-25" r="2.8"/><circle cx="15" cy="-19" r="2.2"/><circle cx="3" cy="-28" r="2"/></g>';
      else if(pt==='stripes')o+='<path d="M6 -32v6M12 -30v6M17 -26v5" stroke="#000" stroke-opacity=".2" stroke-width="2.6" stroke-linecap="round"/>';
      o+='<ellipse cx="-14" cy="-39" rx="12" ry="10" fill="'+bc+'"/>';
      if(hn!=='none')o+='<path d="M-23 -44L-21 -52L-18 -45Z" fill="#F5F1E0"/>';
      if(hn==='three')o+='<path d="M-15 -48L-14 -55L-11 -48ZM-9 -46L-6 -53L-5 -45Z" fill="#F5F1E0"/>';
      o+='<circle cx="-23" cy="-40" r="1" fill="'+D+'" stroke="none"/>'+ln('M-25 -34Q-19 -31 -13 -34');
      if(ey==='happy')o+=ln('M-18.5 -41Q-16 -44.5 -13.5 -41',D,1.6);
      else{o+='<circle cx="-16" cy="-42" r="3.6" fill="#fff"/><circle cx="-16.8" cy="-41.6" r="2" fill="#1E1E2A" stroke="none"/><circle cx="-17.4" cy="-42.6" r=".7" fill="#fff" stroke="none"/>';
        if(ey==='angry')o+=ln('M-20 -47L-12.5 -45.5',D,1.6);}
      if(ac==='bow')o+='<path d="M-9 -48l-6 -4v8ZM-9 -48l6 -4v8Z" fill="'+a2+'"/><circle cx="-9" cy="-48" r="1.8" fill="'+a2+'"/>';
      else if(ac==='egg')o+='<path d="M-25 -45Q-14 -62 -3 -45L-6 -48L-9 -44L-12 -48L-15 -44L-18 -48L-21 -44Z" fill="#F5F1E0"/><circle cx="-12" cy="-52" r="1.6" fill="#7FC27A" stroke="none"/><circle cx="-7" cy="-49" r="1.2" fill="#7FC27A" stroke="none"/>';
      else if(ac==='scarf')o+='<path d="M-15 -30Q-7 -27 0 -32L1 -28Q-7 -23 -15 -26Z" fill="'+a2+'"/><path d="M-3 -28l4 9l-5 1Z" fill="'+a2+'"/>';
      else if(ac==='flower')o+='<g fill="'+a2+'"><circle cx="-6" cy="-50" r="2.5"/><circle cx="-2" cy="-48" r="2.5"/><circle cx="-6" cy="-45" r="2.5"/><circle cx="-10" cy="-48" r="2.5"/></g><circle cx="-6" cy="-48" r="1.6" fill="#F7C531" stroke="none"/>';
      return o;
    }
  };

  // 눈사람(겨울 동화 영화)
  CT.snow={
    opt:{hat:['none','top','beanie','bucket','crown'],hatC:['#222831','#E84A4A','#3E8EDE','#4DBA5A','#9B6BDF'],scarf:['none','short','long'],scC:['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F07AB0'],
      nose:['carrot','button'],btn:[2,3],btnC:['#222831','#E84A4A','#3E8EDE'],arms:['sticks','up','none'],eyes:['coal','happy'],mouth:['smile','o','dots']},
    keys:['hat','hatC','scarf','scC','nose','btn','btnC','arms','eyes','mouth'],
    ez:['hat','scarf','nose','arms','btn'],nm:['hat','hatC','scarf','scC','nose','btn','btnC','arms','eyes','mouth'],
    confuse:[['hat','hatC'],['scarf','scC']],
    vis:function(c,k){var O=this.opt;if(k==='hatC')return ['top','beanie','bucket'].indexOf(O.hat[c.hat])>=0;if(k==='scC')return c.scarf!==0;return true;},
    rand:function(r,c){if(r()<.25)c.hat=0;if(r()<.3)c.scarf=0;},
    fix:function(r,c){if(c.hat===0)c.hat=ri(r,1,4);},
    box:function(){return [-23,-80,46,80];},
    draw:function(c){
      var O=this.opt,ht=O.hat[c.hat],hc=O.hatC[c.hatC],sf=O.scarf[c.scarf],sc=O.scC[c.scC],ns=O.nose[c.nose],nb=O.btn[c.btn],bt=O.btnC[c.btnC],am=O.arms[c.arms],ey=O.eyes[c.eyes],mo=O.mouth[c.mouth],o='';
      if(am==='sticks')o+=ln('M-9 -40L-22 -31M-17 -34.5L-19 -39M9 -40L22 -31M17 -34.5L19 -39','#7A4B2A',1.8);
      else if(am==='up')o+=ln('M-9 -41L-21 -53M-17 -49L-21 -47M9 -41L21 -53M17 -49L21 -47','#7A4B2A',1.8);
      o+='<circle cx="0" cy="-15" r="15" fill="#FDFEFF"/><ellipse cx="3" cy="-8" rx="10" ry="5" fill="#BFD9EE" fill-opacity=".45" stroke="none"/>';
      o+='<circle cx="0" cy="-38" r="11" fill="#FDFEFF"/><circle cx="0" cy="-58" r="9.5" fill="#FDFEFF"/>';
      (nb===3?[-43,-38,-33]:[-41,-35]).forEach(function(y){o+='<circle cx="0" cy="'+y+'" r="1.8" fill="'+bt+'" stroke="none"/>';});
      if(ey==='coal')o+='<circle cx="-3.4" cy="-60" r="1.5" fill="#222831" stroke="none"/><circle cx="3.4" cy="-60" r="1.5" fill="#222831" stroke="none"/>';
      else o+=ln('M-5 -59.5Q-3.4 -62 -1.8 -59.5M1.8 -59.5Q3.4 -62 5 -59.5','#222831',1.4);
      if(ns==='carrot')o+='<path d="M0 -58L9 -56.3L0 -55Z" fill="#F29B30" stroke="#B9661B" stroke-opacity="1" stroke-width=".7"/>';
      else o+='<circle cx="0" cy="-56.5" r="1.8" fill="#F29B30" stroke="none"/>';
      if(mo==='smile')o+=ln('M-3.5 -53.5Q0 -50.5 3.5 -53.5','#222831',1.3);
      else if(mo==='o')o+='<circle cx="0" cy="-52.5" r="1.7" fill="#222831" stroke="none"/>';
      else o+='<g fill="#222831" stroke="none"><circle cx="-3.6" cy="-53.6" r=".9"/><circle cx="-1.8" cy="-52.4" r=".9"/><circle cx="0" cy="-52" r=".9"/><circle cx="1.8" cy="-52.4" r=".9"/><circle cx="3.6" cy="-53.6" r=".9"/></g>';
      if(sf!=='none')o+='<rect x="-9.5" y="-50.5" width="19" height="4.6" rx="2.2" fill="'+sc+'"/><rect x="3" y="-48" width="4.4" height="'+(sf==='long'?15:7)+'" rx="1.5" fill="'+sc+'"/>';
      if(ht==='top')o+='<rect x="-10.5" y="-67" width="21" height="2.6" fill="'+hc+'"/><rect x="-7" y="-79" width="14" height="12.5" fill="'+hc+'"/><rect x="-7" y="-70" width="14" height="2.2" fill="#E84A4A" stroke="none"/>';
      else if(ht==='beanie')o+='<path d="M-9 -63Q-9 -74 0 -74Q9 -74 9 -63Z" fill="'+hc+'"/><rect x="-9.5" y="-65" width="19" height="3.2" rx="1.5" fill="'+hc+'"/><circle cx="0" cy="-75" r="2.6" fill="#F5F5F5"/>';
      else if(ht==='bucket')o+='<path d="M-7.5 -65L-6 -75L6 -75L7.5 -65Z" fill="'+hc+'"/><rect x="-10" y="-66" width="20" height="2.4" rx="1" fill="'+hc+'"/>';
      else if(ht==='crown')o+='<path d="M-7 -65V-73L-3.5 -70L0 -75L3.5 -70L7 -73V-65Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
      return o;
    }
  };

  // ---------- 소품 ----------
  // box: 차지하는 칸(축척 전), keys: 바꿀 수 있는 것, ez: 초급에서 바꿀 것(없으면 keys 전부), sc: 기본 크기, keep: 지우면 안 되는 것
  var WALLC=['#F4E3C1','#F7B9A6','#BFE0F2','#D9E8B0','#FFFFFF'],ROOFC=['#D9534F','#3E6FB0','#7A4B2A','#4DBA5A','#9B6BDF'],DOORC=['#7A4B2A','#3E6FB0','#D9534F'];
  function houseDraw(p){var o='<rect x="-24" y="-34" width="48" height="34" fill="'+WALLC[p.wall]+'"/><path d="M-28 -34L0 -56L28 -34Z" fill="'+ROOFC[p.roof]+'"/><rect x="-5" y="-18" width="10" height="18" fill="'+DOORC[p.door]+'"/>';
    o+='<rect x="-19" y="-28" width="9" height="9" fill="#BFE6FF"/>';if(p.win===1)o+='<rect x="10" y="-28" width="9" height="9" fill="#BFE6FF"/>';return o;}
  var PROP={
    tree:{box:[-17,-57,34,57],keys:{col:['#3FA34D','#2E8B57','#6CBF3A','#E58A2C']},draw:function(p){var c=this.keys.col[p.col];return '<rect x="-4" y="-20" width="8" height="20" fill="#8B5A2B"/><rect x="-16" y="-44" width="32" height="26" rx="4" fill="'+c+'"/><rect x="-11" y="-56" width="22" height="14" rx="4" fill="'+c+'"/><rect x="-11" y="-40" width="6" height="5" rx="1.5" fill="#fff" fill-opacity=".25" stroke="none"/>';}},
    house:{box:[-28,-56,56,56],keys:{wall:WALLC,roof:ROOFC,win:[1,2],door:DOORC},ez:['wall','roof'],draw:houseDraw},
    cabin:{box:[-29,-60,58,60],keys:{wall:['#B9814F','#9C6B43','#D9A066'],roof:ROOFC,win:[1,2],door:DOORC},ez:['roof','win'],draw:function(p){
      var o=houseDraw({wall:0,roof:p.roof,win:p.win,door:p.door}).replace(WALLC[0],this.keys.wall[p.wall]);
      return o+'<path d="M-29 -33L0 -57L29 -33L24 -33L0 -51L-24 -33Z" fill="#FFFFFF"/><rect x="12" y="-60" width="7" height="12" fill="#8A5A3B"/><rect x="11" y="-61" width="9" height="3" fill="#FFFFFF"/>';}},
    flower:{box:[-7,-21,14,21],keys:{col:['#F07AB0','#E84A4A','#F7C531','#9B6BDF','#FFFFFF']},draw:function(p){var c=this.keys.col[p.col];return '<path d="M0 0V-12" stroke="#3E871C" stroke-opacity="1" stroke-width="2"/><circle cx="-3.5" cy="-14" r="3" fill="'+c+'"/><circle cx="3.5" cy="-14" r="3" fill="'+c+'"/><circle cx="0" cy="-17.5" r="3" fill="'+c+'"/><circle cx="0" cy="-10.5" r="3" fill="'+c+'"/><circle cx="0" cy="-14" r="2" fill="#F7C531" stroke="none"/>';}},
    cloud:{box:[-21,-19,42,19],keys:{},sc:1.15,draw:function(){return '<rect x="-20" y="-10" width="40" height="10" rx="5" fill="#FFFFFF" stroke-opacity=".12"/><rect x="-11" y="-18" width="22" height="11" rx="5.5" fill="#FFFFFF" stroke-opacity=".12"/>';}},
    sun:{box:[-21,-42,42,42],keys:{face:[0,1]},ez:[],keep:1,draw:function(p){var o='<g stroke="none">';for(var i=0;i<8;i++)o+='<rect x="-2" y="-20" width="4" height="6" rx="2" fill="#FFB12E" transform="translate(0 -21) rotate('+(i*45)+')"/>';
      o+='</g><circle cx="0" cy="-21" r="13" fill="#FFD54A"/>';
      o+=(p.face===0?'<circle cx="-4.5" cy="-23" r="1.6" fill="#7A4B10" stroke="none"/><circle cx="4.5" cy="-23" r="1.6" fill="#7A4B10" stroke="none"/>':ln('M-6 -23Q-4.5 -25 -3 -23M3 -23Q4.5 -25 6 -23','#7A4B10'))+ln('M-4 -18Q0 -15 4 -18','#7A4B10');return o;}},
    car:{box:[-23,-26,46,26],keys:{col:['#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F29B30','#9B6BDF']},draw:function(p){var c=this.keys.col[p.col];return '<rect x="-22" y="-16" width="44" height="11" rx="3" fill="'+c+'"/><rect x="-12" y="-25" width="22" height="10" rx="2" fill="'+c+'"/><rect x="-9" y="-23" width="7" height="6" fill="#BFE6FF"/><rect x="0" y="-23" width="7" height="6" fill="#BFE6FF"/><circle cx="-12" cy="-4.5" r="4.5" fill="#2A2A2A"/><circle cx="12" cy="-4.5" r="4.5" fill="#2A2A2A"/>';}},
    chest:{box:[-10,-17,20,17],keys:{},draw:function(){return '<rect x="-9" y="-12" width="18" height="12" fill="#A0642D"/><rect x="-9.5" y="-17" width="19" height="6" rx="2" fill="#7A4B1F"/><rect x="-1.5" y="-12" width="3" height="4" fill="#F7C531"/>';}},
    coin:{box:[-6,-12,12,12],keys:{},draw:function(){return '<circle cx="0" cy="-6" r="5.5" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/><rect x="-1" y="-9" width="2" height="6" fill="#B5850F" stroke="none"/>';}},
    // 만화: 벚꽃 학교
    sakura:{box:[-20,-58,40,58],keys:{col:['#F7B8CF','#F49AC1','#FFD9E6','#FFFFFF']},draw:function(p){var c=this.keys.col[p.col];
      return '<path d="M-3.5 0L-2.5 -26L2.5 -26L3.5 0Z" fill="#7A4B2A"/>'+ln('M0 -24L-8 -32M1 -26L8 -34','#7A4B2A',2.4)+'<g fill="'+c+'"><circle cx="-10" cy="-38" r="10"/><circle cx="10" cy="-38" r="10"/><circle cx="0" cy="-46" r="11"/><circle cx="0" cy="-32" r="9"/></g><g fill="#fff" fill-opacity=".7" stroke="none"><circle cx="-8" cy="-42" r="1.6"/><circle cx="5" cy="-48" r="1.6"/><circle cx="9" cy="-35" r="1.6"/></g>';}},
    school:{box:[-42,-70,84,70],sc:.85,keys:{wall:['#F4E3C1','#FFFFFF','#F7C9B5','#D7E6F5'],roof:['#7A4B2A','#3E6FB0','#2E7D46','#B0413E'],top:['clock','bell']},ez:['wall','roof'],draw:function(p){
      var w=this.keys.wall[p.wall],rf=this.keys.roof[p.roof],o='<rect x="-40" y="-44" width="80" height="44" fill="'+w+'"/><rect x="-42" y="-48" width="84" height="5" fill="'+rf+'"/><rect x="-10" y="-62" width="20" height="16" fill="'+w+'"/><path d="M-12 -62L0 -70L12 -62Z" fill="'+rf+'"/>';
      [-34,-24,18,28].forEach(function(x){[-38,-24].forEach(function(y){o+='<rect x="'+x+'" y="'+y+'" width="7" height="7" fill="#BFE6FF"/>';});});
      o+='<rect x="-7" y="-17" width="14" height="17" fill="#7A4B2A"/>';
      o+=p.top===0?'<circle cx="0" cy="-54" r="5" fill="#fff"/>'+ln('M0 -54V-57.5M0 -54H2.6',D,1):'<path d="M-4 -51Q-4 -59 0 -59Q4 -59 4 -51Z" fill="#F7C531"/><circle cx="0" cy="-50.5" r="1.3" fill="#B5850F"/>';return o;}},
    bench:{box:[-17,-15,34,15],keys:{col:['#C0763A','#3E8EDE','#E84A4A','#4DBA5A']},draw:function(p){var c=this.keys.col[p.col];return '<rect x="-14" y="-9" width="3" height="9" fill="#555"/><rect x="11" y="-9" width="3" height="9" fill="#555"/><rect x="-16" y="-10" width="32" height="3.5" rx="1" fill="'+c+'"/><rect x="-16" y="-15" width="32" height="3.5" rx="1" fill="'+c+'"/>';}},
    bag:{box:[-8,-16,16,16],keys:{col:['#E84A4A','#2C3E66','#F07AB0','#7A4B2A']},draw:function(p){var c=this.keys.col[p.col];return '<rect x="-7" y="-14" width="14" height="14" rx="3" fill="'+c+'"/><path d="M-7 -10Q-7 -15 0 -15Q7 -15 7 -10V-6H-7Z" fill="'+c+'" stroke-opacity=".6"/><rect x="-1.5" y="-7.5" width="3" height="3" fill="#F7C531" stroke="none"/>';}},
    cat:{box:[-11,-21,24,21],keys:{col:['#F29B30','#333C46','#F5F5F5','#9AA5B1']},draw:function(p){var c=this.keys.col[p.col];return ln('M7 -4Q14 -6 12 -14',c,2.6)+'<ellipse cx="2" cy="-7" rx="8" ry="7" fill="'+c+'"/><circle cx="-3" cy="-15" r="5.5" fill="'+c+'"/><path d="M-8 -17L-8 -22L-4 -19ZM2 -17L2 -22L-2 -19Z" fill="'+c+'"/><circle cx="-5" cy="-15.5" r=".9" fill="'+D+'" stroke="none"/><circle cx="-1" cy="-15.5" r=".9" fill="'+D+'" stroke="none"/>';}},
    ball:{box:[-6,-12,12,12],keys:{col:['#E84A4A','#3E8EDE','#F7C531','#F07AB0']},draw:function(p){return '<circle cx="0" cy="-6" r="5.6" fill="'+this.keys.col[p.col]+'"/>'+ln('M-5.4 -6H5.4M0 -11.6Q-3 -6 0 -0.4','#fff',1.2);}},
    // 영화: 바닷속
    coral:{box:[-15,-32,30,32],keys:{col:['#F07AB0','#F29B30','#E84A4A','#9B6BDF']},draw:function(p){var c=this.keys.col[p.col];return ln('M0 0V-18M0 -12L-9 -22V-29M0 -17L9 -26V-31M-9 -22L-13 -26M9 -26L13 -23',c,5)+'<circle cx="-9" cy="-29" r="2.5" fill="#fff" fill-opacity=".35" stroke="none"/>';}},
    weed:{box:[-9,-42,18,42],keys:{col:['#3FA34D','#6CBF3A','#2E8B57']},draw:function(p){var c=this.keys.col[p.col];return ln('M-2 0Q-9 -10 -2 -20Q5 -30 -2 -40',c,4.5)+ln('M3 0Q8 -8 3 -16Q-2 -24 3 -30',c,3.5);}},
    shell:{box:[-8,-12,16,12],keys:{col:['#F7B8CF','#F5E1C0','#FFFFFF','#F7C531']},draw:function(p){return '<path d="M-7.5 0Q-9 -11 0 -12Q9 -11 7.5 0Z" fill="'+this.keys.col[p.col]+'"/>'+ln('M0 0V-11M-3.5 0L-5 -9M3.5 0L5 -9','#B07A5A',.9);}},
    starfish:{box:[-8,-16,16,16],keys:{col:['#F29B30','#E84A4A','#F7C531','#F07AB0']},draw:function(p){return '<path d="'+starD(0,-8,8)+'" fill="'+this.keys.col[p.col]+'" stroke-linejoin="round"/><g fill="#fff" fill-opacity=".6" stroke="none"><circle cx="0" cy="-11" r=".9"/><circle cx="-2.5" cy="-7" r=".9"/><circle cx="2.5" cy="-7" r=".9"/></g>';}},
    sub:{box:[-28,-32,56,32],keys:{col:['#F7C531','#E84A4A','#4DBA5A','#F29B30'],win:[0,1]},draw:function(p){var c=this.keys.col[p.col],o='<path d="M22 -16L28 -21V-7L22 -12Z" fill="#9AA5B1"/><ellipse cx="0" cy="-12" rx="22" ry="11" fill="'+c+'"/><rect x="-7" y="-28" width="13" height="9" rx="2" fill="'+c+'"/>'+ln('M0 -28V-31H5','#555',1.6);
      (p.win?[-11,0,11]:[0]).forEach(function(x){o+='<circle cx="'+x+'" cy="-12" r="3.6" fill="#BFE6FF" stroke="#555" stroke-opacity="1"/>';});return o;}},
    jelly:{box:[-10,-30,20,30],keys:{col:['#F7B8CF','#B9A2F5','#9EE6F5','#FFF3A6']},draw:function(p){var c=this.keys.col[p.col];return ln('M-6 -16q-2 5 0 9t0 7M0 -16q-2 5 0 9t0 9M6 -16q-2 5 0 9t0 7',c,1.8)+'<path d="M-9 -16Q-9 -30 0 -30Q9 -30 9 -16Q4.5 -13 0 -16Q-4.5 -13 -9 -16Z" fill="'+c+'"/><circle cx="-3" cy="-22" r="1.1" fill="'+D+'" stroke="none"/><circle cx="3" cy="-22" r="1.1" fill="'+D+'" stroke="none"/>';}},
    bubbles:{box:[-8,-24,16,24],keys:{},draw:function(){return '<g fill="#fff" fill-opacity=".3" stroke="#fff" stroke-opacity=".9"><circle cx="0" cy="-5" r="4.5"/><circle cx="-3" cy="-15" r="3"/><circle cx="3" cy="-21" r="2.2"/></g>';}},
    rock:{box:[-22,-22,44,22],keys:{col:['#8C8F99','#7A6E66','#A39A8C']},draw:function(p){return '<path d="M-21 0Q-22 -14 -10 -19Q-2 -24 8 -19Q21 -14 21 0Z" fill="'+this.keys.col[p.col]+'"/><path d="M-9 -15Q-3 -18 3 -16" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>';}},
    // 영화: 우주
    planet:{box:[-21,-36,42,36],keys:{col:['#F29B30','#9B6BDF','#3E8EDE','#E84A4A','#4DBA5A'],ring:[0,1]},draw:function(p){var c=this.keys.col[p.col],o='<circle cx="0" cy="-18" r="13" fill="'+c+'"/><path d="M-12 -22Q0 -18 12 -22" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>';
      if(p.ring)o+='<ellipse cx="0" cy="-18" rx="20" ry="5" fill="none" stroke="#F7E6A8" stroke-opacity="1" stroke-width="2.6" transform="rotate(-15 0 -18)"/>';return o;}},
    star:{box:[-9,-18,18,18],keys:{col:['#FFD54A','#FFFFFF','#9EE6F5','#F7B8CF']},draw:function(p){return '<path d="'+starD(0,-9,9)+'" fill="'+this.keys.col[p.col]+'"/>';}},
    rocket:{box:[-14,-58,28,58],keys:{col:['#F5F5F5','#E84A4A','#3E8EDE','#F7C531'],fin:['#E84A4A','#3E8EDE','#4DBA5A','#F29B30']},draw:function(p){var f=this.keys.fin[p.fin];
      return '<path d="M-8 -16L-14 -2V0H-8ZM8 -16L14 -2V0H8Z" fill="'+f+'"/><path d="M-8 0V-38Q0 -58 8 -38V0Z" fill="'+this.keys.col[p.col]+'"/><path d="M-5 -49Q0 -57 5 -49Z" fill="'+f+'"/><circle cx="0" cy="-32" r="4.5" fill="#BFE6FF" stroke="#555" stroke-opacity="1"/>';}},
    ufo:{box:[-23,-24,46,24],keys:{col:['#9AA5B1','#F07AB0','#4DBA5A','#F7C531'],light:['#F7C531','#E84A4A','#3E8EDE']},draw:function(p){var l=this.keys.light[p.light];
      return ln('M-10 -6L-14 0M10 -6L14 0','#777',1.6)+'<path d="M-10 -14Q-10 -24 0 -24Q10 -24 10 -14Z" fill="#BFE6FF" fill-opacity=".9"/><ellipse cx="0" cy="-11" rx="22" ry="6" fill="'+this.keys.col[p.col]+'"/><g fill="'+l+'"><circle cx="-12" cy="-10" r="1.8"/><circle cx="0" cy="-8.5" r="1.8"/><circle cx="12" cy="-10" r="1.8"/></g>';}},
    crater:{box:[-15,-8,30,8],keys:{},draw:function(){return '<ellipse cx="0" cy="-4" rx="14" ry="4" fill="#6F7482"/><ellipse cx="0" cy="-3.2" rx="10" ry="2.6" fill="#5A5F6C" stroke="none"/>';}},
    flag:{box:[-3,-27,19,27],keys:{col:['#E84A4A','#3E8EDE','#F7C531','#4DBA5A']},draw:function(p){return ln('M0 0V-26','#9AA5B1',1.8)+'<path d="M0 -26H15V-16H0Z" fill="'+this.keys.col[p.col]+'"/>';}},
    gem:{box:[-7,-13,14,13],keys:{col:['#9EE6F5','#F07AB0','#B9A2F5','#7BD36A']},draw:function(p){return '<path d="M-6 -9L-3 -13H3L6 -9L0 0Z" fill="'+this.keys.col[p.col]+'"/>'+ln('M-6 -9H6M-3 -13L0 0L3 -13','#fff',.8);}},
    // 영화: 공룡 섬
    palm:{box:[-24,-62,48,62],keys:{col:['#3FA34D','#6CBF3A','#2E8B57']},draw:function(p){var c=this.keys.col[p.col];
      return ln('M2 0Q-2 -24 4 -46','#8B5A2B',6)+'<g fill="'+c+'"><path d="M4 -48Q-10 -58 -23 -46Q-10 -50 4 -45Z"/><path d="M4 -48Q18 -58 23 -44Q14 -50 4 -45Z"/><path d="M4 -48Q-4 -64 -14 -60Q-4 -56 3 -46Z"/><path d="M4 -48Q12 -64 20 -58Q10 -56 5 -46Z"/></g><circle cx="2" cy="-44" r="2.6" fill="#7A4B2A"/><circle cx="7" cy="-43" r="2.6" fill="#7A4B2A"/>';}},
    volcano:{box:[-40,-62,80,62],sc:.9,keys:{lava:['#E84A4A','#F29B30'],smoke:[0,1]},draw:function(p){var l=this.keys.lava[p.lava];
      var o='<path d="M-40 0L-11 -40H11L40 0Z" fill="#8C6A52"/><path d="M-11 -40H11L8 -34Q4 -28 2 -34Q-1 -26 -4 -34Q-7 -30 -9 -36Z" fill="'+l+'"/><path d="M4 -34Q8 -20 6 -8" fill="none" stroke="'+l+'" stroke-opacity="1" stroke-width="3" stroke-linecap="round"/>';
      if(p.smoke)o+='<g fill="#D5D8DE" stroke="none"><circle cx="-2" cy="-46" r="6"/><circle cx="6" cy="-53" r="7"/><circle cx="-5" cy="-57" r="5"/></g>';return o;}},
    egg:{box:[-7,-17,14,17],keys:{col:['#F5F1E0','#BFE6A0','#F7C9E0','#BFE6FF'],spot:['#E84A4A','#3E8EDE','#9B6BDF']},draw:function(p){var s=this.keys.spot[p.spot];return '<ellipse cx="0" cy="-8" rx="6.5" ry="8.5" fill="'+this.keys.col[p.col]+'"/><g fill="'+s+'" stroke="none"><circle cx="-2" cy="-11" r="1.5"/><circle cx="2.5" cy="-6" r="1.3"/><circle cx="-1" cy="-4" r="1"/></g>';}},
    fern:{box:[-12,-18,24,18],keys:{col:['#3FA34D','#6CBF3A','#2E8B57']},draw:function(p){var c=this.keys.col[p.col];return ln('M0 0Q-2 -10 -10 -16M0 0Q0 -10 0 -17M0 0Q2 -10 10 -16M0 0Q-4 -5 -11 -6M0 0Q4 -5 11 -6',c,3);}},
    // 영화: 겨울 동화
    pine:{box:[-16,-52,32,52],keys:{col:['#2E8B57','#3FA34D','#1F6B45'],snow:[0,1]},draw:function(p){var c=this.keys.col[p.col],o='<rect x="-3" y="-10" width="6" height="10" fill="#7A4B2A"/><path d="M-15 -9L0 -30L15 -9Z" fill="'+c+'"/><path d="M-12 -24L0 -42L12 -24Z" fill="'+c+'"/><path d="M-8 -37L0 -52L8 -37Z" fill="'+c+'"/>';
      if(p.snow)o+='<path d="M-4 -44.5L0 -52L4 -44.5L2 -45.5L0 -43L-2 -45.5Z M-7 -31L0 -42L7 -31L4 -32L1.5 -29L-1.5 -32L-4 -30Z" fill="#fff" stroke="none"/>';return o;}},
    igloo:{box:[-24,-26,48,26],keys:{flag:[0,1]},draw:function(p){var o='<path d="M-23 0Q-23 -24 0 -24Q23 -24 23 0Z" fill="#F4FAFF"/>'+ln('M-21 -8H21M-14 -17H14M-10 0V-8M8 0V-8M-2 -8V-17M-16 -8V-17M12 -8V-17','#BFD9EE',1)+'<path d="M-6 0V-6Q-6 -11 0 -11Q6 -11 6 -6V0Z" fill="#3A4A5A"/>';
      if(p.flag)o+=ln('M14 -21V-34','#777',1.4)+'<path d="M14 -34H23L14 -29Z" fill="#E84A4A"/>';return o;}},
    sled:{box:[-16,-12,32,12],keys:{col:['#E84A4A','#3E8EDE','#C0763A','#4DBA5A']},draw:function(p){return ln('M-15 -1H12Q16 -1 16 -5','#555',1.8)+'<rect x="-13" y="-11" width="24" height="6" rx="2" fill="'+this.keys.col[p.col]+'"/>'+ln('M-9 -5V-1M7 -5V-1','#555',1.6);}},
    gift:{box:[-8,-17,16,17],keys:{col:['#E84A4A','#3E8EDE','#4DBA5A','#9B6BDF'],rib:['#F7C531','#FFFFFF']},draw:function(p){var r=this.keys.rib[p.rib];return '<rect x="-7" y="-12" width="14" height="12" fill="'+this.keys.col[p.col]+'"/><rect x="-8" y="-13" width="16" height="3.5" fill="'+this.keys.col[p.col]+'"/><rect x="-1.4" y="-13" width="2.8" height="13" fill="'+r+'" stroke="none"/><path d="M0 -13L-5 -17L-4 -13ZM0 -13L5 -17L4 -13Z" fill="'+r+'"/>';}},
    flake:{box:[-9,-18,18,18],keys:{},draw:function(){return ln('M0 -1V-17M-7 -5L7 -13M-7 -13L7 -5M-2 -15L0 -13L2 -15M-2 -3L0 -5L2 -3','#fff',1.8);}}
  };
  function propSvg(p){return '<g transform="translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+') scale('+p.s.toFixed(3)+')" stroke="#1E2420" stroke-opacity=".3" stroke-width="1" stroke-linejoin="round">'+PROP[p.t].draw(p)+'</g>';}
  function itemBox(it){
    if(it.t==='char')return charBox(it.c,it.x,it.y,it.s);
    var b=PROP[it.t].box;return [it.x+b[0]*it.s,it.y+b[1]*it.s,b[2]*it.s,b[3]*it.s];
  }
  function itemSvg(it){return it.t==='char'?charSvg(it.c,it.x,it.y,it.s):propSvg(it);}
  function overlap(a,b,m){return a[0]<b[0]+b[2]+m&&b[0]<a[0]+a[2]+m&&a[1]<b[1]+b[3]+m&&b[1]<a[1]+a[3]+m;}

  // ---------- 장르 ----------
  // pal: [하늘 위, 하늘 아래, 땅], horizon/air: 지평선·하늘에 놓을 것(i 번째), mid: 앞쪽 큰 물건, small: 작은 물건, sky/ground: 배경 꾸미기(씨앗으로 위·아래 같게)
  // crowd: 고급 배경 {g 땅, path 길, feat 아무도 안 서는 곳, deco 꾸밈(첫째는 큰 것)}
  function dotsR(r,n,x0,x1,y0,y1,rad,fill,op){var o='<g fill="'+fill+'" fill-opacity="'+op+'" stroke="none">';for(var i=0;i<n;i++)o+='<circle cx="'+(x0+r()*(x1-x0)).toFixed(1)+'" cy="'+(y0+r()*(y1-y0)).toFixed(1)+'" r="'+(rad[0]+r()*(rad[1]-rad[0])).toFixed(2)+'"/>';return o+'</g>';}
  var THEMES={
    block:{name:'블록 마을',genre:'게임',ch:'block',pal:[['#8FD3FF','#DDF3FF','#7CC152'],['#FFC48A','#FFE9C9','#86C55A'],['#A9B8FF','#E3E8FF','#6DB86A'],['#9EE6E0','#E6FFFB','#8BCB5C']],
      horizon:function(r){return r()<.5?'house':'tree';},air:function(r,i){return i===0?'sun':'cloud';},mid:['car'],small:['flower','flower','chest','coin'],
      crowd:{g:'#7CC152',path:'#E9D7A8',feat:'pond',deco:['tree','flower'],card:['#DDF3FF','#BFE6FF']}},
    anime:{name:'벚꽃 학교',genre:'만화',ch:'kid',pal:[['#9FD8FF','#FFE6F0','#E8D3A8'],['#FFC9DE','#FFF1E6','#E3CFA0'],['#B9C8FF','#FCE8F4','#E8D7B0']],
      horizon:function(r,i){return i===0?'school':'sakura';},air:function(r,i){return i===0?'sun':'cloud';},mid:['bench'],small:['bag','cat','ball','flower'],
      sky:function(r,W,HZ){return dotsR(r,22,0,W,10,HZ+60,[1.4,2.4],'#F49AC1',.75);},
      ground:function(r,W,HZ){var o='<g stroke="none">';for(var x=4;x<W;x+=16)o+='<rect x="'+x+'" y="'+(HZ-16)+'" width="4" height="16" fill="#FFFFFF" fill-opacity=".9"/>';return o+'<rect x="0" y="'+(HZ-13)+'" width="'+W+'" height="3" fill="#FFFFFF" fill-opacity=".9"/><rect x="0" y="'+(HZ-6)+'" width="'+W+'" height="3" fill="#FFFFFF" fill-opacity=".9"/></g>';},
      crowd:{g:'#E8D3A8',path:'#F5E9CF',feat:'stage',deco:['sakura','flower','ball'],card:['#FFE6F0','#FFC9DE']}},
    space:{name:'우주 대모험',genre:'영화',ch:'alien',pal:[['#141A3C','#3A2A6A','#A3A8B6'],['#0E1430','#22346A','#B4A9C9'],['#1E1238','#4A2A5E','#9FA6B5']],
      horizon:function(r){return r()<.4?'rocket':'rock';},air:function(r,i){return i===0?'planet':r()<.6?'star':'planet';},mid:['ufo'],small:['crater','flag','gem','crater'],
      sky:function(r,W,HZ){return dotsR(r,60,0,W,0,HZ-4,[.5,1.5],'#FFFFFF',.85);},
      ground:function(r,W,HZ,H){return dotsR(r,18,0,W,HZ+10,H,[2,5],'#6F7482',.45);},
      crowd:{g:'#A3A8B6',path:'#BEC3CF',feat:'crater',deco:['rock','crater','gem'],card:['#22346A','#3A2A6A']}},
    sea:{name:'바닷속 탐험',genre:'영화',ch:'fish',pal:[['#6CC6F0','#2A86C8','#E9D7A8'],['#7FE0E0','#2E9AB8','#F0DDB0'],['#8FB8F5','#3A6FC8','#E6D2A2']],
      horizon:function(r){var x=r();return x<.45?'coral':x<.75?'weed':'rock';},air:function(r,i){return i===0||r()<.5?'jelly':'bubbles';},mid:['sub'],small:['shell','starfish','chest','coin'],
      sky:function(r,W,HZ){var o='<g fill="#FFFFFF" fill-opacity=".09" stroke="none">';for(var i=0;i<4;i++){var x=r()*W;o+='<path d="M'+(x-10).toFixed(0)+' 0H'+(x+18).toFixed(0)+'L'+(x+60).toFixed(0)+' '+HZ+'H'+(x+10).toFixed(0)+'Z"/>';}return o+'</g>'+dotsR(r,14,0,W,10,HZ,[1,2.6],'#FFFFFF',.45);},
      ground:function(r,W,HZ,H){return dotsR(r,30,0,W,HZ+6,H,[.8,1.6],'#B89A64',.5);},
      crowd:{g:'#3E9AD4',path:'',feat:'reef',deco:['weed','coral','shell','starfish'],card:['#6CC6F0','#2A86C8']}},
    dino:{name:'공룡 섬',genre:'영화',ch:'dino',pal:[['#FFC48A','#FFE9C9','#9BCB5C'],['#9EE6E0','#F3FFE0','#8BC456'],['#FFB2A0','#FFE4C8','#A3C95A']],
      horizon:function(r,i){return i===0?'volcano':r()<.65?'palm':'rock';},air:function(r,i){return i===0?'sun':'cloud';},mid:['rock'],small:['egg','fern','fern','egg'],
      ground:function(r,W,HZ){var o='<path d="M0 '+HZ+'L40 '+(HZ-26)+'L90 '+(HZ-8)+'L150 '+(HZ-34)+'L220 '+(HZ-6)+'L290 '+(HZ-30)+'L350 '+(HZ-10)+'L'+W+' '+(HZ-24)+'V'+HZ+'Z" fill="#6E9A4A" fill-opacity=".45" stroke="none"/>';return o;},
      crowd:{g:'#9BCB5C',path:'#C9A46A',feat:'lake',deco:['palm','fern','egg','rock'],card:['#FFE9C9','#FFC48A']}},
    snow:{name:'겨울 동화 마을',genre:'영화',ch:'snow',pal:[['#A9D2F5','#EAF4FB','#F4F9FD'],['#C8B8F0','#F2EEFB','#F7FAFE'],['#9EC3E8','#E2EEF8','#F2F7FC']],
      horizon:function(r){var x=r();return x<.45?'pine':x<.8?'cabin':'igloo';},air:function(r,i){return i===0?'sun':r()<.5?'cloud':'flake';},mid:['sled'],small:['gift','gift','flake','sled'],
      sky:function(r,W,HZ){return dotsR(r,40,0,W,0,HZ,[1,2.2],'#FFFFFF',.95);},
      ground:function(r,W,HZ,H){return dotsR(r,24,0,W,HZ+6,H,[1.5,3],'#BFD9EE',.5);},
      crowd:{g:'#F2F8FD',path:'#DCE9F5',feat:'rink',deco:['pine','gift','flake'],card:['#EAF4FB','#A9D2F5']}}
  };
  var THEME_KEYS=['block','anime','space','sea','dino','snow'];
  function themeOf(th){return THEMES[th]?th:'block';}
  function randProp(r,t,s,L,cat){var P=PROP[t],p={t:t,s:s*(P.sc||1),L:L,cat:cat};for(var k in P.keys)p[k]=ix(r,P.keys[k]);return p;}

  // ---------- 틀린 그림 ----------
  function genDiff(seed,lv,th){
    th=themeOf(th);
    var T=THEMES[th],ck=T.ch,L=LEVELS[lv],r=rng(seed),easy=lv==='easy',W=L.w,H=L.h,HZ=170,items=[],boxes=[],F=easy?1.2:.93;
    function place(make,xa,xb,ya,yb,tries){
      for(var t=0;t<(tries||40);t++){
        var it=make(),x=xa+r()*(xb-xa),y=ya+r()*(yb-ya);it.x=x;it.y=y;
        var b=itemBox(it);if(b[0]<2||b[0]+b[2]>W-2||b[1]<2||b[1]+b[3]>H-2)continue;
        if(boxes.some(function(o){return overlap(o,b,3);}))continue;
        items.push(it);boxes.push(b);return it;
      }
      return null;
    }
    var pal=pick(r,T.pal),i,t1;
    for(i=0;i<(easy?3:4);i++){t1=T.air(r,i);place(function(){return randProp(r,t1,F,0,'air');},20,W-20,i===0?46:30,i===0?72:110);}
    for(i=0;i<(easy?3:5);i++){t1=T.horizon(r,i);place(function(){return randProp(r,t1,F,1,'big');},20,W-20,HZ-2,HZ+8);}
    var nc=easy?4:9,cs=(easy?1.05:.68)*(CT[ck].ds||1);
    for(i=0;i<nc;i++)place(function(){return {t:'char',s:cs,c:randChar(r,ck),L:2,cat:'char'};},20,W-20,easy?HZ+60:HZ+40,H-6,60);
    if(!easy||r()<.6){t1=pick(r,T.mid);place(function(){return randProp(r,t1,F*.95,2,'big');},25,W-25,HZ+25,H-6);}
    for(i=0;i<(easy?4:9);i++){t1=pick(r,T.small);place(function(){return randProp(r,t1,F,2,'small');},12,W-12,HZ+18,H-4);}
    items.sort(function(a,b){return a.L-b.L||a.y-b.y;});
    items.forEach(function(it,k){it.id=k;});
    // 차이 고르기: 서로 겹치지 않는 물건 n개, 물건마다 바꿀 것 하나(또는 한쪽에서 없애기)
    var A=items,B=clone(items),diffs=[];
    function ids(cat){return shuffle(r,items.filter(function(it){return it.cat===cat;}).map(function(it){return it.id;}));}
    var chars=ids('char'),big=ids('big'),air=ids('air'),small=ids('small'),cand;
    if(easy)cand=chars.slice(0,2).concat(big.slice(0,2),chars.slice(2),big.slice(2),air,small);
    else cand=chars.slice(0,3).concat(shuffle(r,chars.slice(3).concat(big,air,small)));
    var removes=0,smalls=0,maxRemove=easy?1:2;
    for(var q=0;q<cand.length&&diffs.length<L.n;q++){
      var id=cand[q],it=A[id],isChar=it.t==='char',P=isChar?null:PROP[it.t];
      var keys=isChar?(easy?CT[ck].ez:CT[ck].nm):(easy&&P.ez?P.ez:Object.keys(P.keys));
      var canRemove=!(P&&P.keep)&&removes<maxRemove;
      var isSmall=it.cat==='small';if(isSmall&&smalls>=(easy?0:2))continue;
      var bx=itemBox(it);if(diffs.some(function(d){return overlap(d.box,bx,2);}))continue;
      if(!keys.length&&!canRemove)continue;
      var useRemove=canRemove&&(keys.length===0||r()<(easy?.3:.18));
      var d={id:id,box:bx};
      if(useRemove){d.kind='remove';d.side=r()<.5?0:1;}
      else if(isChar){var m=mutate(r,it.c,keys);if(!m)continue;B[id].c=m.c;d.kind=m.k;}
      else{var k=pick(r,keys),opts=P.keys[k],v;if(opts.length<2)continue;do{v=ix(r,opts);}while(v===it[k]);B[id][k]=v;d.kind=k;}
      if(useRemove)removes++;if(isSmall)smalls++;
      diffs.push(d);
    }
    return {mode:'diff',lv:lv,seed:seed,theme:th,w:W,h:H,hz:HZ,sky:pal,items:[A,B],diffs:diffs};
  }
  function diffSvg(sc,side,uid){
    var T=THEMES[sc.theme],W=sc.w,H=sc.h,HZ=sc.hz,g='g'+uid,o='',r=rng((sc.seed^0x9E3779B9)>>>0);
    o+='<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+sc.sky[0]+'"/><stop offset="1" stop-color="'+sc.sky[1]+'"/></linearGradient>'+
      '<pattern id="p'+uid+'" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="3" fill="#FFFFFF" fill-opacity=".14"/></pattern></defs>';
    o+='<rect width="'+W+'" height="'+H+'" fill="url(#'+g+')"/>';
    if(T.sky)o+=T.sky(r,W,HZ,H);
    o+='<rect y="'+HZ+'" width="'+W+'" height="'+(H-HZ)+'" fill="'+sc.sky[2]+'"/><rect y="'+HZ+'" width="'+W+'" height="'+(H-HZ)+'" fill="url(#p'+uid+')"/>';
    o+='<rect y="'+HZ+'" width="'+W+'" height="3" fill="#000" fill-opacity=".08"/>';
    if(T.ground)o+=T.ground(r,W,HZ,H);
    var hidden={};sc.diffs.forEach(function(d){if(d.kind==='remove'&&d.side===side)hidden[d.id]=1;});
    sc.items[side].forEach(function(it){if(!hidden[it.id])o+=itemSvg(it);});
    return o;
  }

  // ---------- 군중 속 찾기 ----------
  function genCrowd(seed,th){
    th=themeOf(th);
    var T=THEMES[th],ck=T.ch,CK=CT[ck],L=LEVELS.hard,r=rng(seed),W=L.w,H=L.h,s=CK.cs||.5;
    // 아무도 안 서는 곳(연못·무대·분화구…)과 길
    var pond={x:ri(r,60,W-260),y:ri(r,120,H-320),w:ri(r,150,210),h:ri(r,110,150)};
    var pathY=ri(r,300,600),pathX=ri(r,150,450);
    var deco=[],DT=T.crowd.deco,i;
    function dp(t,x,y,sz){var p=randProp(r,t,sz,0,'deco');p.x=x;p.y=y;return p;}
    for(i=0;i<7;i++)deco.push(dp(DT[0],ri(r,20,W-20),ri(r,40,H-10),.75));
    for(i=0;i<10;i++)deco.push(dp(DT[1+i%(DT.length-1)],ri(r,10,W-10),ri(r,20,H-5),.8));
    var spots=[],cols=13,rows=21,dx=W/cols,dy=(H-60)/rows;
    for(var rr=0;rr<rows;rr++)for(var cc=0;cc<cols;cc++){
      var x=dx*(cc+.5)+(r()*2-1)*12+(rr%2?dx*.25:0),y=60+dy*(rr+.85)+(r()*2-1)*8;
      if(x<14||x>W-14)continue;
      if(x>pond.x-14&&x<pond.x+pond.w+14&&y>pond.y-6&&y<pond.y+pond.h+40)continue;
      spots.push([x,y]);
    }
    shuffle(r,spots);
    // 똑같은 친구 3명은 바로 앞에 아무도 안 가리는 자리에 세운다(가려져 있으면 눌러도 앞사람이 눌린다)
    var bb=CK.box({}),bw=bb[2]*s,bh=bb[3]*s;
    function clear(i){var a=spots[i];return spots.every(function(b,j){return j===i||!(Math.abs(b[0]-a[0])<bw+2&&b[1]>a[1]&&b[1]-a[1]<bh+2);});}
    for(var z=0,got=0;z<spots.length&&got<3;z++)if(clear(z)){var tmp=spots[got];spots[got]=spots[z];spots[z]=tmp;got++;}
    var target=randChar(r,ck);
    // 보기는 무언가 쓰고 있어야 더 재미있다
    if(CK.fix)CK.fix(r,target);
    var tsig=sig(target),people=[],copies=[];
    var nDecoy=40;
    spots.forEach(function(p,k){
      var c,role;
      if(k<3){c=clone(target);role='copy';}
      else if(k<3+nDecoy){var m=mutate(r,target,CK.keys);c=m?m.c:randChar(r,ck);role='decoy';}
      else{
        c=randChar(r,ck);
        // 헷갈리게: 셋 중 하나는 보기와 같은 옷(첫 묶음), 그중 절반은 둘째 묶음까지 맞춘다
        if(r()<.35){CK.confuse[0].forEach(function(q){c[q]=target[q];});if(r()<.5)CK.confuse[1].forEach(function(q){c[q]=target[q];});}
        role='other';
      }
      if(role!=='copy'&&sig(c)===tsig)c=mutate(r,target,CK.keys).c;
      people.push({t:'char',c:c,x:p[0],y:p[1],s:s,role:role});
    });
    people.sort(function(a,b){return a.y-b.y;});
    people.forEach(function(p,k){p.id=k;if(p.role==='copy')copies.push(k);});
    return {mode:'crowd',lv:'hard',seed:seed,theme:th,w:W,h:H,pond:pond,pathX:pathX,pathY:pathY,deco:deco,target:target,people:people,copies:copies};
  }
  function featSvg(kind,p){
    var x=p.x,y=p.y,w=p.w,h=p.h;
    if(kind==='stage')return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="#C98E5D" stroke="#8B5A2B" stroke-width="4"/>'+[1,2,3].map(function(k){return '<path d="M'+(x+6)+' '+(y+h*k/4)+'H'+(x+w-6)+'" stroke="#8B5A2B" stroke-opacity=".5" stroke-width="2"/>';}).join('')+
      '<path d="M'+(x+8)+' '+(y+8)+'Q'+(x+w/2)+' '+(y+30)+' '+(x+w-8)+' '+(y+8)+'" fill="none" stroke="#F49AC1" stroke-width="3"/>';
    if(kind==='crater')return '<ellipse cx="'+(x+w/2)+'" cy="'+(y+h/2)+'" rx="'+(w/2)+'" ry="'+(h/2)+'" fill="#7C8290" stroke="#5F6470" stroke-width="5"/><ellipse cx="'+(x+w/2+8)+'" cy="'+(y+h/2+6)+'" rx="'+(w/3)+'" ry="'+(h/3.4)+'" fill="#6A6F7C"/>';
    if(kind==='reef')return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="40" fill="#E9D7A8" stroke="#CDB57E" stroke-width="4"/>'+
      propSvg({t:'coral',x:x+w*.3,y:y+h*.7,s:1.4,col:0})+propSvg({t:'coral',x:x+w*.65,y:y+h*.55,s:1.2,col:2})+propSvg({t:'shell',x:x+w*.5,y:y+h*.85,s:1.3,col:1});
    if(kind==='rink')return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="40" fill="#BFE6FF" stroke="#8CC8EA" stroke-width="4"/><path d="M'+(x+30)+' '+(y+40)+'l40 -10M'+(x+w-90)+' '+(y+h-40)+'l50 -12" stroke="#fff" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>';
    var c=kind==='lake'?['#4FA8C8','#367F9C']:['#5BB8E8','#3E8EB8'];
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="40" fill="'+c[0]+'" stroke="'+c[1]+'" stroke-width="4"/><path d="M'+(x+30)+' '+(y+40)+'h40M'+(x+w-90)+' '+(y+h-40)+'h50" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>';
  }
  function crowdSvg(sc){
    var T=THEMES[sc.theme],K=T.crowd,W=sc.w,H=sc.h,o='';
    o+='<defs><pattern id="cg" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3.4" fill="#FFFFFF" fill-opacity=".14"/></pattern></defs>';
    o+='<rect width="'+W+'" height="'+H+'" fill="'+K.g+'"/><rect width="'+W+'" height="'+H+'" fill="url(#cg)"/>';
    if(K.path)o+='<rect x="0" y="'+(sc.pathY-22)+'" width="'+W+'" height="44" fill="'+K.path+'"/><rect x="'+(sc.pathX-22)+'" y="0" width="44" height="'+H+'" fill="'+K.path+'"/>';
    o+=featSvg(K.feat,sc.pond);
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
  // 장르 고르기 화면용 미리 보기: 장르 캐릭터 하나
  function sample(th,seed){th=themeOf(th);var r=rng(seed||7),c=randChar(r,THEMES[th].ch);if(CT[c.k].fix)CT[c.k].fix(r,c);return {svg:charSvg(c,0,0,1),view:charView(c)};}
  var THEME_INFO={};THEME_KEYS.forEach(function(k){var t=THEMES[k];THEME_INFO[k]={name:t.name,genre:t.genre,card:t.crowd.card};});

  return {VERSION:VERSION,LEVELS:LEVELS,THEMES:THEME_INFO,THEME_KEYS:THEME_KEYS,rng:rng,sig:sig,randChar:randChar,charSvg:charSvg,charView:charView,sample:sample,
    genDiff:genDiff,diffSvg:diffSvg,genCrowd:genCrowd,crowdSvg:crowdSvg,personAt:personAt,personBox:personBox,itemBox:itemBox};
}
