"use strict";
/* 옹벽 설계도구 · 설계 저장·불러오기(계정 저장소·파일) · 구글 드라이브 저장 */
/* ---------- 설계 저장 · 불러오기 ---------- */
const SV={db:null,uid:null,col:null,list:[],unsub:null};
function formValues(){const v={};document.querySelectorAll("#frm input[id],#frm select[id],#commonGroundPanel input[id],#commonGroundPanel select[id]").forEach(el=>{v[el.id]=el.value;});return v;}
function applyValues(v){v=sameBackDia(v);if(v.v_W7==null)v={...v,v_W7:""};for(const pair of BAR_PAIRS){const source=pair.find(m=>v["s_"+m]!=null);if(source)for(const m of pair)v["s_"+m]=v["s_"+source];}let n=0;for(const k in v){const el=$(k);if(el&&el.closest&&(el.closest("#frm")||el.closest("#commonGroundPanel"))){el.value=k.startsWith("d_")&&v[k]==="H10"?"H13":v[k];n++;}}syncTypeUI();run();return n;}
function syncTypeUI(){const t=$("wtype").value||"T";
  document.querySelectorAll(".wt").forEach(b=>b.setAttribute("aria-pressed",b.dataset.wt===t?"true":"false"));
  $("B1").disabled=t==="L"; $("B3").disabled=t==="RL";
  if(t==="L")$("B1").value="0"; if(t==="RL")$("B3").value="0";}
// 형식 버튼: 그 형식 탭으로 이동만 함 (없으면 그 형식의 새 옹벽을 추가). 지금 옹벽의 형식은 바꾸지 않음
document.querySelector(".wtypes").addEventListener("click",ev=>{const b=ev.target.closest(".wt");if(!b)return;const t=b.dataset.wt; if(t===wType(PROJ.active))return;
  const l=LASTOF[t], i=(l!=null&&PROJ.walls[l]&&wType(l)===t)?l:PROJ.walls.findIndex((w,k)=>wType(k)===t);
  if(i>=0){ switchWall(i); return; }
  syncActive(); PROJ.walls.push({name:`${TNAME[t]} 1`,values:normV({...DEFAULTS,wtype:t,...(t==="L"?{B1:"0"}:t==="RL"?{B3:"0"}:{})})}); switchWall(PROJ.walls.length-1); toast(`${TNAME[t]} 옹벽이 없어 새로 하나 추가했습니다.`);});
// 형식 변경은 별도 메뉴에서만 (현재 옹벽을 다른 형식으로 바꾸면 그 형식 탭으로 옮겨짐)
$("wConv").addEventListener("change",ev=>{const t=ev.target.value; ev.target.value=""; if(!t) return; convertType(t);});
function convertType(t){ const prev=$("wtype").value; if(t===prev)return;
  const H=num("H"), r50=v=>Math.round(v/50)*50, t2=num("t2");
  if(prev==="L"&&num("B1")<=0) $("B1").value=t==="RL"?Math.max(300,num("B3")):Math.max(300,r50(0.15*H));
  if(prev==="RL"&&num("B3")<=0) $("B3").value=t==="L"?Math.max(300,num("B1")):Math.max(300,r50(0.4*H));
  if(t==="L"){ if(prev==="RL") $("B3").value=Math.max(300,num("B1")); }
  if(t==="RL"){ if(prev==="L") $("B1").value=Math.max(300,num("B3")); }
  $("wtype").value=t; syncTypeUI();
  const kx=num("kx"), B=num("B1")+t2+num("B3"); if(kx+num("bk")>B) $("kx").value=Math.max(0,B-num("bk"));
  { const w=PROJ.walls[PROJ.active]; if(/^(L형|역T형|역L형) \d+$/.test(w.name)){ w.name=`${TNAME[t]} ${PROJ.walls.filter((x,i)=>i!==PROJ.active&&wType(i)===t).length+1}`; $("wName").value=w.name; } }
  run(); syncActive(); renderWallTabs(); toast(`${{T:"역T형",L:"L형",RL:"역L형"}[t]}으로 바꿨습니다. 위쪽 ${TNAME[t]} 탭으로 옮겨졌습니다.`);}
