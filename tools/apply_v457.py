from pathlib import Path
import re

# --- game.js: restore smooth RAF and lower iPhone GPU cost ---
gp=Path('js/game.js')
s=gp.read_text(encoding='utf-8')

s=s.replace("dpr=Math.min(devicePixelRatio||1,(innerWidth<700?1.25:2))","dpr=Math.min(devicePixelRatio||1,(innerWidth<700?1:2))")

old_loop="let v456FrameLast=0;function loop(now){if(!running)return;if(isIos&&now-v456FrameLast<31){requestAnimationFrame(loop);return}const dt=Math.min(.04,(now-last)/1000||0);last=now;v456FrameLast=now;if(!paused)update(dt);draw();requestAnimationFrame(loop)}"
new_loop="function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;if(!paused)update(dt);draw();requestAnimationFrame(loop)}"
if old_loop not in s:
    raise SystemExit('v4.5.6 frame loop not found')
s=s.replace(old_loop,new_loop,1)

old_bg="function drawBackground(){const map=currentMap||MAP_THEMES[0],g=ctx.createLinearGradient(0,0,0,H);"
new_bg="function drawBackground(){const map=currentMap||MAP_THEMES[0];if(isIos){ctx.fillStyle=map.ground;ctx.fillRect(0,0,W,H);return}const g=ctx.createLinearGradient(0,0,0,H);"
if old_bg not in s:
    raise SystemExit('background baseline not found')
s=s.replace(old_bg,new_bg,1)

s=s.replace("if(player){const sx=player.x-camera.x,sy=player.y-camera.y,light=ctx.createRadialGradient", "if(player&&!isIos){const sx=player.x-camera.x,sy=player.y-camera.y,light=ctx.createRadialGradient",1)

old_vig="const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.8);vig.addColorStop(.55,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.42)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)}"
new_vig="if(!isIos){const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.8);vig.addColorStop(.55,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.42)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)}}"
if old_vig in s:s=s.replace(old_vig,new_vig,1)
else:print('warning: vignette baseline not found')

s=s.replace("ctx.shadowBlur=16;if(a.type==='slash')","ctx.shadowBlur=isIos?0:16;if(a.type==='slash')",1)
s=s.replace("ctx.shadowBlur=b.evolution?18:12;","ctx.shadowBlur=isIos?(b.evolution?4:0):(b.evolution?18:12);",1)
s=s.replace("/* ===== v4.5.6 MOBILE PERFORMANCE GUARDS ===== */","/* ===== v4.5.7 SMOOTH MOBILE PERFORMANCE GUARDS ===== */")
s=s.replace("/* ===== END v4.5.6 MOBILE PERFORMANCE GUARDS ===== */","/* ===== END v4.5.7 SMOOTH MOBILE PERFORMANCE GUARDS ===== */")

gp.write_text(s,encoding='utf-8')

# --- art.js: keep ink-wash silhouettes but skip per-frame mist gradient on iPhone ---
ap=Path('js/art.js')
a=ap.read_text(encoding='utf-8')
old_mist="""    const g=ctx.createLinearGradient(0,H*.4,W,H*.72);\n    g.addColorStop(0,'rgba(205,219,199,0)');\n    g.addColorStop(.48,'rgba(205,219,199,.045)');\n    g.addColorStop(1,'rgba(205,219,199,0)');\n    ctx.fillStyle=g;ctx.fillRect(0,H*.32,W,H*.42);"""
new_mist="""    if(!isIos){\n      const g=ctx.createLinearGradient(0,H*.4,W,H*.72);\n      g.addColorStop(0,'rgba(205,219,199,0)');\n      g.addColorStop(.48,'rgba(205,219,199,.045)');\n      g.addColorStop(1,'rgba(205,219,199,0)');\n      ctx.fillStyle=g;ctx.fillRect(0,H*.32,W,H*.42);\n    }"""
if old_mist in a:a=a.replace(old_mist,new_mist,1)
else:print('warning: art mist baseline not found')
ap.write_text(a,encoding='utf-8')

# --- version + service worker ---
ip=Path('index.html')
x=ip.read_text(encoding='utf-8')
x=re.sub(r"무림 생존록 v4\.5\.\d+","무림 생존록 v4.5.7",x)
ip.write_text(x,encoding='utf-8')

swp=Path('service-worker.js')
sw=swp.read_text(encoding='utf-8')
sw=re.sub(r"murim-survival-v4-5-\d+-pwa-\d+","murim-survival-v4-5-7-pwa-1",sw)
swp.write_text(sw,encoding='utf-8')

rp=Path('README.md')
r=rp.read_text(encoding='utf-8')
r=re.sub(r"# 무림 생존록 v4\.5\.\d+","# 무림 생존록 v4.5.7",r,count=1)
r+='''\n\n## v4.5.7 Smooth Combat\n- iPhone 30fps 강제 제한 제거, requestAnimationFrame 기반 60fps 지향\n- 모바일 Canvas DPR 1.25 -> 1.0으로 GPU 픽셀 부하 감소\n- iPhone에서 매 프레임 생성하던 월드 광원/비네트/기본 안개 gradient 비활성화\n- 청죽림 수묵 배경의 동적 안개 gradient만 모바일에서 생략\n- 일반 투사체 및 공격 이펙트 shadowBlur 모바일 축소\n- BGM은 HTMLAudio 유지, 반복 전투 SFX는 Web Audio 디코드 버퍼 재생\n- 일반 피격마다 오디오를 재생하던 경로 제거\n- 검/창 휘두름 자체의 카메라 흔들림 제거, 실제 강타/회심에만 약한 흔들림 적용\n- 한 프레임 타격 스파크 생성량 제한으로 GC 피크 감소\n'''
rp.write_text(r,encoding='utf-8')

print('v4.5.7 patch applied')
