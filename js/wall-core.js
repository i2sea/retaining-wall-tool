"use strict";
/* 옹벽 설계도구 · 철근 규격 · 계산 모델 · 토압(시행쐐기법) · 안정 · 단면 검토 */
/* ---------- 철근 규격 (KS D 3504) ---------- */
const BARS={H13:{d:12.7,w:0.995},H16:{d:15.9,w:1.560},H19:{d:19.1,w:2.250},H22:{d:22.2,w:3.040},H25:{d:25.4,w:3.980},H29:{d:28.6,w:5.040},H32:{d:31.8,w:6.230}};
// 화면·도면에 쓰는 철근 번호 (국토부 표준도 체계): 내부키 → 표시번호
const DMAP={W1:"W1",W8:"W2",W2:"W3",W3:"W4",W5:"W5",W4:"W6",W7:"W7",WH:"H1",WD:"H2",F2:"F1",F1:"F2",F3:"F3",F4:"F4",F5:"F5",K1:"F6",K2:"F7",FT:"F3",FS:"F6"};
// 역T형 표준도 번호: 하면 F1 / 상면 뒷굽용 F2 / 상면 전체 F3 / 하부 배력 F4 / 상부 배력 F5 / 앞굽 연결 F6 / 뒷굽 연결 F7 / 전단키 F8·F9
const DMAP_T={F2:"F1",F1:"F2",FT:"F3",F3:"F4",F4:"F5",FS:"F6",F5:"F7",K1:"F8",K2:"F9"};
let DMWT="T"; const setWT=R=>{if(R&&R.P&&R.P.wtype)DMWT=R.P.wtype;};
const DORD=["W1","W2","W3","W4","W5","W6","W7","H1","H2","F1","F2","F3","F4","F5","F6","F7","F8","F9"];
const DM=m=>(DMWT==="T"&&DMAP_T[m])||DMAP[m]||m, DIDX=m=>{const i=DORD.indexOf(DM(m));return i<0?99:i;};
const MAIN_MARKS=["W1","W2","W8","F1","F2","K1","FT"];
const MAIN_SPACING=[125,250];
const HORIZONTAL_MARKS=["W3","W5","F3","F4"];
const HORIZONTAL_SPACING=[200,400];
const horizontalSpacing=m=>["F3","F4"].includes(m)?[200,250]:HORIZONTAL_SPACING;
const BAR_PAIRS=[["W3","W5"],["F3","F4"]];
const barPair=m=>BAR_PAIRS.find(p=>p.includes(m));
for(const ev of ["input","change"])document.addEventListener(ev,e=>{const pair=BAR_PAIRS.find(p=>p.some(m=>e.target.id==="s_"+m));if(pair)for(const m of pair)if($("s_"+m)!==e.target)$("s_"+m).value=e.target.value;},true);

const sameBackDia=v=>{v={...v};const d=v.d_W1??v.d_W8;if(d!=null){v.d_W1=d;v.d_W8=d;}const f=v.d_F1??v.d_FT;if(f!=null){v.d_F1=f;v.d_FT=f;}return v;};   // W1·W2, 저판 상면 F2·F3(역T형)은 같은 층이라 같은 규격
for(const ev of ["input","change"])document.addEventListener(ev,e=>{for(const g of [["d_W1","d_W8"],["d_F1","d_FT"]]) if(g.includes(e.target.id))for(const id of g)if($(id))$(id).value=e.target.value;},true);

const RB=[ // 기호, 설명, 기본규격, 기본간격
  ["W1","벽체 배면 주철근","H22",250],
  ["W2","벽체 전면 수직근","H13",250],
  ["W3","벽체 전면 수평 배력근","H13",200],
  ["W5","벽체 배면 수평 배력근","H13",200],
  ["W4","벽체 상부 뚜껑철근","H13",250],
  ["F1","기초 상면 주철근","H19",250],
  ["F2","기초 하면 주철근","H19",250],
  ["F3","저판 하면 배력근","H13",200],
  ["F4","저판 상면 배력근","H13",200],
  ["K1","전단키 철근","H16",250],
  ["K2","전단키 가로철근 (배력근)","H13",200],
  ["W7","벽체 연결철근 (ㄷ형)","H13",500],
  ["WH","벽체 전면 헌치 철근 (사선, 헌치가 있을 때만)","H16",250],
  ["WD","헌치 가로철근 (사선 철근 위, 간격 0=없음)","H13",200],
  ["W8","벽체 배면 주철근 (단절, 간격 0=없음)","H22",0],
  ["F5","저판 연결철근 (ㄷ형, 뒷굽)","H13",500],
  ["FT","기초 상면 주철근 (전체 길이, 역T형)","H19",250],
  ["FS","앞굽 연결철근 (ㄷ형, 역T형 · 간격 0=없음)","H13",500]];
(function(){
  const box=document.getElementById("rebarInputs");
  const opts=Object.keys(BARS).map(k=>`<option>${k}</option>`).join("");
  box.innerHTML=[...RB].sort((a,b)=>DIDX(a[0])-DIDX(b[0])).map(([m,desc,dia,s])=>`<div class="rb" data-m="${m}"><span class="rbm">${DM(m)}</span>
    <select id="d_${m}" aria-label="${DM(m)} 규격" class="f-sel">${opts}</select>
    <input id="s_${m}" aria-label="${DM(m)} 간격" type="number" step="25" value="${s}">
    ${m==="W7"?'<label style="grid-column:2/4;display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap">세로 간격 <input id="v_W7" aria-label="W7 세로 간격 (단면 높이 방향)" type="number" step="50" value="" placeholder="빈칸 = 수평근 2단마다"></label>':""}
    <small>${desc} · 규격 / ${m==="W7"?"가로 간격(옹벽 길이 방향), 세로 간격(단면 높이 방향)":"간격(mm)"}${MAIN_MARKS.includes(m)?" · 표준도형 125 / 250":HORIZONTAL_MARKS.includes(m)?" · 수평 배력근 "+horizontalSpacing(m).join(" / "):""}${["W1","W8"].includes(m)?" · W1/W2 동일 규격":""}</small></div>`).join("");
  RB.forEach(([m,,dia])=>document.getElementById("d_"+m).value=dia);
  box.querySelectorAll("select,input").forEach(el=>{el.style.cssText="font-family:var(--f-num);font-size:13px;padding:5px 7px;border:1px solid var(--line);border-radius:4px;background:var(--sunk);color:var(--ink);width:100%;min-width:0"});
})();

const $=id=>document.getElementById(id);
let RBWT=null;
function relabelRB(wt){   // 형식에 따라 철근 번호 표시와 역T형 전용 철근(FT·FS) 입력칸 표시
  if(RBWT===wt) return; RBWT=wt; const prev=DMWT; DMWT=wt;
  const box=$("rebarInputs"); if(!box){DMWT=prev;return;}
  const rows=[...box.querySelectorAll(".rb[data-m]")];
  rows.sort((a,b)=>DIDX(a.dataset.m)-DIDX(b.dataset.m)).forEach(el=>{const m=el.dataset.m; box.appendChild(el);
    el.querySelector(".rbm").textContent=DM(m); el.hidden=(m==="FT"||m==="FS")&&wt!=="T";
    if(m==="F1"){const sm=el.querySelector("small"); if(sm&&!sm.dataset.base) sm.dataset.base=sm.textContent; if(sm) sm.textContent=wt==="T"?"기초 상면 주철근 (뒷굽용, 벽체 전면~뒷굽 끝) · 규격 / 간격(mm) · F3과 번갈아 배치":sm.dataset.base;}});
  DMWT=prev;
}
const num=id=>{const v=parseFloat($(id).value);return isFinite(v)?v:0};
const fx=(v,n=3)=>Number(v).toLocaleString("ko-KR",{minimumFractionDigits:n,maximumFractionDigits:n});
const r10=v=>Math.ceil(v/10)*10;

/* ---------- 계산 모델 ---------- */
function kdsMaterial(fck){
 const f=[40,50,60,70,80,90],eta=[1,.97,.95,.91,.87,.84],beta=[.80,.80,.76,.74,.72,.70],eps=[.0033,.0032,.0031,.0030,.0029,.0028];
 const interp=a=>{if(fck<=40)return a[0];let i=f.findIndex(v=>v>=fck);if(i<0)throw Error("fck > 90 MPa는 도구 적용 범위 밖입니다.");return a[i-1]+(a[i]-a[i-1])*(fck-f[i-1])/(f[i]-f[i-1]);};
 const delta=fck<=40?4:fck>=60?6:4+(fck-40)/10;
 return {eta:interp(eta),b1:interp(beta),epscu:interp(eps),Ec:8500*Math.cbrt(fck+delta),fr:.63*Math.sqrt(fck),delta};
}

function kdsSlabRho(fy){return Math.max(.0014,fy<=400?.002:.002*400/fy);}

function kdsSection(P,h,coverC,As){
 const mat=kdsMaterial(P.fck),fy=P.steel==="SD500"?500:400,d=h-coverC,ey=fy/2e5;
 let lo=1e-9,hi=d;
 for(let i=0;i<70;i++){const c=(lo+hi)/2,et=mat.epscu*(d-c)/c,fsu=Math.max(0,Math.min(fy,2e5*et)),C=.85*mat.eta*P.fck*1000*mat.b1*c;if(C>As*fsu)hi=c;else lo=c;}
 const c=(lo+hi)/2,a=mat.b1*c,et=mat.epscu*(d-c)/c,fsu=Math.max(0,Math.min(fy,2e5*et)),etcl=fy<=400?.005:2.5*ey,etmin=fy<=400?.004:2*ey;
 const ph=et>=etcl?.85:et<=ey?.65:.65+.20*(et-ey)/(etcl-ey),Mn=As*fsu*(d-a/2)/1e6;
 return {...mat,d,fy,ey,c,a,et,etcl,etmin,fsu,ph,Mn,phMn:ph*Mn};
}

function kdsDetailChecks(P,G){DMWT=P.wtype||DMWT;
 const out=[],As=k=>AS[P.bar[k].dia]*1000/P.bar[k].s,fy=P.steel==="SD500"?500:400;
 const check=(name,actual,required,rule,unit="")=>out.push({name,actual,required,rule,unit,ok:actual+1e-8>=required});
 const cover=(k,center,min)=>check(DM(k)+" 순피복 (설계 적용값)",80,min,"KDS 11 80 05 4.6.2(2)①; 사용자 지정 실제 순피복 80 mm (중심 치수와 별도)","mm");
 cover("W1",P.cw,50);cover("W2",P.cw,50);cover("F1",P.cf,80);cover("F2",P.cf,80);if(G.hasKey)cover("K1",P.ck,80);
 check("벽체 노출면 수평철근",As("W3"),500,"KDS 11 80 05 4.6.2(2)②","mm²/m");
 const wallRho=[P.bar.W3,P.bar.W5].every(b=>fy>=400&&BARS[b.dia].d<=16)?.002:.0025;
 check("벽체 수평철근 양면 합계",As("W3")+As("W5"),wallRho*1000*Math.max(P.t1,P.t2),"KDS 11 80 05 4.6.2(2)⑤","mm²/m");
 check("저판 종방향 수축온도철근 합계",As("F3")+As("F4"),Math.min(kdsSlabRho(fy)*1000*P.D,1800),"KDS 14 20 50 4.6.2","mm²/m");
 for(const k of ["W3","W5"])check(DM(k)+" 최대간격",Math.min(300,3*Math.min(P.t1,P.t2)),P.bar[k].s,"KDS 11 80 05 4.6.2(2)②·⑤","mm (허용/사용)");
 for(const k of ["F3","F4"])check(DM(k)+" 최대간격",Math.min(450,5*P.D2),P.bar[k].s,"KDS 14 20 50 4.6.2(3)","mm (허용/사용)");
 const tStd=P.wtype==="T"&&P.bar.FT, AsToeTop=tStd?As("FT"):As("F1"), AsHeelTop=tStd?As("F1")+As("FT"):As("F1");
 if(P.B1>0)check("앞굽 상면 반대측 철근",AsToeTop,As("F2")/3,"KDS 11 80 05 4.6.1(3)⑤","mm²/m");
 if(P.B3>0)check("뒷굽 하면 반대측 철근",As("F2"),AsHeelTop/3,"KDS 11 80 05 4.6.1(3)⑤","mm²/m");
 check("근입깊이",P.Df,1000,"KDS 11 80 05 4.4.1(4); 동결심도는 별도","mm");
 check("신축이음 최대간격",20,P.blk,"KDS 11 80 05 4.6.2(3)④","m (허용/사용)");
 return out;
}

