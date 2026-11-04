"use strict";
/* 옹벽 설계도구 · 일반도 치수 직접 수정 · 후보 배근 자동 선택 · N.G 해결 팁 · 여유 치수 제안 */
/* ---------- 일반도 치수 직접 수정 ---------- */
const EDIT={
  B1:{id:"B1",n:"앞굽길이"},t2:{id:"t2",n:"벽체 하단두께"},B3:{id:"B3",n:"뒷굽길이"},t1:{id:"t1",n:"벽체 상단두께"},
  H:{id:"H",n:"전체높이"},D:{id:"D",n:"기초두께"},D2:{id:"D2",n:"뒷굽 끝 두께"},D1:{id:"D1",n:"앞굽 끝 두께"},Df:{id:"Df",n:"근입깊이"},Hs:{id:"Hs",n:"성토높이"},
  bk:{id:"bk",n:"전단키 폭"},hk:{id:"hk",n:"전단키 깊이"},kx:{id:"kx",n:"키 위치"},nf:{id:"nf",n:"전면경사 n"},xr:{id:"xr",n:"성토경사 x"},
  B:{n:"기초폭",get:()=>CUR.G.B,set:v=>{$("B3").value=v-num("B1")-num("t2");}},
  hs:{n:"벽체높이",get:()=>CUR.G.hs,set:v=>{$("H").value=v+num("D");}}
};
let edKey=null;
function openEditor(t){
  const k=t.dataset.k, ed=EDIT[k]; if(!ed)return;
  const wrap=$("genWrap"), inp=$("dimEdit"), wr=wrap.getBoundingClientRect(), r=t.getBoundingClientRect();
  edKey=k; inp.hidden=false;
  inp.value=ed.get?ed.get():$(ed.id).value;
  inp.title=ed.n;
  inp.style.left=Math.max(4,r.left-wr.left+wrap.scrollLeft+r.width/2-48)+"px";
  inp.style.top=Math.max(4,r.top-wr.top+wrap.scrollTop+r.height/2-16)+"px";
  inp.focus(); inp.select();
}
function closeEditor(apply){
  const inp=$("dimEdit"); if(!edKey)return;
  const k=edKey, ed=EDIT[k], v=parseFloat(inp.value); edKey=null; inp.hidden=true;
  if(!apply||!isFinite(v))return;
  if(ed.set)ed.set(v); else $(ed.id).value=v;
  run(); toast(`${ed.n} = ${v.toLocaleString("ko-KR")} 로 바꿨습니다.`);
}
$("svgGen").addEventListener("click",ev=>{const t=ev.target.closest("[data-k]");if(t)openEditor(t);});
$("svgGen").addEventListener("keydown",ev=>{const t=ev.target.closest&&ev.target.closest("[data-k]");if(t&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();openEditor(t);}});
$("dimEdit").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();closeEditor(true);}else if(ev.key==="Escape"){ev.preventDefault();closeEditor(false);}});
$("dimEdit").addEventListener("blur",()=>closeEditor(true));

