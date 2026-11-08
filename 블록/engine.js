function BlockEngine(){
  'use strict';
  // 판: 8×8, 칸 i = 줄*8 + 칸, 값 0 은 빈칸·1~7 은 블록 색
  var N=8;
  // [모양(줄, 칸) 목록, 나올 확률 가중치]
  var SHAPES=[
    [[[0,0]],2],
    [[[0,0],[0,1]],3],[[[0,0],[1,0]],3],
    [[[0,0],[0,1],[0,2]],3],[[[0,0],[1,0],[2,0]],3],
    [[[0,0],[0,1],[0,2],[0,3]],2],[[[0,0],[1,0],[2,0],[3,0]],2],
    [[[0,0],[0,1],[0,2],[0,3],[0,4]],1],[[[0,0],[1,0],[2,0],[3,0],[4,0]],1],
    [[[0,0],[0,1],[1,0],[1,1]],3],
    [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],1],
    [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],1],[[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],1],
    [[[0,0],[1,0],[1,1]],2],[[[0,0],[0,1],[1,0]],2],[[[0,0],[0,1],[1,1]],2],[[[0,1],[1,0],[1,1]],2],
    [[[0,0],[1,0],[2,0],[2,1]],1],[[[0,1],[1,1],[2,1],[2,0]],1],[[[0,0],[0,1],[1,0],[2,0]],1],[[[0,0],[0,1],[1,1],[2,1]],1],
    [[[0,0],[0,1],[0,2],[1,0]],1],[[[0,0],[0,1],[0,2],[1,2]],1],[[[0,0],[1,0],[1,1],[1,2]],1],[[[0,2],[1,0],[1,1],[1,2]],1],
    [[[0,0],[0,1],[0,2],[1,1]],1],[[[0,1],[1,0],[1,1],[1,2]],1],[[[0,0],[1,0],[1,1],[2,0]],1],[[[0,1],[1,0],[1,1],[2,1]],1],
    [[[0,1],[0,2],[1,0],[1,1]],1],[[[0,0],[0,1],[1,1],[1,2]],1],[[[0,0],[1,0],[1,1],[2,1]],1],[[[0,1],[1,0],[1,1],[2,0]],1],
    [[[0,0],[1,0],[2,0],[2,1],[2,2]],1],[[[0,0],[0,1],[0,2],[1,0],[2,0]],1],[[[0,0],[0,1],[0,2],[1,2],[2,2]],1],[[[0,2],[1,2],[2,0],[2,1],[2,2]],1]
  ];
  var TOTAL=SHAPES.reduce(function(s,x){return s+x[1];},0);

  // 같은 씨앗(seed)이면 같은 블록이 같은 순서로 나온다 → 친구 대전에서 두 사람이 공정하게
  function rng(seed){
    var a=seed>>>0;
    return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
  }
  function pick(r){
    var x=r()*TOTAL,s=0;
    for(var k=0;k<SHAPES.length;k++){x-=SHAPES[k][1];if(x<0){s=k;break;}}
    return {s:s,color:1+Math.floor(r()*7)};
  }
  // round 번째 묶음(블록 3개). 판 상태와 상관없이 씨앗과 순번만으로 정해진다
  function tray(seed,round){var r=rng(((seed>>>0)^Math.imul(round+1,0x9E3779B1))>>>0);r();return [pick(r),pick(r),pick(r)];}
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
  return {N:N,SHAPES:SHAPES,rng:rng,tray:tray,cells:cells,size:size,fits:fits,anyFit:anyFit,fullLines:fullLines,lineCells:lineCells,place:place};
}
if(typeof module!=='undefined')module.exports=BlockEngine;
