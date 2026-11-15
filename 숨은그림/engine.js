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

  // ---------- 캐릭터 종류 더: 로봇·슬라임·동물 친구·꼬마 마법사·유령·해적 ----------
  var GRY='#6B7480';
  CT.robot={
    opt:{body:['#9AA5B1','#E84A4A','#3E8EDE','#F7C531','#4DBA5A','#F5F5F5'],head:['box','round','tv'],eye:['dots','visor','one','heart'],eyeC:['#3BE0FF','#FF4D6D','#7CFF6B','#FFD54A'],
      ant:['none','ball','bolt','dish'],chest:['none','screen','heart','bolt'],arm:['claw','hand'],leg:['legs','wheel'],pose:['down','wave']},
    keys:['body','head','eye','eyeC','ant','chest','arm','leg','pose'],
    ez:['body','head','eye','ant','leg','pose'],nm:['body','head','eye','eyeC','ant','chest','arm','leg','pose'],
    confuse:[['body'],['head','ant']],
    vis:function(){return true;},
    rand:function(r,c){if(r()<.3)c.ant=0;if(r()<.35)c.chest=0;},
    box:function(){return [-22,-76,44,76];},
    draw:function(c){
      var O=this.opt,bc=O.body[c.body],hd=O.head[c.head],ey=O.eye[c.eye],ec=O.eyeC[c.eyeC],an=O.ant[c.ant],ch=O.chest[c.chest],claw=O.arm[c.arm]==='claw',wheel=O.leg[c.leg]==='wheel',wave=O.pose[c.pose]==='wave',o='';
      if(an==='ball')o+=ln('M0 -62V-69',GRY,2)+'<circle cx="0" cy="-71" r="3" fill="#E84A4A"/>';
      else if(an==='bolt')o+='<path d="M1 -62L-3 -68H1L-1 -75L5 -67H1Z" fill="#F7C531"/>';
      else if(an==='dish')o+=ln('M0 -62V-67',GRY,2)+'<path d="M-7 -72Q0 -64 7 -72Z" fill="#D5DCE3"/>';
      if(wheel)o+='<rect x="-3" y="-17" width="6" height="5" fill="'+GRY+'"/><circle cx="0" cy="-7" r="7" fill="#333C46"/><circle cx="0" cy="-7" r="2.5" fill="#9AA5B1"/>';
      else o+='<rect x="-9" y="-17" width="6" height="14" fill="'+GRY+'"/><rect x="3" y="-17" width="6" height="14" fill="'+GRY+'"/><rect x="-11" y="-4" width="9" height="4" rx="1.5" fill="#333C46"/><rect x="2" y="-4" width="9" height="4" rx="1.5" fill="#333C46"/>';
      function hand(x,y){return claw?ln('M'+(x-2.5)+' '+y+'v4M'+(x+2.5)+' '+y+'v4',GRY,2):'<circle cx="'+x+'" cy="'+(y+2)+'" r="3" fill="'+GRY+'"/>';}
      o+='<rect x="-18" y="-38" width="5" height="16" rx="2" fill="'+GRY+'"/>'+hand(-15.5,-22);
      if(wave)o+='<rect x="13" y="-56" width="5" height="17" rx="2" fill="'+GRY+'"/><circle cx="15.5" cy="-58" r="3.2" fill="'+GRY+'"/>';
      else o+='<rect x="13" y="-38" width="5" height="16" rx="2" fill="'+GRY+'"/>'+hand(15.5,-22);
      o+='<rect x="-13" y="-40" width="26" height="24" rx="3" fill="'+bc+'"/><rect x="-13" y="-21" width="26" height="2.5" fill="#000" fill-opacity=".15" stroke="none"/>';
      if(ch==='screen')o+='<rect x="-7" y="-37" width="14" height="9" rx="1.5" fill="#22303A"/>'+ln('M-5 -32.5h2l1.5 -3l2 6l1.5 -3h3',ec,1.2);
      else if(ch==='heart')o+='<path d="M0 -26C-7 -31 -6 -37 -2.5 -37C-1 -37 0 -36 0 -35C0 -36 1 -37 2.5 -37C6 -37 7 -31 0 -26Z" fill="'+ec+'"/>';
      else if(ch==='bolt')o+='<path d="M2 -38L-4 -30H0L-2 -24L5 -32H1Z" fill="#F7C531"/>';
      o+='<rect x="-3" y="-43" width="6" height="4" fill="'+GRY+'"/>';
      var tv=hd==='tv';
      if(tv)o+='<rect x="-15" y="-63" width="30" height="21" rx="4" fill="'+bc+'"/><rect x="-11" y="-60" width="22" height="15" rx="3" fill="#22303A"/>';
      else o+='<rect x="-12" y="-62" width="24" height="20" rx="'+(hd==='round'?10:3)+'" fill="'+bc+'"/>';
      if(ey==='dots')o+='<circle cx="-5" cy="-54" r="3" fill="'+ec+'" stroke="#22303A" stroke-opacity="1"/><circle cx="5" cy="-54" r="3" fill="'+ec+'" stroke="#22303A" stroke-opacity="1"/>';
      else if(ey==='visor')o+='<rect x="-9" y="-57" width="18" height="6" rx="3" fill="#22303A"/><rect x="-7" y="-55" width="14" height="2" rx="1" fill="'+ec+'" stroke="none"/>';
      else if(ey==='one')o+='<circle cx="0" cy="-54" r="4.6" fill="'+ec+'" stroke="#22303A" stroke-opacity="1"/><circle cx="0" cy="-54" r="1.8" fill="#22303A" stroke="none"/>';
      else [-5,5].forEach(function(x){o+='<path d="M'+x+' -51C'+(x-4)+' -54 '+(x-3.5)+' -57.5 '+(x-1.5)+' -57.5C'+(x-.6)+' -57.5 '+x+' -57 '+x+' -56.4C'+x+' -57 '+(x+.6)+' -57.5 '+(x+1.5)+' -57.5C'+(x+3.5)+' -57.5 '+(x+4)+' -54 '+x+' -51Z" fill="'+ec+'" stroke="none"/>';});
      o+='<rect x="-5" y="-48.5" width="10" height="2.6" rx="1" fill="'+(tv?ec:'#22303A')+'" stroke="none"/>';
      return o;
    }
  };
  CT.slime={
    opt:{col:['#5AC8FA','#7BD36A','#F07AB0','#F7C531','#B07AE0','#F29B30'],shape:['drop','round','wide'],eye:['dots','big','sleepy','angry'],mouth:['smile','open','tongue','cat'],
      hat:['none','crown','helmet','wizard','leaf'],hatC:['#E84A4A','#3E8EDE','#9AA5B1','#4B3B8F','#F7C531'],cheek:['none','blush']},
    keys:['col','shape','eye','mouth','hat','hatC','cheek'],
    ez:['col','shape','eye','hat'],nm:['col','shape','eye','mouth','hat','hatC','cheek'],
    confuse:[['col'],['shape']],ds:1.1,cs:.6,
    vis:function(c,k){if(k==='hatC')return ['helmet','wizard'].indexOf(this.opt.hat[c.hat])>=0;return true;},
    rand:function(r,c){if(r()<.4)c.hat=0;},
    box:function(){return [-23,-56,46,56];},
    draw:function(c){
      var O=this.opt,cl=O.col[c.col],sh=O.shape[c.shape],ey=O.eye[c.eye],mo=O.mouth[c.mouth],ht=O.hat[c.hat],hc=O.hatC[c.hatC],o='';
      var P={drop:'M-18 0Q-21 -16 -8 -27Q-1 -33 0 -40Q2 -32 9 -26Q21 -15 18 0Z',round:'M-17 0Q-19 -31 0 -31Q19 -31 17 0Z',wide:'M-22 0Q-23 -26 0 -26Q23 -26 22 0Z'};
      var top=sh==='drop'?-40:sh==='round'?-31:-26;
      o+='<ellipse cx="0" cy="0" rx="17" ry="2.5" fill="#000" fill-opacity=".15" stroke="none"/><path d="'+P[sh]+'" fill="'+cl+'"/><ellipse cx="-9" cy="-18" rx="3" ry="4.5" fill="#fff" fill-opacity=".6" stroke="none" transform="rotate(25 -9 -18)"/>';
      if(ey==='dots')o+='<circle cx="-6" cy="-13" r="2.3" fill="'+D+'" stroke="none"/><circle cx="6" cy="-13" r="2.3" fill="'+D+'" stroke="none"/>';
      else if(ey==='big')[-6,6].forEach(function(x){o+='<circle cx="'+x+'" cy="-13" r="4" fill="#fff"/><circle cx="'+x+'" cy="-12.5" r="2.2" fill="#1E1E2A" stroke="none"/><circle cx="'+(x-1)+'" cy="-14" r=".8" fill="#fff" stroke="none"/>';});
      else if(ey==='sleepy')o+=ln('M-8.5 -13Q-6 -10.5 -3.5 -13M3.5 -13Q6 -10.5 8.5 -13',D,1.6);
      else o+='<circle cx="-6" cy="-12.5" r="2.2" fill="'+D+'" stroke="none"/><circle cx="6" cy="-12.5" r="2.2" fill="'+D+'" stroke="none"/>'+ln('M-9.5 -18L-3.5 -16M9.5 -18L3.5 -16',D,1.6);
      if(O.cheek[c.cheek]==='blush')o+='<ellipse cx="-11" cy="-8" rx="2.6" ry="1.5" fill="#FF6A8A" fill-opacity=".5" stroke="none"/><ellipse cx="11" cy="-8" rx="2.6" ry="1.5" fill="#FF6A8A" fill-opacity=".5" stroke="none"/>';
      if(mo==='smile')o+=ln('M-3 -7.5Q0 -4.5 3 -7.5');
      else if(mo==='open')o+='<path d="M-3.2 -8Q0 -2.5 3.2 -8Z" fill="#C2414B" stroke="'+D+'" stroke-opacity=".9"/>';
      else if(mo==='tongue')o+=ln('M-3 -7.5Q0 -4.5 3 -7.5')+'<ellipse cx="1.4" cy="-4.6" rx="1.8" ry="2.2" fill="#FF7A9A" stroke="none"/>';
      else o+=ln('M-4 -7.5q2 2 4 0q2 2 4 0',D,1.2);
      var hy=sh==='drop'?-34:top+2;
      if(ht==='crown')o+='<path d="M-8 '+hy+'v-8l4 3.5l4 -6l4 6l4 -3.5v8Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
      else if(ht==='helmet')o+='<path d="M-12 '+(hy+3)+'Q-12 '+(hy-11)+' 0 '+(hy-11)+'Q12 '+(hy-11)+' 12 '+(hy+3)+'Z" fill="'+hc+'"/><rect x="-1.5" y="'+(hy-16)+'" width="3" height="6" fill="#E84A4A"/>';
      else if(ht==='wizard')o+='<path d="M-12 '+(hy+1)+'H12L2 '+(hy-20)+'Z" fill="'+hc+'"/><path d="'+starD(1,hy-6,3.2)+'" fill="#F7C531" stroke="none"/>';
      else if(ht==='leaf')o+=ln('M0 '+hy+'V'+(hy-5),'#3E871C',1.6)+'<path d="M0 '+(hy-5)+'Q6 '+(hy-12)+' 11 '+(hy-7)+'Q5 '+(hy-2)+' 0 '+(hy-5)+'Z" fill="#6CBF3A"/>';
      return o;
    }
  };
  CT.animal={
    opt:{kind:['cat','dog','bear','rabbit','panda','fox'],fur:['#F2C59A','#8A5A3B','#F5F5F5','#9AA5B1','#F29B30','#5A4A42'],shirt:['#E84A4A','#3E8EDE','#4DBA5A','#F7C531','#9B6BDF','#F07AB0'],
      pat:['plain','stripe','dots'],acc:['none','bow','scarf','glasses','flower'],accC:['#E84A4A','#3E8EDE','#F7C531','#F07AB0','#4DBA5A'],mouth:['smile','open','tongue'],pose:['down','wave']},
    keys:['kind','fur','shirt','pat','acc','accC','mouth','pose'],
    ez:['kind','fur','shirt','acc','pose'],nm:['kind','fur','shirt','pat','acc','accC','mouth','pose'],
    confuse:[['shirt'],['kind']],
    vis:function(c,k){var O=this.opt;if(k==='fur')return O.kind[c.kind]!=='panda';if(k==='accC')return ['bow','scarf','flower'].indexOf(O.acc[c.acc])>=0;return true;},
    rand:function(r,c){if(r()<.35)c.acc=0;if(r()<.4)c.pat=0;},
    box:function(){return [-24,-88,48,88];},
    draw:function(c){
      var O=this.opt,kd=O.kind[c.kind],panda=kd==='panda',fc=panda?'#FFFFFF':O.fur[c.fur],dk=panda?'#2A2A2A':fc,sh=O.shirt[c.shirt],pt=O.pat[c.pat],ac=O.acc[c.acc],a2=O.accC[c.accC],mo=O.mouth[c.mouth],wave=O.pose[c.pose]==='wave',o='';
      o+='<rect x="-9" y="-15" width="7" height="15" rx="2.5" fill="'+dk+'"/><rect x="2" y="-15" width="7" height="15" rx="2.5" fill="'+dk+'"/>';
      o+='<rect x="-16" y="-35" width="5" height="16" rx="2.5" fill="'+sh+'"/><circle cx="-13.5" cy="-18" r="3" fill="'+dk+'"/>';
      if(!wave)o+='<rect x="11" y="-35" width="5" height="16" rx="2.5" fill="'+sh+'"/><circle cx="13.5" cy="-18" r="3" fill="'+dk+'"/>';
      o+='<rect x="-11" y="-37" width="22" height="24" rx="4" fill="'+sh+'"/>';
      if(pt==='stripe')o+='<rect x="-11" y="-30" width="22" height="4" fill="#fff" fill-opacity=".8" stroke="none"/><rect x="-11" y="-22" width="22" height="4" fill="#fff" fill-opacity=".8" stroke="none"/>';
      else if(pt==='dots')o+='<g fill="#fff" fill-opacity=".85" stroke="none"><circle cx="-5" cy="-30" r="1.8"/><circle cx="5" cy="-27" r="1.8"/><circle cx="-3" cy="-20" r="1.8"/><circle cx="6" cy="-18" r="1.8"/></g>';
      if(ac==='scarf')o+='<rect x="-11" y="-39" width="22" height="5" rx="2.5" fill="'+a2+'"/><rect x="4" y="-36" width="5" height="10" rx="1.5" fill="'+a2+'"/>';
      if(kd==='cat')o+='<path d="M-13 -59L-12 -71L-4 -64ZM13 -59L12 -71L4 -64Z" fill="'+fc+'"/><path d="M-11 -62L-10.5 -68L-6.5 -64.5ZM11 -62L10.5 -68L6.5 -64.5Z" fill="#FFB3C7" stroke="none"/>';
      else if(kd==='fox')o+='<path d="M-14 -58L-13 -75L-3 -64ZM14 -58L13 -75L3 -64Z" fill="'+fc+'"/><path d="M-12 -62L-12 -71L-6 -65ZM12 -62L12 -71L6 -65Z" fill="#fff" stroke="none"/>';
      else if(kd==='bear'||panda)o+='<circle cx="-11" cy="-63" r="5.5" fill="'+dk+'"/><circle cx="11" cy="-63" r="5.5" fill="'+dk+'"/>'+(panda?'':'<circle cx="-11" cy="-63" r="2.6" fill="#FFB3C7" stroke="none"/><circle cx="11" cy="-63" r="2.6" fill="#FFB3C7" stroke="none"/>');
      else if(kd==='rabbit')o+='<ellipse cx="-6" cy="-74" rx="4.2" ry="12.5" fill="'+fc+'"/><ellipse cx="6" cy="-74" rx="4.2" ry="12.5" fill="'+fc+'"/><ellipse cx="-6" cy="-74" rx="2" ry="8.5" fill="#FFB3C7" stroke="none"/><ellipse cx="6" cy="-74" rx="2" ry="8.5" fill="#FFB3C7" stroke="none"/>';
      o+='<circle cx="0" cy="-52" r="15" fill="'+fc+'"/>';
      if(kd==='dog')o+='<ellipse cx="-14" cy="-53" rx="4.5" ry="9" fill="'+fc+'" transform="rotate(15 -14 -53)"/><ellipse cx="-14" cy="-53" rx="4.5" ry="9" fill="#000" fill-opacity=".2" transform="rotate(15 -14 -53)"/><ellipse cx="14" cy="-53" rx="4.5" ry="9" fill="'+fc+'" transform="rotate(-15 14 -53)"/><ellipse cx="14" cy="-53" rx="4.5" ry="9" fill="#000" fill-opacity=".2" transform="rotate(-15 14 -53)"/>';
      if(panda)o+='<ellipse cx="-6" cy="-53" rx="3.6" ry="4.6" fill="#2A2A2A" stroke="none" transform="rotate(20 -6 -53)"/><ellipse cx="6" cy="-53" rx="3.6" ry="4.6" fill="#2A2A2A" stroke="none" transform="rotate(-20 6 -53)"/>';
      if(kd==='fox')o+='<path d="M-15 -50Q-8 -40 0 -44Q8 -40 15 -50Q8 -46 0 -48Q-8 -46 -15 -50Z" fill="#fff" stroke="none"/>';
      o+='<ellipse cx="0" cy="-46" rx="6" ry="4.5" fill="#fff" fill-opacity=".55" stroke="none"/>';
      if(panda)o+='<circle cx="-6" cy="-53.5" r="1.5" fill="#fff" stroke="none"/><circle cx="6" cy="-53.5" r="1.5" fill="#fff" stroke="none"/>';
      else o+='<circle cx="-6" cy="-54" r="2" fill="'+D+'" stroke="none"/><circle cx="6" cy="-54" r="2" fill="'+D+'" stroke="none"/>';
      o+='<path d="M-2.2 -49H2.2L0 -46.8Z" fill="'+D+'" stroke="none"/>';
      if(mo==='smile')o+=ln('M-3 -44.5Q-1.5 -43 0 -45M0 -45Q1.5 -43 3 -44.5',D,1.1);
      else if(mo==='open')o+='<ellipse cx="0" cy="-43.5" rx="2.2" ry="2.2" fill="#C2414B" stroke="none"/>';
      else o+=ln('M-3 -44.5Q-1.5 -43 0 -45M0 -45Q1.5 -43 3 -44.5',D,1.1)+'<rect x="-1.3" y="-44.6" width="2.6" height="3" rx="1.3" fill="#FF7A9A" stroke="none"/>';
      if(ac==='bow')o+='<path d="M9 -64l-6 -4v8ZM9 -64l6 -4v8Z" fill="'+a2+'"/><circle cx="9" cy="-64" r="1.8" fill="'+a2+'"/>';
      else if(ac==='glasses')o+='<circle cx="-6" cy="-54" r="4.3" fill="none" stroke="#333" stroke-opacity="1" stroke-width="1.3"/><circle cx="6" cy="-54" r="4.3" fill="none" stroke="#333" stroke-opacity="1" stroke-width="1.3"/>'+ln('M-1.7 -54H1.7','#333',1.3);
      else if(ac==='flower')o+='<g fill="'+a2+'"><circle cx="-11" cy="-67" r="2.6"/><circle cx="-7" cy="-65" r="2.6"/><circle cx="-11" cy="-62" r="2.6"/><circle cx="-15" cy="-65" r="2.6"/></g><circle cx="-11" cy="-65" r="1.6" fill="#F7C531" stroke="none"/>';
      if(wave)o+='<rect x="15" y="-52" width="5" height="17" rx="2.5" fill="'+sh+'"/><circle cx="17.5" cy="-54" r="3" fill="'+dk+'"/>';
      return o;
    }
  };
  CT.wizard={
    opt:{skin:['#FFE3CC','#F6C9A2','#C98C62'],robe:['#4B3B8F','#2C3E66','#8E2F4F','#2E7D46','#333C46'],hat:['pointy','bent','wide'],hatC:['#4B3B8F','#2C3E66','#8E2F4F','#2E7D46','#333C46','#E84A4A'],
      deco:['none','star','moon'],hair:['short','long','twin'],hairC:['#2B2B38','#7A4A2A','#F2C94C','#E58A2C','#DADFE8','#F48FB8'],wand:['none','stick','star','orb'],wandC:['#F7C531','#5AC8FA','#F07AB0','#7BD36A'],
      scarf:['none','scarf'],scarfC:['#E84A4A','#F7C531','#3E8EDE','#4DBA5A'],glass:['none','round'],pose:['down','wave']},
    keys:['skin','robe','hat','hatC','deco','hair','hairC','wand','wandC','scarf','scarfC','glass','pose'],
    ez:['robe','hat','hatC','deco','hair','wand','scarf'],nm:['robe','hat','hatC','deco','hair','hairC','wand','wandC','scarf','scarfC','glass','pose'],
    confuse:[['robe'],['hat','hatC']],cs:.45,
    vis:function(c,k){var O=this.opt;if(k==='wandC')return ['star','orb'].indexOf(O.wand[c.wand])>=0;if(k==='scarfC')return c.scarf!==0;return true;},
    rand:function(r,c){if(r()<.25)c.wand=0;if(r()<.5)c.scarf=0;if(r()<.7)c.glass=0;if(r()<.35)c.deco=0;},
    box:function(){return [-26,-93,52,93];},
    draw:function(c){
      var O=this.opt,sk=O.skin[c.skin],rb=O.robe[c.robe],ht=O.hat[c.hat],hc=O.hatC[c.hatC],dc=O.deco[c.deco],hs=O.hair[c.hair],hrc=O.hairC[c.hairC],wd=O.wand[c.wand],wc=O.wandC[c.wandC],sc=O.scarfC[c.scarfC],wave=O.pose[c.pose]==='wave',o='';
      if(hs==='long')o+='<path d="M-15 -52Q-16 -66 0 -66Q16 -66 15 -52L16 -32Q0 -28 -16 -32Z" fill="'+hrc+'"/>';
      else if(hs==='twin')o+='<ellipse cx="-17" cy="-42" rx="4.5" ry="10" fill="'+hrc+'"/><ellipse cx="17" cy="-42" rx="4.5" ry="10" fill="'+hrc+'"/>';
      o+='<rect x="-8" y="-4" width="7" height="4" rx="1.5" fill="#3A2E2A"/><rect x="1" y="-4" width="7" height="4" rx="1.5" fill="#3A2E2A"/>';
      o+='<path d="M-10 -37L10 -37L15 -3L-15 -3Z" fill="'+rb+'"/>'+ln('M-15 -3H15','#F7C531',1.6)+ln('M0 -34V-4','#000',.8).replace('stroke-opacity="1"','stroke-opacity=".25"');
      if(c.scarf)o+='<rect x="-9" y="-39" width="18" height="4.5" rx="2" fill="'+sc+'"/><rect x="3" y="-36" width="4.5" height="11" rx="1.5" fill="'+sc+'"/><rect x="3" y="-30" width="4.5" height="2" fill="#fff" fill-opacity=".8" stroke="none"/>';
      o+='<path d="M-10 -36L-17 -22L-12 -20L-8 -30Z" fill="'+rb+'"/><circle cx="-14.5" cy="-20" r="2.8" fill="'+sk+'"/>';
      var hx=wave?16:14.5,hy=wave?-52:-20,tx=wave?21:22,ty=wave?-66:-34;
      if(wave)o+='<path d="M10 -36L18 -50L14 -52L8 -42Z" fill="'+rb+'"/>';else o+='<path d="M10 -36L17 -22L12 -20L8 -30Z" fill="'+rb+'"/>';
      if(wd!=='none'){o+=ln('M'+hx+' '+hy+'L'+tx+' '+ty,'#8B5A2B',1.8);
        if(wd==='star')o+='<path d="'+starD(tx,ty-1,4.5)+'" fill="'+wc+'"/>';else if(wd==='orb')o+='<circle cx="'+tx+'" cy="'+(ty-1)+'" r="5" fill="'+wc+'" fill-opacity=".35" stroke="none"/><circle cx="'+tx+'" cy="'+(ty-1)+'" r="3" fill="'+wc+'"/>';}
      o+='<circle cx="'+hx+'" cy="'+hy+'" r="2.8" fill="'+sk+'"/>';
      o+='<circle cx="0" cy="-50" r="14" fill="'+sk+'"/>';
      [-5,5].forEach(function(x){o+='<ellipse cx="'+x+'" cy="-48" rx="2.2" ry="3" fill="#1E1E2A" stroke="none"/><circle cx="'+(x-.7)+'" cy="-49.2" r=".9" fill="#fff" stroke="none"/>';});
      o+='<ellipse cx="-9" cy="-43.5" rx="2.2" ry="1.2" fill="#FF7A9A" fill-opacity=".45" stroke="none"/><ellipse cx="9" cy="-43.5" rx="2.2" ry="1.2" fill="#FF7A9A" fill-opacity=".45" stroke="none"/>'+ln('M-2.5 -42Q0 -40 2.5 -42',D,1.2);
      if(O.glass[c.glass]==='round')o+='<circle cx="-5" cy="-48" r="4.3" fill="none" stroke="#333" stroke-opacity="1" stroke-width="1.2"/><circle cx="5" cy="-48" r="4.3" fill="none" stroke="#333" stroke-opacity="1" stroke-width="1.2"/>';
      o+='<path d="M-14.5 -50Q-15 -63 0 -63Q15 -63 14.5 -50Q10 -56 4 -56Q0 -52 -4 -56Q-10 -56 -14.5 -50Z" fill="'+hrc+'"/>';
      if(ht==='pointy')o+='<path d="M-11 -60L1 -92L11 -60Z" fill="'+hc+'"/><ellipse cx="0" cy="-60" rx="18" ry="4" fill="'+hc+'"/>';
      else if(ht==='bent')o+='<path d="M-11 -60Q-6 -78 6 -88L20 -84L8 -79Q10 -70 11 -60Z" fill="'+hc+'"/><ellipse cx="0" cy="-60" rx="18" ry="4" fill="'+hc+'"/>';
      else o+='<path d="M-9 -61L0 -82L9 -61Z" fill="'+hc+'"/><ellipse cx="0" cy="-60" rx="23" ry="5" fill="'+hc+'"/>';
      o+='<rect x="-10" y="-65" width="20" height="2.6" fill="#F7C531" fill-opacity=".9" stroke="none"/>';
      if(dc==='star')o+='<path d="'+starD(0,-71,4)+'" fill="#F7C531" stroke="none"/>';
      else if(dc==='moon')o+='<circle cx="0" cy="-71" r="4" fill="#F7E6A8" stroke="none"/><circle cx="2" cy="-72.2" r="3.4" fill="'+hc+'" stroke="none"/>';
      return o;
    }
  };
  CT.ghost={
    opt:{col:['#FFFFFF','#CFE3FF','#FFD0E6','#D2F5D0','#FFF0B0','#E2D2FF'],shape:['round','tall'],eye:['dots','big','angry','sleepy'],mouth:['o','smile','tongue','fang'],
      hat:['none','witch','pumpkin','bow','crown'],hatC:['#4B3B8F','#222831','#E84A4A','#F29B30'],arm:['down','up'],hold:['none','candy','lantern','balloon'],holdC:['#E84A4A','#F7C531','#9B6BDF','#4DBA5A']},
    keys:['col','shape','eye','mouth','hat','hatC','arm','hold','holdC'],
    ez:['col','shape','hat','arm','hold'],nm:['col','shape','eye','mouth','hat','hatC','arm','hold','holdC'],
    confuse:[['col'],['hat','hatC']],
    vis:function(c,k){var O=this.opt;if(k==='hatC')return ['witch','bow'].indexOf(O.hat[c.hat])>=0;if(k==='holdC')return ['candy','balloon'].indexOf(O.hold[c.hold])>=0;return true;},
    rand:function(r,c){if(r()<.3)c.hat=0;if(r()<.4)c.hold=0;},
    box:function(){return [-24,-84,52,84];},
    draw:function(c){
      var O=this.opt,cl=O.col[c.col],t=O.shape[c.shape]==='tall'?-60:-52,ey=O.eye[c.eye],mo=O.mouth[c.mouth],ht=O.hat[c.hat],hc=O.hatC[c.hatC],up=O.arm[c.arm]==='up',hd=O.hold[c.hold],hl=O.holdC[c.holdC],o='';
      var hx=up?19:18,hy=up?-40:-22;
      o+='<ellipse cx="0" cy="0" rx="10" ry="2" fill="#000" fill-opacity=".18" stroke="none"/>';
      if(hd==='balloon')o+=ln('M'+hx+' '+hy+'L21 '+(t-6),'#555',.9)+'<ellipse cx="21" cy="'+(t-13)+'" rx="6" ry="7.5" fill="'+hl+'"/>';
      o+='<path d="M-16 -6V'+(t+18)+'Q-16 '+t+' 0 '+t+'Q16 '+t+' 16 '+(t+18)+'V-6L11 -10L5.5 -5L0 -10L-5.5 -5L-11 -10Z" fill="'+cl+'"/>';
      if(up)o+='<ellipse cx="-18" cy="-37" rx="4" ry="6" fill="'+cl+'" transform="rotate(-30 -18 -37)"/><ellipse cx="18" cy="-37" rx="4" ry="6" fill="'+cl+'" transform="rotate(30 18 -37)"/>';
      else o+='<ellipse cx="-17" cy="-24" rx="4" ry="6" fill="'+cl+'" transform="rotate(25 -17 -24)"/><ellipse cx="17" cy="-24" rx="4" ry="6" fill="'+cl+'" transform="rotate(-25 17 -24)"/>';
      var e=t+16;
      if(ey==='dots')o+='<ellipse cx="-5" cy="'+e+'" rx="2.2" ry="3" fill="'+D+'" stroke="none"/><ellipse cx="5" cy="'+e+'" rx="2.2" ry="3" fill="'+D+'" stroke="none"/>';
      else if(ey==='big')[-5.5,5.5].forEach(function(x){o+='<ellipse cx="'+x+'" cy="'+e+'" rx="3.4" ry="4.4" fill="'+D+'" stroke="none"/><circle cx="'+(x-1)+'" cy="'+(e-1.5)+'" r="1.2" fill="#fff" stroke="none"/>';});
      else if(ey==='angry')o+='<ellipse cx="-5" cy="'+(e+.5)+'" rx="2.2" ry="2.6" fill="'+D+'" stroke="none"/><ellipse cx="5" cy="'+(e+.5)+'" rx="2.2" ry="2.6" fill="'+D+'" stroke="none"/>'+ln('M-8.5 '+(e-5)+'L-2.5 '+(e-3)+'M8.5 '+(e-5)+'L2.5 '+(e-3),D,1.5);
      else o+=ln('M-7.5 '+e+'Q-5 '+(e+2.5)+' -2.5 '+e+'M2.5 '+e+'Q5 '+(e+2.5)+' 7.5 '+e,D,1.5);
      o+='<ellipse cx="-10" cy="'+(e+5)+'" rx="2.4" ry="1.4" fill="#FF7A9A" fill-opacity=".45" stroke="none"/><ellipse cx="10" cy="'+(e+5)+'" rx="2.4" ry="1.4" fill="#FF7A9A" fill-opacity=".45" stroke="none"/>';
      var m=e+8;
      if(mo==='o')o+='<ellipse cx="0" cy="'+m+'" rx="2.2" ry="2.8" fill="'+D+'" stroke="none"/>';
      else if(mo==='smile')o+=ln('M-3 '+(m-1)+'Q0 '+(m+2)+' 3 '+(m-1));
      else if(mo==='tongue')o+='<path d="M-3.5 '+(m-1.5)+'Q0 '+(m+4)+' 3.5 '+(m-1.5)+'Z" fill="'+D+'"/><ellipse cx="0" cy="'+(m+1.2)+'" rx="1.8" ry="1.3" fill="#FF7A9A" stroke="none"/>';
      else o+=ln('M-4 '+(m-1)+'Q0 '+(m+2)+' 4 '+(m-1))+'<path d="M-2.6 '+(m-.2)+'l1 2.4l1 -2ZM1.6 '+(m)+'l1 2.4l1 -2.6Z" fill="#fff" stroke="'+D+'" stroke-opacity=".7"/>';
      if(ht==='witch')o+='<path d="M-9 '+(t+1)+'L4 '+(t-20)+'L9 '+(t+1)+'Z" fill="'+hc+'"/><ellipse cx="0" cy="'+(t+1)+'" rx="15" ry="3.5" fill="'+hc+'"/>';
      else if(ht==='pumpkin')o+='<ellipse cx="0" cy="'+(t-3)+'" rx="8" ry="6" fill="#F29B30"/><path d="M-1 '+(t-9)+'l1 -3l2 1l-1 2Z" fill="#4E7A2A"/>';
      else if(ht==='bow')o+='<path d="M8 '+(t+3)+'l-6 -4v8ZM8 '+(t+3)+'l6 -4v8Z" fill="'+hc+'"/><circle cx="8" cy="'+(t+3)+'" r="1.8" fill="'+hc+'"/>';
      else if(ht==='crown')o+='<path d="M-7 '+(t+2)+'v-8l3.5 3l3.5 -5l3.5 5l3.5 -3v8Z" fill="#F7C531" stroke="#B5850F" stroke-opacity="1"/>';
      if(hd==='candy')o+='<path d="M'+(hx-3)+' '+hy+'l-4 -3v6ZM'+(hx+3)+' '+hy+'l4 -3v6Z" fill="'+hl+'"/><ellipse cx="'+hx+'" cy="'+hy+'" rx="3.5" ry="2.6" fill="'+hl+'"/>';
      else if(hd==='lantern')o+=ln('M'+hx+' '+(hy-3)+'v-2',GRY,1)+'<rect x="'+(hx-3)+'" y="'+(hy-3)+'" width="6" height="8" rx="2" fill="#F29B30"/><rect x="'+(hx-1.5)+'" y="'+(hy-1)+'" width="3" height="4" fill="#FFE38A" stroke="none"/>';
      return o;
    }
  };
  CT.pirate={
    opt:{skin:['#F6C9A2','#E0A878','#A86E48'],hat:['tricorn','bandana','none'],hatC:['#222831','#E84A4A','#3E8EDE','#7A4B2A'],eye:['both','patch'],beard:['none','beard','mustache'],
      beardC:['#2B2B38','#7A4A2A','#E58A2C','#DADFE8'],shirt:['stripe','vest','coat'],shirtC:['#E84A4A','#3E8EDE','#222831','#2E7D46','#F7C531'],leg:['boots','peg'],
      hold:['none','sword','hook','map','scope'],bird:['none','parrot'],birdC:['#E84A4A','#4DBA5A','#3E8EDE','#F7C531']},
    keys:['skin','hat','hatC','eye','beard','beardC','shirt','shirtC','leg','hold','bird','birdC'],
    ez:['hat','eye','beard','shirt','shirtC','hold','bird'],nm:['hat','hatC','eye','beard','beardC','shirt','shirtC','leg','hold','bird','birdC'],
    confuse:[['shirtC'],['hat','hatC']],
    vis:function(c,k){if(k==='hatC')return c.hat!==2;if(k==='beardC')return c.beard!==0;if(k==='birdC')return c.bird!==0;return true;},
    rand:function(r,c){if(r()<.2)c.hat=2;if(r()<.4)c.beard=0;if(r()<.3)c.hold=0;if(r()<.6)c.bird=0;},
    box:function(){return [-26,-80,52,80];},
    draw:function(c){
      var O=this.opt,sk=O.skin[c.skin],ht=O.hat[c.hat],hc=O.hatC[c.hatC],sh=O.shirt[c.shirt],sc=O.shirtC[c.shirtC],hd=O.hold[c.hold],bc=O.beardC[c.beardC],pa='#5A4A3A',o='';
      if(O.leg[c.leg]==='peg')o+='<rect x="-9" y="-16" width="7" height="8" fill="'+pa+'"/>'+ln('M-5.5 -8V0','#8B5A2B',3);
      else o+='<rect x="-9" y="-16" width="7" height="11" fill="'+pa+'"/><rect x="-10" y="-6" width="9" height="6" rx="1.5" fill="#3A2A1E"/>';
      o+='<rect x="2" y="-16" width="7" height="11" fill="'+pa+'"/><rect x="1" y="-6" width="9" height="6" rx="1.5" fill="#3A2A1E"/>';
      var sl=sh==='coat'?sc:'#F5F5F5';
      o+='<rect x="-16" y="-36" width="5" height="15" rx="2.5" fill="'+sl+'"/><circle cx="-13.5" cy="-20" r="3" fill="'+sk+'"/><rect x="11" y="-36" width="5" height="15" rx="2.5" fill="'+sl+'"/>';
      if(sh==='coat')o+='<rect x="-12" y="-37" width="24" height="29" rx="3" fill="'+sc+'"/><g fill="#F7C531" stroke="none"><circle cx="-3.5" cy="-31" r="1.2"/><circle cx="-3.5" cy="-25" r="1.2"/><circle cx="3.5" cy="-31" r="1.2"/><circle cx="3.5" cy="-25" r="1.2"/></g>';
      else{o+='<rect x="-11" y="-37" width="22" height="22" rx="3" fill="#F5F5F5"/>';
        if(sh==='stripe')o+='<g fill="'+sc+'" stroke="none"><rect x="-11" y="-33" width="22" height="3"/><rect x="-11" y="-27" width="22" height="3"/></g>';
        else o+='<path d="M-11 -37H-3L-5 -15H-11ZM11 -37H3L5 -15H11Z" fill="'+sc+'"/>';}
      o+='<rect x="-11" y="-19" width="22" height="3.5" fill="#3A2A1E"/><rect x="-2" y="-19.5" width="4" height="4.5" fill="#F7C531"/>';
      if(hd==='hook')o+=ln('M13.5 -21v3.5q0 3.5 -3.5 3','#C9CED6',1.8);
      else o+='<circle cx="13.5" cy="-20" r="3" fill="'+sk+'"/>';
      if(hd==='sword')o+='<path d="M14 -23L24 -42L26.5 -40L16.5 -21Z" fill="#D5DCE3"/>'+ln('M11 -24L17 -19','#F7C531',2);
      else if(hd==='map')o+='<rect x="12" y="-28" width="11" height="8" fill="#F2E2B8" transform="rotate(-10 17 -24)"/>'+ln('M14 -25l3 1l2 -2l2 1','#B0413E',.9);
      else if(hd==='scope')o+='<rect x="12" y="-26" width="13" height="4" rx="1" fill="#C9A24A" transform="rotate(-25 13 -24)"/>';
      if(c.bird)o+='<path d="M-17 -38l-3 6l3 -1Z" fill="'+O.birdC[c.birdC]+'"/><ellipse cx="-15" cy="-43" rx="4" ry="6" fill="'+O.birdC[c.birdC]+'"/><circle cx="-15" cy="-50" r="3.5" fill="'+O.birdC[c.birdC]+'"/><path d="M-18.5 -50.5l-3 1.5l3 1Z" fill="#F7C531"/><circle cx="-15.5" cy="-51" r=".8" fill="'+D+'" stroke="none"/>';
      o+='<circle cx="0" cy="-52" r="14" fill="'+sk+'"/>';
      o+='<circle cx="-5" cy="-53" r="1.8" fill="'+D+'" stroke="none"/>';
      if(O.eye[c.eye]==='patch')o+=ln('M-14 -57Q0 -61 14 -55','#222',1)+'<ellipse cx="5" cy="-53" rx="3.6" ry="3.2" fill="#222831"/>';
      else o+='<circle cx="5" cy="-53" r="1.8" fill="'+D+'" stroke="none"/>';
      o+=ln('M-3 -46.5Q0 -44.5 3 -46.5');
      if(O.beard[c.beard]==='beard')o+='<path d="M-12 -50Q-12 -38 0 -36Q12 -38 12 -50Q8 -43.5 0 -43.5Q-8 -43.5 -12 -50Z" fill="'+bc+'"/>';
      else if(O.beard[c.beard]==='mustache')o+='<path d="M-6.5 -46Q-3 -50 0 -47.5Q3 -50 6.5 -46Q3 -45 0 -46.3Q-3 -45 -6.5 -46Z" fill="'+bc+'"/>';
      if(ht==='tricorn')o+='<path d="M-12 -60Q-12 -72 0 -72Q12 -72 12 -60Z" fill="'+hc+'"/><path d="M-19 -59Q0 -55 19 -59L13 -66Q0 -61 -13 -66Z" fill="'+hc+'"/><circle cx="0" cy="-65" r="2.2" fill="#fff" stroke="none"/>';
      else if(ht==='bandana')o+='<path d="M-14.5 -55Q-15 -67 0 -67Q15 -67 14.5 -55Z" fill="'+hc+'"/><path d="M13 -58l8 -2l-3 6Z" fill="'+hc+'"/><g fill="#fff" fill-opacity=".8" stroke="none"><circle cx="-6" cy="-61" r="1.2"/><circle cx="2" cy="-63" r="1.2"/><circle cx="8" cy="-59" r="1.2"/></g>';
      return o;
    }
  };
  // 새 장르 소품
  var PROP2={
    building:{box:[-18,-66,36,66],keys:{col:['#7FA7D9','#9AA5B1','#B39DDB','#80CBC4'],win:['#FFE38A','#BFE6FF']},draw:function(p){var c=this.keys.col[p.col],w=this.keys.win[p.win],o='<rect x="-18" y="-60" width="36" height="60" fill="'+c+'"/><rect x="-14" y="-64" width="28" height="4" fill="'+c+'"/>'+ln('M8 -64V-66','#555',1.5);
      for(var yy=-54;yy<-12;yy+=10)for(var xx=-13;xx<13;xx+=10)o+='<rect x="'+xx+'" y="'+yy+'" width="6" height="6" fill="'+w+'" stroke="none"/>';return o+'<rect x="-5" y="-10" width="10" height="10" fill="#555"/>';}},
    tower:{box:[-11,-72,22,72],keys:{light:['#E84A4A','#5AC8FA','#7CFF6B']},draw:function(p){return ln('M-10 0L0 -62L10 0M-7 -20H7M-4 -40H4M-8 -10L6 -30M8 -10L-6 -30M-5 -32L4 -50M5 -32L-4 -50',GRY,1.8)+'<circle cx="0" cy="-66" r="4.5" fill="'+this.keys.light[p.light]+'"/>';}},
    gear:{box:[-9,-18,18,18],keys:{col:['#9AA5B1','#F7C531','#E58A2C']},draw:function(p){var o='<g fill="'+this.keys.col[p.col]+'">';for(var i=0;i<8;i++)o+='<rect x="-1.8" y="-17.5" width="3.6" height="4" transform="rotate('+(i*45)+' 0 -9)"/>';return o+'<circle cx="0" cy="-9" r="6.5"/></g><circle cx="0" cy="-9" r="2.2" fill="#555"/>';}},
    battery:{box:[-6,-17,12,17],keys:{lvl:[1,2,3]},draw:function(p){var n=this.keys.lvl[p.lvl],o='<rect x="-2" y="-17" width="4" height="2" fill="#555"/><rect x="-5.5" y="-15" width="11" height="15" rx="1.5" fill="#F5F5F5"/>';for(var i=0;i<n;i++)o+='<rect x="-3.5" y="'+(-4-i*4)+'" width="7" height="3" fill="#4DBA5A" stroke="none"/>';return o;}},
    drone:{box:[-15,-14,30,14],keys:{col:['#E84A4A','#3E8EDE','#F7C531','#F5F5F5']},draw:function(p){return ln('M-12 -11H-4M4 -11H12','#555',1.6)+'<path d="M-15 -13h6M9 -13h6" stroke="#9AA5B1" stroke-opacity="1" stroke-width="1.6"/><rect x="-6" y="-11" width="12" height="7" rx="3" fill="'+this.keys.col[p.col]+'"/><circle cx="0" cy="-7.5" r="1.6" fill="#3BE0FF" stroke="none"/>';}},
    castle:{box:[-32,-66,64,66],sc:.85,keys:{wall:['#C9CED6','#E8D9B5','#D7C2E8'],flag:['#E84A4A','#3E8EDE','#F7C531'],door:['#7A4B2A','#3E6FB0']},ez:['wall','flag'],draw:function(p){var w=this.keys.wall[p.wall],f=this.keys.flag[p.flag],o='<rect x="-26" y="-40" width="52" height="40" fill="'+w+'"/>';
      for(var x=-24;x<24;x+=8)o+='<rect x="'+x+'" y="-44" width="5" height="5" fill="'+w+'"/>';
      [-30,18].forEach(function(x){o+='<rect x="'+x+'" y="-54" width="12" height="54" fill="'+w+'"/><path d="M'+(x-2)+' -54L'+(x+6)+' -64L'+(x+14)+' -54Z" fill="'+f+'"/><rect x="'+(x+3.5)+'" y="-46" width="5" height="7" fill="#22303A" stroke="none"/>';});
      return o+ln('M0 -44V-62','#555',1.4)+'<path d="M0 -62H10L0 -56Z" fill="'+f+'"/><path d="M-7 0V-12Q-7 -19 0 -19Q7 -19 7 -12V0Z" fill="'+this.keys.door[p.door]+'"/>';}},
    mush:{box:[-15,-30,30,30],keys:{cap:['#E84A4A','#9B6BDF','#F29B30','#3E8EDE']},draw:function(p){return '<rect x="-5" y="-14" width="10" height="14" rx="3" fill="#F5EBDD"/><path d="M-15 -12Q-15 -30 0 -30Q15 -30 15 -12Z" fill="'+this.keys.cap[p.cap]+'"/><g fill="#fff" stroke="none"><circle cx="-7" cy="-20" r="2.6"/><circle cx="4" cy="-24" r="2.2"/><circle cx="9" cy="-16" r="1.8"/></g>';}},
    sign:{box:[-15,-30,30,30],keys:{dir:[0,1],col:['#C0763A','#8A5A3B']},draw:function(p){var d=p.dir?-1:1;return '<rect x="-2" y="-20" width="4" height="20" fill="#7A4B2A"/><path d="M'+(-12*d)+' -28H'+(9*d)+'L'+(14*d)+' -23L'+(9*d)+' -18H'+(-12*d)+'Z" fill="'+this.keys.col[p.col]+'"/>';}},
    potion:{box:[-6,-17,12,17],keys:{col:['#E84A4A','#5AC8FA','#7BD36A','#B07AE0']},draw:function(p){return '<rect x="-2" y="-17" width="4" height="3" fill="#A0642D"/><path d="M-2 -14V-11L-6 -6Q-6 0 0 0Q6 0 6 -6L2 -11V-14Z" fill="#E6F4FF"/><path d="M-5.6 -6Q-6 0 0 0Q6 0 5.6 -6Z" fill="'+this.keys.col[p.col]+'"/>';}},
    swordp:{box:[-7,-22,14,22],keys:{hilt:['#E84A4A','#3E8EDE','#F7C531']},draw:function(p){var h=this.keys.hilt[p.hilt];return '<path d="M-1.6 0V-10H1.6V0Z" fill="#D5DCE3"/><rect x="-5.5" y="-12" width="11" height="2.5" rx="1" fill="'+h+'"/><rect x="-1.3" y="-19" width="2.6" height="7" fill="#7A4B2A"/><circle cx="0" cy="-20" r="1.8" fill="'+h+'"/><path d="M-6 0Q-5 -4 0 -4Q5 -4 6 0Z" fill="#9AA5B1"/>';}},
    mushhouse:{box:[-26,-58,52,58],keys:{cap:['#E84A4A','#F29B30','#9B6BDF','#3E8EDE'],door:['#7A4B2A','#3E6FB0','#4DBA5A'],win:[0,1]},ez:['cap','door'],draw:function(p){var o='<rect x="-15" y="-30" width="30" height="30" rx="4" fill="#F5EBDD"/><path d="M-26 -26Q-26 -58 0 -58Q26 -58 26 -26Z" fill="'+this.keys.cap[p.cap]+'"/><g fill="#fff" stroke="none"><circle cx="-13" cy="-40" r="4"/><circle cx="5" cy="-48" r="3.5"/><circle cx="15" cy="-34" r="3"/></g><path d="M-5 0V-11Q-5 -16 0 -16Q5 -16 5 -11V0Z" fill="'+this.keys.door[p.door]+'"/>';if(p.win)o+='<circle cx="9" cy="-16" r="3.4" fill="#BFE6FF"/>';return o;}},
    cart:{box:[-22,-26,44,26],keys:{col:['#C0763A','#E84A4A','#3E8EDE']},draw:function(p){return '<g fill="#F29B30"><circle cx="-12" cy="-21" r="3.5"/><circle cx="-4" cy="-22" r="3.5"/><circle cx="4" cy="-21" r="3.5"/></g><rect x="-20" y="-20" width="34" height="12" rx="2" fill="'+this.keys.col[p.col]+'"/>'+ln('M14 -14L22 -20','#7A4B2A',2)+'<circle cx="-12" cy="-5" r="5" fill="#7A4B2A"/><circle cx="6" cy="-5" r="5" fill="#7A4B2A"/>';}},
    carrot:{box:[-5,-19,10,19],keys:{},draw:function(){return '<path d="M-3.5 -12L3.5 -12L0 0Z" fill="#F29B30"/>'+ln('M0 -12L-3 -18M0 -12V-19M0 -12L3 -18','#4DBA5A',1.8);}},
    apple:{box:[-6,-14,12,14],keys:{col:['#E84A4A','#7BD36A','#F7C531']},draw:function(p){return '<circle cx="0" cy="-6" r="5.6" fill="'+this.keys.col[p.col]+'"/>'+ln('M0 -11V-14','#7A4B2A',1.4)+'<path d="M0 -12Q4 -15 5 -12Q2 -11 0 -12Z" fill="#4DBA5A"/>';}},
    mtower:{box:[-16,-74,32,74],keys:{wall:['#B9A2C9','#9AA5B1','#D7C2A8'],roof:['#4B3B8F','#2C3E66','#8E2F4F'],win:['#FFE38A','#9EE6F5']},ez:['roof','win'],draw:function(p){var l=this.keys.win[p.win];return '<rect x="-11" y="-48" width="22" height="48" fill="'+this.keys.wall[p.wall]+'"/><path d="M-15 -48L0 -74L15 -48Z" fill="'+this.keys.roof[p.roof]+'"/><path d="M-4 -30V-36Q-4 -40 0 -40Q4 -40 4 -36V-30Z" fill="'+l+'"/><path d="M-4 -12V-18Q-4 -22 0 -22Q4 -22 4 -18V-12Z" fill="'+l+'"/>';}},
    cauldron:{box:[-16,-32,32,32],keys:{brew:['#7BD36A','#B07AE0','#F07AB0','#5AC8FA']},draw:function(p){var b=this.keys.brew[p.brew];return '<path d="M-14 -18Q-16 0 0 0Q16 0 14 -18Z" fill="#333C46"/><ellipse cx="0" cy="-18" rx="15" ry="4" fill="'+b+'"/><g fill="'+b+'"><circle cx="-4" cy="-24" r="3"/><circle cx="4" cy="-27" r="2.2"/><circle cx="0" cy="-30" r="1.4"/></g>';}},
    book:{box:[-8,-12,16,12],keys:{col:['#E84A4A','#3E8EDE','#4DBA5A','#9B6BDF']},draw:function(p){return '<rect x="-7" y="-10" width="14" height="10" rx="1" fill="'+this.keys.col[p.col]+'"/><rect x="-7" y="-3" width="14" height="2" fill="#F5EBDD" stroke="none"/><path d="M-1 -10V-12L1 -11V-10Z" fill="#F7C531"/>';}},
    broom:{box:[-17,-12,34,12],keys:{rib:['#E84A4A','#3E8EDE','#F7C531']},draw:function(p){return ln('M-16 -6H6','#8B5A2B',2.4)+'<path d="M5 -9L16 -11L16 -1L5 -3Z" fill="#E8C547"/><rect x="3" y="-8" width="3" height="6" fill="'+this.keys.rib[p.rib]+'"/>';}},
    moon:{box:[-16,-34,32,34],keys:{face:[0,1]},ez:[],keep:1,draw:function(p){return '<circle cx="0" cy="-17" r="14" fill="#FFF3B0"/><circle cx="-6" cy="-23" r="2.5" fill="#E8DA90" stroke="none"/><circle cx="6" cy="-9" r="1.8" fill="#E8DA90" stroke="none"/>'+(p.face?ln('M-5 -17Q-3 -19 -1 -17M2 -17Q4 -19 6 -17','#8A7A30',1.3):'<circle cx="-3" cy="-17" r="1.2" fill="#8A7A30" stroke="none"/><circle cx="4" cy="-17" r="1.2" fill="#8A7A30" stroke="none"/>')+ln('M-2 -12Q1 -10 4 -12','#8A7A30',1.2);}},
    mansion:{box:[-32,-72,64,72],sc:.85,keys:{wall:['#6E5A7E','#5A6E7E','#7E6A5A'],win:['#FFE38A','#9EE6F5','#B9FF8A']},draw:function(p){var w=this.keys.wall[p.wall],l=this.keys.win[p.win],o='<rect x="-28" y="-40" width="56" height="40" fill="'+w+'"/><path d="M-32 -40L-16 -58L0 -40L16 -58L32 -40Z" fill="#3A2E4A"/><rect x="-6" y="-62" width="12" height="22" fill="'+w+'"/><path d="M-8 -62L0 -72L8 -62Z" fill="#3A2E4A"/>';
      [[-22,-32,9],[13,-32,9],[-22,-16,9],[13,-16,9],[-3,-56,6]].forEach(function(q){o+='<rect x="'+q[0]+'" y="'+q[1]+'" width="'+q[2]+'" height="8" fill="'+l+'"/>';});return o+'<path d="M-5 0V-10Q-5 -14 0 -14Q5 -14 5 -10V0Z" fill="#2A2030"/>';}},
    deadtree:{box:[-18,-52,36,52],keys:{},draw:function(){return ln('M0 0V-30M0 -18L-12 -32L-16 -30M-12 -32L-12 -42M0 -26L10 -40L16 -44M10 -40L8 -50M0 -30L-3 -46','#5A4636',4);}},
    grave:{box:[-10,-24,20,24],keys:{shape:[0,1],col:['#9AA5B1','#B8AE9C']},draw:function(p){var c=this.keys.col[p.col];return p.shape?'<path d="M-2.5 0V-14H-8V-19H-2.5V-24H2.5V-19H8V-14H2.5V0Z" fill="'+c+'"/>':'<path d="M-8 0V-14Q-8 -23 0 -23Q8 -23 8 -14V0Z" fill="'+c+'"/>'+ln('M-3 -15H3M-3 -11H3','#555',1);}},
    pumpkin:{box:[-11,-18,22,18],keys:{face:[0,1,2]},draw:function(p){var o='<ellipse cx="0" cy="-8" rx="10.5" ry="8" fill="#F29B30"/>'+ln('M-4 -15Q-6 -8 -4 -1M4 -15Q6 -8 4 -1','#C46A1A',1)+'<path d="M-1 -15L0 -18L2 -17L1 -15Z" fill="#4E7A2A"/>';
      if(p.face===1)o+='<path d="M-6 -10L-3 -12L-3 -9ZM6 -10L3 -12L3 -9ZM-5 -6Q0 -2 5 -6Q0 -4 -5 -6Z" fill="#5A2A0A" stroke="none"/>';else if(p.face===2)o+='<path d="M-7 -12L-2 -10L-6 -8ZM7 -12L2 -10L6 -8ZM-6 -5L-3 -3L0 -5L3 -3L6 -5L3 -2H-3Z" fill="#5A2A0A" stroke="none"/>';return o;}},
    candy:{box:[-10,-9,20,9],keys:{col:['#E84A4A','#F07AB0','#7BD36A','#F7C531']},draw:function(p){var c=this.keys.col[p.col];return '<path d="M-5 -4.5L-10 -8V-1ZM5 -4.5L10 -8V-1Z" fill="'+c+'"/><ellipse cx="0" cy="-4.5" rx="5.5" ry="4" fill="'+c+'"/>'+ln('M-2 -7L1 -2','#fff',1);}},
    bat:{box:[-15,-14,30,14],keys:{col:['#3A2E4A','#6A3A7A','#222831']},draw:function(p){return '<path d="M0 -8Q-6 -14 -15 -10Q-10 -8 -11 -4Q-7 -6 -5 -3Q-3 -5 0 -4Q3 -5 5 -3Q7 -6 11 -4Q10 -8 15 -10Q6 -14 0 -8Z" fill="'+this.keys.col[p.col]+'"/><circle cx="-1.5" cy="-7" r=".9" fill="#FFE38A" stroke="none"/><circle cx="1.5" cy="-7" r=".9" fill="#FFE38A" stroke="none"/>';}},
    ship:{box:[-34,-62,68,62],sc:.8,keys:{sail:['#F5F5F5','#E84A4A','#2A2A2A'],hull:['#8B5A2B','#5A3A20','#B0413E'],flag:[0,1]},ez:['sail','hull'],draw:function(p){var s=this.keys.sail[p.sail],o='<path d="M-34 -18H34L26 0H-26Z" fill="'+this.keys.hull[p.hull]+'"/>'+ln('M-28 -10H28','#F7C531',1.4)+ln('M-6 -18V-60M14 -18V-48','#5A3A20',2.4)+'<path d="M-20 -54Q-6 -46 -20 -24H8Q-4 -38 8 -54Z" fill="'+s+'"/><path d="M4 -44Q14 -38 4 -24H24Q16 -34 24 -44Z" fill="'+s+'"/>';
      if(p.flag)o+='<path d="M-6 -60H6V-53H-6Z" fill="#222831"/><circle cx="0" cy="-56.5" r="1.8" fill="#fff" stroke="none"/>';return o;}},
    barrel:{box:[-8,-18,16,18],keys:{band:['#555','#F7C531','#C0763A']},draw:function(p){var b=this.keys.band[p.band];return '<path d="M-6 0Q-8.5 -9 -6 -18H6Q8.5 -9 6 0Z" fill="#A0642D"/><rect x="-7.4" y="-15" width="14.8" height="2" fill="'+b+'" stroke="none"/><rect x="-7.4" y="-5" width="14.8" height="2" fill="'+b+'" stroke="none"/>';}},
    anchor:{box:[-9,-20,18,20],keys:{col:['#555','#3E6FB0','#B0413E']},draw:function(p){var c=this.keys.col[p.col];return ln('M0 -16V-1M-5 -12H5M-8 -6Q-7 0 0 -1Q7 0 8 -6',c,2.4)+'<circle cx="0" cy="-17.5" r="2.2" fill="none" stroke="'+c+'" stroke-opacity="1" stroke-width="1.8"/>';}},
    cannon:{box:[-18,-20,36,20],keys:{col:['#333C46','#6A5446']},draw:function(p){return '<rect x="-14" y="-17" width="26" height="9" rx="4.5" fill="'+this.keys.col[p.col]+'" transform="rotate(-12 0 -12)"/><circle cx="-4" cy="-5" r="5" fill="#7A4B2A"/><circle cx="8" cy="-5" r="5" fill="#7A4B2A"/>';}}
  };
  for(var pk in PROP2)PROP[pk]=PROP2[pk];

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
  function sunCloud(r,i){return i===0?'sun':'cloud';}
  THEMES.robot={name:'로봇 도시',genre:'게임',ch:'robot',pal:[['#FFB38A','#FFE6CF','#A9B2BD'],['#8FD3FF','#E1F4FF','#A3ACB8'],['#B39DDB','#F0E6FF','#9EA7B3']],
    horizon:function(r){return r()<.7?'building':'tower';},air:function(r,i){return i===0?'sun':r()<.5?'drone':'cloud';},mid:['car'],small:['gear','battery','gear','coin'],
    ground:function(r,W,HZ){var o='<rect x="0" y="'+(HZ+30)+'" width="'+W+'" height="22" fill="#6B7480" fill-opacity=".35" stroke="none"/>';for(var x=6;x<W;x+=34)o+='<rect x="'+x+'" y="'+(HZ+40)+'" width="16" height="3" fill="#fff" fill-opacity=".85" stroke="none"/>';return o;},
    crowd:{g:'#A3ACB8',path:'#8B96A2',feat:'pad',deco:['tower','gear','battery'],card:['#E1F4FF','#8FD3FF']}};
  THEMES.slime={name:'슬라임 모험',genre:'게임',ch:'slime',pal:[['#8FD3FF','#E6F7FF','#8BD45A'],['#FFD59A','#FFF4E0','#86C55A'],['#B9C8FF','#EEF2FF','#7FCB60']],
    horizon:function(r,i){return i===0?'castle':r()<.5?'tree':'mush';},air:sunCloud,mid:['sign'],small:['potion','coin','swordp','chest'],
    ground:function(r,W,HZ){return '<path d="M0 '+(HZ+50)+'Q'+(W/2)+' '+(HZ+30)+' '+W+' '+(HZ+60)+'V'+(HZ+76)+'Q'+(W/2)+' '+(HZ+46)+' 0 '+(HZ+66)+'Z" fill="#D9C08E" fill-opacity=".7" stroke="none"/>';},
    crowd:{g:'#8BD45A',path:'#D9C08E',feat:'pond',deco:['mush','potion','coin'],card:['#E6F7FF','#8FD3FF']}};
  THEMES.animal={name:'동물 마을',genre:'만화',ch:'animal',pal:[['#BDE8FF','#FFF7E0','#9DD66B'],['#FFD0E0','#FFF5EA','#A5D86E'],['#C8F0D8','#FAFFF0','#96D065']],
    horizon:function(r){return r()<.5?'mushhouse':'tree';},air:sunCloud,mid:['cart'],small:['carrot','apple','flower','apple'],
    ground:function(r,W,HZ,H){return dotsR(r,26,0,W,HZ+8,H,[1.2,2],'#FFFFFF',.8);},
    crowd:{g:'#9DD66B',path:'#E9D7A8',feat:'pond',deco:['tree','carrot','apple','flower'],card:['#FFF7E0','#BDE8FF']}};
  THEMES.magic={name:'마법 학교',genre:'만화',ch:'wizard',pal:[['#2B1E5A','#7A5AB0','#5E8F4A'],['#1E2A5A','#5A6AB0','#55884A'],['#3A1E4A','#9A5A8A','#5A8A50']],
    horizon:function(r,i){return i===0||r()<.4?'mtower':'pine';},air:function(r,i){return i===0?'moon':r()<.6?'star':'bat';},mid:['cauldron'],small:['potion','book','broom','book'],
    sky:function(r,W,HZ){return dotsR(r,40,0,W,0,HZ-6,[.5,1.4],'#FFFFFF',.9);},ground:function(r,W,HZ,H){return dotsR(r,16,0,W,HZ+8,H,[1,2],'#FFE38A',.6);},
    crowd:{g:'#5E8F4A',path:'#8C7A6A',feat:'circle',deco:['pine','book','potion'],card:['#7A5AB0','#2B1E5A']}};
  THEMES.ghost={name:'유령 저택',genre:'영화',ch:'ghost',pal:[['#1E2A4A','#4A3A6A','#4E5A3E'],['#2A1E3A','#5A3A5A','#4A563A'],['#14283A','#3A5A6A','#46563E']],
    horizon:function(r,i){return i===0?'mansion':r()<.5?'deadtree':'grave';},air:function(r,i){return i===0?'moon':'bat';},mid:['grave'],small:['pumpkin','candy','pumpkin','grave'],
    sky:function(r,W,HZ){return dotsR(r,20,0,W,0,HZ-10,[.5,1.2],'#FFFFFF',.7);},
    ground:function(r,W,HZ){return '<g fill="#fff" fill-opacity=".08" stroke="none"><ellipse cx="'+(W*.25)+'" cy="'+(HZ+20)+'" rx="120" ry="12"/><ellipse cx="'+(W*.75)+'" cy="'+(HZ+60)+'" rx="140" ry="14"/></g>';},
    crowd:{g:'#4E5A3E',path:'#625E50',feat:'swamp',deco:['deadtree','pumpkin','grave','candy'],card:['#4A3A6A','#1E2A4A']}};
  THEMES.pirate={name:'해적섬',genre:'영화',ch:'pirate',pal:[['#7FD0FF','#E0F6FF','#F0DDB0'],['#FFC48A','#FFEBD0','#EED7A6'],['#9EC8F5','#E8F2FF','#F2DFB4']],
    horizon:function(r,i){return i===0?'ship':r()<.6?'palm':'rock';},air:sunCloud,mid:['cannon'],small:['barrel','anchor','chest','coin','shell'],
    sky:function(r,W,HZ){var o='<rect x="0" y="'+(HZ-24)+'" width="'+W+'" height="24" fill="#3E9AD4" stroke="none"/>';for(var x=10;x<W;x+=40)o+='<path d="M'+x+' '+(HZ-14)+'q5 -4 10 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>';return o;},
    ground:function(r,W,HZ,H){return dotsR(r,20,0,W,HZ+6,H,[.8,1.6],'#B89A64',.5);},
    crowd:{g:'#F0DDB0',path:'',feat:'lagoon',deco:['palm','barrel','shell','coin'],card:['#E0F6FF','#7FD0FF']}};
  // 순서: 게임 → 만화 → 영화
  var THEME_KEYS=['block','robot','slime','anime','animal','magic','space','sea','dino','snow','ghost','pirate'];
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
    var cx=x+w/2,cy=y+h/2;
    if(kind==='pad')return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="20" fill="#6B7480" stroke="#F7C531" stroke-width="5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(h*.36)+'" fill="none" stroke="#fff" stroke-width="4"/>'+
      '<path d="M'+(cx-14)+' '+(cy-18)+'V'+(cy+18)+'M'+(cx+14)+' '+(cy-18)+'V'+(cy+18)+'M'+(cx-14)+' '+cy+'H'+(cx+14)+'" stroke="#fff" stroke-width="6" fill="none"/>';
    if(kind==='circle')return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(w/2)+'" ry="'+(h/2)+'" fill="#3A2E5A" stroke="#B07AE0" stroke-width="4"/><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(w/2-14)+'" ry="'+(h/2-12)+'" fill="none" stroke="#E2C8FF" stroke-width="2" stroke-dasharray="8 6"/><path d="'+starD(cx,cy,h*.28)+'" fill="none" stroke="#F7C531" stroke-width="3"/>';
    var c=kind==='lake'?['#4FA8C8','#367F9C']:kind==='swamp'?['#3E5E44','#2A4030']:kind==='lagoon'?['#5BC8E8','#3EA0C8']:['#5BB8E8','#3E8EB8'];
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
