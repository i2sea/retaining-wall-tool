"use strict";
/* 옹벽 설계도구 · 표 · 요약 · 엑셀 · 구조계산서(화면·워드) */
/* ---------- 표 ---------- */
const SHAPE={
  I:(r)=>`<svg viewBox="0 0 120 46"><line x1="12" y1="24" x2="108" y2="24" stroke="var(--rebar)" stroke-width="2.5"/><text x="60" y="16" font-size="10" text-anchor="middle" fill="var(--muted)">a</text></svg>`,
  L:(r)=>`<svg viewBox="0 0 120 46"><polyline points="30,6 30,34 100,34" fill="none" stroke="var(--rebar)" stroke-width="2.5"/><text x="22" y="22" font-size="10" text-anchor="middle" fill="var(--muted)">a</text><text x="65" y="45" font-size="10" text-anchor="middle" fill="var(--muted)">b</text></svg>`,
  U:(r)=>`<svg viewBox="0 0 120 46"><polyline points="14,30 14,12 106,12 106,30" fill="none" stroke="var(--rebar)" stroke-width="2.5"/><text x="60" y="9" font-size="10" text-anchor="middle" fill="var(--muted)">a</text><text x="6" y="26" font-size="10" fill="var(--muted)">b</text><text x="110" y="26" font-size="10" fill="var(--muted)">b</text></svg>`};
SHAPE.U2=(r)=>`<svg viewBox="0 0 120 46"><polyline points="4,8 32,8 32,36 88,36 88,8 116,8" fill="none" stroke="var(--rebar)" stroke-width="2.5"/><text x="60" y="46" font-size="10" text-anchor="middle" fill="var(--muted)">a</text><text x="24" y="26" font-size="10" fill="var(--muted)">b</text><text x="92" y="26" font-size="10" fill="var(--muted)">b</text><text x="16" y="6" font-size="10" text-anchor="middle" fill="var(--muted)">c</text><text x="104" y="6" font-size="10" text-anchor="middle" fill="var(--muted)">c</text></svg>`;
function shapeSVG(pts,real,opts={}){ // 개략 형상: 방향은 실제, 길이는 압축(짧은 구간도 보이게), 구간 길이 표기. real이 있으면 pts는 모식 비율 그대로, 숫자는 real 길이
  const W=opts.width||180,Hh=opts.height||70,pad=opts.pad||18;
  const segs=[];for(let i=0;i<pts.length-1;i++){const dx=pts[i+1][0]-pts[i][0],dy=pts[i+1][1]-pts[i][1];segs.push({L:Math.hypot(dx,dy),ux:dx,uy:dy});}
  if(real) segs.forEach((g,i)=>{g.D=g.L; g.L=Math.hypot(real[i+1][0]-real[i][0],real[i+1][1]-real[i][1]);});
  const Lmax=Math.max(...segs.map(g=>g.L));
  let q=[[0,0]];segs.forEach(g=>{const l=real?g.D:12+40*Math.sqrt(g.L/Lmax),n=(real?g.D:g.L)||1;const p=q[q.length-1];q.push([p[0]+g.ux/n*l,p[1]+g.uy/n*l]);});
  const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const k=Math.min((W-2*pad)/Math.max(x1-x0,1e-6),(Hh-2*pad)/Math.max(y1-y0,1e-6));
  const ox=(W-(x1-x0)*k)/2, oy=(Hh-(y1-y0)*k)/2;
  const P=q.map(([x,y])=>[ox+(x-x0)*k,Hh-oy-(y-y0)*k]), cy=Hh/2, cx=W/2;
  let t=`<svg viewBox="0 0 ${W} ${Hh}" style="width:${W}px;height:${Hh}px"><polyline points="${P.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="var(--rebar)" stroke-width="2.2" stroke-linejoin="round"/>`;
  segs.forEach((g,i)=>{const a=P[i],b=P[i+1],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,vert=Math.abs(b[0]-a[0])<Math.abs(b[1]-a[1]);
    let tx,ty,an;
    if(vert){an=mx<cx?"end":"start";tx=mx+(mx<cx?-4:4);ty=my+3;}
    else{an="middle";tx=mx;ty=my<=cy?my-4:my+11;}
    t+=`<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="9.5" font-family="IBM Plex Mono,monospace" fill="var(--ink)" text-anchor="${an}">${Math.round(g.L).toLocaleString("ko-KR")}</text>`;});
  return t+"</svg>";
}
const TYPEK={I:"직선",L:"ㄱ형",L3:"절곡+갈고리",U:"ㄷ형",U2:"ㄷ형+조립"};
function assemblyPieceInfo(r,R){
 const b=R.bars.find(b=>b.m===r.m);
 if(r.m!=="F1"||!b||!(b.c>1))return {left:0,right:0};
 return {left:b.c,right:b.c};
}
function f2AssemblySVG(r,R){
 const b=R.bars.find(b=>b.m===r.m),info=assemblyPieceInfo(r,R),real=r.cutPts;
 // 원래 F2의 모식 선분을 따라 분할점을 보간하여 분할 후에도 조립부 비율을 유지한다.
 const src=b.pts,disp=b.disp||src;
 const mapped=real.map(p=>{let best=null;for(let i=0;i<src.length-1;i++){const a=src[i],z=src[i+1],dx=z[0]-a[0],dy=z[1]-a[1],den=dx*dx+dy*dy;if(den<1e-12)continue;const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)),d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(!best||d<best.d)best={d,q:[disp[i][0]+t*(disp[i+1][0]-disp[i][0]),disp[i][1]+t*(disp[i+1][1]-disp[i][1])]};}return best?.q||p;});
 const W=260,H=116,padX=40,padY=24,xx=mapped.map(p=>p[0]),yy=mapped.map(p=>p[1]),xmin=Math.min(...xx),xmax=Math.max(...xx),ymin=Math.min(...yy),ymax=Math.max(...yy),scale=Math.min((W-2*padX)/Math.max(1e-8,xmax-xmin),(H-2*padY-20)/Math.max(1e-8,ymax-ymin));
 const ox=(W-(xmax-xmin)*scale)/2,oy=(H-20-(ymax-ymin)*scale)/2;
 const pts=mapped.map(p=>[ox+(p[0]-xmin)*scale,H-20-oy-(p[1]-ymin)*scale]);
 const label=(x,y,t,fill="var(--ink)")=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-family="sans-serif" font-size="11" fill="'+fill+'">'+t+'</text>';
 let svg='<svg data-f2-assembly="20261021-2" viewBox="0 0 '+W+' '+H+'" style="width:'+W+'px;height:'+H+'px" role="img" aria-label="F2 조립부분 상세"><polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="var(--rebar)" stroke-width="2.5" stroke-linejoin="round"/>';
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],z=pts[i+1],L=Math.hypot(real[i+1][0]-real[i][0],real[i+1][1]-real[i][1]);
  if((i===0&&info.left)||(i===pts.length-2&&info.right))continue;
  const mx=(a[0]+z[0])/2,my=(a[1]+z[1])/2,vertical=Math.abs(z[1]-a[1])>Math.abs(z[0]-a[0]);svg+=label(mx+(vertical?(mx<W/2?-20:20):0),my+(vertical?4:-7),Math.round(L).toLocaleString('ko-KR'));
 }
 if(info.left){const a=pts[0],z=pts[1];svg+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+z[0]+'" y2="'+z[1]+'" stroke="var(--rebar)" stroke-width="4"/>'+label((a[0]+z[0])/2,Math.max(a[1],z[1])+20,String(Math.round(info.left)),'#000');}
 if(info.right){const a=pts[pts.length-2],z=pts[pts.length-1];svg+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+z[0]+'" y2="'+z[1]+'" stroke="var(--rebar)" stroke-width="4"/>'+label((a[0]+z[0])/2,Math.max(a[1],z[1])+20,String(Math.round(info.right)),'#000');}
 return svg+'</svg>';
}

function cutShapeSVG(r,R){
 if(r.m==="F1"&&R.P.wtype!=="T")return f2AssemblySVG(r,R);   // 역T형 F2(뒷굽용)는 일반 형상으로
 if(["W1","W8","W2"].includes(r.m))return shapeSVG(r.cutPts,null,{width:240,height:128,pad:27});
 const bar=R.bars.find(b=>b.m===r.m);
 // 미분할 형상은 기존 모식 비율을 사용하고 치수는 실제 가공선에서 읽는다.
 if(!r.pieceNo&&bar?.disp&&bar.disp.length===r.cutPts.length)return shapeSVG(bar.disp,r.cutPts);
 // 분할 조각은 실제 비율 유지: 개별 선분 압축으로 갈고리끼리 겹치지 않게 한다.
 return shapeSVG(r.cutPts,r.cutPts);
}

