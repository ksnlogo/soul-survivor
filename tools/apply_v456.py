from pathlib import Path
import re

gp = Path('js/game.js')
s = gp.read_text(encoding='utf-8')
assert 'const WORLD_W=7400,WORLD_H=7400' in s, 'unexpected world baseline'

s = re.sub(
    r"const WORLD_W=\d+,WORLD_H=\d+,MID_BOSS_AT=170,MAX_LIVE_ENEMIES=\d+;",
    "const WORLD_W=3600,WORLD_H=3600,MID_BOSS_AT=170,MAX_LIVE_ENEMIES=72;",
    s,
    count=1,
)

s = s.replace(
    "dpr=Math.min(devicePixelRatio||1,(innerWidth<700?1.5:2))",
    "dpr=Math.min(devicePixelRatio||1,(innerWidth<700?1.25:2))",
)

s = s.replace("length:96", "length:32")
s = s.replace("length:680", "length:170")
s = s.replace("length:58", "length:14")
s = s.replace("for(let p=0;p<3;p++)", "for(let p=0;p<2;p++)")
s = s.replace(
    "for(let i=0;i<14;i++){const p=safeWorldPoint(420);",
    "for(let i=0;i<8;i++){const p=safeWorldPoint(360);",
)
s = s.replace(
    "for(let i=0;i<12;i++){const p=safeWorldPoint(320);chests.push({x:p.x,y:p.y,opened:false,elite:i>=9})}",
    "for(let i=0;i<8;i++){const p=safeWorldPoint(280);chests.push({x:p.x,y:p.y,opened:false,elite:i>=6})}",
)
s = s.replace(
    "for(let i=0;i<6;i++){const p=safeWorldPoint(360);",
    "for(let i=0;i<4;i++){const p=safeWorldPoint(300);",
)
s = s.replace(
    "for(let i=0;i<22;i++){const p=safeCratePoint(310),reinforced=i>=18,maxHp=reinforced?70:44;",
    "for(let i=0;i<8;i++){const p=safeCratePoint(260),reinforced=i>=6,maxHp=reinforced?70:44;",
)
s = s.replace(
    "for(let n=0;n<190&&obstacles.length<96;n++){",
    "for(let n=0;n<130&&obstacles.length<42;n++){",
)
s = s.replace(
    "for(let n=0;n<210&&obstacles.length<96;n++){",
    "for(let n=0;n<130&&obstacles.length<42;n++){",
)

s = s.replace("r=rand(700,2500)", "r=rand(480,1280)")
s = s.replace(
    "return{x:WORLD_W/2+600,y:WORLD_H/2}",
    "return{x:WORLD_W/2+520,y:WORLD_H/2}",
)

s = s.replace(
    "const target=72+Math.min(24,currentStage*2);",
    "const target=24+Math.min(10,currentStage);",
)
s = s.replace("v440PopulationTimer=.75;", "v440PopulationTimer=1.45;")
s = s.replace(
    "const localR=Math.max(720,Math.hypot(W,H)*.82),localR2=localR*localR,targetLocal=18+Math.min(10,Math.floor(stageProgress()*10))+Math.min(5,Math.floor((currentStage-1)/3));",
    "const localR=Math.max(620,Math.hypot(W,H)*.74),localR2=localR*localR,targetLocal=12+Math.min(5,Math.floor(stageProgress()*5))+Math.min(3,Math.floor((currentStage-1)/4));",
)
s = s.replace(
    "let need=Math.min(6,Math.max(0,targetLocal-local));",
    "let need=Math.min(3,Math.max(0,targetLocal-local));",
)
s = s.replace(
    "if(ordinary<70&&enemies.length<MAX_LIVE_ENEMIES)",
    "if(ordinary<24&&enemies.length<MAX_LIVE_ENEMIES)",
)

s = s.replace(
    "ctx.fillRect(0,0,WORLD_W,WORLD_H);for(const p of terrainPatches)",
    "ctx.fillRect(camera.x-2,camera.y-2,W+4,H+4);for(const p of terrainPatches)",
)