/* ---------- 후보 배근 자동 선택 ---------- */
function optimizeRebar(){
  const SP=MAIN_SPACING, DIAS=["H13","H16","H19","H22","H25","H29","H32"];
  const cand=(dms,sps)=>{const c=[];dms.forEach(dk=>sps.forEach(sp=>c.push({dk,sp,kg:BARS[dk].w*1000/sp})));return c.sort((a,b)=>a.kg-b.kg||b.sp-a.sp);};
  const MK=["W1","W8","W2","W3","W5","W4","F1","F2","F3","F4","K1","K2"];
  const before={};MK.forEach(m=>before[m]=$("d_"+m).value+"@"+$("s_"+m).value);
  const main=cand(DIAS,SP), msg=[], fail=[];
  const set=(m,c)=>{if(m==="W1"||m==="W8")for(const id of ["d_W1","d_W8"])$(id).value=c.dk; if(m==="F1"||m==="FT")for(const id of ["d_F1","d_FT"])if($(id))$(id).value=c.dk;$("d_"+m).value=c.dk;$("s_"+m).value=c.sp;};
  const tryMark=(m,ok)=>{const old={dk:$("d_"+m).value,sp:num("s_"+m)};
    for(const c of main){set(m,c);if(ok(compute()))return c;}
    set(m,old);fail.push(m);return null;};
  const okMark=m=>R=>R.DSN.filter(d=>d.mark===m).every(d=>d.allOk);
  const r1=tryMark("W1",okMark("W1")), r2=tryMark("F2",okMark("F2")), r3=tryMark("F1",okMark("F1"));
  const P=compute().P, t2=P.t2, tav=(P.t1+P.t2)/2;
  const byArea=(m,Areq,sps,dms=["H13","H16","H19"])=>{const limit=["W3","W5"].includes(m)?Math.min(300,3*Math.min(P.t1,P.t2)):["F3","F4"].includes(m)?Math.min(450,5*P.D2):Infinity;const c=cand(dms,sps).find(c=>c.sp<=limit&&AS[c.dk]*1000/c.sp>=Areq);if(c)set(m,c);else fail.push(m);return c;};
  const w1s=num("s_W1");
  tryMark("W2",okMark("W2"));
  const choosePair=(a,b,reqA,reqB,limit)=>{const cs=[];for(const s of horizontalSpacing(a))for(const da of DIAS)for(const db of DIAS)if(s<=limit&&AS[da]*1000/s>=reqA&&AS[db]*1000/s>=reqB&&(!["W3","W5"].includes(a)||(AS[da]+AS[db])*1000/s>=(([da,db].every(d=>BARS[d].d<=16)&&P.steel!=="SD300")?.002:.0025)*1000*Math.max(P.t1,P.t2)))cs.push({s,da,db,kg:(BARS[da].w+BARS[db].w)*1000/s});cs.sort((x,y)=>x.kg-y.kg||y.s-x.s);if(cs.length){set(a,{dk:cs[0].da,sp:cs[0].s});set(b,{dk:cs[0].db,sp:cs[0].s});}else fail.push(DM(a)+"/"+DM(b));};
  choosePair("W3","W5",Math.max(500,.001*1000*Math.max(P.t1,P.t2)),.001*1000*Math.max(P.t1,P.t2),Math.min(300,3*Math.min(P.t1,P.t2)));
  const slabHalf=Math.min(kdsSlabRho(P.steel==="SD500"?500:400)*1000*P.D,1800)/2;
  choosePair("F3","F4",slabHalf,slabHalf,Math.min(450,5*P.D2));
  for(let it=0;it<2;it++){
    tryMark("F1",R=>okMark("F1")(R)&&AS[R.P.bar.F1.dia]*1000/R.P.bar.F1.s>=AS[R.P.bar.F2.dia]*1000/R.P.bar.F2.s/3);
    tryMark("F2",R=>okMark("F2")(R)&&AS[R.P.bar.F2.dia]*1000/R.P.bar.F2.s>=AS[R.P.bar.F1.dia]*1000/R.P.bar.F1.s/3);
  }
  // W4 뚜껑철근: 조립용 → 가장 가는 철근(H13), W1과 같은 간격
  set("W4",{dk:"H13",sp:w1s});
  if(compute().G.hasKey){
    tryMark("K1",okMark("K1"));
    byArea("K2",0.001*1000*P.bk,[150,200,250,300]);
  }
  run();
  const changed=[];
  MK.forEach(m=>{const now=$("d_"+m).value+"@"+$("s_"+m).value;
    ["d_","s_"].forEach(k=>{const el=$(k+m);el.dispatchEvent(new Event("change",{bubbles:false}));});
    if(now!==before[m]){changed.push(`${DM(m)} <b>${before[m]}</b> → <b>${now}</b>`);
      ["d_","s_"].forEach(k=>{const el=$(k+m);el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),2500);});}});
  const box=$("optResult"); box.hidden=false;
  const tk=Object.values(CUR.byDia).reduce((a,v)=>a+v.kgM,0);
  box.innerHTML=(changed.length?`바뀐 배근 ${changed.length}개<br>${changed.join("<br>")}`:"후보 배근 범위에서 변경할 항목이 없습니다. 전역 최적해를 보장하지 않습니다.")
    +(fail.length?`<br>${fail.join("·")}: 조건을 만족하는 배근이 없어 그대로 두었습니다. 단면을 키우세요.`:"")
    +`<br>1m당 철근 ${fx(tk,1)} kg (할증 전)`;
  toast(changed.length?`배근 ${changed.length}개를 바꿨습니다.`:"검토 후보 중 선택한 배근입니다.");
}
$("btnOpt").addEventListener("click",optimizeRebar);
/* ---------- N.G 해결 팁 ---------- */
const TIPGEN={n:0};
function withVals(over,fn){ over=sameBackDia(over);const old={}; for(const k in over){const el=$(k); if(!el) continue; old[k]=el.value;el.value=over[k];}
  try{return fn();} finally{ for(const k in old) $(k).value=old[k]; $("qa").value=String(num("qult")/3);$("fe").value=String((num("qultE")/2)/(num("qult")/3)); } }