function continuousUnitData(R){setWT(R);
 const stock=R.P.stockLen*1000;
 return R.sched.filter(r=>r.long).map(r=>{const effective=stock-r.lapMM,mm=effective>0?1000*stock/effective:null,n=r.nAll;
 return {mark:DM(r.m),dia:r.dia,base:1000,lap:r.lapMM,stock,effective,mm,n,totalM:mm==null?null:mm/1000*n,kg:mm==null?null:mm/1000*n*r.w,formula:effective>0?"1000 + "+r.lapMM+" / ("+fx(R.P.stockLen,3)+" - "+fx(r.lapMM/1000,3)+")":"정척≤이음길이: 연속 환산 불가"};});
}
function continuousUnitRows(R){return continuousUnitData(R).map(u=>[u.mark,u.dia,u.base,u.lap,u.formula,u.mm==null?"불가":fx(u.mm,2),u.n,u.totalM==null?"불가":fx(u.totalM,3),u.kg==null?"불가":fx(u.kg,3)]);}

function processingRows(R){setWT(R);
 const cuts=materialPieces(R),units=continuousUnitData(R);
 return R.sched.flatMap(base=>{if(base.long){const u=units.find(u=>u.mark===DM(base.m));return [{mark:DM(base.m),dia:base.dia,continuous:true,lenMM:u.mm,count:u.n,totalM:u.totalM,kg:u.kg,formula:u.formula,bar:base}];}
 return cuts.filter(p=>p.m===base.m).map(p=>({mark:materialMark(p),dia:p.dia,continuous:false,lenMM:p.len*1000,count:p.perM,totalM:p.lenM,kg:p.kgM,formula:p.joints?fx(p.baseMM,0)+" + 이음 "+fx(p.lapMM,0)+(p.joints>1?" × "+p.joints:""):"",bar:p}));});
}
function processingShape(row,R){
 if(!row.continuous)return cutShapeSVG(row.bar,R)+(row.bar.joints?'<div style="font-size:11px;white-space:nowrap">이음길이 '+fx(row.bar.lapMM,0)+' mm'+(row.bar.joints>1?' × '+row.bar.joints+'개소':'')+' 포함 (= '+esc(row.formula)+')</div>':'');
 return shapeSVG([[0,0],[1000,0]],[[0,0],[1000,0]])+'<div style="font-size:11px;white-space:nowrap">'+esc(row.formula)+' = '+(row.lenMM==null?'불가':fx(row.lenMM,0))+' mm/m</div>';
}

function renderTables(R){setWT(R);
  const {P,sched,byDia,Q,S}=R, ls=1+P.loss/100;
  const dias=Object.keys(BARS).filter(k=>byDia[k]);
  const cols=["기호","위치","규격","배치 줄수","줄당 절단길이 (m)","이음길이 (mm)","전체 이음수","절단 본수","전체길이 (m)","이음·올림 추가 (m)","중량 (kg/m)","전체 중량 (kg)"];
  let h='<h3>철근재료표 · 정척 '+P.stockLen+' m / 연장 '+P.L+' m</h3><table><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>';
  sched.forEach(r=>{h+='<tr>'+[DM(r.m),r.desc,r.dia,r.nAll,r.stockPlan.pieces.map(p=>fx(p.len/1000,3)).join(' + '),r.spliceCount?r.lapMM:'-',r.spliceCount,r.pieceCount,fx(r.totalLen,3),fx(r.addLen,3),fx(r.kgM,0),fx(r.kgAll,0)].map(v=>'<td>'+esc(String(v))+'</td>').join('')+'</tr>';});
  const tkM=Object.values(byDia).reduce((s,v)=>s+v.kgM,0),tkA=Object.values(byDia).reduce((s,v)=>s+v.kgAll,0);
  h+='</tbody></table><p><b>합계 '+fx(tkM,0)+' kg/m / '+fx(tkA,0)+' kg · 할증 '+P.loss+'% 포함 '+fx(tkA*ls,0)+' kg</b></p><p class="note">'+esc(stockNote(P))+'</p>';
  h+='<h3>정척 원철근 반입계획</h3><table><thead><tr>'+["규격","원철근 본수","가공길이 m","정척 총길이 m","잔재 m","가공중량 kg","반입중량 kg","할증 포함 원철근 본수"].map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+purchaseRows(R).map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  $("tblSched").innerHTML=h;
  let b='<h3>철근 가공조립표 · 1m당</h3><table><thead><tr>'+["기호","규격","절단형상","길이 (mm)","수량 (본/m)","총길이 (m/m)","중량 (kg/m)"].map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>';
  processingRows(R).forEach(row=>{b+='<tr><td>'+row.mark+'</td><td>'+row.dia+'</td><td class="shape">'+processingShape(row,R)+'</td><td>'+(row.lenMM==null?'불가':fx(row.lenMM,0))+'</td><td>'+fx(row.count,2).replace(/(\.\d*?)0+$/,"$1").replace(/\.$/,"")+'</td><td>'+(row.totalM==null?'불가':fx(row.totalM,3))+'</td><td>'+(row.kg==null?'불가':fx(row.kg,0))+'</td></tr>';});
  b+='</tbody></table><p class="note">연속철근도 같은 표에 표시합니다. 직선 기본길이1000mm에 정척 이음 환산식을 적용하며, 길이·수량·중량은1m 기준입니다. 꺾임 형상은 식별용 모식 비율이며 치수 숫자가 실제 가공치수입니다. 실제 연장별 절단 본수와 반입 물량은 철근재료표에 표시합니다.</p>';
  $("tblBend").innerHTML=b;
  // 수량산출서
  const rows=qtyRows(R);
  let q=`<h3>${P.wname} 옹벽 단위수량산출서 <small style="font-weight:400;color:var(--muted)">H = ${fx(P.H/1000,1)} m · 1m당</small></h3><div class="tblwrap"><table class="qtab"><thead><tr><th>구분</th><th colspan="2">내용</th><th>수량</th><th>단위</th><th>할증 후</th><th>비고</th></tr></thead><tbody>`;
  rows.items.forEach((it,n)=>{const L=it.lines.length?it.lines:[["","-","",null]], dec=it.dec||3;
    L.forEach((ln,k)=>{q+=`<tr class="${k===0?"qtop":""}">${k===0?`<td class="l" rowspan="${L.length}"><b>${n+1}. ${it.name}</b>${it.spec?`<br><small>${esc(it.spec)}</small>`:""}</td>`:""}<td class="l" style="white-space:nowrap">${ln[0]?`${ln[0]} `:""}${ln[1]}${ln[2]?`<br><small style="color:var(--muted)">${ln[2]}</small>`:""}</td><td class="n">${ln[3]!=null&&L.length>1&&!it.split?`= ${fx(ln[3],dec===3&&it.unit==="ton"?3:2)}`:""}</td>${it.split?`<td class="n"><b>${fx(ln[3],dec)}</b></td><td>${it.unit}</td>`:""}${k===0?`${it.split?"":`<td class="n" rowspan="${L.length}"><b>${it.qty>0?fx(it.qty,dec):"-"}</b></td><td rowspan="${L.length}">${it.unit}</td>`}<td class="n" rowspan="${L.length}">${it.qL!=null&&it.qty>0?`${fx(it.qL,dec)}<br><small>${it.loss}% 할증</small>`:""}</td><td class="l" rowspan="${L.length}">${it.note?esc(it.note):""}</td>`:""}</tr>`;});});
  q+=`</tbody></table></div><p class="note">배수공은 높이 2m 미만도 산출하며, 드레인보드·부직포·비계의 기존 수량 조건은 H ≥ 2.0m입니다. 물구멍 배면 면적 ${P.drainArea} m²/개, 드레인보드 상부공제 0.50 m·하부공제 0.10 m, 문양거푸집 상부공제 0.25 m·하부추가 0.30 m, 비계 상부공제 0.50 m 기준입니다. 각 항목은 소수 둘째 자리(철근은 셋째 자리)에서 반올림해 합산했습니다.</p>`;
  $("tblQty").innerHTML=q;
  $("tblStab").innerHTML=renderBlocks(report(R).filter(b=>b.sec===3&&b.k!=="fig"),R);
  $("stressPane").innerHTML=renderBlocks(report(R).filter(b=>b.k==="fig"&&["pN","pE","fL","fLE","qF","mv","cap"].includes(b.kind)),R);
  $("report").innerHTML=renderBlocks(report(R),R);
}
function qtyRows(R){setWT(R);
  // 단위수량산출서 (1m당) — 실무 양식: 레미콘·거푸집·철근가공조립·물구멍·드레인보드·부직포·비계·스페이스
  const {P,G,Q,byDia}=R, r2=v=>Math.round(v*100)/100, f2=v=>fx(v,2);
  const H=P.H/1000, hs=G.hs/1000, t1=P.t1/1000, t2=P.t2/1000, B=G.B/1000, D=P.D/1000, D2=(P.D2??P.D)/1000, Df=P.Df/1000, lv=P.lev/1000;
  const bk=P.bk/1000, hk=P.hk/1000, key=G.hasKey, big=H>=2.0;
  const items=[];
  const add=(name,spec,lines,qty,unit,loss,note)=>items.push({name,spec,lines,qty:r2(qty),unit,loss,qL:loss?r2(r2(qty)*(1+loss/100)):null,note});
  // 1. 레미콘 (구조물)
  const c1=r2((t1+t2)/2*hs), c2=r2(Q.cFoot), c3=key?r2(bk*hk):0;
  add("레미콘",`25-${P.fck}-15`,[
    ["①",`( ${f2(t1)} + ${f2(t2)} ) / 2 × ${f2(hs)}`,"상부폭 · 하부폭 · 높이",c1],
    ["②",(()=>{const D1=(P.D1??P.D)/1000, B1=P.B1/1000, L3=B-B1-t2; if(D2>=D&&D1>=D) return `${f2(B)} × ${f2(D)}`;
      const p=[]; if(B1>0) p.push(D1<D?`( ${f2(D1)} + ${f2(D)} ) / 2 × ${f2(B1)}`:`${f2(D)} × ${f2(B1)}`); p.push(`${f2(D)} × ${f2(t2)}`); if(L3>0) p.push(D2<D?`( ${f2(D)} + ${f2(D2)} ) / 2 × ${f2(L3)}`:`${f2(D)} × ${f2(L3)}`); return p.join(" + ");})(),
      (D2<D||(P.D1??P.D)<P.D)?"앞굽 · 벽체 아래 · 뒷굽 (끝 두께 반영)":"저판길이 · 두께",c2],
    ...(key?[["③",`${f2(bk)} × ${f2(hk)}`,"키 폭 · 높이",c3]]:[])],c1+c2+c3,"m³",1,"");
  // 2. 레미콘 (버림)
  { const lf=key?r2((B+2*lv-bk)*lv):r2((B+2*lv)*lv), lk=key?r2(bk*lv):0;
    add("레미콘","25-18-08",key?[["①",`( ${f2(B)} + ${f2(lv)} × 2 EA − ${f2(bk)} ) × ${f2(lv)}`,"기초 하부 (저판길이 · 여유폭 · 키 폭 · 두께)",lf],["②",`${f2(bk)} × ${f2(lv)}`,"키 바닥 (키 폭 · 두께)",lk]]
      :[["",`( ${f2(B)} + ${f2(lv)} × 2 EA ) × ${f2(lv)}`,"기초 하부 (저판길이 · 여유폭 · 두께)",lf]],lf+lk,"m³",2,""); }
  // 3. 거푸집 유로폼
  const D1q=(P.D1??P.D)/1000, e1=r2(hs*2), e2=r2(D1q+D2), e3=key?r2(hk*2):0;
  add("거푸집","유로폼",[["①",`${f2(hs)} × 2 EA`,"벽체 전·배면",e1],["②",`${f2(D1q)} + ${f2(D2)}`,"저판 양측",e2],...(key?[["③",`${f2(hk)} × 2 EA`,"전단키 양측",e3]]:[])],e1+e2+e3,"m²",0,"");
  // 4. 거푸집 합판6회 (버림 측면)
  add("거푸집","합판 6회",[["",`${f2(lv)} × 2 EA`,"버림 양측",r2(lv*2)]],lv*2,"m²",0,"");
  // 5. 문양거푸집 (전면 노출부)
  const mun=Math.max(0,H-Df-0.25+0.30);
  add("거푸집","문양거푸집",H-Df>0?[["",`${f2(H)} − ${f2(Df)} − 0.25 + 0.30`,"높이 · 근입깊이 · 상부공제 · 하부추가",r2(mun)]]:[],H-Df>0?mun:0,"m²",0,"");
  // 6. 철근가공 및 조립
  const dk=Object.keys(BARS).filter(k=>byDia[k]), tk=dk.reduce((a,k)=>a+r2(byDia[k].kgM/10)/100,0);
  const t3=v=>Math.round(v*1000)/1000;
  items.push({name:"철근가공 및 조립",spec:"",lines:dk.map(k=>["",`${k} : ${fx(t3(byDia[k].kgM/1000),3)}`,`할증 ${P.loss}% → ${fx(t3(byDia[k].kgM/1000*(1+P.loss/100)),3)}`,t3(byDia[k].kgM/1000)]),
    qty:t3(dk.reduce((a,k)=>a+t3(byDia[k].kgM/1000),0)),unit:"ton",loss:P.loss,qL:t3(dk.reduce((a,k)=>a+t3(byDia[k].kgM/1000*(1+P.loss/100)),0)),note:P.steel,dec:3});
  // 7. 물구멍 D100
  add("물구멍","D100",Q.drainN>0?[["",`ceil((H−Df) × L / ${f2(P.drainArea)}) / L × ${f2(t2)}`,"배수공 1개당 배면 2~4m² · 관 길이는 벽체 하단두께 가정",r2(Q.drain)]]:[],Q.drain,"m",3,"KDS 11 80 05 4.6.3(3). 배치 높이·필터·구배 별도 검토");
  // 8. 드레인보드
  const drb=big?Math.max(0,H-(0.5+Df+0.1)):0;
  add("드레인보드","",drb>0?[["",`${f2(H)} − ( 0.50 + ${f2(Df)} + 0.10 )`,"높이 · 상부공제 · 근입깊이 · 하부공제",r2(drb)]]:[],drb,"m²",3,"");
  // 9. 부직포
  const nw=drb>0?r2(drb)*2+(0.10+0.10*2):0;
  add("부직포","",drb>0?[["",`${f2(drb)} × 2면 + ( 0.10 + 0.10 × 2면 )`,"드레인보드 · 겹침 · 보드 두께(상하)",r2(nw)]]:[],nw,"m²",3,"");
  // 10. 비계 (강관)
  const scf=big?(H+H-t2)-0.5*2:0;
  add("비계","강관",big?[["",`( ${f2(H)} + ${f2(H)} − ${f2(t2)} ) − 0.50 × 2`,"전면 · 배면 · 상부공제",r2(scf)]]:[],scf,"m²",0,"");
  // 11. 스페이스
  const sw=r2(H*2+(key?hk*2:0)), sb=r2(B);
  add("스페이스","",[["벽체",`${f2(H)} × 2 EA${key?` + ${f2(hk)} × 2 EA`:""}`,"",sw],["바닥",`${f2(B)}`,"",sb]],sw+sb,"m²",0,""); items[items.length-1].split=true;
  return {items};
}

