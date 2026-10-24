function JanggiEngine(){
  'use strict';
  // 판: 10줄 × 9칸 = 90 교차점, sq = 줄*9 + 칸. 0줄이 한(위), 9줄이 초(아래). 초가 먼저 둔다
  var CHO=8,HAN=16,P=1,C=2,H=3,E=4,A=5,R=6,K=7;
  var VAL=[0,200,700,500,300,300,1300,0];
  var PTS=[0,2,7,5,3,3,13,0];          // 공식 점수. 한은 덤 1.5
  var LET=' pcheark';
  var NAME=['','졸','포','마','상','사','차','궁'];
  var FORMS={HEEH:'마상상마',EHHE:'상마마상',HEHE:'마상마상',EHEH:'상마상마'};
  var INF=1e9,MATE=1e6,LIMIT=200;
  var ROW=[],COL=[],s,i,j;
  for(s=0;s<90;s++){ROW[s]=(s/9)|0;COL[s]=s%9;}
  function at(r,c){return r>=0&&r<10&&c>=0&&c<9?r*9+c:-1;}
  function palace(sq){var r=ROW[sq],c=COL[sq];if(c<3||c>5)return 0;return r<=2?HAN:r>=7?CHO:0;}

  // ---------- 미리 계산한 이동표 ----------
  var ORTH=[],DRAY=[],DLINK=[],HM=[],EM=[],HREV=[],EREV=[],KA={},PM={},PREV={};
  var DIRS=[[-1,0],[1,0],[0,-1],[0,1]];
  for(s=0;s<90;s++){ORTH[s]=[];DRAY[s]=[];DLINK[s]=[];HM[s]=[];EM[s]=[];HREV[s]=[];EREV[s]=[];}
  for(s=0;s<90;s++){
    for(i=0;i<4;i++){
      var dr=DIRS[i][0],dc=DIRS[i][1],ray=[],x=at(ROW[s]+dr,COL[s]+dc);
      while(x>=0){ray.push(x);x=at(ROW[x]+dr,COL[x]+dc);}
      if(ray.length)ORTH[s].push(ray);
      var perp=dr?[[0,1],[0,-1]]:[[1,0],[-1,0]];
      for(j=0;j<2;j++){
        var pr=perp[j][0],pc=perp[j][1],r0=ROW[s],c0=COL[s];
        var leg=at(r0+dr,c0+dc),ht=at(r0+2*dr+pr,c0+2*dc+pc);
        if(leg>=0&&ht>=0){HM[s].push({l:leg,t:ht});HREV[ht].push({f:s,l:leg});}
        var l2=at(r0+2*dr+pr,c0+2*dc+pc),et=at(r0+3*dr+2*pr,c0+3*dc+2*pc);
        if(leg>=0&&l2>=0&&et>=0){EM[s].push({l1:leg,l2:l2,t:et});EREV[et].push({f:s,l1:leg,l2:l2});}
      }
    }
  }
  // 궁성 대각선: 꼭짓점 ↔ 가운데
  [[1,4],[8,4]].forEach(function(ct){
    var ctr=at(ct[0],ct[1]);
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){
      var k=at(ct[0]+d[0],ct[1]+d[1]),opp=at(ct[0]-d[0],ct[1]-d[1]);
      DLINK[ctr].push(k);DLINK[k].push(ctr);
      DRAY[k].push([ctr,opp]);DRAY[ctr].push([k]);
    });
  });
  [CHO,HAN].forEach(function(col){
    KA[col]=[];PM[col]=[];PREV[col]=[];
    var fr=col===CHO?-1:1,enemy=col^24;
    for(var q=0;q<90;q++){KA[col][q]=[];PM[col][q]=[];PREV[col][q]=[];}
    for(q=0;q<90;q++){
      if(palace(q)===col){
        for(var d=0;d<4;d++){var n=at(ROW[q]+DIRS[d][0],COL[q]+DIRS[d][1]);if(n>=0&&palace(n)===col)KA[col][q].push(n);}
        DLINK[q].forEach(function(n){KA[col][q].push(n);});
      }
      var steps=[at(ROW[q]+fr,COL[q]),at(ROW[q],COL[q]-1),at(ROW[q],COL[q]+1)];
      if(palace(q)===enemy)DLINK[q].forEach(function(n){if(ROW[n]===ROW[q]+fr)steps.push(n);});
      steps.forEach(function(n){if(n>=0){PM[col][q].push(n);PREV[col][n].push(q);}});
    }
  });
  var RAYS=[];for(s=0;s<90;s++)RAYS[s]=ORTH[s].concat(DRAY[s]);

  // ---------- 국면 ----------
  function sqName(sq){return 'abcdefghi'[COL[sq]]+ROW[sq];}
  function nameSq(n){return (+n[1])*9+'abcdefghi'.indexOf(n[0]);}
  function create(opt){
    var g={b:new Array(90).fill(0),turn:CHO,kings:[0,0],half:0,ply:0,hist:[]};
    if(typeof opt==='string')load(g,opt);else setup(g,opt||{});
    return g;
  }
  function put(g,r,c,p){var q=r*9+c;g.b[q]=p;if((p&7)===K)g.kings[(p&CHO)?0:1]=q;}
  function setup(g,o){
    var forms=[o.cho||'HEEH',o.han||'HEEH'];
    [CHO,HAN].forEach(function(col,k){
      var back=col===CHO?9:0,kr=col===CHO?8:1,cr=col===CHO?7:2,pr=col===CHO?6:3;
      // 상차림은 자기 쪽에서 본 왼쪽부터. 한은 판을 거꾸로 보므로 칸 순서가 뒤집힌다
      var cols=col===CHO?[1,2,6,7]:[7,6,2,1],f=forms[k];
      put(g,back,0,col|R);put(g,back,8,col|R);put(g,back,3,col|A);put(g,back,5,col|A);
      for(var n=0;n<4;n++)put(g,back,cols[n],col|(f[n]==='H'?H:E));
      put(g,kr,4,col|K);put(g,cr,1,col|C);put(g,cr,7,col|C);
      for(n=0;n<9;n+=2)put(g,pr,n,col|P);
    });
  }
  // 위치 문자열: 90칸(초 대문자, 한 소문자, 빈칸 .) + 차례 + 무잡기 수 + 전체 수
  function load(g,str){
    var parts=str.trim().split(/\s+/),b=parts[0];
    g.b.fill(0);
    for(var q=0;q<90;q++){
      var ch=b[q];if(ch==='.')continue;
      var lo=ch.toLowerCase(),t=LET.indexOf(lo);
      put(g,0,q,(ch===lo?HAN:CHO)|t);
    }
    g.turn=parts[1]==='h'?HAN:CHO;g.half=+(parts[2]||0);g.ply=+(parts[3]||0);g.hist=[];
  }
  function pos(g){
    var out='';
    for(var q=0;q<90;q++){var p=g.b[q];out+=p?((p&CHO)?LET[p&7].toUpperCase():LET[p&7]):'.';}
    return out+' '+(g.turn===CHO?'c':'h')+' '+g.half+' '+g.ply;
  }

  // ---------- 공격·수 생성 ----------
  function attacked(g,sq,by){
    var b=g.b,rays=RAYS[sq],n,x,q,k,screen;
    for(n=0;n<rays.length;n++){
      screen=false;
      for(k=0;k<rays[n].length;k++){
        x=rays[n][k];q=b[x];if(!q)continue;
        if(!screen){
          if(q===(by|R))return true;
          if((q&7)===C)break;   // 포는 포를 넘지 못한다
          screen=true;
          continue;
        }
        if(q===(by|C))return true;
        break;
      }
    }
    var hr=HREV[sq];for(n=0;n<hr.length;n++)if(b[hr[n].f]===(by|H)&&!b[hr[n].l])return true;
    var er=EREV[sq];for(n=0;n<er.length;n++)if(b[er[n].f]===(by|E)&&!b[er[n].l1]&&!b[er[n].l2])return true;
    var pv=PREV[by][sq];for(n=0;n<pv.length;n++)if(b[pv[n]]===(by|P))return true;
    if(palace(sq)===by){var ka=KA[by][sq];for(n=0;n<ka.length;n++){q=b[ka[n]];if(q===(by|A)||q===(by|K))return true;}}
    return false;
  }
  function mv(f,t,p,c){return {f:f,t:t,p:p,c:c};}
  function gen(g,caps){
    var b=g.b,us=g.turn,them=us^24,moves=[],sq,p,t,list,n,x,q,k,rays,jumped;
    for(sq=0;sq<90;sq++){
      p=b[sq];if(!p||!(p&us))continue;t=p&7;
      if(t===P||t===K||t===A){
        list=t===P?PM[us][sq]:KA[us][sq];
        for(n=0;n<list.length;n++){x=list[n];q=b[x];if(!q){if(!caps)moves.push(mv(sq,x,p,0));}else if(q&them)moves.push(mv(sq,x,p,q));}
      }else if(t===H){
        list=HM[sq];
        for(n=0;n<list.length;n++){if(b[list[n].l])continue;x=list[n].t;q=b[x];if(!q){if(!caps)moves.push(mv(sq,x,p,0));}else if(q&them)moves.push(mv(sq,x,p,q));}
      }else if(t===E){
        list=EM[sq];
        for(n=0;n<list.length;n++){if(b[list[n].l1]||b[list[n].l2])continue;x=list[n].t;q=b[x];if(!q){if(!caps)moves.push(mv(sq,x,p,0));}else if(q&them)moves.push(mv(sq,x,p,q));}
      }else if(t===R){
        rays=RAYS[sq];
        for(n=0;n<rays.length;n++)for(k=0;k<rays[n].length;k++){
          x=rays[n][k];q=b[x];
          if(!q){if(!caps)moves.push(mv(sq,x,p,0));continue;}
          if(q&them)moves.push(mv(sq,x,p,q));
          break;
        }
      }else if(t===C){
        // 포: 정확히 한 기물(포 제외)을 넘어야 움직인다. 포는 잡지 못한다
        rays=RAYS[sq];
        for(n=0;n<rays.length;n++){
          jumped=false;
          for(k=0;k<rays[n].length;k++){
            x=rays[n][k];q=b[x];
            if(!jumped){if(q){if((q&7)===C)break;jumped=true;}continue;}
            if(!q){if(!caps)moves.push(mv(sq,x,p,0));continue;}
            if((q&them)&&(q&7)!==C)moves.push(mv(sq,x,p,q));
            break;
          }
        }
      }
    }
    return moves;
  }
  function make(g,m){
    g.hist.push({m:m,half:g.half});
    g.b[m.t]=m.p;g.b[m.f]=0;
    if((m.p&7)===K)g.kings[g.turn===CHO?0:1]=m.t;
    g.half=m.c?0:g.half+1;g.ply++;
    g.turn^=24;
  }
  function unmake(g){
    var h=g.hist.pop(),m=h.m;g.turn^=24;
    g.b[m.f]=m.p;g.b[m.t]=m.c;
    if((m.p&7)===K)g.kings[g.turn===CHO?0:1]=m.f;
    g.half=h.half;g.ply--;
    return m;
  }
  function kingOf(g,col){return g.kings[col===CHO?0:1];}
  function inCheck(g){return attacked(g,kingOf(g,g.turn),g.turn^24);}
  function legal(g){
    var us=g.turn,res=[],all=gen(g,false);
    for(var n=0;n<all.length;n++){make(g,all[n]);if(!attacked(g,kingOf(g,us),us^24))res.push(all[n]);unmake(g);}
    return res;
  }

  // ---------- 평가 ----------
  function evaluate(g){
    var b=g.b,sq,p,t,v,score=0,count=0;
    for(sq=0;sq<90;sq++)if(b[sq])count++;
    for(sq=0;sq<90;sq++){
      p=b[sq];if(!p)continue;t=p&7;v=VAL[t];
      var cho=!!(p&CHO),adv=cho?6-ROW[sq]:ROW[sq]-3;
      if(t===P){v+=Math.max(0,adv)*12;if(palace(sq)===(cho?HAN:CHO))v+=25;if(COL[sq]===4)v+=6;}
      else if(t===H){if(COL[sq]===0||COL[sq]===8)v-=20;if(adv>0)v+=8;}
      else if(t===C){if(count<16)v-=(16-count)*15;}
      else if(t===R){if(adv>0)v+=10;}
      score+=cho?v:-v;
    }
    return g.turn===CHO?score:-score;
  }

  // ---------- 탐색 ----------
  var nodes=0,deadline=0,stop=false,canStop=false;
  function order(moves){
    for(var n=0;n<moves.length;n++){var m=moves[n];m.o=m.c?10000+10*VAL[m.c&7]-VAL[m.p&7]+((m.c&7)===K?50000:0):0;}
    moves.sort(function(a,b){return b.o-a.o;});
  }
  function tick(){nodes++;if(canStop&&(nodes&1023)===0&&Date.now()>deadline)stop=true;}
  function qsearch(g,alpha,beta,qd){
    tick();
    var stand=evaluate(g);
    if(stand>=beta)return stand;
    if(stand>alpha)alpha=stand;
    if(qd<=0)return alpha;
    var moves=gen(g,true),us=g.turn;order(moves);
    for(var n=0;n<moves.length;n++){
      make(g,moves[n]);
      if(attacked(g,kingOf(g,us),us^24)){unmake(g);continue;}
      var sc=-qsearch(g,-beta,-alpha,qd-1);unmake(g);
      if(stop)return 0;
      if(sc>=beta)return sc;
      if(sc>alpha)alpha=sc;
    }
    return alpha;
  }
  function ab(g,depth,alpha,beta,ply,useQ){
    var chk=inCheck(g);
    if(chk&&ply<20)depth++;
    if(depth<=0)return useQ?qsearch(g,alpha,beta,6):evaluate(g);
    tick();
    var us=g.turn,moves=gen(g,false),count=0,best=-INF;order(moves);
    for(var n=0;n<moves.length;n++){
      make(g,moves[n]);
      if(attacked(g,kingOf(g,us),us^24)){unmake(g);continue;}
      count++;
      var sc=-ab(g,depth-1,-beta,-alpha,ply+1,useQ);unmake(g);
      if(stop)return 0;
      if(sc>best)best=sc;
      if(sc>alpha)alpha=sc;
      if(alpha>=beta)break;
    }
    if(!count)return -MATE+ply;   // 둘 수가 없으면 진다(외통)
    return best;
  }
  // opts: {depth, q, noise, rnd, time}
  function bestMove(g,opts){
    var moves=legal(g),n,sc,m;
    if(!moves.length)return null;
    nodes=0;stop=false;canStop=false;deadline=Date.now()+(opts.time||60000);
    if(opts.rnd&&Math.random()<opts.rnd)return moves[Math.floor(Math.random()*moves.length)];
    order(moves);
    if(opts.noise>0){
      var bestM=moves[0],bestS=-INF;
      for(n=0;n<moves.length;n++){
        make(g,moves[n]);sc=-ab(g,opts.depth-1,-INF,INF,1,opts.q);unmake(g);
        sc+=(Math.random()*2-1)*opts.noise;
        if(sc>bestS){bestS=sc;bestM=moves[n];}
      }
      return bestM;
    }
    var best=moves[0];
    for(var d=1;d<=opts.depth;d++){
      canStop=d>1;
      var alpha=-INF,curBest=null,curScore=-INF;
      for(n=0;n<moves.length;n++){
        m=moves[n];make(g,m);sc=-ab(g,d-1,-INF,-alpha,1,opts.q);unmake(g);
        if(stop)break;
        if(sc>curScore){curScore=sc;curBest=m;}
        if(sc>alpha)alpha=sc;
      }
      if(curBest)best=curBest;
      if(stop)break;
      moves.splice(moves.indexOf(best),1);moves.unshift(best);
      if(Math.abs(curScore)>MATE-100)break;
      if(Date.now()>deadline)break;
    }
    return best;
  }

  // ---------- 기보·점수 ----------
  // 줄은 위(한 쪽)부터 1~9, 열 번째 줄은 0. 칸은 왼쪽부터 1~9. 예) 79마67
  function coord(sq){return ''+((ROW[sq]+1)%10)+(COL[sq]+1);}
  function notation(g,m){
    var s=coord(m.f)+NAME[m.p&7]+coord(m.t);
    make(g,m);if(inCheck(g))s+=legal(g).length?' 장':' 외통';unmake(g);
    return s;
  }
  function points(g){
    var pt={cho:0,han:1.5};
    for(var sq=0;sq<90;sq++){var p=g.b[sq];if(p)pt[(p&CHO)?'cho':'han']+=PTS[p&7];}
    return pt;
  }
  function perft(g,d){
    if(d===0)return 1;
    var ms=legal(g),n=0;
    if(d===1)return ms.length;
    for(var k=0;k<ms.length;k++){make(g,ms[k]);n+=perft(g,d-1);unmake(g);}
    return n;
  }

  return {CHO:CHO,HAN:HAN,P:P,C:C,H:H,E:E,A:A,R:R,K:K,LIMIT:LIMIT,FORMS:FORMS,PTS:PTS,
    ROW:ROW,COL:COL,create:create,pos:pos,legal:legal,make:make,unmake:unmake,inCheck:inCheck,
    kingOf:kingOf,attacked:attacked,palace:palace,bestMove:bestMove,notation:notation,points:points,perft:perft,
    sqName:sqName,nameSq:nameSq,evaluate:evaluate,stats:function(){return nodes;}};
}
if(typeof module!=='undefined')module.exports=JanggiEngine;
