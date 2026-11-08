// 왼쪽 위 아이콘·게임 이름(.brand)을 누르면 "게임 모음으로 갈까요?" 팝업. 모든 게임이 게임 스크립트 뒤에 불러온다.
// 색·글꼴은 게임마다 있는 공통 CSS 변수(--bg, --surface, --line, --ink, --muted, --accent …)를 쓴다.
(function(){
  'use strict';
  // 친구와 연결된 방이 저장돼 있는지(게임마다 키가 다르다)
  var ROOM_KEYS=['solsol.room','janggi.room','bingo.room','block.room'];
  function inRoom(){
    return ROOM_KEYS.some(function(k){try{var v=JSON.parse(localStorage.getItem(k)||'null');return !!(v&&(v.id||v.code));}catch(e){return false;}});
  }
  function init(){
    var brand=document.querySelector('.brand');if(!brand)return;
    brand.setAttribute('role','button');brand.tabIndex=0;brand.style.cursor='pointer';
    brand.setAttribute('aria-label','게임 모음으로 가기');brand.title='게임 모음으로';

    var st=document.createElement('style');
    st.textContent='.home-bg{position:fixed;inset:0;background:rgba(17,23,17,.5);z-index:60;display:grid;place-items:center;padding:16px}'+
      '.home-card{background:var(--surface);border-radius:22px;padding:20px 18px 16px;width:min(100%,340px);box-shadow:0 8px 0 var(--shade,rgba(0,0,0,.2));text-align:center;display:flex;flex-direction:column;gap:12px;animation:homepop .3s cubic-bezier(.3,1.5,.5,1)}'+
      '@keyframes homepop{0%{transform:scale(.85)}70%{transform:scale(1.04)}100%{transform:scale(1)}}'+
      '.home-card .ic{display:grid;place-items:center}.home-card .ic svg{width:54px;height:54px}'+
      '.home-card h2{margin:0;font-family:var(--f-display);font-size:22px;font-weight:700;color:var(--ink)}'+
      '.home-card p{margin:0;color:var(--muted);font-weight:700;font-size:14px;line-height:1.5}'+
      '.home-card .warn{color:var(--danger,#E0533D)}'+
      '.home-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:2px}'+
      '.home-row button{border-radius:16px;padding:12px 8px;font:inherit;font-weight:800;font-size:15px;border:2px solid var(--line);background:var(--surface);color:var(--ink);box-shadow:0 4px 0 var(--line);cursor:pointer;min-height:48px}'+
      '.home-row button.go{background:var(--accent);border-color:var(--accent);color:var(--on-accent,#fff);box-shadow:0 4px 0 var(--accent-deep)}'+
      '.home-row button:active{transform:translateY(4px);box-shadow:none}'+
      '.brand[role="button"]:focus-visible{outline:3px solid var(--sky,#2E9BD6);outline-offset:3px;border-radius:10px}';
    document.head.appendChild(st);

    var bg=document.createElement('div');bg.className='home-bg';bg.hidden=true;
    bg.innerHTML='<div class="home-card" role="dialog" aria-modal="true" aria-labelledby="homeTitle">'+
      '<div class="ic"><svg viewBox="0 0 54 54" aria-hidden="true"><rect x="3" y="3" width="48" height="48" rx="14" fill="#58B030"/><rect x="11" y="11" width="14" height="14" rx="4" fill="#fff"/><rect x="29" y="11" width="14" height="14" rx="4" fill="#F6C945"/><rect x="11" y="29" width="14" height="14" rx="4" fill="#F6C945"/><rect x="29" y="29" width="14" height="14" rx="4" fill="#fff"/></svg></div>'+
      '<h2 id="homeTitle">게임 모음으로 갈까요?</h2><p id="homeMsg"></p>'+
      '<div class="home-row"><button type="button" data-a="stay">계속하기</button><button type="button" class="go" data-a="go">게임 모음으로</button></div></div>';
    document.body.appendChild(bg);

    function open(){
      var msg='하던 판은 저장돼서, 다시 들어오면 이어서 할 수 있어요.';
      if(inRoom())msg+='<br><span class="warn">친구와 연결된 방이 있어요. 나가면 연결이 잠시 끊기고, 돌아오면 다시 연결돼요.</span>';
      document.getElementById('homeMsg').innerHTML=msg;
      bg.hidden=false;bg.querySelector('[data-a="stay"]').focus();
    }
    function close(){bg.hidden=true;brand.focus();}
    brand.addEventListener('click',open);
    brand.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    bg.addEventListener('click',function(e){
      if(e.target===bg){close();return;}
      var b=e.target.closest('button');if(!b)return;
      if(b.dataset.a==='go')location.href='../';else close();
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!bg.hidden)close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