/* ---------- 요약 ---------- */
function renderSummary(R){
  const {P,Q,S,byDia,DSN}=R, ls=1+P.loss/100;
  $("appliedQ").textContent="계산 적용 q="+fx(P.q,3)+" kPa"+(P.he>0?" (he="+fx(P.he,3)+"m)":"");
  const tk=Object.values(byDia).reduce((s,v)=>s+v.kgM,0)*ls/1000;
  const chip=v=>`<span class="chip ${v?"ok":"bad"}">${v?"O.K":"N.G"}</span>`;
  const dOk=!R.invalidContact&&DSN.every(d=>d.allOk);
  $("summary").innerHTML=[
    ["계산 항목 판정",`${chip(allOk(R))}${R.warns.length?" <small>경고 확인 필요</small>":""}`],
    ["콘크리트",`${fx(Q.conc)} <small>m³/m</small>`],
    ["철근 (할증 포함)",`${fx(tk)} <small>t/m</small>`],
    ["상시 전도 · 활동",`${fx(S.N.FSo,2)} · ${fx(S.N.FSs,2)}${chip(S.N.ok.o&&S.N.ok.s)}<small style="display:block;color:var(--muted)">기준 ${S.N.cr.o} · ${S.N.cr.s}${P.ppf>0&&R.G.hasKey?" (수동토압 포함)":""}</small>`],
    ["상시 최대 지반반력",`${fx(S.N.qmax,1)} <small>kN/m²</small>${chip(S.N.ok.q&&S.N.ok.e)}<small style="display:block;color:var(--muted)">허용 ${fx(S.N.qa,0)}</small>`],
    ["지진시 안정 (±kh 불리값)",`${fx(Math.min(S.E.FSo,S.Eminus.FSo),2)} · ${fx(Math.min(S.E.FSs,S.Eminus.FSs),2)}${chip(S.E.allOk)}<small style="display:block;color:var(--muted)">기준 ${S.E.cr.o} · ${S.E.cr.s}</small>`],
    ["부재 단면검토",`${DSN.filter(d=>d.allOk).length} / ${DSN.length} <small>부재</small>${chip(dOk)}`]
  ].map(([k,v])=>`<div class="kpi"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
  $("warns").innerHTML='<div class="warn">KDS 대조 범위: 배수조건의 단면·외적 안정 계산. 전체안정·침하·액상화·정착·이음 위치 등은 별도 검토해야 합니다.</div>'+(R.infos||[]).map(w=>`<div class="warn">안내: ${esc(w)}</div>`).join("")+R.warns.map(w=>`<div class="warn">${esc(w)}</div>`).join("");
}

/* ---------- 엑셀 ---------- */
function buildXlsx(R){setWT(R);
  if(!R||R.invalidContact)throw Error("계산 불가 상태에서는 출력할 수 없습니다.");
  const {P,G,byDia,S,Q}=R, sched=materialPieces(R),ls=1+P.loss/100, wb=XLSX.utils.book_new();
  const sheet=(name,aoa,cols)=>{const ws=XLSX.utils.aoa_to_sheet(aoa);const ic={"가공조립표":[2,5],"철근재료표":[8,9],"정척이음계획":[8],"원철근반입계획":[5,6],"절단재료표":[2,3,5]}[name]||[];for(const key of Object.keys(ws)){if(key[0]==="!")continue;const cell=ws[key];if(cell.t==="n"&&ic.includes(XLSX.utils.decode_cell(key).c))cell.z="0";}ws["!cols"]=cols.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,name);};
  const rd=(v,n=3)=>Math.round(v*10**n)/10**n;
  sheet("검토상태",[["KDS 대조본 2026-10-21"],["계산 항목 판정",allOk(R)?"O.K":"N.G"],["전체 설계","별도 검토 필요"],["적용 범위","배수조건 직접기초·1m폭 RC 단면. 보통중량골재콘크리트 λ=1."],["적용 기준","KDS 11 80 05:2025, KDS 14 20 10:2021 / 20:2022 / 22:2022 / 30:2021 / 50:2022"],...R.warns.map(w=>["미달·경고",w]),...R.scopePending.map(w=>["별도 검토",w])],[24,110]);
  sheet("KDS조합",[["KDS 14 20 10 4.2.2, αH=1.0"],["조합","D","Hv","L","Hh","E 방향","V","Mr","Mo","e","qmax","유효"],...R.DSN.meta.LC.map(L=>[L.n,L.fD,L.fHv,L.fL,L.fH,L.fE,L.V,L.Mr,L.Mo,L.e,Number.isFinite(L.qmax)?L.qmax:"계산 불가",L.valid?"예":"아니오"])],[14,9,9,9,9,9,16,16,16,16,16,12]);
  sheet("KDS단면",[["KDS 14 20 20, 22"],["단면","주철근","Mu","Vu","φMn","φVc","As","Asreq","Mcr","εt","εmin","η","β1","εcu","Ec","판정","최소 휨철근 적용","As,min (적용값)","최소철근 근거"],...R.DSN.map(d=>[d.name,DM(d.mark),d.Mu,d.Vu,d.phMn,d.phVc,d.As,Number.isFinite(d.Asreq)?d.Asreq:"부족",d.Mcr,d.et,d.etmin,d.eta,d.b1,d.epscu,d.Ec,d.allOk?"O.K":"N.G",d.minApplicable?"적용":"비적용",d.minApplicable?d.Asmin:"비적용",d.minRule])],[24,12,14,14,14,14,14,14,14,12,12,9,9,12,16,12,20,22,85]);
  sheet("KDS세목",[["KDS 구조세목"],["항목","계산","필요","단위","판정","조항"],...R.DETAILS.map(d=>[d.name,d.actual,d.required,d.unit,d.ok?"O.K":"N.G",d.rule])],[36,16,16,18,12,60]);
  sheet("입력제원",[[`${P.wname} 옹벽 입력제원`],[],["항목","값","단위"],
    ["정척길이",P.stockLen,"m"],["이음부 위치계수 α",P.lapTop,""],["도막계수 β",P.lapCoat,""],["이음부 보장 중심피복",P.lapCenter,"mm"],["전체높이 H",P.H,"mm"],["기초두께 D",P.D,"mm"],["벽체 상단두께 t1",P.t1,"mm"],["벽체 하단두께 t2",P.t2,"mm"],["전면경사 1:n",P.nf,""],
    ["앞굽길이 B1",P.B1,"mm"],["뒷굽길이 B3",P.B3,"mm"],["기초폭 B",G.B,"mm"],["근입깊이 Df",P.Df,"mm"],["전단키 폭 bk",P.bk,"mm"],["전단키 깊이 hk",P.hk,"mm"],["키 위치",P.kx,"mm"],["활동 검토 방식",G.hasKey?(P.slm==="plane"?"활동면 이동":"수동토압"):"마찰만",""],["수동토압 적용률",P.ppf,""],["배면 성토경사 1:x",P.xr,""],["성토높이 Hs",P.Hs,"mm"],["kh",P.kh,""],
    ["벽체 피복(중심)",P.cw,"mm"],["기초 피복(중심)",P.cf,"mm"],["연장 L",P.L,"m"],["신축이음 간격",P.blk,"m"],
    ["콘크리트 fck",P.fck,"MPa"],["철근 재질",P.steel,""],["철근 할증",P.loss,"%"],
    ...[...RB].sort((a,b)=>DIDX(a[0])-DIDX(b[0])).map(([m,desc])=>[`${DM(m)} ${desc}`,`${P.bar[m].dia}@${P.bar[m].s}`,""])],[26,14,8]);
  const qr=qtyRows(R), qa=[[`${P.wname} 옹벽 단위수량산출서 (H = ${P.H/1000} m, 1m당)`],[],["구분","규격","","내용","소계","수량","단위","할증 후","비고"]];
  qr.items.forEach((it,n)=>{const L=it.lines.length?it.lines:[["","-","",null]];
    L.forEach((ln,k)=>qa.push([k?"":`${n+1}. ${it.name}`,k?"":it.spec,ln[0],ln[1]+(ln[2]?`  (${ln[2]})`:""),L.length>1&&ln[3]!=null&&!it.split?ln[3]:"",it.split?ln[3]:k?"":(it.qty>0?it.qty:"-"),it.split||!k?it.unit:"",k?"":(it.qL!=null&&it.qty>0?it.qL:""),k?"":[it.loss?`${it.loss}%할증`:"",it.note||""].filter(Boolean).join(" ")]));});
  sheet("단위수량산출서",qa,[16,12,6,52,9,10,6,10,18]);
  const sr=[["철근재료표"],[],["기호","위치","규격","1본길이(m)","간격(mm)","수량(본/m)","총길이(m/m)","단위중량(kg/m)","중량(kg/m)","전체중량(kg)"]];
  Object.keys(BARS).filter(k=>byDia[k]).forEach(k=>{sched.filter(r=>r.dia===k).forEach(r=>sr.push([DM(r.m),r.desc,r.dia,rd(r.len),r.s,rd(r.perM,2),rd(r.lenM),r.w,rd(r.kgM,2),rd(r.kgAll,1)]));
    sr.push(["",`${k} 소계`,"","","","","","",rd(byDia[k].kgM,2),rd(byDia[k].kgAll,1)]);});
  const tkM=Object.values(byDia).reduce((s,v)=>s+v.kgM,0), tkA=Object.values(byDia).reduce((s,v)=>s+v.kgAll,0);
  sr.push(["","합계(할증 전)","","","","","","",rd(tkM,2),rd(tkA,1)],["",`합계(할증 ${P.loss}%)`,"","","","","","",rd(tkM*ls,2),rd(tkA*ls,1)]);
  sheet("철근재료표",sr,[6,22,7,11,9,11,12,14,11,12]);
  sheet("가공조립표",[["철근 가공조립표 · 1m당 (연속철근 포함)"],["기호","규격","길이 mm","수량 본/m","총길이 m/m","중량 kg/m","길이 산출식"],...processingRows(R).map(r=>[r.mark,r.dia,r.lenMM??"불가",r.count,r.totalM??"불가",r.kg??"불가",r.formula])],[16,12,20,20,20,20,65]);
  sheet("정척이음계획",[[stockNote(P)],["기호","규격","배치 줄수","조각/줄","전체 이음수","이음길이 mm","절단 본수","전체길이 m","전체 중량 kg"],...stockRows(R).map(row=>row.map(v=>typeof v==="string"&&/^-?[\d,]+(?:\.\d+)?$/.test(v)?+v.replace(/,/g,""):v))],[14,10,14,14,16,18,16,20,20]);
  sheet("절단재료표",[["기호-조각","규격","절단길이 mm","전체 본수","총길이 m","총중량 kg","배치선 시작 mm","배치선 끝 mm"],...R.sched.flatMap(r=>r.stockPlan.pieces.map((p,i,a)=>[DM(r.m)+(a.length>1?"-"+(i+1):""),r.dia,p.len,r.nAll,p.len/1000*r.nAll,p.len/1000*r.nAll*r.w,p.start,p.end]))],[16,10,18,16,18,18,22,22]);
  sheet("원철근반입계획",[["절단손실 0mm, 동일 규격 잔재 재사용 계획; 최적 발주량 아님"],["규격","원철근 본수","가공길이 m","정척 총길이 m","잔재 m","가공중량 kg","반입중량 kg","할증 포함 원철근 본수"],...purchaseRows(R).map(row=>row.map(v=>typeof v==="string"&&/^-?[\d,]+(?:\.\d+)?$/.test(v)?+v.replace(/,/g,""):v))],[12,18,18,20,18,20,20,28]);
  sheet("이음길이산정",[["B급 / 초과철근 감소 없음 / ld의 300mm 하한 미적용 / 최종 ls≥300mm"],["기호","규격","db","fy","α","β","αβ","γ","c","Ktr","비율≤2.5","ld0","B급 ls"],...R.sched.map(r=>{const l=r.lapInfo;return [DM(r.m),r.dia,l.db,l.fy,l.alpha,l.beta,l.ab,l.gamma,l.c,0,l.ratio,l.ld0,l.lap];})],[12,12,12,12,12,12,12,12,14,12,18,18,18]);
  const rows=[["안정검토"],[]];
  report(R).filter(b=>b.k==="tb"&&(b.sec===3||b.sec===4||b.sec===5||b.sec===6)).forEach(b=>{rows.push([b.cap||""],b.head,...b.rows,[]);});
  sheet("안정·단면검토",rows,[26,22,16,14,12]);
  return XLSX.write(wb,{bookType:"xlsx",type:"array"});
}

/* ---------- 구조계산서 (화면 · 워드 공용 블록) ---------- */
function report(R){setWT(R);
 const {P,G,S,DSN}=R,M=DSN.meta,out=[];let sec=0;
 const h1=t=>{sec++;out.push({k:"h1",t,sec});},h2=t=>out.push({k:"h2",t,sec}),p=t=>out.push({k:"p",t,sec}),eq=t=>out.push({k:"eq",t:Array.isArray(t)?t.join("\n"):t,sec}),tb=(cap,head,rows,w)=>out.push({k:"tb",cap,head,rows,w,sec}),fig=(kind,cap)=>out.push({k:"fig",kind,cap,sec});
 const f=v=>Number.isFinite(v)?fx(v,3):v===Infinity?"∞":v===-Infinity?"−∞":"해당 없음",OK=v=>v?"O.K":"N.G";
 out.push({k:"title",t:P.wname+" 옹벽 KDS 대조 계산서"},{k:"sub",t:"기준 대조일 2026-10-21 · 계산 항목 판정 "+OK(allOk(R))+" · 전체 설계 적합성은 별도 검토"});
 h1("1 적용 기준과 계산 범위");
 const refs=[
 ["KDS 11 80 05:2025","콘크리트옹벽","2025-12-24","1.7, 4.4, 4.6","https://www.kcsc.re.kr/standardCode/viewer/KDS%2011%2080%2005:2025-12-24"],
 ["KDS 14 20 10:2021","콘크리트구조 해석과 설계 원칙","2021-02-18","4.2.2, 4.2.3, 4.3.3","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2010:2021-02-18"],
 ["KDS 14 20 52:2024","콘크리트구조 정착 및 이음","2024-12-30","4.1.2(3), 4.5.1, 4.5.2","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2052:2024-12-30"],
 ["KDS 14 20 20:2022","콘크리트구조 휨 및 압축","2022-01-11","4.1.1, 4.1.2, 4.2.2, 4.2.3","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2020:2022-01-11"],
 ["KDS 14 20 22:2022","콘크리트구조 전단 및 비틀림","2022-01-11","4.1.1, 4.2.1, 4.11.1","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2022:2022-01-11"],
 ["KDS 14 20 30:2021","콘크리트구조 사용성","2021-02-18","4.2.1 식 (4.2-2)·(4.2-3)","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2030:2021-02-18"],
 ["KDS 14 20 50:2022","콘크리트구조 철근상세","2022-01-11","4.6.2","https://www.kcsc.re.kr/standardCode/viewer/KDS%2014%2020%2050:2022-01-11"]
 ];
 tb("KCSC 공식 현행 본문 확인",["기준","확인한 본문 날짜","적용 조항"],refs.map(r=>[r[0],r[2],r[3]]),[32,23,45]);
 refs.forEach(r=>p(r[0]+" "+r[1]+" "+r[4]));
 p("확인한 공표 본문을 적용했습니다. 개정안 의견조회는 시행 기준으로 취급하지 않았습니다. 여기의 O.K는 구현한 계산 항목의 판정이며 전체 설계 승인이나 모든 KDS 적합성을 의미하지 않습니다.");
 p("적용 모델: 보통중량골재 콘크리트(탄성계수 m_c=2300 kg/m³), λ=1, 단철근 직사각형 1m 폭 단면, 직접기초, 배수층으로 가상배면 범위 내 수두가 발생하지 않는 조건입니다. 철근콘크리트 자중 γc는 별도 입력합니다.");
 p("수압 조건을 선택하면 수중단위중량·수압·부력을 계산하지 않은 결과가 출력되지 않도록 계산을 차단합니다. 기준: KDS 11 80 05 1.7.5.");
 p("Hh=자중 토압의 수평분력, Hv=뒤채움·앞굽 토사 자중과 정적 토압 연직분력, D=콘크리트 자중, L=상재하중과 그 유발 토압, E=토압 증가분 및 질량 관성력의 유사정적 작용입니다. 식의 αH는 1.0을 사용하여 허용되는 깊이 보정보다 보수적으로 적용합니다. F·T·W·S·R·Lr 및 별도 상부구조 외력은 0인 범위입니다.");
 p("지진계수 kh="+f(P.kh)+"는 프로젝트에서 별도 산정해야 합니다. 정적분력 H/3·증가분 0.6H 등의 작용점은 선택한 해석 가정이며 KDS의 일률적인 지정값으로 표시하지 않습니다. 정·부 지진계수로 토압과 질량 관성력을 다시 구했습니다.");
 R.warns.forEach(w=>p("미달·경고: "+w));
 h1("2 입력 및 토압 모델");
 tb("주요 입력",["항목","값","단위"],[
 ["H / D / D2",[P.H,P.D,P.D2].map(f).join(" / "),"mm"],["t1 / t2",[P.t1,P.t2].map(f).join(" / "),"mm"],["B1 / B3 / B",[P.B1,P.B3,G.B].map(f).join(" / "),"mm"],
 ["fck / fy",[P.fck,P.steel==="SD500"?500:400].map(f).join(" / "),"MPa"],["gs / gc",[P.gs,P.gc].map(f).join(" / "),"kN/m³"],["φ / μ",[P.phi,P.mu].map(f).join(" / "),"° / -"],
 ["q 입력 / 적용",[P.qInput,P.q].map(f).join(" / "),"kPa"],["상재하중 유형 / he",P.useClass+" / "+f(P.he),"m"],["qult / qult,E",[P.qult,P.qultE].map(f).join(" / "),"kPa"],
 ["qa=qult/3 / qa,E=qult,E/2",[P.qa,P.qaE].map(f).join(" / "),"kPa"],["연장 / 배수공 담당면적",[P.L,P.drainArea].map(f).join(" / "),"m / m²/개"]
 ]);
 fig("gen","일반도");
 eq(["수평·등분포 배면 및 가상배면: Ka=tan²(45°−φ/2), Pa=γs Ka H²/2 + q Ka H (Rankine).",
 "유한 성토·불규칙 지표·벽체 실제 배면: Coulomb 흙쐐기 평형에 기초한 시행쐐기법. KDS 11 80 05 1.7.3.",
 "하중계수 없는 외적 안정과 계수하중 부재 검토를 분리합니다. KDS 11 80 05 1.7.1(2)."]);
 tb("토압 산정 결과",["항목","값","단위"],[["정적 자중토압 Pa",f(S.Pa1),"kN/m"],["상재 증가분 Paq",f(S.Pa2),"kN/m"],["토압 합력 작용각 δ+θ",f(S.delta*180/Math.PI),"°"],["정적 방식",S.wN.method||"시행쐐기",""],["지진시 +kh / −kh 토압",[S.E.Pae,S.Eminus.Pae].map(f).join(" / "),"kN/m"]]);
 h1("3 사용하중 외적 안정");
 tb("사용하중 자중",["구성","W (kN/m)","x (m)","z (m)"],S.items.map(i=>[i.name,f(i.W),f(i.x),f(i.z)]));
 tb("KDS 11 80 05 표 4.4-1",["구분","전도","활동","지지력","계산 항목 판정"],[
 ...[["상시",S.N,P.qult],["+kh",S.E,P.qultE],["−kh",S.Eminus,P.qultE]].map(([n,X,qu])=>[n,f(X.FSo)+" / "+X.cr.o,f(X.FSs)+" / "+X.cr.s,f(qu/X.qmax)+" / "+(n==="상시"?3:2),OK(Object.values(X.ok).every(Boolean))])
 ]);
 tb("지반반력과 편심",["구분","V","Mr","Mo","e (m)","qmax (kPa)","qa (kPa)"],[["상시",S.N],["+kh",S.E],["−kh",S.Eminus]].map(([n,X])=>[n,f(X.V),f(X.Mr),f(X.Mo),f(X.e),f(X.qmax),f(X.qa)]));
 if(S.SL&&S.SL.Pp>0) p("전단키 앞 수동토압: 근입깊이 Df = "+fx(P.Df,0)+" mm를 키 상단 위 흙 두께로 보고 Kp = tan²(45°+φ/2) = "+f(S.SL.Kp)+", 키 깊이 "+fx(P.hk,0)+" mm 구간의 수동토압 "+f(S.SL.PpFull)+" kN/m에 적용률 "+S.SL.ppf+"을 곱해 Pp = "+f(S.SL.Pp)+" kN/m를 활동 저항에 포함했습니다. 수동토압은 전면(키 앞) 지반이 공용기간 동안 굴착·세굴·유실 없이 유지되어야 발휘되므로 전면 지반의 장기 유지가 필요합니다 (KDS 11 80 05 4.4.1(3)~(5)). 수동토압을 포함했으므로 상시 활동 기준은 2.0을 적용합니다."+(P.wtype==="RL"?" 역L형은 앞굽 위 흙의 자중을 안정검토 저항에 넣지 않았습니다.":""));
 p("활동 기준: 상시 1.5(전면 수동토압을 포함하면 2.0), 지진시 1.2. 전도 기준: 상시 2.0, 지진시 1.5. 지지력 기준: 상시 qult/qmax≥3, 지진시 qult,E/qmax≥2. 극한지지력 자체의 산정, 침하 검토는 별도입니다.");
 p("B/6·B/3 편심 제한은 기존 도구의 추가 설계 제한으로 유지했습니다. KDS 11 80 05 4.4.3(3)의 하중저항계수설계법에 대한 B/4·3B/8 간편조건과 혼용하지 않습니다.");
 fig("fL","상시 사용하중 작용도");fig("fLE","정방향 지진 관성력과 토압 작용도");
 fig("pN","상시 토압과 지반반력");fig("pE","정방향 지진 토압과 지반반력 (반대방향 수치는 위 표)");
 h1("4 계수하중과 부재 요구력");
 tb("KDS 14 20 10 4.2.2 적용 조합",["조합","D","Hv","L","Hh","E 방향"],M.LC.map(L=>[L.n,f(L.fD),f(L.fHv),f(L.fL),f(L.fH),f(L.fE)]));
 M.LC.forEach(L=>p(L.n+": "+L.t));
 tb("각 조합의 평형 및 접촉",["조합","V","Mr","Mo","e","qmax","유효"],M.LC.map(L=>[L.n,f(L.V),f(L.Mr),f(L.Mo),f(L.e),f(L.qmax),L.valid?"예":"아니오"]));
 p("기초 합력이 저판 밖이거나 V≤0이면 지반 접촉에 기초한 단면 계산과 파일 출력을 차단합니다. 유효 접촉은 각 조합마다 판정합니다.");
 const H=M.heel;
 if(H){tb("뒷굽 구간 자중·성토 하중 (전단키 포함)",["항목","구분","면적 m²/m","단위중량","연직력 kN/m","접속부 거리 m","모멘트 kN·m/m"],[...H.conc.map(q=>[q.n,q.t,f(q.A),f(q.g),f(q.W),f(q.x),f(q.M)]),...H.soil.map(q=>[q.n,q.t,f(q.A),f(q.g),f(q.W),f(q.x),f(q.M)])]);
 p("전단키가 뒷굽에 걸치면 그 구간의 자중과 접속부에 대한 모멘트를 지반반력 및 국부 단면력 양쪽에 동일하게 산입합니다. 벽체·앞굽에 걸친 부분은 뒷굽 자중에서 제외합니다.");
 tb("뒷굽 연결부 조합별 모멘트",["조합","계산 M","동일 조합 벽체 M","적용 M","전단 V"],H.rows.map(r=>[r.L.n,f(r.rawM),f(r.wallM),f(r.M),f(r.V)]));
 p("KDS 11 80 05 4.6.1(3)⑧에 따라 뒷굽 상면 인장 연결부 모멘트는 동일 하중조합의 벽체 모멘트와 비교하여 상한을 적용합니다. 하면 인장의 역방향 모멘트는 감액하지 않고 별도 검토합니다. 감액 전 값도 위 표에 보존했습니다.");}
 if(M.toe)tb("앞굽 조합별 요구력",["조합","M (kN·m/m)","V (kN/m)"],M.toe.rows.map(r=>[r.L.n,f(r.M),f(r.V)]));
 tb("전체 계수조합 포락값",["검토 단면","철근","Mu","Vu","Mo"],DSN.map(d=>[d.name,DM(d.mark),f(d.Mu),f(d.Vu),f(d.Mo)]));
 p("앞굽 일방향 전단은 KDS 14 20 22 4.1.1(5)의 적용조건에 따라 받침부에서 d 떨어진 단면으로 검토합니다. 뒷굽·벽체·키의 접속부 전단은 접속부 단면에서 보수적으로 검토합니다. 2방향 뚫림전단·집중하중은 적용 범위 밖입니다.");
 fig("qF","대표 하중조합 지반반력");fig("mv","대표 조합 단면력도 · 최종 포락값은 위 표");
 h1("5 휨 전단 최소철근 균열 검토");
 eq(["응력블록: C=0.85η fck b β1 c, a=β1 c; KDS 14 20 20 표 4.1-2.",
 "단면 평형 As fs=C, fs=min(fy, Es εt), εt=εcu(d−c)/c. 이분법으로 중립축과 필요철근량을 구합니다.",
 "φf=0.65~0.85 (변형률에 따라 보간), φv=0.75. 휨 최소 변형률은 SD400 이하 0.004, SD500은 2fy/Es.",
 "일반 휨부재 최소철근: φMn≥1.2Mcr 또는 φMn≥4Mu/3. 균일 두께 저판의 휨인장측은 KDS 14 20 20 4.2.2(3)에 따라 KDS 14 20 50 4.6의 최소량 적용.",
 "Mcr=fr Ig/yt, fr=0.63√fck, Ig=bh³/12, yt=h/2. 단철근 직사각형 단면 가정.",
 "ρst=max[0.0014, 0.0020×min(1,400/fy)]; As,min=min(ρst bh,1800 mm²/m).",
 "뒷굽 하면·앞굽 상면은 검토 조합의 계수/사용 모멘트가 해당 면에 인장을 요구하지 않을 때 최소 휨철근을 비적용으로 구분합니다. 반대측 주철근량의 1/3은 구조세목에서 별도 검토하며, 인장 반전이 있으면 최소 휨철근을 적용합니다. 이는 KDS 14 20 20 4.2.2(1)·(3)와 KDS 11 80 05 4.6.1(3)⑤의 적용 범위를 구분한 해석입니다.",
 "Vc=(1/6)min(√fck,8.4)bd, λ=1. Vs는 산입하지 않으며 전단보강이 필요하면 별도 설계합니다.",
 "Ec=8500(fck+Δf)^(1/3); Δf=4(fck≤40), 6(fck≥60), 중간 보간. Es=200000 MPa.",
 "균열 간격: s≤min[375×210/fs−2.5Cc, 300×210/fs]. 외기·토양 노출의 210 계수 사용."]);
 DSN.forEach((d,i)=>{
 h2("5."+ (i+1)+" "+d.name+" · "+DM(d.mark)+" "+d.dia+"@"+f(d.sMain));
 eq([
 "Mu="+f(d.Mu)+", φMn="+f(d.phMn)+" kN·m/m → "+OK(d.ok.m)+"; Vu="+f(d.Vu)+", "+(d.Vs>0?"φVn=φ(Vc+Vs)":"φVc")+"="+f(d.phVc)+" kN/m"+(d.tieNote?" ["+d.tieNote+"]":"")+" ("+d.vMethod+(d.vMethod==="상세식"?", ρw="+d.rhoW.toFixed(5)+", Vu·d/Mu="+d.vRatio.toFixed(3):"")+") → "+OK(d.ok.v),
 "As="+f(d.As)+", As,req="+f(d.Asreq)+" mm²/m; d="+f(d.d)+" mm; η="+f(d.eta)+", β1="+f(d.b1)+", εcu="+fx(d.epscu,5),
 "c="+f(d.c)+", a="+f(d.a)+" mm; εt="+fx(d.et,5)+" ≥ "+fx(d.etmin,5)+" → "+OK(d.ok.max)+"; φ="+f(d.ph)+"; 철근 응력="+f(d.steelStress)+" MPa",
 !d.minApplicable?d.minRule+" → 비적용":d.slab?"균일 저판 As,min="+f(d.Asmin)+" mm²/m → "+OK(d.ok.min):"최소철근: φMn ≥ 1.2Mcr="+f(1.2*d.Mcr)+" 또는 4Mu/3="+f(4*d.Mu/3)+" kN·m/m"+(d.footMain?", 또는 As ≥ 0.002bh="+f(d.footShr)+" mm²/m (저판, 2008 표준도 방식)":"")+" → "+OK(d.ok.min),
 "사용상태 fs="+f(d.fs)+" MPa; Ec="+f(d.Ec)+" MPa; smax="+f(d.smax)+" mm; 사용 s="+f(d.s)+" mm → "+OK(d.ok.cr)+"; 최대 배근간격 "+f(d.spacingMax)+" mm → "+OK(d.ok.spacing),
 "단면 판정 "+OK(d.allOk)
 ]);
 });
 fig("cap","벽체 요구 휨강도와 배치 철근의 강도");
 h1("6 구조세목 검토");
 p("피복 판정은 사용자 지정 실제 순피복 80 mm를 적용합니다. 입력한 중심 치수는 유효깊이·배근·수량 계산용으로 유지하며, 순피복 판정에서 철근 반지름을 다시 빼지 않습니다.");
 tb("KDS 구조세목",["항목","계산","필요","단위","판정"],R.DETAILS.map(d=>[d.name,f(d.actual),f(d.required),d.unit,OK(d.ok)]));
 R.DETAILS.forEach(d=>p(d.name+": "+d.rule));
 if(G.hasKey){const f5=R.bars.find(b=>b.m==="F5"),xs=f5?f5.secs.map(q=>fx(q[0][0],0)):[];p("F5 배치: 전단키 구간은 중복 배치에서 제외합니다. 우측 배력근 끝선과 전단키 우측 경계의 거리가 배력근 두 칸("+fx(2*P.bar.F3.s,0)+" mm)보다 짧으면 우측 구간은 생략합니다. 현재 단면 위치 x="+(xs.length?xs.join(", ")+" mm":"없음")+". 이는 연결철근 배치 규칙이며 전단키 구조 검토를 대신하지 않습니다.");}
 p("수평철근비는 전체 콘크리트 단면적으로 계산합니다. 기존 min(t,300mm) 절단은 제거했습니다. 노출면 수평철근 500mm²/m와 300mm 이하 간격은 별도 검토합니다.");
 fig("rebar","배근 개략도 · 정착·이음·절단은 별도 설계");
 h1("7 수량과 배수");
 p("연속철근 단위1m 환산은 기본1000mm에 겹침이음을 가산하며 양단80mm를 공제하지 않습니다. 1000×S/(S−ls)로 계산합니다. 아래 실제 연장 절단물량과 구분합니다.");
 p(stockNote(P));
 tb("B급 이음길이 산정",["기호","규격","c mm","비율≤2.5","ld0 mm","B급 ls mm"],R.sched.map(r=>[DM(r.m),r.dia,fx(r.lapInfo.c,2),fx(r.lapInfo.ratio,3),fx(r.lapInfo.ld0,1),r.lapMM]));
 p("정척 원철근 반입계획");
 tb("정척 원철근 반입계획",["규격","원철근본수","가공 m","정척 m","잔재 m","가공 kg","반입 kg","할증본수"],purchaseRows(R));
 p("정척·B급 겹침이음 계획");
 tb("정척·B급 겹침이음 계획",["기호","규격","배치줄수","조각/줄","전체이음수","이음길이 mm","절단본수"],stockRows(R).map(r=>r.slice(0,7)));
 tb("철근 가공조립표 · 1m당",["기호","규격","길이 mm","본/m","m/m","kg/m"],processingRows(R).map(r=>[r.mark,r.dia,r.lenMM==null?"불가":fx(r.lenMM,0),fx(r.count,2).replace(/(\.\d*?)0+$/,"$1").replace(/\.$/,""),r.totalM==null?"불가":fx(r.totalM,3),r.kg==null?"불가":fx(r.kg,0)]));
 tb("주요 수량",["항목","단위수량","단위"],[["구조 콘크리트",f(R.Q.conc),"m³/m"],["철근 할증 전",f(Object.values(R.byDia).reduce((s,v)=>s+v.kgM,0)),"kg/m"],["배수공 개수",f(R.Q.drainN),"개/m"],["배수관 길이",f(R.Q.drain),"m/m"]]);
 p("배수공은 KDS 11 80 05 4.6.3(3)의 배면 면적 2~4m²당 1개 기준을 적용합니다. 담당면적 "+P.drainArea+"m²/개, 내경100mm를 가정했습니다. 배치 높이·필터·유입수량·폐색과 유지관리는 별도 검토입니다.");
 p("횡방향 철근은 실제 배치 본수/연장, 종방향은 양단40mm 공제 후 정척별로 분할하고 겹침길이를 가산했습니다. 절단길이·본수·중량은 철근재료표와 동일합니다. 이음 위치의 승인과 정착 상세 검토는 별도입니다.");
 h1("8 판정과 별도 검토");
 p("구현한 계산 항목: "+OK(allOk(R))+" / 전체 설계: 별도 검토 필요");
 R.scopePending.forEach(s=>p("별도 검토: "+s));
 p("전체안정성 기준안전율은 상시1.5·지진시1.1이며, 이 도구는 이를 직접 해석하지 않습니다. KDS 11 80 05 표4.4-1, 4.4.5·4.5. 침하·액상화·정착·이음의 검토가 없는 상태를 최종 설계 O.K로 보아서는 안 됩니다.");
 return out;
}
function c_xbb(P,G){ return P.B1+P.t2; }
function partsStab(R){ // 안정검토용 하중 분할 (X: 앞굽 끝, Y(z): 기초 저면 기준, m)
  const {P,G,S}=R, m=v=>v/1000, f3=v=>fx(v,3), hs=m(G.hs), D=m(P.D), D2=m(P.D2??P.D), B=S.B, B1=m(P.B1), t1=m(P.t1), t2=m(P.t2);
  const hh=m(P.hh||0), hs2=hs-hh, nfw=m(P.nf*(G.hs-(P.hh||0))), xfH=B1+nfw, xbH=xfH+t1, xbb=B1+t2, bw=xbb-xbH, L3=B-xbb, Hm=m(P.H);
  const conc=[], soil=[];
  conc.push({n:"①",t:`${f3(hs)} × ${f3(t1)}`,A:hs*t1,x:xfH+t1/2,z:D+hs/2});
  if(nfw>1e-6) conc.push({n:"②",t:`${f3(hs2)} × ${f3(nfw)} × ½`,A:hs2*nfw/2,x:B1+nfw*2/3,z:D+hh+hs2/3});
  if(nfw>1e-6&&hh>0) conc.push({n:"②'",t:`${f3(hh)} × ${f3(nfw)}`,A:hh*nfw,x:B1+nfw/2,z:D+hh/2});
  if(hh>0) conc.push({n:"헌치",t:`${f3(hh)} × ${f3(hh)} × ½`,A:hh*hh/2,x:B1-hh/3,z:D+hh/3});
  if(bw>1e-6) conc.push({n:"③",t:`${f3(hs)} × ${f3(bw)} × ½`,A:hs*bw/2,x:xbH+bw/3,z:D+hs/3});
  { const D1=m(P.D1??P.D), Dm=Math.min(D1,D2), fp=[];   // 저판: 공통 두께(Dm) 직사각형 + 앞굽·벽체 아래·뒷굽의 덧붙은 부분
    if(D>Dm+1e-9&&B1>0){ if(D1>Dm+1e-9) fp.push({t:`${f3(D1-Dm)} × ${f3(B1)}`,A:(D1-Dm)*B1,x:B1/2,z:Dm+(D1-Dm)/2});
      if(D>D1+1e-9) fp.push({t:`${f3(D-D1)} × ${f3(B1)} × ½`,A:(D-D1)*B1/2,x:B1*2/3,z:D1+(D-D1)/3}); }
    if(D>Dm+1e-9) fp.push({t:`${f3(D-Dm)} × ${f3(t2)}`,A:(D-Dm)*t2,x:B1+t2/2,z:Dm+(D-Dm)/2});
    if(D>Dm+1e-9&&L3>0){ if(D2>Dm+1e-9) fp.push({t:`${f3(D2-Dm)} × ${f3(L3)}`,A:(D2-Dm)*L3,x:xbb+L3/2,z:Dm+(D2-Dm)/2});
      if(D>D2+1e-9) fp.push({t:`${f3(D-D2)} × ${f3(L3)} × ½`,A:(D-D2)*L3/2,x:xbb+L3/3,z:D2+(D-D2)/3}); }
    fp.push({t:`${f3(Dm)} × ${f3(B)}`,A:Dm*B,x:B/2,z:Dm/2});
    const NUM="④⑤⑥⑦⑧⑨⑩"; fp.forEach((q,i)=>conc.push({n:NUM[i],...q})); }
  if(G.hasKey) conc.push({n:"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[conc.length],t:`${f3(m(P.hk))} × ${f3(m(P.bk))}`,A:m(P.hk)*m(P.bk),x:m(P.kx)+m(P.bk)/2,z:-m(P.hk)/2});
  if(bw>1e-6) soil.push({n:"ⓐ",t:`${f3(hs)} × ${f3(bw)} × ½`,A:hs*bw/2,x:xbH+bw*2/3,z:D+hs*2/3});
  if(L3>0){ soil.push({n:"ⓑ",t:`${f3(hs)} × ${f3(L3)}`,A:hs*L3,x:xbb+L3/2,z:D+hs/2});
    if(D2<D) soil.push({n:"ⓒ",t:`${f3(D-D2)} × ${f3(L3)} × ½`,A:(D-D2)*L3/2,x:xbb+L3*2/3,z:D2+(D-D2)*2/3}); }
  const c={xbt:G.xbt,xbb:P.B1+P.t2,B:G.B,xk:G.xk,gnd:G.gnd};
  const top=polyAC(clipHalf(heelSoilPoly(P,c),pt=>pt[1]-P.H));
  if(top.A>1) soil.push({n:"ⓓ",t:"배면 성토부 (다각형)",A:top.A/1e6,x:m(top.x),z:m(top.z)});
  const ts=S.items.find(i=>i.name==="앞굽 위 흙"); if(ts) soil.push({n:"ⓔ",t:`앞굽 위 흙 (${f3(m(P.Df)-D)} × ${f3(B1)})`,A:ts.W/P.gs,x:ts.x,z:ts.z});
  conc.forEach(q=>{q.g=P.gc;q.W=q.A*q.g;}); soil.forEach(q=>{q.g=P.gs;q.W=q.A*q.g;});
  const sum=a=>({W:a.reduce((s,q)=>s+q.W,0),M:a.reduce((s,q)=>s+q.W*q.x,0)});
  return {conc,soil,sum};
}
function renderBlocks(bl,R){
  return bl.map(b=>{
    if(b.k==="title") return `<h2 style="font-size:19px;border:0;margin-bottom:0">${esc(b.t)}</h2>`;
    if(b.k==="sub") return `<p class="note">${esc(b.t)}</p>`;
    if(b.k==="h1") return `<h2>${esc(b.t)}</h2>`;
    if(b.k==="h2") return `<h4>${esc(b.t)}</h4>`;
    if(b.k==="p") return `<p>${esc(b.t)}</p>`;
    if(b.k==="eq") return `<div class="eq">${esc(b.t)}</div>`;
    if(b.k==="fig") return `<div class="fig">${toSVG(drawing(R,b.kind))}</div><p class="cap">${esc(b.cap)}</p>`;
    if(b.k==="tb") return `${b.cap&&b.cap.startsWith("- ")?`<p style="margin:8px 0 2px">${esc(b.cap)}</p>`:""}<div class="tblwrap"><table><thead><tr>${b.head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map((c,i)=>{const t=String(c);const cls=t==="O.K"?' class="ok-t"':t==="N.G"?' class="bad-t"':i===0?' class="l"':(/^[-\d.,∞ ]+$/.test(t)?' class="n"':' class="l"');return `<td${cls}>${esc(t)}</td>`;}).join("")}</tr>`).join("")}</tbody></table></div>`;
    return "";
  }).join("");
}

