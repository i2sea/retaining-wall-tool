"use strict";
/* 옹벽 설계도구 · 2D 도면 모델 · 단면력도 · 응력분포도 · 하중 작용도 · 지반반력도 · 설계강도 포락선 */
/* ---------- 2D 도면 모델 (SVG·DXF 공용) ---------- */
function drawing(R,kind,o={}){setWT(R);
  if(kind==="pN"||kind==="pE") return stressDwg(R,kind==="pE");
  if(kind==="mv") return memberDwg(R);
  if(kind==="fL"||kind==="fLE") return loadDwg(R,kind==="fLE");
  if(kind==="qF") return reactDwg(R);
  if(kind==="cap") return capDwg(R);
  const {P,G}=R, E=[], th=o.th||Math.max(G.B,P.H)*0.022, B=G.B;
  const isGen=kind==="gen"||kind==="sec", isBar=kind==="rebar"||kind==="sec";
  const L=(layer,pts,closed)=>E.push({t:"pl",layer,pts,closed});
  const T=(layer,x,y,s,h=th,al="c",rot=0)=>E.push({t:"tx",layer,x,y,s,h,al,rot});
  const C=(layer,x,y,r)=>E.push({t:"ci",layer,x,y,r});
  const F=(layer,pts)=>E.push({t:"fill",layer,pts});
  const K=k=>{E[E.length-1].key=k;};
  const dimH=(x1,x2,y,yref,lbl,k)=>{ // 수평치수: y는 치수선 위치
    const g=th*0.35, i0=E.length;
    L("DIM",[[x1,yref],[x1,y+(y>yref?g:-g)]]);L("DIM",[[x2,yref],[x2,y+(y>yref?g:-g)]]);
    L("DIM",[[x1,y],[x2,y]]);tick(x1,y);tick(x2,y);
    T("DIM",(x1+x2)/2,y+th*0.35,lbl??fx(x2-x1,0),th*0.8,"c");if(k)K(k);
    const tx=E[E.length-1]; for(let i=i0;i<E.length;i++) E[i].dg=1;
    E.push({t:"dim",dir:"h",layer:"DIM",tl:"DIM",txt:tx,h:th*0.8,tick:"slash",r:th*0.3,pts:[[x1,yref],[x2,yref],[x2,y],[(x1+x2)/2,y+th*0.35]]});};
  const dimV=(z1,z2,x,xref,lbl,xref2=xref,k)=>{
    const g=th*0.35, i0=E.length;
    L("DIM",[[xref,z1],[x+(x>xref?g:-g),z1]]);L("DIM",[[xref2,z2],[x+(x>xref2?g:-g),z2]]);
    L("DIM",[[x,z1],[x,z2]]);tick(x,z1);tick(x,z2);
    T("DIM",x-th*0.35,(z1+z2)/2,lbl??fx(z2-z1,0),th*0.8,"c",90);if(k)K(k);
    const tx=E[E.length-1]; for(let i=i0;i<E.length;i++) E[i].dg=1;
    E.push({t:"dim",dir:"v",layer:"DIM",tl:"DIM",txt:tx,h:th*0.8,tick:"slash",r:th*0.3,pts:[[xref,z1],[xref2,z2],[x,z2],[x-th*0.35,(z1+z2)/2]]});};
  const tick=(x,y)=>{const k=th*0.3;L("DIM",[[x-k,y-k],[x+k,y+k]]);};

  const body=kind==="rebar";   // 배근도: 옹벽 본체만 (버림·지반선·성토·상재하중 생략)
  if(!body){ G.levRects.forEach(r=>F("LEV",r));G.levOutlines.forEach(o=>L("LEV",o,true)); }
  F("CONC",G.foot);F("CONC",G.stem);if(G.key)F("CONC",G.key);
  L("CONC",G.concOutline,true);
  const yb=-P.lev-(G.hasKey?P.hk:0);
  // 지반선
  const gx=th*6;
  if(!body){
  L("GROUND",[[-gx,P.Df],[R.xf(P.Df),P.Df]]);
  const fd=fillDraw(R,th);
  if(fd.cut){ L("GROUND",fd.pts); L("GROUND",fd.brk);
    const mx=(G.xbt+fd.xs)/2; T("TEXT",mx-th*0.6,G.gnd(mx)+th*0.6,"1 : "+P.xr,th*0.75,"c",G.beta*180/Math.PI);
    if(isGen){K("xr");E[E.length-1].layer="DIM"; const xd=Math.max(fd.xs,B)+th*1.3; dimV(P.H,fd.zs,xd,fd.xs+th*0.5,"Hs="+fx(G.Hs,0),G.xbt+th*0.5,"Hs");} }
  else { const xe=Math.max(G.xk,B)+gx, gp=[[G.xbt,P.H]];
    if(G.Hs>0) gp.push([G.xk,P.H+G.Hs]);
    gp.push([xe,G.gnd(xe)]); L("GROUND",gp);
    if(G.Hs>0){ const mx=(G.xbt+Math.min(G.xk,G.xbt+P.xr*G.Hs))/2;
      T("TEXT",mx-th*0.6,G.gnd(mx)+th*0.6,"1 : "+P.xr,th*0.75,"c",G.beta*180/Math.PI);
      if(isGen){K("xr");E[E.length-1].layer="DIM"; dimV(P.H,P.H+G.Hs,G.xk+th*1.3,G.xk+th*0.5,"Hs="+fx(G.Hs,0),G.xk,"Hs");} } }
  for(let x=-gx+th;x<R.xf(P.Df)-th;x+=th*1.4)L("GROUND",[[x,P.Df],[x-th*0.6,P.Df-th*0.6]]);
  if(fd.cut) T("TEXT",fd.xs-th*0.3,fd.zs+th*1.2,"성토 상단 상재하중 "+P.q+" kN/m²",th*0.75,"r");
  else T("TEXT",Math.max(G.xk,B)+gx*0.5,G.gnd(Math.max(G.xk,B)+gx)+th*0.8,"상재하중 "+P.q+" kN/m²",th*0.75);
  }

  if(isGen){
    let row=yb-th*1.3;
    const RLg=P.wtype==="RL";
    if(RLg){   // 역L형 표준도: 아래 세 줄(앞굽|벽체 → 키 위치 → 전체), 전면 쪽은 기초·키 두께, 배면 쪽에 높이 세 줄
      const inKey=x=>G.hasKey&&x>=P.kx-1&&x<=P.kx+P.bk+1, yr=(a,b)=>inKey(a)||inKey(b)?yb:-P.lev;
      dimH(0,P.B1,row,yr(0,P.B1),undefined,"B1"); dimH(P.B1,B,row,yr(P.B1,B),undefined,"t2"); row-=th*1.3;
      if(G.hasKey){ dimH(0,P.kx,row,-P.lev,undefined,"kx"); dimH(P.kx,P.kx+P.bk,row,yb,undefined,"bk"); if(B-P.kx-P.bk>1) dimH(P.kx+P.bk,B,row,-P.lev,undefined); row-=th*1.3;
        T("TEXT",P.kx+P.bk/2,-P.hk/2-th*0.35,"전단키",th*0.65); }
      dimH(0,B,row,-P.lev,fx(B,0),"B");
      const xL=-th*2.2; dimV(0,P.D,xL,0,undefined,0,"D"); if(G.hasKey) dimV(-P.hk,0,xL,P.kx,undefined,0,"hk");
      const xR0=B+th*2.2, xR1=B+th*3.5, xR2=B+th*4.8;
      dimV(0,P.D,xR0,B,undefined,B); dimV(P.D,P.H,xR0,B,undefined,G.xbt,"hs");
      dimV(0,P.Df,xR1,B,fx(P.Df,0),xR1-th*0.9,"Df"); dimV(P.Df,P.H,xR1,xR1-th*0.9,undefined,G.xbt);
      dimV(0,P.H,xR2,B,fx(P.H,0),G.xbt,"H");
      { const yt=P.H+th*1.4, yo=P.H+th*2.8; dimH(G.xft,G.xbt,yt,P.H,undefined,"t1"); if(G.xft-P.B1>1) dimH(P.B1,G.xft,yo,P.H,undefined); if(G.xbb-G.xbt>1) dimH(G.xbt,G.xbb,yo,P.H,undefined); }
    } else {
    // 표준도 일반도 방식: 앞굽 | 벽체 하단 | 뒷굽 은 벽체 중간 높이에, 아래는 전체 폭만
    { const ym=P.D+(P.H-P.D)*0.45, yr=ym-th*1.6;
      if(P.B1>0) dimH(0,P.B1,ym,yr,undefined,"B1"); dimH(P.B1,G.xbb,ym,yr,undefined,"t2"); if(P.B3>0) dimH(G.xbb,B,ym,yr,undefined,"B3"); }
    row+=th*1.3;
    if(G.hasKey){row-=th*1.3; dimH(0,P.kx,row,-P.lev,undefined,"kx"); dimH(P.kx,P.kx+P.bk,row,yb,undefined,"bk");
      const xk0=Math.min(P.kx,P.kx+P.bk)-P.lev-th*1.3; dimV(-P.hk,0,P.kx-P.lev-th*1.2,P.kx-P.lev*0.5,undefined,P.kx,"hk");
      T("TEXT",P.kx+P.bk/2,-P.hk/2-th*0.35,"전단키",th*0.65);}
    row-=th*1.3; dimH(0,B,row,-P.lev,fx(B,0),"B");
    // 상단: 전면 경사분 | 상단두께 | 배면 경사분
    { const yt=P.H+th*1.4, yo=P.H+th*2.8; dimH(G.xft,G.xbt,yt,P.H,undefined,"t1"); if(G.xft-P.B1>1) dimH(P.B1,G.xft,yo,P.H,undefined); if(G.xbb-G.xbt>1) dimH(G.xbt,G.xbb,yo,P.H,undefined); }   // 표준도: 경사분(142·458)은 위 줄, 상단두께(300)는 아래 줄
    // 좌측 세 줄: 전체 / 근입·노출 / 기초(앞굽 끝·헌치)·벽체
    const D1g=G.D1??P.D;
    dimV(0,P.H,-gx-th*3.9,0,fx(P.H,0),G.xft,"H");
    dimV(0,P.Df,-gx-th*2.6,0,fx(P.Df,0),0,"Df"); dimV(P.Df,P.H,-gx-th*2.6,0,undefined,G.xft);
    if(P.B1>0){ dimV(0,D1g,-gx-th*1.3,0,undefined,0,"D1"); if(D1g<P.D) dimV(D1g,P.D,-gx-th*1.3,0,undefined,0); }   // 앞굽 끝 두께는 항상 눌러서 입력 가능
    else dimV(0,P.D,-gx-th*1.3,0,undefined,0,"D");
    dimV(P.D,P.H,-gx-th*1.3,0,undefined,G.xft,"hs");
    // 우측: 뒷굽 끝 두께 | 헌치
    if(P.B3>0){ dimV(0,G.D2,B+th*2.2,B,fx(G.D2,0),B,"D2"); if(G.D2<P.D) dimV(G.D2,P.D,B+th*2.2,B,undefined,G.xbb); }
    if(P.B1>0) dimV(0,P.D,P.B3>0?B+th*3.6:B+th*2.2,B,fx(P.D,0),G.xbb,"D");   // 앞굽이 있으면 벽체 아래 기초두께 D는 우측 바깥 줄 (눌러서 입력)
    }
    T("DIM",(P.B1+G.xft)/2-th*1.2,P.D+(P.H-P.D)*0.72,"1 : "+P.nf,th*0.8,"c",Math.atan(1/Math.max(P.nf,1e-6))*180/Math.PI);K("nf");
    if(P.hh>0){ const mx=P.B1-P.hh/2, mz=P.D+P.hh/2, ex=mx-th*1.6, ez=mz+th*1.4, w=th*3.6;   // 벽체 전면 하단 헌치 꼬리표
      L("DIM",[[mx,mz],[ex,ez],[ex-w,ez]]); T("DIM",ex-w/2,ez+th*0.3,fx(P.hh,0)+"×"+fx(P.hh,0),th*0.8,"c"); K("hh"); }
    if(kind==="gen") T("TEXT",G.hasKey?(P.kx+P.bk+B)/2:B/2,-P.lev/2-th*0.35,"버림콘크리트 t="+P.lev,th*0.6);
    if(!o.bare){ T("TITLE",B/2,row-th*2.6,"일 반 도",th*1.5);
      T("TEXT",B/2,row-th*4.2,`콘크리트 fck=${P.fck}MPa · 1m당 ${fx(R.Q.conc)} m³`,th*0.75); }
  }
  if(isBar){
    const col={WH:"R3",W1:"R1",W2:"R3",W4:"R3",W7:"R3",F1:"R2",F2:"R2",K1:"R2",F5:"R2"};
    R.bars.forEach(b=>(b.secs||[b.pts]).forEach(q=>L(col[b.m]||"R1",q)));
    const rr=th*0.18;
    ["W3","W5","F3","F4","K2","WD"].forEach(k=>(R.dots[k]||[]).forEach(([x,y])=>C("RD",x,y,rr)));
    const sec=kind==="sec", gx2=th*6, xL=-gx2-th*5, xR=Math.max(B+th*4,B+gx2*0.3);
    const lab=(m,px,py,tx,ty,al)=>{
      if(sec){ const r=th*0.85, bx=al==="l"?xR:xL, by=ty, ang=Math.atan2(by-py,bx-px);
        L("LEAD",[[px,py],[bx-r*Math.cos(ang),by-r*Math.sin(ang)]]); C("LEAD",px,py,th*0.12);
        E.push({t:"ci",layer:"BUB",x:bx,y:by,r}); T("BUB",bx,by-th*0.32,DM(m),th*0.75,"c"); return; }
      L("LEAD",[[px,py],[tx,ty]]);
      const b=P.bar[m];T("TEXT",tx+(al==="l"?th*0.3:-th*0.3),ty-th*0.35,`${DM(m)}  ${b.dia}@${b.s}`,th*0.8,al);
      C("LEAD",px,py,th*0.12);};
    const w1=R.bars[0].pts, w2=R.bars[1].pts, zm=(P.D+P.H)/2;
    const pW1=[R.xb(zm)-P.cw*Math.sqrt(1+G.nb*G.nb),zm], pW2=[R.xf(zm)+P.cw*Math.sqrt(1+P.nf*P.nf),zm];
    lab("W1",pW1[0],pW1[1],B+th*2,zm+th*2,"l");
    lab("W2",pW2[0],pW2[1]-th*2,-th*3,zm-th,"r");
    const w3=R.dots.W3[Math.floor(R.dots.W3.length*0.75)];
    const w5=R.dots.W5[Math.floor(R.dots.W5.length*0.85)]; if(w5) lab("W5",w5[0],w5[1],B+th*2,w5[1],"l");
    const f4=R.dots.F4[R.dots.F4.length-2]; if(f4) lab("F4",f4[0],f4[1],B+th*2,P.D+th*1.0,"l");
    if(w3) lab("W3",w3[0],w3[1],-th*3,w3[1]+th*0.5,"r");
    lab("F1",B*0.75,P.D-P.cf,B+th*2,P.D+th*2.5,"l");
    const w4=R.bars.find(b=>b.m==="W4"); if(w4) lab("W4",(w4.pts[1][0]+w4.pts[2][0])/2,w4.pts[1][1],-th*3,P.H+th*1.5,"r");
    lab("F2",B*0.5,P.cf,B+th*2,yb-th*1.2,"l");
    const f3=R.dots.F3[0]; if(f3) lab("F3",f3[0],f3[1],-th*3,yb-th*1.2,"r");
    const k1=R.bars.find(b=>b.m==="K1"); if(k1) lab("K1",k1.pts[2][0],k1.pts[2][1]+P.hk*0.3,-th*3,yb-th*2.6,"r");
    const w7=R.bars.find(b=>b.m==="W7"); if(w7){const q=w7.secs[Math.max(0,w7.secs.length-2)]; lab("W7",(q[0][0]+q[1][0])/2,q[0][1],B+th*2,q[0][1]+th*1.5,"l");}
    const f5=R.bars.find(b=>b.m==="F5"); if(f5){const q=f5.secs[f5.secs.length-1]; lab("F5",q[0][0],(q[0][1]+q[1][1])/2,B+th*2,P.D*0.5,"l");}
    const k2=R.dots.K2[R.dots.K2.length-1]; if(k2) lab("K2",k2[0],k2[1],B+th*2,yb-th*2.6,"l");
    if(!sec&&!o.bare){ T("TITLE",B/2,yb-th*4.4,"배 근 도",th*1.5);
      T("TEXT",B/2,yb-th*6,`피복(철근중심) 벽체 ${P.cw} · 기초 ${P.cf}  /  ${P.steel}`,th*0.75); }
  }
  return {E,th};
}
function bbox(E){let a=[1e9,1e9,-1e9,-1e9];const ext=(x,y)=>{a[0]=Math.min(a[0],x);a[1]=Math.min(a[1],y);a[2]=Math.max(a[2],x);a[3]=Math.max(a[3],y);};
  E.forEach(e=>{if(e.pts)e.pts.forEach(p=>ext(p[0],p[1]));else{const w=e.t==="tx"?e.s.length*e.h*0.45:e.r||0;ext(e.x-w,e.y-(e.h||e.r||0));ext(e.x+w,e.y+(e.h||e.r||0));}});return a;}
