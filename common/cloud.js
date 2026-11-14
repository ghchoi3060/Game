// 솔솔 클라우드: Supabase 익명 계정으로 게임 기록을 서버에 저장하고(기기 옮기기 포함) 순위표를 보여 준다.
// 쓰는 법(게임 스크립트보다 먼저):
//   <script src="../common/supabase-config.js"></script>
//   <script src="../common/cloud.js" data-game="sudoku"></script>
// 게임은 localStorage 를 그대로 쓰면 된다. 그 게임의 키가 바뀌면 여기서 잠시 뒤 서버로 올린다.
// 설정(supabase-config.js)이 비어 있거나 인터넷이 안 되면 아무것도 하지 않고, 게임은 이 폰에만 저장한다.
(function(){
  'use strict';
  var script=document.currentScript,GAME=script&&script.dataset.game;
  // 게임마다 서버에 올릴 localStorage 키. 진행 중인 친구 방(room)처럼 그 기기에서만 의미 있는 것은 뺀다
  var OWN={
    chess:{prefix:['chess.'],exact:['solsol.friends','solsol.recorded']},
    janggi:{prefix:['janggi.'],skip:['janggi.room']},
    sudoku:{prefix:['sudoku.']},
    mine:{prefix:['mine.']},
    bingo:{prefix:['bingo.'],skip:['bingo.room']},
    block:{prefix:['block.'],skip:['block.room']},
    hidden:{prefix:['hidden.'],skip:['hidden.zoom']}
  }[GAME]||{prefix:[]};
  function owned(k){
    if(!k)return false;
    if(OWN.skip&&OWN.skip.indexOf(k)>=0)return false;
    if(OWN.exact&&OWN.exact.indexOf(k)>=0)return true;
    return OWN.prefix.some(function(p){return k.indexOf(p)===0;});
  }
  var TS='cloud.ts.'+GAME,PENDING='cloud.pending';
  var rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{rawSet.call(localStorage,k,v);}catch(e){}}
  function lsJson(k,d){try{return JSON.parse(lsGet(k)||'null')||d;}catch(e){return d;}}

  var cfg=window.SOLSOL_SUPABASE||{};
  var enabled=!!(cfg.url&&cfg.anonKey&&GAME);
  var client=null,user=null,state=enabled?'connecting':'off',pushTimer=0,listeners=[];
  function setState(s){state=s;listeners.forEach(function(f){try{f(s);}catch(e){}});}

  // ---------- 바뀐 것 감지 ----------
  Storage.prototype.setItem=function(k,v){rawSet.call(this,k,v);if(this===localStorage&&owned(k))dirty();};
  Storage.prototype.removeItem=function(k){rawRemove.call(this,k);if(this===localStorage&&owned(k))dirty();};
  function dirty(){
    lsSet(TS,String(Date.now()));
    if(!enabled)return;
    clearTimeout(pushTimer);pushTimer=setTimeout(push,2500);
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden&&pushTimer)push();});

  function collect(){
    var d={};
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(owned(k))d[k]=lsGet(k);}
    return d;
  }
  function apply(d){Object.keys(d||{}).forEach(function(k){if(owned(k)&&typeof d[k]==='string')lsSet(k,d[k]);});}
  // 서버 데이터로 바꿨으면 화면을 한 번만 새로 그린다(무한 새로고침 방지)
  function reloadOnce(){
    var flag='cloud.reloaded.'+GAME;
    try{if(sessionStorage.getItem(flag))return;sessionStorage.setItem(flag,'1');}catch(e){return;}
    location.reload();
  }

  // ---------- 연결 ----------
  function loadLib(){
    return new Promise(function(res,rej){
      if(window.supabase&&window.supabase.createClient)return res();
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload=res;s.onerror=function(){rej(new Error('supabase 라이브러리를 불러오지 못함'));};
      document.head.appendChild(s);
    });
  }
  var ready=!enabled?Promise.resolve(null):loadLib().then(function(){
    client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'solsol.auth'}});
    return client.auth.getSession();
  }).then(function(r){
    if(r.data&&r.data.session)return r.data.session.user;
    return client.auth.signInAnonymously().then(function(x){if(x.error)throw x.error;return x.data.user;});
  }).then(function(u){
    user=u;return pull();
  }).then(function(){
    try{sessionStorage.removeItem('cloud.reloaded.'+GAME);}catch(e){}
    flushPending();setState('on');return user;
  }).catch(function(e){
    console.warn('[cloud]',e&&e.message||e);setState('error');return null;
  });

  // 서버가 더 새것이면 받아 오고, 이 폰이 더 새것이면(또는 서버에 없으면) 올린다
  function pull(){
    return client.from('saves').select('data,updated_at').eq('game',GAME).maybeSingle().then(function(r){
      if(r.error)throw r.error;
      var row=r.data,local=+(lsGet(TS)||0),remote=row?Date.parse(row.updated_at):0;
      if(row&&remote>local+1000){
        var before=JSON.stringify(collect());
        apply(row.data);lsSet(TS,String(remote));
        if(JSON.stringify(collect())!==before)reloadOnce();
        return;
      }
      if(!row||local>remote+1000)return push();
    });
  }
  function push(){
    clearTimeout(pushTimer);pushTimer=0;
    if(!client||!user)return Promise.resolve();
    var ts=+(lsGet(TS)||Date.now());
    return client.from('saves').upsert({user_id:user.id,game:GAME,data:collect(),updated_at:new Date(ts).toISOString()})
      .then(function(r){if(r.error)console.warn('[cloud] 저장 실패',r.error.message);});
  }

  // ---------- 순위표 ----------
  function submitScore(level,sec){
    var q=lsJson(PENDING,[]);
    q.push({game:GAME,level:level,time_sec:Math.max(1,Math.round(sec))});
    lsSet(PENDING,JSON.stringify(q.slice(-50)));
    return flushPending();
  }
  // 인터넷이 끊겨 못 올린 기록은 다음에 연결될 때 올린다
  function flushPending(){
    if(!client||!user)return Promise.resolve();
    var q=lsJson(PENDING,[]);if(!q.length)return Promise.resolve();
    return client.from('scores').insert(q).then(function(r){
      if(r.error)console.warn('[cloud] 기록 올리기 실패',r.error.message);else lsSet(PENDING,'[]');
    });
  }
  function leaderboard(level){
    return ready.then(function(){
      if(!user)throw new Error('offline');
      return client.rpc('leaderboard',{p_game:GAME,p_level:level,p_limit:20});
    }).then(function(r){if(r.error)throw r.error;return r.data||[];});
  }
  function getNickname(){
    return ready.then(function(){
      var local=lsJson('solsol.name','');   // 체스·장기 친구 대전 이름(JSON 문자열)과 같이 쓴다
      if(!user)return local;
      return client.from('profiles').select('nickname').eq('id',user.id).maybeSingle().then(function(r){return (r.data&&r.data.nickname)||local;});
    });
  }
  function setNickname(name){
    name=String(name||'').trim().slice(0,20);
    lsSet('solsol.name',JSON.stringify(name));
    return ready.then(function(){
      if(!user)throw new Error('offline');
      return client.from('profiles').upsert({id:user.id,nickname:name||null,updated_at:new Date().toISOString()});
    }).then(function(r){if(r.error)throw r.error;return name;});
  }

  // ---------- 기기 옮기기 ----------
  function createCode(){
    return ready.then(function(){if(!user)throw new Error('offline');return push();})
      .then(function(){return client.rpc('create_transfer_code');})
      .then(function(r){if(r.error)throw r.error;return r.data;});
  }
  function redeemCode(code){
    return ready.then(function(){
      if(!user)throw new Error('offline');
      return client.rpc('redeem_transfer_code',{p_code:String(code||'')});
    }).then(function(r){
      if(r.error)throw r.error;
      if(!r.data)return false;
      // 옮겨 온 기록을 모든 게임이 다음에 열릴 때 받아 가도록, 이 폰의 시각 표시를 지운다
      for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf('cloud.ts.')===0)rawRemove.call(localStorage,k);}
      try{sessionStorage.removeItem('cloud.reloaded.'+GAME);}catch(e){}
      return pull().then(function(){return true;});
    });
  }

  // ---------- 기록 탭에 붙이는 화면 ----------
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var cssDone=false;
  function css(){
    if(cssDone)return;cssDone=true;
    var st=document.createElement('style');
    st.textContent='.sc-seg{display:flex;gap:6px;flex-wrap:wrap}.sc-seg button{border:2px solid var(--line);background:var(--bg);border-radius:12px;padding:6px 12px;font-weight:800;font-size:13px}'+
      '.sc-seg button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent);color:var(--on-accent)}'+
      '.sc-rows{display:flex;flex-direction:column;gap:4px;font-variant-numeric:tabular-nums}.sc-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:12px;background:var(--bg);font-weight:700;font-size:14px}'+
      '.sc-row .r{width:26px;font-family:var(--f-display);font-weight:700;color:var(--muted)}.sc-row .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-row .t{font-weight:800}'+
      '.sc-row.top1 .r{color:#D4A017}.sc-row.top2 .r{color:#9AA4AE}.sc-row.top3 .r{color:#C77B3A}.sc-row.me{outline:2px solid var(--accent);background:var(--surface)}'+
      '.sc-line{display:grid;grid-template-columns:1fr auto;gap:8px}.sc-field{width:100%;min-width:0;border:2px solid var(--line);background:var(--bg);color:var(--ink);border-radius:12px;padding:9px 11px;font:inherit;font-weight:800;font-size:16px}'+
      '.sc-field:focus{outline:3px solid var(--sky);outline-offset:1px}.sc-code{font-family:var(--f-display);font-size:32px;font-weight:700;letter-spacing:.16em;text-align:center;color:var(--accent);user-select:all;-webkit-user-select:all}'+
      '.sc-state{font-size:12px;font-weight:800;color:var(--muted)}.sc-state.on{color:var(--accent)}.sc-state.error{color:var(--danger)}'+
      '.sc-small{min-height:42px;padding:8px 14px;font-size:14px}';
    document.head.appendChild(st);
  }
  function stateText(){return state==='on'?'● 서버에 저장되고 있어요':state==='connecting'?'● 서버에 연결하는 중…':state==='error'?'● 서버에 연결하지 못했어요. 이 폰에는 그대로 저장돼요':'';}
  // opts: {levels:[[key,label]], level:처음 보여 줄 난이도, fmt:function(sec), board:true|false}
  function mount(container,opts){
    if(!enabled||!container)return;
    css();opts=opts||{};
    var first=opts.level||(opts.levels&&opts.levels[0]&&opts.levels[0][0]);
    var box=document.createElement('div');box.style.display='contents';
    var h='';
    if(opts.board){
      h+='<div class="panel"><h3>전체 순위</h3><div class="sc-seg" data-k="lv">'+opts.levels.map(function(l){return '<button type="button" data-lv="'+l[0]+'" aria-pressed="'+(l[0]===first)+'">'+l[1]+'</button>';}).join('')+'</div>'+
        '<div class="sc-rows" data-k="rows"><p class="hint">불러오는 중…</p></div>'+
        '<div class="sc-line"><input class="sc-field" data-k="nick" maxlength="20" placeholder="순위표에 보일 이름"><button type="button" class="btn sc-small" data-k="saveNick">저장</button></div>'+
        '<p class="hint">이름을 정하지 않으면 "이름 없음"으로 보여요. '+esc(opts.note||'완성·성공한 판의 시간이 올라가요.')+'</p></div>';
    }
    h+='<div class="panel"><h3>기기 옮기기</h3><div class="sc-state" data-k="state"></div>'+
      '<p class="hint">폰을 바꿀 때 예전 폰에서 코드를 만들고, 새 폰에서 입력하면 모든 게임의 기록이 옮겨져요. 코드는 30분 동안 쓸 수 있어요.</p>'+
      '<button type="button" class="btn sc-small" data-k="make">이어하기 코드 만들기</button><div class="sc-code" data-k="code" hidden></div>'+
      '<div class="sc-line"><input class="sc-field" data-k="redeem" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="받은 코드 8자리"><button type="button" class="btn sc-small" data-k="use">옮겨 오기</button></div>'+
      '<p class="hint">옮겨 오면 이 폰의 지금 기록은 예전 폰 기록으로 바뀌어요.</p></div>';
    box.innerHTML=h;container.appendChild(box);
    var q=function(k){return box.querySelector('[data-k="'+k+'"]');};
    function paintState(){var el=q('state');if(el){el.textContent=stateText();el.className='sc-state '+state;}}
    // 기록 탭을 다시 그리면 예전 화면의 것은 버린다
    listeners=listeners.filter(function(f){return !f.box||f.box.isConnected;});
    paintState.box=box;paintState();listeners.push(paintState);
    var lv=first;
    function loadBoard(){
      if(!opts.board)return;
      var rows=q('rows');rows.innerHTML='<p class="hint">불러오는 중…</p>';
      leaderboard(lv).then(function(list){
        if(!list.length){rows.innerHTML='<p class="hint">아직 기록이 없어요. 첫 번째가 되어 보세요!</p>';return;}
        rows.innerHTML=list.map(function(x){
          return '<div class="sc-row'+(x.rank<=3?' top'+x.rank:'')+(x.is_me?' me':'')+'"><span class="r">'+x.rank+'</span><span class="n">'+esc(x.nickname)+(x.is_me?' (나)':'')+'</span><span class="t">'+(opts.fmt?opts.fmt(x.best):x.best)+'</span></div>';
        }).join('');
      }).catch(function(){rows.innerHTML='<p class="hint">순위표를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>';});
    }
    if(opts.board){
      q('lv').addEventListener('click',function(e){
        var b=e.target.closest('button');if(!b)return;lv=b.dataset.lv;
        Array.prototype.forEach.call(q('lv').children,function(x){x.setAttribute('aria-pressed',x===b);});
        loadBoard();
      });
      getNickname().then(function(n){q('nick').value=n;});
      q('saveNick').onclick=function(){
        setNickname(q('nick').value).then(function(){toast('이름을 저장했어요');loadBoard();},function(){toast('저장하지 못했어요. 인터넷 연결을 확인해 주세요');});
      };
      loadBoard();
    }
    q('make').onclick=function(){
      var b=this;b.disabled=true;
      createCode().then(function(c){var el=q('code');el.textContent=c;el.hidden=false;toast('새 폰에서 이 코드를 입력하세요');},
        function(){toast('코드를 만들지 못했어요. 인터넷 연결을 확인해 주세요');}).then(function(){b.disabled=false;});
    };
    q('use').onclick=function(){
      var code=q('redeem').value.trim();
      if(code.length!==8){toast('코드 8자리를 확인해 주세요');return;}
      redeemCode(code).then(function(ok){
        if(!ok){toast('코드가 맞지 않거나 30분이 지났어요');return;}
        toast('기록을 옮겨 왔어요');setTimeout(function(){location.reload();},800);
      },function(){toast('옮기지 못했어요. 인터넷 연결을 확인해 주세요');});
    };
  }
  // 게임마다 toast 가 IIFE 안에 있어서, 여기서는 간단한 것을 따로 쓴다
  function toast(msg){
    var t=document.getElementById('toast');
    if(!t){alert(msg);return;}
    t.textContent=msg;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(function(){t.hidden=true;},2600);
  }

  window.SolsolCloud={enabled:enabled,ready:ready,state:function(){return state;},onState:function(f){listeners.push(f);},
    submitScore:submitScore,leaderboard:leaderboard,getNickname:getNickname,setNickname:setNickname,
    createCode:createCode,redeemCode:redeemCode,push:push,mount:mount};
})();
