function MineEngine(){
  'use strict';
  // 폰 세로 화면에 맞춘 크기. 지뢰 비율은 고전 지뢰찾기(초급 12%, 중급 16%, 고급 21%)와 비슷하게
  var LEVELS={easy:{w:9,h:9,m:10},normal:{w:12,h:16,m:30},hard:{w:12,h:20,m:50}};

  function neighbors(w,h){
    var nb=[];
    for(var i=0;i<w*h;i++){
      var r=(i/w)|0,c=i%w,list=[];
      for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){
        if(!dr&&!dc)continue;
        var rr=r+dr,cc=c+dc;
        if(rr>=0&&rr<h&&cc>=0&&cc<w)list.push(rr*w+cc);
      }
      nb.push(list);
    }
    return nb;
  }
  function shuffle(a){for(var j=a.length-1;j>0;j--){var t=Math.floor(Math.random()*(j+1)),v=a[j];a[j]=a[t];a[t]=v;}return a;}

  // 첫 칸과 그 주변 8칸은 지뢰를 두지 않는다(첫 탭에 넓게 열리도록)
  function layMines(w,h,m,first,nb){
    var safe={};safe[first]=1;nb[first].forEach(function(p){safe[p]=1;});
    var pool=[];for(var i=0;i<w*h;i++)if(!safe[i])pool.push(i);
    shuffle(pool);
    var mine=new Array(w*h).fill(false);
    for(i=0;i<m&&i<pool.length;i++)mine[pool[i]]=true;
    return mine;
  }
  function counts(mine,nb){
    return mine.map(function(_,i){var n=0;nb[i].forEach(function(p){if(mine[p])n++;});return n;});
  }

  // 사람이 찍지 않고 논리로만 풀 수 있는지: 단일 칸 규칙 + 두 칸 부분집합 규칙 + 남은 지뢰 수
  function solvable(w,h,m,mine,num,first,nb){
    var N=w*h,open=new Array(N).fill(false),flag=new Array(N).fill(false),opened=0,flags=0;
    function reveal(i){
      var st=[i];
      while(st.length){
        var p=st.pop();if(open[p]||flag[p])continue;
        if(mine[p])return false;
        open[p]=true;opened++;
        if(num[p]===0)nb[p].forEach(function(q){if(!open[q])st.push(q);});
      }
      return true;
    }
    reveal(first);
    var progress=true;
    while(progress&&opened<N-m){
      progress=false;
      var info=[];
      for(var i=0;i<N;i++){
        if(!open[i]||!num[i])continue;
        var unk=[],f=0;
        nb[i].forEach(function(q){if(flag[q])f++;else if(!open[q])unk.push(q);});
        if(!unk.length)continue;
        var need=num[i]-f;
        if(need===0){unk.forEach(function(q){reveal(q);});progress=true;}
        else if(need===unk.length){unk.forEach(function(q){if(!flag[q]){flag[q]=true;flags++;}});progress=true;}
        else info.push({u:unk,n:need});
      }
      if(progress)continue;
      // 부분집합: A ⊂ B 이면 B−A 에 (nB − nA) 개
      for(var a=0;a<info.length&&!progress;a++)for(var b=0;b<info.length&&!progress;b++){
        if(a===b)continue;
        var A=info[a],B=info[b];
        if(A.u.length>=B.u.length)continue;
        if(!A.u.every(function(q){return B.u.indexOf(q)>=0;}))continue;
        var rest=B.u.filter(function(q){return A.u.indexOf(q)<0;}),d=B.n-A.n;
        if(d===0){rest.forEach(function(q){reveal(q);});progress=true;}
        else if(d===rest.length){rest.forEach(function(q){if(!flag[q]){flag[q]=true;flags++;}});progress=true;}
      }
      if(progress)continue;
      // 남은 지뢰 수로 끝내기
      var unknown=[];for(i=0;i<N;i++)if(!open[i]&&!flag[i])unknown.push(i);
      if(flags===m){unknown.forEach(function(q){reveal(q);});progress=unknown.length>0;}
      else if(m-flags===unknown.length){unknown.forEach(function(q){flag[q]=true;flags++;});progress=true;}
    }
    return opened===N-m;
  }

  // noGuess 이면 시간 안에서 여러 판을 만들어 보고 논리로 풀리는 판을 고른다
  function generate(level,first,noGuess,budgetMs){
    var L=LEVELS[level]||LEVELS.easy,nb=neighbors(L.w,L.h),t0=Date.now(),tries=0,mine,num;
    do{
      tries++;
      mine=layMines(L.w,L.h,L.m,first,nb);num=counts(mine,nb);
      if(!noGuess||solvable(L.w,L.h,L.m,mine,num,first,nb))return {w:L.w,h:L.h,m:L.m,mine:mine,num:num,tries:tries,noGuess:!!noGuess};
    }while(Date.now()-t0<(budgetMs||1500));
    return {w:L.w,h:L.h,m:L.m,mine:mine,num:num,tries:tries,noGuess:false};
  }

  return {LEVELS:LEVELS,neighbors:neighbors,generate:generate,solvable:solvable,counts:counts};
}
if(typeof module!=='undefined')module.exports=MineEngine;
