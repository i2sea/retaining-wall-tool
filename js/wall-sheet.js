"use strict";
/* 옹벽 설계도구 · 상세도 시트 (A3) */
/* ---------- 상세도 시트 (A3, 모형공간 1:S) — 국내 상세도 스타일 ---------- */
const SCALES=[30,40,50,60,80,100,120,150,200];
const I0=v=>String(Math.round(v));
function elShift(E,dx,dy){return E.map(e=>e.pts?{...e,pts:e.pts.map(p=>[p[0]+dx,p[1]+dy])}:{...e,x:e.x+dx,y:e.y+dy});}
function viewKit(th){
  const E=[], L=(layer,pts,closed)=>E.push({t:"pl",layer,pts,closed}),
    T=(layer,x,y,s,h=th,al="c",rot=0)=>E.push({t:"tx",layer,x,y,s,h,al,rot}),
    C=(layer,x,y,r)=>E.push({t:"ci",layer,x,y,r});
  const dr=th*0.16, tw=s=>String(s).length*th*0.62, dw=s=>String(s).length*th*0.74;   // dw: 치수 문자 실제 폭(여유 포함)
  // 연쇄치수: 같은 간격이 2번 이상 이어지면 n@s=합
  const group=(vs,brks)=>{const v=[...new Set(vs.map(a=>Math.round(a)))].sort((a,b)=>a-b);const seg=[], bk=new Set((brks||[]).map(a=>Math.round(a)));
    for(let i=0;i<v.length-1;i++){const g=v[i+1]-v[i];const last=seg[seg.length-1];
      if(last&&last.g===g&&g>0&&!bk.has(v[i])){last.n++;last.b=v[i+1];} else seg.push({a:v[i],b:v[i+1],g,n:1});}
    return {v,seg:seg.flatMap(s=>s.n>=2?[{a:s.a,b:s.b,t:`${s.n}@${s.g}=${s.n*s.g}`}]:Array.from({length:s.n},(_,k)=>({a:s.a+k*s.g,b:s.a+(k+1)*s.g,t:I0(s.g)})))};};
  const CH=[];
  // 치수 문자 위치: 짧은 구간은 양 끝이면 치수보조선 바깥으로, 가운데면 반대쪽 줄로 엇갈림. opt.out 구간은 철근과 겹치지 않게 강제로 바깥
  const placeSeg=(seg,lbl,opt)=>{const out=new Set((opt&&opt.out)||[]), R=[]; let alt=0, endA=-1e18, endB=-1e18;   // 문자는 치수선 위 구간 가운데(짧으면 반대편 줄과 엇갈림). opt.out만 바로 옆 치수선 연장 위로
    seg.forEach((s,si)=>{const t=lbl&&seg.length===1?lbl:s.t, w=tw(t), small=(s.b-s.a)<w*1.05;
      let c=(s.a+s.b)/2; const hw=w/2, nx=seg[si+1], nL=nx?(nx.a+nx.b)/2-tw(nx.t)/2:1e18, fitA=c-hw>endA+th*0.3&&c+hw<nL-th*0.3, fitB=c-hw>endB+th*0.3;
      let useB=false;
      if(out.has(si)){ c=si===0?s.a-th*0.5-hw:s.b+th*0.5+hw; endA=Math.max(endA,c+hw); }
      else { useB=small&&(!fitA&&fitB||(!fitA&&!fitB&&alt++%2)); if(useB) endB=c+hw; else endA=Math.max(endA,c+hw); }
      R.push({t,c,useB});});
    return R;};
  const chainH=(xs,y,yref,lbl,opt)=>{const {v,seg}=group(xs); if(v.length<2)return;
    const yr=typeof yref==="function"?yref:()=>yref; const i0=E.length; CH.push({i0,dir:"h",pos:y,side:y>yr(v[0])?1:-1,a:v[0],b:v[v.length-1],fixed:!!(opt&&opt.fixed)});
    const bnd=[...new Set(seg.flatMap(q=>[q.a,q.b]))];
    bnd.forEach(x=>{const r=yr(x);L("S-DIM",[[x,r+(y>r?th*0.4:-th*0.4)],[x,y+(y>r?th*0.5:-th*0.5)]]);C("S-DIM",x,y,dr);});
    L("S-DIM",[[v[0]-th*0.8,y],[v[v.length-1]+th*0.8,y]]);
    const DS=[], PL=placeSeg(seg,lbl,opt); seg.forEach((s,si)=>{const {t,c,useB}=PL[si];
      const yy=useB?y-th*1.3:y+th*0.35; T("S-DIMT",c,yy,t,th,"c"); DS.push([s,E[E.length-1],yy,c]);});
    for(let i=i0;i<E.length;i++) E[i].dg=1;
    DS.forEach(([s,tx,yy,c])=>{const ra=yr(s.a), rb=yr(s.b); E.push({t:"dim",dir:"h",layer:"S-DIM",tl:"S-DIMT",txt:tx,h:th,tick:"dot",r:dr,
      pts:[[s.a,ra+(y>ra?th*0.4:-th*0.4)],[s.b,rb+(y>rb?th*0.4:-th*0.4)],[s.b,y],[c,yy]]});});
    CH[CH.length-1].i1=E.length;};
  const chainV=(zs,x,xref,lbl,opt)=>{const {v,seg}=group(zs,opt&&opt.breaks); if(v.length<2)return;
    const xr=typeof xref==="function"?xref:()=>xref; const i0=E.length; CH.push({i0,dir:"v",pos:x,side:x>xr(v[0])?1:-1,a:v[0],b:v[v.length-1],fixed:!!(opt&&opt.fixed)});
    const bnd=[...new Set(seg.flatMap(q=>[q.a,q.b]))];
    bnd.forEach(z=>{const r=xr(z);L("S-DIM",[[r+(x>r?th*0.4:-th*0.4),z],[x+(x>r?th*0.5:-th*0.5),z]]);C("S-DIM",x,z,dr);});
    L("S-DIM",[[x,Math.min(v[0]-th*0.8,(opt&&opt.lo!=null)?opt.lo:1e18)],[x,v[v.length-1]+th*0.8]]);   // opt.lo: 아래 끝을 다른 치수선 높이에 맞춤
    const DS=[], PL=placeSeg(seg,lbl,opt); seg.forEach((s,si)=>{const {t,c,useB}=PL[si];
      const xx=useB?x+th*1.3:x-th*0.35; T("S-DIMT",xx,c,t,th,"c",90); DS.push([s,E[E.length-1],xx,c]);});
    for(let i=i0;i<E.length;i++) E[i].dg=1;
    DS.forEach(([s,tx,xx,c])=>{const ra=xr(s.a), rb=xr(s.b); E.push({t:"dim",dir:"v",layer:"S-DIM",tl:"S-DIMT",txt:tx,h:th,tick:"dot",r:dr,
      pts:[[ra+(x>ra?th*0.4:-th*0.4),s.a],[rb+(x>rb?th*0.4:-th*0.4),s.b],[x,s.b],[xx,c]]});});
    CH[CH.length-1].i1=E.length;};
  // 철근 꼬리표: 점 → (꺾임점) → 수평 밑줄, 풍선은 왼쪽 끝, 규격은 풍선 오른쪽
  const TAGS=[];
  const barSegments=()=>E.filter(e=>e.t==="pl"&&e.layer==="S-BAR").flatMap(e=>e.pts.slice(1).map((b,i)=>[e.pts[i],b]));
  const commonLength=(a,b,c,d)=>{const eps=.01;
   if(Math.abs(a[1]-b[1])<eps&&Math.abs(c[1]-d[1])<eps&&Math.abs(a[1]-c[1])<eps)return Math.max(0,Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))-Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0])));
   if(Math.abs(a[0]-b[0])<eps&&Math.abs(c[0]-d[0])<eps&&Math.abs(a[0]-c[0])<eps)return Math.max(0,Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))-Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1])));return 0;
  };
  const routeLead=(px,py,ex,ey)=>{
   const segs=barSegments(),score=ps=>ps.slice(1).reduce((sum,p,i)=>sum+segs.reduce((s,[a,b])=>s+commonLength(ps[i],p,a,b),0),0);
   const a=[[px,py],[ex,py],[ex,ey]],b=[[px,py],[px,ey],[ex,ey]],sa=score(a),sb=score(b);
   if(Math.min(sa,sb)<.01)return sa<=sb?a:b;
   const stub=th*.55,sx=ex>=px?1:-1,sy=ey>=py?1:-1;
   const c=[[px,py],[px+sx*stub,py+sy*stub],[ex,py+sy*stub],[ex,ey]],d=[[px,py],[px+sx*stub,py+sy*stub],[px+sx*stub,ey],[ex,ey]];
   return score(c)<=score(d)?c:d;
  };

  const tag=(m,spec,px,py,ex,ey,side,vertical=false,ticks=null,fix=false,straight=false)=>{const r=th*0.95, len=2*r+th*0.5+tw(spec)+th*0.6;
    const orth=true; if(vertical==="top") ey-=len;   // 세로 꼬리표: 지시선이 밑줄 윗끝에 붙음
    { const k=th*0.22; (ticks||[[px,py]]).forEach(([tx,ty])=>L("S-LEAD",[[tx-k,ty-k],[tx+k,ty+k]])); }   // 표준도: 지시 위치는 점 대신 사선 표시 (모든 꼬리표)
    const i0=E.length; L("S-LEAD",straight?[[px,py],[px,ey],[ex,ey]]:orth?routeLead(px,py,ex,ey):[[px,py],[ex,ey]]);E[i0].callout=DM(m);E[i0].orthogonal=orth;
    TAGS.push({i0,ex,ey,side,orth,fix,straight,box:[side==="r"?ex:ex-len,ey-th*0.35,side==="r"?ex+len:ex,ey+2*r+th*0.25]});
    const x0=side==="r"?ex:ex-len, x1=side==="r"?ex+len:ex; L("S-LEAD",[[x0,ey],[x1,ey]]);
    const bx=side==="r"?ex+r+th*0.2:x0+r; C("S-BUB",bx,ey+r,r); T("S-BUBT",bx,ey+r-th*0.4,DM(m),th*1.05,"c");
    T("S-TXT",bx+r+th*0.4,ey+th*0.3,spec,th,"l"); TAGS[TAGS.length-1].i1=E.length;
    if(vertical){const rot=(x,y)=>[ex-(y-ey),ey+(x-ex)];for(let i=i0+1;i<E.length;i++){const e=E[i];if(e.pts)e.pts=e.pts.map(p=>rot(...p));else{[e.x,e.y]=rot(e.x,e.y);if(e.t==="tx")e.rot=90;}}const t=TAGS[TAGS.length-1],b=t.box,cs=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]].map(p=>rot(...p));t.box=[Math.min(...cs.map(p=>p[0])),Math.min(...cs.map(p=>p[1])),Math.max(...cs.map(p=>p[0])),Math.max(...cs.map(p=>p[1]))];}
  };
  // 꼬리표 겹침 정리: 본체(콘크리트)·다른 꼬리표와 겹치면 위아래(필요하면 바깥쪽)로 옮김
  const fin=()=>{
    const polys=E.filter(e=>e.t==="pl"&&e.layer==="S-CONC"&&e.closed).map(e=>e.pts);
    if(!polys.length){const b=bbox(E.filter(e=>e.layer==="S-CONC")); if(isFinite(b[0])) polys.push([[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]]);}
    const inPoly=(x,y,pg)=>{let c=false;for(let i=0,j=pg.length-1;i<pg.length;j=i++){const a=pg[i],b=pg[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
    const segX=(p1,p2,q1,q2)=>{const d=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const d1=d(q1,q2,p1),d2=d(q1,q2,p2),d3=d(p1,p2,q1),d4=d(p1,p2,q2);return d1*d2<0&&d3*d4<0;};
    const hitPoly=(bx,pg)=>{const [x0,y0,x1,y1]=bx, rc=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
      if(rc.some(([x,y])=>inPoly(x,y,pg))) return true; if(pg.some(([x,y])=>x>x0&&x<x1&&y>y0&&y<y1)) return true;
      for(let i=0;i<pg.length;i++){const a=pg[i],b=pg[(i+1)%pg.length];for(let k=0;k<4;k++) if(segX(a,b,rc[k],rc[(k+1)%4])) return true;} return false;};
    const hitBox=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
    const placed=[], st=th*0.9, own=new Set(); TAGS.forEach(t=>{for(let i=t.i0;i<t.i1;i++) own.add(i);});
    CH.filter(c=>c.fixed&&c.i1&&c.dir==="h").forEach(c=>placed.push([Math.min(c.a,c.b)-th*0.8,c.pos-th*1.2,Math.max(c.a,c.b)+th*0.8,c.pos+th*1.5]));   // 고정 치수선(벽체 중간 등)은 꼬리표가 피해 감
    E.forEach((e,i)=>{ if(e.t!=="tx"||own.has(i)||e.layer!=="S-TXT") return; const w=String(e.s).length*e.h*0.62, h=e.h;
      const x0=e.al==="l"?e.x:e.al==="r"?e.x-w:e.x-w/2; placed.push(e.rot===90?[e.x-h,e.y-w/2,e.x+h*0.2,e.y+w/2]:[x0,e.y-h*0.2,x0+w,e.y+h]); });
    const cand=[]; for(let kx=0;kx<=10;kx++) for(let ky=-14;ky<=14;ky++) cand.push([kx,ky,Math.abs(ky)*st+kx*th*1.2*0.8]);
    cand.sort((p,q)=>p[2]-q[2]);
    TAGS.forEach(t=>{ let best=null; if(t.fix){ placed.push(t.box); return; }   // 위치 고정 꼬리표(W6·W7)
      for(const [kx,ky] of cand){
        const dx=(t.side==="r"?1:-1)*kx*th*1.2, dy=ky*st, bx=[t.box[0]+dx,t.box[1]+dy,t.box[2]+dx,t.box[3]+dy];
        if(polys.some(pg=>hitPoly(bx,pg))||placed.some(q=>hitBox(bx,q))) continue; best={dx,dy,bx}; break; }
      if(!best) best={dx:0,dy:0,bx:t.box};
      placed.push(best.bx);
      if(best.dx||best.dy){ const L0=E[t.i0]; const nx=t.ex+best.dx,ny=t.ey+best.dy;L0.pts=t.straight?[L0.pts[0],[L0.pts[0][0],ny],[nx,ny]]:t.orth?routeLead(L0.pts[0][0],L0.pts[0][1],nx,ny):[L0.pts[0],[nx,ny]];
        for(let i=t.i0+1;i<t.i1;i++){const e=E[i]; if(e.pts) e.pts=e.pts.map(p=>[p[0]+best.dx,p[1]+best.dy]); else {e.x+=best.dx; e.y+=best.dy;}} } });
    // 치수선 정리: 꼬리표(풍선)와 겹치는 치수선은 바깥쪽으로 밀고, 그 바깥 치수선도 같은 만큼 함께 이동
    const tagBoxes=placed.slice(placed.length-TAGS.length);
    const shiftChain=(c,d)=>{ for(let i=c.i0;i<c.i1;i++){const e=E[i];
        if(e.pts) e.pts=e.pts.map(p=>c.dir==="h"?(Math.abs(p[1]-c.pos)<th*1.6?[p[0],p[1]+d]:p):(Math.abs(p[0]-c.pos)<th*1.6?[p[0]+d,p[1]]:p));
        else if(c.dir==="h") e.y+=d; else e.x+=d; }
      for(let i=c.i0;i<c.i1;i++){const e=E[i]; if(e.pts&&e.pts.length===2){ // 보조선은 몸체 쪽 끝을 유지하고 늘림
          const k=c.dir==="h"?1:0; if(Math.abs(e.pts[0][1-k]-e.pts[1][1-k])<1e-6&&Math.abs(e.pts[0][k]-e.pts[1][k])>0){} } }
      c.pos+=d; };
    // 평행한 철근과 같은 선상에 놓인 치수선은 해당 방향의 바깥으로 이격.
    for(const c of CH){if(c.fixed) continue; const bars=barSegments(),lo=Math.min(c.a,c.b),hi=Math.max(c.a,c.b),hits=bars.filter(([a,b])=>c.dir==="h"?Math.abs(a[1]-b[1])<.01&&Math.abs(a[1]-c.pos)<th*.4&&Math.max(a[0],b[0])>lo&&Math.min(a[0],b[0])<hi:Math.abs(a[0]-b[0])<.01&&Math.abs(a[0]-c.pos)<th*.4&&Math.max(a[1],b[1])>lo&&Math.min(a[1],b[1])<hi);
     if(hits.length){const axis=c.dir==="h"?1:0,coords=bars.flat().map(p=>p[axis]),pos=c.side>0?Math.max(...coords)+th*2:Math.min(...coords)-th*2;shiftChain(c,pos-c.pos);}
    }
    ["h","v"].forEach(dir=>[1,-1].forEach(sd=>{ const cs=CH.filter(c=>c.dir===dir&&c.side===sd&&c.i1&&!c.fixed).sort((p,q)=>sd*(p.pos-q.pos));
      cs.forEach((c,ci)=>{ for(let it=0;it<12;it++){ const lo=Math.min(c.a,c.b)-th, hi=Math.max(c.a,c.b)+th; let need=0;
        tagBoxes.forEach(bx=>{ const par=dir==="h"?[bx[0],bx[2]]:[bx[1],bx[3]], per=dir==="h"?[bx[1],bx[3]]:[bx[0],bx[2]];
          if(par[1]<lo||par[0]>hi) return; const band=[c.pos-th*1.7,c.pos+th*1.7]; if(per[1]<band[0]||per[0]>band[1]) return;
          if(sd>0?per[0]>c.pos+th*0.3:per[1]<c.pos-th*0.3) return;   // 치수선 바깥에 통째로 있는 꼬리표만 무시 (걸쳐 있으면 치수선을 밀어냄)
          need=Math.max(need, sd>0?per[1]-(c.pos-th*1.7)+th*0.4:(c.pos+th*1.7)-per[0]+th*0.4); });
        if(need>0&&need<th*8) cs.slice(ci).forEach(o=>shiftChain(o,sd*need)); else break; } }); }));
    // 위쪽 소제목(전면·배면 등)이 밀려난 치수선과 겹치면 그 위로 올림
    const tops=CH.filter(c=>c.dir==="h"&&c.side>0&&c.i1).map(c=>c.pos);
    if(tops.length){ const mt=Math.max(...tops), m0=Math.min(...tops); E.forEach(e=>{ if(e.t==="tx"&&e.layer==="S-TTL"&&!e.rot&&e.y>m0-th*2&&e.y<mt+th*2.2) e.y=mt+th*2.4; }); }
    // 왼쪽 세로 소제목(상부·하부)이 밀려난 치수선과 겹치면 그 바깥으로
    const lefts=CH.filter(c=>c.dir==="v"&&c.side<0&&c.i1).map(c=>c.pos);
    if(lefts.length){ const ml=Math.min(...lefts); E.forEach(e=>{ if(e.t==="tx"&&e.layer==="S-TTL"&&e.rot===90&&e.x<0&&e.x>ml-th*2.6) e.x=ml-th*2.8; }); }
    return E; };
  const brk=(x,z,len,vert,ly="S-CONC")=>{const a=len*0.25,b=len*0.15; L(ly,vert?[[x,z-len/2],[x,z-a],[x+b,z-a*0.3],[x-b,z+a*0.3],[x,z+a],[x,z+len/2]]:[[x-len/2,z],[x-a,z],[x-a*0.3,z+b],[x+a*0.3,z-b],[x+a,z],[x+len/2,z]]);};
  return {E,L,T,C,chainH,chainV,tag,brk,tw,fin};
}
const dSpec=(R,m)=>R.P.bar[m]?R.P.bar[m].dia:"";
function secView(R,th){setWT(R);
  const {P,G}=R, K=viewKit(th), {L,C,chainH,chainV,tag}=K, B=G.B, H=P.H, D=P.D;
  L("S-CONC",G.concOutline,true);
  R.bars.forEach(b=>(b.secs||[b.pts]).forEach(q=>L("S-BAR",q)));
  [...R.dots.W3,...R.dots.W5,...R.dots.F3,...R.dots.F4,...R.dots.K2,...(R.dots.WD||[])].forEach(([x,z])=>C("S-DIST",x,z,th*0.2));
  const kb=G.hasKey?P.hk:0, fsL=R.bars.some(b=>b.m==="FS"), faceL=z=>((fsL||P.wtype==="T"||P.wtype==="RL")&&z>=0&&z<=Math.max(D,Math.min(...R.dots.W3.map(q=>q[1])))+1)?(fsL?-th*0.9:0):z>=D?(P.hh>0&&z<D+P.hh?P.B1-P.hh+(z-D):R.xf(Math.min(z,H))):(z>=0?0:P.kx);   /* 벽체 전면 하단 헌치면까지 */   // 역T형: 저판 아래쪽 보조선은 F6 지시선 바깥에서 시작
  // 좌측: 철근 간격 / 벽체·기초 / 전체
  const zW3=[...new Set(R.dots.W3.map(d=>d[1]))];
  const w4=R.bars.find(b=>b.m==="W4"), zTopBar=H-P.cw;
  const D1=G.D1??D;   // 앞굽 끝 두께 (헌치)
  const loL=null;   // 역T형: 좌측 치수선 아래 끝 = 하단 치수 보조선 시작 높이
  const dxRL=P.wtype==="RL"&&R.bars.some(b=>b.m==="F5")?th*1.4:0, faceRL=z=>dxRL&&z<=D+1?-th*1.3:faceL(z);   /* 역L형: 왼쪽 치수 전체를 F5 지시선 바깥으로, 저판 높이 보조선은 F5 지시선 바깥에서 시작 */
  chainV([0,P.cf,...(D1<D&&P.B1>0?[D1-P.cf]:[]),D-P.cf,...zW3,zTopBar,H],(fsL?-th*3.2:-th*2.6)-dxRL,faceRL,undefined,{breaks:[D-P.cf,Math.min(...zW3)],lo:loL});   // 표준도: 저판 상면 철근 → 첫 수평근 구간은 따로 표기   // 저판 상면 철근 높이(앞굽 끝·벽체 아래)에서 나눔
  const zIn=[0,P.cf,...(D1<D&&P.B1>0?[D1-P.cf]:[]),D-P.cf,...zW3,zTopBar,H], xIn=(fsL?-th*3.2:-th*2.6)-dxRL, cutL=z=>zIn.some(v=>Math.abs(v-z)<1)?faceRL(z):xIn-th*1.1;   // 안쪽 치수에 없는 높이의 보조선은 안쪽 치수 글자 앞에서 끊음
   chainV([0,...(D1<D&&P.B1>0?[D1]:[]),D,H],(fsL?-th*5.8:-th*5.2)-dxRL,cutL,undefined,{lo:loL}); chainV([0,H],(fsL?-th*8.4:-th*7.8)-dxRL,faceRL,undefined,{lo:loL});
  // 상단: 벽체 두께와 철근 위치
  const w2=R.bars.find(b=>b.m==="W2"), w1=R.bars.find(b=>b.m==="W1");
  chainH([G.xft,w2.pts[0][0],w1.pts[0][0],G.xbt],H+th*3.9,H+th*2.5); chainH([G.xft,G.xbt],H+th*6.5,H+th*2.5);   // 보조선은 W6·W7 꼬리표 원형 위에서 시작
  // 벽체 하단 두께 · 뒷굽
  const w8m=R.bars.find(b=>b.m==="W8"), zW8tag=w8m?D+(Math.min(w8m.zc,D+(H-D)*0.5)-D)*0.6:D+(H-D)*0.3;   // 표시 W2 꼬리표 높이
  const ym=(()=>{const t=D+(H-D)*0.5, zz=[...zW3].sort((a,b)=>a-b), m=[]; for(let i=0;i<zz.length-1;i++) m.push((zz[i]+zz[i+1])/2); return m.length?m.reduce((p,q)=>Math.abs(q-t)<Math.abs(p-t)?q:p):t;})();
  chainH([...(P.B1>0?[0]:[]),R.xf(D),G.xbb,B],ym,()=>Math.min(zW8tag+th*2.1,ym-th*1.0),undefined,{fixed:true});   // 보조선은 W2 원형 위에서 시작 (꼬리표와 안 겹치게)   // 표준도처럼 벽체 중간 높이 (수평철근 사이)에 고정
  // 우측: 기초 철근 위치
  const F1=R.bars.find(b=>b.m==="F1");
  chainV([...(G.hasKey?[-P.hk,-P.hk+P.ck]:[]),0,P.cf,G.D2-P.cf,G.D2],B+th*4.7,()=>P.wtype==="RL"?B:B+th*2.6);   /* 역L형은 우측 꼬리표가 없으므로 저판 면에서 */
  if(P.wtype==="T"&&(G.D2<D||(G.D1??D)<D)) chainV([0,D],B+th*7.4,B+th*2.6);   // 역T형: 벽체와 저판이 만나는 곳의 저판 두께 (끝이 얇아지는 경우). 보조선은 F2 지시선 오른쪽에서 시작   // 치수선 위치는 그대로, 보조선 6개는 F5 꼬리표 규격(H) 글자 앞에서 시작
  // 하단: 저판 철근 간격 / 전체
  const xs3=[...new Set(R.dots.F3.map(d=>d[0]))];
  const hasFS=R.bars.some(b=>b.m==="FS"), yB=-kb-th*(G.hasKey?5.2:3.4)-(hasFS?th*1.6:0)-(P.wtype==="T"?th*2.2:0);   // 역T형: 표준도처럼 꼬리표 아래에서 시작하는 보조선이 충분히 길게 하단 치수를 내림   // 역T형 F6 꼬리표를 낮춘 만큼 하단 치수도 내림
  const isT=P.wtype==="T", yC=-P.hk-th*2.4, yKey=isT?-P.hk-th*4.0:-P.hk-th*2.4;   // 역T형: 하단 보조선은 모두 같은 높이(꼬리표 아래)에서 시작, 전단키 치수는 그 아래
  if(G.hasKey){const k1=R.bars.find(b=>b.m==="K1"); chainH([P.kx,k1?k1.pts[2][0]:P.kx+P.ck,k1?k1.pts[3][0]:P.kx+P.bk-P.ck,P.kx+P.bk],yKey,-P.hk);}   // 전단키 치수 보조선은 키 바닥에서 시작
  const botSpans=[];   // 아래쪽 꼬리표(F1·F4) 가로 범위: 이 범위에 걸리는 하단 보조선만 꼬리표 밑줄 아래에서 끝
  const drawBottom=()=>{ const ybRef=x=>(G.hasKey&&x>=P.kx&&x<=P.kx+P.bk)?((isT||P.wtype==="RL")?yKey-th*0.6:-P.hk):(keyL&&keyL.k8low&&x>=keyL.k8span[0]&&x<=keyL.k8span[1])?yt-th*3.4:(P.wtype==="T"||P.wtype==="RL"?-(G.hasKey?P.hk:0)-th*2.4:0);   /* 역L형도 하단 보조선은 꼬리표 줄 아래에서 */
    chainH([0,P.cf,...xs3,B-P.cf,B],yB,ybRef); chainH([0,B],yB-th*2.6,ybRef); };
  // 꼬리표
  const zm=(D+H)/2, xb1=z=>w1.pts[0][0]+(w1.pts[1][0]-w1.pts[0][0])*(w1.pts[0][1]-z)/(w1.pts[0][1]-w1.pts[1][1]);
  const xb2=z=>w2.pts[0][0]+(w2.pts[1][0]-w2.pts[0][0])*(w2.pts[0][1]-z)/(w2.pts[0][1]-w2.pts[1][1]);
  // 표준도 배치: 전면 W3(내부 W2)·W6(뚜껑) 왼쪽, W7·W1·W2(단절) 오른쪽, 저판 F2(상면) 뒷굽 위, F1(하면)·F6(키) 아래, F5 오른쪽 아래
  const zc=z=>Math.min(Math.max(z,D),H);
  const w7=R.bars.find(b=>b.m==="W7");
  let X46=w4?(w4.pts[1][0]+w4.pts[2][0])/2:(G.xft+G.xbt)/2;   // 표준도: W6·W7 같은 높이, 세로 지시선 하나를 공유하고 밑줄이 그 점에서 좌우로
  if(w7){const L0=Math.max(...w7.secs.map(q=>Math.min(q[0][0],q[1][0]))), R0=Math.min(...w7.secs.map(q=>Math.max(q[0][0],q[1][0]))); if(!(X46>L0&&X46<R0)) X46=(L0+R0)/2;}
  const xW6=X46-th*0.15, xW7=X46+th*0.15;   // 보내준 표준도: 지시선 2개가 나란히, W6은 낮게 왼쪽 / W7은 조금 높게 오른쪽
  if(w4) tag("W4",dSpec(R,"W4"),xW6,w4.pts[1][1],xW6,H+th*0.6,"l",false,null,true);
  if(w7){   // F5처럼: 벽체 중앙을 세로로 지나는 지시선 하나가 W7 전부를 가로지르고 교차점마다 사선, 위로 올라가 W7 꼬리표
    const zs=w7.secs.map(q=>(q[0][1]+q[1][1])/2), L0=Math.max(...w7.secs.map(q=>Math.min(q[0][0],q[1][0]))), R0=Math.min(...w7.secs.map(q=>Math.max(q[0][0],q[1][0]))), x7=xW7;
    tag("W7",dSpec(R,"W7"),x7,Math.min(...zs),x7+th*2.6,H+th*1.2,"r",false,zs.map(z=>[x7,z]),true); }
  { const z=D+(H-D)*0.8; tag("W2",dSpec(R,"W2"),xb2(z),z,R.xf(zc(z))-th*0.8,z,"l"); }
  { const z=D+(H-D)*0.7; tag("W1",dSpec(R,"W1"),xb1(z),z,R.xb(zc(z))+th*0.8,z,"r"); }
  { const z7=(R.bars.find(b=>b.m==="W7")?.secs||[]).map(q=>q[0][1]), free=arr=>{const f=arr.filter(p=>!z7.some(z=>Math.abs(z-p[1])<1));return f.length?f:arr;}, nearZ=(arr,t)=>{arr=free(arr);return arr.reduce((a,p)=>Math.abs(p[1]-t)<Math.abs(a[1]-t)?p:a,arr[0]);};   // W7 연결철근이 지나는 단은 피함   // 수평 배력근(표시 W4 전면 · W5 배면): 점 하나를 가리킴
    if(R.dots.W3.length){ const p=nearZ(R.dots.W3,D+(H-D)*0.6); tag("W3",dSpec(R,"W3"),p[0],p[1],R.xf(zc(p[1]))-th*0.8,p[1],"l",false,null,true); }
    { const wh=R.bars.find(b=>b.m==="WH"); if(wh&&P.hh>0){ const [a,b]=wh.pts, mx=P.B1-P.hh/2, mz=P.D+P.hh/2, dx=b[0]-a[0], dz=b[1]-a[1], t=Math.max(0,Math.min(1,(P.D+P.hh+th*1.2-a[1])/(dz||1))), px=a[0]+t*dx, pz=a[1]+t*dz;   /* 헌치 위(벽체 안) 점: H2 지시선과 겹치지 않게 */
      tag("WH",dSpec(R,"WH"),px,pz,P.B1-P.hh-th*0.8,pz,"l"); } }   // 헌치 철근(표시 H1)
    if((R.dots.WD||[]).length&&P.hh>0){ const q=R.dots.WD[Math.floor((R.dots.WD.length-1)/2)]; tag("WD",dSpec(R,"WD"),q[0],q[1],P.B1-P.hh-th*0.8,P.D+th*0.5,"l"); }   // 헌치 가로철근(표시 H2)
    if(R.dots.W5.length){ const p=nearZ(R.dots.W5,D+(H-D)*0.57); tag("W5",dSpec(R,"W5"),p[0],p[1],R.xb(zc(p[1]))+th*0.8,p[1],"r",false,null,true); } }
  { const w8=R.bars.find(b=>b.m==="W8"); if(w8){ const z=zW8tag, x=w8.pts[0][0]+(w8.pts[1][0]-w8.pts[0][0])*(w8.pts[0][1]-z)/((w8.pts[0][1]-w8.pts[1][1])||1); tag("W8",dSpec(R,"W8"),x,z,R.xb(zc(z))+th*0.8,z,"r"); } }
  if(F1){const x=P.B3>0?G.xbb+(B-G.xbb)*0.62:P.B1*0.45;
    let y=F1.pts[2][1]; for(let i=0;i<F1.pts.length-1;i++){const [a0,a1]=[F1.pts[i],F1.pts[i+1]]; if(Math.abs(a1[0]-a0[0])>1&&x>=Math.min(a0[0],a1[0])&&x<=Math.max(a0[0],a1[0])){ y=a0[1]+(a1[1]-a0[1])*(x-a0[0])/(a1[0]-a0[0]); break; }}   // 경사진 상면 철근 위의 실제 높이
    tag("F1",dSpec(R,"F1"),x,y,x,D+th*(P.wtype==="T"?2.6:5.4),"r");}   // 역T형: 표준도처럼 낮게
  const F2=R.bars.find(b=>b.m==="F2"), yt=-(G.hasKey?P.hk:0)-th*1.4, yRLtag=y=>P.wtype==="RL"?Math.max(y,ySide!=null?ySide-th*2.6:-th*3.0):y;   /* 역L형: 키가 깊어도 앞굽 꼬리표(F1·F5)는 저판 바로 아래 높이 */
  // 역T형 · 전단키가 뒷굽 아래: 표시 F1·F4 꼬리표를 키 왼쪽 빈 공간(저판 바로 아래)에 나란히 (F4 왼쪽, F1 오른쪽)
  const keyL=(()=>{ if(P.wtype!=="T"||!G.hasKey||!(P.kx>G.xbb)) return null;
    const tw0=m=>th*1.9+th*1.1+dSpec(R,m).length*th*0.62, deep=-th*3.1>=-P.hk+th*0.2;
    // 키가 깊으면 저판 바로 아래(키 옆), 얕으면(화면 글씨가 크면) 다른 꼬리표 줄에서 F8 꼬리표 왼쪽에 나란히
    let ey=deep?-th*2.7:yt, x1=deep?P.kx-th*0.4-tw0("F2"):P.kx-th*0.6-tw0("K1")-th*0.8-tw0("F2"), k8low=false;
    const room=x=>R.dots.F3.some(p=>p[0]>th*0.5&&p[0]<x-th*1.0)&&x>=th*2;
    if(!deep&&!room(x1)){ x1=P.kx-th*0.4-tw0("F2"); k8low=true; }   // 그래도 자리가 없으면 F4·F1은 키 왼쪽 같은 줄, F8만 한 줄 아래
    const tieX=(R.bars.find(b=>b.m==="F5")?.secs||[]).map(q=>(q[0][0]+q[1][0])/2);
    const c0=R.dots.F3.filter(p=>p[0]>th*0.5&&p[0]<x1-th*1.0).sort((a,b)=>b[0]-a[0]), cF=c0.filter(p=>!tieX.some(x=>Math.abs(x-p[0])<th*0.3)), c=cF.length&&Math.abs(cF[0][0]-c0[0][0])<=P.bar.F3.s*1.6?cF:c0;   // 연결철근이 촘촘하면 겹쳐도 가장 가까운 점
    if(!c.length||x1<th*2) return null; return {x1:c[0][0]+th*1.2,p4:c[0],ey,k8low,k8span:[P.kx-th*0.9-tw0("K1"),P.kx-th*0.3]}; })();   // F1 지시선은 F4 지시선 바로 오른쪽
  const ySide=(P.wtype==="RL"&&G.hasKey)?(()=>{const y=-Math.max(th*2.6,P.hk*0.5); return y>=-P.hk+th*0.3?y:null;})():null;   // L·역L형: 키 옆 꼬리표 높이 (저판 바닥과 키 바닥 사이)
  if(F2&&keyL){ tag("F2",dSpec(R,"F2"),keyL.x1,Math.min(...F2.pts.map(p=>p[1])),keyL.x1,keyL.ey,"r",false,null,true,true); }
  else if(F2){let x=P.wtype==="RL"?P.B1*0.5:G.xbb+(B-G.xbb)*0.3, ex=x;   /* 역L형은 뒷굽이 없으므로 앞굽 쪽 */ let side2=false; if(G.hasKey&&x>P.kx-th*4&&x<P.kx+P.bk+th*1.5){ x=P.kx+P.bk+th*0.5; ex=x; side2=true; if(x>B-th*1.5){x=Math.max(G.xbb*0.5,th*0.5); ex=x; side2=false;} } tag("F2",dSpec(R,"F2"),x,Math.min(...F2.pts.map(p=>p[1])),ex,side2&&ySide!=null?ySide:yRLtag(yt),(P.wtype==="T"||(P.wtype==="RL"&&!side2))?"l":"r"); { const ln=th*3+dSpec(R,"F2").length*th*0.62; botSpans.push((P.wtype==="T"||(P.wtype==="RL"&&!side2))?[ex-ln,ex]:[ex,ex+ln]); }   /* 역L형: 꼬리표를 왼쪽으로 */   /* 하면 철근 높이 (역T형은 앞굽 끝 갈고리가 첫 점) */}   // 키 치수보조선과 겹치지 않게
  if(G.hasKey){const k1=R.bars.find(b=>b.m==="K1"); if(k1) tag("K1",dSpec(R,"K1"),k1.pts[2][0],-P.hk*0.5,P.kx-th*0.6,ySide!=null?ySide:keyL&&keyL.k8low?yt-th*2.6:yt,"l",false,[[k1.pts[2][0],-P.hk*0.5]],!!(keyL&&keyL.k8low));}
  if(P.wtype==="T"&&P.B3>0){   // 역T형 배력근: 표시 F5(상부, 내부 F4)는 뒷굽 위, 표시 F4(하부, 내부 F3)는 뒷굽 아래
    const near=(arr,t)=>arr.reduce((a,p)=>Math.abs(p[0]-t)<Math.abs(a[0]-t)?p:a,arr[0]);
    const up=R.dots.F4.filter(p=>p[0]>G.xbb+th), dn=R.dots.F3.filter(p=>p[0]>G.xbb+th);
    const tieX=(R.bars.find(b=>b.m==="F5")?.secs||[]).map(q=>(q[0][0]+q[1][0])/2), onTie=p=>tieX.some(x=>Math.abs(x-p[0])<th*0.3), off=(arr,p,dir=-1)=>{if(!onTie(p))return p; const c=arr.filter(q=>!onTie(q)), q=c.length?near(c,p[0]+dir*1e-6):null; return q&&Math.abs(q[0]-p[0])<=P.bar.F3.s*1.6?q:p;};   // 바로 옆에 연결철근 없는 점이 없으면(전단보강으로 촘촘) 원래 점 그대로   // 연결철근과 같은 위치 점은 피함 (지시선이 연결철근과 겹치지 않게)
    if(up.length){const us=[...up].sort((a,b)=>a[0]-b[0]), p0=near(us,G.xbb+(B-G.xbb)*0.3), p=off(us,us[Math.min(2,us.length-1)]); tag("F4",dSpec(R,"F4"),p[0],p[1],p[0],D+th*2.6,"r",false,null,false,true);}   // 뒷굽 상부 배력근 왼쪽에서 3번째 (꼬리표는 벽체와 안 겹치게 오른쪽)
    if(dn.length&&keyL){const p=keyL.p4; tag("F3",dSpec(R,"F3"),p[0],p[1],p[0],keyL.ey,"l",false,null,true,true);}
    else if(dn.length){const p=off(dn,near(dn,G.xbb+(B-G.xbb)*0.74),1); tag("F3",dSpec(R,"F3"),p[0],p[1],p[0],yt,"l",false,null,false,true); botSpans.push([p[0]-th*3-dSpec(R,"F3").length*th*0.62,p[0]]);} }
  const ft=R.bars.find(b=>b.m==="FT"); if(ft&&P.B1>0){   // 역T형 표시 F3 (상면 전체): 앞굽 위 왼쪽 꼬리표, 지시선은 앞굽 상면 철근으로
    const x=P.B1*0.8, y=G.topZ(x)-P.cf; tag("FT",dSpec(R,"FT"),x,y,x,D+th*2.2,"l"); }
  const fs=R.bars.find(b=>b.m==="FS"); if(fs){   // 역T형 표시 F6 (앞굽 연결철근): 가로 지시선이 앞굽 연결철근을 가로지르고 앞굽 끝 바깥으로 나가 왼쪽 아래 꼬리표
    const xs=fs.secs.map(q=>(q[0][0]+q[1][0])/2), lo=Math.max(...fs.secs.map(q=>Math.min(q[0][1],q[1][1]))), hi=Math.min(...fs.secs.map(q=>Math.max(q[0][1],q[1][1]))), y6=(lo+hi)/2;
    tag("FS",dSpec(R,"FS"),Math.max(...xs),y6,-th*1.0,yt-th*1.6,"l",false,xs.map(x=>[x,y6])); }   // 좌측 치수 끝과 겹치지 않게 아래로
  const f5=R.bars.find(b=>b.m==="F5"); if(f5){ const xs=f5.secs.map(q=>(q[0][0]+q[1][0])/2), lo=Math.max(...f5.secs.map(q=>Math.min(q[0][1],q[1][1]))), hi=Math.min(...f5.secs.map(q=>Math.max(q[0][1],q[1][1]))), y5=(lo+hi)/2;
    if(P.wtype==="RL") tag("F5",dSpec(R,"F5"),Math.max(...xs),y5,-th*1.0,yRLtag(yt)-th*1.6,"l",false,xs.map(x=>[x,y5]));   /* 역L형: 앞굽 연결철근 — 역T형 앞굽 연결철근처럼 앞굽 끝 바깥 왼쪽 아래 꼬리표 */
    else tag("F5",dSpec(R,"F5"),Math.min(...xs),y5,B+th*0.6,yt,"r",false,xs.map(x=>[x,y5])); }   // 표준도처럼 지시선 하나가 F5 전부를 가로지르고 교차점마다 사선
  drawBottom();
  const EE=K.fin(), yLow=Math.min(...EE.flatMap(e=>e.pts?e.pts.map(p=>p[1]):[e.y]));   // 수정 안내는 모든 치수 아래로
  correctionNotes(R).filter(n=>n.keys.length).forEach((n,i)=>EE.push({t:"tx",layer:"S-BAR",x:B/2,y:yLow-th*(1.6+i*1.8),s:"수정 "+n.keys.map(DM).join("/")+" : "+n.keys.map(k=>P.bar[k].dia+"@"+P.bar[k].s).join(" / ")+" — 상단 수정 안내 참조",h:th,al:"c",rot:0}));
  return {E:EE,th};
}
function elevView(R,th){setWT(R);
  const {P,G}=R, K=viewKit(th), {L,T,C,chainH,chainV,tag,brk}=K, W=1000, H=P.H, D=P.D;
  L("S-CONC",[[0,H],[2*W,H]]); L("S-CONC",[[0,0],[2*W,0]]);
  // 좌우 끝선은 벽이 아니라 연장 방향으로 이어지는 단위길이 절단선 → 빨간 끊김선
  [0,2*W].forEach(x=>{L("S-BRK",[[x,0],[x,H*0.47]]);L("S-BRK",[[x,H*0.53],[x,H]]);brk(x,H/2,H*0.06,true,"S-BRK");});
  L("S-CEN",[[W,-th*0.6],[W,H+th*3.4]]);
  T("S-TTL",W/2,H+th*5.2,"전 면",th*1.5); T("S-TTL",W*1.5,H+th*5.2,"배 면",th*1.5);
  const zr=b=>{const z=b.pts.map(p=>p[1]);return [Math.min(...z),Math.max(...z)];};
  const w1=R.bars.find(b=>b.m==="W1"), w2=R.bars.find(b=>b.m==="W2"), w4=R.bars.find(b=>b.m==="W4");
  const vx=(a,b,s)=>{const o=[];for(let x=a+s/2;x<b;x+=s)o.push(x);return o;};
  // 좌우 끝은 연속 절단선 → 철근은 바깥 끝선에서 시작해 간격대로 (중심선 위에는 없음)
  const fromL=(a,b,s)=>{const o=[];for(let x=a;x<b-1;x+=s)o.push(x);return o;}, fromR=(a,b,s)=>{const o=[];for(let x=b;x>a+1;x-=s)o.push(x);return o.reverse();};
  const [a2,b2]=zr(w2),[a1,b1]=zr(w1), X2=fromL(0,W,P.bar.W2.s), X1=fromR(W,2*W,P.bar.W1.s);
  X2.forEach(x=>L("S-BAR",[[x,a2],[x,b2]])); X1.forEach(x=>L("S-BAR",[[x,a1],[x,b1]]));
  const w8=R.bars.find(b=>b.m==="W8"); if(w8){ const [a8,b8]=zr(w8); fromR(W,2*W-P.bar.W8.s/2,P.bar.W8.s).forEach(x=>L("S-BAR",[[x,a8],[x,b8]]));
    { const x8=fromR(W,2*W-P.bar.W8.s/2,P.bar.W8.s), zz=[...new Set(R.dots.W5.map(d=>d[1]))].sort((p,q)=>p-q), t=D+(b8-D)*0.45; let z=t,bd=1e18;
      for(let i=0;i<zz.length-1;i++){const m=(zz[i]+zz[i+1])/2; if(m<b8&&Math.abs(m-t)<bd){bd=Math.abs(m-t);z=m;}}
      tag("W8",dSpec(R,"W8"),Math.min(...x8),z,2*W+th*0.3,z,"r",false,x8.map(x=>[x,z]),true); }   // 표준도: 첫 W2 철근에서 시작하는 가로 지시선, 교차점마다 사선
  }
  if(w4){const lg=w4.b,zt=w4.pts[1][1]; [...fromL(0,W,P.bar.W4.s),...fromR(W,2*W,P.bar.W4.s)].forEach(x=>L("S-BAR",[[x,zt-lg],[x,zt]]));}
  const zW3=[...new Set(R.dots.W3.map(d=>d[1]))], zW5=[...new Set(R.dots.W5.map(d=>d[1]))];
  zW3.forEach(z=>L("S-BAR",[[0,z],[W,z]])); zW5.forEach(z=>L("S-BAR",[[W,z],[2*W,z]]));   // 끊김선·중심선까지 끝까지
  const w7b=R.bars.find(b=>b.m==="W7");
  if(w7b){ const s7=P.bar.W7.s, lg=100, zs7=w7b.secs.map(q=>q[0][1]);
    const k7=Math.min(th*0.6,P.bar.W1.s*0.28);   // 표준도 방식: 배면 입면에만 짧은 사선, 단마다 반 간격씩 엇갈려(지그재그) 표시. 전면은 표시하지 않음
    const st7=Math.max(1,Math.round(s7/P.bar.W1.s));   // W7은 배면 수평근 단과 W1 수직근이 만나는 점에, 단마다 엇갈려 배치
    zs7.forEach((z,j)=>X1.forEach((x,i)=>{ if(i%st7===j%st7) L("S-BAR",[[x-k7*0.6,z-k7],[x+k7*0.6,z+k7]]); })); }   // 철근(사선)은 표시, 꼬리표만 생략
  const F1=R.bars.find(b=>b.m==="F1"), zF1=F1?F1.pts[2][1]:D-P.cf;
  [P.cf+12,zF1-12].forEach(z=>L("S-BAR",[[0,z],[2*W,z]]));
  fromR(W,2*W,(P.wtype==="T"&&P.bar.FT)?1000/(1000/P.bar.F1.s+1000/P.bar.FT.s):P.bar.F1.s).forEach(x=>C("S-DIST",x,zF1,th*0.2));   /* 역T형: 상면 F2·F3 합친 간격 */ fromR(W,2*W,P.bar.F2.s).forEach(x=>C("S-DIST",x,P.cf,th*0.2));   // 기초 점철근은 배면 쪽만 (전면은 생략), 상면·하면 각자 간격
  // 치수
  // 전면(좌)·배면(우) 따로: 상단은 각 면 수직근 위치, 좌측은 전면 수평근, 우측은 배면 수평근
  const sBack=(()=>{const xs=[...X1,...(w8?fromR(W,2*W-P.bar.W8.s/2,P.bar.W8.s):[])].map(Math.round).sort((a,b)=>a-b); let m=P.bar.W1.s; for(let i=0;i<xs.length-1;i++){const d=xs[i+1]-xs[i]; if(d>1&&d<m) m=d;} return m;})();   // 배면은 W1·W2(내부 W8) 합친 간격
  chainH([0,W],H+th*4.6,H+th*2.45,`@${P.bar.W2.s}`); chainH([W,2*W],H+th*4.6,H+th*2.45,`@${sBack}`);   // 보조선은 W4·W5 꼬리표 위에서 시작
  const zTop=H-P.cw;
  chainV([0,P.cf,D-P.cf,...zW3,zTop,H],-th*2.6,0,undefined,{breaks:[D-P.cf,Math.min(...zW3)]});   // 저판 상면 철근 위치(D-피복)에서 나눔 · 맨 왼쪽 벽체·기초 치수선은 표시하지 않음
  chainV([0,P.cf,D-P.cf,...(w8?[w8.zc]:[]),zTop,H],2*W+th*2.6,2*W);
  const zm=(D+H)/2;
  // 표준도: 가로 지시선 하나가 수직근 전부를 가로지르고 교차점마다 사선 (전면 W3는 중심선→왼쪽 꼬리표, 배면 W1은 중심선→오른쪽 꼬리표)
  const zMid=(zs,t)=>{const v=[...zs].sort((a,b)=>a-b); let best=t,bd=1e18; for(let i=0;i<v.length-1;i++){const m=(v[i]+v[i+1])/2; if(Math.abs(m-t)<bd){bd=Math.abs(m-t);best=m;}} return best;};
  { const z=zMid(zW3,D+(H-D)*0.68); tag("W2",dSpec(R,"W2"),W,z,-th*0.3,z,"l",false,[...X2.map(x=>[x,z]),[W,z]],true); }
  { const z=zMid(zW5,D+(H-D)*0.74); tag("W1",dSpec(R,"W1"),W,z,2*W+th*0.3,z,"r",false,[[W,z],...X1.map(x=>[x,z])],true); }
  // 표준도: 세로 지시선 하나가 수평근 전부를 가로지르고 교차점마다 사선 → 위로 올라가 꼬리표 (전면 W4는 왼쪽, 배면 W5는 오른쪽)
  const midGap=(xs,t)=>{const v=[...xs].sort((a,b)=>a-b); let best=t,bd=1e18; for(let i=0;i<v.length-1;i++){const m=(v[i]+v[i+1])/2; if(Math.abs(m-t)<bd){bd=Math.abs(m-t);best=m;}} return best;};
  if(zW3.length){const x=midGap(X2,W*0.62); tag("W3",dSpec(R,"W3"),x,Math.min(...zW3),x,H+th*0.8,"l",false,zW3.map(z=>[x,z]),true);}
  if(zW5.length){const x=midGap([...X1,...(w8?fromR(W,2*W-P.bar.W8.s/2,P.bar.W8.s):[])],W*1.3); tag("W5",dSpec(R,"W5"),x,Math.min(...zW5),x,H+th*0.8,"r",false,zW5.map(z=>[x,z]),true);}
  // W6(내부 W4)는 벽체 입면에 표시하지 않음 (표준도)
  { const x3=midGap(X2,W*0.5), x4=midGap([...X1,...(w8?fromR(W,2*W-P.bar.W8.s/2,P.bar.W8.s):[])],W*1.4);   // 표준도: 지시선이 밑줄 끝에서 올라가 철근에 사선으로 딱 끝남
    tag("F3",dSpec(R,"F3"),x3,P.cf+12,x3,-th*2.0,"l",false,null,true);
    tag("F4",dSpec(R,"F4"),x4,zF1-12,x4,-th*2.0,"r",false,null,true); }
  // W7 꼬리표는 벽체 입면에 표시하지 않음 (표준도)
  return {E:K.fin(),th};
}
function planView(R,th){setWT(R);
  const {P,G}=R, K=viewKit(th), {L,T,C,chainH,chainV,tag,brk}=K, B=G.B, W=1000;
  L("S-CONC",[[0,0],[0,2*W]]); L("S-CONC",[[B,0],[B,2*W]]);
  [0,2*W].forEach(y=>{L("S-BRK",[[0,y],[B*0.47,y]]);L("S-BRK",[[B*0.53,y],[B,y]]);brk(B/2,y,B*0.06,false,"S-BRK");});   // 위·아래 끝선 = 연장 방향 절단선
  L("S-CEN",[[-th*6,W],[B+th*0.6,W]]);
  [G.xft,G.xbb].forEach(x=>L("S-HID",[[x,W],[x,2*W]]));
  if(G.hasKey) [P.kx,P.kx+P.bk].forEach(x=>L("S-HID",[[x,0],[x,W]]));
  if(G.hasKey){ const k1=R.bars.find(b=>b.m==="K1"), sk=P.bar.K1&&P.bar.K1.s;   // 전단키 전단철근(표시 F6): 하부에 양 다리 위치를 점 2개씩, 간격마다
    if(k1&&sk>0){ const xk=[k1.pts[2][0],k1.pts[3][0]]; for(let y=0;y<W-1;y+=sk) xk.forEach(x=>C("S-DIST",x,y,th*0.2)); } }
  const F1=R.bars.find(b=>b.m==="F1"), F2=R.bars.find(b=>b.m==="F2");
  const xr=b=>{const x=b.pts.map(p=>p[0]);return [Math.min(...x),Math.max(...x)];};
  const ys=(a,b,s)=>{const o=[];for(let y=a+s/2;y<b;y+=s)o.push(y);return o;};
  // 위·아래 끝은 연속 절단선 → 각 층 철근은 바깥 끝선에서 시작해 간격대로 (중심선 위에는 없음)
  const FTb=R.bars.find(b=>b.m==="FT"), TS=!!FTb, topS=TS?1000/(1000/P.bar.F1.s+1000/P.bar.FT.s):P.bar.F1.s;   // 역T형: 상면 F3(전체)·F2(뒷굽용) 번갈아
  const YU=[], YD=[]; for(let y=2*W;y>W+1;y-=topS) YU.unshift(y); for(let y=0;y<W-1;y+=P.bar.F2.s) YD.push(y);
  const [a1,b1]=xr(F1),[a2,b2]=xr(F2), [aT,bT]=TS?xr(FTb):[a1,b1];
  const YUt=TS?YU.filter((y,k)=>(YU.length-1-k)%2===0):[], YUf=TS?YU.filter((y,k)=>(YU.length-1-k)%2===1):YU;   // 위 끝선에서 첫 줄이 F3
  YUt.forEach(y=>L("S-BAR",[[aT,y],[bT,y]])); YUf.forEach(y=>L("S-BAR",[[a1,y],[b1,y]])); YD.forEach(y=>L("S-BAR",[[a2,y],[b2,y]]));
  const xs3=[...new Set(R.dots.F3.map(d=>Math.round(d[0])))].sort((a,b)=>a-b), xs4=[...new Set(R.dots.F4.map(d=>Math.round(d[0])))].sort((a,b)=>a-b);
  xs4.forEach(x=>L("S-BAR",[[x,W],[x,2*W]])); xs3.forEach(x=>L("S-BAR",[[x,0],[x,W]]));
  const f5b=R.bars.find(b=>b.m==="F5"); let MV5=x=>x;
  if(f5b){ const s5=P.bar.F5.s, L1=Math.min(f5b.a,W*0.9), rt=th*0.35;
    // 표준도 방식: 둥글게 굽은 ㄷ형(⊂)을 상부·하부에 번갈아, 열마다 반 간격씩 엇갈려 표시
    const rr=Math.min(th*0.6,L1*0.25), arc=(cx,cy,a0,a1)=>Array.from({length:5},(_,k)=>{const a=a0+(a1-a0)*k/4;return [cx+rr*Math.cos(a),cy+rr*Math.sin(a)];});
    const cshape=(x,ya,yb)=>[[x+rr*1.6,ya],...arc(x+rr,ya+rr,-Math.PI/2,-Math.PI),...arc(x+rr,yb-rr,Math.PI,Math.PI/2),[x+rr*1.6,yb]];
    // 주철근 줄(상부 F1·하부 F2)에 맞춰, 감싸는 주철근 두 가닥을 묶는 길이로 그림. 열마다 상·하부 번갈아, 단은 s5 간격으로 엇갈림
    // 사용자 도면 방식: 상부(상면 주철근 줄)에만, 양끝이 사선으로 꺾인 괄호 모양. 열마다 단을 엇갈려 배치
    const nsp=Math.max(1,Math.round((L1-20)/topS)), step=Math.max(1,Math.round(s5/topS)), k7=Math.min(th*0.6,P.bar.W1.s*0.28), e=Math.min(k7*1.65,topS*0.45);   // 끝 사선 길이 = W7 사선 길이 (이웃 괄호와 닿지 않는 한도)
    // F5는 상부 배력근(F4)을 감싸므로 가장 가까운 F4 선에 붙이고, 선과 겹치지 않게 왼쪽으로 조금만 띄움
    const s4=P.bar.F4.s, gap5=Math.min(th*0.3,s4*0.15);
    const mvh=x0=>{ const L=xs4.length?xs4.reduce((a,v)=>Math.abs(v-x0)<Math.abs(a-x0)?v:a,xs4[0]):x0; return L-gap5; };
    MV5=mvh; const brk5=(x0,ya,yb)=>{const x=mvh(x0); return [[x+e,ya-e],[x,ya],[x,yb],[x+e,yb+e]];};
    f5b.secs.map(q=>q[0][0]).forEach((x,i)=>{ for(let k=(i*nsp)%step;k+nsp<YU.length;k+=step) L("S-BAR",brk5(x,YU[k],YU[k+nsp])); });
    const fsb=R.bars.find(b=>b.m==="FS");   // 역T형 앞굽 연결철근(표시 F6): 같은 괄호 모양을 하부 줄에, 가까운 하부 배력근 옆
    if(fsb){ const sD=P.bar.F2.s, nD=Math.max(1,Math.round((L1-20)/sD)), stD=Math.max(1,Math.round(P.bar.FS.s/sD)), eD=Math.min(k7*1.65,sD*0.45);
      const mvD=x0=>(xs3.length?xs3.reduce((a,v)=>Math.abs(v-x0)<Math.abs(a-x0)?v:a,xs3[0]):x0)-gap5;
      fsb.secs.map(q=>q[0][0]).forEach((x0,i)=>{ const x=mvD(x0); for(let k=(i*nD)%stD;k+nD<YD.length;k+=stD) L("S-BAR",[[x+eD,YD[k]-eD],[x,YD[k]],[x,YD[k+nD]],[x+eD,YD[k+nD]+eD]]); }); } }
  // 벽체 수직철근(W1·W2·W3)이 저판을 관통하는 위치: 상부에 점으로 표시
  { const xAt=b=>{ if(!b) return null; const zs=b.pts.map(p=>p[1]), zm=Math.min(...zs), i=zs.indexOf(zm); return b.pts[i][0]; };
    [["W1",P.bar.W1.s,0],["W8",P.bar.W8.s,P.bar.W8.s/2],["W2",P.bar.W2.s,0]].forEach(([m,sp,o])=>{ const b=R.bars.find(q=>q.m===m), x=xAt(b); if(x==null||!(sp>0)) return;
      for(let y=W+sp/2+o;y<2*W-th*0.2;y+=sp) C("S-DIST",x,y,th*0.2); }); }
  // 상부(위 절반)·하부(아래 절반) 따로: 좌측은 각 층 주철근 간격, 위·아래는 각 층 배력근 위치
  // 위·아래 끝은 절단선(연속)이므로 끝 반칸 치수 없이 n@s=1000 으로 표기
  const nAt=sp=>`${fx(W/sp,W%sp?1:0)}@${sp}=${W}`;
  // 표준도 방식: 치수 보조선은 꼬리표(F4·F3 / F2 / F1) 바깥에서 시작, 하단 전체 길이 치수는 없음
  chainV([W,2*W],-th*4.2,-th*2.0,`@${fx(topS,0)}`); chainV([0,W],-th*4.2,-th*2.0,`@${P.bar.F2.s}`);
  chainH([0,...xs4,B],2*W+th*4.5,2*W+th*2.5); chainH([0,...xs3,B],-th*4.4,-th*2.3);
  T("S-TTL",-th*8,W*1.5,"상  부",th*1.6,"c",90); T("S-TTL",-th*8,W*0.5,"하  부",th*1.6,"c",90);
  // 표준도: 지시선 하나가 해당 철근을 모두 가로지르고 교차점마다 사선
  const gap=(v,t)=>{const a=[...v].sort((p,q)=>p-q); let b=t,d=1e18; for(let i=0;i<a.length-1;i++){const m=(a[i]+a[i+1])/2; if(Math.abs(m-t)<d){d=Math.abs(m-t);b=m;}} return b;};
  if(YUf.length){ const x=gap(xs4,B*0.72); tag("F1",dSpec(R,"F1"),x,Math.min(...YUf),x,2*W+th*0.8,"r",false,YUf.map(y=>[x,y]),true); }   // 표시 F2 (상면 주철근 / 역T형은 뒷굽용)
  if(YUt.length){ const x=gap(xs4.filter(v=>v<P.B1)||xs4,P.B1>0?P.B1*0.45:B*0.15); tag("FT",dSpec(R,"FT"),x,Math.min(...YUt),x,2*W+th*0.8,"r",false,YUt.map(y=>[x,y]),true); }   // 역T형 표시 F3 (상면 전체): 앞굽 구간에서
  if(YD.length){ const x=gap(xs3,B*0.26); tag("F2",dSpec(R,"F2"),x,W,x,-th*2.0,"r",false,[...YD.map(y=>[x,y]),[x,W]],true); }   // 중심선까지   // 표시 F1 (하면 주철근)
  if(xs4.length){ const y=gap(YU,W*1.56); tag("F4",dSpec(R,"F4"),Math.max(...xs4),y,-th*0.6,y,"r",true,xs4.map(x=>[x,y]),true); }   // 지시선이 밑줄 아랫끝
  if(xs3.length){ const y=gap(YD,W*0.61); tag("F3",dSpec(R,"F3"),Math.max(...xs3),y,-th*0.6,y,"r","top",xs3.map(x=>[x,y]),true); }   // 지시선이 밑줄 윗끝
  if(f5b){ const x=MV5(f5b.secs[f5b.secs.length-1][0][0]), y=W+P.bar.F5.s/2; tag("F5",dSpec(R,"F5"),x,y,B+th*0.6,W+th*0.6,"r"); }
  return {E:K.fin(),th};
}
/* 배면 성토 그리기: 성토가 높으면 일부만 그리고 끊음 표시 + 치수로 실제 높이 표기 */
function fillDraw(R,th){
  const {P,G}=R, H=P.H, Hcap=Math.max(th*4,0.4*H);
  if(!(G.Hs>Hcap)) return {cut:false};
  const xs=G.xbt+P.xr*Hcap, zs=H+Hcap, ang=Math.atan2(Hcap,xs-G.xbt), nx=-Math.sin(ang), nz=Math.cos(ang), k=th*0.9;
  const brk=[[xs-nx*k*1.2,zs-nz*k*1.2],[xs-nx*k*0.3+Math.cos(ang)*th*0.35,zs-nz*k*0.3+Math.sin(ang)*th*0.35],[xs+nx*k*0.3-Math.cos(ang)*th*0.35,zs+nz*k*0.3-Math.sin(ang)*th*0.35],[xs+nx*k*1.2,zs+nz*k*1.2]];
  return {cut:true,xs,zs,Hcap,brk,pts:[[G.xbt,H],[xs,zs]]};
}
function genView(R,th){
  const {P,G}=R, K=viewKit(th), {L,T,C,chainH,chainV}=K, B=G.B, H=P.H, D=P.D;
  L("S-CONC",G.concOutline,true); G.levOutlines.forEach(o=>L("S-CONC",o,true));
  const gx=th*5;
  L("S-GRND",[[-gx,P.Df],[R.xf(P.Df),P.Df]]);
  for(let i=0;i<5;i++){const x=-gx*0.55+i*th*0.7;L("S-GRND",[[x,P.Df],[x-th*0.6,P.Df-th*0.6]]);}
  const fd=fillDraw(R,th);
  if(fd.cut){ L("S-GRND",fd.pts); L("S-GRND",fd.brk); const mx=(G.xbt+fd.xs)/2, ang=G.beta*180/Math.PI; T("S-TXT",mx-th*0.8,G.gnd(mx)+th*0.7,`1:${P.xr}`,th,"c",ang);
    const xd=Math.max(fd.xs,B)+th*2; L("S-DIM",[[xd,H],[xd,fd.zs]]); L("S-DIM",[[fd.xs+th*0.5,fd.zs],[xd+th*0.6,fd.zs]]); L("S-DIM",[[G.xbt+th*0.5,H],[xd+th*0.6,H]]);
    T("S-DIMT",xd+th*1.1,(H+fd.zs)/2,`Hs=${fx(G.Hs,0)}`,th,"c",90);
    if(P.q>0) T("S-TXT",fd.xs-th*0.5,fd.zs+th*1.8,`성토 상단 q=${P.q}kN/m²`,th*0.9,"r"); }
  else {
  const xe=Math.max(G.xk+th*7,B+th*2), gp=[[G.xbt,H]]; if(G.Hs>0) gp.push([G.xk,H+G.Hs]); gp.push([xe,G.gnd(xe)]); L("S-GRND",gp);
  if(G.Hs>0){const mx=(G.xbt+G.xk)/2, ang=G.beta*180/Math.PI; T("S-TXT",mx-th*0.8,G.gnd(mx)+th*0.7,`1:${P.xr}`,th,"c",ang);}
  }
  // 상재하중
  if(P.q>0&&!fd.cut){const x0=G.xk+th*0.5, x1=x0+th*4, yg=G.gnd(x0), ya=yg+th*1.8; L("S-DIM",[[x0,ya],[x1+th*3,ya]]);
    for(let x=x0;x<=x1+1;x+=th*0.8){L("S-DIM",[[x,ya],[x,yg]]);L("S-DIM",[[x-th*0.2,yg+th*0.35],[x,yg],[x+th*0.2,yg+th*0.35]]);}
    T("S-TXT",x0+th*0.5,ya+th*0.4,`q=${P.q}kN/m²`,th,"l");}
  T("S-TXT",(P.B1+G.xft)/2-th*1.4,(D+H)/2,`1:${P.nf}`,th*0.9,"c",Math.atan(1/Math.max(P.nf,1e-6))*180/Math.PI);
  chainH([G.xft,G.xbt],H+th*2.6,H);
  chainV([0,P.Df,H],-gx-th*2.6,0); chainV([0,D,H],-gx-th*5.2,0);
  chainV([...(G.hasKey?[-P.hk]:[]),0,G.D2],B+th*2.6,z=>z>=0?B:P.kx+P.bk);
  if(G.D2<D) chainV([G.D2,D],B+th*5.2,B);
  chainH([R.xf(D),G.xbb,B],D+(H-D)*0.32,D);
  const yb=-(G.hasKey?P.hk:0)-P.lev;
  chainH([0,...(G.hasKey?[P.kx,P.kx+P.bk]:[P.B1,G.xbb]),B],yb-th*2.6,x=>(G.hasKey&&x>=P.kx&&x<=P.kx+P.bk)?-P.hk:0); chainH([0,B],yb-th*5.2,0);
  return {E:K.fin(),th};
}
/* 철근 형상 카탈로그 */
function barSegs(r,R){const b=R.bars.find(x=>x.m===r.m);const pts=r.cutPts||(b?(b.shp||b.pts):[[0,0],[r.len*1000,0]]);
  const s=[];for(let i=0;i<pts.length-1;i++)s.push({dx:pts[i+1][0]-pts[i][0],dy:pts[i+1][1]-pts[i][1]});return {pts,s};}
function shapeSig(segs){const q=g=>{const a=Math.atan2(g.dy,g.dx)*180/Math.PI;return Math.round(a/15)*15;};
  const turns=[];for(let i=1;i<segs.length;i++){let t=q(segs[i])-q(segs[i-1]);t=((t+540)%360)-180;turns.push(t);}
  const norm=t=>t.map(v=>Math.abs(v)<20?"s":v>0?"L":"R").join(""), a=norm(turns), b=norm(turns.map(v=>-v));
  const v=Math.abs(segs[0].dx)<Math.abs(segs[0].dy)?"v":"h";
  return `${segs.length}:${v}:${[a,b].sort()[0]}`;}
function segLabels(lens){ // 대칭이면 가운데부터 L1, 아니면 순서대로
  const n=lens.length, sym=lens.every((v,i)=>Math.abs(v-lens[n-1-i])<1);
  if(sym&&n>1){const mid=(n-1)/2, lab=lens.map((_,i)=>"L"+(Math.ceil(Math.abs(i-mid))+ (n%2?1:0) || 1)); 
    const uniq=[];lab.forEach((l,i)=>{const k=+l.slice(1);uniq[k-1]=lens[i];}); return {lab,vals:uniq};}
  return {lab:lens.map((_,i)=>"L"+(i+1)),vals:lens};}
function catalogEls(segs,x,y,w,h,lab,txh,raw){ // 종이 좌표 (raw: 주어진 비율 그대로)
  let q=[[0,0]];const Ls=segs.map(g=>Math.hypot(g.dx,g.dy)), Lm=Math.max(...Ls);
  segs.forEach((g,i)=>{const l=raw?Ls[i]:0.3+Math.sqrt(Ls[i]/Lm),n=Ls[i]||1,p=q[q.length-1];q.push([p[0]+g.dx/n*l,p[1]+g.dy/n*l]);});
  const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const k=Math.min(w/Math.max(x1-x0,1e-6),h/Math.max(y1-y0,1e-6)),ox=x+(w-(x1-x0)*k)/2,oy=y+(h-(y1-y0)*k)/2;
  const P2=q.map(([a,b])=>[ox+(a-x0)*k,oy+(b-y0)*k]), cx=P2.reduce((a,p)=>a+p[0],0)/P2.length, cy=P2.reduce((a,p)=>a+p[1],0)/P2.length;
  const E=[{t:"pl",layer:"S-BAR",pts:P2}];
  P2.slice(0,-1).forEach((a,i)=>{const b=P2[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;let nx=-dy/L,ny=dx/L;
    const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2; if((mx-cx)*nx+(my-cy)*ny<0){nx=-nx;ny=-ny;} const d=1.4;
    const A=[a[0]+nx*d,a[1]+ny*d],Bp=[b[0]+nx*d,b[1]+ny*d];
    E.push({t:"pl",layer:"S-DIM",pts:[A,Bp]},{t:"ci",layer:"S-DIM",x:A[0],y:A[1],r:0.28},{t:"ci",layer:"S-DIM",x:Bp[0],y:Bp[1],r:0.28});
    const tx=mx+nx*(d+1.6),ty=my+ny*(d+1.6)-txh*0.4, vert=Math.abs(dy)>Math.abs(dx);
    E.push({t:"tx",layer:"S-TXT",x:tx,y:ty+(vert?txh*0.4:0),s:lab[i],h:txh,al:"c",rot:vert?90:0});});
  return E;
}
/* 표 */
function tableEls(x,yTop,cols,rows,o={}){ // rows: {c:[], h, blue, span:{i:n}}
  const E=[], W=cols.reduce((a,b)=>a+b,0), txh=o.txh||2.0; let y=yTop;
  const cx=[x];cols.forEach(c=>cx.push(cx[cx.length-1]+c));
  rows.forEach((r,ri)=>{const h=r.h||4.2, sp=r.span||{};
    E.push({t:"pl",layer:ri===0||r.blue?"S-TBL":"S-TBLR",pts:[[x,y],[x+W,y]]});
    let j=0; while(j<cols.length){const n=sp[j]||1, xa=cx[j], xb=cx[j+n];
      if(j>0) E.push({t:"pl",layer:"S-TBLR",pts:[[xa,y],[xa,y-h]]});
      const v=r.c[j]; if(v!==""&&v!=null){const al=r.al?r.al[j]||"c":(o.align&&ri>0?o.align[j]:"c");
        String(v).split("\n").forEach((line,li,arr)=>{const yy=y-h/2-txh*0.4+(arr.length>1?(arr.length-1)/2*txh*1.25-li*txh*1.25:0);
          E.push({t:"tx",layer:"S-TXT",x:al==="l"?xa+0.8:al==="r"?xb-0.8:(xa+xb)/2,y:yy,s:line,h:r.txh||txh,al,rot:0});});}
      j+=n;}
    y-=h;});
  E.push({t:"pl",layer:"S-TBL",pts:[[x,yTop],[x+W,yTop],[x+W,y],[x,y]],closed:true});
  if(rows.length>1) E.push({t:"pl",layer:"S-TBL",pts:[[x,yTop-(rows[0].h||4.2)],[x+W,yTop-(rows[0].h||4.2)]]});
  return {E,bottom:y};
}
const spaced=s=>s.split("").join(" ");
function sheetDrawing(R,meta={}){setWT(R);
  const {P,G}=R;
  const RG={sec:[8,118,94,150],elev:[103,146,84,122],plan:[8,20,94,96],gen:[103,20,106,124]};
  const scaleGeneral=e=>{const o={...e};if(e.pts)o.pts=e.pts.map(p=>p.map(v=>v/2));for(const k of ["x","y","h","r"])if(e[k]!=null)o[k]=e[k]/2;if(e.txt)o.txt=scaleGeneral(e.txt);return o;};
  const mk=S=>{const th=2.1*S,g=genView(R,th*2);return {sec:secView(R,th),elev:elevView(R,th),plan:planView(R,th),gen:{...g,E:g.E.map(scaleGeneral),th}};};
  let S=0,V=null; const fixed=Math.max(0,Math.round(+(meta.scale||0)||0));
  for(const s of (fixed?[fixed]:SCALES)){const v=mk(s);const ok=Object.keys(RG).every(k=>{const b=bbox(v[k].E);return (b[2]-b[0])/s<=RG[k][2]&&(b[3]-b[1])/s<=RG[k][3]-(k==="gen"?12:8);});S=s;V=v;if(ok)break;}
  const out=[], add=E=>E.forEach(e=>out.push(e.pts?{...e,pts:e.pts.map(p=>[p[0]*S,p[1]*S])}:{...e,x:e.x*S,y:e.y*S,h:e.h!=null?e.h*S:e.h,r:e.r!=null?e.r*S:e.r}));
  const T=(x,y,s,h,al="c",layer="S-TTL")=>({t:"tx",layer,x,y,s,h,al,rot:0});
  const pg=[{t:"pl",layer:"S-FRAME",pts:[[0,0],[420,0],[420,297],[0,297]],closed:true}];
  const type=P.wname;
  pg.push(T(210,281,spaced(`${type} 옹벽 상세도`),7.5),T(210,273.5,`( H=${fx(P.H/1000,1)}m )`,4.5),T(262,276,`S = 1 : ${S}`,3.5,"l"));
  const ttl={sec:"표준단면도",elev:"벽    체",plan:"저    판",gen:"일 반 도"}, VB={};
  Object.keys(RG).forEach(k=>{const [x,y,w,h]=RG[k],b=bbox(V[k].E),vw=b[2]-b[0],vh=b[3]-b[1];
    const dx=(x+w/2)*S-(b[0]+vw/2), dy=(y+(h-(k==="gen"?12:8))/2)*S-(b[1]+vh/2); out.push(...elShift(V[k].E,dx,dy));
    VB[k]=[(b[0]+dx)/S,(b[1]+dy)/S,(b[2]+dx)/S,(b[3]+dy)/S];
    pg.push(T(x+w/2,y+h-3.5,spaced(ttl[k]),4,"c"));if(k==="gen")pg.push(T(x+w/2,y+h-8,"S = 1 : "+(S*2),2.7,"c","S-TXT"));});
  // 철근상세도
  const X0=196, YT=262, groups=[], sigOf={};
  materialPieces(R).forEach(r=>{const {s}=barSegs(r,R), sg=shapeSig(s); if(!(sg in sigOf)){sigOf[sg]=groups.length;groups.push({sg,r,s});} });
  pg.push(T(X0+52,YT+4,spaced("철근상세도"),4.2),T(X0+104,YT-0.2,"(1m당)",2.4,"r","S-TXT"));
  const ncol=Math.min(4,groups.length), cwid=104/ncol, crow=Math.ceil(groups.length/ncol), boxTop=YT-2, nPieces=materialPieces(R).length, avail=boxTop-(144+7);   // 재료표 위까지만
  let chh=21, rh=4.2; if(crow*chh+7.4+nPieces*rh>avail){ chh=Math.max(14,(avail-7.4-nPieces*rh)/crow); if(crow*chh+7.4+nPieces*rh>avail) rh=Math.max(3.0,(avail-7.4-crow*chh)/nPieces); }
  groups.forEach((g,i)=>{const cx=X0+(i%ncol)*cwid, cy=boxTop-(Math.floor(i/ncol)+1)*chh;
    const lens=g.s.map(q=>Math.hypot(q.dx,q.dy)), {lab}=segLabels(lens);
    const bb=R.bars.find(x=>x.m===g.r.m), dsg=!g.r.pieceNo&&bb&&bb.disp?bb.disp.slice(1).map((p,k)=>({dx:p[0]-bb.disp[k][0],dy:p[1]-bb.disp[k][1]})):g.s;   // 실제 비율이 어색한 형상은 모식 비율로 그림
    pg.push(...catalogEls(dsg,cx+cwid*0.18,cy+chh*0.37,cwid*0.64,chh*0.4,lab,1.9,dsg!==g.s),T(cx+cwid/2,cy+0.8,`상세 ${i+1}`,2.2,"c","S-TXT"));});
  const catH=crow*chh+1;
  const head={c:["부 호","상세","호 칭","갯 수","길이\n(mm)","L1\n(mm)","L2\n(mm)","L3\n(mm)","L4\n(mm)","L5\n(mm)","이 음"],h:6.4,txh:1.8};
  const drows=materialPieces(R).map(r=>{const {s}=barSegs(r,R), lens=s.map(q=>Math.hypot(q.dx,q.dy)), {vals}=segLabels(lens);
    const cnt=Math.abs(r.perM-Math.round(r.perM))<1e-6?I0(r.perM):fx(r.perM,2);
    return {c:[materialMark(r),sigOf[shapeSig(s)]+1,r.dia,cnt,I0(r.len*1000),...[0,1,2,3,4].map(k=>vals[k]!=null?I0(vals[k]):""),r.spliceCount?I0(r.lapMM):"-"],al:["c","c","c","r","r","r","r","r","r","r","r"],h:rh};});
  const dt=tableEls(X0,boxTop-catH,[9,7,9,8,10,10,10,10,10,10,11],[head,...drows],{txh:rh<3.6?1.6:2.0});
  pg.push({t:"pl",layer:"S-TBL",pts:[[X0,boxTop],[X0+104,boxTop],[X0+104,boxTop-catH],[X0,boxTop-catH]],closed:true},...dt.E);
  // 철근집계표
  const X1=308, ls=1+P.loss/100;
  pg.push(T(X1+50,YT+4,spaced("철근집계표"),4.2),T(X1+100,YT-0.2,`${P.steel}(1m당)`,2.4,"r","S-TXT"));
  const srows=[{c:["부 호","호 칭","길 이\n(m)","갯 수","총 길 이\n(m)","단위중량\n(kg/m)","총 무 게\n(t)","비 고"],h:6.4,txh:1.8}];
  const dks=Object.keys(BARS).filter(k=>R.byDia[k]).sort((a,b)=>BARS[b].d-BARS[a].d); let tot=0;
  dks.forEach(dk=>{materialPieces(R).filter(r=>r.dia===dk).forEach((r,i)=>srows.push({c:[materialMark(r),i?"":dk,fx(r.len,3),Math.abs(r.perM-Math.round(r.perM))<1e-6?I0(r.perM):fx(r.perM,2),fx(r.lenM,3),"","",""],al:["c","c","r","r","r","r","r","c"]}));
    const tL=materialPieces(R).filter(r=>r.dia===dk).reduce((a,r)=>a+r.lenM,0), t=tL*BARS[dk].w/1000; tot+=t;
    srows.push({c:["소     계","","","",fx(tL,3),fx(BARS[dk].w,3),fx(t,3),""],span:{0:4},blue:true,al:["c","c","c","c","r","r","r","c"]});});
  srows.push({c:["총          계","","","","","","",""],span:{0:6},blue:true});
  srows[srows.length-1].c[6]=fx(tot,3); srows[srows.length-1].c[7]=fx(tot*ls,3); srows[srows.length-1].span={0:6}; srows[srows.length-1].al=["c","c","c","c","c","c","r","r"];
  srows[1].c[7]=`(${P.loss}%할증)`;
  pg.push(...tableEls(X1,YT-2,[11,11,13,10,15,15,13,13],srows).E);
  // 재료표
  const Q=R.Q, X2=218, YM=144;
  pg.push(T(X2+42,YM+2.8,spaced("재료표"),3.4),T(X2+84,YM+0.4,"(1m당)",2.0,"r","S-TXT"));
  // 재료표 = 단위수량산출서 항목 (1m당)
  const qi=qtyRows(R).items, mrows=[{c:["공    종","규    격","단 위","수    량","적    요"],h:4.6}];
  let prev="";
  qi.forEach(it=>{ const nm=it.name===prev?"":it.name; prev=it.name;
    if(it.split) it.lines.forEach((ln,k)=>mrows.push({c:[k?"":nm,`${it.spec||""}${ln[0]}`,it.unit,fx(ln[3],3),""]}));
    else mrows.push({c:[nm,it.spec||"",it.unit,it.qty>0?fx(it.qty,it.dec||3):"-",it.qL!=null&&it.qty>0?`할증후 ${fx(it.qL,it.dec||3)}`:""]}); });
  mrows.forEach((r,i)=>{r.h=4.2; if(i>0) r.al=["c","c","c","r","c"];});
  const mt=tableEls(X2,YM-2,[17,20,10,15,22],mrows);
  pg.push(...mt.E);

  // 설계조건 및 외력표: 현재 입력과 동일한 상시/지진 계산 결과 사용.
  const n=R.S.N,em=R.S.Eminus,e=(em&&em.qmax>R.S.E.qmax)?em:R.S.E,Bm=G.B/1000;
  const fmt=v=>Number.isFinite(v)?fx(v,3):"계산 불가";
  const designRows=[
   ["항 목","단 위","수 치"],
   ["옹벽 높이","m",fx(P.H/1000,3)],
   ["성토 높이","m",fx(G.Hs/1000,3)],
   ["뒤채움흙 내부마찰각","도",fx(P.phi,1)],
   ["뒤채움흙 단위중량","kN/m³",fx(P.gs,2)],
   ["철근콘크리트 단위중량","kN/m³",fx(P.gc,2)],
   ["콘크리트 설계기준강도","MPa",fx(P.fck,0)],
   ["철근 항복강도","MPa",P.steel==="SD500"?"500":"400"],
   ["허용지지력 (상시)","kN/m²",fx(P.qa,2)],
   ["허용지지력 (지진시)","kN/m²",fx(P.qa*P.fe,2)],
   ["저판 마찰계수","tanφ",fx(P.mu,3)],
   ["수평 지진계수","kh",fx(P.kh,3)]
  ];
  const contact=x=>Math.abs(x.e)<=Bm/6?Bm:Math.max(0,3*(Bm/2-Math.abs(x.e)));
  const forceRows=[
   ["항 목","단 위","상 시","지진시"],
   ["연 직 력","kN",fmt(n.V),fmt(e.V)],
   ["수 평 력","kN",fmt(n.Ph),fmt(e.Ph)],
   ["순모멘트 (저판 선단)","kN·m",fmt(n.Mr-n.Mo),fmt(e.Mr-e.Mo)],
   ["작용 편심","m",fmt(Math.abs(n.e)),fmt(Math.abs(e.e))],
   ["최대 지반반력","kN/m²",fmt(n.qmax),fmt(e.qmax)],
   ["최소 지반반력","kN/m²",fmt(n.qmin),fmt(e.qmin)],
   ["반력 작용폭","m",fmt(contact(n)),fmt(contact(e))]
  ];
  const infoY=mt.bottom-12;
  pg.push(T(X2+42,infoY+2.4,spaced("설계조건"),3.0),T(360,infoY+2.4,"외력표 (1m당)",3.0));
  const rows=c=>c.map((c,i)=>({c,h:4.2,txh:1.6,al:i?["c","c",...c.slice(2).map(()=>"r")]:c.map(()=>"c")}));
  pg.push(...tableEls(X2,infoY,[47,15,22],rows(designRows)).E,...tableEls(318,infoY,[34,14,18,18],rows(forceRows)).E);
  pg.push(T(318,infoY-36.6,"지진시: ±kh 중 최대 지반반력 지배 방향 ("+(e===em?"−kh":"+kh")+")",1.7,"l","S-TXT"),
   T(318,infoY-39.6,"순모멘트 = 저항모멘트 − 전도모멘트",1.7,"l","S-TXT"));

  // 주의사항
  const notes=[
    `옹벽의 기초지반은 허용지지력(${P.qa}kN/m²)이 최대지반반력 이상이어야 하며, 충분한 활동저항력(상시 1.5 이상, 지진시 1.2 이상)을 발휘하고, 저판폭 2배 깊이 이내에 연약층이 존재하지 않는 지반이어야 한다.`,
    `뒤채움 토사는 설계조건(γ=${P.gs}kN/m³, φ=${P.phi}°) 이상의 재료이어야 한다.`,
    `뒤채움은 투수성이 좋은 재료로 하고, 현장여건에 따라 적절한 배수시설을 설치하여 옹벽 배면에 수압이 작용하지 않도록 한다.`,
    `최하단 배수공은 침투수가 정체되지 않도록 가능한 한 하단부에 설치하고, 부직포와 배수필터는 뒤채움토의 입도분포에 따라 규격을 결정한다.`,
    `옹벽 전면에는 V형 홈을 가진 수축줄눈을 5m 이하 간격으로 두며, 철근이 노출되지 않도록 한다.`,
    `신축이음 간격은 최대 ${P.blk}m 이하로 하고 충진재를 삽입한다.`,
    `배수 Pipe는 최대간격 4.5m 이내, 직경 100mm 이상으로 설치한다.`,
    `기초저면의 최소 근입깊이는 동결심도 이상이어야 한다.`,
    `철근 중심 치수는 벽체 ${P.cw}mm, 저판 ${P.cf}mm이며, 순피복 판정은 사용자 지정 실제 순피복 80mm를 별도로 적용한다.`,
    `배력철근 및 수축·온도철근은 KDS 14 20 50 4.6.2·KDS 11 80 05 4.6.2(2)를 적용한다 (양면 합계 0.002bh, 1,800mm²/m 이하).`];
  pg.push(T(310,160,"[주의사항]",3.6,"l"));
  const wrap=(t,n)=>{const o=[];let r=t;while(r.length>n){let k=r.lastIndexOf(" ",n);if(k<n*0.55)k=n;o.push(r.slice(0,k));r=r.slice(k).trimStart();}o.push(r);return o;};
  const noteLines=notes.flatMap(n=>wrap(n,58).map((s,i)=>(i?"":"-.  ")+s));
  const noteStep=Math.min(3.5,(153-(infoY+7))/Math.max(1,noteLines.length)),noteFont=Math.min(2.1,noteStep/1.45);
  let ny=153;noteLines.forEach(s=>{pg.push(T(310,ny,s,noteFont,"l","S-TXT"));ny-=noteStep;});

  add(pg);
  return {E:out,th:2.3*S,S,generalScale:S*2,VB};
}
Object.assign(SVGCOL,{"S-CONC":"#000","S-BAR":"#d000d0","S-DIST":"#d000d0","S-DIM":"#e00000","S-DIMT":"#000","S-BUB":"#e00000","S-BUBT":"#000","S-TXT":"#000","S-TTL":"#000","S-TBL":"#0000e0","S-TBLR":"#e00000","S-GRND":"#777","S-CEN":"#e00000","S-HID":"#999","S-FRAME":"#000","S-LEAD":"#e00000","S-BRK":"#e00000"});
Object.assign(PRINTCOL,{"S-CONC":"#000","S-BAR":"#d000d0","S-DIST":"#d000d0","S-DIM":"#e00000","S-DIMT":"#000","S-BUB":"#e00000","S-BUBT":"#000","S-TXT":"#000","S-TTL":"#000","S-TBL":"#0000e0","S-TBLR":"#e00000","S-GRND":"#777","S-CEN":"#e00000","S-HID":"#999","S-FRAME":"#000","S-LEAD":"#e00000","S-BRK":"#e00000"});
Object.assign(DXFLAY,{"S-CONC":7,"S-BAR":6,"S-DIST":6,"S-DIM":1,"S-DIMT":7,"S-BUB":1,"S-BUBT":7,"S-TXT":7,"S-TTL":7,"S-TBL":5,"S-TBLR":1,"S-GRND":8,"S-CEN":1,"S-HID":8,"S-FRAME":7,"S-LEAD":1,"S-BRK":1});
function sheetMeta(){return {scale:$("mScale").value};}
function dxfSheets(list){
  return dxfDoc(api=>{let ox=0;
    list.forEach(({R,meta})=>{const sh=sheetDrawing(R,meta);
      sh.E.forEach(e=>{if(e.dg) return; if(e.t==="dim") return api.dim(e,ox,0,sh.S); if(e.t==="pl")api.pl(e.layer,e.pts.map(p=>[p[0]+ox,p[1]]),e.closed);
        else if(e.t==="ci")api.circle(e.layer,e.x+ox,e.y,e.r);
        else if(e.t==="tx")api.text(e.layer,e.x+ox,e.y,e.h,e.s,e.al,e.rot);});
      ox+=440*sh.S;});});
}
function rebarViews(R){setWT(R);   // 배근도 탭: 본체(표준단면도) · 벽체 · 저판
  const {P,G}=R, th=Math.max(G.B,P.H)*0.02, gap=th*6, out=[];
  const V=[["본  체",secView(R,th)],["벽  체",elevView(R,th)],["저  판",planView(R,th)]];
  // 본체·벽체는 위쪽 두 칸, 저판은 아래에 배치하여 표기 크기를 확보한다.
  const bounds=V.map(([,v])=>bbox(v.E)),widths=bounds.map(b=>b[2]-b[0]),rowWidth=widths[0]+widths[1]+gap;
  const rowHeight=Math.max(bounds[0][3]-bounds[0][1],bounds[1][3]-bounds[1][1]);
  V.forEach(([t,v],i)=>{const b=bounds[i],x=i===0?0:i===1?widths[0]+gap:(rowWidth-widths[2])/2,y=i<2?0:-rowHeight-gap-th*4;
    out.push(...elShift(v.E,x-b[0],y-b[3]-th*3.6));
    out.push({t:"tx",layer:"S-TTL",x:x+widths[i]/2,y:y-th*1.6,s:t,h:th*1.6,al:"c",rot:0});});
  return {E:out,th};
}
function renderSheet(R){setWT(R);
  let sh; try{ sh=sheetDrawing(R,sheetMeta()); }catch(e){ console.error(e); $("svgSheet").innerHTML='<div class="warn" style="margin:12px">상세도를 그리는 중 오류가 났습니다: '+esc(String(e&&e.message||e))+' · '+esc(String((e&&e.stack||"").split("\n").slice(1,3).join(" / ")))+'<br>이 문구를 캡처해서 보내 주세요.</div>'; $("sheetNote").textContent="상세도 오류"; return; }
  $("svgSheet").innerHTML=toSVG(sh,PRINTCOL);
  $("sheetNote").textContent=`A3 (420×297) · 축척 1 : ${sh.S} · 모형공간 실치수(mm)`;
}
$("sheetZoom").addEventListener("click",()=>{const w=$("sheetWrap");w.classList.toggle("zoom");$("sheetZoom").textContent=w.classList.contains("zoom")?"화면에 맞추기":"크게 보기";});
