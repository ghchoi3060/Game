function BlockEngine(){
  'use strict';
  // 판: 8×8, 칸 i = 줄*8 + 칸, 값 0 은 빈칸·1~7 은 블록 색
  var N=8;
  // 블록 모양·순서가 바뀌면 올린다(친구 대전에서 두 사람이 같은 버전인지 확인)
  var VERSION=4;
  // [모양(줄, 칸) 목록, 나올 확률 가중치]. 모양 묶음마다 합이 비슷하도록 방향이 많은 모양은 가중치를 나눴다
  var SHAPES=[
    [[[0,0]],1],
    [[[0,0],[0,1]],2],[[[0,0],[1,0]],2],
    [[[0,0],[0,1],[0,2]],2],[[[0,0],[1,0],[2,0]],2],
    [[[0,0],[0,1],[0,2],[0,3]],1.5],[[[0,0],[1,0],[2,0],[3,0]],1.5],
    [[[0,0],[0,1],[0,2],[0,3],[0,4]],1],[[[0,0],[1,0],[2,0],[3,0],[4,0]],1],
    [[[0,0],[0,1],[1,0],[1,1]],2],
    // 대각선 2·3칸
    [[[0,0],[1,1]],1],[[[0,1],[1,0]],1],
    [[[0,0],[1,1],[2,2]],.75],[[[0,2],[1,1],[2,0]],.75],
    // 십자
    [[[0,1],[1,0],[1,1],[1,2],[2,1]],1.5],
    // U자
    [[[0,0],[0,2],[1,0],[1,1],[1,2]],.5],[[[0,0],[0,1],[0,2],[1,0],[1,2]],.5],[[[0,0],[0,1],[1,0],[2,0],[2,1]],.5],[[[0,0],[0,1],[1,1],[2,1],[2,0]],.5],
    // 큰 T자
    [[[0,0],[0,1],[0,2],[1,1],[2,1]],.5],[[[0,1],[1,1],[2,0],[2,1],[2,2]],.5],[[[0,0],[1,0],[1,1],[1,2],[2,0]],.5],[[[0,2],[1,0],[1,1],[1,2],[2,2]],.5],
    // 계단(W)
    [[[0,0],[1,0],[1,1],[2,1],[2,2]],.5],[[[0,2],[1,2],[1,1],[2,1],[2,0]],.5],[[[0,0],[0,1],[1,1],[1,2],[2,2]],.5],[[[0,2],[0,1],[1,1],[1,0],[2,0]],.5],
    // 긴 L자(4칸 + 1)
    [[[0,0],[1,0],[2,0],[3,0],[3,1]],.25],[[[0,1],[1,1],[2,1],[3,1],[3,0]],.25],[[[0,0],[0,1],[1,0],[2,0],[3,0]],.25],[[[0,0],[0,1],[1,1],[2,1],[3,1]],.25],
    [[[0,0],[0,1],[0,2],[0,3],[1,0]],.25],[[[0,0],[0,1],[0,2],[0,3],[1,3]],.25],[[[0,0],[1,0],[1,1],[1,2],[1,3]],.25],[[[0,3],[1,0],[1,1],[1,2],[1,3]],.25],
    [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],1],
    [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],1],[[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],1],
    [[[0,0],[1,0],[1,1]],2],[[[0,0],[0,1],[1,0]],2],[[[0,0],[0,1],[1,1]],2],[[[0,1],[1,0],[1,1]],2],
    [[[0,0],[1,0],[2,0],[2,1]],1],[[[0,1],[1,1],[2,1],[2,0]],1],[[[0,0],[0,1],[1,0],[2,0]],1],[[[0,0],[0,1],[1,1],[2,1]],1],
    [[[0,0],[0,1],[0,2],[1,0]],1],[[[0,0],[0,1],[0,2],[1,2]],1],[[[0,0],[1,0],[1,1],[1,2]],1],[[[0,2],[1,0],[1,1],[1,2]],1],
    [[[0,0],[0,1],[0,2],[1,1]],1],[[[0,1],[1,0],[1,1],[1,2]],1],[[[0,0],[1,0],[1,1],[2,0]],1],[[[0,1],[1,0],[1,1],[2,1]],1],
    [[[0,1],[0,2],[1,0],[1,1]],1],[[[0,0],[0,1],[1,1],[1,2]],1],[[[0,0],[1,0],[1,1],[2,1]],1],[[[0,1],[1,0],[1,1],[2,0]],1],
    [[[0,0],[1,0],[2,0],[2,1],[2,2]],1],[[[0,0],[0,1],[0,2],[1,0],[2,0]],1],[[[0,0],[0,1],[0,2],[1,2],[2,2]],1],[[[0,2],[1,2],[2,0],[2,1],[2,2]],1]
  ];
  // 난이도별 가중치 배율(블록 칸 수 기준). 초급은 작은 블록이 많고, 고급은 큰 블록이 많다
  // 칸끼리 변으로 이어진 모양인지(대각선 블록은 끼워 넣기 어려워서 초급에서 드물게)
  function connected(c){
    var seen={},st=[c[0]],n=0,has={};c.forEach(function(x){has[x[0]+','+x[1]]=1;});
    while(st.length){var x=st.pop(),k=x[0]+','+x[1];if(seen[k])continue;seen[k]=1;n++;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var kk=(x[0]+d[0])+','+(x[1]+d[1]);if(has[kk]&&!seen[kk])st.push([x[0]+d[0],x[1]+d[1]]);});}
    return n===c.length;
  }
  var LEVEL_MULT={
    easy:function(n,con){return (n<=2?3:n===3?2.5:n===4?.8:n===5?.12:.05)*(con?1:.3);},
    normal:function(){return 1;},
    hard:function(n){return n<=2?.5:n===3?.8:n===4?1:n===5?1.6:2;}
  };
  var W={},TOT={};
  Object.keys(LEVEL_MULT).forEach(function(lv){W[lv]=SHAPES.map(function(s){return s[1]*LEVEL_MULT[lv](s[0].length,connected(s[0]));});TOT[lv]=W[lv].reduce(function(a,b){return a+b;},0);});

  // 같은 씨앗(seed)이면 같은 블록이 같은 순서로 나온다 → 친구 대전에서 두 사람이 공정하게
  function rng(seed){
    var a=seed>>>0;
    return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
  }
  function pick(r,level){
    var w=W[level]||W.normal,x=r()*(TOT[level]||TOT.normal),s=0;
    for(var k=0;k<SHAPES.length;k++){x-=w[k];if(x<0){s=k;break;}}
    return {s:s,color:1+Math.floor(r()*7)};
  }
  // round 번째 묶음(블록 3개). 판 상태와 상관없이 씨앗과 순번만으로 정해진다
  // 한 묶음 3개는 서로 다른 모양
  function trayRaw(seed,round,level,salt){
    var r=rng(((seed>>>0)^Math.imul(round+1,0x9E3779B1)^Math.imul(salt||0,0x85EBCA6B))>>>0),out=[],tries=0;r();
    while(out.length<3){var p=pick(r,level);if(tries++>30||!out.some(function(x){return x.s===p.s;}))out.push(p);}
    return out;
  }
  function tray(seed,round,level){return trayRaw(seed,round,level||'normal',0);}
  // 이 블록을 지금 판 어딘가에 놓아 줄을 지울 수 있는지
  function canClear(board,p){
    var c=cells(p);
    for(var r0=0;r0<N;r0++)for(var c0=0;c0<N;c0++){
      if(!fits(board,p,r0,c0))continue;
      var b=board.slice();c.forEach(function(x){b[(r0+x[0])*N+c0+x[1]]=1;});
      var l=fullLines(b);if(l.rows.length||l.cols.length)return true;
    }
    return false;
  }
  // 초급 혼자 하기 도움: 3개 모두 지금 판에 놓을 수 있고, 하나는 줄을 지울 수 있는 묶음이 나올 때까지 다시 뽑는다
  // (판에 따라 달라지므로 친구 대전에는 쓰지 않는다)
  function helpfulTray(seed,round,level,board){
    var best=null,bestS=-1,empty=board.every(function(v){return !v;});
    for(var k=0;k<40;k++){
      var t=trayRaw(seed,round,level,k),n=t.filter(function(p){return anyFit(board,p);}).length;
      var cl=!empty&&t.some(function(p){return canClear(board,p);});
      var s=n*10+(cl?5:0);
      if(n===3&&(cl||empty))return t;
      if(s>bestS){bestS=s;best=t;}
    }
    return best;
  }
  // 구조 블록: 놓을 곳이 없을 때 판에 들어가는 작은 블록 3개(줄을 지울 수 있는 것부터)
  function rescueTray(board){
    var cand=[];
    SHAPES.forEach(function(s,k){
      if(s[0].length>3||!connected(s[0]))return;
      var p={s:k,color:1+Math.floor(Math.random()*7)};
      if(anyFit(board,p))cand.push({p:p,cl:canClear(board,p),n:s[0].length,r:Math.random()});
    });
    cand.sort(function(a,b){return (b.cl-a.cl)||(b.n-a.n)||(a.r-b.r);});
    var out=cand.slice(0,3).map(function(x){return x.p;});
    while(out.length<3)out.push({s:0,color:1+Math.floor(Math.random()*7)});
    return out;
  }
  function cells(p){return SHAPES[p.s][0];}
  function size(p){var c=cells(p),h=0,w=0;c.forEach(function(x){h=Math.max(h,x[0]+1);w=Math.max(w,x[1]+1);});return {h:h,w:w};}

  function fits(board,p,r0,c0){
    var c=cells(p);
    for(var k=0;k<c.length;k++){
      var r=r0+c[k][0],cc=c0+c[k][1];
      if(r<0||r>=N||cc<0||cc>=N||board[r*N+cc])return false;
    }
    return true;
  }
  function anyFit(board,p){for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(fits(board,p,r,c))return true;return false;}
  // 놓았을 때 꽉 차는 줄·칸(미리 보기·실제 지우기 둘 다)
  function fullLines(board){
    var rows=[],cols=[],r,c,ok;
    for(r=0;r<N;r++){ok=true;for(c=0;c<N;c++)if(!board[r*N+c]){ok=false;break;}if(ok)rows.push(r);}
    for(c=0;c<N;c++){ok=true;for(r=0;r<N;r++)if(!board[r*N+c]){ok=false;break;}if(ok)cols.push(c);}
    return {rows:rows,cols:cols};
  }
  function lineCells(l){
    var s={};
    l.rows.forEach(function(r){for(var c=0;c<N;c++)s[r*N+c]=1;});
    l.cols.forEach(function(c){for(var r=0;r<N;r++)s[r*N+c]=1;});
    return Object.keys(s).map(Number);
  }
  // 블록을 놓고 줄을 지운다. combo: 연속으로 지운 횟수, miss: 못 지우고 놓은 횟수
  // 점수 = 놓은 칸 수 + 줄 보너스(1줄 10, 2줄 30, 3줄 60, 4줄 100 …) × 콤보, 판을 다 비우면 +300
  function place(state,p,r0,c0){
    var b=state.board.slice(),c=cells(p),placed=[];
    c.forEach(function(x){var i=(r0+x[0])*N+c0+x[1];b[i]=p.color;placed.push(i);});
    var l=fullLines(b),lines=l.rows.length+l.cols.length,cleared=lineCells(l);
    var combo=state.combo,miss=state.miss,gain=c.length,bonus=0,perfect=false;
    if(lines){
      combo+=1;miss=0;
      bonus=10*lines*(lines+1)/2*combo;
      cleared.forEach(function(i){b[i]=0;});
      if(b.every(function(v){return !v;})){perfect=true;bonus+=300;}
    }else{miss+=1;if(miss>=3)combo=0;}
    gain+=bonus;
    return {board:b,placed:placed,cleared:cleared,lines:lines,rows:l.rows,cols:l.cols,combo:combo,miss:miss,gain:gain,bonus:bonus,perfect:perfect};
  }
  return {VERSION:VERSION,N:N,SHAPES:SHAPES,rng:rng,tray:tray,helpfulTray:helpfulTray,rescueTray:rescueTray,canClear:canClear,cells:cells,size:size,fits:fits,anyFit:anyFit,fullLines:fullLines,lineCells:lineCells,place:place};
}
if(typeof module!=='undefined')module.exports=BlockEngine;