function svDate(t){try{return new Date(t).toLocaleString("ko-KR",{year:"2-digit",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}catch(e){return "";}}
function svSummary(d){ if(d.walls&&d.walls.length){const hs=d.walls.map(w=>+w.values.H);return `옹벽 ${d.walls.length}개 · H ${Math.min(...hs)}${hs.length>1&&Math.max(...hs)!==Math.min(...hs)?"~"+Math.max(...hs):""}`;}
  const v=d.values||{}; return `H ${v.H} · B ${(+v.B1)+(+v.t2)+(+v.B3)} · 성토 1:${v.xr}/${v.Hs}`;}
function renderSaved(){
  const box=$("svList");
  if(!SV.col){box.innerHTML=`<p class="note">이 화면에서는 claude 계정 저장소를 쓸 수 없습니다. 구글 드라이브나 이 PC 파일 저장을 쓰세요.</p>`;return;}
  if(!SV.list.length){box.innerHTML=`<p class="note">저장한 설계가 없습니다. 이름을 넣고 저장하면 여기에 쌓입니다.</p>`;return;}
  box.innerHTML=SV.list.map(d=>`<div class="sv-row" data-id="${esc(d.id)}">
    <div class="sv-meta"><b>${esc(d.name||"이름 없음")}</b><small>${esc(svDate(d.savedAt))} · ${esc(svSummary(d))}</small></div>
    <div class="sv-btns"><button type="button" class="btn small" data-act="load">불러오기</button><button type="button" class="btn small" data-act="over">덮어쓰기</button><button type="button" class="btn small" data-act="del">삭제</button></div></div>`).join("");
}
async function svInit(){
  try{
    const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);
    if(!db||!user){renderSaved();return;}
    const uid=await user.id(); if(!uid){renderSaved();return;}
    SV.db=db;SV.uid=uid;SV.col=db.collection("data/users/"+uid);
    $("svBtn").disabled=false;
    SV.unsub=SV.col.orderBy("savedAt","desc").onSnapshot(snap=>{SV.list=snap.docs.map(s=>({id:s.id,...s.data()}));renderSaved();},
      e=>{SV.col=null;$("svBtn").disabled=true;renderSaved();});
  }catch(e){renderSaved();}
}
$("svBtn").addEventListener("click",async()=>{
  if(!SV.col)return;
  const name=svDefName();
  const same=SV.list.find(d=>d.name===name);
  $("svBtn").disabled=true;
  try{ const ref=same?SV.col.doc(same.id):SV.col.doc();
    await ref.set({name,savedAt:Date.now(),...projectData()});
    $("svName").value=""; toast((same?`"${name}"을(를) 새 값으로 덮어썼습니다`:`"${name}"으로 저장했습니다`)+` (옹벽 ${PROJ.walls.length}개).`);
  }catch(e){toast(e&&e.code==="quota_exceeded"?"저장 공간이 가득 찼습니다. 안 쓰는 설계를 지우세요.":"저장하지 못했습니다. 잠시 후 다시 시도하세요.");}
  finally{$("svBtn").disabled=false;}
});
$("svName").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("svBtn").click();}});
$("svList").addEventListener("click",async ev=>{
  const b=ev.target.closest("[data-act]");if(!b)return;
  const row=b.closest(".sv-row"), id=row.dataset.id, d=SV.list.find(x=>x.id===id); if(!d)return;
  const act=b.dataset.act;
  if(act==="load"){ if(d.walls) loadProject(d); else loadProject({walls:[{name:d.name,values:d.values||{}}]}); persistLocal(); svHide(); toast(`"${d.name}"(옹벽 ${PROJ.walls.length}개)을(를) 불러왔습니다.`);return;}
  if((act==="del"||act==="over")&&b.dataset.armed!=="1"){
    const lbl=b.textContent;b.dataset.armed="1";b.textContent=act==="del"?"정말 삭제":"정말 덮어쓰기";b.classList.add("danger");
    setTimeout(()=>{b.dataset.armed="";b.textContent=lbl;b.classList.remove("danger");},3000);return;}
  try{
    if(act==="del"){await SV.col.doc(id).delete();toast(`"${d.name}"을(를) 지웠습니다.`);}
    else {await SV.col.doc(id).set({name:d.name,savedAt:Date.now(),...projectData()});toast(`"${d.name}"을(를) 지금 값으로 덮어썼습니다.`);}
  }catch(e){toast("처리하지 못했습니다. 잠시 후 다시 시도하세요.");}
});
$("svExport").addEventListener("click",()=>{
  const name=svDefName().replace(/[\\/:*?"<>|]/g,"_");
  save(`${name}.json`,JSON.stringify({app:"옹벽 설계도구",version:2,savedAt:new Date().toISOString(),...projectData()},null,2));
});
$("svImport").addEventListener("change",ev=>{
  const f=ev.target.files&&ev.target.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{try{const j=JSON.parse(rd.result);
      const ws=j.walls?(j.walls||[]).filter(w=>w&&w.values):(j.values||Object.keys(j).some(k=>$(k))?[{name:j.name||f.name.replace(/\.json$/i,""),values:j.values||j}]:[]);
      if(!ws.length){toast("이 파일에는 옹벽 입력값이 없습니다.");return;}
      askImport(f.name,ws,j);}
    catch(e){toast("파일을 읽지 못했습니다. 이 도구에서 내보낸 .json 파일인지 확인하세요.");}
    ev.target.value="";};
  rd.readAsText(f);
});
// 가져오기: 지금 옹벽 목록에 추가할지, 목록을 통째로 바꿀지 고름 (기본 = 추가)
function askImport(fname,ws,j){
  const box=$("impAsk"); box.hidden=false; svShow();
  box.innerHTML=`<b>${esc(fname)}</b> · 옹벽 ${ws.length}개<br>지금 목록(${PROJ.walls.length}개)에 어떻게 넣을까요?
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn small primary" data-imp="add">목록 뒤에 추가</button><button type="button" class="btn small" data-imp="rep">목록 통째로 바꾸기</button><button type="button" class="btn small" data-imp="no">취소</button></div>`;
  box.onclick=ev=>{const b=ev.target.closest("[data-imp]"); if(!b) return; box.hidden=true; box.onclick=null; const a=b.dataset.imp;
    if(a==="no") return;
    if(a==="rep"){ loadProject(j.walls?j:{walls:ws}); persistLocal(); toast(`${fname}의 옹벽 ${PROJ.walls.length}개로 바꿨습니다.`); return; }
    syncActive(); const names=new Set(PROJ.walls.map(w=>w.name)), first=PROJ.walls.length;
    ws.forEach((w,i)=>{ let nm=w.name||`옹벽 ${first+i+1}`; if(names.has(nm)){ let k=2; while(names.has(`${nm} (${k})`)) k++; nm=`${nm} (${k})`; } names.add(nm);
      PROJ.walls.push({name:nm,values:normV(w.values)}); });
    switchWall(first); persistLocal(); toast(`${fname}에서 옹벽 ${ws.length}개를 목록 뒤에 추가했습니다 (전체 ${PROJ.walls.length}개).`); };
}

/* ---------- 구글 드라이브 저장: 사용자의 Google Drive 커넥터로 "내 드라이브 › - GitHub 작업 - › 옹벽 설계도구" 폴더에 .wall.json 파일 (발전량·우수 도구와 같은 방식) ---------- */
const GD={server:"Google Drive",parent:"- GitHub 작업 -",folderName:"옹벽 설계도구",folder:null,where:null,list:null,busy:false};
async function gdCall(tool,input){ const mcp=window.claude&&window.claude.use?await window.claude.use("mcp"):null; if(!mcp) throw {code:"not_granted"};
  const r=await mcp.callTool(GD.server,tool,input,{cache:false}); return {payload:r.payload,result:r}; }
function gdErr(e){const c=e&&e.code; return c==="needs_reauth"?"구글 드라이브 연결이 만료되었습니다. claude.ai 설정 → 커넥터에서 Google Drive를 다시 연결해 주세요.":c==="server_not_connected"?"claude.ai 설정 → 커넥터에서 Google Drive를 추가해 주세요.":(c==="approval_required"||c==="not_in_manifest"||c==="consent_required")?"이 도구가 구글 드라이브를 쓰도록 허용해야 합니다(허용 창에서 \"허용\").":c==="selection_required"?"연결된 Google Drive가 여러 개라 하나를 골라야 합니다.":(c==="not_granted"||c==="capability_disabled")?"이 화면에서는 구글 드라이브를 쓸 수 없습니다(claude.ai에서 도구를 열어 주세요).":(e&&(e.message||e.code))||String(e);}
async function gdFolder(){ if(GD.folder) return GD.folder;
  const q=t=>`title = '${t}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const par=((await gdCall("search_files",{query:q(GD.parent),excludeContentSnippets:true,pageSize:5})).payload||{}).files||[], pid=par[0]&&par[0].id;
  const fd=((await gdCall("search_files",{query:q(GD.folderName)+(pid?` and parentId = '${pid}'`:""),excludeContentSnippets:true,pageSize:5})).payload||{}).files||[];
  let id=fd[0]&&fd[0].id;
  if(!id){ const c=(await gdCall("create_file",{title:GD.folderName,contentMimeType:"application/vnd.google-apps.folder",...(pid?{parentId:pid}:{})})).payload||{}; id=c.id; }
  if(!id) throw new Error("구글 드라이브 폴더를 만들지 못했습니다");
  GD.folder=id; GD.where=pid?`내 드라이브 › ${GD.parent} › ${GD.folderName}`:`내 드라이브 › ${GD.folderName}`; $("gdWhere").textContent=GD.where; return id; }
const gdB64=b=>{const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u);};
function renderGD(msg){ const box=$("gdList");
  if(msg){box.innerHTML=`<p class="note">${esc(msg)}</p>`;return;}
  if(!GD.list) return;
  if(!GD.list.length){box.innerHTML=`<p class="note">드라이브에 저장한 설계가 없습니다.</p>`;return;}
  box.innerHTML=GD.list.map(d=>`<div class="sv-row" data-gid="${esc(d.id)}"><div class="sv-meta"><b>${esc(d.name)}</b><small>${esc(svDate(d.ts))}${d.size?" · "+Math.round(d.size/1024)+" KB":""}${d.url?` · <a href="${esc(d.url)}" target="_blank" rel="noopener">드라이브에서 보기</a>`:""}</small></div>
    <div class="sv-btns"><button type="button" class="btn small" data-gact="load">불러오기</button><button type="button" class="btn small" data-gact="over">덮어쓰기</button><button type="button" class="btn small" data-gact="del">삭제</button></div></div>`).join(""); }
async function gdRefresh(){ renderGD("구글 드라이브 목록을 읽는 중…");
  try{ const folder=await gdFolder();
    const fs=((await gdCall("search_files",{query:`parentId = '${folder}' and trashed = false and title contains '.wall.json'`,excludeContentSnippets:true,pageSize:100})).payload||{}).files||[];
    GD.list=fs.map(x=>({id:x.id,name:String(x.title||"").replace(/\.wall\.json$/i,""),ts:Date.parse(x.modifiedTime)||0,size:+x.fileSize||0,url:x.viewUrl})).sort((a,b)=>b.ts-a.ts);
    renderGD(); }
  catch(e){ GD.list=null; renderGD("구글 드라이브를 쓸 수 없습니다: "+gdErr(e)); } }
async function gdPut(name,oldId){ const folder=await gdFolder();
  const data=JSON.stringify({app:"옹벽 설계도구",version:2,savedAt:new Date().toISOString(),...projectData()});
  if(new TextEncoder().encode(data).length>700000) throw new Error("저장본이 너무 커서 드라이브로 바로 올릴 수 없습니다. \"파일로 내보내기\" 후 드라이브에 올려 주세요.");
  await gdCall("create_file",{title:name.replace(/[\\/]/g,"_")+".wall.json",parentId:folder,contentMimeType:"application/json",disableConversionToGoogleType:true,textContent:data});
  if(oldId) await gdCall("trash_file",{fileId:oldId});   /* 덮어쓰기 = 새 파일 저장 후 이전 파일은 드라이브 휴지통으로 */ }
$("gdRefresh").addEventListener("click",gdRefresh);
$("gdSave").addEventListener("click",async()=>{ if(GD.busy)return;
  const name=svDefName();
  GD.busy=true; $("gdSave").disabled=true; renderGD("구글 드라이브에 저장하는 중…");
  try{ if(!GD.list) { try{ await gdRefresh(); }catch(e){} }
    const same=(GD.list||[]).find(d=>d.name===name);
    await gdPut(name,same&&same.id); $("svName").value=""; toast((same?`"${name}"을(를) 구글 드라이브에 덮어썼습니다`:`"${name}"을(를) 구글 드라이브에 저장했습니다`)+` (옹벽 ${PROJ.walls.length}개).`); }
  catch(e){ toast("구글 드라이브에 저장하지 못했습니다: "+gdErr(e)); }
  finally{ GD.busy=false; $("gdSave").disabled=false; await gdRefresh(); } });
$("gdList").addEventListener("click",async ev=>{ const b=ev.target.closest("[data-gact]"); if(!b||GD.busy)return;
  const id=b.closest(".sv-row").dataset.gid, d=(GD.list||[]).find(x=>x.id===id); if(!d)return; const act=b.dataset.gact;
  if(act!=="load"&&b.dataset.armed!=="1"){ const lbl=b.textContent; b.dataset.armed="1"; b.textContent=act==="del"?"정말 삭제":"정말 덮어쓰기"; b.classList.add("danger");
    setTimeout(()=>{b.dataset.armed="";b.textContent=lbl;b.classList.remove("danger");},3000); return; }
  GD.busy=true;
  try{
    if(act==="load"){ const {payload,result}=await gdCall("download_file_content",{fileId:id});
      let txt=payload&&typeof payload.content==="string"?gdB64(payload.content):null;
      if(txt==null){ const blk=(result.content||[]).find(c=>c.resource&&(c.resource.blob||c.resource.text)); if(blk) txt=blk.resource.text||gdB64(blk.resource.blob); else if(typeof payload==="string") txt=payload; }
      if(txt==null) throw new Error("파일 내용을 받지 못했습니다");
      const j=JSON.parse(txt); if(!j.walls||!j.walls.length) throw new Error("이 파일에는 옹벽 입력값이 없습니다");
      loadProject(j); persistLocal(); svHide(); toast(`"${d.name}"(옹벽 ${PROJ.walls.length}개)을(를) 구글 드라이브에서 불러왔습니다.`); }
    else if(act==="over"){ await gdPut(d.name,id); toast(`"${d.name}"을(를) 지금 값으로 덮어썼습니다.`); }
    else { await gdCall("trash_file",{fileId:id}); toast(`"${d.name}"을(를) 드라이브 휴지통으로 옮겼습니다.`); }
  }catch(e){ toast("처리하지 못했습니다: "+gdErr(e)); }
  finally{ GD.busy=false; if(act!=="load") await gdRefresh(); } });

svInit();

/* ---------- 전체 옹벽 저장 · 불러오기 창: 형식 탭과 관계없이 옹벽 전부를 한 묶음으로 ---------- */
function svCountText(){ syncActive(); const c={T:0,L:0,RL:0}; PROJ.walls.forEach((w,i)=>{c[wType(i)]=(c[wType(i)]||0)+1;});
  return `옹벽 ${PROJ.walls.length}개 (`+["T","L","RL"].filter(t=>c[t]).map(t=>`${TNAME[t]} ${c[t]}`).join(" · ")+")"; }
function svDefName(){ return $("svName").value.trim()||`옹벽 전체 ${PROJ.walls.length}개 ${svDate(Date.now())}`; }
function svShow(){ const m=$("svModal"); const first=m.hidden; m.hidden=false;
  $("svAll").textContent=`지금 열려 있는 ${svCountText()}를 한 번에 저장합니다. 불러오면 지금 목록 전체가 저장본으로 바뀝니다.`;
  if(first&&!GD.list&&!GD.busy) gdRefresh(); }
function svHide(){ $("svModal").hidden=true; }
$("svOpen").addEventListener("click",svShow);
$("svClose").addEventListener("click",svHide);
$("svModal").addEventListener("click",ev=>{ if(ev.target===$("svModal")) svHide(); });
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!$("svModal").hidden) svHide(); });
function svCntUpdate(){ const e=$("svCnt"); if(e) e.textContent=`(옹벽 ${PROJ.walls.length}개)`; }
