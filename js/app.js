"use strict";
/* 옹벽 설계도구 · 실행 · 여러 옹벽(프로젝트) · 도면(PDF)에서 옹벽 불러오기 · 시작 */
/* ---------- 실행 ---------- */
let CUR=null, timer=null;
const SCREEN_FONT={genWrap:14,svgRebar:14};let SCREEN_VIEW="sec";
function renderScreenDrawings(R){
 const width=Math.max(240,($("genWrap").parentElement.parentElement.clientWidth||800)-8);
 const areaHeight=$("genWrap").clientHeight||Math.max(720,Math.min(innerHeight*1.36,1520));
 const fit=(fn,target,height)=>{
  let th=Math.max(R.G.B,R.P.H)*.02,v;
  for(let i=0;i<10;i++){
   v=fn(th);v={...v,E:v.E.filter(e=>!(e.t==="tx"&&e.layer==="S-BAR"))};
   const b=bbox(v.E),scale=Math.min(width/(b[2]-b[0]+4*th),height/(b[3]-b[1]+4*th)),minH=Math.min(...v.E.filter(e=>e.t==="tx"&&e.h>0).map(e=>e.h));
   if(minH*scale>=target*.98)break;
   th*=Math.min(1.18,target/Math.max(1,minH*scale));
  }
  return v;
 };
 $("svgGen").innerHTML=toSVG(fit(th=>drawing(R,"gen",{th}),SCREEN_FONT.genWrap,areaHeight-4));
 const entry={sec:["본체",secView],elev:["벽체",elevView],plan:["저판",planView]}[SCREEN_VIEW],draw=fit(th=>entry[1](R,th),SCREEN_FONT.svgRebar,areaHeight-42);
 $("svgRebar").innerHTML='<section class="drawing-card" data-drawing-card="'+entry[0]+'"><h4>'+entry[0]+'</h4>'+toSVG(draw,PRINTCOL)+'</section>';
 document.querySelectorAll("[data-rebar-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.rebarView===SCREEN_VIEW)));
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rebar-view]");if(!b)return;SCREEN_VIEW=b.dataset.rebarView;if(CUR)renderScreenDrawings(CUR);});
document.addEventListener("change",e=>{const s=e.target.closest("[data-drawing-font]");if(!s)return;SCREEN_FONT[s.dataset.drawingFont]=Number(s.value);if(CUR)renderScreenDrawings(CUR);});
let screenWidth=0,screenResizeTimer;
const resizeDrawings=()=>{clearTimeout(screenResizeTimer);screenResizeTimer=setTimeout(()=>{if(CUR)renderScreenDrawings(CUR);},80);};
const drawingObserver=new ResizeObserver(()=>{const w=$("genWrap").parentElement.parentElement.clientWidth;if(w>0&&Math.abs(w-screenWidth)>2){screenWidth=w;resizeDrawings();}});
drawingObserver.observe($("genWrap").parentElement.parentElement);window.addEventListener("resize",resizeDrawings);

// 일반도·배근도 탭: 왼쪽 형상 입력칸을 도면 옆 높이로 내림 (넓은 화면에서만)
function alignInputs(){ const a0=document.querySelector("aside.inputs"); if(a0) a0.style.marginTop=""; return;   // 입력칸은 탭 칸과 같은 높이 (도면 옆 맞춤 해제)
 try{
  const aside=document.querySelector("aside.inputs"); if(!aside) return;
  const vis=[...aside.querySelectorAll("fieldset")].filter(f=>f.getClientRects().length&&f.getBoundingClientRect().height>0);   // 탭마다 보이는 입력칸이 다름 (배근도 탭은 형상 칸이 숨겨짐)
  const fs=vis.find(f=>(f.querySelector("legend")||{}).textContent==="형상")||vis[0];
  const pane=[...document.querySelectorAll(".pane[data-p]")].find(p=>!p.hidden);
  const tgt=pane&&(pane.dataset.p==="gen"?$("svgGen"):pane.dataset.p==="rebar"?$("svgRebar"):null);
  if(!fs||!tgt||window.innerWidth<=900||!tgt.getBoundingClientRect().height){ aside.style.marginTop=""; return; }
  aside.style.marginTop=""; const d=tgt.getBoundingClientRect().top-fs.getBoundingClientRect().top;
  if(d>8) aside.style.marginTop=Math.round(d)+"px";
 }catch(e){} }
window.addEventListener("resize",()=>requestAnimationFrame(alignInputs));
try{ const ro=new ResizeObserver(()=>requestAnimationFrame(alignInputs)); ["sugGen","sugRebar","svgGen","svgRebar"].forEach(id=>{const el=document.getElementById(id); if(el) ro.observe(el);}); }catch(e){}   // 안내 문구·도면 높이가 바뀌면 다시 맞춤
document.addEventListener("click",e=>{ if(e.target.closest&&e.target.closest(".tab,[data-t]")) setTimeout(alignInputs,30); },true);
function run(){
  if(!(num("lsF")>0))$("lsF").value="100";
  ++SUG.gen;for(const id of ["sugGen","sugRebar"]){if($(id))$(id).innerHTML="";}document.querySelectorAll(".sug-slot").forEach(el=>el.replaceChildren());
  try{CUR=compute();}
  catch(e){
    CUR=null;
    if(typeof PROJ!=="undefined"&&PROJ.walls[PROJ.active]){PROJ.walls[PROJ.active].ok=false;syncActive();renderWallTabs();}
    if(V3){V3.grp.visible=false;V3.render();}
    $("summary").innerHTML='<div class="kpi"><span class="k">입력 오류</span><span class="v">계산 중지</span></div>';
    $("warns").textContent=e.message;
    for(const id of ["svgGen","svgRebar","tblSched","tblBend","tblQty","tblStab","report","stressPane","sheetWrap","cmpTable"])$(id).innerHTML="";
    document.querySelectorAll("#btnDxf,#btnDocx,#btnXlsx,#btnDocxAll,#btnDxfAll,#btnOpt,#btnOptAll").forEach(b=>b.disabled=true);
    return;
  }
  document.querySelectorAll("#btnDxf,#btnDocx,#btnXlsx,#btnDocxAll,#btnDxfAll,#btnOpt,#btnOptAll").forEach(b=>b.disabled=CUR.invalidContact);
  if(V3)V3.grp.visible=true;
  renderScreenDrawings(CUR);
  renderSummary(CUR);renderTables(CUR);renderTips(CUR);renderSugs(CUR);
  if(!$("sheetPane").hidden) renderSheet(CUR);
  if(typeof PROJ!=="undefined"){syncActive();renderWallTabs();if(!$("allPane").hidden)renderCompare();}
  if(CUR.invalidContact){
    const message='<p class="warn">기초 접촉 상실로 부재 단면 계산을 중지했습니다. 형상과 하중을 조정하세요.</p>';
    $("report").innerHTML=message;$("tblStab").innerHTML=message;$("stressPane").innerHTML=message;
  }
  if(V3&&!$("view3d").closest(".pane").hidden)update3D(CUR);else if(V3)V3.dirty=true;
  { const a=document.querySelector("aside.inputs"); if(!(a&&a.contains(document.activeElement))) setTimeout(alignInputs,60); }   // 입력 중에는 칸이 움직이지 않게
}
$("frm").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(run,150);});
$("frm").addEventListener("change",()=>{clearTimeout(timer);timer=setTimeout(run,50);});
$("btnAuto").addEventListener("click",()=>{
  const H=num("H"), r50=v=>Math.round(v/50)*50;
  const D=Math.max(450,r50(0.1*H)), B=r50(0.6*H), t1=300, hs=H-D, nf=num("nf");
  const t2=Math.max(r50(0.1*H),Math.ceil((t1+nf*hs)/10)*10+50);
  const wt=$("wtype").value, Bt=wt==="RL"?r50(0.7*H):B;
  const B1=wt==="L"?0:wt==="RL"?Math.max(300,Bt-t2):Math.max(300,r50(B*0.25));
  $("D").value=D;$("t1").value=t1;$("t2").value=t2;$("B1").value=B1;$("B3").value=wt==="RL"?0:Math.max(300,Bt-B1-t2);
  run();toast("높이 "+H+" mm 기준 개략 제원을 채웠습니다.");
});
// 출력 탭에 맞는 입력만 보이기
const FS_FOR={gen:["shape"],rebar:["bar"],sheet:["sheet","stock"],m3d:["qty"],sched:["qty","stock"],bend:["qty","stock"],qty:["qty","stock"],stab:["soil"],calc:["soil"],stress:[],all:[]};
const FS_NAME={shape:"형상·성토·버림",bar:"철근 규격",soil:"지반·하중·콘크리트 강도",qty:"수량",stock:"정척·이음",sheet:"상세도 축척"};
function showInputsFor(t){ const want=FS_FOR[t]; const tabName=(document.querySelector(`.tab[data-t="${t}"]`)||{}).textContent||"";
  document.querySelectorAll("#frm fieldset[data-fs]").forEach(f=>f.hidden=!!want&&!want.includes(f.dataset.fs));
  $("fsNote").textContent=want&&!want.length?`${tabName} 탭에는 따로 입력할 항목이 없습니다. 다른 입력은 해당 탭을 누르면 보입니다.`:want?`${tabName} 탭 입력: ${want.map(k=>FS_NAME[k]).join(", ")} · 다른 입력은 해당 탭을 누르면 보입니다.`:"모든 입력이 보입니다."; }