function detailTargets(d){
 if(d.name.includes("뒷굽 하면 반대측"))return ["F2"];
 if(d.name.includes("앞굽 상면 반대측"))return ["F1"];
 if(d.name.includes("노출면 수평"))return ["W3"];
 if(d.name.includes("수평철근 양면"))return ["W3","W5"];
 if(d.name.includes("수축온도"))return ["F3","F4"];
 return Object.keys(DMAP).filter(k=>d.name===DM(k)+" 최대간격");
}
function correctionNotes(R){setWT(R);
 const out=[];
 for(const k of HORIZONTAL_MARKS){const b=R.P.bar[k];if(b&&b.s>0&&!horizontalSpacing(k).includes(b.s))out.push({keys:[k],fields:[],text:DM(k)+" "+b.dia+"@"+b.s+" · 수평 배력근 간격은 "+horizontalSpacing(k).join(" / ")+" mm에서 선택 후 재검토"}); }
 for(const k of MAIN_MARKS){const b=R.P.bar[k];if(b&&b.s>0&&!MAIN_SPACING.includes(b.s))out.push({keys:[k],fields:[],text:DM(k)+" "+b.dia+"@"+b.s+" · 표준도형 주철근 간격 125 / 250 mm 중 선택 후 재검토"}); }
 R.DSN.filter(d=>!d.allOk).forEach(d=>out.push({keys:[d.mark],fields:[],text:d.name+" · "+DM(d.mark)+" "+R.P.bar[d.mark].dia+"@"+R.P.bar[d.mark].s+" · "+Object.entries(d.ok).filter(([,v])=>!v).map(([k])=>({m:"휨강도 부족",min:"최소철근 부족",max:"철근 과다/인장변형률 부족",v:"전단내력 부족: 두께 검토",cr:"균열간격 초과",spacing:"최대간격 초과"}[k]||k)).join(" / ")}));
 R.DETAILS.filter(d=>!d.ok).forEach(d=>{const keys=detailTargets(d);out.push({keys,fields:keys.length?[]:d.name.includes("근입")?["Df"]:d.name.includes("신축")?["blk"]:[],text:d.name+" · "+keys.map(k=>DM(k)+" "+R.P.bar[k].dia+"@"+R.P.bar[k].s).join(" / ")+" · "+(d.name.includes("최대간격")?"사용 "+fx(d.required,2)+" / 허용 "+fx(d.actual,2):"현재 "+fx(d.actual,2)+" / 필요 "+fx(d.required,2))+" "+d.unit+(keys.length===1&&d.unit==="mm²/m"?" · "+DM(keys[0])+" 간격 ≤ "+Math.floor(AS[R.P.bar[keys[0]].dia]*1000/d.required)+" mm 필요 (동일 규격, 해당 철근량 기준)"+(MAIN_MARKS.includes(keys[0])?" · 주철근 간격은 125 / 250 mm에서 선택, 필요시 규격 증대":""):"")});});
 if(!R.S.N.allOk||!R.S.E.allOk){ const wt=R.P.wtype; out.push({keys:[],fields:wt==="RL"?["B1"]:wt==="L"?["B3"]:["B3","B1"],text:"외적 안정 부족 · 일반도 "+(wt==="RL"?"앞굽길이 B1·전단키 및 수동토압 조건":wt==="L"?"뒷굽길이 B3":"앞굽길이 B1 / 뒷굽길이 B3")+" 및 지반조건 검토"}); }
 return out;
}
function noteHTML(n){const pairs=BAR_PAIRS.filter(p=>p.some(m=>n.keys.includes(m)));if(pairs.length)n={...n,keys:[...new Set([...n.keys,...pairs.flat()])],text:n.text+" · "+pairs.map(p=>p.map(DM).join("/")).join(", ")+" 간격은 한 쌍으로 동일하게 조정"};return '<div class="correction-note"><b>수정 필요: </b>'+esc(n.text)+' '+[...n.keys.map(k=>["s_"+k,DM(k)+" 간격 수정"]),...n.fields.map(k=>[k,k+" 수정"])].map(([k,l])=>'<button type="button" class="edit-location" data-edit-field="'+k+'">'+l+'</button>').join(" ")+'</div>';}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-edit-field]");if(!b)return;const id=b.dataset.editField,el=$(id);if(!el)return;document.querySelector('.tab[data-t="'+(id.startsWith("s_")?"rebar":id==="blk"?"sched":id==="Df"?"stab":"gen")+'"]').click();el.scrollIntoView({block:"center",behavior:"smooth"});el.focus({preventScroll:true});});

