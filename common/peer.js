// 솔솔 친구 대전 연결: PeerJS 와 같은 모양(window.Peer)으로 쓰지만, 폰끼리 직접(WebRTC) 붙지 않고
// Supabase Realtime 채널(서버 웹소켓)로 메시지를 중계한다. LTE·5G·회사 와이파이·카카오톡 안 브라우저 어디서든 연결된다.
// 쓰는 법(게임 스크립트보다 먼저):
//   <script src="../common/supabase-config.js?v=1"></script>
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
//   <script src="../common/peer.js?v=1"></script>
// 게임에서 쓰는 PeerJS 기능만 흉내 낸다:
//   new Peer(id?) · peer.on('open'|'connection'|'disconnected'|'error') · peer.connect(id) · peer.reconnect() · peer.destroy()
//   peer.id/open/destroyed/disconnected · conn.on('open'|'data'|'close') · conn.send(obj) · conn.close() · conn.open/peer
// 구조: id 마다 '허브' 채널(solsol-peer:<id>) 하나. 그 id 의 주인이 허브에 들어가 있고, 연결하려는 쪽이 같은 허브에 들어와
//   syn → ack 로 연결을 연다. 메시지는 broadcast(event 'm'), 누가 있는지는 presence 로 본다(주인이 나가면 연결이 닫힌다).
// 서버에 아무것도 저장하지 않는다. 보내는 데이터는 JSON 으로 바꿀 수 있는 값이어야 한다.
(function(){
  'use strict';
  var cfg=window.SOLSOL_SUPABASE||{};
  var SYN_EVERY=1000,UNAVAILABLE_MS=3500;
  function rid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}
  function later(f,ms){return setTimeout(f,ms||0);}

  function Emitter(){this._h={};}
  Emitter.prototype.on=function(ev,f){(this._h[ev]=this._h[ev]||[]).push(f);return this;};
  Emitter.prototype.off=function(ev,f){var a=this._h[ev];if(a)this._h[ev]=f?a.filter(function(x){return x!==f;}):[];return this;};
  Emitter.prototype.emit=function(ev){
    var args=[].slice.call(arguments,1);
    (this._h[ev]||[]).slice().forEach(function(f){try{f.apply(null,args);}catch(e){console.error(e);}});
  };

  // ---------- 연결 하나 ----------
  function Conn(peer,cid,remote,hub,outbound){
    Emitter.call(this);
    this.peer=remote;this.connectionId=cid;this.open=false;this.reliable=true;
    this._p=peer;this._hub=hub;this._out=outbound;this._closed=false;this._inst=null;
  }
  Conn.prototype=Object.create(Emitter.prototype);
  Conn.prototype.send=function(data){
    if(!this.open||this._closed)return;
    this._p._send(this._hub,{k:'d',cid:this.connectionId,dir:this._out?'g':'o',data:data});
  };
  Conn.prototype.close=function(){this._p._closeConn(this,true);};
  Conn.prototype._opened=function(){
    if(this.open||this._closed)return;
    this.open=true;var c=this;later(function(){if(!c._closed)c.emit('open');});
  };

  // ---------- Peer ----------
  function Peer(id){
    if(!(this instanceof Peer))return new Peer(id);
    Emitter.call(this);
    this.id=id?String(id):'g'+rid();
    this.open=false;this.destroyed=false;this.disconnected=false;
    this._inst=rid();        // 같은 id 로 다시 열면(앱 새로 열기) 옛 연결과 구분
    this._hubs={};           // hubId → {ch, owner, ready}
    this._conns={};          // cid → Conn
    this._client=null;
    var self=this;
    later(function(){self._start();});
  }
  Peer.prototype=Object.create(Emitter.prototype);

  Peer.prototype._fail=function(type,msg){var e=new Error(msg||type);e.type=type;this.emit('error',e);};
  Peer.prototype._start=function(){
    if(this.destroyed)return;
    if(!cfg.url||!cfg.anonKey){this._fail('server-error','supabase 설정 없음');return;}
    if(!window.supabase||!window.supabase.createClient){this._fail('browser-incompatible','supabase 라이브러리 없음');return;}
    // 기록 저장(cloud.js)의 로그인 세션과 섞이지 않게 따로 만든다. 채널은 공개(익명) 채널
    this._client=window.supabase.createClient(cfg.url,cfg.anonKey,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'solsol.peer.'+this._inst},
      realtime:{params:{eventsPerSecond:30}}
    });
    this._joinHub(this.id,true);
  };

  // 허브 채널에 들어간다(내 id 허브는 주인으로, 남의 허브는 손님으로)
  Peer.prototype._joinHub=function(hubId,owner){
    var self=this,h=this._hubs[hubId];
    if(h)return h;
    var ch=this._client.channel('solsol-peer:'+hubId,{config:{broadcast:{self:false,ack:false},presence:{key:this.id}}});
    h={ch:ch,owner:owner,subscribed:false,id:hubId};
    this._hubs[hubId]=h;
    ch.on('broadcast',{event:'m'},function(msg){self._onMsg(h,msg.payload||{});});
    ch.on('presence',{event:'sync'},function(){self._onPresence(h);});
    ch.subscribe(function(status){
      if(self.destroyed||self._hubs[hubId]!==h)return;
      if(status==='SUBSCRIBED'){
        h.subscribed=true;
        ch.track({inst:self._inst,owner:owner}).catch(function(){});
        if(owner){
          var first=!self.open;self.open=true;
          if(self.disconnected){self.disconnected=false;}
          if(first)self.emit('open',self.id);
        }else self._synAll(h);
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        h.subscribed=false;
        if(owner&&!self.disconnected&&status!=='CLOSED'){self.disconnected=true;self.emit('disconnected',self.id);}
        if(!owner&&status!=='CLOSED')self._dropHubConns(h);
        if(!self.open&&owner&&status==='CHANNEL_ERROR')self._fail('server-error','채널에 들어가지 못함');
      }
    });
    return h;
  };
  Peer.prototype._send=function(h,payload){
    if(!h||!h.ch)return;
    payload.from=this.id;payload.inst=this._inst;
    try{h.ch.send({type:'broadcast',event:'m',payload:payload});}catch(e){}
  };
  function present(h,key){var st=h.ch.presenceState()||{};return st[key]||[];}

  Peer.prototype._onMsg=function(h,m){
    if(this.destroyed||!m.cid)return;
    var c=this._conns[m.cid];
    if(h.owner){
      // 내 허브: 손님이 보낸 것만
      if(m.k==='syn'){
        if(!c){
          c=new Conn(this,m.cid,m.from,h,false);c._remoteInst=m.inst;this._conns[m.cid]=c;
          this.emit('connection',c);
          var self=this,cc=c;   // 10초가 지나도 presence 에 안 보이면 이미 떠난 손님
          later(function(){if(!cc._closed&&!present(h,cc.peer).length)self._closeConn(cc,false);},10000);
        }
        this._send(h,{k:'ack',cid:m.cid,to:m.from});
        c._opened();
      }else if(m.k==='d'&&m.dir==='g'){
        if(c&&!c._closed)c.emit('data',m.data);
        else this._send(h,{k:'rst',cid:m.cid,to:m.from});   // 모르는 연결(앱을 새로 열었음) → 다시 연결하라고
      }else if(m.k==='fin'&&c&&!c._out)this._closeConn(c,false);
    }else{
      // 남의 허브: 주인이 나에게 보낸 것만
      if(!c||!c._out||m.from!==h.id)return;
      if(m.k==='ack'){c._inst=m.inst;clearTimeout(c._synTimer);c._opened();}
      else if(m.k==='d'&&m.dir==='o')c.emit('data',m.data);
      else if(m.k==='rst'||m.k==='fin')this._closeConn(c,false);
    }
  };
  // 누가 나갔는지: 주인 허브에서는 손님이, 손님 허브에서는 주인(같은 실행 inst)이 사라지면 연결을 닫는다
  Peer.prototype._onPresence=function(h){
    var self=this;
    Object.keys(this._conns).forEach(function(cid){
      var c=self._conns[cid];if(!c||c._hub!==h||c._closed)return;
      if(h.owner){
        // syn 이 presence 보다 먼저 올 수 있어서, 한 번이라도 보인 뒤 사라졌을 때만 닫는다
        var metas=present(h,c.peer);
        if(metas.length)c._seen=true;
        else if(c.open&&c._seen)self._closeConn(c,false);
      }else if(c.open){
        var om=present(h,h.id);
        if(!om.some(function(x){return x.inst===c._inst;}))self._closeConn(c,false);
      }
    });
  };
  Peer.prototype._dropHubConns=function(h){
    var self=this;
    Object.keys(this._conns).forEach(function(cid){var c=self._conns[cid];if(c&&c._hub===h)self._closeConn(c,false);});
  };
  Peer.prototype._synAll=function(h){
    var self=this;
    Object.keys(this._conns).forEach(function(cid){var c=self._conns[cid];if(c&&c._hub===h&&!c.open&&!c._closed)self._syn(c);});
  };
  // 손님: 주인이 답할 때까지 syn 을 보낸다. 주인이 허브에 없으면 'peer-unavailable'(PeerJS 와 같음)
  Peer.prototype._syn=function(c){
    var self=this,h=c._hub,t0=Date.now();
    (function tick(){
      if(c.open||c._closed||self.destroyed)return;
      if(!present(h,h.id).length&&Date.now()-t0>UNAVAILABLE_MS){
        self._closeConn(c,false,true);
        self._fail('peer-unavailable','방을 찾지 못함: '+h.id);
        return;
      }
      self._send(h,{k:'syn',cid:c.connectionId,to:h.id});
      c._synTimer=later(tick,SYN_EVERY);
    })();
  };

  Peer.prototype.connect=function(remoteId){
    if(this.destroyed)return null;
    remoteId=String(remoteId);
    var self=this,cid='c'+rid();
    var h=this._hubs[remoteId]||null;
    var c=new Conn(this,cid,remoteId,h,true);this._conns[cid]=c;
    var go=function(){
      if(c._closed||self.destroyed)return;
      h=self._joinHub(remoteId,false);c._hub=h;
      if(h.subscribed)self._syn(c);   // 아직이면 SUBSCRIBED 때 _synAll 이 보낸다
    };
    if(this._client)go();else later(function wait(){if(self._client)go();else if(!self.destroyed&&!c._closed)later(wait,100);},0);
    return c;
  };
  Peer.prototype._closeConn=function(c,tell,silent){
    if(!c||c._closed)return;
    var wasOpen=c.open;
    c._closed=true;c.open=false;clearTimeout(c._synTimer);
    delete this._conns[c.connectionId];
    if(tell&&c._hub)this._send(c._hub,{k:'fin',cid:c.connectionId,to:c._out?c._hub.id:c.peer});
    // 남의 허브에 더 쓸 연결이 없으면 나온다
    var h=c._hub,self=this;
    if(h&&!h.owner&&!Object.keys(this._conns).some(function(k){return self._conns[k]._hub===h;})){
      delete this._hubs[h.id];
      later(function(){try{self._client.removeChannel(h.ch);}catch(e){}},tell?300:0);
    }
    if(!silent||wasOpen)c.emit('close');
  };
  Peer.prototype.reconnect=function(){
    if(this.destroyed||!this._client)return;
    var h=this._hubs[this.id];
    if(h&&h.subscribed)return;
    if(h){delete this._hubs[this.id];try{this._client.removeChannel(h.ch);}catch(e){}}
    this._joinHub(this.id,true);
  };
  Peer.prototype.disconnect=function(){};
  Peer.prototype.destroy=function(){
    if(this.destroyed)return;
    var self=this;
    Object.keys(this._conns).forEach(function(cid){self._closeConn(self._conns[cid],true);});
    this.destroyed=true;this.open=false;this.disconnected=true;
    var cl=this._client;
    later(function(){try{cl&&cl.removeAllChannels();}catch(e){}try{cl&&cl.realtime.disconnect();}catch(e){}},300);
    this.emit('close');
  };

  // 지금 실제로 열려 있는 친구 연결 수(게임 모음 팝업이 '친구와 연결된 방' 안내를 띄울지 정할 때 쓴다)
  var ALL=[];
  var _start=Peer.prototype._start;
  Peer.prototype._start=function(){ALL=ALL.filter(function(x){return !x.destroyed;});ALL.push(this);return _start.call(this);};
  Peer.openCount=function(){
    return ALL.reduce(function(n,p){if(p.destroyed)return n;return n+Object.keys(p._conns).filter(function(k){return p._conns[k].open;}).length;},0);
  };
  window.Peer=Peer;
  window.SolsolPeer=Peer;
})();