showInputsFor("gen");
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===t?"true":"false"));
  document.querySelectorAll(".pane").forEach(p=>p.hidden=p.dataset.p!==t.dataset.t);
  try{localStorage.setItem("rw-tab-kds20261021",t.dataset.t);}catch(e){}
  showInputsFor(t.dataset.t);
  if(t.dataset.t==="all") renderCompare();
  if(t.dataset.t==="sheet") renderSheet(CUR);
  if(t.dataset.t==="m3d"){init3D();if(V3){update3D(CUR);requestAnimationFrame(()=>{const el=$("view3d");V3.renderer.setSize(el.clientWidth,el.clientHeight,false);V3.cam.aspect=el.clientWidth/el.clientHeight;V3.cam.updateProjectionMatrix();V3.render();});}
    else $("note3d").textContent="3D 라이브러리를 불러오지 못했습니다. 페이지를 새로 고쳐 보세요.";}
}));
$("showConc").addEventListener("change",applyVis);$("showBar").addEventListener("change",applyVis);

function toast(msg){const t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2600);}
let DL=null;
const STANDALONE=!(window.claude&&window.claude.use);   // 내보낸 HTML을 브라우저에서 직접 연 경우
function plainDownload(filename,data){
  const blob=data instanceof Blob?data:new Blob([data],{type:"application/octet-stream"});
  const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000); toast(filename+" 을(를) 내려받았습니다."); }
(async()=>{
  try{DL=window.claude&&window.claude.use?await window.claude.use("downloads"):null;}catch(e){DL=null;}
  if(!DL&&!STANDALONE){$("btnDxf").disabled=true;$("btnXlsx").disabled=true;$("btnDocx").disabled=true;$("dlNote").textContent="이 화면에서는 파일 저장을 쓸 수 없습니다.";}
  else if(!DL){$("dlNote").textContent="";}
})();
async function save(filename,data){
  if(!DL){ if(STANDALONE){plainDownload(filename,data);return;} toast("이 화면에서는 파일 저장을 쓸 수 없습니다.");return;}
  try{await DL.save({filename,data});toast(filename+" 저장을 요청했습니다.");}
  catch(e){const c=e&&e.code;toast(c==="declined"?"저장을 취소했습니다.":c==="rate_limited"?"이미 저장 창이 열려 있습니다. 잠시 후 다시 누르세요.":"저장하지 못했습니다 ("+(c||"오류")+").");}
}
const tag=()=>`${typeof PROJ!=="undefined"?safeName(PROJ.walls[PROJ.active].name)+"_":""}H${CUR.P.H}_L${CUR.P.L}m`;
$("btnXlsx").addEventListener("click",()=>{if(typeof XLSX==="undefined"){toast("엑셀 라이브러리를 불러오지 못했습니다.");return;}save(`${CUR.P.wname}옹벽_단위수량산출서_${tag()}.xlsx`,new Uint8Array(buildXlsx(CUR)));});
$("btnDocx").addEventListener("click",async()=>{
  if(typeof JSZip==="undefined"){toast("압축 라이브러리를 불러오지 못했습니다.");return;}
  try{const blob=await buildDocx(CUR);save(`${CUR.P.wname}옹벽_구조계산서_${tag()}.docx`,blob);}
  catch(e){toast("구조계산서를 만들지 못했습니다: "+(e&&e.message||e));}
});
$("btnDxf").addEventListener("click",async()=>{
  if(typeof JSZip==="undefined"){toast("압축 라이브러리를 불러오지 못했습니다.");return;}
  const z=new JSZip();
  z.file("KDS_검토상태.txt",cadStatus(CUR));
  z.file(`옹벽_2D_일반도_배근도_${tag()}.dxf`,dxf2D(CUR));
  z.file(`옹벽_3D_${tag()}.dxf`,dxf3D(CUR));
  z.file(`옹벽_상세도_${tag()}.dxf`,dxfSheets([{R:CUR,meta:sheetMeta()}]));
  z.file(`옹벽_3D_솔리드_${tag()}.lsp`,lisp(CUR));
  z.file("읽어보기.txt",`역T형 옹벽 CAD 파일\r\n\r\n1) 2D DXF: 일반도(좌)와 배근도(우). 문자 스타일 STANDARD = malgun.ttf\r\n2) 3D DXF: 콘크리트 3DFACE + 철근 3D 폴리라인. VSCURRENT 실사로 보세요.\r\n3) LSP: APPLOAD 후 RWALL 입력 -> 진짜 3D 솔리드 생성. RWBARSOLID -> 철근 솔리드화\r\n4) 상세도 DXF: A3 도곽(420x297)을 축척배수만큼 키운 모형공간 시트. 1:S로 출력하면 A3 한 장\r\n`);
  const blob=await z.generateAsync({type:"blob"});
  save(`${CUR.P.wname}옹벽_CAD_${tag()}.zip`,blob);
});
/* ---------- 여러 옹벽 (프로젝트) ---------- */