function renderTips(R){
 const box=$("tips"),notes=correctionNotes(R);
 document.querySelectorAll(".needs-edit,.has-excess").forEach(el=>el.classList.remove("needs-edit","has-excess"));
 notes.forEach(n=>[...n.keys.flatMap(k=>["s_"+k,"d_"+k]),...n.fields].forEach(k=>{if($(k))$(k).classList.add("needs-edit");}));
 box.hidden=!notes.length;box.innerHTML=notes.length?'<div class="tip"><b>부족 항목 · 수정 위치</b>'+notes.map(noteHTML).join("")+"</div>":"";
}
$("tips").addEventListener("click",ev=>{const b=ev.target.closest("[data-apply]");if(!b)return;
  const a=JSON.parse(b.dataset.apply); for(const k in a){ if($(k)) $(k).value=a[k]; }
  run(); toast("제안한 값을 적용했습니다.");});

/* ---------- 여유 치수 제안: 안정·단면 검토가 모두 O.K일 때 줄일 수 있는 최소 치수 ---------- */
const SUG={gen:0,ids:["B3","B1","D","t2"],name:{B3:"뒷굽길이",B1:"앞굽길이",D:"기초두께",t2:"벽체 하단두께"}};

// 제안 표시 공간은 계산 전부터 고정 확보하여 입력칸·도면·표의 이동을 막는다.
for(const key of [...SUG.ids,"W1","W2","W3","W5","F1","F2","F3","F4"]){const input=$(key)||$("s_"+key);if(input&&!$("sug_"+key)){const slot=document.createElement("div");slot.id="sug_"+key;slot.className="sug-slot";slot.setAttribute("aria-live","polite");input.parentElement.appendChild(slot);}}

function failWhy(R){ const S=R.S, c={o:"전도",s:"활동",e:"편심",q:"지지력"}, o=[];
  ["o","s","e","q"].forEach(k=>{ if(!S.N.ok[k]) o.push("상시 "+c[k]); else if(!S.E.ok[k]) o.push("지진시 "+c[k]); });
  R.DSN.forEach(d=>{ if(!d.allOk) o.push(d.name+(d.ok.m?(d.ok.v?(d.ok.cr?" 철근비":" 균열"):" 전단"):" 휨")); });
  return o.slice(0,2).join(", "); }