function kdsLoadCases(){
 return [
 {n:"LCB1",t:"KDS (4.2-2): 1.2D + 1.6Hv + 1.6L + 1.6Hh",fD:1.2,fHv:1.6,fL:1.6,fH:1.6,fE:0},
 {n:"LCB2",t:"KDS (4.2-5): 1.2(D+Hv) + L + Hh + E",fD:1.2,fHv:1.2,fL:1,fH:1,fE:1},
 {n:"LCB3",t:"사용하중 D + Hv + L + Hh",fD:1,fHv:1,fL:1,fH:1,fE:0,service:true},
 {n:"KDS1",t:"KDS (4.2-1): 1.4D",fD:1.4,fHv:0,fL:0,fH:0,fE:0},
 {n:"KDS2F",t:"KDS (4.2-2): 유리한 Hh=0.8Hh",fD:1.2,fHv:1.6,fL:1.6,fH:.8,fE:0},
 {n:"KDS3",t:"KDS (4.2-3) W,Lr,S,R=0: 1.2D + L",fD:1.2,fHv:0,fL:1,fH:0,fE:0},
 {n:"KDS4",t:"KDS (4.2-4) W,Lr,S,R=0: 1.2D + L",fD:1.2,fHv:0,fL:1,fH:0,fE:0},
 {n:"KDS5F",t:"KDS (4.2-5): 유리한 Hh=0.6Hh",fD:1.2,fHv:1.2,fL:1,fH:.6,fE:1},
 {n:"KDS5R",t:"KDS (4.2-5): E 부호 반전",fD:1.2,fHv:1.2,fL:1,fH:1,fE:-1},
 {n:"KDS5FR",t:"KDS (4.2-5): 0.6Hh, E 부호 반전",fD:1.2,fHv:1.2,fL:1,fH:.6,fE:-1},
 {n:"KDS6",t:"KDS (4.2-6): 1.2D + 1.6Hv + 1.6L + 0.8Hh",fD:1.2,fHv:1.6,fL:1.6,fH:.8,fE:0},
 {n:"KDS7",t:"KDS (4.2-7), W=0: 0.9(D+Hv)+1.6Hh",fD:.9,fHv:.9,fL:0,fH:1.6,fE:0},
 {n:"KDS7F",t:"KDS (4.2-7), W=0: 0.9(D+Hv)+0.8Hh",fD:.9,fHv:.9,fL:0,fH:.8,fE:0},
 {n:"KDS8",t:"KDS (4.2-8): 0.9(D+Hv)+Hh+E",fD:.9,fHv:.9,fL:0,fH:1,fE:1},
 {n:"KDS8F",t:"KDS (4.2-8): 0.9(D+Hv)+0.6Hh+E",fD:.9,fHv:.9,fL:0,fH:.6,fE:1},
 {n:"KDS8R",t:"KDS (4.2-8): 0.9(D+Hv)+Hh-E",fD:.9,fHv:.9,fL:0,fH:1,fE:-1},
 {n:"KDS8FR",t:"KDS (4.2-8): 0.9(D+Hv)+0.6Hh-E",fD:.9,fHv:.9,fL:0,fH:.6,fE:-1}
 ];
}
function momentEnvelope(values){return {top:Math.max(0,...values),bottom:Math.max(0,...values.map(v=>-v))};}
function barPositions(P,b){
  const s=P.bar[b.m].s, end=P.L*1000-40, out=[];
  if(!(s>0))return out;
  for(let y=Math.max(40,b.y0??s/2);y<=end+1e-7;y+=s)out.push(y);
  if(!out.length)out.push(P.L*500);
  return out;
}
function validateInputs(){
  const positive=["stockLen","lapCenter","H","D","t1","t2","cw","cf","gs","gc","qa","fck","L","blk"];
  const nonnegative=["B1","B3","nf","Df","Hs","xr","bk","hk","kx","D2","D1","q","mu","kh","loss","lev"];
  const errors=[];
  if(num("fck")>90)errors.push("fck > 90 MPa는 별도 실험근거가 필요하여 적용하지 않습니다.");
  if(num("qult")<=0||num("qultE")<=0)errors.push("상시·지진시 극한지지력을 양수로 입력하세요.");
  if(num("ppf")<0||num("ppf")>1)errors.push("수동토압 적용률은 0~1 범위입니다.");
  if(num("drainArea")<2||num("drainArea")>4)errors.push("배수공 면적은 2~4m²/개 범위입니다.");
  if($("waterMode").value!=="drained")errors.push("수압·부력·수중단위중량이 필요한 조건은 이 배수조건 모델로 계산할 수 없습니다.");
  if($("useClass").value!=="general"&&num("H")<1500)errors.push("도로 등가상재 표의 H<1.5m는 별도 산정이 필요합니다.");
  for(const k of [...positive,...nonnegative]){
    const v=$(k).value.trim(), n=Number(v);
    if(v===""||!Number.isFinite(n)||(positive.includes(k)?n<=0:n<0))errors.push(k+" 입력값을 확인하세요.");
  }
  if(num("H")<=num("D"))errors.push("전체높이 H는 기초두께 D보다 커야 합니다.");
  if(!(num("phi")>0&&num("phi")<90))errors.push("내부마찰각은 0° 초과 90° 미만이어야 합니다.");
  if(num("cf")*2>=num("D")||num("cw")*2>=Math.min(num("t1"),num("t2")))errors.push("두께에 비해 철근 중심 피복이 너무 큽니다.");
  if(num("D2")>0&&num("D2")<2*num("cf"))errors.push("뒷굽 끝 두께가 양면 피복보다 작습니다.");
  if(num("D1")>0&&num("D1")<2*num("cf"))errors.push("앞굽 끝 두께가 양면 피복보다 작습니다.");
  return errors;
}

/* 정척·B급 인장 겹침이음: KDS 14 20 52:2024 4.1.2(3), 4.5.2 */
function stockLap(P,dia,spacing){
 const db=BARS[dia].d,fy=P.steel==="SD500"?500:400,alpha=P.lapTop??1.3,beta=P.lapCoat??1;
 const gamma=db<=19.1?.8:1,ab=Math.min(alpha*beta,1.7),c=Math.min(P.lapCenter??80,spacing/2),ratio=Math.min(c/db,2.5);
 if(!(ratio>0))throw Error("이음부 피복·철근간격을 확인하세요.");
 const ld0=.9*db*fy/Math.min(Math.sqrt(P.fck),8.4)*ab*gamma/ratio;
 return {db,fy,alpha,beta,ab,gamma,c,ratio,ld0,lap:Math.ceil(Math.max(300,1.3*ld0)/10)*10,grade:"B",Ktr:0,lambda:1};
}
function stockPlan(pts,stock,lap,db){
 const seg=[];let total=0;
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len>1e-8){seg.push({a,b,lo:total,hi:total+len,len});total+=len;}}
 const at=x=>{const s=seg.find(s=>x<=s.hi+1e-7)||seg[seg.length-1],t=Math.max(0,Math.min(1,(x-s.lo)/s.len));return [s.a[0]+t*(s.b[0]-s.a[0]),s.a[1]+t*(s.b[1]-s.a[1])];};
 const path=(lo,hi)=>[at(lo),...seg.filter(s=>s.hi>lo+1e-7&&s.hi<hi-1e-7).map(s=>s.b),at(hi)];
 if(!seg.length)throw Error("철근 가공길이가 0입니다.");
 const pieces=[],joints=[];let start=0;
 if(total>stock+1e-7&&stock<=lap+1)throw Error("정척길이가 필요한 겹침이음길이보다 짧습니다. 정척을 늘리세요.");
 while(start<total-1e-7){
  let end=total;
  if(total-start>stock+1e-7){
   end=-1;const cap=start+stock,guard=2*db;
   for(const s of seg){const e=Math.min(cap,s.hi-(s.hi<total?guard:0));if(e-lap>=Math.max(s.lo+(s.lo>0?guard:0),start+1)-1e-7&&e>end)end=e;}
   if(end<=start)throw Error("절곡부를 피하여 겹침이음을 배치할 직선길이가 부족합니다. 정척을 늘리거나 별도 이음 상세를 적용하세요.");
  }
  const length=Math.ceil(end-start-1e-7);if(length>stock+1e-7)throw Error("정척 초과 절단길이입니다.");
  pieces.push({start,end,len:length,pts:path(start,end)});
  if(end>=total-1e-7)break;
  joints.push({from:end-lap,to:end});start=end-lap;
  if(pieces.length>1000)throw Error("이음 수량이 너무 큽니다. 정척·연장을 확인하세요.");
 }
 return {total,pieces,joints};
}
function applyStockSplices(P,sched,bars,dots){
 const stock=Math.floor((P.stockLen??8)*1000);if(!(stock>=1000&&stock<=30000))throw Error("정척길이는 1~30m 범위로 입력하세요.");
 for(const r of sched){
  const bar=bars.find(b=>b.m===r.m);let pts=bar?(bar.shp||bar.pts):[[0,0],[r.len*1000,0]],spacing=r.s;
  if(r.long){const set=dots[r.m]||[];for(let i=0;i<set.length;i++)for(let j=i+1;j<set.length;j++){const v=Math.hypot(set[i][0]-set[j][0],set[i][1]-set[j][1]);if(v>1e-7)spacing=Math.min(spacing,v);}}
  if(r.m==="W1"||r.m==="W8"){if(P.bar.W8.s>0)spacing=Math.min(spacing,P.bar.W1.s/2,P.bar.W8.s/2);}
  // c uses the half spacing after allowing one extra bar diameter for the contact lap pair.
  spacing=Math.max(1,spacing-BARS[r.dia].d);
  r.lapInfo=stockLap(P,r.dia,spacing);r.lapMM=r.lapInfo.lap;
  const raw=pts.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0),scale=r.len*1000/raw;
  if(Math.abs(scale-1)>1e-8)pts=pts.map(p=>[pts[0][0]+(p[0]-pts[0][0])*scale,pts[0][1]+(p[1]-pts[0][1])*scale]);
  let plan;
  if(r.long){
   const blocks=Math.max(1,Math.ceil(P.L/P.blk-1e-9)),blockSpan=P.L*1000/blocks,net=blockSpan-80;
   if(net<=0||blocks>1000)throw Error("신축이음 블록 길이·개수를 확인하세요.");
   plan={total:net*blocks,pieces:[],joints:[],blocks};
   for(let bi=0;bi<blocks;bi++){const q=stockPlan([[0,0],[net,0]],stock,r.lapMM,r.lapInfo.db),offset=bi*blockSpan+40;
    plan.pieces.push(...q.pieces.map(p=>({...p,block:bi+1,start:p.start+offset,end:p.end+offset,pts:p.pts.map(v=>[v[0]+offset,v[1]])})));
    plan.joints.push(...q.joints.map(j=>({from:j.from+offset,to:j.to+offset,block:bi+1})));
   }
   r.len=plan.total/1000;
  }else plan=stockPlan(pts,stock,r.lapMM,r.lapInfo.db);
  r.stockPlan=plan;
  r.baseTotal=r.len*r.nAll;r.spliceCount=plan.joints.length*r.nAll;r.pieceCount=plan.pieces.length*r.nAll;
  r.totalLen=plan.pieces.reduce((s,p)=>s+p.len,0)/1000*r.nAll;
  r.addLen=r.totalLen-r.baseTotal;r.lenM=r.totalLen/P.L;r.kgM=r.lenM*r.w;r.kgAll=r.totalLen*r.w;
 }
}
function materialMark(r){return DM(r.m)+(r.pieceNo?"-"+r.pieceNo:"");}
function materialPieces(R){setWT(R);return R.sched.map(r=>{const pc=r.stockPlan.pieces,tot=pc.reduce((a,p)=>a+p.len,0),bar=R.bars.find(b=>b.m===r.m);
 // 정척이음 조각은 한 기호로 합치고 길이에 이음길이를 더한다(형상은 원래 철근).
 let pts=pc.length===1?pc[0].pts:(bar?(bar.shp||bar.pts):[[0,0],[r.len*1000,0]]);
 if(pc.length>1){const raw=pts.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0),k=r.len*1000/raw;if(Math.abs(k-1)>1e-8)pts=pts.map(p=>[pts[0][0]+(p[0]-pts[0][0])*k,pts[0][1]+(p[1]-pts[0][1])*k]);}
 const joints=pc.length-1;
 return {...r,pieceNo:0,cutPts:pts,len:tot/1000,baseMM:r.len*1000,joints,nAll:r.nAll,perM:r.nAll/R.P.L,lenM:tot/1000*r.nAll/R.P.L,kgM:tot/1000*r.nAll/R.P.L*r.w,kgAll:tot/1000*r.nAll*r.w,a:tot,b:0,c:0};});}