const GROUND_KEYS=["gs","phi","mu","qult","qultE","qa","fe","waterMode","drainArea","kh"];
let COMMON_GROUND=null;
const commonGrid=$("commonGroundPanel").querySelector(".common-ground-grid");
for(const id of GROUND_KEYS){const input=$(id),field=input?.closest(".f");if(field)commonGrid.appendChild(field);}
$("commonGroundTab").addEventListener("click",()=>{const panel=$("commonGroundPanel");panel.hidden=!panel.hidden;$("commonGroundTab").setAttribute("aria-expanded",String(!panel.hidden));});
for(const ev of ["input","change"])$("commonGroundPanel").addEventListener(ev,()=>{clearTimeout(timer);timer=setTimeout(run,100);});
function groundFrom(v){return Object.fromEntries(GROUND_KEYS.map(k=>[k,v[k]??DEFAULTS[k]]));}
function shareGround(v){COMMON_GROUND=groundFrom(v);for(const w of PROJ.walls){const changed=GROUND_KEYS.some(k=>w.values[k]!==COMMON_GROUND[k]);Object.assign(w.values,COMMON_GROUND);if(changed)w.ok=undefined;}}

const DEFAULTS=formValues();
function normV(v){v=v||{};const o=sameBackDia({...DEFAULTS,...v,...(COMMON_GROUND||{})});
  for(const pair of BAR_PAIRS){const source=pair.find(m=>v["s_"+m]!=null)||pair[0];for(const m of pair)o["s_"+m]=o["s_"+source];}
  for(const k in o)if(k.startsWith("d_")&&o[k]==="H10")o[k]="H13";
  if(!COMMON_GROUND&&v.qult==null&&v.qa!=null)o.qult=String(Number(v.qa)*3);
  if(!COMMON_GROUND&&v.qultE==null&&v.qa!=null)o.qultE=String(Number(v.qa)*(Number(v.fe)||1.5)*2);
  o.hm="joint";o.hpv="1";o.stin="1";if(!(Number(o.lsF)>0))o.lsF="100";
  if(!v.d_W5&&v.d_W3){o.d_W5=v.d_W3;o.s_W5=v.s_W3;} if(!v.d_F4&&v.d_F3){o.d_F4=v.d_F3;o.s_F4=v.s_F3;}if(!v.wtype)o.wtype=(+v.B1===0&&v.B1!=null&&v.B1!=="")?"L":(+v.B3===0&&v.B3!=null&&v.B3!=="")?"RL":"T";
  // 역T형 이전 자료: 상면 주철근 한 종류(@s) → 표준도 방식 F3(전체)·F2(뒷굽용) 각 @2s 로 나눔 (총량 동일)
  if(o.wtype==="T"&&v.s_FT==null&&v.d_F1!=null){const sF=Number(o.s_F1)||250; o.d_FT=o.d_F1; o.s_FT=String(2*sF); o.s_F1=String(2*sF);}
  if(v.d_FS==null&&o.d_F5) o.d_FS=o.d_F5;
  return o;}
let PROJ={walls:[{name:"옹벽 1",values:{...DEFAULTS}}],active:0};
const allOk=R=>!!R&&!R.invalidContact&&!R.warns.length&&R.S.N.allOk&&R.S.E.allOk&&R.DSN.every(d=>d.allOk);
function persistLocal(){try{localStorage.setItem("rw-proj-kds20261021",JSON.stringify({walls:PROJ.walls.map(({name,values})=>({name,values})),active:PROJ.active,commonGround:COMMON_GROUND}));}catch(e){}}
function syncActive(){const w=PROJ.walls[PROJ.active]; if(!w)return;shareGround(formValues());w.values=formValues(); if(CUR) w.ok=allOk(CUR); persistLocal();}
const TNAME={T:"역T형",L:"L형",RL:"역L형"}, TORD=["L","RL","T"];
const LASTOF={};
function wType(i){ return i===PROJ.active?($("wtype").value||"T"):(normV(PROJ.walls[i].values).wtype||"T"); }
function renderWallTabs(){
  const cur=wType(PROJ.active); LASTOF[cur]=PROJ.active;
  const types=TORD.filter(t=>PROJ.walls.some((w,i)=>wType(i)===t));
  $("ttabs").innerHTML=types.map(t=>`<button type="button" class="ttab" role="tab" data-t="${t}" aria-selected="${t===cur}">${TNAME[t]}<span class="cnt">${PROJ.walls.filter((w,i)=>wType(i)===t).length}</span></button>`).join("");
  $("wtabs").innerHTML=PROJ.walls.map((w,i)=>wType(i)!==cur?"":`<button type="button" class="wtab" role="tab" draggable="true" data-i="${i}" aria-selected="${i===PROJ.active}" title="${esc(w.name)}"><span class="dot ${w.ok===undefined?"":w.ok?"ok":"bad"}"></span><span class="nm">${esc(w.name)}</span></button>`).join("");
  if(document.activeElement!==$("wName")) $("wName").value=PROJ.walls[PROJ.active].name;
  $("wDel").disabled=PROJ.walls.length<2; if(typeof svCntUpdate==="function") svCntUpdate();
  { const idx=PROJ.walls.map((w,i)=>i).filter(i=>wType(i)===cur), k=idx.indexOf(PROJ.active); $("wLeft").disabled=k<=0; $("wRight").disabled=k<0||k>=idx.length-1; }
}
function switchWall(i){ if(i===PROJ.active||!PROJ.walls[i])return; syncActive(); PROJ.active=i;
  applyValues(normV(PROJ.walls[i].values)); $("wName").value=PROJ.walls[i].name; renderWallTabs(); }
