"use strict";
/* 옹벽 설계도구 · DXF(R12) · 3D 뷰(three.js) */
/* ---------- DXF (R12, AutoCAD 호환) ---------- */
const DXFLAY={DIMPUT:7,CONC:7,LEV:8,GROUND:32,DIM:4,TEXT:7,TITLE:7,R1:1,R2:3,R3:5,RD:30,LEAD:8,"CONC-3D":8,"LEV-3D":9,"REBAR-W1":1,"REBAR-W2":5,"REBAR-F":3,"REBAR-DIST":30};
const uni=s=>String(s).replace(/[^\x20-\x7e]/g,c=>"\\U+"+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,"0"));
function dxfDoc(build){
  const o=[];const w=(...a)=>{for(let i=0;i<a.length;i+=2){let v=a[i+1]; if(a[i]===8&&!v)v="0"; if(v==null||(typeof v==="number"&&!isFinite(v)))v=a[i]===8?"0":"0"; if(typeof v==="string"&&/NaN|undefined/.test(v)&&a[i]!==1)v="0"; o.push(a[i],v);}};
  const n=v=>(+v).toFixed(3);
  w(0,"SECTION",2,"HEADER",9,"$ACADVER",1,"AC1009",9,"$DWGCODEPAGE",3,"ANSI_949",0,"ENDSEC");
  w(0,"SECTION",2,"TABLES");
  w(0,"TABLE",2,"LTYPE",70,1,0,"LTYPE",2,"CONTINUOUS",70,0,3,"Solid line",72,65,73,0,40,"0.0",0,"ENDTAB");
  const lays=Object.keys(DXFLAY);
  w(0,"TABLE",2,"LAYER",70,lays.length);lays.forEach(l=>w(0,"LAYER",2,l,70,0,62,DXFLAY[l],6,"CONTINUOUS"));w(0,"ENDTAB");
  w(0,"TABLE",2,"STYLE",70,1,0,"STYLE",2,"STANDARD",70,0,40,"0.0",41,"1.0",50,"0.0",71,0,42,"2.5",3,"malgun.ttf",4,"",0,"ENDTAB");
  // DIMSTYLE (치수 객체: 문자 위, 사선 틱)
  // 사용자 치수 스타일 "치수" (점 화살표 _Dot, 문자 2.5, 치수선·보조선 빨강, 문자 흰색, DIMSCALE = 도면 축척)
  const DSN=uni("치수");
  const dsty=sc=>{w(0,"TABLE",2,"DIMSTYLE",70,2);
    [["STANDARD",0],[DSN,1]].forEach(([nm,u])=>w(0,"DIMSTYLE",2,nm,70,0,3,"",4,"",5,u?"_Dot":"",6,u?"_Dot":"",7,u?"_Dot":"",40,n(u?sc:1),41,u?"1.0":"2.5",42,u?"0.0":"0.625",43,"3.75",44,u?"1.0":"1.25",45,"0.0",46,"0.0",47,"0.0",48,"0.0",
      140,"2.5",141,"2.5",142,"0.0",143,"0.03937",144,"1.0",145,u?"1.0":"0.0",146,"1.0",147,u?"1.0":"0.625",71,0,72,0,73,0,74,0,75,0,76,0,77,u?0:1,78,8,170,0,171,3,172,1,173,u?1:0,174,u?1:0,175,0,176,u?1:0,177,u?1:0,178,u?7:0));
    w(0,"ENDTAB");};
  const head=o.splice(0), ent=[], blk=[]; let nd=0, dH=0, dSc=0;
  const into=a=>{const t=o.splice(0); a.push(...t);};
  const api={
    pl(layer,pts,closed,z=0){w(0,"POLYLINE",8,layer,66,1,10,"0",20,"0",30,"0",70,closed?1:0);pts.forEach(p=>w(0,"VERTEX",8,layer,10,n(p[0]),20,n(p[1]),30,n(z)));w(0,"SEQEND",8,layer);},
    pl3(layer,pts){w(0,"POLYLINE",8,layer,66,1,10,"0",20,"0",30,"0",70,8);pts.forEach(p=>w(0,"VERTEX",8,layer,10,n(p[0]),20,n(p[1]),30,n(p[2]),70,32));w(0,"SEQEND",8,layer);},
    face(layer,p){if(p.length===3)p=[...p,p[2]];w(0,"3DFACE",8,layer);p.forEach((q,i)=>w(10+i,n(q[0]),20+i,n(q[1]),30+i,n(q[2])));},
    circle(layer,x,y,r){w(0,"CIRCLE",8,layer,10,n(x),20,n(y),30,"0",40,n(r));},
    solidDisc(layer,x,y,r){w(0,"CIRCLE",8,layer,10,n(x),20,n(y),30,"0",40,n(r));},
    text(layer,x,y,h,s,al,rot){const hj=al==="l"?0:al==="r"?2:1;w(0,"TEXT",8,layer,10,n(x),20,n(y),30,"0",40,n(h),1,uni(s));if(rot)w(50,n(rot));w(72,hj,11,n(x),21,n(y),31,"0");},
    dim(d,dx=0,dy=0,sc){ // 선형 치수 객체 (DIMENSION, 스타일 "치수") + 표시용 익명 블록
      into(ent); dH=Math.max(dH,d.h||0); if(sc&&!dSc) dSc=sc; const P=d.pts.map(p=>[p[0]+dx,p[1]+dy]), [o1,o2,dp,tp]=P, h=d.dir==="h", name="*D"+(++nd), s=String(d.txt?d.txt.s:d.s??"");
      const pos=h?dp[1]:dp[0], e1=h?[o1[0],pos]:[pos,o1[1]], e2=h?[o2[0],pos]:[pos,o2[1]], sg=v=>v>=0?1:-1, ov=d.h*0.4;
      w(0,"BLOCK",8,"0",2,name,70,1,10,"0",20,"0",30,"0",3,name);
      const ln=(a,b,ly="0")=>w(0,"LINE",8,ly,62,1,10,n(a[0]),20,n(a[1]),30,"0",11,n(b[0]),21,n(b[1]),31,"0");
      const ex=(o,e)=>{const dd=h?sg(e[1]-o[1]):sg(e[0]-o[0]); ln(o,h?[e[0],e[1]+dd*ov]:[e[0]+dd*ov,e[1]]);};
      ex(o1,e1); ex(o2,e2); ln(e1,e2);
      [e1,e2].forEach(p=>{ if(d.tick==="dot") w(0,"CIRCLE",8,"0",62,1,10,n(p[0]),20,n(p[1]),30,"0",40,n(d.r));
        else ln([p[0]-d.r,p[1]-d.r],[p[0]+d.r,p[1]+d.r]); });
      w(0,"TEXT",8,"0",62,7,10,n(tp[0]),20,n(tp[1]),30,"0",40,n(d.h),1,uni(s)); if(!h) w(50,"90.000"); w(72,1,11,n(tp[0]),21,n(tp[1]),31,"0");
      w(0,"ENDBLK",8,"0"); into(blk);
      w(0,"DIMENSION",8,"DIMPUT",2,name,3,DSN,10,n(e2[0]),20,n(e2[1]),30,"0",11,n(tp[0]),21,n(tp[1]),31,"0",70,0,1,uni(s),
        13,n(o1[0]),23,n(o1[1]),33,"0",14,n(o2[0]),24,n(o2[1]),34,"0",50,h?"0.0":"90.0");
      into(ent); }
  };
  build(api); into(ent); dsty(dSc||Math.max(1,Math.round((dH||2.5)/2.5))); w(0,"ENDSEC"); into(head);
  // _Dot 화살표 블록 (사용자 템플릿과 같은 모양: 폭 0.5 원점 + 짧은 꼬리선)
  w(0,"BLOCK",8,"0",2,"_Dot",70,0,10,"0",20,"0",30,"0",3,"_Dot",0,"POLYLINE",8,"0",66,1,10,"0",20,"0",30,"0",70,1,40,"0.5",41,"0.5",
    0,"VERTEX",8,"0",10,"-0.25",20,"0",30,"0",42,"1.0",0,"VERTEX",8,"0",10,"0.25",20,"0",30,"0",42,"1.0",0,"SEQEND",8,"0",
    0,"LINE",8,"0",10,"-0.5",20,"0",30,"0",11,"-1.0",21,"0",31,"0",0,"ENDBLK",8,"0"); blk.unshift(...o.splice(0));
  return [...head,"0","SECTION","2","BLOCKS",...blk,"0","ENDSEC","0","SECTION","2","ENTITIES",...ent,"0","ENDSEC","0","EOF"].join("\r\n")+"\r\n";
}
function cadStatus(R){
 return stockNote(R.P)+"\r\n"+ "KDS 대조본 2026-10-21\r\n계산 항목 판정: "+(allOk(R)?"O.K":"N.G")+"\r\n전체 설계: 별도 검토 필요\r\nKDS 11 80 05:2025 / KDS 14 20 10:2021, 20:2022, 22:2022, 30:2021, 50:2022\r\n배근 개략도: B급 이음길이·수량은 정척 반영. 이음 위치·정착 및 배수시설 상세는 별도 설계\r\n"+R.warns.map(w=>"미달·경고: "+w).join("\r\n")+"\r\n"+R.scopePending.map(w=>"별도 검토: "+w).join("\r\n");
}
function dxf2D(R){
  const g=drawing(R,"gen"), r=drawing(R,"rebar");
  const bg=bbox(g.E), off=(bg[2]-bg[0])+g.th*8;
  return dxfDoc(api=>{
    api.text("TITLE",0,bg[3]+g.th*3,g.th*.8,"KDS 대조 계산 "+(allOk(R)?"O.K":"N.G")+" / 전체 설계 별도 검토","l",0);
    [[g,0],[r,off]].forEach(([dw,dx])=>dw.E.forEach(e=>{
      if(e.dg) return; if(e.t==="dim") return api.dim(e,dx,0);
      if(e.t==="pl")api.pl(e.layer,e.pts.map(p=>[p[0]+dx,p[1]]),e.closed);
      else if(e.t==="ci")api.circle(e.layer,e.x+dx,e.y,e.r);
      else if(e.t==="tx")api.text(e.layer,e.x+dx,e.y,e.h,e.s,e.al,e.rot);
    }));
  });
}
function rebar3D(R){ // [{layer, pts3}]  X=단면x, Y=연장, Z=높이
  const {P}=R, Lmm=P.L*1000, out=[];
  const lay={WH:"REBAR-W2",W1:"REBAR-W1",W8:"REBAR-W1",W2:"REBAR-W2",W4:"REBAR-W2",W7:"REBAR-W2",F1:"REBAR-F",F2:"REBAR-F",K1:"REBAR-F",F5:"REBAR-F"};
  R.bars.forEach(b=>{for(const y of barPositions(P,b))(b.secs||[b.pts]).forEach(q=>out.push({layer:lay[b.m],m:b.m,pts:q.map(p=>[p[0],y,p[1]])}));});
  [...R.dots.W3,...R.dots.W5,...R.dots.F3,...R.dots.F4,...R.dots.K2,...(R.dots.WD||[])].forEach(([x,z])=>out.push({layer:"REBAR-DIST",m:"D",pts:[[x,40,z],[x,Lmm-40,z]]}));
  return out;
}
function dxf3D(R){
  const {P,G}=R, Lmm=P.L*1000;
  return dxfDoc(api=>{
    const prism=(layer,sec)=>{const n=sec.length;
      for(let i=0;i<n;i++){const a=sec[i],b=sec[(i+1)%n];api.face(layer,[[a[0],0,a[1]],[b[0],0,b[1]],[b[0],Lmm,b[1]],[a[0],Lmm,a[1]]]);}
      [0,Lmm].forEach(y=>api.face(layer,sec.map(p=>[p[0],y,p[1]])));};
    prism("CONC-3D",G.stem);prism("CONC-3D",G.foot);if(G.key)prism("CONC-3D",G.key);G.levRects.forEach(r=>prism("LEV-3D",r));
    rebar3D(R).forEach(b=>api.pl3(b.layer,b.pts));
  });
}
function lisp(R){
  const {P,G}=R, Lmm=P.L*1000;
  const pts=sec=>sec.map(p=>`'(${p[0].toFixed(1)} ${p[1].toFixed(1)} 0)`).join(" ");
  const bars=rebar3D(R).map(b=>`  (_p3 "${b.layer}" (list ${b.pts.map(p=>`'(${p[0].toFixed(1)} ${p[1].toFixed(1)} ${p[2].toFixed(1)})`).join(" ")}))`).join("\n");
  return `;; Inverted-T retaining wall - 3D SOLID builder (H=${P.H}, L=${P.L}m)
;; APPLOAD this file, then type RWALL. Optional: RWBARSOLID sweeps rebar polylines into solids.
(defun _lay (n c) (if (not (tblsearch "LAYER" n)) (command "_.-LAYER" "_M" n "_C" c n "")) (setvar "CLAYER" n))
(defun _pl (lst) (command "_.PLINE") (foreach p lst (command p)) (command "_C") (entlast))
(defun _ext (e h) (command "_.EXTRUDE" e "" h) (entlast))
(defun _p3 (lay lst)
  (entmake (list '(0 . "POLYLINE") (cons 8 lay) '(66 . 1) '(10 0.0 0.0 0.0) '(70 . 8)))
  (foreach p lst (entmake (list '(0 . "VERTEX") (cons 8 lay) (cons 10 p) '(70 . 32))))
  (entmake (list '(0 . "SEQEND") (cons 8 lay))))
(defun c:RWALL ( / os de s f k)
  (setq os (getvar "OSMODE") de (getvar "DELOBJ"))
  (setvar "OSMODE" 0) (setvar "DELOBJ" 1) (setvar "CMDECHO" 0)
  (command "_.UCS" "_W") (command "_.UCS" "_X" 90)
  (_lay "CONC-3D" 8)
  (setq s (_ext (_pl (list ${pts(G.stem)})) ${-Lmm}))
  (setq f (_ext (_pl (list ${pts(G.foot)})) ${-Lmm}))
  ${G.key?`(setq k (_ext (_pl (list ${pts(G.key)})) ${-Lmm}))
  (command "_.UNION" s f k "")`:`(command "_.UNION" s f "")`}
  (_lay "LEV-3D" 9)
${G.levRects.map(r=>`  (_ext (_pl (list ${pts(r)})) ${-Lmm})`).join("\n")}
  (command "_.UCS" "_W")
  (_lay "REBAR-W1" 1) (_lay "REBAR-W2" 5) (_lay "REBAR-F" 3) (_lay "REBAR-DIST" 30)
${bars}
  (setvar "CLAYER" "0") (setvar "OSMODE" os) (setvar "DELOBJ" de)
  (command "_.-VIEW" "_SWISO") (command "_.ZOOM" "_E") (command "_.VSCURRENT" "_R")
  (princ "\\nRetaining wall created.") (princ))
(defun _dia (lay) (cond ((= lay "REBAR-W1") ${BARS[P.bar.W1.dia].d}) ((= lay "REBAR-W2") ${BARS[P.bar.W2.dia].d}) ((= lay "REBAR-F") ${BARS[P.bar.F1.dia].d}) (T ${BARS[P.bar.W3.dia].d})))
(defun c:RWBARSOLID ( / ss n e lay os)
  (setq os (getvar "OSMODE")) (setvar "OSMODE" 0) (setvar "CMDECHO" 0)
  (setq ss (ssget "_X" '((0 . "POLYLINE") (8 . "REBAR-*"))) n 0)
  (if ss (repeat (sslength ss)
    (setq e (ssname ss n) lay (cdr (assoc 8 (entget e))))
    (command "_.CIRCLE" '(0 0 0) (/ (_dia lay) 2.0))
    (command "_.SWEEP" (entlast) "" "_A" "_Y" e)
    (setq n (1+ n))))
  (setvar "OSMODE" os) (princ (strcat "\\n" (itoa n) " rebar solids")) (princ))
(princ "\\nType RWALL to build the 3D model.") (princ)
`;
}

/* ---------- 3D 뷰 (three.js) ---------- */
let V3=null;
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||"#888";}
function init3D(){
  if(V3||typeof THREE==="undefined")return;
  const el=$("view3d");
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(40,1,0.05,500);
  const ctl=new THREE.OrbitControls(cam,renderer.domElement);
  ctl.enableDamping=false;
  scene.add(new THREE.AmbientLight(0xffffff,0.65));
  const dl=new THREE.DirectionalLight(0xffffff,0.6);dl.position.set(5,10,7);scene.add(dl);
  const grp=new THREE.Group();scene.add(grp);
  V3={renderer,scene,cam,ctl,grp,el,fitted:false};
  const render=()=>renderer.render(scene,cam);
  ctl.addEventListener("change",render);V3.render=render;
  const ro=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();render();});
  ro.observe(el);
}
function update3D(R){
  if(!V3)return;
  const {P,G}=R, g=V3.grp, s=0.001, Lm=P.L;
  while(g.children.length){const c=g.children.pop();c.geometry&&c.geometry.dispose();}
  const cx=G.B/2;
  const mk=(sec,color,op)=>{const sh=new THREE.Shape(sec.map(p=>new THREE.Vector2((p[0]-cx)*s,p[1]*s)));
    const geo=new THREE.ExtrudeGeometry(sh,{depth:Lm,bevelEnabled:false});
    const mat=new THREE.MeshStandardMaterial({color,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,roughness:0.9});
    const me=new THREE.Mesh(geo,mat);me.userData.conc=true;g.add(me);
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x6b7378}));ed.userData.conc=true;g.add(ed);};
  mk(G.stem,0xb9bfbf,0.28);mk(G.foot,0xb9bfbf,0.28);if(G.key)mk(G.key,0xb9bfbf,0.28);G.levRects.forEach(r=>mk(r,0x9c9387,0.5));
  const cols={W1:cssVar("--rebar"),W2:cssVar("--rebar3"),W4:cssVar("--rebar3"),F1:cssVar("--rebar2"),F2:cssVar("--rebar2"),K1:cssVar("--rebar2"),W7:cssVar("--rebar3"),F5:cssVar("--rebar2"),D:cssVar("--dist")};
  const buckets={};
  rebar3D(R).forEach(b=>{const k=b.m;(buckets[k]=buckets[k]||[]);for(let i=0;i<b.pts.length-1;i++){const a=b.pts[i],c=b.pts[i+1];buckets[k].push((a[0]-cx)*s,a[2]*s,a[1]*s,(c[0]-cx)*s,c[2]*s,c[1]*s);}});
  Object.entries(buckets).forEach(([k,arr])=>{const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(arr,3));
    const ls=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:new THREE.Color(cols[k]||"#c33")}));ls.userData.bar=true;g.add(ls);});
  applyVis();
  const span=Math.max(G.B*s,P.H*s,Lm);
  V3.ctl.target.set(0,P.H*s/2,Lm/2);
  if(!V3.fitted||V3.lastSpan!==span){
    const box=new THREE.Box3().setFromObject(g), sphere=box.getBoundingSphere(new THREE.Sphere());
    const halfV=V3.cam.fov*Math.PI/360, aspect=V3.el.clientWidth/Math.max(1,V3.el.clientHeight);
    V3.cam.aspect=aspect;V3.cam.updateProjectionMatrix();
    const halfH=Math.atan(Math.tan(halfV)*aspect), distance=sphere.radius/Math.sin(Math.min(halfV,halfH))*1.15;
    V3.ctl.target.copy(sphere.center);
    V3.cam.position.copy(sphere.center).add(new THREE.Vector3(-1,0.65,-1).normalize().multiplyScalar(distance));
    V3.cam.far=Math.max(500,distance*5);V3.cam.updateProjectionMatrix();V3.fitted=true;V3.lastSpan=span;
  }
  V3.ctl.update();V3.render();
  $("note3d").textContent=`연장 ${P.L} m 구간 · 횡방향 철근 ${rebar3D(R).filter(b=>b.m!=="D").length}본, 종방향 배력근 ${R.dots.W3.length+R.dots.W5.length+R.dots.F4.length+R.dots.F3.length+R.dots.K2.length}본`;
}
function applyVis(){if(!V3)return;V3.grp.children.forEach(c=>{if(c.userData.conc)c.visible=$("showConc").checked;if(c.userData.bar)c.visible=$("showBar").checked;});V3.render&&V3.render();}
