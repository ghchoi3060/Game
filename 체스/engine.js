function ChessEngine(){
  'use strict';
  var WHITE=8,BLACK=16,P=1,N=2,B=3,R=4,Q=5,K=6;
  var FL_BIG=1,FL_EP=2,FL_K=3,FL_Q=4;
  var NO=[-33,-31,-18,-14,14,18,31,33],BO=[-17,-15,15,17],RO=[-16,-1,1,16],KO=[-17,-16,-15,-1,1,15,16,17];
  var VAL=[0,100,320,330,500,900,0];
  var START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var CH={p:P,n:N,b:B,r:R,q:Q,k:K};
  var LET=' pnbrqk';
  var INF=1e9,MATE=1e6;
  var CR=new Array(128).fill(15);
  CR[112]=13;CR[119]=14;CR[116]=12;CR[0]=7;CR[7]=11;CR[4]=3;

  var PST=[null,
   [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
   [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
   [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
   [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
   [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
   [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
  ];
  var KEND=[-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50];

  function sqName(s){return 'abcdefgh'[s&7]+(8-(s>>4));}
  function nameSq(n){return (8-(+n[1]))*16+'abcdefgh'.indexOf(n[0]);}

  function create(fen){
    var g={b:new Array(128).fill(0),turn:WHITE,castle:0,ep:-1,half:0,full:1,kings:[0,0],hist:[]};
    load(g,fen||START);return g;
  }
  function load(g,fen){
    var parts=fen.trim().split(/\s+/),row=0,col=0,i,ch,lower,color;
    g.b.fill(0);
    for(i=0;i<parts[0].length;i++){
      ch=parts[0][i];
      if(ch==='/'){row++;col=0;continue;}
      if(ch>='1'&&ch<='8'){col+=+ch;continue;}
      lower=ch.toLowerCase();color=ch===lower?BLACK:WHITE;
      g.b[row*16+col]=color|CH[lower];
      if(CH[lower]===K)g.kings[color>>4]=row*16+col;
      col++;
    }
    g.turn=parts[1]==='b'?BLACK:WHITE;
    var c=parts[2]||'-';g.castle=0;
    if(c.indexOf('K')>=0)g.castle|=1;if(c.indexOf('Q')>=0)g.castle|=2;
    if(c.indexOf('k')>=0)g.castle|=4;if(c.indexOf('q')>=0)g.castle|=8;
    g.ep=(parts[3]&&parts[3]!=='-')?nameSq(parts[3]):-1;
    g.half=+(parts[4]||0);g.full=+(parts[5]||1);g.hist=[];
  }
  function fen(g){
    var out='',row,col,empty,p,ch;
    for(row=0;row<8;row++){
      empty=0;
      for(col=0;col<8;col++){
        p=g.b[row*16+col];
        if(!p){empty++;continue;}
        if(empty){out+=empty;empty=0;}
        ch=LET[p&7];out+=(p&WHITE)?ch.toUpperCase():ch;
      }
      if(empty)out+=empty;
      if(row<7)out+='/';
    }
    var c='';if(g.castle&1)c+='K';if(g.castle&2)c+='Q';if(g.castle&4)c+='k';if(g.castle&8)c+='q';
    return out+' '+(g.turn===WHITE?'w':'b')+' '+(c||'-')+' '+(g.ep>=0?sqName(g.ep):'-')+' '+g.half+' '+g.full;
  }

  function attacked(g,sq,by){
    var b=g.b,s,i,o,p;
    if(by===WHITE){s=sq+15;if(!(s&0x88)&&b[s]===(WHITE|P))return true;s=sq+17;if(!(s&0x88)&&b[s]===(WHITE|P))return true;}
    else{s=sq-15;if(!(s&0x88)&&b[s]===(BLACK|P))return true;s=sq-17;if(!(s&0x88)&&b[s]===(BLACK|P))return true;}
    for(i=0;i<8;i++){s=sq+NO[i];if(!(s&0x88)&&b[s]===(by|N))return true;}
    for(i=0;i<8;i++){s=sq+KO[i];if(!(s&0x88)&&b[s]===(by|K))return true;}
    for(i=0;i<4;i++){o=BO[i];s=sq+o;while(!(s&0x88)){p=b[s];if(p){if(p===(by|B)||p===(by|Q))return true;break;}s+=o;}}
    for(i=0;i<4;i++){o=RO[i];s=sq+o;while(!(s&0x88)){p=b[s];if(p){if(p===(by|R)||p===(by|Q))return true;break;}s+=o;}}
    return false;
  }

  function mv(f,t,p,c,pr,fl){return {f:f,t:t,p:p,c:c,pr:pr,fl:fl};}
  function addPromo(list,f,t,p,c,caps){
    list.push(mv(f,t,p,c,Q,0));
    if(!caps){list.push(mv(f,t,p,c,R,0));list.push(mv(f,t,p,c,B,0));list.push(mv(f,t,p,c,N,0));}
  }

  function gen(g,caps){
    var b=g.b,us=g.turn,them=us^24,moves=[];
    var dir=us===WHITE?-16:16,startRow=us===WHITE?6:1,promoRow=us===WHITE?0:7;
    for(var s=0;s<128;s++){
      if(s&0x88){s+=7;continue;}
      var p=b[s];if(!p||!(p&us))continue;
      var t=p&7,i,x,q,o,offs;
      if(t===P){
        var one=s+dir;
        if(!(one&0x88)&&!b[one]){
          if((one>>4)===promoRow)addPromo(moves,s,one,p,0,caps);
          else if(!caps){
            moves.push(mv(s,one,p,0,0,0));
            if((s>>4)===startRow&&!b[one+dir])moves.push(mv(s,one+dir,p,0,0,FL_BIG));
          }
        }
        for(i=-1;i<=1;i+=2){
          x=s+dir+i;if(x&0x88)continue;q=b[x];
          if(q&&(q&them)){if((x>>4)===promoRow)addPromo(moves,s,x,p,q,caps);else moves.push(mv(s,x,p,q,0,0));}
          else if(x===g.ep)moves.push(mv(s,x,p,them|P,0,FL_EP));
        }
      }else if(t===N||t===K){
        offs=t===N?NO:KO;
        for(i=0;i<8;i++){
          x=s+offs[i];if(x&0x88)continue;q=b[x];
          if(!q){if(!caps)moves.push(mv(s,x,p,0,0,0));}
          else if(q&them)moves.push(mv(s,x,p,q,0,0));
        }
        if(t===K&&!caps){
          var base=us===WHITE?112:0,ks=us===WHITE?1:4,qs=us===WHITE?2:8;
          if(s===base+4){
            if((g.castle&ks)&&b[base+7]===(us|R)&&!b[base+5]&&!b[base+6]&&!attacked(g,base+4,them)&&!attacked(g,base+5,them)&&!attacked(g,base+6,them))
              moves.push(mv(s,base+6,p,0,0,FL_K));
            if((g.castle&qs)&&b[base]===(us|R)&&!b[base+3]&&!b[base+2]&&!b[base+1]&&!attacked(g,base+4,them)&&!attacked(g,base+3,them)&&!attacked(g,base+2,them))
              moves.push(mv(s,base+2,p,0,0,FL_Q));
          }
        }
      }else{
        offs=t===B?BO:t===R?RO:KO;
        for(i=0;i<offs.length;i++){
          o=offs[i];x=s+o;
          while(!(x&0x88)){
            q=b[x];
            if(!q){if(!caps)moves.push(mv(s,x,p,0,0,0));}
            else{if(q&them)moves.push(mv(s,x,p,q,0,0));break;}
            x+=o;
          }
        }
      }
    }
    return moves;
  }

  function make(g,m){
    var b=g.b,us=g.turn;
    g.hist.push({m:m,castle:g.castle,ep:g.ep,half:g.half});
    b[m.t]=m.pr?(us|m.pr):m.p;b[m.f]=0;
    if(m.fl===FL_EP)b[m.t+(us===WHITE?16:-16)]=0;
    else if(m.fl===FL_K){b[m.f+1]=b[m.f+3];b[m.f+3]=0;}
    else if(m.fl===FL_Q){b[m.f-1]=b[m.f-4];b[m.f-4]=0;}
    if((m.p&7)===K)g.kings[us>>4]=m.t;
    g.castle&=CR[m.f]&CR[m.t];
    g.ep=m.fl===FL_BIG?(m.f+m.t)>>1:-1;
    g.half=((m.p&7)===P||m.c)?0:g.half+1;
    if(us===BLACK)g.full++;
    g.turn=us^24;
  }
  function unmake(g){
    var h=g.hist.pop(),m=h.m;g.turn^=24;
    var us=g.turn,b=g.b;
    b[m.f]=m.p;
    if(m.fl===FL_EP){b[m.t]=0;b[m.t+(us===WHITE?16:-16)]=m.c;}
    else b[m.t]=m.c;
    if(m.fl===FL_K){b[m.f+3]=b[m.f+1];b[m.f+1]=0;}
    else if(m.fl===FL_Q){b[m.f-4]=b[m.f-1];b[m.f-1]=0;}
    if((m.p&7)===K)g.kings[us>>4]=m.f;
    g.castle=h.castle;g.ep=h.ep;g.half=h.half;
    if(us===BLACK)g.full--;
    return m;
  }
  function inCheck(g){return attacked(g,g.kings[g.turn>>4],g.turn^24);}
  function legal(g){
    var us=g.turn,res=[],all=gen(g,false);
    for(var i=0;i<all.length;i++){make(g,all[i]);if(!attacked(g,g.kings[us>>4],us^24))res.push(all[i]);unmake(g);}
    return res;
  }

  function evaluate(g){
    var b=g.b,s,p,t,idx,score=0,npm=0,wk=g.kings[0],bk=g.kings[1];
    for(s=0;s<128;s++){
      if(s&0x88){s+=7;continue;}
      p=b[s];if(!p)continue;t=p&7;
      if(t!==P&&t!==K)npm+=VAL[t];
    }
    var endgame=npm<=2600;
    for(s=0;s<128;s++){
      if(s&0x88){s+=7;continue;}
      p=b[s];if(!p)continue;t=p&7;
      if(p&WHITE){idx=(s>>4)*8+(s&7);score+=VAL[t]+(t===K&&endgame?KEND[idx]:PST[t][idx]);}
      else{idx=(7-(s>>4))*8+(s&7);score-=VAL[t]+(t===K&&endgame?KEND[idx]:PST[t][idx]);}
    }
    if(endgame&&Math.abs(score)>300){
      // 이기는 쪽: 상대 킹을 구석으로 몰고 자기 킹을 붙인다
      var loser=score>0?bk:wk,winner=score>0?wk:bk;
      var lr=loser>>4,lc=loser&7;
      var cd=Math.max(3-lr,lr-4)+Math.max(3-lc,lc-4);
      var kd=Math.abs(lr-(winner>>4))+Math.abs(lc-(winner&7));
      var mop=cd*10+(14-kd)*4;
      score+=score>0?mop:-mop;
    }
    return g.turn===WHITE?score:-score;
  }

  var nodes=0,deadline=0,stop=false,canStop=false;
  function order(moves){
    for(var i=0;i<moves.length;i++){
      var m=moves[i];
      m.o=(m.c?10000+10*VAL[m.c&7]-VAL[m.p&7]:0)+(m.pr?9000:0);
    }
    moves.sort(function(a,b){return b.o-a.o;});
  }
  function tick(){
    nodes++;
    if(canStop&&(nodes&1023)===0&&Date.now()>deadline)stop=true;
  }
  function qsearch(g,alpha,beta,qd){
    tick();
    var stand=evaluate(g);
    if(stand>=beta)return stand;
    if(stand>alpha)alpha=stand;
    if(qd<=0)return alpha;
    var moves=gen(g,true),us=g.turn;order(moves);
    for(var i=0;i<moves.length;i++){
      make(g,moves[i]);
      if(attacked(g,g.kings[us>>4],us^24)){unmake(g);continue;}
      var sc=-qsearch(g,-beta,-alpha,qd-1);unmake(g);
      if(stop)return 0;
      if(sc>=beta)return sc;
      if(sc>alpha)alpha=sc;
    }
    return alpha;
  }
  function ab(g,depth,alpha,beta,ply,useQ){
    var chk=inCheck(g);
    if(chk&&ply<24)depth++;
    if(depth<=0)return useQ?qsearch(g,alpha,beta,8):evaluate(g);
    tick();
    if(g.half>=100)return 0;
    var us=g.turn,moves=gen(g,false),count=0,best=-INF;order(moves);
    for(var i=0;i<moves.length;i++){
      make(g,moves[i]);
      if(attacked(g,g.kings[us>>4],us^24)){unmake(g);continue;}
      count++;
      var sc=-ab(g,depth-1,-beta,-alpha,ply+1,useQ);unmake(g);
      if(stop)return 0;
      if(sc>best)best=sc;
      if(sc>alpha)alpha=sc;
      if(alpha>=beta)break;
    }
    if(!count)return chk?-MATE+ply:0;
    return best;
  }

  // opts: {depth, q, noise, rnd, time}
  function bestMove(g,opts){
    var moves=legal(g),i,sc,m;
    if(!moves.length)return null;
    nodes=0;stop=false;canStop=false;deadline=Date.now()+(opts.time||60000);
    if(opts.rnd&&Math.random()<opts.rnd)return moves[Math.floor(Math.random()*moves.length)];
    order(moves);
    if(opts.noise>0){
      var bestM=moves[0],bestS=-INF;
      for(i=0;i<moves.length;i++){
        make(g,moves[i]);sc=-ab(g,opts.depth-1,-INF,INF,1,opts.q);unmake(g);
        sc+=(Math.random()*2-1)*opts.noise;
        if(sc>bestS){bestS=sc;bestM=moves[i];}
      }
      return bestM;
    }
    var best=moves[0];
    for(var d=1;d<=opts.depth;d++){
      canStop=d>1;
      var alpha=-INF,curBest=null,curScore=-INF;
      for(i=0;i<moves.length;i++){
        m=moves[i];make(g,m);sc=-ab(g,d-1,-INF,-alpha,1,opts.q);unmake(g);
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

  function san(g,m){
    var s,t=m.p&7;
    if(m.fl===FL_K)s='O-O';
    else if(m.fl===FL_Q)s='O-O-O';
    else if(t===P){
      s=m.c?'abcdefgh'[m.f&7]+'x':'';s+=sqName(m.t);
      if(m.pr)s+='='+LET[m.pr].toUpperCase();
    }else{
      s=LET[t].toUpperCase();
      var others=legal(g).filter(function(o){return o.t===m.t&&o.p===m.p&&o.f!==m.f;});
      if(others.length){
        var sameFile=others.some(function(o){return (o.f&7)===(m.f&7);});
        var sameRank=others.some(function(o){return (o.f>>4)===(m.f>>4);});
        if(!sameFile)s+='abcdefgh'[m.f&7];
        else if(!sameRank)s+=(8-(m.f>>4));
        else s+=sqName(m.f);
      }
      if(m.c)s+='x';
      s+=sqName(m.t);
    }
    make(g,m);
    if(inCheck(g))s+=legal(g).length?'+':'#';
    unmake(g);
    return s;
  }
  function insufficient(g){
    var minors=0,s,t;
    for(s=0;s<128;s++){
      if(s&0x88){s+=7;continue;}
      t=g.b[s]&7;
      if(!t||t===K)continue;
      if(t===N||t===B)minors++;
      else return false;
    }
    return minors<=1;
  }
  function perft(g,d){
    if(d===0)return 1;
    var ms=legal(g),n=0;
    if(d===1)return ms.length;
    for(var i=0;i<ms.length;i++){make(g,ms[i]);n+=perft(g,d-1);unmake(g);}
    return n;
  }

  return {WHITE:WHITE,BLACK:BLACK,P:P,N:N,B:B,R:R,Q:Q,K:K,
    create:create,fen:fen,legal:legal,make:make,unmake:unmake,inCheck:inCheck,
    bestMove:bestMove,san:san,insufficient:insufficient,perft:perft,
    sqName:sqName,nameSq:nameSq,evaluate:evaluate,
    stats:function(){return nodes;}};
}
if(typeof module!=='undefined')module.exports=ChessEngine;