function loadProject(p){
  const ws=(p.walls||[]).filter(w=>w&&w.values); if(!ws.length)return false;
  COMMON_GROUND=null;const active=Math.min(Math.max(0,p.active|0),ws.length-1);COMMON_GROUND=groundFrom(p.commonGround||normV(ws[active].values));
  PROJ={walls:ws.map((w,i)=>({name:w.name||`옹벽 ${i+1}`,values:normV(w.values)})),active:Math.min(Math.max(0,p.active|0),ws.length-1)};
  applyValues(PROJ.walls[PROJ.active].values); $("wName").value=PROJ.walls[PROJ.active].name; renderWallTabs(); return true;
}
function projectData(){syncActive();return {walls:PROJ.walls.map(({name,values})=>({name,values})),active:PROJ.active,commonGround:COMMON_GROUND};}
function computeWall(i){ return i===PROJ.active?CUR:withVals(normV(PROJ.walls[i].values),()=>compute()); }
$("ttabs").addEventListener("click",ev=>{const b=ev.target.closest("[data-t]");if(!b)return;const t=b.dataset.t;
  if(t===wType(PROJ.active))return; const l=LASTOF[t]; const i=(l!=null&&PROJ.walls[l]&&wType(l)===t)?l:PROJ.walls.findIndex((w,k)=>wType(k)===t); if(i>=0)switchWall(i);});
// 탭 순서 바꾸기: 끌어서 놓기, ◀ ▶ 버튼
function moveWall(from,to){ if(from===to||from<0||to<0||from>=PROJ.walls.length)return; syncActive();
  const act=PROJ.walls[PROJ.active], w=PROJ.walls.splice(from,1)[0]; if(to>from)to--; PROJ.walls.splice(to,0,w);
  PROJ.active=PROJ.walls.indexOf(act); for(const k in LASTOF) delete LASTOF[k]; renderWallTabs(); persistLocal(); if(!$("allPane").hidden)renderCompare(); }