const SVGCOL={PR:"var(--bad)",PRH:"var(--bad)",R2H:"var(--rebar2)",G2:"var(--rebar2)",QR:"var(--rebar3)",QRH:"var(--rebar3)",CONC:"var(--ink)",LEV:"var(--muted)",GROUND:"var(--soil)",DIM:"var(--dim)",TEXT:"var(--ink)",TITLE:"var(--ink)",R1:"var(--rebar)",R2:"var(--rebar2)",R3:"var(--rebar3)",RD:"var(--dist)",LEAD:"var(--muted)"};
const PRINTCOL={PR:"#c0392b",PRH:"#e3a19a",R2H:"#2e7d32",G2:"#2e7d32",QR:"#1d5e88",QRH:"#7fa9c7",CONC:"#111",LEV:"#555",GROUND:"#8a6d3b",DIM:"#1d5e88",TEXT:"#111",TITLE:"#111",R1:"#c0392b",R2:"#2e7d32",R3:"#1d5e88",RD:"#8a5a12",LEAD:"#666",FILLC:"#e8eaea",FILLL:"#d9d3c9"};
/* ---------- 단면력도 (휨모멘트 · 전단력) ---------- */
function memberDwg(R){
  const {P,G,DSN}=R, M=DSN.meta, E=[], B=G.B, Bm=B/1000, th=Math.max(B,P.H)*0.028, hsm=G.hs/1000;
  const L=(layer,pts,closed)=>E.push({t:"pl",layer,pts,closed}), T=(layer,x,y,s,h=th,al="c",rot=0)=>E.push({t:"tx",layer,x,y,s,h,al,rot});
  const f1=v=>fx(v,1);
  E.push({t:"fill",layer:"CONC",pts:G.stem}); E.push({t:"fill",layer:"CONC",pts:G.foot}); if(G.key) E.push({t:"fill",layer:"CONC",pts:G.key});
  L("CONC",G.stem,true); L("CONC",G.foot,true); if(G.key) L("CONC",G.key,true);
  const LCc=[["PR","LCB1"],["QR","LCB2"]];
  /* 벽체: y(상단에서 깊이) → z = H − y */
  const N=24, st=[]; for(let i=0;i<=N;i++){const y=hsm*i/N; st.push(M.stemSec(y,""));}
  const mMax=Math.max(1e-6,...st.map(q=>Math.max(q.L1.M,q.L2.M))), vMax=Math.max(1e-6,...st.map(q=>Math.max(q.L1.V,q.L2.V)));
  const wPan=0.42*Math.max(B,G.hs*0.6), xA=-th*3, xB=xA-wPan-th*5;
  const panelV=(x0,key,max,title,unit)=>{ const sc=wPan/max; L("LEAD",[[x0,P.D],[x0,P.H]]);
    LCc.forEach(([ly],k)=>{ const pts=st.map(q=>[x0-(k?q.L2:q.L1)[key]*sc,P.H-q.y*1000]); L(ly,[[x0,P.H],...pts,[x0,P.D]]); });
    const b=st[N]; LCc.forEach(([ly,n],k)=>{const v=(k?b.L2:b.L1)[key]; T(ly,x0-v*sc,P.D-th*(1.2+k*1.1),`${n} ${f1(v)}`,th*0.75,"c");});
    for(let i=1;i<N;i+=3){const q=st[i], v=Math.max(q.L1[key],q.L2[key]); L("PRH",[[x0,P.H-q.y*1000],[x0-v*sc,P.H-q.y*1000]]);}
    T("TEXT",x0-wPan/2,P.H+th*1.6,title,th*0.95,"c"); T("TEXT",x0-wPan/2,P.H+th*0.5,unit,th*0.65,"c"); };
  panelV(xA,"M",mMax,"벽체 휨모멘트","(kN·m)"); panelV(xB,"V",vMax,"벽체 전단력","(kN)");
  /* 저판: 뒷굽·앞굽 */
  const xbb=G.xbb??(P.B1+P.t2), xq0=Math.max(G.xk,G.xbt);
  const wD=x=>{const tz=G.topZ?G.topZ(x):P.D; return P.gc*tz/1000 + P.gs*Math.max(0,G.gnd(x)-tz)/1000;}, wL=x=>x>=xq0?P.q:0;
  const ft=[]; const n=30;
  M.LC.slice(0,2).forEach((Lc,k)=>{ const pvF=P.hpv?Lc.pv:0, arr=[];
    if(P.B3>0) for(let i=0;i<=n;i++){ const x0=xbb+(B-xbb)*i/n; let Mx=0,Vx=0; const m2=60, h=(B-x0)/m2;
      for(let j=0;j<m2;j++){const x=x0+(j+0.5)*h, w=Lc.fD*wD(x)+Lc.fL*wL(x)-Lc.q(x/1000); Vx+=w*h/1000; Mx+=w*h/1000*(x-x0)/1000;}
      Mx+=pvF*(B-x0)/1000; Vx+=pvF; arr.push({x:x0,M:Mx,V:Vx}); }
    if(P.B1>0) for(let i=0;i<=n;i++){ const x0=P.B1*i/n; let Mx=0,Vx=0; const m2=60, h=x0/m2;
      for(let j=0;j<m2;j++){const x=(j+0.5)*h, w=Lc.q(x/1000)-Lc.fD*P.gc*P.D/1000; Vx+=w*h/1000; Mx+=w*h/1000*(x0-x)/1000;}
      arr.push({x:x0,M:-Mx,V:-Vx,toe:true}); }
    ft.push(arr); });
  const fm=Math.max(1e-6,...ft.flat().map(q=>Math.abs(q.M))), fv=Math.max(1e-6,...ft.flat().map(q=>Math.abs(q.V)));
  const hPan=0.22*Math.max(B,P.H), zC=-(G.hasKey?P.hk:0)-P.lev-th*3, zD=zC-hPan-th*5;
  const panelH=(z0,key,max,title,unit)=>{ const sc=hPan/max; L("LEAD",[[0,z0],[B,z0]]);
    ft.forEach((arr,k)=>{ const ly=LCc[k][0]; const seg=t=>arr.filter(q=>!!q.toe===t).sort((a,b)=>a.x-b.x);
      [seg(false),seg(true)].forEach(a=>{ if(!a.length) return; L(ly,[[a[0].x,z0],...a.map(q=>[q.x,z0-q[key]*sc]),[a[a.length-1].x,z0]]); }); });
    ft.forEach((arr,k)=>{ const ly=LCc[k][0]; const hp=arr.filter(q=>!q.toe); if(hp.length){const q=hp[0]; T(ly,q.x+th*0.4,z0-q[key]*sc+(q[key]>=0?-th*(0.9+k*1.0):th*(0.6+k*1.0)),`${LCc[k][1]} ${f1(q[key])}`,th*0.72,"l");}
      const tp=arr.filter(q=>q.toe); if(tp.length){const q=tp[tp.length-1]; T(ly,q.x-th*0.4,z0-q[key]*sc+th*(0.6+k*1.0),`${LCc[k][1]} ${f1(q[key])}`,th*0.72,"r");} });
    T("TEXT",B/2,z0+th*1.0,`${title} ${unit}`,th*0.95,"c"); };
  panelH(zC,"M",fm,"저판 휨모멘트","(kN·m, 아래쪽 = 상면 인장)"); panelH(zD,"V",fv,"저판 전단력","(kN)");
  const sH=DSN.find(d=>d.kind==="heel");
  if(sH&&sH.load.joint) T("TEXT",B/2,zD-hPan-th*1.6,`뒷굽 설계 Mu = ${f1(sH.Mu)} kN·m (동일 조합 벽체 모멘트 상한, KDS 11 80 05 4.6.1(3)⑧)`,th*0.75,"c");
  T("PR",xB-wPan,P.H+th*5.0,"── 대표 상시 조합 LCB1 (KDS 4.2-2)",th*0.8,"l"); T("QR",xB-wPan,P.H+th*3.9,"── 대표 지진 조합 (최종값은 전체 조합 포락)",th*0.8,"l");
  return {E,th};
}
/* ---------- 응력(토압·지반반력) 분포도 ---------- */
function stressDwg(R,seis){
  const {P,G,S}=R, E=[], B=G.B, th=Math.max(B,P.H)*0.03, X=seis?S.E:S.N, Hv=S.Hv, Hm=Hv*1000;
  const L=(layer,pts,closed)=>E.push({t:"pl",layer,pts,closed}), T=(layer,x,y,s,h=th,al="c",rot=0)=>E.push({t:"tx",layer,x,y,s,h,al,rot});
  const arrow=(layer,x1,y1,x2,y2)=>{L(layer,[[x1,y1],[x2,y2]]);const a=Math.atan2(y2-y1,x2-x1),k=th*0.55,w=0.45;
    L(layer,[[x2-k*Math.cos(a-w),y2-k*Math.sin(a-w)],[x2,y2],[x2-k*Math.cos(a+w),y2-k*Math.sin(a+w)]]);};
  const f1=v=>fx(v,1), f2=v=>fx(v,2);
  // 구조물
  E.push({t:"fill",layer:"CONC",pts:G.stem}); E.push({t:"fill",layer:"CONC",pts:G.foot}); if(G.key) E.push({t:"fill",layer:"CONC",pts:G.key});
  L("CONC",G.stem,true); L("CONC",G.foot,true); if(G.key) L("CONC",G.key,true);
  // 배면 지표
  const xbt=G.xbt, ext=B+(G.Hs>0?0.45:0.9)*B, gp=[[xbt,P.H]]; for(let i=1;i<=24;i++){const x=xbt+(ext-xbt)*i/24; gp.push([x,G.gnd(x)]);} L("GROUND",gp);
  if(P.Df>0&&P.B1>=0) L("GROUND",[[-0.35*B,P.Df],[P.B1+P.nf*Math.max(0,P.H-P.Df),P.Df]]);
  // 상재하중
  if(!seis&&P.q>0){ const xq0=Math.max(G.xk,xbt);
    if(xq0<ext-0.2*B){ for(let i=0;i<=5;i++){const x=xq0+(ext-xq0)*i/5; arrow("PR",x,G.gnd(x)+th*1.6,x,G.gnd(x)+th*0.15);}
      const xm=(xq0+ext)/2; T("PR",xm,G.gnd(xm)+th*2.3,`q = ${fx(P.q,0)} kN/m²`,th*0.85,"c"); }
    else T("PR",ext,G.gnd(ext)+th*0.8,`성토 상단부터 q = ${fx(P.q,0)} kN/m² →`,th*0.8,"r"); }
  // 가상배면
  L("LEAD",[[B,0],[B,Hm+th*0.8]]); T("LEAD",B-th*0.3,Hm+th*1.2,"가상배면",th*0.75,"r");
  // 토압 분포 (수평성분)
  const pb=Hv>0?2*X.Ph1/Hv:0;                       // 흙 토압 하단 강도
  let pt,pb2,lab=[];
  if(!seis){ const pq=Hv>0?X.Ph2/Hv:0; pt=pq; pb2=pq+pb;
    lab=[[`${f1(pq)}`,Hm,pq],[`${f1(pq+pb)}`,0,pq+pb]]; }
  else if(P.eqp==="split"){ const a=Hv>0?X.Ph2/(2.5*Hv):0; pt=4*a; pb2=pb+a; lab=[[`${f1(4*a)}`,Hm,4*a],[`${f1(pb+a)}`,0,pb+a]]; }
  else if(P.eqp==="h2"){ const u=Hv>0?X.Paeh/Hv:0; pt=u; pb2=u; lab=[[`${f1(u)}`,Hm,u],[`${f1(u)}`,0,u]]; }
  else { const a=Hv>0?X.Paeh/(2.5*Hv):0; pt=4*a; pb2=a; lab=[[`${f1(4*a)}`,Hm,4*a],[`${f1(a)}`,0,a]]; }
  const pmax=Math.max(pt,pb2,1e-6), sc=0.55*B/pmax;
  const outline=[[B,Hm],[B+pt*sc,Hm],[B+pb2*sc,0],[B,0]];
  L("PR",outline,true);
  if(!seis){ if(pt>0) L("PR",[[B+pt*sc,Hm],[B+pt*sc,0]]); }
  else if(P.eqp==="split") L("PRH",[[B,Hm],[B+pb*sc,0]]);
  for(let i=1;i<10;i++){const z=Hm*i/10, xr=B+(pt+(pb2-pt)*(1-i/10))*sc; L("PRH",[[B,z],[xr,z]]);}
  lab.forEach(([s,z,v])=>T("PR",B+v*sc+th*0.4,z+(z>0?-th*0.2:th*0.3),s,th*0.8,"l"));
  T("PR",B+pmax*sc*0.5,-th*1.6,"(kN/m²)",th*0.7,"c");
  // 합력 화살표
  const res=seis?(P.eqp==="split"?[["Pa (정적)",X.Ph1,Hm/3],["ΔPae",X.Ph2,0.6*Hm]]:P.eqp==="h2"?[["Paeh (H/2)",X.Paeh,Hm/2]]:[["Paeh (0.6H)",X.Paeh,0.6*Hm]]):[["Ph1 (흙)",X.Ph1,Hm/3],...(X.Ph2>0?[["Ph2 (상재)",X.Ph2,Hm/2]]:[])];
  res.forEach(([n,v,z])=>{const x0=B+pmax*sc+th*4.2; arrow("PR",x0,z,B+th*0.3,z); T("PR",x0+th*0.3,z+th*0.25,`${n} = ${f2(v)} kN`,th*0.8,"l");});
  if(seis&&X.Fi>0){ const zi=X.Mi/X.Fi*1000, xi=P.B1+P.nf*G.hs*0.5+P.t1*0.5; arrow("PR",xi-th*0.2+B*0.0,zi,xi-B*0.45,zi); T("PR",xi-B*0.45,zi+th*0.5,`관성력 kh·W = ${f2(X.Fi)} kN`,th*0.8,"l"); }
  // 지반반력
  const ae=Math.abs(X.e), toeMax=X.e>=0, z0=-(G.key?P.hk:0)-P.lev-th*1.2, qmax=X.qmax, sr=0.32*Math.max(B,Hm*0.6)/Math.max(qmax,1e-6);
  let qp; if(ae<=B/6000){ const q0=toeMax?X.qmax:X.qmin, qB=toeMax?X.qmin:X.qmax; qp=[[0,z0],[0,z0-q0*sr],[B,z0-qB*sr],[B,z0]]; }
  else { const Lc=Math.min(B,3*(B/2-ae*1000)); qp=toeMax?[[0,z0],[0,z0-qmax*sr],[Lc,z0]]:[[B,z0],[B,z0-qmax*sr],[B-Lc,z0]]; }
  L("QR",[[0,z0],[B,z0]]); L("QR",qp,true);
  const qAt=x=>{ // 다각형 하단선에서 x 위치 값 (선형보간)
    const pts=qp.slice(1,-1).length?qp:qp; let best=0; for(let i=0;i<qp.length-1;i++){const [a,b]=[qp[i],qp[i+1]]; if((x-a[0])*(x-b[0])<=0&&a[0]!==b[0]) best=Math.min(best,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])-z0);} return best; };
  for(let i=1;i<12;i++){const x=B*i/12, d=qAt(x); if(d<-1) arrow("QRH",x,z0+d,x,z0);}
  const xmx=toeMax?0:B, xmn=toeMax?B:0;
  T("QR",xmx+(toeMax?-th*0.3:th*0.3),z0-qmax*sr-th*0.9,`qmax = ${f1(qmax)}`,th*0.85,toeMax?"l":"r");
  T("QR",xmn+(toeMax?th*0.3:-th*0.3),z0-Math.max(X.qmin*sr,0)-th*0.9,`qmin = ${f1(X.qmin)}`,th*0.85,toeMax?"r":"l");
  T("QR",B/2,z0-qmax*sr-th*2.6,`e = ${fx(X.e,3)} m  (허용 B/${seis?3:6} = ${fx(B/1000/(seis?3:6),3)} m),  V = ${f2(X.V)} kN,  qa = ${fx(X.qa,0)} kN/m²`,th*0.8,"c");
  T("TEXT",B*0.2,Hm+th*3.2,seis?"지진시 토압 · 지반반력 분포":"상시 토압 · 지반반력 분포",th*1.1,"l");
  // 전단키 전면 수동토압
  const SL=S.SL; if(G.hasKey&&SL.method!=="none"&&SL.Pp>0){ const f=SL.ppf, a1=SL.p1*f, a2=SL.p2*f, sp=Math.min(sc,0.3*B/Math.max(a2,1e-6)), xk=P.kx;
    L("QR",[[xk,0],[xk-a1*sp,0],[xk-a2*sp,-P.hk],[xk,-P.hk]],true);
    for(let i=1;i<5;i++){const z=-P.hk*i/5, v=a1+(a2-a1)*i/5; arrow("QRH",xk-v*sp,z,xk-th*0.1,z);}
    T("QR",xk-a2*sp-th*0.3,-P.hk-th*0.2,`${f1(a2)}`,th*0.75,"r"); if(a1>0) T("QR",xk-a1*sp-th*0.3,th*0.25,`${f1(a1)}`,th*0.75,"r");
    T("QR",xk-a2*sp-th*0.3,-P.hk*0.5,`수동토압 Pp = ${f2(SL.Pp)} kN${f<1?` (×${f})`:""}`,th*0.75,"r"); }
  return {E,th};
}
/* ---------- 공통: 구조물 · 지표 ---------- */
function dwBase(R,th,o={}){
  const {P,G}=R, E=[], B=G.B;
  const L=(layer,pts,closed)=>E.push({t:"pl",layer,pts,closed}), T=(layer,x,y,s,h=th,al="c",rot=0)=>E.push({t:"tx",layer,x,y,s,h,al,rot});
  const arrow=(layer,x1,y1,x2,y2,k=th*0.55)=>{L(layer,[[x1,y1],[x2,y2]]);const a=Math.atan2(y2-y1,x2-x1),w=0.45;
    L(layer,[[x2-k*Math.cos(a-w),y2-k*Math.sin(a-w)],[x2,y2],[x2-k*Math.cos(a+w),y2-k*Math.sin(a+w)]]);};
  const stem=o.zcut?clipHalf(G.stem,pt=>o.zcut-pt[1]):G.stem;
  [stem,G.foot,...(G.key?[G.key]:[])].forEach(p=>{E.push({t:"fill",layer:"CONC",pts:p}); L("CONC",p,true);});
  if(o.zcut){ const xs=stem.filter(p=>Math.abs(p[1]-o.zcut)<1).map(p=>p[0]); if(xs.length>1){const a=Math.min(...xs)-th*0.6,b=Math.max(...xs)+th*0.6,mx=(a+b)/2,z=o.zcut;
    L("CONC",[[a,z],[mx-th*0.3,z],[mx-th*0.1,z+th*0.5],[mx+th*0.1,z-th*0.5],[mx+th*0.3,z],[b,z]]);} }
  if(o.ground){ const xbt=G.xbt, ext=B+(G.Hs>0?0.3:0.6)*B, gp=[[xbt,P.H]]; for(let i=1;i<=24;i++){const x=xbt+(ext-xbt)*i/24; gp.push([x,G.gnd(x)]);} L("GROUND",gp);
    if(P.Df>0) L("GROUND",[[-0.3*B,P.Df],[P.B1+P.nf*Math.max(0,P.H-P.Df),P.Df]]); }
  return {E,L,T,arrow};
}
/* ---------- 하중 작용도 ---------- */
function loadDwg(R,seis){
  const {P,G,S}=R, B=G.B, th=Math.max(B,P.H)*0.028, X=seis?S.E:S.N, Hv=S.Hv, Hm=Hv*1000, f2=v=>fx(v,2);
  const {E,L,T,arrow}=dwBase(R,th,{ground:true}), pt=partsStab(R);
  L("LEAD",[[B,0],[B,Hm]]);
  const al=th*1.9;
  [...pt.conc.map(q=>["R2",q]),...pt.soil.map(q=>["GROUND",q])].forEach(([ly,q])=>{ const x=q.x*1000, z=q.z*1000;
    E.push({t:"ci",layer:ly,x,y:z,r:th*0.12});
    if(!seis) arrow(ly,x,z,x,z-al,th*0.45);
    else arrow("QR",x,z,x-al,z,th*0.45);
    T(ly,x+th*0.2,z+th*0.25,q.n,th*0.8,"l");
    T(seis?"QR":ly,seis?x-al*0.5:x+th*0.25,seis?z-th*0.75:z-al*0.65,seis?f2(q.W*P.kh):f2(q.W),th*0.62,seis?"c":"l"); });
  // 토압
  const res=seis?(P.eqp==="split"?[["Pah",X.Ph1,Hm/3],["ΔPae",X.Ph2,0.6*Hm]]:[["Paeh",X.Paeh,(P.eqp==="h2"?0.5:0.6)*Hm]]):[["Pah",X.Ph1,Hm/3],...(X.Ph2>0?[["Pq",X.Ph2,Hm/2]]:[])];
  const xr=B+th*5;
  res.forEach(([n,v,z])=>{ arrow("PR",xr,z,B+th*0.15,z); T("PR",xr+th*0.3,z-th*0.25,`${n} = ${f2(v)} kN`,th*0.8,"l");
    L("DIM",[[B+th*1.2,0],[B+th*1.2,z]]); T("DIM",B+th*0.9,z/2,`${fx(z/1000,3)}`,th*0.62,"c",90); });
  if(X.Pv>0){ arrow("PR",B+th*0.5,Hm/3+th*2.4,B+th*0.5,Hm/3+th*0.3); T("PR",B+th*0.9,Hm/3+th*2.0,`Pav = ${f2(X.Pv)} kN`,th*0.8,"l"); }
  if(!seis&&(S.qW||0)>0){ const xq=(S.qX||0)*1000; arrow("PR",xq,Hm+th*2.6,xq,G.gnd(xq)+th*0.2); T("PR",xq+th*0.3,Hm+th*2.2,`qL·L = ${f2(S.qW)} kN`,th*0.75,"l"); }
  if(G.hasKey&&S.SL.Pp>0){ const zk=-P.hk/2; arrow("QR",P.kx-th*3.5,zk,P.kx-th*0.15,zk); T("QR",P.kx-th*3.7,zk-th*0.25,`Pp = ${f2(S.SL.Pp)}`,th*0.75,"r"); }
  // 합력 작용점 · 허용 편심 범위
  const zb=(G.hasKey?-P.hk:0)-th*1.6, e=X.e*1000, xR=B/2-e, k=seis?3:6, a=B/2-B/k, b=B/2+B/k;
  L("LEAD",[[0,zb],[B,zb]]); L("G2",[[a,zb-th*0.4],[a,zb+th*0.4]]); L("G2",[[b,zb-th*0.4],[b,zb+th*0.4]]);
  L("G2",[[a,zb],[b,zb]]); T("R2",(a+b)/2,zb+th*0.75+(Math.abs(xR-B/2)<B*0.1?0:0),`허용범위 e ≤ B/${k} = ${fx(B/k/1000,3)} m`,th*0.7,"c");
  const cR=X.ok.e?"G2":"PR"; arrow(cR,xR,zb-th*3.4,xR,zb-th*0.1,th*0.6);
  T(X.ok.e?"R2":"PR",xR+(X.e>0?-th*0.4:th*0.4),zb-th*2.9,`합력 ΣV = ${f2(X.V)} kN,  e = ${fx(X.e,3)} m`,th*0.75,X.e>0?"r":"l");
  L("LEAD",[[B/2,zb-th*0.6],[B/2,zb+th*0.6]]);
  T("TEXT",-th*0.3,-th*0.2,"O",th*0.9,"r");
  T("TEXT",0,Math.max(P.H,Hm)+th*4.2,seis?"지진시 하중 작용도 (→ 관성력 kh·W, kN)":"상시 하중 작용도 (↓ 자중, kN)",th*1.0,"l");
  return {E,th};
}
/* ---------- 하중조합별 지반반력도 ---------- */
function reactDwg(R){
  const {P,G,DSN}=R, M=DSN.meta, B=G.B, th=Math.max(B,1500)*0.04, f1=v=>fx(v,1);
  const zcut=P.D+Math.min(G.hs,Math.max(B*0.35,P.D*1.5));
  const {E,L,T}=dwBase(R,th,{zcut});
  const xbb=G.xbb??(P.B1+P.t2), xs=[0,...(P.B1>0?[P.B1]:[]),xbb,B];
  const LCs=[["PR","PRH",M.LC[0]],["QR","QRH",M.LC[1]],["DIM","LEAD",M.LC[2]]];
  const qm=Math.max(1e-6,...LCs.map(c=>c[2].qmax).filter(isFinite)), hP=0.30*Math.max(B,1500), sc=hP/qm;
  let z0=(G.hasKey?-P.hk:0)-P.lev-th*1.5;
  LCs.forEach(([ly,lh,Lc])=>{ const pts=[]; for(let i=0;i<=60;i++){const x=B*i/60; pts.push([x,z0-Lc.q(x/1000)*sc]);}
    L(ly,[[0,z0],...pts,[B,z0]],true);
    for(let i=1;i<16;i++){const x=B*i/16, q=Lc.q(x/1000); if(q*sc>th*0.4) L(lh,[[x,z0],[x,z0-q*sc]]);}
    xs.forEach((x,i)=>{const q=Lc.q(x/1000); L("LEAD",[[x,z0],[x,z0-Math.max(q*sc,th*0.3)]]);
      T(ly,x+(i===0?th*0.25:i===xs.length-1?-th*0.25:0),z0-q*sc-th*0.95,q>1e-6?f1(q):"0",th*0.7,i===0?"l":i===xs.length-1?"r":"c");});
    T(ly,-th*0.6,z0-hP*0.35,Lc.n,th*0.85,"r"); T(ly,-th*0.6,z0-hP*0.35-th*1.1,Lc.tri?"삼각형":"사다리꼴",th*0.6,"r");
    T(ly,B+th*0.6,z0-hP*0.35,`e = ${fx(Lc.e,3)} m`,th*0.65,"l");
    z0-=hP+th*3.2; });
  const zt=(G.hasKey?-P.hk:0)-P.lev-th*1.5;
  const zl=z0+th*1.4; xs.forEach(x=>L("LEAD",[[x,zt+th*0.4],[x,zl+th*1.0]]));
  const nm=[["q1",0],...(P.B1>0?[["q",P.B1]]:[]),["q2",xbb],["q3",B]];
  nm.forEach(([n,x])=>T("TEXT",x,zl,n,th*0.75,"c"));
  T("TEXT",0,zcut+th*2.5,"하중조합별 지반반력 (kN/m²)",th*1.0,"l");
  T("TEXT",0,zcut+th*1.3,"대표 LCB1·LCB2·사용하중. 전체17개 조합은 계산서 표 참조",th*0.65,"l");
  return {E,th};
}
/* ---------- 벽체 설계강도 포락선 · W2 단절점 ---------- */
function capDwg(R){setWT(R);
  const {P,G,DSN}=R, M=DSN.meta, hsm=G.hs/1000, th=Math.max(P.H,1500)*0.026, f1=v=>fx(v,1);
  const {E,L,T,arrow}=dwBase(R,th,{});
  const has8=P.bar.W8.s>0&&P.cutW8>0&&P.cutW8<G.hs, add=has8?{addAs:AS[P.bar.W8.dia]*1000/P.bar.W8.s,addN:1000/P.bar.W8.s}:{};
  const N=60, rows=[]; for(let i=0;i<=N;i++){ const y=hsm*i/N, s=M.stemSec(y,""), zt=G.hs-y*1000;
    const c1=secCheck(P,"",0,0,s.t,P.cw,"W1","배면"), c2=has8&&zt<=P.cutW8+1e-6?secCheck(P,"",0,0,s.t,P.cw,"W1","배면",add):c1;
    rows.push({z:P.D+zt,zt,Mu:s.Mu,Mo:s.Mo,m1:c1.phMn,m:c2.phMn}); }
  const mx=Math.max(1e-6,...rows.map(r=>Math.max(r.m,r.Mu))), W=0.75*Math.max(G.B,G.hs*0.5), x0=Math.max(G.B,P.B1+P.t2)+th*6, sc=W/mx;
  L("LEAD",[[x0,P.D],[x0,P.H]]); L("LEAD",[[x0,P.D],[x0+W*1.05,P.D]]);
  for(let k=1;k<=4;k++){const v=mx*k/4, x=x0+v*sc; L("LEAD",[[x,P.D],[x,P.D-th*0.3]]); T("LEAD",x,P.D-th*1.1,f1(v),th*0.6,"c");}
  L("PR",[[x0,P.H],...rows.map(r=>[x0+r.Mu*sc,r.z])]);
  for(let i=2;i<N;i+=4){const r=rows[i]; L("PRH",[[x0,r.z],[x0+r.Mu*sc,r.z]]);}
  L("R2",rows.map(r=>[x0+r.m*sc,r.z]));
  if(has8) L("R2H",rows.map(r=>[x0+r.m1*sc,r.z]));
  const b=rows[N]; T("PR",x0+b.Mu*sc-th*0.2,P.D+th*0.5,`Mu ${f1(b.Mu)}`,th*0.7,"r"); T("R2",x0+b.m*sc+th*0.2,P.D+th*0.5,`φMn ${f1(b.m)}`,th*0.7,"l");
  const hl=(zt,ly,txt,txt2,up)=>{const z=P.D+zt, tl=ly==="G2"?"R2":ly, d=up?1:-1; L(ly,[[P.B1-th*0.5,z],[x0+W*1.05,z]]);
    T(tl,x0+W*1.05+th*0.3,z+(up?th*0.25:-th*0.85),txt,th*0.7,"l"); if(txt2) T(tl,x0+W*1.05+th*0.3,z+(up?th*1.2:-th*1.8),txt2,th*0.6,"l");};
  const cutUp=!has8||P.cutW8>=G.hs/2;
  hl(G.hs/2,"LEAD",`H/2 = ${fx(G.hs/2000,3)} m`,null,!cutUp);
  const ca=P.cutAuto, db=BARS[P.bar.W8.dia].d;
  if(has8){ if(ca&&ca.need) hl(ca.hc,"PRH",`이론 단절점 ${fx(ca.hc/1000,3)} m (${DM("W1")}만으로 저항)`,null,!cutUp);
    hl(P.cutW8,"G2",`${DM("W8")} 단절 ${fx(P.cutW8/1000,3)} m`,ca?`= ${fx(ca.hc/1000,3)} + 12db(${fx(12*db,0)}) → 50 mm 단위 올림`:"(입력값)",cutUp);
    const zc=P.D+P.cutW8, xd=P.B1-th*2.2; L("DIM",[[xd,P.D],[xd,zc]]); [[xd,P.D],[xd,zc]].forEach(([x,y])=>L("DIM",[[x-th*0.3,y-th*0.3],[x+th*0.3,y+th*0.3]]));
    T("DIM",xd-th*0.35,(P.D+zc)/2,fx(P.cutW8,0),th*0.7,"c",90); }
  const lg=P.H+th*1.4;
  T("PR",x0,lg+th*2.4,"── 계수 휨모멘트 Mu (LCB1·LCB2 최대)",th*0.72,"l");
  T("R2",x0,lg+th*1.2,`── 설계강도 φMn (${has8?DM("W1")+"+"+DM("W8")+" / "+DM("W1")+"만":DM("W1")})`,th*0.72,"l");
  const okAll=rows.every(r=>r.m>=r.Mu-1e-6);
  T(okAll?"R2":"PR",x0,lg,okAll?"전 높이에서 φMn ≥ Mu  O.K":"φMn < Mu 인 구간 있음  N.G",th*0.72,"l");
  T("TEXT",x0+W*0.5,P.D-th*2.3,"(kN·m/m)",th*0.65,"c");
  T("TEXT",0,lg+th*4.0,"벽체 설계강도 포락선 · 배면철근 단절 위치",th*1.0,"l");
  return {E,th};
}
function toSVG(dw,pal){
  const {E,th}=dw,[x0,y0,x1,y1]=bbox(E),pad=th*2;
  const vb=[x0-pad,-(y1+pad),x1-x0+2*pad,y1-y0+2*pad];
  const sw=th*0.07, COL=pal||SVGCOL, sz=pal?` width="1800" height="${Math.round(1800*vb[3]/vb[2])}"`:"";
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}"${sz} font-family="Malgun Gothic, IBM Plex Sans KR, sans-serif">`;
  if(pal) s+=`<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>`;
  E.forEach(e=>{const c=COL[e.layer]||"#111";
    if(e.t==="fill") s+=`<polygon points="${e.pts.map(p=>p[0]+","+(-p[1])).join(" ")}" fill="${e.layer==="LEV"?(pal?pal.FILLL:"var(--lev-fill)"):(pal?pal.FILLC:"var(--conc-fill)")}" stroke="none"/>`;
    else if(e.t==="pl"){const w=e.layer==="S-BAR"?sw*1.5:e.layer==="S-CONC"?sw*2.2:e.layer.startsWith("S-")?sw*0.9:e.layer.startsWith("R")?sw*2.6:e.layer==="CONC"?sw*1.8:sw;
      s+=`<${e.closed?"polygon":"polyline"} points="${e.pts.map(p=>p[0]+","+(-p[1])).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"${e.layer==="R2H"?` stroke-dasharray="${th*0.4} ${th*0.25}"`:""}/>`;}
    else if(e.t==="ci") s+=(e.layer==="BUB"||e.layer==="S-BUB")?`<circle cx="${e.x}" cy="${-e.y}" r="${e.r}" fill="${pal?"#fff":"var(--panel)"}" stroke="${c}" stroke-width="${sw*1.2}"/>`:`<circle cx="${e.x}" cy="${-e.y}" r="${e.r}" fill="${c}"/>`;
    else if(e.t==="tx"){const an=e.al==="l"?"start":e.al==="r"?"end":"middle";
      s+=`<text x="${e.x}" y="${-e.y}" font-size="${e.h}" fill="${c}" text-anchor="${an}" ${e.key&&!pal?`data-k="${e.key}" tabindex="0" role="button" aria-label="치수 수정"`:""} ${e.layer==="TITLE"?'font-weight="700" letter-spacing="'+e.h*0.15+'"':""} ${e.rot?`transform="rotate(${-e.rot} ${e.x} ${-e.y})"`:""}>${esc(e.s)}</text>`;}
  });
  return s+"</svg>";
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
