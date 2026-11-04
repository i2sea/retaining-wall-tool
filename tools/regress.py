"""회귀 비교: 저장된 작업 묶음(.json)의 옹벽마다 각 탭 화면·DXF·워드 결과의 해시를 뽑는다.
사용: python3 tools/regress.py <도구 URL(index.html)> <작업묶음.json> <결과.json>
두 버전의 결과.json을 비교하면 계산·도면이 바뀌었는지 알 수 있다.  (playwright 필요)"""
import asyncio, json, sys, hashlib
from playwright.async_api import async_playwright
TABS = ["gen", "rebar", "sheet", "sched", "bend", "qty", "stab", "stress", "calc"]
JS_PANE = """t=>{const p=document.querySelector('.pane[data-p="'+t+'"]').cloneNode(true);
 p.querySelectorAll('.sug-panel,[id^=sug_]').forEach(e=>e.remove()); return p.innerHTML;}"""
JS_EXTRA = """async()=>{const o={};
 o.summary=(document.getElementById('summary')||{}).innerHTML||''; o.warns=document.getElementById('warns').innerHTML;
 o.dxf=dxf2DMulti([{name:'x',R:CUR}]); o.sheetDxf=dxfSheets([{R:CUR,meta:sheetMeta()}]);
 const seen=new WeakSet(); o.calc=JSON.stringify({S:CUR.S,DSN:CUR.DSN,Q:CUR.Q,P:CUR.P,DETAILS:CUR.DETAILS,sched:CUR.sched},(k,v)=>{if(v&&typeof v==='object'){if(seen.has(v))return '[ref]';seen.add(v);}return typeof v==='function'?'[fn]':v;});
 return o;}"""
async def main(url, data, out):
    proj = json.load(open(data)); res = {}; errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1600, "height": 1000})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(1500)
        await pg.evaluate("p=>loadProject(p)", proj); await pg.wait_for_timeout(500)
        n = await pg.evaluate("()=>PROJ.walls.length")
        for i in range(n):
            await pg.evaluate(f"()=>switchWall({i})"); await pg.wait_for_timeout(200)
            r = {}
            for t in TABS:
                await pg.click(f'button.tab[data-t="{t}"]'); await pg.wait_for_timeout(80)
                r[t] = hashlib.sha1((await pg.evaluate(JS_PANE, t)).encode()).hexdigest()[:12]
            ex = await pg.evaluate(JS_EXTRA)
            for k, v in ex.items(): r[k] = hashlib.sha1(v.encode()).hexdigest()[:12]
            res[f"{i} {await pg.evaluate('()=>PROJ.walls[PROJ.active].name')}"] = r
        await b.close()
    json.dump({"errors": errs, "walls": res}, open(out, "w"), ensure_ascii=False, indent=1)
    print(len(res), "walls,", len(errs), "page errors")
if __name__ == "__main__": asyncio.run(main(*sys.argv[1:4]))