let DRAGI=null;
$("wtabs").addEventListener("dragstart",ev=>{const b=ev.target.closest("[data-i]");if(!b)return;DRAGI=+b.dataset.i;b.classList.add("drag");try{ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",b.dataset.i);}catch(e){}});
$("wtabs").addEventListener("dragend",()=>{DRAGI=null;document.querySelectorAll(".wtab").forEach(x=>x.classList.remove("drag","dropL","dropR"));});
$("wtabs").addEventListener("dragover",ev=>{const b=ev.target.closest("[data-i]");if(DRAGI==null||!b)return;ev.preventDefault();
  const r=b.getBoundingClientRect(), right=ev.clientX>r.left+r.width/2; document.querySelectorAll(".wtab").forEach(x=>x.classList.remove("dropL","dropR")); b.classList.add(right?"dropR":"dropL");});
$("wtabs").addEventListener("drop",ev=>{const b=ev.target.closest("[data-i]");if(DRAGI==null||!b)return;ev.preventDefault();
  const r=b.getBoundingClientRect(), t=+b.dataset.i+(ev.clientX>r.left+r.width/2?1:0), f=DRAGI; DRAGI=null; moveWall(f,t);});
function stepWall(dir){ const t=wType(PROJ.active), idx=PROJ.walls.map((w,i)=>i).filter(i=>wType(i)===t), k=idx.indexOf(PROJ.active), n=idx[k+dir];
  if(n==null)return; moveWall(PROJ.active,dir>0?n+1:n); }
$("wLeft").addEventListener("click",()=>stepWall(-1)); $("wRight").addEventListener("click",()=>stepWall(1));
$("wtabs").addEventListener("click",ev=>{const b=ev.target.closest("[data-i]");if(b)switchWall(+b.dataset.i);});
$("wName").addEventListener("input",()=>{PROJ.walls[PROJ.active].name=$("wName").value||"이름 없음";renderWallTabs();persistLocal();if(!$("allPane").hidden)renderCompare();});
$("wDup").addEventListener("click",()=>{syncActive();const c=PROJ.walls[PROJ.active];PROJ.walls.push({name:c.name+" 복사",values:{...c.values}});switchWall(PROJ.walls.length-1);toast("현재 옹벽을 복제했습니다.");});
$("wNew").addEventListener("click",()=>{syncActive();const t0=wType(PROJ.active), nT=PROJ.walls.filter((w,i)=>wType(i)===t0).length+1;
  PROJ.walls.push({name:`${TNAME[t0]} ${nT}`,values:normV({...DEFAULTS,wtype:t0,...(t0==="L"?{B1:"0"}:t0==="RL"?{B3:"0"}:{})})});switchWall(PROJ.walls.length-1);toast("기본값으로 새 옹벽을 추가했습니다.");});
$("wDel").addEventListener("click",()=>{const b=$("wDel");if(PROJ.walls.length<2)return;
  if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="정말 삭제";b.classList.add("danger");setTimeout(()=>{b.dataset.armed="";b.textContent="삭제";b.classList.remove("danger");},3000);return;}
  b.dataset.armed="";b.textContent="삭제";b.classList.remove("danger");
  const gone=PROJ.walls.splice(PROJ.active,1)[0]; PROJ.active=Math.max(0,PROJ.active-1);
  applyValues(normV(PROJ.walls[PROJ.active].values)); $("wName").value=PROJ.walls[PROJ.active].name; renderWallTabs(); toast(`"${gone.name}"을(를) 지웠습니다.`);});

/* 전체 판정표 */
function judgeCells(R){
  const S=R.S, o=v=>v?"O.K":"N.G", sec=k=>{const ds=R.DSN.filter(x=>x.kind===k||x.kind.startsWith(k)), d=ds[0]; if(!d) return {t:"-",ok:true,v:""}; const ok=ds.every(x=>x.allOk); return {t:o(ok),ok,v:`${fx(d.phMn,0)}/${fx(d.Mu,0)}`};};
  const tk=Object.values(R.byDia).reduce((a,v)=>a+v.kgM,0)*(1+R.P.loss/100)/1000;
  return {S,o,sec,tk};
}
function renderCompare(){
  const invalid=[];
  const rows=PROJ.walls.map((w,i)=>{try{const R=computeWall(i);if(!R)throw Error("입력 오류");return {w,i,R};}catch(e){w.ok=false;invalid.push({w,i,error:e.message});return null;}}).filter(Boolean);
  rows.forEach(r=>r.w.ok=allOk(r.R)); renderWallTabs();
  const c=(ok,txt)=>`<td class="${ok?"ok-t":"bad-t"}">${txt}</td>`;
  let h=`<table class="cmp"><thead><tr><th rowspan="2">옹벽</th><th rowspan="2">형식</th><th rowspan="2">H</th><th rowspan="2">B</th><th rowspan="2">배면 성토</th><th colspan="4">상시 (전도·활동·편심·지지력)</th><th colspan="4">지진시</th><th colspan="4">부재 단면</th><th rowspan="2">콘크리트<br>m³/m</th><th rowspan="2">철근<br>t/m</th><th rowspan="2">판정</th></tr>
    <tr><th>전도</th><th>활동</th><th>편심</th><th>지지력</th><th>전도</th><th>활동</th><th>편심</th><th>지지력</th><th>벽체</th><th>앞굽</th><th>뒷굽</th><th>키</th></tr></thead><tbody>`;
  rows.forEach(({w,i,R})=>{const {S,sec,tk}=judgeCells(R), N=S.N, E={...S.E,FSo:Math.min(S.E.FSo,S.Eminus.FSo),FSs:Math.min(S.E.FSs,S.Eminus.FSs),e:Math.abs(S.E.e)>=Math.abs(S.Eminus.e)?S.E.e:S.Eminus.e,qmax:Math.max(S.E.qmax,S.Eminus.qmax),ok:Object.fromEntries(["o","s","e","q"].map(k=>[k,S.E.ok[k]&&S.Eminus.ok[k]]))}, P=R.P;
    h+=`<tr class="${i===PROJ.active?"cur":""}" data-i="${i}"><td class="l"><button type="button" class="linkbtn" data-i="${i}">${esc(w.name)}</button></td><td>${P.wname}</td><td class="n">${fx(P.H,0)}</td><td class="n">${fx(R.G.B,0)}</td><td>${R.G.Hs>0?`1:${P.xr} / ${fx(R.G.Hs,0)}`:"수평"}</td>
      ${c(N.ok.o,fx(N.FSo,2))}${c(N.ok.s,fx(N.FSs,2))}${c(N.ok.e,fx(N.e,2))}${c(N.ok.q,isFinite(N.qmax)?fx(N.qmax,0):"∞")}
      ${c(E.ok.o,fx(E.FSo,2))}${c(E.ok.s,fx(E.FSs,2))}${c(E.ok.e,fx(E.e,2))}${c(E.ok.q,isFinite(E.qmax)?fx(E.qmax,0):"∞")}
      ${["stem","toe","heel","key"].map(k=>{const s=sec(k);return c(s.ok,s.t);}).join("")}
      <td class="n">${fx(R.Q.conc,3)}</td><td class="n">${fx(tk,3)}</td>${c(allOk(R),allOk(R)?"O.K":"N.G")}</tr>`;});
  h+=invalid.map(({w,i,error})=>`<tr><td><button class="linkbtn" data-i="${i}">${esc(w.name)}</button></td><td colspan="19" class="bad-t">입력 오류 · ${esc(error)}</td></tr>`).join("");
  h+=`</tbody></table>`;
  $("cmpTable").innerHTML=h;
  const bad=invalid.length+rows.filter(r=>!allOk(r.R)).length;
  $("cmpNote").textContent=`옹벽 ${PROJ.walls.length}개 ${bad?`중 ${bad}개 N.G`:"모두 O.K"}. 수치는 안전율(전도·활동), 편심(m), 최대 지반반력(kN/m²)입니다. 지진 열은 ±kh 중 불리한 값입니다. 옹벽 이름을 누르면 그 옹벽으로 바뀝니다.`;
}
$("cmpTable").addEventListener("click",ev=>{const b=ev.target.closest("[data-i]");if(b){switchWall(+b.dataset.i);renderCompare();}});
$("btnOptAll").addEventListener("click",()=>{
  const back=PROJ.active, n=PROJ.walls.length;
  for(let i=0;i<n;i++){switchWall(i);optimizeRebar();syncActive();}
  switchWall(back); renderCompare(); toast(`옹벽 ${n}개를 모두 후보 배근 자동 선택으로 바꿨습니다.`);
});
$("btnDocxAll").addEventListener("click",async()=>{
  if(typeof JSZip==="undefined"){toast("압축 라이브러리를 불러오지 못했습니다.");return;}
  syncActive(); const list=PROJ.walls.map((w,i)=>({name:w.name,R:computeWall(i)}));
  try{const blob=await buildDocx(list);save(`옹벽_구조계산서_전체_${list.length}개.docx`,blob);}catch(e){toast("구조계산서를 만들지 못했습니다: "+(e&&e.message||e));}
});
$("btnDxfAll").addEventListener("click",async()=>{
  if(typeof JSZip==="undefined"){toast("압축 라이브러리를 불러오지 못했습니다.");return;}
  syncActive(); const list=PROJ.walls.map((w,i)=>({name:w.name,R:computeWall(i)}));
  const z=new JSZip(); z.file("KDS_검토상태_전체.txt",list.map(({name,R})=>name+"\r\n"+cadStatus(R)).join("\r\n\r\n")); z.file(`옹벽_도면_전체_${list.length}개.dxf`,dxf2DMulti(list));
  z.file(`옹벽_상세도_전체_${list.length}개.dxf`,dxfSheets(list.map(({R},i)=>{const v=PROJ.walls[i].values;return {R,meta:{scale:v.mScale}};})));
  list.forEach(({name,R})=>z.file(`3D/${safeName(name)}_3D_솔리드.lsp`,lisp(R)));
  z.file("읽어보기.txt",`옹벽 도면 (전체 ${list.length}개)\r\n\r\n1) 옹벽_도면_전체.dxf: 옹벽마다 한 줄씩, 왼쪽 일반도 / 오른쪽 배근도\r\n2) 3D 폴더: 옹벽별 LISP. APPLOAD 후 RWALL 입력 -> 3D 솔리드\r\n`);
  save(`옹벽_도면_전체_${list.length}개.zip`,await z.generateAsync({type:"blob"}));
});
const safeName=s=>String(s).replace(/[\\/:*?"<>|\s]+/g,"_");
function dxf2DMulti(list){
  return dxfDoc(api=>{ let ycur=0;
    list.forEach(({name,R})=>{
      const g=drawing(R,"gen"), r=drawing(R,"rebar"), th=g.th, bg=bbox(g.E), br=bbox(r.E);
      const gap=th*8, dxg=-bg[0], dxr=(bg[2]-bg[0])+gap-br[0];
      const rowH=Math.max(bg[3]-bg[1],br[3]-br[1]);
      api.text("TITLE",0,ycur,th*2,`[ ${name} ]`,"l",0);
      const top=ycur-th*3, dyg=top-bg[3], dyr=top-br[3];
      [[g,dxg,dyg],[r,dxr,dyr]].forEach(([dw,dx,dy])=>dw.E.forEach(e=>{
        if(e.t==="pl")api.pl(e.layer,e.pts.map(p=>[p[0]+dx,p[1]+dy]),e.closed);
        else if(e.t==="ci")api.circle(e.layer,e.x+dx,e.y+dy,e.r);
        else if(e.t==="tx")api.text(e.layer,e.x+dx,e.y+dy,e.h,e.s,e.al,e.rot);}));
      ycur=top-rowH-gap*1.5;
    });
  });
}
(function initProject(){
  try{const s=localStorage.getItem("rw-proj-kds20261021"); if(s){const p=JSON.parse(s); if(loadProject(p)&&(p.walls.length>1)) setTimeout(()=>toast(`지난 작업(옹벽 ${p.walls.length}개)을 이어서 엽니다.`),300);}}catch(e){}
  renderWallTabs();
})();

/* ---------- 도면(PDF)에서 옹벽 불러오기 ---------- */
const PDFJS_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", PDFW_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const IMP={rows:[],busy:false,ctrl:null};
const IMPF=[["H","H"],["t1","t1"],["t2","t2"],["nf","전면 1:n"],["B1","앞굽 B1"],["B3","뒷굽 B3"],["D","기초 D"],["D2","뒷굽끝 D2"],["D1","앞굽끝 D1"],["Df","근입 Df"],["bk","키 폭"],["hk","키 깊이"],["kx","키 위치"],["xr","성토 1:x"],["Hs","성토고 Hs"],["q","상재 q"],["lev","버림"]];
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("스크립트를 불러오지 못했습니다"));document.head.appendChild(s);});}
async function ensurePdf(){ if(window.pdfjsLib) return window.pdfjsLib; await loadScript(PDFW_URL); await loadScript(PDFJS_URL);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFW_URL; return window.pdfjsLib; }
const toBlob=(cv,type="image/png",q)=>new Promise(r=>cv.toBlob(r,type,q));
async function canvasImages(cv,maxN){
  const W=cv.width,H=cv.height, out=[];
  const scaled=(sx,sy,sw,sh,maxSide)=>{const k=Math.min(1,maxSide/Math.max(sw,sh)), c=document.createElement("canvas");c.width=Math.round(sw*k);c.height=Math.round(sh*k);
    const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(cv,sx,sy,sw,sh,0,0,c.width,c.height);return toBlob(c,"image/jpeg",0.9);};
  out.push(await scaled(0,0,W,H,1600));
  const ov=0.08, tw=W*(0.5+ov), th=H*(0.5+ov);
  for(const [x,y] of [[0,0],[W-tw,0],[0,H-th],[W-tw,H-th]]) out.push(await scaled(x,y,tw,th,1700));
  return out.slice(0,Math.max(1,maxN));
}
async function pdfPages(file,onPage){
  const lib=await ensurePdf(), doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i), v0=pg.getViewport({scale:1}), sc=3400/Math.max(v0.width,v0.height), vp=pg.getViewport({scale:sc});
    const cv=document.createElement("canvas");cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
    const g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,cv.width,cv.height);
    await pg.render({canvasContext:g,viewport:vp}).promise;
    let text="";try{const tc=await pg.getTextContent();text=tc.items.map(t=>t.str).join(" ").replace(/\s+/g," ").slice(0,3000);}catch(e){}
    await onPage({cv,text,label:`${file.name} ${i}/${doc.numPages}쪽`});}
}
async function imagePage(file,onPage){
  const url=URL.createObjectURL(file); const img=new Image(); await new Promise((r,j)=>{img.onload=r;img.onerror=()=>j(new Error("이미지를 열지 못했습니다"));img.src=url;});
  const cv=document.createElement("canvas");cv.width=img.naturalWidth;cv.height=img.naturalHeight;cv.getContext("2d").drawImage(img,0,0);URL.revokeObjectURL(url);
  await onPage({cv,text:"",label:file.name});
}
function readPrompt(text){return `너는 토목 옹벽 표준도를 읽는 도우미다. 첨부 이미지 1은 도면 한 장 전체이고, 이미지 2~5는 같은 장을 좌상·우상·좌하·우하로 4등분해 확대한 것이다(4장보다 적을 수 있음).
이 장에서 PDF 글자로 뽑힌 내용(치수 숫자는 빠져 있을 수 있음): """${text||"(없음)"}"""

이 장이 캔틸레버식 철근콘크리트 옹벽(역T형 또는 L형) 도면이면, 일반도와 표준단면도의 치수선을 읽어 아래 값을 mm 정수로 채워라. 읽을 수 없거나 도면에 없는 값은 null.
- type: 옹벽 형식. 앞굽과 뒷굽이 모두 있으면 "T"(역T형), 앞굽 없이 뒷굽만 있으면 "L"(L형), 뒷굽 없이 앞굽만 있으면 "RL"(역L형)
- name: 도면 제목 그대로 (예: "L형옹벽 상세도 (9)")
- no: 제목 괄호 안 번호 등 이 도면의 일련번호(숫자). 없으면 null
- H: 옹벽 전체 높이 = 기초 저면부터 벽체 상단까지 (전단키 깊이 제외)
- t1: 벽체 상단 두께
- t2: 벽체 하단 두께 (기초 상면 위치)
- nf: 벽체 전면 경사 1:n 의 n (예: 1:0.02 → 0.02, 수직이면 0)
- B1: 앞굽 길이 = 기초 앞끝 ~ 벽체 전면 하단. L형이면 0
- B3: 뒷굽 길이 = 벽체 배면 하단 ~ 기초 뒤끝
- D: 기초(저판) 두께 (벽체 아래 위치)
- D2: 저판 윗면이 뒷굽 끝으로 갈수록 얇아지면 뒷굽 끝 두께, 일정하면 0
- D1: 저판 윗면이 앞굽 끝으로 갈수록 얇아지면(앞굽 헌치) 앞굽 끝 두께, 일정하면 0
- Df: 근입깊이 = 기초 저면 ~ 전면 지반선
- bk, hk: 전단키 폭과 깊이 (없으면 0), kx: 기초 앞끝 ~ 전단키 앞면 거리
- xr: 배면 성토경사 1:x 의 x (예: 1:1.5 → 1.5), 배면이 수평이면 null
- Hs: 벽체 상단 위로 성토가 올라간 높이 (모르면 null)
- q: 상재하중 kN/m² (예: q=10kN/m² → 10)
- lev: 버림콘크리트 두께
- note: 확실하지 않은 값이나 검산 결과에 대한 짧은 한국어 메모
검산: B1 + t2 + B3 가 기초 전체 폭 치수와 같아야 한다. H 는 벽체 높이 + 기초 두께와 같아야 한다.
옹벽 도면이 아니면 {"isWall":false,"name":"제목"}.
출력은 JSON 객체 하나만: {"isWall":true,"type":"T","name":"...","no":1,"H":0,"t1":0,"t2":0,"nf":0,"B1":0,"B3":0,"D":0,"D2":0,"D1":0,"Df":0,"bk":0,"hk":0,"kx":0,"xr":null,"Hs":null,"q":0,"lev":0,"note":"..."} (숫자는 형식 예시일 뿐이니 도면에서 읽은 값으로 채울 것)`;}
function renderImport(){
  const p=$("impPanel"); p.hidden=false;
  const ok=IMP.rows.filter(r=>r.isWall);
  const list=IMP.rows.map((r,i)=>`<li class="${r.state}">${esc(r.label)} — ${esc(r.msg||"")}</li>`).join("");
  let tbl="";
  if(ok.length){
    tbl=`<div class="tblwrap"><table class="imp"><thead><tr><th>사용</th><th>번호</th><th>탭 이름</th><th>형식</th>${IMPF.map(f=>`<th>${f[1]}</th>`).join("")}<th>메모</th></tr></thead><tbody>`+
      IMP.rows.map((r,i)=>!r.isWall?"":`<tr data-i="${i}"><td><input type="checkbox" data-f="use" ${r.use?"checked":""} aria-label="사용"></td>
        <td><input data-f="no" value="${r.no??""}" class="n3"></td><td><input data-f="name" value="${esc(r.name||"")}" class="nm"></td><td><select data-f="wtype">${[["T","역T형"],["L","L형"],["RL","역L형"]].map(([k,n])=>`<option value="${k}" ${r.wtype===k?"selected":""}>${n}</option>`).join("")}</select></td>
        ${IMPF.map(([k])=>`<td><input data-f="${k}" value="${r.v[k]??""}" class="n3 ${r.v[k]==null?"miss":""}"></td>`).join("")}
        <td class="l note">${esc(r.note||"")}</td></tr>`).join("")+`</tbody></table></div>
      <div class="dl" style="margin-top:8px"><label class="note"><input type="checkbox" id="impOpt" checked> 만든 뒤 전체 후보 배근 자동 선택</label>
      <button class="btn primary" type="button" id="impReplace">옹벽 탭 새로 만들기 (${ok.filter(r=>r.use).length}개)</button>
      <button class="btn" type="button" id="impAppend">기존 탭 뒤에 추가</button></div>
      <p class="note">빈칸(노란색)은 지금 옹벽 값을 그대로 씁니다. 철근은 도면 번호 체계가 달라 읽지 않고, 후보 배근 자동 선택으로 잡습니다. 지반·재료 조건은 지금 옹벽 값을 따릅니다.</p>`;}
  p.innerHTML=`<div class="imp-head"><b>도면에서 옹벽 불러오기</b><button class="btn small" type="button" id="impClose">닫기</button></div>
    <ul class="implist">${list}</ul>${IMP.busy?`<p class="note">도면을 읽는 중입니다. 한 장에 수십 초 걸릴 수 있습니다. <button class="btn small" type="button" id="impStop">중지</button></p>`:""}${tbl}`;
}
$("impFile").addEventListener("change",async ev=>{
  const files=[...ev.target.files]; ev.target.value=""; if(!files.length||IMP.busy) return;
  let sample=null; try{sample=await claude.use("sample");}catch(e){}
  if(!sample){toast(STANDALONE?"도면에서 불러오기는 Claude 안에서 연 화면에서만 됩니다.":"이 화면에서는 Claude에게 도면 읽기를 맡길 수 없습니다.");return;}
  let maxN=0; try{const lim=await sample.limits(); maxN=lim.images?lim.images.maxCount:0;}catch(e){}
  if(!maxN){toast("이 화면에서는 이미지를 Claude에게 보낼 수 없습니다.");return;}
  IMP.rows=[];IMP.busy=true;IMP.ctrl=new AbortController();renderImport();
  const onPage=async({cv,text,label})=>{ if(IMP.ctrl.signal.aborted) return;
    const row={label,state:"run",msg:"읽는 중…",isWall:false,use:true,v:{}}; IMP.rows.push(row); renderImport();
    try{ const imgs=await canvasImages(cv,maxN);
      const j=await sample.json(readPrompt(text),{images:imgs,signal:IMP.ctrl.signal,modelTier:"default"});
      if(!j||!j.isWall){row.state="skip";row.msg=`옹벽 도면이 아님${j&&j.name?` (${j.name})`:""}`;}
      else{ row.isWall=true;row.state="ok";row.name=j.name||label;row.wtype=["T","L","RL"].includes(j.type)?j.type:(+j.B1===0?"L":+j.B3===0?"RL":"T");row.no=j.no??null;row.note=j.note||"";
        IMPF.forEach(([k])=>{const v=j[k];row.v[k]=(v===null||v===undefined||v==="")?null:+v;});
        row.msg=`${row.name} · H ${row.v.H??"?"}`;}
    }catch(e){row.state="err";row.msg=e&&e.code==="cancelled"?"중지함":e&&e.code==="rate_limited"?"요청이 많습니다. 잠시 후 다시 해 보세요.":"읽지 못했습니다 ("+((e&&e.code)||"오류")+")";}
    renderImport(); };
  try{ for(const f of files){ if(IMP.ctrl.signal.aborted) break;
      if(/\.pdf$/i.test(f.name)||f.type==="application/pdf") await pdfPages(f,onPage); else await imagePage(f,onPage); } }
  catch(e){toast("파일을 열지 못했습니다: "+(e&&e.message||e));}
  IMP.busy=false; IMP.rows.sort((a,b)=>(a.isWall===b.isWall?0:a.isWall?-1:1)||((a.no??1e9)-(b.no??1e9))); renderImport();
});
$("impPanel").addEventListener("input",ev=>{const t=ev.target, tr=t.closest("tr[data-i]"); if(!tr)return; const r=IMP.rows[+tr.dataset.i], f=t.dataset.f;
  if(f==="use") r.use=t.checked; else if(f==="name") r.name=t.value; else if(f==="wtype") r.wtype=t.value; else if(f==="no") r.no=t.value===""?null:+t.value;
  else { r.v[f]=t.value===""?null:+t.value; t.classList.toggle("miss",t.value===""); } });