s = s.replace(
    "b.trail.push({x:b.x,y:b.y});if(b.trail.length>6)b.trail.shift();",
    "if(!isIos){b.trail.push({x:b.x,y:b.y});if(b.trail.length>6)b.trail.shift()}",
)
s = s.replace(
    "b.trail.push({x:b.x,y:b.y});if(b.trail.length>5)b.trail.shift();",
    "if(!isIos){b.trail.push({x:b.x,y:b.y});if(b.trail.length>5)b.trail.shift()}",
)

old_loop = "function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;if(!paused)update(dt);draw();requestAnimationFrame(loop)}"
new_loop = "let v456FrameLast=0;function loop(now){if(!running)return;if(isIos&&now-v456FrameLast<31){requestAnimationFrame(loop);return}const dt=Math.min(.04,(now-last)/1000||0);last=now;v456FrameLast=now;if(!paused)update(dt);draw();requestAnimationFrame(loop)}"
assert old_loop in s, 'loop baseline missing'
s = s.replace(old_loop, new_loop, 1)

s = re.sub(r"stars=Array\.from\(\{length:\d+\}", "stars=Array.from({length:70}", s, count=1)

perf = """

/* ===== v4.5.6 MOBILE PERFORMANCE GUARDS ===== */
let v456HudLast=0,v456MiniLast=0;
const v456HudBase=updateHUD;updateHUD=function(){const n=performance.now();if(running&&n-v456HudLast<80)return;v456HudLast=n;return v456HudBase()};
const v456MiniBase=drawMinimap;drawMinimap=function(){const n=performance.now();if(running&&n-v456MiniLast<180)return;v456MiniLast=n;return v456MiniBase()};
const v456UpdateBase=update;update=function(dt){const r=v456UpdateBase(dt);if(bullets.length>72)bullets.splice(0,bullets.length-72);if(enemyBullets.length>44)enemyBullets.splice(0,enemyBullets.length-44);if(particles.length>180)particles.splice(0,particles.length-180);if(attackEffects.length>60)attackEffects.splice(0,attackEffects.length-60);return r};
/* ===== END v4.5.6 MOBILE PERFORMANCE GUARDS ===== */
"""
if 'v4.5.6 MOBILE PERFORMANCE GUARDS' not in s:
    s += perf

gp.write_text(s, encoding='utf-8')

ip = Path('index.html')
x = ip.read_text(encoding='utf-8')
x = re.sub(r"무림 생존록 v4\.5\.\d+", "무림 생존록 v4.5.6", x)
ip.write_text(x, encoding='utf-8')

swp = Path('service-worker.js')
sw = swp.read_text(encoding='utf-8')
sw = re.sub(r"murim-survival-v4-5-\d+-pwa-\d+", "murim-survival-v4-5-6-pwa-1", sw)
swp.write_text(sw, encoding='utf-8')

rp = Path('README.md')
r = rp.read_text(encoding='utf-8')
r = re.sub(r"# 무림 생존록 v4\.5\.\d+", "# 무림 생존록 v4.5.6", r, count=1)
r += """

## v4.5.6 월드 및 모바일 성능 최적화
- 월드 7,400 x 7,400 -> 3,600 x 3,600
- 최대 적 72, 초기 전역 적 약 24~34
- 주변 적 목표 밀도 재조정 및 보충량 제한
- 지형/장식/안개/랜드마크/상자/장애물 수 축소
- 부가 임무 거리 480~1,280으로 단축
- iPhone Canvas DPR 1.25 및 안정적 30fps 목표
- 모바일 투사체 trail 객체 생성을 제거해 GC 부담 감소
- HUD 12.5fps, 미니맵 약 5.5fps로 갱신 제한
- 투사체/적 투사체/파티클/공격 이펙트 개수 상한 적용
- BGM, 무기 및 스킬 효과음과 전투 타격감 폴리싱은 유지
"""
rp.write_text(r, encoding='utf-8')