/* ---------- 워드(.docx) ---------- */
const XE=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function svgToPng(svg){return new Promise((res,rej)=>{const img=new Image();
  img.onload=()=>{const W=img.naturalWidth||1800,H=img.naturalHeight||1200;const cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);
    cv.toBlob(b=>b?b.arrayBuffer().then(buf=>res({buf,W,H})):rej(new Error("png")),"image/png");};
  img.onerror=()=>rej(new Error("svg"));img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);});}
async function buildDocx(arg){
  const list=Array.isArray(arg)?arg:[{name:null,R:arg}], R=list[0].R;
  let bl=[];
  if(list.length>1){
    bl.push({k:"title",t:"옹벽 구조계산서"},{k:"sub",t:`옹벽 ${list.length}개 · 작성 ${new Date().toLocaleDateString("ko-KR")}`});
    bl.push({k:"h1",t:"검토 결과 총괄"});
    const o=v=>v?"O.K":"N.G";
    bl.push({k:"tb",head:["옹벽","H (mm)","상시 안정","지진시 안정","부재 단면","판정"],w:[26,12,16,16,16,14],
      rows:list.map(({name,R})=>[name,fx(R.P.H,0),o(R.S.N.allOk),o(R.S.E.allOk),o(R.DSN.every(d=>d.allOk)),o(allOk(R))])});
  }
  list.forEach(({name,R:Rw},i)=>{
    if(list.length>1) bl.push({k:"pb"});
    report(Rw).forEach(b=>{ if(b.k==="title"&&name) b={...b,t:`${name} 구조계산서`}; bl.push({...b,R:Rw}); });
  });
  const FONT="맑은 고딕", MONO="Consolas";
  const run=(t,o={})=>`<w:r><w:rPr><w:rFonts w:ascii="${o.mono?MONO:FONT}" w:hAnsi="${o.mono?MONO:FONT}" w:eastAsia="${FONT}"/>${o.b?"<w:b/>":""}${o.color?`<w:color w:val="${o.color}"/>`:""}<w:sz w:val="${o.sz||20}"/><w:szCs w:val="${o.sz||20}"/></w:rPr><w:t xml:space="preserve">${XE(t)}</w:t></w:r>`;
  const para=(inner,o={})=>`<w:p><w:pPr>${o.keep?"<w:keepNext/>":""}${o.border?`<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="1D5E88"/></w:pBdr>`:""}${o.shd?`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`:""}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:""}${o.jc?`<w:jc w:val="${o.jc}"/>`:""}</w:pPr>${inner}</w:p>`;
  const TW=9638;
  const tbl=(head,rows,w)=>{const ws=(w||head.map(()=>100/head.length)).map(v=>Math.round(TW*v/100));
    const cell=(t,wd,hd)=>{const s=String(t);const col=s==="N.G"?"B3261E":s==="O.K"?"2C7A4B":null;
      return `<w:tc><w:tcPr><w:tcW w:w="${wd}" w:type="dxa"/>${hd?'<w:shd w:val="clear" w:color="auto" w:fill="E6ECF0"/>':""}<w:vAlign w:val="center"/></w:tcPr>${para(run(s,{sz:17,b:hd||!!col,color:col}),{jc:hd||col?"center":"left",after:0})}</w:tc>`;};
    return `<w:tbl><w:tblPr><w:tblW w:w="${TW}" w:type="dxa"/><w:tblBorders>${["top","left","bottom","right","insideH","insideV"].map(b=>`<w:${b} w:val="single" w:sz="4" w:space="0" w:color="8A949A"/>`).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(x=>`<w:gridCol w:w="${x}"/>`).join("")}</w:tblGrid>${[head,...rows].map((r,i)=>`<w:tr>${i===0?'<w:trPr><w:tblHeader/></w:trPr>':""}${r.map((t,j)=>cell(t,ws[j],i===0)).join("")}</w:tr>`).join("")}</w:tbl>`+para("",{after:120});};
  const imgs=[]; let body="";
  for(const b of bl){
    if(b.k==="pb") body+=`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    else if(b.k==="title") body+=para(run(b.t,{b:true,sz:36}),{jc:"center",before:600,after:120});
    else if(b.k==="sub") body+=para(run(b.t,{sz:20,color:"5B6970"}),{jc:"center",after:400});
    else if(b.k==="h1") body+=para(run(b.t,{b:true,sz:26}),{before:300,after:120,border:true,keep:true});
    else if(b.k==="h2") body+=para(run(b.t,{b:true,sz:22}),{before:160,after:80,keep:true});
    else if(b.k==="p") body+=para(run(b.t,{sz:20}));
    else if(b.k==="eq") body+=b.t.split("\n").map((l,i,a)=>para(run(l,{mono:true,sz:18}),{shd:"F1F4F6",ind:200,after:i===a.length-1?120:0})).join("");
    else if(b.k==="tb"){ if(b.cap&&b.cap.startsWith("- ")) body+=para(run(b.cap,{sz:20}),{keep:true}); body+=tbl(b.head,b.rows,b.w); }
    else if(b.k==="fig"){
      const png=await svgToPng(toSVG(drawing(b.R||R,b.kind),PRINTCOL)); const id=imgs.length+1; imgs.push(png);
      const cx=Math.round(15.5*360000), cy=Math.round(cx*png.H/png.W);
      body+=`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="그림 ${id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="fig${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`+para(run(b.cap,{sz:18,color:"5B6970"}),{jc:"center",after:200});
    }
  }
  const W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdFt"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1134" w:bottom="1418" w:left="1134" w:header="851" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const footer=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${W}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${list.length>1?"옹벽":R.P.wname+"옹벽"} 구조계산서  -  </w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}" w:cs="${FONT}"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-US" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const drels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${imgs.map((_,i)=>`<Relationship Id="rIdImg${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/fig${i+1}.png"/>`).join("")}</Relationships>`;
  const z=new JSZip();
  z.file("[Content_Types].xml",ct);z.file("_rels/.rels",rels);z.file("word/document.xml",doc);z.file("word/styles.xml",styles);
  z.file("word/footer1.xml",footer);z.file("word/_rels/document.xml.rels",drels);
  imgs.forEach((im,i)=>z.file(`word/media/fig${i+1}.png`,im.buf));
  return z.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}