$("impPanel").addEventListener("change",ev=>{ if(ev.target.dataset.f==="wtype"){const tr=ev.target.closest("tr[data-i]");IMP.rows[+tr.dataset.i].wtype=ev.target.value;} if(ev.target.dataset.f==="use") renderImport(); });
$("impPanel").addEventListener("click",ev=>{const id=ev.target.id;
  if(id==="impClose"){ if(IMP.ctrl) IMP.ctrl.abort(); $("impPanel").hidden=true; }
  else if(id==="impStop"){ IMP.ctrl.abort(); }
  else if(id==="impReplace"||id==="impAppend") impApply(id==="impReplace");});
function impApply(replace){
  syncActive();
  const base=normV(PROJ.walls[PROJ.active].values);
  const sel=IMP.rows.filter(r=>r.isWall&&r.use).sort((a,b)=>(a.no??1e9)-(b.no??1e9));
  if(!sel.length){toast("만들 옹벽을 하나 이상 고르세요.");return;}
  const used=new Set(replace?[]:PROJ.walls.map(w=>w.name));
  const walls=sel.map(r=>{const v={...base}; IMPF.forEach(([k])=>{ if(r.v[k]!=null&&isFinite(r.v[k])) v[k]=String(r.v[k]); });
    v.wtype=r.wtype||"T"; if(v.wtype==="L") v.B1="0"; if(v.wtype==="RL") v.B3="0";
    if(r.v.xr==null&&r.v.Hs==null){ v.Hs="0"; }
    if(+v.bk<=0||+v.hk<=0){ v.bk="0"; v.hk="0"; }
    let name=r.name||"옹벽"; if(used.has(name)) name+=` H${(+v.H/1000).toFixed(1)}`; let k=2,n0=name; while(used.has(name)) name=`${n0} (${k++})`; used.add(name);
    return {name,values:v};});
  if(replace) PROJ={walls,active:0}; else { PROJ.walls.push(...walls); }
  const first=replace?0:PROJ.walls.length-walls.length;
  PROJ.active=first; applyValues(PROJ.walls[first].values); $("wName").value=PROJ.walls[first].name; renderWallTabs();
  if($("impOpt")&&$("impOpt").checked){ const back=PROJ.active; for(let i=first;i<PROJ.walls.length;i++){switchWall(i);optimizeRebar();syncActive();} switchWall(back); }
  $("impPanel").hidden=true;
  toast(`옹벽 ${walls.length}개를 번호순으로 만들었습니다. '전체 옹벽' 탭에서 판정을 확인하세요.`);
}

