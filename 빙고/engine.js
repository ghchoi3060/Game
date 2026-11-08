function BingoEngine(){
  'use strict';
  // 판: 칸 i = 줄*5 + 칸, 값은 1~25(배치 중에는 0). 부른 숫자에 해당하는 칸이 표시된다
  var LINES=[],i,k;
  for(i=0;i<5;i++){var r=[],c=[];for(k=0;k<5;k++){r.push(i*5+k);c.push(k*5+i);}LINES.push(r,c);}
  LINES.push([0,6,12,18,24],[4,8,12,16,20]);
  var CELL_LINES=[];for(i=0;i<25;i++)CELL_LINES.push(LINES.map(function(l,j){return l.indexOf(i)>=0?j:-1;}).filter(function(j){return j>=0;}));

  function shuffle(a){for(var j=a.length-1;j>0;j--){var t=Math.floor(Math.random()*(j+1)),v=a[j];a[j]=a[t];a[t]=v;}return a;}
  function randomBoard(){return shuffle(Array.from({length:25},function(_,j){return j+1;}));}
  function marks(board,called){var s={};called.forEach(function(n){s[n]=1;});return board.map(function(n){return !!s[n];});}
  // 완성된 줄 번호 목록
  function lines(board,called){
    var m=marks(board,called);
    return LINES.map(function(l,j){return l.every(function(p){return m[p];})?j:-1;}).filter(function(j){return j>=0;});
  }
  // 봇이 부를 숫자: 자기 판에서 줄을 많이 채우는 칸. level 0 쉬움(무작위) · 1 보통 · 2 어려움
  function botPick(board,called,level){
    var m=marks(board,called),avail=board.filter(function(n,p){return !m[p];});
    if(!avail.length)return 0;
    if(level===0||(level===1&&Math.random()<.4))return avail[Math.floor(Math.random()*avail.length)];
    var best=-1,pick=avail[0];
    avail.forEach(function(n){
      var p=board.indexOf(n),s=Math.random()*(level===2?.5:3);
      CELL_LINES[p].forEach(function(j){
        var got=LINES[j].filter(function(q){return m[q];}).length;
        s+=got===4?100:(got+1)*(got+1);
      });
      if(level===2&&p===12)s+=1.5;   // 가운데는 줄 4개가 지난다
      if(s>best){best=s;pick=n;}
    });
    return pick;
  }
  return {LINES:LINES,randomBoard:randomBoard,marks:marks,lines:lines,botPick:botPick,shuffle:shuffle};
}
if(typeof module!=='undefined')module.exports=BingoEngine;