function stockRows(R){setWT(R);return R.sched.map(r=>[DM(r.m),r.dia,r.nAll,r.stockPlan.pieces.length,r.spliceCount,r.spliceCount?r.lapMM:0,r.pieceCount,fx(r.totalLen,3),fx(r.kgAll,0)]);}
function stockPurchase(P,sched){
 const out=[],stock=Math.floor(P.stockLen*1000);
 for(const dia of Object.keys(BARS)){
  const rows=sched.filter(r=>r.dia===dia);if(!rows.length)continue;
  const lengths=new Map();for(const r of rows)for(const p of r.stockPlan.pieces)lengths.set(p.len,(lengths.get(p.len)||0)+r.nAll);
  const bins=new Map();let stockN=0;
  const add=(rem,n)=>{if(n>0)bins.set(rem,(bins.get(rem)||0)+n);};
  for(const [len,qty] of [...lengths].sort((a,b)=>b[0]-a[0])){
   let n=qty;
   for(const rem of [...bins.keys()].filter(x=>x>=len).sort((a,b)=>a-b)){
    if(!n)break;const count=bins.get(rem)||0,per=Math.floor(rem/len);if(!count||!per)continue;
    const full=Math.min(count,Math.floor(n/per));if(full){bins.set(rem,bins.get(rem)-full);add(rem-per*len,full);n-=full*per;}
    if(n>0&&(bins.get(rem)||0)>0){const take=Math.min(per,n);bins.set(rem,bins.get(rem)-1);add(rem-take*len,1);n-=take;}
   }
   if(n){const per=Math.floor(stock/len);if(!per)throw Error("정척을 넘는 가공 조각입니다.");const full=Math.floor(n/per);if(full){stockN+=full;add(stock-per*len,full);n-=full*per;}if(n){stockN++;add(stock-n*len,1);}}
  }
  const used=rows.reduce((s,r)=>s+r.totalLen,0),stockM=stockN*stock/1000,waste=stockM-used;
  if(waste<-.000001)throw Error("정척 원철근 집계 오류");
  out.push({dia,stockN,stockM,used,waste:Math.max(0,waste),netKg:used*BARS[dia].w,stockKg:stockM*BARS[dia].w,reserveN:Math.ceil(stockN*(1+P.loss/100)),patterns:[...bins].filter(([,n])=>n>0).map(([rem,n])=>({rem,n}))});
 }
 return out;
}
function purchaseRows(R){return R.PURCHASE.map(r=>[r.dia,r.stockN,fx(r.used,3),fx(r.stockM,3),fx(r.waste,3),fx(r.netKg,2),fx(r.stockKg,2),r.reserveN]);}
function stockNote(P){return "정척 "+P.stockLen+"m; KDS 14 20 52:2024 식(4.1-2)·4.5.2 B급 인장이음. ld0=0.90 db fy αβγ/[λ√fck×min((c+Ktr)/db,2.5)], ls=10mm 올림(max(300,1.3ld0)). ld0의 300mm 하한·초과철근 감소계수는 적용하지 않습니다. α="+P.lapTop+", β="+P.lapCoat+", αβ≤1.7, γ=.8(D19 이하)/1.0, λ=1, Ktr=0. c는 보장 중심피복과 접촉 이음쌍을 고려한 간격의 절반 중 작은 값입니다. 종방향은 신축이음 간격 이하의 균등 블록으로 나누고 블록마다 양단40mm를 공제하며 신축이음을 가로질러 겹침이음을 만들지 않습니다. 정척 초과 시 직선구간에서만 분할하며 절곡점에서 2db를 띄우는 수량 계획 가정입니다. 절단 조각은 1mm 올림, 원철근 본수는 동일 규격 내 긴 조각부터 잔재를 재사용하는 절단 계획으로 별도 집계합니다. 절단손실 0mm, 최적 발주량 보장은 없으며 가공중량과 원철근 반입중량을 구분합니다. 이음 위치와 현장 피복·순간격·정착·시공단계는 배근 상세에서 확정해야 합니다.";}