try{const t=localStorage.getItem("rw-tab-kds20261021");if(t&&t!=="gen"){/* 탭 복원은 렌더 후 */ setTimeout(()=>{const b=document.querySelector(`.tab[data-t="${t}"]`);b&&b.click();},0);}}catch(e){}
if(STANDALONE){
  const label=document.querySelector('label[for="impFile"]');
  label.textContent="PDF 자동 읽기 · Claude 연결 필요";
  label.title="일반 브라우저에서는 자동 도면 읽기를 사용할 수 없습니다.";
  label.style.opacity=".55";label.style.cursor="not-allowed";
  $("impFile").disabled=true;
}
document.addEventListener("click",ev=>{
  const button=ev.target.closest("#btnDxf,#btnDocx,#btnXlsx,#btnDocxAll,#btnDxfAll,#btnOptAll");
  if(!button)return;
  run();
  try{
    const list=button.id.endsWith("All")?PROJ.walls.map((w,i)=>computeWall(i)):[CUR];
    if(list.some(R=>!R||R.invalidContact))throw Error("유효한 기초 접촉과 입력을 확인하세요.");
  }catch(e){ev.preventDefault();ev.stopImmediatePropagation();toast("入力または基礎接触に問題があるため構造出力を中止しました。");}
},true);
try{
 if(localStorage.getItem("rw-main-spacing-125-250-v1")!=="done"){
  for(const wall of PROJ.walls)for(const m of MAIN_MARKS){const id="s_"+m,v=Number(wall.values[id]);if(m==="W8"&&!(v>0))continue;if(!MAIN_SPACING.includes(v))wall.values[id]="250";}
  const active=PROJ.walls[PROJ.active];for(const m of MAIN_MARKS){const id="s_"+m;if(active.values[id]!=null)$(id).value=active.values[id];}
  $("s_W4").value=$("s_W1").value;active.values.s_W4=$("s_W4").value;
  syncActive();persistLocal();localStorage.setItem("rw-main-spacing-125-250-v1","done");
 }
}catch(e){}
try{
 if(localStorage.getItem("rw-horizontal-spacing-200-400-v1")!=="done"){
  for(const wall of PROJ.walls)for(const m of HORIZONTAL_MARKS){const id="s_"+m;if(!horizontalSpacing(m).includes(Number(wall.values[id])))wall.values[id]="200";}
  const active=PROJ.walls[PROJ.active];for(const m of HORIZONTAL_MARKS)$("s_"+m).value=active.values["s_"+m];
  syncActive();persistLocal();localStorage.setItem("rw-horizontal-spacing-200-400-v1","done");
 }
}catch(e){}
try{
 if(localStorage.getItem("rw-bottom-spacing-200-250-v1")!=="done"){
  for(const wall of PROJ.walls)if(!horizontalSpacing("F3").includes(Number(wall.values.s_F3)))wall.values.s_F3="200";
  $("s_F3").value=PROJ.walls[PROJ.active].values.s_F3;
  syncActive();persistLocal();localStorage.setItem("rw-bottom-spacing-200-250-v1","done");
 }
}catch(e){}
try{
 if(localStorage.getItem("rw-paired-distribution-v1")!=="done"){
  for(const wall of PROJ.walls)for(const pair of BAR_PAIRS){const s=horizontalSpacing(pair[0]).includes(Number(wall.values["s_"+pair[0]]))?wall.values["s_"+pair[0]]:"200";for(const m of pair)wall.values["s_"+m]=s;}
  for(const pair of BAR_PAIRS)for(const m of pair)$("s_"+m).value=PROJ.walls[PROJ.active].values["s_"+m];
  syncActive();persistLocal();localStorage.setItem("rw-paired-distribution-v1","done");
 }
}catch(e){}
$("d_W8").value=$("d_W1").value;
// 단축키: , . = 옹벽 탭 이전/다음 (같은 형식 안), Shift+, . = 형식 탭(L형·역L형·역T형), [ ] = 출력 탭(일반도·배근도…)
//  입력칸에서 글자를 넣는 중에는 Alt를 함께 누름 (Alt+, Alt+. Alt+[ Alt+])
document.addEventListener("keydown",ev=>{
  if(ev.ctrlKey||ev.metaKey) return;
  const el=ev.target, typing=el&&(el.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName));
  if(typing&&!ev.altKey) return;
  const c=ev.code, dir=(c==="Comma"||c==="BracketLeft")?-1:(c==="Period"||c==="BracketRight")?1:0; if(!dir) return;
  if(c==="BracketLeft"||c==="BracketRight"){ const tabs=[...document.querySelectorAll(".tabs .tab")], k=tabs.findIndex(t=>t.getAttribute("aria-selected")==="true");
    const n=tabs[(k+dir+tabs.length)%tabs.length]; if(n){ ev.preventDefault(); n.click(); n.focus({preventScroll:true}); } return; }
  ev.preventDefault();
  if(ev.shiftKey){ const types=TORD.filter(t=>PROJ.walls.some((w,i)=>wType(i)===t)), k=types.indexOf(wType(PROJ.active)); if(types.length<2) return;
    const t=types[(k+dir+types.length)%types.length], l=LASTOF[t], i=(l!=null&&PROJ.walls[l]&&wType(l)===t)?l:PROJ.walls.findIndex((w,j)=>wType(j)===t);
    if(i>=0){ switchWall(i); toast(`${TNAME[t]} · ${PROJ.walls[i].name}`); } return; }
  const t=wType(PROJ.active), idx=PROJ.walls.map((w,i)=>i).filter(i=>wType(i)===t), k=idx.indexOf(PROJ.active), n=idx[(k+dir+idx.length)%idx.length];
  if(n!=null&&n!==PROJ.active){ switchWall(n); const b=document.querySelector(`.wtab[data-i="${n}"]`); if(b) b.scrollIntoView({block:"nearest"}); }
});
run();
