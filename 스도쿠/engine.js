function SudokuEngine(){
  'use strict';
  // 칸 번호 i = 줄*9 + 칸. 값 0 은 빈칸
  var ROW=[],COL=[],BOX=[],UNITS=[],PEERS=[],BITS=[],i,k,u;
  for(i=0;i<81;i++){ROW[i]=(i/9)|0;COL[i]=i%9;BOX[i]=((ROW[i]/3)|0)*3+((COL[i]/3)|0);}
  for(i=0;i<512;i++){var n=0,x=i;while(x){n+=x&1;x>>=1;}BITS[i]=n;}
  for(u=0;u<9;u++){
    var r=[],c=[],b=[],br=((u/3)|0)*3,bc=(u%3)*3;
    for(k=0;k<9;k++){r.push(u*9+k);c.push(k*9+u);b.push((br+((k/3)|0))*9+bc+k%3);}
    UNITS.push(r,c,b);
  }
  for(i=0;i<81;i++){
    var set={};
    for(k=0;k<81;k++)if(k!==i&&(ROW[k]===ROW[i]||COL[k]===COL[i]||BOX[k]===BOX[i]))set[k]=1;
    PEERS[i]=Object.keys(set).map(Number);
  }
  // 난이도: 남길 칸 수 목표와, 단순한 풀이(외길 수)만으로 풀려야 하는지
  var LEVELS={easy:{clues:38,singles:true},normal:{clues:30,singles:true},hard:{clues:27,singles:false},expert:{clues:17,singles:false}};

  function shuffle(a){for(var j=a.length-1;j>0;j--){var t=Math.floor(Math.random()*(j+1)),v=a[j];a[j]=a[t];a[t]=v;}return a;}

  // 해 개수 세기(limit 개에서 멈춤). 후보가 가장 적은 칸부터 채운다
  function solve(grid,limit,random){
    var g=grid.slice(),rm=[0,0,0,0,0,0,0,0,0],cm=rm.slice(),bm=rm.slice(),count=0,sol=null;
    for(var q=0;q<81;q++)if(g[q]){
      var bit=1<<(g[q]-1);
      if((rm[ROW[q]]|cm[COL[q]]|bm[BOX[q]])&bit)return {count:0,sol:null};
      rm[ROW[q]]|=bit;cm[COL[q]]|=bit;bm[BOX[q]]|=bit;
    }
    function dfs(){
      var best=-1,bestMask=0,bestN=10;
      for(var p=0;p<81;p++){
        if(g[p])continue;
        var m=~(rm[ROW[p]]|cm[COL[p]]|bm[BOX[p]])&511,nn=BITS[m];
        if(nn<bestN){bestN=nn;best=p;bestMask=m;if(nn===0)return false;if(nn===1)break;}
      }
      if(best<0){count++;if(!sol)sol=g.slice();return count>=limit;}
      var ds=[];for(var d=1;d<=9;d++)if(bestMask&(1<<(d-1)))ds.push(d);
      if(random)shuffle(ds);
      for(var j=0;j<ds.length;j++){
        var bt=1<<(ds[j]-1),R=ROW[best],C=COL[best],B=BOX[best];
        g[best]=ds[j];rm[R]|=bt;cm[C]|=bt;bm[B]|=bt;
        if(dfs())return true;
        rm[R]&=~bt;cm[C]&=~bt;bm[B]&=~bt;
      }
      g[best]=0;return false;
    }
    dfs();
    return {count:count,sol:sol};
  }

  function candidates(g,p){
    var m=0;for(var j=0;j<20;j++){var v=g[PEERS[p][j]];if(v)m|=1<<(v-1);}
    return ~m&511;
  }
  // 외길 수 하나 찾기: 후보가 하나뿐인 칸(naked) 또는 줄·칸·상자에서 그 숫자가 들어갈 곳이 하나뿐(hidden)
  function nextSingle(g){
    for(var p=0;p<81;p++)if(!g[p]){var m=candidates(g,p);if(BITS[m]===1)return {i:p,d:Math.log2(m)+1,why:'naked'};}
    for(var uu=0;uu<27;uu++){
      var unit=UNITS[uu];
      for(var d=1;d<=9;d++){
        var spot=-1,cnt=0,bt=1<<(d-1),have=false;
        for(var j=0;j<9;j++){var q=unit[j];if(g[q]===d){have=true;break;}if(!g[q]&&(candidates(g,q)&bt)){cnt++;spot=q;}}
        if(!have&&cnt===1)return {i:spot,d:d,why:'hidden',unit:uu};
      }
    }
    return null;
  }
  function singlesSolvable(grid){
    var g=grid.slice(),s;
    while((s=nextSingle(g)))g[s.i]=s.d;
    for(var p=0;p<81;p++)if(!g[p])return false;
    return true;
  }

  function generate(level){
    var L=LEVELS[level]||LEVELS.normal,tries=0,best=null;
    while(tries++<12){
      var sol=solve(new Array(81).fill(0),1,true).sol,puz=sol.slice(),left=81;
      // 가운데 대칭으로 두 칸씩 지운다
      var order=shuffle(Array.from({length:41},function(_,j){return j;}));
      for(var j=0;j<order.length&&left>L.clues;j++){
        var a=order[j],bb=80-a,va=puz[a],vb=puz[bb];
        puz[a]=0;puz[bb]=0;
        var ok=solve(puz,2,false).count===1&&(!L.singles||singlesSolvable(puz));
        if(ok)left-=a===bb?1:2;else{puz[a]=va;puz[bb]=vb;}
      }
      if(L.clues<22){
        // 고수: 대칭을 버리고 한 칸씩 더 지워 해가 하나인 한 최소로 만든다
        var cells=shuffle(Array.from({length:81},function(_,j){return j;}));
        for(j=0;j<81;j++){
          var p=cells[j],v=puz[p];if(!v)continue;
          puz[p]=0;
          if(solve(puz,2,false).count===1)left--;else puz[p]=v;
        }
      }
      var easyOnly=singlesSolvable(puz);
      var res={puzzle:puz,solution:sol,clues:left};
      if(L.singles||!easyOnly)return res;   // 어려움·고수는 외길 수만으로는 안 풀리는 문제
      best=best||res;
    }
    return best;
  }
  // 힌트: 사용자가 맞게 채운 칸만 보고 외길 수를 찾는다. 없으면 정답에서 빈칸 하나
  function hint(values,solution){
    var g=values.map(function(v,p){return v===solution[p]?v:0;}),s=nextSingle(g);
    if(s)return s;
    var empty=[];for(var p=0;p<81;p++)if(values[p]!==solution[p])empty.push(p);
    if(!empty.length)return null;
    var q=empty[Math.floor(Math.random()*empty.length)];
    return {i:q,d:solution[q],why:'guess'};
  }

  return {ROW:ROW,COL:COL,BOX:BOX,UNITS:UNITS,PEERS:PEERS,LEVELS:LEVELS,
    solve:solve,generate:generate,singlesSolvable:singlesSolvable,nextSingle:nextSingle,hint:hint,candidates:candidates};
}
if(typeof module!=='undefined')module.exports=SudokuEngine;