function compute(ovr){
  $("qa").value=String(num("qult")/3);
  $("fe").value=String((num("qultE")/2)/(num("qult")/3));
  const inputErrors=validateInputs();
  if(inputErrors.length)throw new Error(inputErrors.join(" / "));
  const P={H:num("H"),D:num("D"),t1:num("t1"),t2:num("t2"),nf:num("nf"),Df:num("Df"),B1:num("B1"),B3:num("B3"),
    cw:num("cw"),cf:num("cf"),ck:($("ck").value.trim()===""||!isFinite(parseFloat($("ck").value)))?num("cf"):num("ck"),gs:num("gs"),phi:num("phi"),q:num("q"),mu:num("mu"),qv:$("qv").value!=="0",toeS:$("toeS").value!=="0",hpv:$("hpv").value!=="0",hm:$("hm").value==="joint"?"joint":"kds",qa:num("qa"),gc:num("gc"),
    xr:num("xr"),Hs:num("Hs"),bk:Math.max(0,num("bk")),hk:Math.max(0,num("hk")),kx:num("kx"),lsK:Math.max(0,num("lsK")),lsW:Math.max(0,num("lsW")),lsF:(num("lsF")>0?num("lsF"):100),eqp:["s06","h2"].includes($("eqp").value)?$("eqp").value:"split",eqd:$("eqd")&&$("eqd").value==="d"?"d":"h",stin:$("stin").value==="1",slm:$("slm").value,ppf:num("ppf"),kh:num("kh"),fe:num("fe")||1,L:Math.max(0.5,num("L")),blk:Math.max(1,num("blk")),fck:num("fck"),lev:num("lev"),loss:num("loss"),steel:$("steel").value};
  P.stockLen=num("stockLen");P.lapTop=+$("lapTop").value;P.lapCoat=+$("lapCoat").value;P.lapCenter=num("lapCenter");
  P.qult=num("qult");P.qultE=num("qultE");P.qaE=P.qultE/2;P.qa=P.qult/3;P.fe=P.qaE/P.qa;
  P.waterMode=$("waterMode").value;P.useClass=$("useClass").value;P.drainArea=num("drainArea");P.stin=true;P.hpv=true;
  P.qInput=P.q;P.he=0;
  if(P.useClass!=="general"){
    const Hm=P.H/1000, heights=[1.5,3,6], vals=P.useClass==="road0"?[.85,.75,.70]:P.useClass==="road03"?[.70,.65,.60]:[1.85,1.50,1.15];
    P.he=Hm>=6?vals[2]:Hm<=3?vals[0]+(vals[1]-vals[0])*(Hm-1.5)/1.5:vals[1]+(vals[2]-vals[1])*(Hm-3)/3;
    P.q=Math.max(P.qInput,10,P.gs*P.he);
  }else P.q=Math.max(10,P.qInput);
  P.w7v=Math.max(0,num("v_W7")||0);
  P.bar={};RB.forEach(([m])=>{const sv=num("s_"+m);P.bar[m]={dia:$("d_"+m).value,s:(sv<=0&&(m==="W8"||m==="W7"||m==="F5"||m==="FS"||m==="WH"||m==="WD"))?0:(sv<=0&&m==="K2")?200:Math.max(50,sv)};});   // 전단키 가로철근은 항상 배치 (0이면 @200)
  P.cutW8=Math.max(0,num("cutW8")); P.cutAuto=null; if(ovr&&ovr.cut){ P.cutW8=ovr.cut.z; P.cutAuto=ovr.cut; } P.lhW=Math.max(0,num("lhW")); P.f2up=Math.max(0,num("f2up")); P.nF5=Math.max(0,Math.round(num("nF5"))); P.tieDense=!!(ovr&&ovr.tieDense);
  P.wtype=["T","L","RL"].includes($("wtype").value)?$("wtype").value:"T"; DMWT=P.wtype; relabelRB(P.wtype);
  if(P.wtype==="L") P.B1=0; if(P.wtype==="RL"){ P.B3=0; P.toeS=false; }   // 역L형: 앞굽 위 흙은 안정검토에 넣지 않음 (사용자 기준)
  P.wname={T:"역T형",L:"L형",RL:"역L형"}[P.wtype];
  P.D2=(num("D2")>0&&P.B3>0)?Math.min(num("D2"),P.D):P.D;
  P.D1=($("D1")&&num("D1")>0&&P.B1>0)?Math.min(num("D1"),P.D):P.D;   // 앞굽 끝 두께 (앞굽 윗면이 앞굽 끝으로 얇아지는 헌치)
  const warns=[],infos=[];
  const hs=P.H-P.D, B=P.B1+P.t2+P.B3;
  P.hh=Math.max(0,Math.min($("hh")?num("hh"):0,P.B1,Math.max(0,hs-1)));   // 벽체 전면 하단 헌치(45°): 전면 경사는 헌치 위부터, 단면검토는 헌치 무시(보수적)
  const xft=P.B1+P.nf*(hs-P.hh), xbt=xft+P.t1, xbb=P.B1+P.t2;
  const zhh=P.D1<P.D&&P.B1>0?P.D1+(P.D-P.D1)*(P.B1-P.hh)/P.B1:P.D, hhPts=P.hh>0?[[P.B1,P.D+P.hh],[P.B1-P.hh,zhh]]:[[P.B1,P.D]];
  const nb=(xbb-xbt)/hs;
  if(hs<=0) warns.push("기초두께 D가 전체높이 H보다 큽니다.");
  if(nb<-1e-6) warns.push(`벽체 하단두께가 부족해 배면이 앞으로 기웁니다. t2 ≥ ${fx(P.t1+P.nf*hs,0)} mm로 늘리세요.`);
  const G={hs,B,xft,xbt,xbb,nb,
    stem:P.hh>0?[[P.B1-P.hh,zhh],[P.B1,P.D],[xbb,P.D],[xbt,P.H],[xft,P.H],[P.B1,P.D+P.hh]]:[[P.B1,P.D],[xbb,P.D],[xbt,P.H],[xft,P.H]],
    foot:[[0,0],[B,0],[B,P.D2],...(P.D2<P.D?[[P.B1+P.t2,P.D]]:[]),...(P.D1<P.D?[[P.B1,P.D]]:[]),[0,P.D1]],
    levp:[[-P.lev,-P.lev],[B+P.lev,-P.lev],[B+P.lev,0],[-P.lev,0]]};
  G.hasKey=P.bk>0&&P.hk>0;
  if(G.hasKey){
    const k0=P.kx,k1=P.kx+P.bk,hk=P.hk,lv=P.lev;
    if(k0<0||k1>B) warns.push("전단키가 기초 폭을 벗어났습니다. 키 위치와 폭을 확인하세요.");
    G.key=[[k0,-hk],[k1,-hk],[k1,0],[k0,0]];
    // 버림콘크리트: 기초 저면(키 부위 제외) + 전단키 바닥 (키 측면 없음)
    G.levRects=[[[-lv,-lv],[k0,-lv],[k0,0],[-lv,0]],[[k1,-lv],[B+lv,-lv],[B+lv,0],[k1,0]],[[k0,-hk-lv],[k1,-hk-lv],[k1,-hk],[k0,-hk]]].filter(r=>r[1][0]-r[0][0]>0);
    G.levOutlines=G.levRects;
    G.concOutline=[[0,0],[k0,0],[k0,-hk],[k1,-hk],[k1,0],[B,0],[B,P.D2],[xbb,P.D],[xbt,P.H],[xft,P.H],...hhPts,[0,P.D1]];
  }else{
    G.key=null; G.levRects=[G.levp]; G.levOutlines=[G.levp];
    G.concOutline=[[0,0],[B,0],[B,P.D2],[xbb,P.D],[xbt,P.H],[xft,P.H],...hhPts,[0,P.D1]];
  }
  const xf=z=>P.B1+P.nf*Math.max(0,z-P.D-P.hh), xb=z=>xbb-nb*(z-P.D);
  const kf=Math.sqrt(1+P.nf*P.nf), kb=Math.sqrt(1+nb*nb);

  /* 철근 형상 (단면 좌표) */
  const d=m=>BARS[P.bar[m].dia].d;
  const leg=m=>Math.max(300,r10(15*d(m)));
  const zTop=P.H-P.cw, zBot=P.cf+30;
  const bars=[]; // {m, pts, type, dims, dir:'T'(횡) / 'L'(종), pos:[...]}
  // W1 배면 주철근: 배면 평행 + 하단 앞굽측 갈고리
  // 전면 철근선 (수평 거리): 앞굽이 없으면 저판 피복선(기초 전면)에 맞춰 벽체 구간도 같은 선으로 정렬
  const topZ=x=>x<P.B1?P.D1+(P.D-P.D1)*Math.max(0,x)/Math.max(1,P.B1):x<=xbb?P.D:P.D-(P.D-P.D2)*Math.min(1,(x-xbb)/Math.max(1,B-xbb)); G.topZ=topZ; G.D2=P.D2; G.D1=P.D1;
  // 앞굽이 없으면: 전면 철근선이 F1 앞쪽 꺾임점(x=저판피복, z=F1 높이)을 지나도록 정렬
  const zF1=P.D-P.cf, kneeZ=P.B1<=0?zF1:P.D;
  const cwF=P.B1<=0?Math.max(P.cw*kf,P.cf-(P.B1+P.nf*(zF1-P.D))):P.cw*kf;
  // 뒷굽이 없으면(역L형): 배면 철근선이 F1 뒤쪽 꺾임점(x=B-저판피복, z=F1 높이)을 지나도록 정렬
  const kneeB=P.B3<=0?zF1:P.D, xbE=z=>(P.B1+P.t2)-nb*(z-P.D);
  const cwB=P.cw*kb;   // 배면 주철근은 벽체 피복 기준 (역L형도 저판 피복과 무관하게 상단에서 벽체 피복 유지 — 표준도)
  // 벽체 구간은 경사를 따라 저판 상면(z=D)까지, 그 아래 기초 안은 수직으로 내려 갈고리
  // 하단 갈고리: F2 바로 위에 얹고, F1·F2 앞쪽/뒤쪽 다리를 넘지 않게
  const zHook=m=>P.cf+(d("F2")+d(m))/2, xMinH=m=>P.cf+(d("F1")+d(m))/2, xMaxH=m=>B-P.cf-(d("F1")+d(m))/2;
  { const xT=P.B3<=0?G.xbt-P.cw:xb(zTop)-cwB, xD=P.B3<=0?Math.min(xbE(kneeB)-cwB,B-P.cf):xbE(kneeB)-cwB, zb=zHook("W1"),   /* 역L형: 위는 벽체 피복, 아래 꺾임점은 저판 철근 끝(B−저판피복)에 맞춤 */ lg=Math.max(0,Math.min(P.lhW>0?P.lhW:leg("W1"),xD-xMinH("W1")));
    const pts=[[xT,zTop],[xD,kneeB],[xD,zb],[xD-lg,zb]];
    bars.push({m:"W1",pts,type:"L3",a:Math.hypot(xT-xD,zTop-kneeB),b:kneeB-zb,c:lg});
    // W2(표시) 배면 주철근 단절분: W1과 같은 선, 기초 상면 위 cutW8 높이에서 끊음. W1 사이에 엇갈려 배치
    if(P.bar.W8.s>0&&P.cutW8>0){ const zc=Math.min(zTop,P.D+P.cutW8), xc=xT+(xD-xT)*(zTop-zc)/((zTop-kneeB)||1);
      const zb8=zHook("W8"), lg8=Math.max(0,Math.min(P.lhW>0?P.lhW:leg("W8"),xD-xMinH("W8")));
      bars.push({m:"W8",pts:[[xc,zc],[xD,kneeB],[xD,zb8],[xD-lg8,zb8]],type:"L3",y0:P.bar.W1.s,a:Math.hypot(xc-xD,zc-kneeB),b:kneeB-zb8,c:lg8,zc}); } }
  { const xT=xf(zTop)+cwF, xD=xf(kneeZ)+cwF, zb=zHook("W2"), lg=Math.max(0,Math.min(leg("W2"),xMaxH("W2")-xD));
    const pts=[[xT,zTop],[xD,kneeZ],[xD,zb],[xD+lg,zb]];
    bars.push({m:"W2",pts,type:"L3",a:Math.hypot(xT-xD,zTop-kneeZ),b:kneeZ-zb,c:lg}); }
  { // W4 상부 뚜껑철근: 전·배면 수직근 바깥쪽 ∩형, 다리 = 조립길이
    const db=d("W4"), ls=P.lsW;
    // 조립철근은 외곽: 수직근(W1·W2) 바깥쪽, 상단은 수직근 끝 위
    const zc=P.H-P.cw+(Math.max(d("W1"),d("W2"))+db)/2, lg=Math.min(ls,hs-2*P.cw);
    const xF=z=>xf(z)+cwF-(d("W2")+db)/2, xB=z=>xb(z)-cwB+(d("W1")+db)/2;
    bars.push({m:"W4",pts:[[xF(zc-lg),zc-lg],[xF(zc),zc],[xB(zc),zc],[xB(zc-lg),zc-lg]],type:"U",a:xB(zc)-xF(zc),b:lg,cap:true});
    G.W4={ls,lg}; }
  const TSTD=P.wtype==="T";   // 역T형: 표준도 방식 저판 철근 (하면 F1 / 상면 뒷굽용 F2 / 상면 전체 F3)
  if(TSTD){
    const zT=x=>topZ(x)-P.cf, zB=P.cf, x0=P.cf, x9=B-P.cf, z2=P.D2-P.cf;
    const topPath=[[x0,zT(x0)],...(P.D1<P.D?[[P.B1,P.D-P.cf]]:[]),[xbb,P.D-P.cf],...(P.D2<P.D?[[x9,z2]]:[[x9,P.D-P.cf]])].filter((p,k,a)=>k===0||Math.hypot(p[0]-a[k-1][0],p[1]-a[k-1][1])>1);
    const toeLeg=m=>Math.max(0,Math.min(200,zT(x0)-zB-(d(m)+d("F2"))/2));   // 앞굽 끝 갈고리 200 (표준도)
    // 표시 F3 (내부 FT): 앞굽 끝 아래로 200 → 상면 전체 → 뒷굽 끝 아래로 하면까지
    const ftPts=[[x0,zT(x0)-toeLeg("FT")],...topPath,[x9,zB]];
    bars.push({m:"FT",pts:ftPts,type:"T6",a:x9-x0,b:z2-zB,c:toeLeg("FT")});
    // 표시 F2 (내부 F1): 벽체 전면에서 앞굽 쪽으로 100 걸치고 시작 → 상면 → 뒷굽 끝 아래로 하면까지
    const sx=P.B1>0?Math.max(x0,P.B1-100*Math.cos(Math.atan2(P.D-P.D1,Math.max(1,P.B1)))):x0;
    const f1Pts=[[sx,zT(sx)],...topPath.filter(p=>p[0]>sx+1),[x9,zB]];
    bars.push({m:"F1",pts:f1Pts,type:"T7",a:x9-sx,b:z2-zB,c:0,y0:P.bar.FT.s/2+Math.min(P.bar.F1.s,P.bar.FT.s)/2});   // F3 사이에 번갈아
    // 표시 F1 (내부 F2): 앞굽 끝 위로 상면 철근까지 → 하면 전체 → 뒷굽 끝 위로 200 (뒷굽 끝은 F2·F3가 하면까지 내려오므로)
    const upT=Math.max(0,zT(x0)-zB-(d("FT")+d("F2"))/2), upH=Math.max(0,Math.min(200,z2-zB));
    bars.push({m:"F2",pts:[[x0,zB+upT],[x0,zB],[x9,zB],[x9,zB+upH]],type:"T3",a:x9-x0,b:upT,c:upH});
  } else {
    { // F1: 상면 → 양끝 다리를 F2 높이까지 내린 뒤 안쪽으로 90° 조립길이
      const z=P.D-P.cf, z2=P.D2-P.cf, zb=P.cf+(d("F1")+d("F2"))/2, c=Math.min(P.lsF,(B-2*P.cf)/2);
      const top=P.D2<P.D?[[P.cf,z],[xbb,z],[B-P.cf,z2]]:[[P.cf,z],[B-P.cf,z]];
      bars.push({m:"F1",pts:c>1?[[P.cf+c,zb],[P.cf,zb],...top,[B-P.cf,zb],[B-P.cf-c,zb]]:[[P.cf,zb],...top,[B-P.cf,zb]],disp:c>1?[[.28,0],[0,0],[0,.62],...(top.length===3?[[1,.62],[1.6,.45]]:[[1.6,.62]]),[1.6,0],[1.32,0]]:null,type:c>1?"U2":"U",a:B-2*P.cf,b:z-zb,c}); }
    { const z=P.cf;   // F2(내부, 표시 F1) 하면 주철근: 일자, 필요하면 뒷굽 끝에서 위로 올림
      const up=Math.min(P.f2up,P.D2-2*P.cf);
      bars.push({m:"F2",pts:up>0?[[P.cf,z],[B-P.cf,z],[B-P.cf,z+up]]:[[P.cf,z],[B-P.cf,z]],type:up>0?"L":"I",a:B-2*P.cf,b:up>0?up:0}); }
  }
  if(G.hasKey){ const ck=P.ck, a=P.bk-2*ck, zb=-P.hk+ck, fy=P.steel==="SD500"?500:400;
    const db=d("K1"), ls=P.lsK;
    const zt=Math.min(topZ(P.kx),topZ(P.kx+P.bk))-P.cf-(d("F1")+db)/2;   // 상면 F1 철근 아래까지 올려 90° 꺾음
    const x0=P.kx+ck, x1=P.kx+P.bk-ck;
    G.K1={ls};
    // F6: F5와 같은 모양 — 바닥(L1) + 양 다리(L2) + 다리 끝 갈고리(L3)를 안쪽으로 꺾음
    const c2=Math.min(ls,a); G.K1.c=c2;
    if(a>=50) bars.push({m:"K1",pts:[[x0+c2,zt],[x0,zt],[x0,zb],[x1,zb],[x1,zt],[x1-c2,zt]],disp:[[0.28,0.62],[0,0.62],[0,0],[1.6,0],[1.6,0.62],[1.32,0.62]],type:"U2",a,b:zt-zb,c:c2});
    else warns.push("전단키 폭이 피복에 비해 좁아 키 철근을 넣지 못했습니다."); }
  // 종방향 배력근 위치
  const dots={W3:[],W5:[],F3:[],F4:[],K2:[],WD:[]};
  // 수평 배력근: 벽체 상단 철근 위치에서 아래로 간격대로, 저판 상면 철근 높이 위까지 (표준도 방식)
  // 표준도 방식: 저판 상면 철근 높이(D-피복)에서 간격만큼 위부터 위로 올라가며 배치, 맨 위는 벽체 상단 철근 위치(남는 간격은 맨 위에서 짧게)
  const hzs=s=>{const zs=[]; for(let z=P.D-P.cf+s; z<zTop-Math.min(50,s*0.25); z+=s) zs.push(z); zs.push(zTop); return zs;};
  { const off2=(d("W3")+d("W2"))/2; hzs(P.bar.W3.s).forEach(z=>dots.W3.push([xf(z)+cwF+off2,z])); }   // 전면
  { const off=(d("W5")+d("W1"))/2; hzs(P.bar.W5.s).forEach(z=>dots.W5.push([xb(z)-cwB-off,z])); }    // 배면
  // 저판 배력근: 벽체 아래는 벽체 수직철근(전면 W3·배면 W1) 위치에, 앞굽·뒷굽은 끝(피복)에서부터 배근 간격대로
  const xAtZ=(m,z)=>{ const bb=bars.find(q=>q.m===m); if(!bb) return null; const p=bb.pts;
    for(let i=0;i<p.length-1;i++){const [a,c]=[p[i],p[i+1]]; if(Math.abs(a[1]-c[1])>1&&(z-a[1])*(z-c[1])<=0) return a[0]+(c[0]-a[0])*(z-a[1])/(c[1]-a[1]);}
    const zs=p.map(q=>q[1]), i=zs.indexOf(Math.min(...zs)); return p[i][0]; };
  const fPos=(s,z,fill)=>{ const xF=xAtZ("W2",z)??(P.B1+P.cw), xW=xAtZ("W1",z)??(xbb-P.cw), xs=[];
    if(P.B1>0) for(let x=P.cf; x<xF-s*0.4; x+=s) xs.push(x);          // 앞굽: 왼쪽 끝(피복)에서부터 간격대로
    xs.push(xF, xW);                                                 // 벽체 아래: 벽체 수직철근 위치
    if(fill&&xW-xF>s){ const n=Math.ceil((xW-xF)/s)-1; for(let k=1;k<=n;k++) xs.push(xF+(xW-xF)*k/(n+1)); }   // 하면: 간격보다 넓으면 사이에 추가
    for(let x=B-P.cf; x>xW+s*0.4; x-=s) xs.push(x);                  // 뒷굽: 끝에서부터
    return [...xs].sort((u,v)=>u-v).filter((x,i,arr)=>i===0||x-arr[i-1]>20); };
  { const s=P.bar.F3.s, zb=P.cf+(d("F3")+d("F2"))/2;  // 하면 배력근
    fPos(s,zb+d("F2"),true).forEach(x=>dots.F3.push([x,zb])); }
  { const s=P.bar.F4.s, ztf=x=>topZ(x)-P.cf-(d("F4")+d("F1"))/2;  // 상면 배력근
    fPos(s,P.D-P.cf-d("F1")).forEach(x=>dots.F4.push([x,ztf(x)])); }
  { const k1=bars.find(b=>b.m==="K1");
    if(k1&&P.bar.K2.s>0){ const off=(d("K1")+d("K2"))/2, s2=P.bar.K2.s;
      const xl=k1.pts[2][0]+off, xr=k1.pts[3][0]-off, zbt=k1.pts[2][1]+off, ztop=-30;
      const even=(a,b)=>{const n=Math.max(1,Math.ceil((b-a)/s2-1e-6)),o=[];for(let i=0;i<=n;i++)o.push(a+(b-a)*i/n);return o;};
      const zs=ztop>zbt?even(zbt,ztop):[zbt], xs=xr>xl?even(xl,xr):[xl];
      zs.forEach(z=>{dots.K2.push([xl,z]);dots.K2.push([xr,z]);});
      xs.slice(1,-1).forEach(x=>dots.K2.push([x,zbt])); } }

  // W7 벽체 연결철근: 전·배면 수직근을 묶는 ㄷ형, 수평근 두 단마다
  { const w2=bars.find(b=>b.m==="W2"), w1=bars.find(b=>b.m==="W1"), leg=100;
    const xAt=(b,z)=>{const [a,c]=[b.pts[0],b.pts[1]];return a[0]+(c[0]-a[0])*(a[1]-z)/((a[1]-c[1])||1);};
    const z3=[...new Set(dots.W3.map(q=>q[1]))].sort((a,b)=>a-b), ds=z3.slice(1).map((z,i)=>z-z3[i]).sort((a,b)=>a-b), s3=ds.length?ds[Math.floor(ds.length/2)]:200;
    const st=P.w7v>0?Math.max(1,Math.round(P.w7v/s3)):2;   // 세로 간격 입력 → 수평근 몇 단마다 (빈칸이면 2단마다)
    const zs=z3.filter((z,i)=>i%st===st-1&&z<zTop-50);
    const secs=zs.map(z=>[[xAt(w2,z),z],[xAt(w1,z),z]]);
    if(secs.length&&P.bar.W7.s>0){ const L1=secs.reduce((a,q)=>a+(q[1][0]-q[0][0]),0)/secs.length+d("W7");
      bars.push({m:"W7",pts:secs[0],secs,n:secs.length,shp:[[0,leg],[0,0],[L1,0],[L1,leg]],type:"U",a:L1,b:leg}); } }
  // F5 저판 연결철근: 상·하면 횡방향 철근을 수직으로 묶는 ㄷ형(표준도 상세3).
  //  단면에서는 수직선으로 보이고, L1은 연장 방향으로 횡철근 두 개를 감싼다. 뒷굽 배력근 두 칸마다 배치.
  { const xsAll=[...new Set(dots.F3.map(q=>Math.round(q[0])))].sort((a,b)=>a-b).filter(x=>x>xbb);
    // 저판 오른쪽 끝(뒷굽 끝, 거리 0)에는 두지 않고, 끝에서 지정 간격(배력근 두 칸)만큼 떨어진 곳부터 벽체 쪽으로 배치
    const nA=xsAll.length, cand=[], stp=P.tieDense?1:2; for(let i=nA-1-stp;i>=0;i-=stp) cand.push(xsAll[i]);   // 전단보강이 필요하면 배력근 한 칸마다
    // 전단키 연결철근 구간에는 F5를 중복 배치하지 않는다. 짧은 우측 잔여 구간도 생략.
    const keyLeft=P.kx,keyRight=P.kx+P.bk,crossPitch=stp*P.bar.F3.s;
    const rightEnd=xsAll.length?xsAll[xsAll.length-1]:B-P.cf;
    const usable=G.hasKey?cand.filter(x=>x<keyLeft-1e-7||(x>keyRight+1e-7&&rightEnd-keyRight>=crossPitch-1e-7)):cand;
    let xs=usable.slice(0,P.nF5>0&&!P.tieDense?P.nF5:usable.length).sort((a,b)=>a-b);   // 전단보강이 필요하면 개수 입력과 관계없이 뒷굽 전체(벽체 면까지)
    if(P.wtype==="RL"){   /* 역L형: 뒷굽이 없으므로 앞굽에 배치 — 앞굽 끝에서 세 번째 배력근부터 두 칸마다(전단보강 시 한 칸마다), 전단키 구간 제외 (역T형 앞굽 연결철근과 같은 방식) */
      const xF=xAtZ("W2",P.cf+30)??P.B1, xsT=[...new Set(dots.F3.map(q=>Math.round(q[0])))].sort((a,b)=>a-b).filter(x=>x<xF-30);
      xs=[]; for(let i=2;i<xsT.length;i+=stp){const x=xsT[i]; if(G.hasKey&&x>=keyLeft-1e-7&&x<=keyRight+1e-7)continue; xs.push(x);}
      if(!xs.length&&xsT.length>=2) xs.push(xsT[xsT.length-1]); }
    const zb=P.cf, zt=x=>topZ(x)-P.cf, r=100;
    const secs=xs.map(x=>[[x,zb],[x,zt(x)]]);
    const topS=TSTD&&P.bar.FT?1000/(1000/P.bar.F1.s+1000/P.bar.FT.s):P.bar.F1.s;   // 역T형: 상면은 F2·F3 합친 간격
    if(secs.length&&P.bar.F5.s>0){ const L1=2*Math.min(topS,P.bar.F2.s)+d("F1")+d("F5");
      const L2s=xs.map(x=>zt(x)-zb+(d("F1")+d("F2"))/2+d("F5")), L2=L2s.reduce((a,v)=>a+v,0)/L2s.length;
      bars.push({m:"F5",y0:P.bar.F5.s,pts:secs[0],secs,n:secs.length,shp:[[r,0],[0,0],[0,L2],[L1,L2],[L1,0],[L1-r,0]],disp:[[0.28,0],[0,0],[0,0.62],[1.6,0.62],[1.6,0],[1.32,0]],type:"U2",a:L1,b:L2,c:r}); } }
  // 역T형 앞굽 연결철근(표시 F6): 뒷굽 연결철근과 같은 모양·간격, 앞굽 끝에서 배력근 두 칸 떨어진 곳부터 벽체 쪽으로. 평균 길이가 달라 따로 집계
  if(TSTD&&P.B1>0&&P.bar.FS.s>0){
    const xF=xAtZ("W2",P.cf+30)??P.B1, xsT=[...new Set(dots.F3.map(q=>Math.round(q[0])))].sort((a,b)=>a-b).filter(x=>x<xF-30);
    const xs=[]; for(let i=2;i<xsT.length;i+=2) xs.push(xsT[i]); if(!xs.length&&xsT.length>=2) xs.push(xsT[xsT.length-1]);   // 앞굽이 짧아 세 번째 배력근이 없으면 벽체 쪽 마지막 배력근에 하나
    const zb=P.cf, zt=x=>topZ(x)-P.cf, r=100, topS=1000/(1000/P.bar.F1.s+1000/P.bar.FT.s);
    const secs=xs.map(x=>[[x,zb],[x,zt(x)]]);
    if(secs.length){ const L1=2*Math.min(topS,P.bar.F2.s)+d("FT")+d("FS");
      const L2s=xs.map(x=>zt(x)-zb+(d("FT")+d("F2"))/2+d("FS")), L2=L2s.reduce((a,v)=>a+v,0)/L2s.length;
      bars.push({m:"FS",y0:P.bar.FS.s,pts:secs[0],secs,n:secs.length,shp:[[r,0],[0,0],[0,L2],[L1,L2],[L1,0],[L1-r,0]],disp:[[0.28,0],[0,0],[0,0.62],[1.6,0.62],[1.6,0],[1.32,0]],type:"U2",a:L1,b:L2,c:r}); } }

  // 벽체 전면 하단 헌치 철근(표시 H1): 헌치면과 나란한 사선, 헌치면에서 피복만큼 안쪽. 위는 배면 주철근, 아래는 저판 하면 철근까지 (표준도)
  if(P.hh>0&&P.bar.WH&&P.bar.WH.s>0){ const r2=Math.SQRT2, mx=P.B1-P.hh/2, mz=P.D+P.hh/2, c=P.cw, px=mx+c/r2, pz=mz-c/r2;
    const xUp=xbb-P.cw, tUp=xUp-px, zUp=pz+tUp; let tDn=P.cf-pz; let xDn=px+tDn, zDn=P.cf; if(xDn<P.cf){ xDn=P.cf; zDn=pz+(P.cf-px); }
    if(tUp>0&&zUp>P.D){ bars.push({m:"WH",pts:[[xDn,zDn],[xUp,zUp]],type:"I",a:Math.hypot(xUp-xDn,zUp-zDn),b:0});
      // 헌치 가로철근(표시 H2): 사선 철근 위, 저판 윗면 높이 ~ 벽체 전면 사이를 같은 간격으로 (사선 안쪽에 붙임)
      if(P.bar.WD&&P.bar.WD.s>0){ const tA=(P.D-pz)*r2, tB=(P.B1-px)*r2, Lh=tB-tA, n=Math.max(2,Math.ceil(Lh/P.bar.WD.s-1e-6)+1), o=(d("WH")+d("WD"))/2/r2;
        for(let i=0;i<n;i++){ const t=tA+Lh*i/(n-1); dots.WD.push([px+t/r2+o,pz+t/r2-o]); } } } }

  /* 철근재료표 */
  const Lmm=P.L*1000;
  const sched=[];
  bars.forEach(b=>{
    const s=P.bar[b.m].s, sp=b.shp||b.pts, nk=b.n||1; let len=0; for(let i=0;i<sp.length-1;i++) len+=Math.hypot(sp[i+1][0]-sp[i][0],sp[i+1][1]-sp[i][1]);
    if(b.lenAvg) len=b.lenAvg;
    const nAll=nk*barPositions(P,b).length, perM=nAll/P.L;
    const w=BARS[P.bar[b.m].dia].w;
    sched.push({m:b.m,desc:RB.find(r=>r[0]===b.m)[1],dia:P.bar[b.m].dia,type:b.type,a:b.a,b:b.b,c:b.c||0,len:len/1000,s,perM,nAll,
      lenM:len/1000*perM,w,kgM:len/1000*perM*w,kgAll:len/1000*nAll*w});
  });
  ["W3","W5","F3","F4","K2","WD"].filter(m=>dots[m].length).forEach(m=>{
    const n=dots[m].length, w=BARS[P.bar[m].dia].w;
    sched.push({m,desc:RB.find(r=>r[0]===m)[1],dia:P.bar[m].dia,type:"I",a:Lmm-80,b:0,len:P.L-0.08,s:P.bar[m].s,perM:n,nAll:n,
      lenM:n*(P.L-0.08)/P.L,w,kgM:n*(P.L-0.08)/P.L*w,kgAll:n*(P.L-0.08)*w,long:true});
  });
  sched.sort((a,b)=>DIDX(a.m)-DIDX(b.m));
  applyStockSplices(P,sched,bars,dots);
  const byDia={};
  sched.forEach(r=>{byDia[r.dia]=byDia[r.dia]||{kgM:0,kgAll:0};byDia[r.dia].kgM+=r.kgM;byDia[r.dia].kgAll+=r.kgAll;});

  const PURCHASE=stockPurchase(P,sched);
  /* 수량 */
  const Q={};
  Q.cStem=area(G.stem)/1e6; Q.cFoot=area(G.foot)/1e6; Q.cKey=G.hasKey?P.bk*P.hk/1e6:0; Q.conc=Q.cStem+Q.cFoot+Q.cKey;
  Q.lev=G.levRects.reduce((a,r)=>a+area(r),0)/1e6;
  Q.fFront=hs*kf/1000; Q.fBack=hs*kb/1000; Q.fFoot=(P.D1+P.D2)/1000;
  Q.fEnd=2*Q.conc/P.blk; // 마구리: 블록당 양단
  Q.fKey=G.hasKey?2*P.hk/1000:0;
  Q.form=Q.fFront+Q.fBack+Q.fFoot+Q.fKey+Q.fEnd;
  Q.nJoint=Math.max(0,Math.ceil(P.L/P.blk)-1);

  /* 배면 지표 (성토 1:x, 높이 Hs) */
  const Hs=(P.xr>0)?Math.max(0,P.Hs):0;
  const beta=Hs>0?Math.atan(1/P.xr):0;
  const xk=xbt+(Hs>0?P.xr*Hs:0);
  const gnd=x=>x<=xbt?P.H:P.H+(Hs>0?Math.min(Hs,(x-xbt)/P.xr):0);
  Object.assign(G,{gnd,xk,Hs,beta});
  const phi=P.phi*Math.PI/180;
  const c={xf,xb,xbt,xbb,B,phi,beta,gnd,xk,Hs,hs,nb,dlt:P.wtype==="RL"?2*phi/3:Math.min(beta,phi)};   // 가상배면 토압작용각 = 뒤채움 경사(수평이면 0)
  if(beta>=phi && Hs>=P.H) warns.push(`성토경사(${(beta*180/Math.PI).toFixed(1)}°)가 내부마찰각보다 급하고 성토가 높습니다. 사면 자체의 안정을 별도로 확인하세요.`);
  const S=stability(P,G,c);
  const DSN=design(P,G,S,c);
  const invalidContact=DSN.meta.LC.some(L=>!L.valid);
  if(invalidContact){
    warns.push("기초 접촉 상실: 계수하중 합력이 저판 밖에 있거나 연직력이 유효하지 않아 부재 설계와 구조 출력을 중지합니다.");
    DSN.forEach(d=>{Object.keys(d.ok).forEach(k=>d.ok[k]=false);d.allOk=false;});
  }
  /* 단위수량 추가 항목 */
  Q.backfill=P.B3>0?Math.abs(area(heelSoilPoly(P,c)))/1e6:0;      // 뒷굽 위 뒤채움
  Q.joint=Q.conc/P.blk;                                             // 신축이음재: 단면적 × 1개소 / 간격
  Q.stop=(hs+G.B)/1000/P.blk;                                       // 지수판: (벽체 높이 + 기초폭) / 간격
  Q.vcut=hs*kf/1000/5;                                              // 수축줄눈 V커팅: 전면 높이 / 5 m
  Q.drainN=Math.ceil(Math.max(0,P.H-P.Df)/1000*P.L/P.drainArea)/P.L; Q.drain=P.t2/1000*Q.drainN;                            // KDS 11 80 05: 배면 면적당 개수, 1본 길이=t2 가정
  Q.scaf=hs*kf/1000;                                                // 전면 비계
  const DETAILS=kdsDetailChecks(P,G);
  DETAILS.filter(d=>!d.ok).forEach(d=>warns.push(d.name+": "+fx(d.actual,2)+" / 필요 "+fx(d.required,2)+" "+d.unit+" ["+d.rule+"]"));
  if(P.qInput<10)warns.push("일반 일시상재하중 최소 10 kPa를 적용했습니다. KDS 11 80 05 1.7.4(2).");
  if(G.hasKey&&P.ppf>0&&!P.toeS)infos.push("전단키 앞 수동토압을 근입깊이로 계산했습니다. 전면 지반의 장기 유지(굴착·세굴·유실 없음)를 확인하세요. KDS 11 80 05 4.4.1(3)~(5), 4.6.1(3)⑥.");
  const scopePending=["전체안정성·침하·액상화 및 지반조사 근거","정착·이음 위치 승인과 내구성 노출등급별 상세 검토 (B급 겹침길이·수량은 반영)","지진계수와 동적 토압 작용점의 프로젝트별 근거","동결심도·세굴·배수시설 상세와 유지관리"];
  if(G.hasKey&&P.ppf>0)scopePending.push("전면 토사 및 전단키 수동저항의 장기 유지와 토질 조건");
  if(P.wtype==="RL")scopePending.push("역L형의 기초 뒤끝~벽체 상단 등가 경사면 및 벽면마찰 2φ/3 가정");
  if(G.Hs>0)scopePending.push("유한 성토 시행쐐기 합력의 삼각형/등분포 작용점 가정 검증");
  // W2 단절 높이 자동: 벽체 H/2 지점(또는 W1만으로 부족한 높이)에서 12db 연장
  // 뒷굽 콘크리트 전단 부족 → 연결철근을 배력근 한 칸마다 배치하고 전단철근으로 다시 계산 (표준도 계산서 방식)
  if(!P.tieDense&&P.bar.F5&&P.bar.F5.s>0){ const h=DSN.find(d=>d.kind==="heel"); if(h&&h.Vu>h.phVcC+1e-9) return compute({...(ovr||{}),tieDense:true}); }
  if(!(ovr&&ovr.cut)&&P.bar.W8.s>0&&num("cutW8")<=0&&G.hs>0){
    const M=DSN.meta, hsm=G.hs/1000, db=BARS[P.bar.W8.dia].d; let yOk=hsm/2;
    for(let y=hsm/2; y<=hsm+1e-9; y+=0.05){ const S2=M.stemSec(Math.min(y,hsm),""); const r=secCheck(P,"",S2.Mu,S2.Vu,S2.t,P.cw,"W1","배면",{Mo:S2.Mo});
      if(r.ok.m&&r.ok.cr&&r.ok.min) yOk=Math.min(y,hsm); else break; }
    const hc=Math.max(G.hs/2,G.hs-yOk*1000), z=Math.min(G.hs-50,Math.ceil((hc+12*db)/50)*50);
    return compute({...(ovr||{}),cut:{z,hc,db,half:G.hs/2,need:hc>G.hs/2+1}});
  }
  return {P,G,bars,dots,sched,byDia,PURCHASE,Q,S,DSN,warns,infos,xf,xb,invalidContact,DETAILS,scopePending};
}