function renderSugs(R){setWT(R);
 const token=++SUG.gen,base=formValues(),panels=[$("sugGen"),$("sugRebar")];panels.forEach(p=>p.dataset.ready="false");
 document.querySelectorAll(".sug").forEach(el=>{if(!el.closest(".sug-panel"))el.hidden=true;});
 const current=()=>token===SUG.gen&&JSON.stringify(formValues())===JSON.stringify(base);
 const failureSet=r=>new Set([...(r.S.N.allOk?[]:["안정N"]),...(r.S.E.allOk?[]:["안정E"]),...r.DSN.flatMap((d,i)=>Object.entries(d.ok).filter(([,v])=>!v).map(([k])=>"단면"+i+":"+k)),...r.DETAILS.filter(d=>!d.ok).map(d=>"상세:"+d.name)]),prior=failureSet(R);
 const tested=values=>{try{return withVals(values,()=>{const r=compute();if(!r||r.invalidContact||[...failureSet(r)].some(k=>!prior.has(k)))return false;
 const sectionMargin=(d,k)=>({m:d.phMn-d.Mu,min:d.slab?d.As-d.Asmin:Math.max(d.phMn-1.2*d.Mcr,d.phMn-4*d.Mu/3),max:d.et-d.etmin,v:d.phVc-d.Vu,cr:d.smax-d.s,spacing:d.spacingMax-d.s}[k]);
 if(R.DSN.some((d,i)=>Object.entries(d.ok).some(([k,ok])=>!ok&&sectionMargin(r.DSN[i],k)<sectionMargin(d,k)-1e-8)))return false;
 for(const key of ["N","E","Eminus"]){const a=R.S[key],b=r.S[key];if(!a||!b)continue;const margin=(x,k,width)=>({o:x.FSo-x.cr.o,s:x.FSs-x.cr.s,e:width/1000/x.cr.e-Math.abs(x.e),q:x.qa-x.qmax}[k]);for(const k of ["o","s","e","q"]){if(a.ok[k]&&!b.ok[k])return false;if(!a.ok[k]&&margin(b,k,r.G.B)<margin(a,k,R.G.B)-1e-8)return false;}}

 if(R.DSN.some(d=>!d.allOk&&Object.keys(values).some(k=>k.endsWith("_"+d.mark))))return false;
 return R.DETAILS.every((d,i)=>d.ok||r.DETAILS[i].actual-r.DETAILS[i].required>=d.actual-d.required-1e-8);});}catch(e){return false;}};
 const show=(key,values,text,target,pre)=>{if(!current())return;values=sameBackDia(values);if(key==="W1")text="W1/W2 동일 규격 · "+text;shown++;const input=$(key)||$("s_"+key);if(input)input.classList.add("has-excess");text=(pre||"여유·축소 가능: ")+text;const add=parent=>{const btn=document.createElement("button");btn.type="button";btn.className="sug";btn.textContent=text;btn.title=text;btn.dataset.values=JSON.stringify(values);btn.addEventListener("click",()=>{if(!current())return;for(const[k,v]of Object.entries(values))$(k).value=v;run();toast("개별 축소 후보를 적용했습니다. 남은 부족 항목을 확인하세요.");});parent.appendChild(btn);};panels.forEach(p=>add(p.querySelector(".review-list")));let field=$("sug_"+key);if(!field){field=document.createElement("div");field.id="sug_"+key;const input=$(key)||$("s_"+key);if(input)input.parentElement.appendChild(field);}if(field){field.innerHTML="";add(field);}};
 panels.forEach(p=>p.innerHTML="");
 const notes=correctionNotes(R),badKeys=new Set(notes.flatMap(n=>n.keys));
 panels.forEach(p=>p.innerHTML='<div class="review-heading">부족·수정 '+notes.length+'건 · 여유 후보 검토 중…</div><div class="review-list">'+notes.map(noteHTML).join("")+'</div><div class="review-foot">각 축소 후보는 현재 입력에서 개별 검토합니다. 적용하면 나머지 후보를 다시 계산합니다.</div>');
 for(const n of notes)for(const k of n.keys){const slot=$("sug_"+k);if(slot)slot.innerHTML=noteHTML(n);}

 const P=R.P,tasks=SUG.ids.filter(k=>!(k==="B1"&&P.wtype==="L")&&!(k==="B3"&&P.wtype==="RL")).map(k=>({kind:"dim",key:k}));
 for(const k of ["W1","W2","W3","W5","F1","F2","F3","F4"])tasks.push({kind:"bar",key:k});
 if(R.G.B>0.8*P.H+1e-6)tasks.unshift({kind:"key08",key:P.wtype==="RL"?"B1":"B3"});

 let shown=0,i=0;const next=()=>{
  if(!current())return;if(i>=tasks.length){panels.forEach(p=>{p.dataset.ready="true";p.querySelector(".review-heading").textContent="전체 검토 안내 · 부족/수정 "+notes.length+"건 · 여유/축소 "+shown+"건";if(!shown)p.querySelector(".review-foot").textContent="탐색 범위에서 검토 조건을 유지하는 축소 후보가 없습니다. 부족 항목은 위에 모두 표시합니다.";});return;}const task=tasks[i++],k=task.key;if(barPair(k)?.[1]===k){setTimeout(next,0);return;}if(task.kind!=="key08"&&(badKeys.has(k)||barPair(k)?.some(m=>badKeys.has(m)))){setTimeout(next,0);return;}
  if(task.kind==="key08"){ /* 저판 전체길이가 0.8H를 넘으면: 저판을 0.8H로 줄이고 전단키를 추가·확대하는 안 (사용자 기준) */
   const Bt=Math.floor(0.8*P.H/50)*50,cut=R.G.B-Bt,nv=P[k]-cut;
   if(nv>=(k==="B3"?300:0)){
    const okAll=values=>{try{return withVals(values,()=>{const r=compute();return !!r&&!r.invalidContact&&r.S.N.allOk&&r.S.E.allOk&&(!r.S.Eminus||r.S.Eminus.allOk)&&r.DSN.every((d,j)=>d.allOk||!R.DSN[j].allOk)/* 안정은 전부 O.K, 단면은 지금 부족한 것 외 새 부족 없음 (철근 부족은 철근에서 따로 수정) */;});}catch(e){return false;}};
    const had=R.G.hasKey,cands=[];
    for(let bk=300;bk<=1000;bk+=100)for(let hk=300;hk<=1500;hk+=100){if(had&&(bk<P.bk||hk<P.hk))continue;cands.push({bk,hk});}
    cands.sort((a,b)=>a.bk*a.hk-b.bk*b.hk||a.hk-b.hk);
    let best=null,tries=0;
    for(const c of cands){if(tries++>60)break;let kx=had?P.kx:(P.wtype==="RL"?Math.max(0,P.B1-cut):Math.round(0.6*Bt/50)*50)/* 새 키: 역T·L형은 표준도처럼 저판 앞끝에서 약 0.6B */;kx=Math.max(0,Math.min(kx,Bt-c.bk));
     const values={[k]:String(nv),bk:String(c.bk),hk:String(c.hk),kx:String(kx)};if(okAll(values)){best={values,c,kx};break;}}
    if(best)show(k,best.values,"저판 "+fx(R.G.B,0)+" mm("+(R.G.B/P.H).toFixed(2)+"H) → "+fx(Bt,0)+" mm(0.8H): "+SUG.name[k]+" "+fx(P[k],0)+" → "+fx(nv,0)+", 전단키 "+(had&&best.c.bk===P.bk&&best.c.hk===P.hk?"현재 그대로 ":had?fx(P.bk,0)+"×"+fx(P.hk,0)+" → ":"추가 ")+fx(best.c.bk,0)+"×"+fx(best.c.hk,0)+" (키 위치 "+fx(best.kx,0)+") — 안정 O.K"+(R.DSN.some(d=>!d.allOk)?" · 단면 부족은 철근에서 따로 수정":""),$("sugGen"),"저판 0.8H 초과 · 전단키 안: ");
    else{const n=document.createElement("div");n.className="sug";n.textContent="저판 "+fx(R.G.B,0)+" mm가 0.8H("+fx(Bt,0)+")를 넘습니다. 전단키 폭 1000·깊이 1500 이내로는 0.8H에서 안정검토가 O.K가 되지 않습니다.";panels.forEach(p=>p.querySelector(".review-list").appendChild(n.cloneNode(true)));}
   }
  }else if(task.kind==="dim"){
   const cur=P[k],keyEnd=Math.max(R.G.hasKey?P.kx+P.bk:0,Math.ceil(0.6*P.H/50)*50)/* 저판 전체길이 ≥ 0.6H (사용자 기준 0.6H~0.8H) · 전단키는 저판 안 */,lo={B1:Math.max(0,keyEnd-P.t2-P.B3),B3:Math.max(300,keyEnd-P.B1-P.t2),D:Math.max(450,2*P.cf+50,P.D2<P.D?P.D2:0),t2:Math.max(250,P.t1+P.nf*(P.H-P.D))}[k];let best=null,steps=0;
   for(let v=Math.floor((cur-1)/50)*50;v>=lo&&steps++<40;v-=50){const values={[k]:String(v)};if(k==="D"&&P.D2===P.D)values.D2=String(v);if(!tested(values))break;best={values,v};}
   if(best&&cur-best.v>=50)show(k,best.values,SUG.name[k]+" "+fx(cur,0)+" → "+fx(best.v,0)+" mm까지 개별 축소 후보 (개별 검토 · 기존 부족 악화 없음)",$("sugGen"));
  }else{
   const pair=barPair(k);
   if(pair){
    const [a,b]=pair,ba=P.bar[a],bb=P.bar[b],old=(BARS[ba.dia].w/ba.s+BARS[bb.dia].w/bb.s)*1000,cs=[];
    for(const s of horizontalSpacing(a))for(const da of Object.keys(BARS))for(const db of Object.keys(BARS)){
     const kg=(BARS[da].w+BARS[db].w)*1000/s;
     if(s>=Math.max(ba.s,bb.s)&&BARS[da].d<=BARS[ba.dia].d&&BARS[db].d<=BARS[bb.dia].d&&kg<old*.95)cs.push({s,da,db,kg});
    }
    cs.sort((a,b)=>a.kg-b.kg);
    const values=c=>({["d_"+a]:c.da,["s_"+a]:String(c.s),["d_"+b]:c.db,["s_"+b]:String(c.s)});
    const best=cs.find(c=>tested(values(c)));
    if(best){show(a,values(best),DM(a)+"/"+DM(b)+" 함께: "+DM(a)+" "+ba.dia+"@"+ba.s+" → "+best.da+"@"+best.s+", "+DM(b)+" "+bb.dia+"@"+bb.s+" → "+best.db+"@"+best.s+" (동일 간격 · 개별 검토)",$("sugRebar"));const slot=$("sug_"+b),first=$("sug_"+a);if(slot&&first){slot.innerHTML="";const copy=first.querySelector("button")?.cloneNode(true);if(copy){copy.addEventListener("click",()=>{if(!current())return;for(const[id,v]of Object.entries(values(best)))$(id).value=v;run();});slot.appendChild(copy);}}}
    setTimeout(next,0);return;
   }
   const bar=P.bar[k],old=BARS[bar.dia].w*1000/bar.s,candidates=[];
   for(const dia of ["H13","H16","H19","H22","H25","H29","H32"])for(const s of (MAIN_MARKS.includes(k)?MAIN_SPACING:HORIZONTAL_MARKS.includes(k)?horizontalSpacing(k):[100,125,150,200,250,300])){const kg=BARS[dia].w*1000/s;if(kg<old*.95&&BARS[dia].d<=BARS[bar.dia].d&&s>=bar.s)candidates.push({dia,s,kg});}
   candidates.sort((a,b)=>a.kg-b.kg);const best=candidates.find(c=>tested({["d_"+k]:c.dia,["s_"+k]:String(c.s)}));
   if(best)show(k,{["d_"+k]:best.dia,["s_"+k]:String(best.s)},DM(k)+" "+bar.dia+"@"+bar.s+" → "+best.dia+"@"+best.s+" 개별 축소 후보 (개별 검토 · 기존 부족 악화 없음)",$("sugRebar"));
  }
  setTimeout(next,0);
 };setTimeout(next,200);
}