/* ---------- 토압 (시행쐐기법) · 안정 · 단면 ---------- */
function heelSoilPoly(P,c){
  const pts=[[c.xbb,P.D],[c.B,P.D2??P.D],[c.B,c.gnd(c.B)]];
  if(c.xk>c.xbt && c.xk<c.B) pts.push([c.xk,c.gnd(c.xk)]);
  pts.push([c.xbt,P.H]);
  return pts;
}
function wedgeAt(P,c,al,kh,withQ,o){
  const g=P.gs, phi=c.phi, d=o.d??c.dlt, thw=o.th||0, X0=o.x0??c.B, x0=X0/1000, z0=(o.z0??0)/1000;
  const zt=(o.zt??c.gnd(X0))/1000, xft=x0-(zt-z0)*Math.tan(thw), xkm=c.xk/1000;
  const gm=x=>c.gnd(x*1000)/1000, t=Math.tan(al), f=x=>gm(x)-z0-(x-x0)*t, xs0=Math.max(x0,xft);
  if(f(xs0)<=0) return null;
  let lo=xs0, hi=xs0+1, k=0; while(f(hi)>0&&k<60){hi=xs0+(hi-xs0)*2;k++;}
  for(let i=0;i<55;i++){const mid=(lo+hi)/2; if(f(mid)>0)lo=mid; else hi=mid;}
  const xi=(lo+hi)/2, n=80, xs=[];
  for(let i=1;i<n;i++) xs.push(xi-(xi-xft)*i/n);
  if(xkm>xft&&xkm<xi) xs.push(xkm);
  xs.sort((a,b)=>b-a);
  const pts=[[x0,z0],[xi,gm(xi)],...xs.map(x=>[x,gm(x)]),[xft,gm(xft)]];
  const W=g*area(pts), Wq=withQ?P.q*Math.max(0,xi-Math.max(xft,xkm)):0;
  const den=Math.cos(al-phi-d-thw); if(den<=1e-6) return null;
  return {al,W:W+Wq,Pa:(W+Wq)*(Math.sin(al-phi)+kh*Math.cos(al-phi))/den};
}
function wedgeMax(P,c,withQ,kh,o={}){
  if(kh===0&&o.x0===undefined&&c.Hs===0&&P.wtype!=="RL"){
    const H=c.gnd(c.B)/1000,Ka=Math.tan(Math.PI/4-c.phi/2)**2,Pa=.5*P.gs*Ka*H*H+(withQ?P.q*Ka*H:0),al=Math.PI/4+c.phi/2;
    return {Pa,th:al,W:0,i:0,rows:[{deg:al*180/Math.PI,W:0,Pa}],d:0,thw:0,kh,method:"Rankine",Ka};
  }
  const psi=Math.atan(kh); let best={Pa:0,th:0,W:0};
  for(let i=10;i<900;i++){ const al=i/10*Math.PI/180; if(al<=c.phi-psi+1e-9) continue;
    const r=wedgeAt(P,c,al,kh,withQ,o); if(r&&r.Pa>best.Pa) best={Pa:r.Pa,th:al,W:r.W,i}; }
  best.rows=[];
  if(best.i) for(let j=best.i-2;j<=best.i+2;j++){ const r=wedgeAt(P,c,j/10*Math.PI/180,kh,withQ,o); if(r) best.rows.push({deg:j/10,W:r.W,Pa:r.Pa}); }
  best.d=o.d??c.dlt; best.thw=o.th||0; best.kh=kh;
  return best;
}
function evalStab(X,B,mu,qa,cr){
  if(!(X.V>0&&B>0)||![X.V,X.Mr,X.Mo].every(Number.isFinite)){Object.assign(X,{FSo:0,FSs:0,e:Infinity,qmax:Infinity,qmin:0,qa,cr,ok:{o:false,s:false,e:false,q:false},allOk:false});return;}
  X.FSo=X.Mo>0?X.Mr/X.Mo:Infinity; const Hd=X.Hd??X.Ph, Hr=X.Hr??mu*X.V; X.FSs=Hd>0?Hr/Hd:Infinity;
  X.e=B/2-(X.Mr-X.Mo)/X.V;
  const ae=Math.abs(X.e);
  if(ae<=B/6){X.qmax=X.V/B*(1+6*ae/B);X.qmin=X.V/B*(1-6*ae/B);}
  else if(ae<B/2){X.qmax=2*X.V/(3*(B/2-ae));X.qmin=0;} else {X.qmax=Infinity;X.qmin=0;}
  X.qa=qa; X.cr=cr;
  X.ok={o:X.FSo>=cr.o,s:X.FSs>=cr.s,e:ae<=B/cr.e,q:X.qmax<=qa};
  X.allOk=Object.values(X.ok).every(Boolean);
}
function stability(P,G,c){
  const m=v=>v/1000, Hv=m(P.wtype==="RL"?P.H:c.gnd(c.B)), B=m(c.B);
  const wallTheta=P.wtype==="RL"?Math.atan((c.B-c.xbt)/P.H):0,d=c.dlt+wallTheta;
  const pressureOpts=P.wtype==="RL"?{th:wallTheta,d:c.dlt,zt:P.H}:{};
  const items=[];
  const add=(name,poly,g)=>{const a=area(poly)/1e6, ct=centroid(poly); items.push({name,W:a*g,x:m(ct[0]),z:m(ct[1])});};
  add("벽체 자중",G.stem,P.gc); add("기초 자중",G.foot,P.gc);
  if(G.hasKey) add("전단키 자중",G.key,P.gc);
  if(P.B3>0) add("뒷굽 위 흙",heelSoilPoly(P,c),P.gs);
  if(P.toeS && P.Df>P.D && P.B1>0) add("앞굽 위 흙",P.hh>0&&P.Df>P.D+P.hh?[[0,P.D1??P.D],G.stem[0],[P.B1,P.D+P.hh],[c.xf(P.Df),P.Df],[0,P.Df]]:[[0,P.D1??P.D],[P.B1,P.D],[c.xf(P.Df),P.Df],[0,P.Df]],P.gs);
  const Ws=items.reduce((s,i)=>s+i.W,0), Mw=items.reduce((s,i)=>s+i.W*i.x,0);
  const ws=wedgeMax(P,c,false,0,pressureOpts), wt=wedgeMax(P,c,true,0,pressureOpts);
  const Pa1=ws.Pa, Pa2=Math.max(0,wt.Pa-ws.Pa);
  const Kah=Hv>0?2*Pa1*Math.cos(d)/(P.gs*Hv*Hv):0, Kq=(Hv>0&&P.q>0)?Pa2*Math.cos(d)/(P.q*Hv):0;
  // 활동 저항 (전단키)
  const hk=G.hasKey?m(P.hk):0, bk=G.hasKey?m(P.bk):0, Kp=Math.tan(Math.PI/4+c.phi/2)**2;
  const SL={method:G.hasKey?P.slm:"none",Kp,hk,bk,ppf:P.ppf,
    zt:m(Math.max(0,P.Df)), p1:0,   /* 수동토압: 입력한 근입깊이 Df를 키 상단 위 흙 두께로 (역L형도 동일 — 사용자 기준) */ p2:0, Pp:0,
    Wsl:G.hasKey&&P.slm==="plane"?P.gs*hk*(B-bk):0,
    dPa:G.hasKey&&P.slm==="plane"?Kah*P.gs*(Hv*hk+hk*hk/2)+Kq*P.q*hk:0,
    tanf:Math.tan(c.phi)};
  if(G.hasKey){ SL.p1=Kp*P.gs*SL.zt; SL.p2=Kp*P.gs*(SL.zt+hk); SL.PpFull=0.5*(SL.p1+SL.p2)*hk; SL.Pp=P.ppf*SL.PpFull; }
  const slide=(X,ratio)=>{ if(SL.method==="plane"){X.Hr=(X.V+SL.Wsl)*SL.tanf+SL.Pp;X.Hd=X.Ph+SL.dPa*ratio;}
    else {X.Hr=P.mu*X.V+SL.Pp;X.Hd=X.Ph;} };
  // 벽체 단면용 토압: 기초 상면 위 벽체 배면을 기준면으로 다시 구함
  const stemP=null;
  const N={Ph1:Pa1*Math.cos(d),Ph2:Pa2*Math.cos(d),Pv:(Pa1+Pa2)*Math.sin(d)};
  const xq0=Math.max(c.xk,c.xbt), qL=P.qv&&P.q>0?Math.max(0,c.B-xq0)/1000:0, qW=P.q*qL, qX=(xq0/1000+B)/2;
  N.qW=qW; N.V=Ws+N.Pv+qW; N.Mr=Mw+N.Pv*B+qW*qX; N.Ph=N.Ph1+N.Ph2; N.Mo=N.Ph1*Hv/3+N.Ph2*Hv/2;
  slide(N,1);
  evalStab(N,B,P.mu,P.qa,{o:2.0,s:SL.Pp>0?2.0:1.5,e:6});
  const earthquake=signedKh=>{
  const we=wedgeMax(P,c,false,signedKh,pressureOpts);
  const E={Pae:we.Pa,th:we.th};   // 선택한 유사정적 해석 가정: 증가분은 수평, 작용점은 입력 옵션
  E.rawDP=we.Pa-Pa1; E.dP=Math.max(-Pa1*Math.cos(d),E.rawDP); E.eqd=P.eqd; E.Ph1=Pa1*Math.cos(d); E.Ph2=P.eqd==="d"?E.dP*Math.cos(d):E.dP; E.Paeh=E.Ph1+E.Ph2; E.Pv=(Pa1+(P.eqd==="d"?E.dP:0))*Math.sin(d);   // eqd=d: 증가분도 정적토압과 같은 작용각(경사 성토 표준도 외력표)
  E.inert=items.map(i=>({name:i.name,F:signedKh*i.W,z:i.z}));
  E.Fi=E.inert.reduce((s,i)=>s+i.F,0); E.Mi=E.inert.reduce((s,i)=>s+i.F*i.z,0);
  E.MoP=P.eqp==="split"?E.Ph1*Hv/3+E.Ph2*0.6*Hv:P.eqp==="h2"?E.Paeh*Hv/2:E.Paeh*0.6*Hv;   // 지진시 토압 모멘트 (기본: 작용면고의 0.6배)
  E.V=Ws+E.Pv; E.Mr=Mw+E.Pv*B; E.Ph=E.Ph1+E.Ph2+E.Fi; E.Mo=E.MoP+E.Mi;
  slide(E,Pa1>0?E.Paeh/Math.max(1e-9,E.Ph1):1);
  evalStab(E,B,P.mu,P.qa*P.fe,{o:1.5,s:1.2,e:3});
    E.wedge=we;return E;
  };
  const E=earthquake(P.kh),Eminus=earthquake(-P.kh);
  E.allOk=E.allOk&&Eminus.allOk;
  return {stemP,qW,qX,items,Ws,Mw,Pa1,Pa2,th1:ws.th,th2:wt.th,Kah,Kq,Hv,B,delta:d,N,E,Eminus,SL,wN:ws,wQ:wt,wE:E.wedge};
}
const AS={H13:126.7,H16:198.6,H19:286.5,H22:387.1,H25:506.7,H29:642.4,H32:794.2};
function clipHalf(poly,fn){ const out=[]; for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=fn(a),fb=fn(b);
  if(fa>=0) out.push(a); if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb); out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}} return out; }
function polyAC(p){ if(!p||p.length<3) return {A:0,x:0,z:0}; const A=area(p); if(A<1e-6) return {A:0,x:0,z:0}; const c=centroid(p); return {A,x:c[0],z:c[1]}; }
function secCheck(P,name,Mu,Vu,h,coverC,mark,face,ov={}){
 const b=1000,bar={...P.bar[mark]},db=BARS[bar.dia].d,As1=AS[bar.dia]*1000/bar.s,As=As1+(ov.addAs||0),d=h-coverC;
 const sEff=ov.addN?1000/(1000/bar.s+ov.addN):bar.s, cap=kdsSection(P,h,coverC,As),{fy,b1,a,c,et,etcl,ph,Mn,phMn,Ec,epscu,eta,etmin}=cap;
 const rhob=.85*eta*b1*P.fck/fy*epscu/(epscu+cap.ey),rhomax=.85*eta*b1*P.fck/fy*epscu/(epscu+etmin),Asmax=rhomax*b*d;
 let Asreq=0;
 if(Mu>0){
  if(kdsSection(P,h,coverC,Asmax).phMn<Mu)Asreq=Infinity;
  else{let lo=0,hi=Asmax;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(kdsSection(P,h,coverC,mid).phMn<Mu)lo=mid;else hi=mid;}Asreq=hi;}
 }
 const aReq=Number.isFinite(Asreq)?kdsSection(P,h,coverC,Math.max(Asreq,1e-8)).a:Infinity;
 const Mcr=cap.fr*b*h*h/6/1e6,slab=false;   // 저판 주철근도 보 기준 최소철근(1.2Mcr 또는 소요량 4/3) — 2008 표준도 설계기준 방식. 0.002bh 수축·온도철근은 배력·종방향(F3·F4) 구조세목에서 검토
 // 비인장측 구조철근과 최소 휨인장철근을 구분. 반올림 전 양의 모멘트는 제외하지 않는다.
 const nonTensionFace=ov.oppositeFace===true&&Mu===0&&(ov.Mo??0)===0;
 const minApplicable=!nonTensionFace;
 const AsminBase=slab?Math.min(kdsSlabRho(fy)*b*h,1800):0;
 const Asmin=minApplicable?AsminBase:0;
 const minRule0=nonTensionFace?"비인장측: 최소 휨철근 비적용; KDS 11 80 05 4.6.1(3)⑤ 반대측 주철근량 1/3 별도 검토":slab?"KDS 14 20 20 4.2.2(3), 14 20 50 4.6":"KDS 14 20 20 4.2.2(1)·(2)";
 const footMain=(mark==="F1"||mark==="F2"||mark==="FT"), footShr=footMain?Math.min(kdsSlabRho(fy)*b*h,1800):0;   // 저판 주철근: 보 기준(1.2Mcr·4/3) 또는 기초판 수축·온도철근량 중 하나를 만족하면 O.K
 const minOk=nonTensionFace|| (slab?As>=Asmin:phMn>=1.2*Mcr-1e-9||phMn>=4*Mu/3-1e-9||(footMain&&As>=footShr));
 const minRule=footMain&&!nonTensionFace?"저판 주철근: KDS 14 20 20 4.2.2(1)·(2) 보 기준(1.2Mcr 또는 소요량 4/3) 또는 수축·온도철근량 0.002bh 중 하나 (2008 표준도 방식)":minRule0;
 const rhomin=slab?Asmin/(b*d):null,rho=As/(b*d),rhoreq=Asreq/(b*d);
 // 전단강도 KDS 14 20 22 4.2.1: 간이식 (1/6)√fck·bw·d 와 상세식 (0.16√fck + 17.6ρw·Vu·d/Mu)·bw·d ≤ 0.29√fck·bw·d 중 큰 값 (λ=1)
 // 비인장측 단면은 같은 단면의 인장측 철근(ov.vAs)·모멘트(ov.vMu)로 계산
 const sqf=Math.min(Math.sqrt(P.fck),8.4), AsV=ov.vAs??As, MuV=ov.vMu??Mu, Vc1=sqf/6*b*d/1000;
 let Vc2=0, vRatio=0, rhoW=AsV/(b*d); if(MuV>0&&Vu>0){ vRatio=Math.min(1,Vu*d/1000/MuV); Vc2=Math.min((0.16*sqf+17.6*rhoW*vRatio)*b*d/1000,0.29*sqf*b*d/1000); }
 const phVcC=.75*Math.max(Vc1,Vc2), vMethod=Vc2>Vc1?"상세식":"간이식";
 // 전단철근 (KDS 14 20 22 4.3): 뒷굽 연결철근(ㄷ형)을 전단철근으로 계산 — 콘크리트만으로 부족할 때. Vs=Av·fy·d/s, s≤d/2(Vs>⅓√fck·bd이면 d/4), Vs≤⅔√fck·bd, Av≥Av,min
 let Vs=0, tieNote="", tie=ov.tie||null;
 if(tie&&tie.Av>0&&tie.s>0&&Vu>phVcC){ const VsRaw=tie.Av*fy*d/tie.s/1000, sLim=VsRaw>sqf/3*b*d/1000?Math.min(d/4,300):Math.min(d/2,600), Avmin=Math.max(0.0625*sqf*b*tie.s/fy,0.35*b*tie.s/fy);
   if(tie.s>sLim+1e-6) tieNote="연결철근 간격 "+fx(tie.s,0)+" > "+fx(sLim,0)+" mm — 전단철근 불인정";
   else if(tie.Av<Avmin) tieNote="연결철근 Av "+fx(tie.Av,1)+" < Av,min "+fx(Avmin,1)+" mm² — 전단철근 불인정";
   else { Vs=Math.min(VsRaw,2/3*sqf*b*d/1000); tieNote="연결철근 전단철근: Av="+fx(tie.Av,1)+" mm²/m, s="+fx(tie.s,0)+" mm, Vs="+fx(Vs,1)+" kN"; } }
 const phVc=phVcC+.75*Vs;   // φVn = φ(Vc+Vs)
 const n=2e5/Ec,nA=n*As/b,xN=-nA+nA*Math.sqrt(1+2*b*d/(n*As)),Mo=ov.Mo??Mu/1.6;
 const fs=Math.max(1,Mo*1e6/(As*(d-xN/3))),cc=coverC-db/2,kcr=210,s1=375*kcr/fs-2.5*cc,s2=300*kcr/fs,smax=Math.min(s1,s2),spacingMax=Math.min(3*h,450);
 const r={name,mark,face,dia:bar.dia,s:sEff,sMain:bar.s,ov,Mu,Vu,Mo,h,d,As,As1,Asreq,aReq,a,c,b1,et,etcl,ph,Mn,phMn,phVc,vMethod,Vc1,Vc2,vRatio,rhoW,phVcC,Vs,tieNote,fs,cc,s1,s2,smax,fy,n,xN,rho,rhoreq,rhomin,rhob,rhomax,eta,epscu,etmin,Ec,Mcr,slab,Asmin,AsminBase,minApplicable,minRule,nonTensionFace,spacingMax,steelStress:cap.fsu,
 ok:{m:phMn>=Mu,min:minOk,max:et>=etmin,v:phVc>=Vu,cr:sEff<=smax,spacing:sEff<=spacingMax}};
 r.footMain=footMain; r.footShr=footShr; r.allOk=Object.values(r.ok).every(Boolean);return r;
}
// 전체 지반반력과 국부 캔틸레버 구간에 동일한 전단키 자중 적용. 좌표 mm, A m², x m.
function footingKeyPart(P,G,a,b,ref){
 if(!G.hasKey||!(b>a))return null;
 const q=polyAC(clipHalf(clipHalf(G.key,pt=>pt[0]-a),pt=>b-pt[0]));
 if(q.A<=1e-9)return null;
 return {n:"⑦'",t:"전단키 자중 (해당 구간)",A:q.A/1e6,x:Math.abs(q.x-ref)/1000,g:P.gc};
}
function design(P,G,S,c){
  const m=v=>v/1000, gs=P.gs, gc=P.gc, kh=P.kh, hs=m(G.hs), phi=c.phi, B=S.B, N=S.N, E=S.E, dl=S.delta, Hv=S.Hv;
  /* ---- 전면벽(벽체) 토압: 벽체 배면(경사 θ)을 벽면으로 시행쐐기 ---- */
  const thw=Math.atan((c.xbb-c.xbt)/Math.max(1,G.hs)), dN=phi/3;
  const o={x0:c.xbb,z0:P.D,th:thw,zt:P.H};
  const w1=wedgeMax(P,c,false,0,{...o,d:dN}), w2=wedgeMax(P,c,true,0,{...o,d:dN}), w3=wedgeMax(P,c,false,kh,{...o,d:P.eqp==="split"?dN:0});
  const Ph=w1.Pa*Math.cos(dN+thw), Pv=w1.Pa*Math.sin(dN+thw), Pq=Math.max(0,w2.Pa-w1.Pa)*Math.cos(dN+thw);
  const wMinus=wedgeMax(P,c,false,-kh,{...o,d:P.eqp==="split"?dN:0});
  const PdMinus=Math.max(-Ph,P.eqp==="split"?wMinus.Pa-w1.Pa:wMinus.Pa*Math.cos(thw)-Ph);
  const Pd=P.eqp==="split"?Math.max(0,w3.Pa-w1.Pa):Math.max(0,w3.Pa*Math.cos(thw)-Ph), Pe=Ph+Pd, Pev=P.eqp==="split"?Pv:w3.Pa*Math.sin(thw);   // 동적분력은 수평
  const xfH=c.xf(P.H), xf0=c.xf(P.D), xbH=c.xbt, xb0=c.xbb;
  const parts=[{n:"①",poly:[[xfH,P.D],[xbH,P.D],[xbH,P.H],[xfH,P.H]]},{n:"②",poly:[[xf0,P.D],[xfH,P.D],[xfH,P.H],...(P.hh>0?[[xf0,P.D+P.hh]]:[])]},{n:"③",poly:[[xbH,P.D],[xb0,P.D],[xbH,P.H]]}]
    .filter(p=>area(p.poly)>1);
  const stemSec=(y,name)=>{ const r=hs>0?y/hs:0, zs=P.H-y*1000;
    const Vs=Ph*r*r, Ms=Vs*y/3, Vq=Pq*r, Mq=Vq*y/2, Ve=Pe*r*r, Vd=Math.max(0,Ve-Vs);
    const Me=P.eqp==="split"?Ms+Vd*0.6*y:Ve*y*(P.eqp==="h2"?0.5:0.6), Md=Math.max(0,Me-Ms);
    const inert=parts.map(p=>{const q=polyAC(clipHalf(p.poly,pt=>pt[1]-zs)); const W=gc*q.A/1e6; return {n:p.n,W,F:kh*W,y:(q.z-zs)/1000};}).filter(i=>i.W>1e-9);
    const Vi=P.stin?inert.reduce((a,i)=>a+i.F,0):0, Mi=P.stin?inert.reduce((a,i)=>a+i.F*i.y,0):0;
    const negVd=PdMinus*r*r, negVe=Vs+negVd;
    const negMe=P.eqp==="split"?Ms+negVd*.6*y:negVe*y*(P.eqp==="h2"?.5:.6),negMd=negMe-Ms;
    const CASES=kdsLoadCases().filter(L=>!L.service).map(L=>({...L,
      V:L.fH*Vs+L.fL*Vq+Math.abs(L.fE)*(L.fE<0?negVd-Vi:Vd+Vi),
      M:L.fH*Ms+L.fL*Mq+Math.abs(L.fE)*(L.fE<0?negMd-Mi:Md+Mi)}));
    const L1=CASES[0],L2=CASES.filter(L=>L.fE!==0).reduce((a,b)=>a.M>=b.M?a:b),L3={V:Vs+Vq,M:Ms+Mq};
    return {name,y,r,Vs,Ms,Vq,Mq,Vd,Md,Ve,Me,inert,Vi,Mi,L1,L2,L3,CASES,Mu:Math.max(0,...CASES.map(L=>L.M)),MuFront:Math.max(0,...CASES.map(L=>-L.M)),Vu:Math.max(...CASES.map(L=>Math.abs(L.V))),Mo:L3.M,t:P.t1+(P.t2-P.t1)*r}; };
  const A=k=>AS[P.bar[k].dia]*1000/P.bar[k].s;
  const has8=P.bar.W8.s>0&&P.cutW8>0&&P.cutW8<G.hs;
  const comb=has8?{addAs:A("W8"),addN:1000/P.bar.W8.s}:{};
  const bot=stemSec(hs,"벽체하단"), mid=stemSec(hs/2,"벽체중앙");
  const sW=secCheck(P,"벽체 하단",bot.Mu,bot.Vu,P.t2,P.cw,"W1","배면",{...comb,Mo:bot.Mo}); sW.load=bot; sW.kind="stem";
  const sMd=secCheck(P,"벽체 중앙",mid.Mu,mid.Vu,mid.t,P.cw,"W1","배면",{Mo:mid.Mo}); sMd.load=mid; sMd.kind="stemmid";   // H/2: W1만 유효
  let sC=null;
  if(has8&&P.cutW8<G.hs/2-1){ const cut=stemSec(hs-m(P.cutW8),"벽체단절부");
    sC=secCheck(P,"벽체 단절부",cut.Mu,cut.Vu,cut.t,P.cw,"W1","배면",{Mo:cut.Mo}); sC.load=cut; sC.kind="stemcut"; }
  /* ---- 기초 지반반력 (하중조합) ---- */
  const Pv1=S.Pa1*Math.sin(dl), Pvd=0, MoS=N.Ph1*Hv/3, MoQ=N.Ph2*Hv/2, MoD=E.MoP-N.Ph1*Hv/3;
  const qW=S.qW||0, qX=S.qX||0;
  const weighted=(soil)=>S.items.filter(i=>i.name.includes("흙")===soil).reduce((a,i)=>({W:a.W+i.W,M:a.M+i.W*i.x}),{W:0,M:0});
  const concrete=weighted(false), retained=weighted(true);
  const fullQL=Math.max(0,B-Math.max(c.xk,c.xbt)/1000),designQW=P.q*fullQL,designQX=(Math.max(c.xk,c.xbt)/1000+B)/2;
  const LC=kdsLoadCases().map(L=>{
    const EQ=L.fE<0?S.Eminus:E,pv=L.fHv*Pv1+L.fL*(N.Pv-Pv1);
    return {...L,V:L.fD*concrete.W+L.fHv*retained.W+L.fL*designQW+pv,
      Mr:L.fD*concrete.M+L.fHv*retained.M+L.fL*designQW*designQX+pv*B,
      Mo:L.fH*MoS+L.fL*MoQ+Math.abs(L.fE)*(EQ.MoP-MoS+EQ.Mi),pv,alphaH:1};
  });
  LC.forEach(L=>{
    L.valid=Number.isFinite(L.V)&&L.V>0&&Number.isFinite(L.Mr-L.Mo)&&Math.abs(B/2-(L.Mr-L.Mo)/L.V)<B/2;
    if(!L.valid){L.e=B/2;L.tri=true;L.Lc=0;L.qmax=Infinity;L.qmin=0;L.q=()=>0;L.R=()=>({V:0,M:0});return;}
    L.e=B/2-(L.Mr-L.Mo)/L.V; const ae=Math.abs(L.e); L.tri=ae>B/6; L.Lc=L.tri?3*(B/2-ae):B;
    L.qmax=L.tri?2*L.V/L.Lc:L.V/B*(1+6*ae/B); L.qmin=L.tri?0:L.V/B*(1-6*ae/B);
    L.q=x=>{const xx=L.e>=0?x:B-x; return L.tri?(xx<L.Lc?L.qmax*(1-xx/L.Lc):0):L.qmax+(L.qmin-L.qmax)*xx/B;};
    L.R=(a,b,ref)=>{const n=400,h=(b-a)/n;let V=0,M=0;for(let i=0;i<n;i++){const x=a+(i+0.5)*h,q=L.q(x);V+=q*h;M+=q*h*Math.abs(x-ref);}return {V,M};}; });
  const xbb=m(c.xbb), B1=m(P.B1);
  /* ---- 뒷굽 ---- */
  let sH=null, heel=null;
  if(P.B3>0){
    const D=m(P.D), D2=m(P.D2??P.D), Hm=m(P.H), L3=B-xbb, conc=[], soil=[];
    if(D2<D) conc.push({n:"⑤'",t:`${fx(D-D2,3)} × ${fx(L3,3)} × ½`,A:(D-D2)*L3/2,x:L3/3,g:gc});
    conc.push({n:"⑥'",t:`${fx(D2,3)} × ${fx(L3,3)}`,A:D2*L3,x:L3/2,g:gc});
    const heelKey=footingKeyPart(P,G,c.xbb,G.B,c.xbb);if(heelKey)conc.push(heelKey);
    soil.push({n:"ⓑ",t:`${fx(Hm-D,3)} × ${fx(L3,3)}`,A:(Hm-D)*L3,x:L3/2,g:gs});
    if(D2<D) soil.push({n:"ⓒ",t:`${fx(D-D2,3)} × ${fx(L3,3)} × ½`,A:(D-D2)*L3/2,x:2*L3/3,g:gs});
    const top=polyAC(clipHalf(clipHalf(heelSoilPoly(P,c),pt=>pt[1]-P.H),pt=>pt[0]-c.xbb));
    if(top.A>1) soil.push({n:"ⓓ",t:"성토부 (다각형)",A:top.A/1e6,x:m(top.x)-xbb,g:gs});
    [...conc,...soil].forEach(p=>{p.W=p.A*p.g;p.M=p.W*p.x;});
    const sum=a=>({W:a.reduce((s,p)=>s+p.W,0),M:a.reduce((s,p)=>s+p.M,0)}), Dc=sum(conc), Ds=sum(soil), Dt={W:Dc.W+Ds.W,M:Dc.M+Ds.M};
    const xq0=Math.max(m(c.xk),m(c.xbt),xbb), Lq=P.q>0?Math.max(0,B-xq0):0, WL=P.q*Lq, ML=WL*((xq0+B)/2-xbb);
    const rows=LC.map(L=>{ const R=L.R(xbb,B,xbb), pvF=P.hpv?L.pv:0;
      const V=L.fD*Dc.W+L.fHv*Ds.W+L.fL*WL+pvF-R.V;
      const rawM=L.fD*Dc.M+L.fHv*Ds.M+L.fL*ML+pvF*L3-R.M;
      const wallM=L.service?bot.L3.M:(bot.CASES.find(k=>k.n===L.n)||{}).M;
      const M=rawM>0?Math.min(rawM,Math.max(0,wallM??rawM)):rawM;
      return {L,R,V,M,rawM,wallM,capped:M!==rawM,dV:L.fD*Dc.W+L.fHv*Ds.W,dM:L.fD*Dc.M+L.fHv*Ds.M,lV:L.fL*WL,lM:L.fL*ML,hV:pvF,hM:pvF*L3,q2:L.q(xbb),q3:L.q(B)}; });
    const envelope=momentEnvelope(rows.filter(r=>!r.L.service).map(r=>r.M)), Mtop=envelope.top, Mbottom=momentEnvelope(rows.filter(r=>!r.L.service&&r.L.fHv>0).map(r=>r.M)).bottom, Mmax=Mtop, top_=Mtop>=Mbottom;   // 뒷굽 하면 인장: 뒷굽 위 흙을 뺀 조합(1.4D 등, 흙 연직하중계수 0)은 실제로 생길 수 없는 상태라 제외
    let Mu=top_?Mtop:Mbottom, Mo=Math.abs(rows[2].M);
    const Vu=Math.max(...rows.filter(r=>!r.L.service).map(r=>Math.abs(r.V)));
    const joint=true, McalcU=Math.max(...rows.filter(r=>!r.L.service).map(r=>Math.abs(r.rawM))), McalcO=Math.abs(rows[2].rawM);
    // KDS 11 80 05 4.6.1(3)⑧: 양의 연결부 모멘트는 동일 하중조합 벽체 모멘트로 상한 적용
    heel={conc,soil,Dc,Ds,Dt,WL,ML,Lq,rows,Mu,Vu,Mo,joint,McalcU,McalcO,L:L3};
    const tAdd=P.wtype==="T"&&P.bar.FT?{addAs:AS[P.bar.FT.dia]*1000/P.bar.FT.s,addN:1000/P.bar.FT.s}:{};   // 역T형: 뒷굽 상면 = F2(뒷굽용)+F3(전체)
    const tie=P.bar.F5&&P.bar.F5.s>0?{Av:2*AS[P.bar.F5.dia]*1000/P.bar.F5.s,s:(P.tieDense?1:2)*P.bar.F3.s}:null;   // 뒷굽 연결철근: ㄷ형 다리 2개 × (1000/연장방향 간격), 단면방향 간격 = 하부 배력근 간격 × (1 또는 2)
    const topCheck=secCheck(P,"뒷굽 상면",Mtop,Vu,P.D,P.cf,"F1","상면",{Mo:Math.max(0,rows[2].M),...tAdd,tie});
    const bottomCheck=secCheck(P,"뒷굽 하면",Mbottom,Vu,P.D,P.cf,"F2","하면",{Mo:Math.max(0,-rows[2].M),oppositeFace:true,vAs:topCheck.As,vMu:Mtop,tie});
    topCheck.kind="heel";bottomCheck.kind="heelbottom";
    topCheck.load=heel;bottomCheck.load=heel;
    sH=topCheck;heel.bottomCheck=bottomCheck;heel.Mtop=Mtop;heel.Mbottom=Mbottom;
  }
  /* ---- 앞굽 ---- */
  let sT=null, toe=null;
  if(P.B1>0){
    const D=m(P.D), D1=m(P.D1??P.D), conc=D1<D?[{n:"⑦'",t:`${fx(D1,3)} × ${fx(B1,3)}`,A:D1*B1,x:B1/2,g:gc},{n:"⑧'",t:`${fx(D-D1,3)} × ${fx(B1,3)} × ½`,A:(D-D1)*B1/2,x:B1/3,g:gc}]:[{n:"⑦'",t:`${fx(D,3)} × ${fx(B1,3)}`,A:D*B1,x:B1/2,g:gc}], soil=[];
    // KDS 11 80 05 4.6.1(3)③: 앞판 자중과 지반반력
    [...conc,...soil].forEach(p=>{p.W=p.A*p.g;p.M=p.W*p.x;});
    const toeKey=footingKeyPart(P,G,0,P.B1,P.B1);if(toeKey){toeKey.W=toeKey.A*gc;toeKey.M=toeKey.W*toeKey.x;conc.push(toeKey);}
    const Dt={W:[...conc,...soil].reduce((s,p)=>s+p.W,0),M:[...conc,...soil].reduce((s,p)=>s+p.M,0)};
    const dT=m(P.D-P.cf), xv=Math.max(0,B1-dT);   // 전단 검토: 접속부에서 d 떨어진 단면
    const rows=LC.map(L=>{const R=L.R(0,B1,B1), Rv=L.R(0,xv,xv), tv=D1+(D-D1)*xv/Math.max(B1,1e-9), wc=gc*(D1+tv)/2,keyV=footingKeyPart(P,G,0,xv*1000,xv*1000); return {L,R,V:Rv.V-L.fD*(wc*xv+(keyV?keyV.A*gc:0)),M:R.M-L.fD*Dt.M,dV:L.fD*(wc*xv+(keyV?keyV.A*gc:0)),dM:L.fD*Dt.M,q1:L.q(0),q2:L.q(B1),xv};});
    const Mu=Math.max(0,...rows.filter(r=>!r.L.service).map(r=>r.M)), MuTop=Math.max(0,...rows.filter(r=>!r.L.service).map(r=>-r.M)), Vu=Math.max(...rows.filter(r=>!r.L.service).map(r=>Math.abs(r.V))), Mo=Math.abs(rows[2].M);
    toe={conc,soil,Dt,rows,Mu,Vu,Mo,L:B1};
    sT=secCheck(P,"앞굽",Mu,Vu,P.D,P.cf,"F2","하면",{Mo}); sT.load=toe; sT.kind="toe";
    const topCheck=secCheck(P,"앞굽 상면",MuTop,Vu,P.D,P.cf,P.wtype==="T"&&P.bar.FT?"FT":"F1","상면",{Mo:Math.max(0,-rows[2].M),oppositeFace:true,vAs:sT.As,vMu:Mu});   // 역T형: 앞굽 상면은 F3(전체)만
    topCheck.kind="toetop";topCheck.load=toe;toe.topCheck=topCheck;
  }
  const sWF=secCheck(P,"벽체 하단 전면",bot.MuFront,bot.Vu,P.t2,P.cw,"W2","전면",{Mo:Math.max(0,-bot.Mo),vAs:sW.As,vMu:bot.Mu});
  sWF.kind="stemfront";sWF.load=bot;
  const sMF=secCheck(P,"벽체 중앙 전면",mid.MuFront,mid.Vu,mid.t,P.cw,"W2","전면",{Mo:Math.max(0,-mid.Mo),vAs:sMd.As,vMu:mid.Mu});
  sMF.kind="stemmidfront";sMF.load=mid;
  const out=[sW,sMd,sWF,sMF,...(sC?[sC]:[]),...(sT?[sT,sT.load.topCheck]:[]),...(sH?[sH,sH.load.bottomCheck]:[])];
  if(G.hasKey&&P.bar.K1){
    const hk=m(P.hk), SL=S.SL, p1=SL.p1, p2=SL.p2, Pp=0.5*(p1+p2)*hk, yk=hk*(p1+2*p2)/(3*(p1+p2)||1);   // yk: 키 상단(저판 저면)에서 합력까지 거리
    const kMo=Pp*yk, kMu=1.6*kMo, kVu=1.6*Pp;
    const sK=secCheck(P,"전단키",kMu,kVu,P.bk,P.ck,"K1","전면",{Mo:kMo});
    sK.load={Pp,hk,Kp:SL.Kp,p1,p2,yk,zt:SL.zt}; sK.kind="key"; out.push(sK);
  }
  out.meta={stemSec,w1,w2,w3,Ph,Pv,Pq,Pe,Pev,Pd,dN,thw,parts,LC,bot,mid,heel,toe,MoS,MoQ,MoD,Pv1,Pvd};
  return out;
}
function area(p){let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1];}return Math.abs(s)/2;}
function centroid(p){let A=0,cx=0,cy=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],c=a[0]*b[1]-b[0]*a[1];A+=c;cx+=(a[0]+b[0])*c;cy+=(a[1]+b[1])*c;}A/=2;return [cx/(6*A),cy/(6*A)];}
