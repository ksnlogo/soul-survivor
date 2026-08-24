let deferredInstallPrompt=null;
const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),miniMap=$('miniMap'),mctx=miniMap.getContext('2d');
const startScreen=$('startScreen'),levelupScreen=$('levelup'),gameover=$('gameover'),equipmentScreen=$('equipmentScreen'),skillScreen=$('skillScreen'),shopScreen=$('shopScreen'),hud=$('hud'),joystick=$('joystick'),stick=$('stick'),weaponBadge=$('weaponBadge'),skillBar=$('skillBar'),waveBadge=$('waveBadge'),zoneBadge=$('zoneBadge'),enemyGuide=$('enemyGuide'),toast=$('toast'),itemModal=$('itemModal');
const STORAGE_KEY='soulSurvivorProfileV5',OLD_KEY='soulSurvivorProfileV4',OLDER_KEY='soulSurvivorProfileV3',LEGACY_KEY='soulSurvivorProfileV2',MAX_INVENTORY=120,STAGE_DURATION=420,BOSS_SPAWN_AT=360;
const rarityInfo={common:{name:'일반',class:'common',mult:1,affixes:0},rare:{name:'희귀',class:'rare',mult:1.42,affixes:1},epic:{name:'영웅',class:'epic',mult:1.95,affixes:2},legendary:{name:'전설',class:'legendary',mult:2.7,affixes:3},mythic:{name:'신화',class:'mythic',mult:3.65,affixes:4}};
const equipSlots={weapon:{name:'무기',icon:'⚔️',category:'weapon'},head:{name:'머리',icon:'🪖',category:'armor'},chest:{name:'갑옷',icon:'🛡️',category:'armor'},gloves:{name:'장갑',icon:'🧤',category:'armor'},legs:{name:'다리',icon:'👖',category:'armor'},boots:{name:'신발',icon:'👢',category:'armor'},accessory1:{name:'장신구 1',icon:'💍',category:'accessory'},accessory2:{name:'장신구 2',icon:'💎',category:'accessory'},accessory3:{name:'장신구 3',icon:'📿',category:'accessory'}};
const weaponDefs={
 sword:{name:'청강검',icon:'⚔️',desc:'근거리 검기 참격 · 전방의 여러 적을 베어냅니다',fireRate:.72,range:84,speed:0,size:4.0,damageMult:1.35,count:1,pierce:0,spread:0,attackKind:'slash'},
 dagger:{name:'비도',icon:'🗡️',desc:'빠른 쌍비도 투척 · 높은 치명타와 연속 공격',fireRate:.38,range:270,speed:570,size:3.0,damageMult:.72,count:2,pierce:0,spread:.12,critBonus:6,attackKind:'projectile'},
 bow:{name:'철궁',icon:'🏹',desc:'장거리 철전을 발사해 여러 적을 관통합니다',fireRate:.74,range:380,speed:690,size:2.8,damageMult:1.3,count:1,pierce:1,spread:0,critBonus:8,attackKind:'projectile'},
 staff:{name:'백우선',icon:'🪭',desc:'철선에 내공을 실어 장풍을 발사 · 중거리 다중 관통',fireRate:.86,range:310,speed:420,size:6.0,damageMult:1.45,count:1,pierce:2,spread:0,attackKind:'projectile'},
 hammer:{name:'철추',icon:'🔨',desc:'묵직한 철추로 지면을 강타해 충격파를 일으킵니다',fireRate:1.18,range:104,speed:0,size:6.8,damageMult:2.15,count:1,pierce:0,spread:0,attackKind:'slam'},
 spear:{name:'장창',icon:'🔱',desc:'긴 창술로 직선상의 적을 연속 관통합니다',fireRate:.8,range:155,speed:0,size:3.5,damageMult:1.48,count:1,pierce:99,spread:0,attackKind:'thrust'},
 axe:{name:'쌍월륜',icon:'🥏',desc:'한 쌍의 월륜을 회전 투척해 근중거리의 적을 제압합니다',fireRate:1.03,range:245,speed:400,size:5.1,damageMult:.96,count:4,pierce:1,spread:Math.PI*2,attackKind:'projectile'},
 grimoire:{name:'검부',icon:'📜',desc:'검결을 새긴 부적으로 추적 검기를 연속 방출합니다',fireRate:.98,range:325,speed:390,size:4.4,damageMult:.84,count:3,pierce:0,spread:.42,attackKind:'homing'}
}

const skillDefs={
 flame:{name:'화염장',icon:'🔥',desc:'주변에 화염 장력을 펼쳐 적을 태웁니다.',baseCooldown:6.2,price:140,color:'#ff8b58'},
 lightning:{name:'벽력지',icon:'⚡',desc:'손끝에서 벽력의 기운이 적 사이를 연속 타격합니다.',baseCooldown:5.4,price:190,color:'#8fd6ff'},
 frost:{name:'한빙장',icon:'❄️',desc:'한빙의 장력을 터뜨려 적을 둔화합니다.',baseCooldown:7.2,price:210,color:'#8ce9ff'},
 meteor:{name:'유성검우',icon:'☄️',desc:'하늘에서 검기를 떨어뜨려 범위를 초토화합니다.',baseCooldown:8.4,price:260,color:'#ffb063'},
 blades:{name:'회풍검기',icon:'🌀',desc:'사방으로 회전하는 검기를 방출합니다.',baseCooldown:6.8,price:230,color:'#c59aff'},
 ward:{name:'금종조',icon:'🛡️',desc:'호신강기로 피해를 흡수하는 금종의 기운을 만듭니다.',baseCooldown:10.5,price:240,color:'#72efc1'}
};
const evolutionDefs={
 infernoBlade:{weapon:'sword',skill:'flame',name:'적염검',icon:'🔥⚔️',color:'#ff9b62',desc:'두 겹의 적염 검기와 화염장 강화'},
 stormFangs:{weapon:'dagger',skill:'lightning',name:'벽력비도',icon:'⚡🗡️',color:'#92d9ff',desc:'다섯 자루의 벽력 비도를 연속 투척하고 벽력지를 강화'},
 thunderBow:{weapon:'bow',skill:'lightning',name:'천뢰궁',icon:'⚡🏹',color:'#ffe36f',desc:'3연발 관통 철전과 명중 연쇄 피해'},
 glacialStaff:{weapon:'staff',skill:'frost',name:'한빙백우선',icon:'❄️🪭',color:'#8ce9ff',desc:'세 갈래 한빙 장풍과 한빙장 강화'},
 aegisMaul:{weapon:'hammer',skill:'ward',name:'금강철추',icon:'🛡️🔨',color:'#8df2d2',desc:'이중 충격파와 강타 시 호신강기 획득'},
 soulLance:{weapon:'spear',skill:'blades',name:'회풍관일창',icon:'🌪️🔱',color:'#c9a7ff',desc:'세 갈래 관통 창술과 회풍검기 강화'},
 volcanicAxes:{weapon:'axe',skill:'flame',name:'염화쌍월륜',icon:'🔥🥏',color:'#ff8b58',desc:'여덟 개의 염화 월륜을 사방으로 투척'},
 astralCodex:{weapon:'grimoire',skill:'meteor',name:'천성검부',icon:'🌟📜',color:'#d9a1ff',desc:'다섯 갈래 추적 검기와 유성검우 강화'}
};
const WAVE_SCHEDULE=[
 {start:45,duration:18,type:'rush',name:'질풍 습격',icon:'⚡',desc:'빠른 적이 사방에서 몰려옵니다'},
 {start:108,duration:22,type:'swarm',name:'군체 범람',icon:'👹',desc:'대규모 군집이 화면을 압박합니다'},
 {start:225,duration:22,type:'ranged',name:'암기 포위망',icon:'🎯',desc:'원거리 적과 돌격수가 동시에 압박합니다'},
 {start:305,duration:24,type:'brute',name:'철갑 진군',icon:'🛡️',desc:'중갑과 돌격 적이 전선을 밀어붙입니다'}
];

const itemBases={
 weapon:Object.entries(weaponDefs).map(([weaponType,w])=>({name:w.name,icon:w.icon,weaponType,stats:weaponType==='dagger'?{damage:3,fireRatePct:8,crit:3}:weaponType==='bow'?{damage:5,crit:4}:weaponType==='staff'?{damage:6,bulletSize:1}:weaponType==='hammer'?{damage:9,maxHp:4}:weaponType==='spear'?{damage:6,movePct:2}:weaponType==='axe'?{damage:5,maxHp:5}:weaponType==='grimoire'?{damage:5,magnet:8}:{damage:6,maxHp:3}})),
 head:[{name:'청운 도건',icon:'🧢',stats:{maxHp:12,damageReduction:1}},{name:'야행 두건',icon:'🥷',stats:{crit:3,movePct:2}},{name:'도인의 관',icon:'👒',stats:{damage:3,magnet:7}},{name:'현철 철면',icon:'🪖',stats:{maxHp:17,damageReduction:1.5}}],
 chest:[{name:'호신 경갑',icon:'🥋',stats:{maxHp:24,damageReduction:2.5}},{name:'야행 장포',icon:'🧥',stats:{maxHp:10,movePct:5}},{name:'운문 도복',icon:'🥋',stats:{maxHp:17,damage:2}},{name:'현철 중갑',icon:'🛡️',stats:{maxHp:28,damageReduction:2}}],
 gloves:[{name:'검객 완갑',icon:'🧤',stats:{fireRatePct:8,crit:2}},{name:'철사장 수갑',icon:'🥊',stats:{damage:5,maxHp:5}},{name:'운문 수갑',icon:'🧤',stats:{damage:3,fireRatePct:5}},{name:'매응 완갑',icon:'🤲',stats:{crit:4,movePct:2}}],
 legs:[{name:'유운 행전',icon:'👖',stats:{movePct:5,maxHp:7}},{name:'현철 각반',icon:'🦿',stats:{maxHp:13,damageReduction:1.5}},{name:'야행 행전',icon:'👖',stats:{movePct:7,crit:2}},{name:'운문 각반',icon:'🦿',stats:{damage:2,maxHp:9}}],
 boots:[{name:'답설화',icon:'🥾',stats:{movePct:8}},{name:'유운화',icon:'🥾',stats:{movePct:4,magnet:12}},{name:'금사화',icon:'👢',stats:{movePct:3,goldBonus:7}},{name:'철갑화',icon:'🥾',stats:{maxHp:8,damageReduction:1}}],
 accessory:[{name:'호심옥',icon:'📿',stats:{damage:5}},{name:'매응옥패',icon:'🧿',stats:{crit:5}},{name:'탐물패',icon:'🧭',stats:{magnet:22}},{name:'황금전표',icon:'🪙',stats:{goldBonus:12,magnet:5}},{name:'회춘옥',icon:'💚',stats:{maxHp:14,regen:.14}},{name:'질풍패',icon:'💨',stats:{fireRatePct:7,movePct:3}},{name:'호신부',icon:'🪬',stats:{damageReduction:2,maxHp:8}},{name:'벽력패',icon:'⚡',stats:{damage:3,crit:2}}]
};
const setDefs={shadow:{name:'유영비갑',icon:'🌑',bonuses:{2:{fireRatePct:8},3:{crit:6},5:{movePct:8,damage:4}}},guardian:{name:'금강호갑',icon:'🛡️',bonuses:{2:{maxHp:18},3:{damageReduction:4},5:{regen:.25,maxHp:25}}},sage:{name:'청명운문',icon:'☯️',bonuses:{2:{magnet:18},3:{damage:5},5:{crit:5,fireRatePct:6}}}};
const affixPools={weapon:[['damage',3,'강기'],['fireRatePct',5,'연환'],['crit',3,'파혈'],['bulletSize',1,'장력'],['movePct',2,'경신']],head:[['maxHp',8,'호체'],['crit',2,'명경'],['damageReduction',1,'철벽'],['damage',2,'투기']],chest:[['maxHp',12,'호체'],['damageReduction',1.5,'금강'],['regen',.08,'운기'],['damage',2,'강기']],gloves:[['fireRatePct',5,'연환'],['crit',3,'매응'],['damage',3,'장력'],['movePct',2,'경신']],legs:[['movePct',4,'경공'],['maxHp',8,'호체'],['damageReduction',1,'금강'],['crit',2,'잠행']],boots:[['movePct',5,'경공'],['magnet',10,'탐물'],['goldBonus',5,'재운'],['maxHp',6,'호체']],accessory:[['damage',3,'강기'],['crit',3,'심안'],['fireRatePct',4,'연환'],['maxHp',8,'호체'],['damageReduction',1,'금강'],['magnet',12,'탐물'],['goldBonus',5,'재운'],['regen',.07,'운기']]};
const WORLD_W=7400,WORLD_H=7400,MID_BOSS_AT=170,MAX_LIVE_ENEMIES=220;let W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2),running=false,paused=false,last=0,elapsed=0,spawnTimer=0,shotTimer=0,kills=0,level=1,xp=0,xpNeed=9,runGold=0,runSoulXp=0,bossesDefeated=0,bossSpawned=false,midBossSpawned=false,midBossDefeated=false,finalBossDefeated=false,stageExpired=false,currentStage=1,itemModalResume=false,toastTimer=null,equipmentReturn='home',skillReturn='home',shopReturn='home',shopMode='buy',inventoryFilter='all',joyId=null,joyOrigin={x:0,y:0},camera={x:0,y:0},runEvolution=null,currentWave=null,lastWaveKey=null;
let enemies=[],bullets=[],enemyBullets=[],bossHazards=[],attackEffects=[],gems=[],coins=[],lootOrbs=[],particles=[],texts=[],runLoot=[],runSkillLevels={},skillCooldowns={},profile=loadProfile(),player=null,input={x:0,y:0};const keys={};
let obstacles=[],chests=[],springs=[],terrainPatches=[],groundDecos=[],fogWisps=[],mapLandmarks=[],mapPaths=[],currentMap=null,lastMapId=null,seenEnemyTypes=new Set();
const MAP_THEMES=[
 {id:'forest',icon:'🎋',name:'청죽림',tag:'경공·군집',ground:'#101b1d',sky1:'#0b1820',sky2:'#05090d',accent:'#72efc1',patch:['rgba(43,67,55,.34)','rgba(47,55,45,.28)','rgba(29,52,55,.36)','rgba(62,48,43,.20)'],road:'rgba(70,82,74,.46)',deco:'rgba(104,130,96,.34)',enemyTint:'#72efc1',spawn:.98,roster:'swarm'},
 {id:'frost',icon:'❄️',name:'설봉고도',tag:'암기·한기',ground:'#111927',sky1:'#101c31',sky2:'#070b15',accent:'#8fdcff',patch:['rgba(54,78,105,.30)','rgba(44,62,88,.28)','rgba(88,110,132,.20)','rgba(35,52,74,.30)'],road:'rgba(92,112,134,.42)',deco:'rgba(143,216,255,.28)',enemyTint:'#8fdcff',spawn:1.05,roster:'ranged'},
 {id:'ember',icon:'🔥',name:'적벽협곡',tag:'외공·돌진',ground:'#1b1513',sky1:'#22120f',sky2:'#090706',accent:'#ff9a62',patch:['rgba(92,48,31,.28)','rgba(66,45,36,.30)','rgba(114,56,31,.18)','rgba(59,37,31,.30)'],road:'rgba(112,76,61,.38)',deco:'rgba(255,145,89,.24)',enemyTint:'#ff9a62',spawn:1.08,roster:'brute'},
 {id:'crypt',icon:'🪦',name:'고묘지궁',tag:'기문·변칙',ground:'#17141c',sky1:'#181124',sky2:'#08070d',accent:'#c391ff',patch:['rgba(70,51,82,.28)','rgba(55,48,68,.30)','rgba(87,63,92,.20)','rgba(42,38,52,.32)'],road:'rgba(83,71,91,.40)',deco:'rgba(195,145,255,.24)',enemyTint:'#c391ff',spawn:1.02,roster:'arcane'}
];
const ENEMY_INFO={basic:{icon:'⚔️',name:'외문 무사',desc:'정면에서 검을 들고 꾸준히 압박'},fast:{icon:'🥷',name:'경공 자객',desc:'빠른 경공과 지그재그 이동으로 측면을 파고듦'},tank:{icon:'🛡️',name:'철포삼 고수',desc:'높은 체력 · 근접하면 내공 충격파'},ranged:{icon:'🎯',name:'암기수',desc:'거리를 유지하며 비도와 암기를 투척'},charger:{icon:'💥',name:'패도 무사',desc:'자세를 잡은 뒤 직선 돌진'},elite:{icon:'✨',name:'내문 고수',desc:'강화된 내공과 높은 전리품'},midboss:{icon:'🏯',name:'호법',desc:'문파의 고유 절기를 사용하는 중간 고수'},boss:{icon:'👑',name:'장문인',desc:'복합 절기와 강력한 내공을 사용하는 문파 수장'}};
const MAP_GUIDES={swarm:'⚔️ 외문 무사 · 🥷 경공 자객 · 🛡️ 철포삼 고수',ranged:'🎯 암기수 · 🛡️ 철포삼 고수 · 🥷 경공 자객',brute:'💥 패도 무사 · 🛡️ 철포삼 고수 · 🥷 경공 자객',arcane:'🎯 기문 암기수 · 💥 패도 무사 · 🥷 변칙 경공'};
const stars=Array.from({length:220},()=>({x:Math.random()*WORLD_W,y:Math.random()*WORLD_H,r:Math.random()*1.4+.25,a:Math.random()*.18+.03}));const ruins=Array.from({length:40},()=>({x:rand(140,WORLD_W-140),y:rand(140,WORLD_H-140),r:rand(24,58),rot:rand(0,Math.PI)}));
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}function rand(a,b){return a+Math.random()*(b-a)}function pick(a){return a[Math.floor(Math.random()*a.length)]}function round(n,d=0){const p=10**d;return Math.round(n*p)/p}function fmt(sec){sec=Math.floor(sec);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function dist2(x1,y1,x2,y2){const dx=x1-x2,dy=y1-y2;return dx*dx+dy*dy}
function pathRoundRect(c,x,y,w,h,r=0){
 const rr=Math.max(0,Math.min(Number(r)||0,Math.abs(w)/2,Math.abs(h)/2));
 if(!rr){c.rect(x,y,w,h);return}
 const x2=x+w,y2=y+h;c.moveTo(x+rr,y);c.lineTo(x2-rr,y);c.arcTo(x2,y,x2,y+rr,rr);c.lineTo(x2,y2-rr);c.arcTo(x2,y2,x2-rr,y2,rr);c.lineTo(x+rr,y2);c.arcTo(x,y2,x,y2-rr,rr);c.lineTo(x,y+rr);c.arcTo(x,y,x+rr,y,rr);c.closePath();
}

function angleDiff(a,b){let d=(a-b+Math.PI)%(Math.PI*2)-Math.PI;return d<-Math.PI?d+Math.PI*2:d}
function pointSegDistance(px,py,x1,y1,x2,y2){const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,c1=vx*wx+vy*wy;if(c1<=0)return Math.hypot(px-x1,py-y1);const c2=vx*vx+vy*vy;if(c2<=c1)return Math.hypot(px-x2,py-y2);const t=c1/c2;return Math.hypot(px-(x1+t*vx),py-(y1+t*vy))}
function selectMapTheme(){let choices=MAP_THEMES.filter(m=>m.id!==lastMapId);currentMap=pick(choices.length?choices:MAP_THEMES);lastMapId=currentMap.id;return currentMap}
function safeWorldPoint(minCenter=250){for(let n=0;n<60;n++){const x=rand(130,WORLD_W-130),y=rand(130,WORLD_H-130);if(dist2(x,y,WORLD_W/2,WORLD_H/2)<minCenter*minCenter)continue;return{x,y}}return{x:400,y:400}}
function generateWorld(){selectMapTheme();terrainPatches=Array.from({length:96},(_,i)=>({x:rand(120,WORLD_W-120),y:rand(120,WORLD_H-120),rx:rand(120,330),ry:rand(90,250),rot:rand(0,Math.PI),kind:i%4}));groundDecos=Array.from({length:680},()=>({x:rand(60,WORLD_W-60),y:rand(60,WORLD_H-60),kind:Math.floor(rand(0,5)),rot:rand(0,Math.PI*2),scale:rand(.7,1.45)}));fogWisps=Array.from({length:58},()=>({x:rand(0,WORLD_W),y:rand(0,WORLD_H),r:rand(100,240),speed:rand(4,12),phase:rand(0,Math.PI*2)}));mapPaths=[];for(let p=0;p<3;p++){const horizontal=p!==1,pts=[];if(horizontal){pts.push({x:80,y:rand(WORLD_H*.18,WORLD_H*.82)});pts.push({x:WORLD_W*.32,y:rand(WORLD_H*.15,WORLD_H*.85)});pts.push({x:WORLD_W*.68,y:rand(WORLD_H*.15,WORLD_H*.85)});pts.push({x:WORLD_W-80,y:rand(WORLD_H*.18,WORLD_H*.82)})}else{pts.push({x:rand(WORLD_W*.2,WORLD_W*.8),y:80});pts.push({x:rand(WORLD_W*.15,WORLD_W*.85),y:WORLD_H*.34});pts.push({x:rand(WORLD_W*.15,WORLD_W*.85),y:WORLD_H*.68});pts.push({x:rand(WORLD_W*.2,WORLD_W*.8),y:WORLD_H-80})}mapPaths.push(pts)}mapLandmarks=[];const lmKinds=currentMap.id==='forest'?['shrine','tree','crystal','gate']:currentMap.id==='frost'?['crystal','obelisk','gate','shrine']:currentMap.id==='ember'?['forge','obelisk','crystal','gate']:['obelisk','shrine','gate','crystal'];for(let i=0;i<14;i++){const p=safeWorldPoint(420);mapLandmarks.push({x:p.x,y:p.y,kind:pick(lmKinds),r:rand(32,55),phase:rand(0,Math.PI*2)})}chests=[];for(let i=0;i<12;i++){const p=safeWorldPoint(320);chests.push({x:p.x,y:p.y,opened:false,elite:i>=9})}springs=[];for(let i=0;i<6;i++){const p=safeWorldPoint(360);springs.push({x:p.x,y:p.y,cooldown:0,maxCooldown:34})}obstacles=[];const poi=[...chests.map(o=>[o.x,o.y,105]),...springs.map(o=>[o.x,o.y,125]),...mapLandmarks.map(o=>[o.x,o.y,o.r+70]),[WORLD_W/2,WORLD_H/2,330]],types=currentMap.id==='frost'?['rock','pillar','pillar','ruin','ruin','tree']:currentMap.id==='ember'?['rock','rock','rock','ruin','pillar','tree']:currentMap.id==='crypt'?['pillar','ruin','ruin','tree','rock','pillar']:['rock','rock','tree','tree','pillar','ruin'];for(let n=0;n<190&&obstacles.length<96;n++){const x=rand(110,WORLD_W-110),y=rand(110,WORLD_H-110),type=pick(types),r=type==='rock'?rand(28,46):type==='tree'?rand(28,40):type==='pillar'?rand(25,34):rand(36,52);if(poi.some(([px,py,pr])=>dist2(x,y,px,py)<(r+pr)*(r+pr)))continue;if(obstacles.some(o=>dist2(x,y,o.x,o.y)<(r+o.r+52)*(r+o.r+52)))continue;obstacles.push({x,y,r,type,rot:rand(0,Math.PI*2),variant:Math.floor(rand(0,3))})}}
function resetWorldInteractions(){for(const c of chests)c.opened=false;for(const s of springs)s.cooldown=0}
function resolveObstacleCollision(ent,radius,slideBias=0){
 for(const o of obstacles){const rr=radius+o.r*.78,dx=ent.x-o.x,dy=ent.y-o.y,d2v=dx*dx+dy*dy;if(d2v>=rr*rr)continue;let d=Math.sqrt(d2v)||.001,nx=dx/d,ny=dy/d;ent.x=o.x+nx*rr;ent.y=o.y+ny*rr;if(slideBias){ent.x+=-ny*slideBias;ent.y+=nx*slideBias}}
}
function bulletHitsObstacle(b){for(const o of obstacles){const rr=b.r+o.r*.72;if(dist2(b.x,b.y,o.x,o.y)<rr*rr)return true}return false}

function stageProgress(){return Math.min(1,elapsed/STAGE_DURATION)}
function activeWaveAt(t=elapsed){return WAVE_SCHEDULE.find(w=>t>=w.start&&t<w.start+w.duration)||null}
function nextWaveAt(t=elapsed){return WAVE_SCHEDULE.find(w=>t<w.start)||null}
function updateWaveState(){const w=activeWaveAt();const key=w?`${w.start}-${w.type}`:null;if(w&&key!==lastWaveKey){lastWaveKey=key;showToast(`${w.icon} 특수 웨이브 · ${w.name}`);if(navigator.vibrate)navigator.vibrate([25,20,25])}currentWave=w;if(w){waveBadge.classList.remove('hidden');$('waveName').textContent=`${w.icon} ${w.name}`;$('waveTime').textContent=`${Math.max(0,Math.ceil(w.start+w.duration-elapsed))}초 · ${w.desc}`}else{waveBadge.classList.add('hidden');const n=nextWaveAt();if(n&&n.start-elapsed<=6&&n.start-elapsed>0){waveBadge.classList.remove('hidden');$('waveName').textContent=`⚠️ ${n.name} 임박`;$('waveTime').textContent=`${Math.ceil(n.start-elapsed)}초 후 시작`}}}
function waveEnemyType(){if(!currentWave)return null;const r=Math.random(),mode=currentMap.roster;if(currentWave.type==='rush')return r<.58?'fast':r<.78?'charger':'basic';if(currentWave.type==='swarm')return r<.62?'basic':r<.86?'fast':mode==='ranged'?'ranged':'tank';if(currentWave.type==='ranged')return r<.48?'ranged':r<.70?'charger':r<.86?'fast':'tank';if(currentWave.type==='brute')return r<.48?'tank':r<.72?'charger':r<.88?'fast':'elite';return null}
function xpNeededForLevel(lv){return Math.round(6+2.2*lv+1.05*lv*lv)}function screenCombatRange(){return Math.max(240,Math.min(460,Math.hypot(W,H)*.47))}function isOnCombatScreen(e,margin=46){return e.x>=camera.x-margin&&e.x<=camera.x+W+margin&&e.y>=camera.y-margin&&e.y<=camera.y+H+margin}
function stageItemLevel(){return Math.max(1,currentStage+Math.floor(stageProgress()*2))}
function syncPlayerToEquipment(oldStats,oldWeaponType){if(!running||!player)return;const lv=profile.soulLevel,newStats=aggregateStats(),oldWd=weaponDefs[oldWeaponType||'sword']||weaponDefs.sword,w=getWeapon(),newWd=weaponDefs[w.weaponType||'sword']||weaponDefs.sword;const oldBaseDamage=14*(1+(lv-1)*.015)+oldStats.damage,newBaseDamage=14*(1+(lv-1)*.015)+newStats.damage,damageFactor=oldBaseDamage>0?player.damage/oldBaseDamage:1;player.damage=newBaseDamage*damageFactor;const oldBaseHp=100+(lv-1)*2+oldStats.maxHp,battleHp=Math.max(0,player.maxHp-oldBaseHp),hpRatio=player.maxHp>0?player.hp/player.maxHp:1;player.maxHp=100+(lv-1)*2+newStats.maxHp+battleHp;player.hp=Math.min(player.maxHp,Math.max(1,player.maxHp*hpRatio));const oldBaseSpeed=185*(1+oldStats.movePct/100),speedFactor=oldBaseSpeed>0?player.speed/oldBaseSpeed:1;player.speed=185*(1+newStats.movePct/100)*speedFactor;const oldBaseFire=oldWd.fireRate/(1+oldStats.fireRatePct/100),fireFactor=oldBaseFire>0?player.fireRate/oldBaseFire:1;player.fireRate=newWd.fireRate/(1+newStats.fireRatePct/100)*fireFactor;player.magnet=70+newStats.magnet+(player.magnet-(70+oldStats.magnet));player.crit=5+newStats.crit+(newWd.critBonus||0)+(player.crit-(5+oldStats.crit+(oldWd.critBonus||0)));player.damageReduction=newStats.damageReduction+(player.damageReduction-oldStats.damageReduction);player.regen=newStats.regen+(player.regen-oldStats.regen);player.goldBonus=newStats.goldBonus;player.bulletSize=newWd.size+newStats.bulletSize;player.bulletSpeed=newWd.speed;player.weaponType=w.weaponType||'sword';$('weaponIcon').textContent=w.icon;$('weaponName').textContent=newWd.name;updateHUD()}
function closeItemModal(){itemModal.classList.add('hidden');if(itemModalResume&&running){itemModalResume=false;paused=false;last=performance.now()}}
function acquireRunItem(item){if(runLoot.length>=18){runGold+=15;showToast('🎒 전투 가방이 가득 차 장비를 15골드로 전환했습니다.');return}runLoot.push(item);addItemToInventory(item);saveProfile();paused=true;itemModalResume=true;openItem(item.id,null,true);if(navigator.vibrate)navigator.vibrate([20,20,35])}
function updateWorldInteractions(dt){for(const s of springs){s.cooldown=Math.max(0,s.cooldown-dt);const d=Math.hypot(player.x-s.x,player.y-s.y);if(d<62&&s.cooldown<=0&&player.hp<player.maxHp*.96){const heal=Math.max(24,player.maxHp*.28);player.hp=Math.min(player.maxHp,player.hp+heal);s.cooldown=s.maxCooldown;floatText(s.x,s.y-34,`+${Math.round(heal)} HP`,'#78f6df');burst(s.x,s.y,16,currentMap.accent);showToast('💧 회복의 샘이 생명력을 회복했습니다.')}}for(const c of chests){if(c.opened)continue;const d=Math.hypot(player.x-c.x,player.y-c.y);if(d<48){c.opened=true;const gold=Math.floor(rand(c.elite?32:18,c.elite?58:42));runGold+=gold;burst(c.x,c.y,18,c.elite?'#ffd164':currentMap.accent);let item=false;if(c.elite||Math.random()<.62){dropLoot(c.x,c.y-22,c.elite);item=true}showToast(`🧰 보물상자: 🪙 ${gold}${item?' + 장비':''}`);if(navigator.vibrate)navigator.vibrate([20,25,35])}}zoneBadge.classList.remove('danger');zoneBadge.textContent=`${currentMap.icon} ${currentMap.name} · ${currentMap.tag}`;enemyGuide.textContent=MAP_GUIDES[currentMap.roster]||'👹 다양한 적 패턴'}
function starterItem(slot,name,icon,stats,weaponType=null){const item={id:uid(),slot,name,icon,rarity:'common',level:1,stats:{...stats},affixes:[],weaponType};item.score=calcItemScore(item);return item}
function freshProfile(){const w=starterItem('weapon','수련용 청강검','⚔️',{damage:4},'sword');return {version:6,gold:0,soulXp:0,soulLevel:1,highestStage:1,bestTime:0,bestKills:0,totalKills:0,inventory:[w],equipped:{weapon:w.id,head:null,chest:null,gloves:null,legs:null,boots:null,accessory1:null,accessory2:null,accessory3:null},skillsOwned:[],equippedSkills:[null,null,null],shopStock:[],shopRefreshes:0,starterLoadoutV414:true}}
function migrateV2(v2){const p=freshProfile();p.gold=v2.gold||0;p.soulXp=v2.soulXp||0;p.soulLevel=v2.soulLevel||1;p.bestTime=v2.bestTime||0;p.bestKills=v2.bestKills||0;p.totalKills=v2.totalKills||0;p.highestStage=v2.highestStage||1;for(const old of (v2.inventory||[])){let slot=old.slot==='armor'?'chest':old.slot==='accessory'?'accessory':old.slot;if(!itemBases[slot]&&slot!=='weapon')continue;const ni={...old,id:uid(),slot,affixes:old.affixes||[]};if(slot==='weapon'&&!ni.weaponType){const n=String(ni.name||'');ni.weaponType=n.includes('활')?'bow':(n.includes('지팡이')||n.includes('죽장')||n.includes('백우선'))?'staff':n.includes('단검')?'dagger':'sword'}ni.score=calcItemScore(ni);p.inventory.push(ni)}const bySlot=s=>p.inventory.filter(i=>i.slot===s).sort((a,b)=>b.score-a.score)[0];for(const s of ['weapon','head','chest','gloves','legs','boots']){const best=bySlot(s);if(best)p.equipped[s]=best.id}const acc=p.inventory.filter(i=>i.slot==='accessory').sort((a,b)=>b.score-a.score).slice(0,3);acc.forEach((i,idx)=>p.equipped[`accessory${idx+1}`]=i.id);return p}
function upgradeProfile(p){if(!p)return freshProfile();p.version=4;p.highestStage=p.highestStage||1;p.inventory=Array.isArray(p.inventory)?p.inventory:[];p.equipped=p.equipped||{};p.skillsOwned=Array.isArray(p.skillsOwned)&&p.skillsOwned.length?p.skillsOwned.filter(id=>skillDefs[id]):['flame'];if(!p.skillsOwned.includes('flame'))p.skillsOwned.unshift('flame');p.equippedSkills=Array.isArray(p.equippedSkills)?p.equippedSkills.slice(0,3):['flame',null,null];while(p.equippedSkills.length<3)p.equippedSkills.push(null);p.equippedSkills=p.equippedSkills.map(id=>id&&p.skillsOwned.includes(id)&&skillDefs[id]?id:null);if(!p.equippedSkills.some(Boolean))p.equippedSkills[0]='flame';p.shopStock=Array.isArray(p.shopStock)?p.shopStock:[];p.shopRefreshes=Number.isFinite(p.shopRefreshes)?p.shopRefreshes:0;return p}
function loadProfile(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY));if(p&&Array.isArray(p.inventory))return upgradeProfile(p);const old3=JSON.parse(localStorage.getItem(OLD_KEY));if(old3&&Array.isArray(old3.inventory)){const migrated=upgradeProfile(old3);localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}const old2=JSON.parse(localStorage.getItem(OLDER_KEY));if(old2&&old2.version===2){const migrated=upgradeProfile(migrateV2(old2));localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}}catch(e){}return freshProfile()}function saveProfile(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(profile))}catch(e){console.warn('saveProfile failed',e)}}
function soulNeed(lv){return 45+lv*25}function checkSoulLevel(){let leveled=false;while(profile.soulXp>=soulNeed(profile.soulLevel)){profile.soulXp-=soulNeed(profile.soulLevel);profile.soulLevel++;leveled=true}if(leveled)showToast(`🌟 영혼 레벨 ${profile.soulLevel} 달성!`)}
function itemCategory(i){return i.slot==='weapon'?'weapon':i.slot==='accessory'?'accessory':'armor'}function itemCanEquipTo(i,slot){return i.slot==='accessory'?slot.startsWith('accessory'):i.slot===slot}function equippedItem(slot){const id=profile.equipped[slot];return profile.inventory.find(i=>i.id===id)||null}function equippedIds(){return new Set(Object.values(profile.equipped).filter(Boolean))}
function activeSetInfo(){const counts={};for(const slot of ['head','chest','gloves','legs','boots']){const i=equippedItem(slot);if(i?.setId)counts[i.setId]=(counts[i.setId]||0)+1}return counts}function aggregateStats(){const out={damage:0,maxHp:0,fireRatePct:0,movePct:0,crit:0,damageReduction:0,magnet:0,goldBonus:0,regen:0,bulletSize:0};const seen=new Set();for(const slot of Object.keys(equipSlots)){const i=equippedItem(slot);if(!i||seen.has(i.id))continue;seen.add(i.id);for(const [k,v] of Object.entries(i.stats||{}))out[k]=(out[k]||0)+v}const counts=activeSetInfo();for(const [setId,count] of Object.entries(counts)){const def=setDefs[setId];for(const need of [2,3,5])if(count>=need)for(const [k,v] of Object.entries(def.bonuses[need]))out[k]=(out[k]||0)+v}return out}
function calcItemScore(item){const stats=item.stats||item,w={damage:6,maxHp:.8,fireRatePct:4.2,movePct:3.4,crit:5.2,damageReduction:8,magnet:.18,goldBonus:2.2,regen:16,bulletSize:4};let score=Object.entries(stats).reduce((s,[k,v])=>s+(w[k]||0)*v,0);if(item.weaponType)score+=({sword:18,dagger:18,bow:22,staff:22,hammer:24,spear:23,axe:24,grimoire:23}[item.weaponType]||0);return Math.round(score)}function combatPower(){const s=aggregateStats();return Math.round(100+profile.soulLevel*14+s.damage*8+s.maxHp*1.35+s.fireRatePct*5+s.crit*5+s.damageReduction*9+s.movePct*3+s.magnet*.18+s.regen*20)}
function statLabel(k,v){const m={damage:['공격력',`+${round(v,1)}`],maxHp:['최대 HP',`+${round(v)}`],fireRatePct:['공격속도',`+${round(v,1)}%`],movePct:['이동속도',`+${round(v,1)}%`],crit:['치명타',`+${round(v,1)}%`],damageReduction:['피해 감소',`+${round(v,1)}%`],magnet:['획득 범위',`+${round(v)}`],goldBonus:['골드 획득',`+${round(v,1)}%`],regen:['초당 회복',`+${round(v,2)}`],bulletSize:['투사체 크기',`+${round(v,1)}`]};return m[k]||[k,`+${v}`]}
function slotLabelForItem(i){return i.slot==='accessory'?'장신구':equipSlots[i.slot]?.name||i.slot}function rarityColor(r){return {common:'#b9c1d2',rare:'#59a9ff',epic:'#c06fff',legendary:'#ffb149',mythic:'#ff5f75'}[r]}
function renderHome(){$('profileLevel').textContent=profile.soulLevel;$('combatPower').textContent=combatPower();$('profileGold').textContent=profile.gold;const st=profile.highestStage||1;$('stageHomeTitle').textContent=`STAGE ${st} · 랜덤 원정`;$('stageHomeDesc').textContent='7:00 · 4회 특수 웨이브 · 중간/최종 보스';$('startBtn').textContent=`스테이지 ${st} 시작`;const order=['weapon','head','chest','gloves','legs','boots','accessory1','accessory2','accessory3'];$('homeEquip').innerHTML=order.map(slot=>{const i=equippedItem(slot),info=equipSlots[slot];return `<div class="homeSlot"><span class="hi">${i?i.icon:info.icon}</span><small>${info.name.replace('장신구 ','장')}</small><b class="${i?rarityInfo[i.rarity].class:''}">${i?escapeHtml(i.name):'비어 있음'}</b></div>`}).join('');$('homeSkills').innerHTML=profile.equippedSkills.map((id,idx)=>{const sk=id?skillDefs[id]:null;return `<div class="homeSkill ${sk?'':'empty'}"><span class="si">${sk?sk.icon:'＋'}</span><small>스킬 ${idx+1}</small><b>${sk?sk.name:'비어 있음'}</b></div>`}).join('')}

function renderSkills(){const slots=$('skillSlots');slots.innerHTML=profile.equippedSkills.map((id,idx)=>{const sk=id?skillDefs[id]:null;return `<div class="skillSlot"><span class="icon">${sk?sk.icon:'＋'}</span><small>스킬 슬롯 ${idx+1}</small><b>${sk?sk.name:'비어 있음'}</b>${sk?`<button class="miniBtn remove mt8" data-remove-skill="${idx}">해제</button>`:''}</div>`}).join('');$('ownedSkillCount').textContent=`${profile.skillsOwned.length} / ${Object.keys(skillDefs).length}개`;$('skillInventory').innerHTML=profile.skillsOwned.map(id=>{const sk=skillDefs[id],eq=profile.equippedSkills.indexOf(id),pairs=Object.values(evolutionDefs).filter(e=>e.skill===id).map(e=>`${weaponDefs[e.weapon].icon} ${weaponDefs[e.weapon].name} → ${e.name}`).join(' / ');return `<div class="skillCard"><div class="skillCardTop"><div class="skillIcon">${sk.icon}</div><div><h3>${sk.name}${eq>=0?` · 장착 ${eq+1}`:''}</h3><p>${sk.desc}<br>기본 재사용 ${sk.baseCooldown.toFixed(1)}초 · 전투 중 최대 Lv.5${pairs?`<br><b style="color:#f2d787">진화 조합:</b> ${pairs}`:''}</p></div></div><div class="skillAssign">${[0,1,2].map(n=>`<button class="miniBtn ${eq===n?'active':''}" data-assign-skill="${id}" data-skill-slot="${n}">${n+1}번 ${eq===n?'장착 중':'장착'}</button>`).join('')}</div></div>`}).join('');document.querySelectorAll('[data-assign-skill]').forEach(b=>b.onclick=()=>{const id=b.dataset.assignSkill,n=+b.dataset.skillSlot;profile.equippedSkills=profile.equippedSkills.map(x=>x===id?null:x);profile.equippedSkills[n]=id;saveProfile();renderSkills();renderHome();showToast(`${skillDefs[id].icon} ${skillDefs[id].name} · ${n+1}번 슬롯 장착`)});document.querySelectorAll('[data-remove-skill]').forEach(b=>b.onclick=()=>{profile.equippedSkills[+b.dataset.removeSkill]=null;saveProfile();renderSkills();renderHome()})}
function openSkillScreen(from='home'){skillReturn=from;startScreen.classList.add('hidden');gameover.classList.add('hidden');renderSkills();skillScreen.classList.remove('hidden')}
function closeSkillScreen(){skillScreen.classList.add('hidden');renderHome();if(skillReturn==='result')gameover.classList.remove('hidden');else startScreen.classList.remove('hidden')}
function shopItemPrice(item){const rarityBonus={common:10,rare:24,epic:52,legendary:95,mythic:160}[item.rarity]||0;return Math.max(35,Math.round(item.score*.58+rarityBonus+item.level*5))}
function sellItemPrice(item){return Math.max(6,Math.round(shopItemPrice(item)*.36))}
function createShopStock(){const stage=Math.max(1,profile.highestStage||1),stock=[];for(let i=0;i<3;i++){const item=generateItem(stage,Math.random()<.38);stock.push({offerId:uid(),type:'item',item,price:shopItemPrice(item),sold:false})}const locked=Object.keys(skillDefs).filter(id=>!profile.skillsOwned.includes(id));const skillOffers=[];while(locked.length&&skillOffers.length<2){const id=locked.splice(Math.floor(Math.random()*locked.length),1)[0];skillOffers.push({offerId:uid(),type:'skill',skillId:id,price:skillDefs[id].price,sold:false})}stock.push(...skillOffers);while(stock.length<5){const item=generateItem(stage,true);stock.push({offerId:uid(),type:'item',item,price:shopItemPrice(item),sold:false})}profile.shopStock=stock;saveProfile()}
function ensureShopStock(){if(!Array.isArray(profile.shopStock)||!profile.shopStock.length)createShopStock()}
function renderShop(){ensureShopStock();$('shopGold').textContent=profile.gold;$('shopBuyTab').classList.toggle('active',shopMode==='buy');$('shopSellTab').classList.toggle('active',shopMode==='sell');const content=$('shopContent');if(shopMode==='buy'){content.innerHTML=`<div class="shopGrid">${profile.shopStock.map(o=>{if(o.type==='skill'){const sk=skillDefs[o.skillId];return `<div class="shopCard ${o.sold?'sold':''}"><div class="offerIcon">${sk.icon}</div><div class="offerType">스킬</div><div class="offerName">${sk.name}</div><div class="offerDesc">${sk.desc}<br>장착 슬롯 3개 중 선택 가능</div><div class="offerPrice">🪙 ${o.price}</div><button class="miniBtn" data-buy-offer="${o.offerId}" ${o.sold?'disabled':''}>${o.sold?'구매 완료':'구매'}</button></div>`}const i=o.item,r=rarityInfo[i.rarity];return `<div class="shopCard ${o.sold?'sold':''}"><div class="offerIcon">${i.icon}</div><div class="offerType ${r.class}">${r.name} · ${slotLabelForItem(i)}</div><div class="offerName">${escapeHtml(i.name)}</div><div class="offerDesc">⚡ ${i.score}<br>${Object.entries(i.stats).slice(0,2).map(([k,v])=>statLabel(k,v).join(' ')).join(' · ')}</div><div class="offerPrice">🪙 ${o.price}</div><button class="miniBtn" data-buy-offer="${o.offerId}" ${o.sold?'disabled':''}>${o.sold?'구매 완료':'구매'}</button></div>`}).join('')}</div>`;document.querySelectorAll('[data-buy-offer]').forEach(b=>b.onclick=()=>buyShopOffer(b.dataset.buyOffer))}else{const eq=equippedIds(),sellable=profile.inventory.filter(i=>!eq.has(i.id)).sort((a,b)=>b.score-a.score);content.innerHTML=sellable.length?`<div class="sellList">${sellable.map(i=>`<div class="sellRow"><div><div class="name ${rarityInfo[i.rarity].class}">${i.icon} ${escapeHtml(i.name)}</div><div class="meta">${slotLabelForItem(i)} · ⚡${i.score}</div></div><button data-sell-item="${i.id}">판매<br>🪙 ${sellItemPrice(i)}</button></div>`).join('')}</div>`:'<div class="emptyInventory">판매 가능한 장비가 없습니다. 장착 중인 장비는 판매할 수 없습니다.</div>';document.querySelectorAll('[data-sell-item]').forEach(b=>b.onclick=()=>sellShopItem(b.dataset.sellItem))}const cost=30+(profile.shopRefreshes||0)*15;$('shopRefreshBtn').textContent=`🔄 물품 리로드 · 🪙 ${cost}`;$('shopRefreshBtn').disabled=profile.gold<cost}
function buyShopOffer(offerId){const o=profile.shopStock.find(x=>x.offerId===offerId);if(!o||o.sold)return;if(profile.gold<o.price){showToast('🪙 골드가 부족합니다.');return}if(o.type==='item'&&profile.inventory.length>=MAX_INVENTORY){showToast('🎒 인벤토리가 가득 찼습니다.');return}profile.gold-=o.price;o.sold=true;if(o.type==='item'){addItemToInventory(o.item);showToast(`${o.item.icon} ${o.item.name} 구매 완료`)}else{if(!profile.skillsOwned.includes(o.skillId))profile.skillsOwned.push(o.skillId);const empty=profile.equippedSkills.findIndex(x=>!x);if(empty>=0)profile.equippedSkills[empty]=o.skillId;showToast(`${skillDefs[o.skillId].icon} ${skillDefs[o.skillId].name} 습득!`)}saveProfile();renderShop();renderHome()}
function sellShopItem(id){const eq=equippedIds();if(eq.has(id))return;const i=profile.inventory.find(x=>x.id===id);if(!i)return;const gold=sellItemPrice(i);profile.inventory=profile.inventory.filter(x=>x.id!==id);profile.gold+=gold;saveProfile();renderShop();renderHome();showToast(`🪙 ${gold} 골드 획득`)}
function refreshShop(){const cost=30+(profile.shopRefreshes||0)*15;if(profile.gold<cost){showToast('🪙 리로드 골드가 부족합니다.');return}profile.gold-=cost;profile.shopRefreshes=(profile.shopRefreshes||0)+1;createShopStock();renderShop();renderHome();showToast('🔄 상점 물품이 갱신되었습니다.')}
function openShop(from='home'){shopReturn=from;shopMode='buy';startScreen.classList.add('hidden');gameover.classList.add('hidden');skillScreen.classList.add('hidden');renderShop();shopScreen.classList.remove('hidden')}
function closeShop(){shopScreen.classList.add('hidden');renderHome();if(shopReturn==='result')gameover.classList.remove('hidden');else startScreen.classList.remove('hidden')}

function renderEquipment(){ $('equipmentPower').textContent=combatPower();const order=['head','weapon','accessory1','gloves','chest','accessory2','legs','boots','accessory3'];$('equipSlots').innerHTML=order.map(slot=>{const i=equippedItem(slot),info=equipSlots[slot];return `<button class="equipSlot ${i?'':'empty'}" data-eqslot="${slot}"><span class="bigIcon">${i?i.icon:info.icon}</span><small>${info.name}</small><b class="${i?rarityInfo[i.rarity].class:''}">${i?escapeHtml(i.name):'비어 있음'}</b><div class="power">${i?`⚡ +${i.score}`:'탭하여 장착'}</div></button>`}).join('');document.querySelectorAll('[data-eqslot]').forEach(b=>b.onclick=()=>{const slot=b.dataset.eqslot,i=equippedItem(slot);if(i)openItem(i.id,slot);else{inventoryFilter=slot.startsWith('accessory')?'accessory':slot==='weapon'?'weapon':'armor';renderEquipment();showToast(`${equipSlots[slot].name} 장비를 선택하세요.`)}});
 const s=aggregateStats(),stats=[['공격력',round(14*(1+(profile.soulLevel-1)*.015)+s.damage,1)],['최대 HP',round(100+(profile.soulLevel-1)*2+s.maxHp)],['치명타',`${round(5+s.crit,1)}%`],['피해 감소',`${round(s.damageReduction,1)}%`],['이동속도',`+${round(s.movePct,1)}%`],['공격속도',`+${round(s.fireRatePct,1)}%`],['획득 범위',round(70+s.magnet)],['초당 회복',round(s.regen,2)]];$('permanentStats').innerHTML=stats.map(([a,b])=>`<div class="statLine">${a}<b>${b}</b></div>`).join('');const sets=activeSetInfo(),activeSetHtml=Object.entries(sets).filter(([,n])=>n>=2).map(([id,n])=>{const d=setDefs[id],unlocked=[2,3,5].filter(x=>n>=x);return `<div class="specialEffect"><b>${d.icon} ${d.name} ${n}/5 세트</b><br>${unlocked.map(x=>`${x}세트: ${Object.entries(d.bonuses[x]).map(([k,v])=>statLabel(k,v).join(' ')).join(' · ')}`).join('<br>')}</div>`}).join('');$('setEffects').innerHTML=activeSetHtml;
 document.querySelectorAll('.filterBtn').forEach(b=>b.classList.toggle('active',b.dataset.filter===inventoryFilter));let list=[...profile.inventory];if(inventoryFilter!=='all')list=list.filter(i=>itemCategory(i)===inventoryFilter);const orderMap={weapon:0,head:1,chest:2,gloves:3,legs:4,boots:5,accessory:6};list.sort((a,b)=>(orderMap[a.slot]??9)-(orderMap[b.slot]??9)||b.score-a.score);$('inventoryCount').textContent=`${profile.inventory.length} / ${MAX_INVENTORY}`;const eqIds=equippedIds();$('inventory').innerHTML=list.length?list.map(i=>{const r=rarityInfo[i.rarity],eq=eqIds.has(i.id),aff=(i.affixes||[]).slice(0,2).map(a=>a.name).join(' · ');return `<button class="itemCard ${eq?'equipped':''}" data-item="${i.id}"><span class="rarity ${r.class}">${r.name}${i.slot==='weapon'?'':' · Lv.'+i.level}</span><span class="name">${i.icon} ${escapeHtml(i.name)}</span><span class="meta">${slotLabelForItem(i)}${i.weaponType?` · ${weaponDefs[i.weaponType].desc}`:''}</span><span class="affix">${aff||Object.entries(i.stats).slice(0,2).map(([k,v])=>statLabel(k,v).join(' ')).join(' · ')}</span><span class="score">⚡ 전투력 +${i.score}</span></button>`}).join(''):'<div class="emptyInventory">해당 종류의 장비가 없습니다.</div>';document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>openItem(b.dataset.item))}
function openItem(id,preferredSlot=null,fromLoot=false){const i=profile.inventory.find(x=>x.id===id);if(!i){if(fromLoot)closeItemModal();return}const r=rarityInfo[i.rarity],accessorySlots=['accessory1','accessory2','accessory3'];let targetSlot=preferredSlot;if(!targetSlot){if(i.slot==='accessory'){targetSlot=accessorySlots.find(s=>profile.equipped[s]===i.id)||accessorySlots.find(s=>!profile.equipped[s])||'accessory1'}else targetSlot=i.slot}const cur=equippedItem(targetSlot),isEquipped=cur?.id===i.id,delta=i.score-(cur?.score||0);const special=i.weaponType?`<div class="specialEffect"><b>${i.icon} ${weaponDefs[i.weaponType].name} 고유 공격</b><br>${weaponDefs[i.weaponType].desc}${i.rarity==='mythic'?'<br>신화 장비: 공격 특성이 추가 강화됩니다.':''}</div>`:'';const pauseNote=fromLoot?'<div class="lootPause">⏸ 전투 일시정지 · 새 장비를 바로 비교하고 장착할 수 있습니다.</div>':'';const compare=i.slot==='accessory'?`<div class="compareBox"><div class="compareCell">새 장비<b>⚡ ${i.score}</b></div><div class="compareCell">장신구 슬롯<b>3개 중 선택</b></div></div>`:`<div class="compareBox"><div class="compareCell">현재 장착<b>${cur?`⚡ ${cur.score}`:'없음'}</b></div><div class="compareCell">장착 변화<b style="color:${delta>=0?'#72efc1':'#ff8292'}">${delta>=0?'+':''}${delta}</b></div></div>`;
 $('itemDetail').innerHTML=`${pauseNote}<div class="itemHero"><div class="itemIcon" style="box-shadow:0 0 22px ${rarityColor(i.rarity)}33">${i.icon}</div><div><h3>${escapeHtml(i.name)}</h3><div class="rarityLabel ${r.class}">${r.name} · ${slotLabelForItem(i)}${i.slot==='weapon'?'':' · Lv.'+i.level}</div><div style="font-size:10px;color:#aab2c7;margin-top:5px">⚡ 전투력 +${i.score}</div></div></div>${special}${i.setId?`<div class="specialEffect"><b>${setDefs[i.setId].icon} ${setDefs[i.setId].name} 세트</b><br>같은 세트 방어구 2 / 3 / 5부위 장착 시 추가 효과가 활성화됩니다.</div>`:''}${compare}<div class="detailStats">${Object.entries(i.stats).map(([k,v])=>{const [a,b]=statLabel(k,v);return `<div class="detailStat"><span>${a}</span><b>${b}</b></div>`}).join('')}</div>${(i.affixes||[]).length?`<div class="specialEffect">${i.affixes.map(a=>`✦ ${escapeHtml(a.name)}`).join('<br>')}</div>`:''}${i.slot==='accessory'?`<div class="accessoryChoices">${accessorySlots.map(s=>{const e=equippedItem(s),d=i.score-(e?.score||0);return `<button class="btn secondary" data-quickslot="${s}">${equipSlots[s].name}<br>${e?`⚡${e.score} → ${d>=0?'+':''}${d}`:'비어 있음'}</button>`}).join('')}</div>`:`<button class="btn wide" id="modalEquipBtn">${isEquipped?'장착 중':`${equipSlots[targetSlot].name}에 장착`}</button>`}<button class="btn ghost wide mt8" id="modalCloseBtn">${fromLoot?'보관하고 계속':'닫기'}</button>`;
 const equipTo=slot=>{const oldStats=aggregateStats(),oldWeaponType=getWeapon().weaponType||'sword';if(i.slot==='accessory'){for(const s of accessorySlots)if(profile.equipped[s]===i.id)profile.equipped[s]=null}profile.equipped[slot]=i.id;saveProfile();syncPlayerToEquipment(oldStats,oldWeaponType);renderEquipment();renderHome();showToast(`${i.icon} ${i.name} 장착`);closeItemModal()};if(i.slot==='accessory'){document.querySelectorAll('[data-quickslot]').forEach(b=>b.onclick=()=>equipTo(b.dataset.quickslot))}else{const btn=$('modalEquipBtn');btn.disabled=isEquipped;btn.onclick=()=>equipTo(targetSlot)}$('modalCloseBtn').onclick=closeItemModal;itemModal.classList.remove('hidden')}

function autoEquip(){for(const slot of ['weapon','head','chest','gloves','legs','boots']){const best=profile.inventory.filter(i=>i.slot===slot).sort((a,b)=>b.score-a.score)[0];if(best)profile.equipped[slot]=best.id}const acc=profile.inventory.filter(i=>i.slot==='accessory').sort((a,b)=>b.score-a.score).slice(0,3);['accessory1','accessory2','accessory3'].forEach((s,idx)=>profile.equipped[s]=acc[idx]?.id||null);saveProfile();renderEquipment();renderHome();showToast('⚡ 최고 전투력 장비를 자동 장착했습니다.')}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);if(player){player.x=Math.max(28,Math.min(WORLD_W-28,player.x));player.y=Math.max(28,Math.min(WORLD_H-28,player.y));camera.x=Math.max(0,Math.min(WORLD_W-W,player.x-W/2));camera.y=Math.max(0,Math.min(WORLD_H-H,player.y-H/2))}}addEventListener('resize',resize);resize();function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1550)}
function getWeapon(){return equippedItem('weapon')||{weaponType:'sword',name:'맨손',icon:'✊'}}function reset(){currentStage=profile.highestStage||1;generateWorld();const s=aggregateStats(),lv=profile.soulLevel,w=getWeapon(),wd=weaponDefs[w.weaponType||'sword'];player={x:WORLD_W/2,y:WORLD_H/2,r:17,speed:190*(1+s.movePct/100),hp:100+(lv-1)*2+s.maxHp,maxHp:100+(lv-1)*2+s.maxHp,damage:14*(1+(lv-1)*.015)+s.damage,fireRate:wd.fireRate/(1+s.fireRatePct/100),bulletSpeed:wd.speed,bulletSize:wd.size+s.bulletSize,magnet:72+s.magnet,crit:5+s.crit+(wd.critBonus||0),damageReduction:s.damageReduction,goldBonus:s.goldBonus,regen:s.regen,shield:0,hitFlash:0,weaponType:w.weaponType||'sword',facing:-Math.PI/2};camera={x:player.x-W/2,y:player.y-H/2};elapsed=spawnTimer=shotTimer=kills=xp=runGold=runSoulXp=0;level=1;xpNeed=xpNeededForLevel(level);seenEnemyTypes=new Set();enemies=[];bullets=[];enemyBullets=[];bossHazards=[];attackEffects=[];gems=[];coins=[];lootOrbs=[];particles=[];texts=[];runLoot=[];runSkillLevels={};skillCooldowns={};runEvolution=null;currentWave=null;lastWaveKey=null;weaponBadge.classList.remove('evolved');(profile.equippedSkills||[]).filter(Boolean).forEach((id,idx)=>{runSkillLevels[id]=1;skillCooldowns[id]=2+idx*1.1});bossesDefeated=0;bossSpawned=false;midBossSpawned=false;midBossDefeated=false;finalBossDefeated=false;stageExpired=false;paused=false;itemModalResume=false;input={x:0,y:0};resetWorldInteractions();zoneBadge.classList.remove('danger');zoneBadge.textContent=`${currentMap.icon} ${currentMap.name} · ${currentMap.tag}`;enemyGuide.textContent=MAP_GUIDES[currentMap.roster]||'👹 다양한 적 패턴';$('weaponIcon').textContent=w.icon;$('weaponName').textContent=wd.name;updateHUD()}
function start(){reset();running=true;startScreen.classList.add('hidden');gameover.classList.add('hidden');equipmentScreen.classList.add('hidden');skillScreen.classList.add('hidden');shopScreen.classList.add('hidden');hud.classList.remove('hidden');joystick.classList.remove('hidden');weaponBadge.classList.remove('hidden');skillBar.classList.remove('hidden');miniMap.classList.remove('hidden');zoneBadge.classList.remove('hidden');enemyGuide.classList.remove('hidden');waveBadge.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
function finishRun(cleared=false){if(!running)return;running=false;paused=false;itemModalResume=false;itemModal.classList.add('hidden');hud.classList.add('hidden');joystick.classList.add('hidden');weaponBadge.classList.add('hidden');skillBar.classList.add('hidden');miniMap.classList.add('hidden');zoneBadge.classList.add('hidden');enemyGuide.classList.add('hidden');waveBadge.classList.add('hidden');const baseGold=kills*2+Math.floor(Math.min(elapsed,STAGE_DURATION)/5)+bossesDefeated*28+(cleared?45+currentStage*12:0);runGold+=Math.round(baseGold*(1+player.goldBonus/100));runSoulXp=kills+Math.floor(Math.min(elapsed,STAGE_DURATION)/6)+bossesDefeated*18+(cleared?20+currentStage*5:0);if(cleared){const reward=generateItem(currentStage+1,true);runLoot.push(reward);addItemToInventory(reward);profile.highestStage=Math.max(profile.highestStage||1,currentStage+1);profile.shopStock=[];profile.shopRefreshes=0}else if(runLoot.length===0&&(kills>=8||elapsed>=20)){const consolation=generateItem(stageItemLevel(),false);runLoot.push(consolation);addItemToInventory(consolation)}profile.gold+=runGold;profile.soulXp+=runSoulXp;profile.totalKills+=kills;profile.bestTime=Math.max(profile.bestTime||0,Math.min(elapsed,STAGE_DURATION));profile.bestKills=Math.max(profile.bestKills||0,kills);checkSoulLevel();saveProfile();$('resultEyebrow').textContent=cleared?'원정 성공':'원정 실패';$('resultTitle').textContent=cleared?`🏆 STAGE ${currentStage} 클리어`:'💀 전투 종료';$('resultMessage').textContent=cleared?`다음 스테이지 ${currentStage+1}이 열렸습니다. 획득한 골드로 상점에서 장비를 구매하거나 물품을 리로드할 수 있습니다.`:`STAGE ${currentStage}에 다시 도전하거나 장비·스킬을 정비해 보세요.`;$('retryBtn').textContent=cleared?`스테이지 ${currentStage+1} 시작`:'다시 도전';$('finalTime').textContent=fmt(Math.min(elapsed,STAGE_DURATION));$('finalKills').textContent=kills;$('finalGold').textContent=runGold;$('finalSoulXp').textContent=runSoulXp;$('rewardItems').innerHTML=runLoot.length?`<div class="inventoryHeader"><b>획득 장비</b><span>${runLoot.length}개 · 이미 보관됨</span></div>`+runLoot.map(i=>`<div class="rewardItem"><div class="riLeft"><span class="riIcon">${i.icon}</span><div><b class="${rarityInfo[i.rarity].class}">${escapeHtml(i.name)}</b><small>${rarityInfo[i.rarity].name} · ${slotLabelForItem(i)}${i.slot==='weapon'?'':' · Lv.'+i.level}</small></div></div><b>⚡${i.score}</b></div>`).join(''):'<div class="subtitle">이번 전투에서는 장비를 획득하지 못했습니다.</div>';gameover.classList.remove('hidden');renderHome()}
function endGame(){finishRun(false)}
function clearStage(){finishRun(true)}
function addItemToInventory(item){profile.inventory.push(item);if(profile.inventory.length>MAX_INVENTORY){const eq=equippedIds(),sellable=profile.inventory.filter(i=>!eq.has(i.id)).sort((a,b)=>a.score-b.score);if(sellable.length){const rem=sellable[0];profile.inventory=profile.inventory.filter(i=>i.id!==rem.id);profile.gold+=Math.max(3,Math.floor(rem.score/4))}}}
function chooseRarity(forceBetter=false){let x=Math.random()*100;if(forceBetter)x*=.62;if(x<.8)return'mythic';if(x<4.5)return'legendary';if(x<15)return'epic';if(x<42)return'rare';return'common'}
function generateItem(itemLevel=1,forceBetter=false){const typeRoll=Math.random();let slot;if(typeRoll<.25)slot='weapon';else if(typeRoll<.72)slot=pick(['head','chest','gloves','legs','boots']);else slot='accessory';const base=pick(itemBases[slot]),rarity=chooseRarity(forceBetter),ri=rarityInfo[rarity],mult=ri.mult*(1+(itemLevel-1)*.13),stats={};for(const [k,v] of Object.entries(base.stats)){const n=v*mult*rand(.9,1.12);stats[k]=k==='regen'?round(n,2):round(n,1)}const affixes=[],pool=affixPools[slot];for(let n=0;n<ri.affixes;n++){const candidates=pool.filter(x=>!affixes.some(a=>a.key===x[0]));if(!candidates.length)break;const [k,v,label]=pick(candidates),amount=v*(1+(itemLevel-1)*.08)*rand(.85,1.18)*(rarity==='mythic'?1.15:1);stats[k]=round((stats[k]||0)+amount,k==='regen'?2:1);affixes.push({key:k,name:`${label} · ${statLabel(k,amount)[0]} ${statLabel(k,amount)[1]}`})}const prefixes={common:['낡은','단련된','수련용'],rare:['청명의','정예의','백련의'],epic:['명문의','현철의','절정의'],legendary:['대종사의','무림명기의','천강의'],mythic:['천하제일의','무극의','태허의']};let setId=null;if(['head','chest','gloves','legs','boots'].includes(slot)&&['epic','legendary','mythic'].includes(rarity)&&Math.random()<(rarity==='mythic'?.7:rarity==='legendary'?.5:.34))setId=pick(Object.keys(setDefs));const setPrefix=setId?`${setDefs[setId].name} · `:'';const item={id:uid(),slot,name:`${setPrefix}${pick(prefixes[rarity])} ${base.name}`,icon:base.icon,rarity,level:itemLevel,stats,affixes,weaponType:base.weaponType||null,setId};item.score=calcItemScore(item);return item}
function spawnPointAroundPlayer(){const minD=Math.max(W,H)*.62+90,maxD=Math.max(W,H)*.84+150;for(let n=0;n<24;n++){const a=rand(0,Math.PI*2),d=rand(minD,maxD),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;if(x<=40||x>=WORLD_W-40||y<=40||y>=WORLD_H-40)continue;if(obstacles.some(o=>dist2(x,y,o.x,o.y)<(o.r+45)*(o.r+45)))continue;return{x,y}}return{x:Math.max(40,Math.min(WORLD_W-40,player.x+rand(-maxD,maxD))),y:Math.max(40,Math.min(WORLD_H-40,player.y+rand(-maxD,maxD)))}}
function chooseEnemyType(){const forced=waveEnemyType();if(forced)return forced;const r=Math.random(),p=stageProgress(),mode=currentMap.roster;if(elapsed>85&&Math.random()<(0.01+p*.018+Math.min(.014,(currentStage-1)*.002)))return'elite';if(mode==='swarm'){if(elapsed<35)return'basic';if(p<.48)return r<.28?'fast':'basic';return r<.11?'tank':r<.39?'fast':'basic'}if(mode==='ranged'){if(elapsed<35)return'basic';if(p<.5)return r<.26?'ranged':r<.37?'fast':'basic';return r<.20?'ranged':r<.31?'tank':r<.43?'fast':'basic'}if(mode==='brute'){if(elapsed<34)return r<.18?'fast':'basic';if(p<.5)return r<.20?'charger':r<.38?'tank':'basic';return r<.22?'charger':r<.43?'tank':r<.52?'fast':'basic'}if(elapsed<34)return'basic';if(p<.5)return r<.20?'ranged':r<.39?'fast':'basic';return r<.24?'ranged':r<.39?'fast':r<.49?'charger':'basic'}
function spawnEnemy(type=null){const pos=spawnPointAroundPlayer(),x=pos.x,y=pos.y,progress=stageProgress(),stageScale=1+(currentStage-1)*.105,t=type||chooseEnemyType();const defs={basic:{r:15,hp:36,speed:62,damage:12,xp:1,gold:[1,3],behavior:'chase'},fast:{r:13,hp:25,speed:96,damage:10,xp:1,gold:[1,2],behavior:'zigzag'},tank:{r:21,hp:116,speed:42,damage:19,xp:3,gold:[2,5],behavior:'tank'},ranged:{r:15,hp:42,speed:51,damage:12,xp:2,gold:[2,4],behavior:'ranged'},charger:{r:18,hp:68,speed:58,damage:20,xp:3,gold:[2,5],behavior:'charger'},elite:{r:24,hp:205,speed:57,damage:23,xp:7,gold:[5,10],behavior:'zigzag'},midboss:{r:34,hp:620,speed:49,damage:25,xp:18,gold:[14,22],behavior:'midboss'},boss:{r:44,hp:1150,speed:46,damage:30,xp:32,gold:[26,40],behavior:'boss'}};const d=defs[t],hp=d.hp*stageScale*(1+progress*.44),damage=d.damage*(1+(currentStage-1)*.065)*(1+progress*.14),speed=d.speed*(1+(currentStage-1)*.012);enemies.push({x,y,type:t,r:d.r,hp,maxHp:hp,speed,damage,xp:d.xp,gold:d.gold,behavior:d.behavior,hit:0,phase:rand(0,Math.PI*2),attackTimer:rand(.8,2.1),skillTimer:t==='boss'?2.4:t==='midboss'?3.2:0,chargeTimer:rand(2.4,4.2),chargeState:0,chargeAngle:0});if(!seenEnemyTypes.has(t)&&!['midboss','boss'].includes(t)){seenEnemyTypes.add(t);const info=ENEMY_INFO[t];if(info)showToast(`${info.icon} ${info.name} · ${info.desc}`)}}
function spawnMidBoss(){spawnEnemy('midboss');midBossSpawned=true;showToast(`⚔️ ${currentMap.icon} 중간 보스 등장!`);if(navigator.vibrate)navigator.vibrate([25,25,35])}
function spawnBoss(){spawnEnemy('boss');showToast(`👑 ${currentMap.name}의 최종 보스 등장!`);if(navigator.vibrate)navigator.vibrate([35,35,50])}
function createEnemyBullet(x,y,angle,speed,damage,color,extra={}){enemyBullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:extra.r||6,damage,life:extra.life||5,color:color||'#ff8da0',homing:extra.homing||0,slow:extra.slow||0,trail:[]})}
function bossVolley(e,count=10,speed=175){for(let i=0;i<count;i++){const a=Math.PI*2*i/count+e.phase;createEnemyBullet(e.x,e.y,a,speed,e.damage*.42,currentMap.accent,{r:7,slow:currentMap.id==='frost'?.8:0})}e.phase+=.27}
function bossAimedBurst(e,count=3){const base=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.16;createEnemyBullet(e.x,e.y,base+off,215,e.damage*.48,currentMap.accent,{r:7,homing:currentMap.id==='crypt'?.6:0,slow:currentMap.id==='frost'?.6:0})}}
function bossHazardSkill(e,count=3){for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),d=i===0?0:rand(45,150);bossHazards.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:52+(e.type==='boss'?12:0),delay:.95+i*.12,life:.55,damage:e.damage*(e.type==='boss'?.72:.58),color:currentMap.accent,triggered:false})}}
function triggerBossSkill(e){if(e.type!=='boss'&&e.type!=='midboss')return;const final=e.type==='boss';if(currentMap.id==='forest'){if(final&&Math.random()<.5)bossVolley(e,12,165);else bossHazardSkill(e,final?4:2)}else if(currentMap.id==='frost'){if(Math.random()<.55)bossAimedBurst(e,final?5:3);else bossHazardSkill(e,final?4:2)}else if(currentMap.id==='ember'){if(Math.random()<.5){e.chargeState=.85;e.chargeAngle=Math.atan2(player.y-e.y,player.x-e.x);attackEffects.push({type:'bossTelegraph',x:e.x,y:e.y,angle:e.chargeAngle,r:180,life:.55,max:.55,color:currentMap.accent})}else bossHazardSkill(e,final?5:3)}else{if(Math.random()<.55)bossVolley(e,final?14:9,185);else bossAimedBurst(e,final?5:3)}}
function nearestEnemy(range=Infinity){let best=null,bd=Math.min(range,screenCombatRange())**2;for(const e of enemies){if(!isOnCombatScreen(e,54))continue;const dx=e.x-player.x,dy=e.y-player.y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e}}return best}
function createBullet(angle,wd,crit,extra={}){const speed=extra.speed||wd.speed,damage=(extra.damage??player.damage*wd.damageMult*(crit?1.8:1)),sx=extra.x??player.x,sy=extra.y??player.y,kind=extra.weaponType||player.weaponType,maxRange=extra.maxRange??(kind==='skill'?wd.range:Math.min(wd.range,screenCombatRange()));const evoColor=runEvolution&&kind!=='skill'?evolutionDefs[runEvolution]?.color:null;bullets.push({x:sx,y:sy,originX:sx,originY:sy,maxRange,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:extra.r??player.bulletSize,damage,crit,life:extra.life??(maxRange/Math.max(1,speed)),pierce:extra.pierce??wd.pierce??0,splash:extra.splash??wd.splash??0,trail:[],weaponType:kind,shape:extra.shape||player.weaponType,homing:extra.homing||0,color:extra.color||evoColor||null,slow:extra.slow||0,evolution:extra.evolution||runEvolution||null,chain:extra.chain||0,hitIds:new Set()})}
function dealDirectDamage(e,damage,crit=false,color='#72efc1'){if(!e||e.hp<=0)return;e.hp-=damage;burst(e.x,e.y,crit?6:4,crit?'#ffd164':color);if(crit)floatText(e.x,e.y-16,'회심!','#ffd164')}
function weaponCrit(){return Math.random()*100<player.crit}
function hitSword(angle,wd,crit){const evo=runEvolution==='infernoBlade',dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1),arc=evo ? .92 : .72,r=wd.range*(evo?1.22:1);attackEffects.push({type:'slash',x:player.x,y:player.y,angle,r,life:.24,max:.24,color:evo?'#ff9b62':(crit?'#ffd164':'#aef3dc')});if(evo)attackEffects.push({type:'slash',x:player.x,y:player.y,angle:angle+.22,r:r*.82,life:.29,max:.29,color:'#ffd06a'});for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);if(d<=r+e.r&&Math.abs(angleDiff(Math.atan2(dy,dx),angle))<=arc)dealDirectDamage(e,dmg,crit,evo?'#ff9b62':'#aef3dc')}}
function hitHammer(angle,wd,crit){const evo=runEvolution==='aegisMaul',cx=player.x+Math.cos(angle)*62,cy=player.y+Math.sin(angle)*62,r=evo?112:78,dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1);attackEffects.push({type:'slam',x:cx,y:cy,r,life:.34,max:.34,color:evo?'#8df2d2':(crit?'#ffd164':'#f5c77c')});for(const e of enemies)if(Math.hypot(e.x-cx,e.y-cy)<=r+e.r)dealDirectDamage(e,dmg,crit,evo?'#8df2d2':'#f5c77c');if(evo)player.shield=Math.min(player.maxHp*.55,(player.shield||0)+5+player.maxHp*.018)}
function hitSpear(angle,wd,crit){const evo=runEvolution==='soulLance',angles=evo?[angle-.16,angle,angle+.16]:[angle],dmg=player.damage*wd.damageMult*(evo?1.12:1)*(crit?1.8:1);for(const a of angles){const r=wd.range*(evo?1.18:1),x2=player.x+Math.cos(a)*r,y2=player.y+Math.sin(a)*r;attackEffects.push({type:'thrust',x:player.x,y:player.y,x2,y2,angle:a,life:.2,max:.2,color:evo?'#c9a7ff':(crit?'#ffd164':'#bde9ff')});for(const e of enemies)if(pointSegDistance(e.x,e.y,player.x,player.y,x2,y2)<=e.r+(evo?20:15))dealDirectDamage(e,dmg,crit,evo?'#c9a7ff':'#bde9ff')}}
function skillLevel(id){return runSkillLevels[id]||1}
function skillCooldown(id){const lv=skillLevel(id),sk=skillDefs[id],evo=runEvolution&&evolutionDefs[runEvolution]?.skill===id;return Math.max(1.85,sk.baseCooldown*(1-(lv-1)*.065)*(evo ? .78 : 1))}
function castSkill(id){const sk=skillDefs[id],lv=skillLevel(id);if(!sk||!player)return;const evolved=runEvolution&&evolutionDefs[runEvolution]?.skill===id,boost=evolved?1.32:1,rangeBoost=evolved?1.18:1,crit=Math.random()*100<player.crit*.45;if(id==='flame'){const r=(105+(lv-1)*13)*rangeBoost,dmg=player.damage*(.72+lv*.18)*boost*(crit?1.55:1);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.42,max:.42,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r)dealDirectDamage(e,dmg,crit,sk.color)}else if(id==='lightning'){let cur={x:player.x,y:player.y},candidates=enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,90)),points=[{x:player.x,y:player.y}],count=Math.min(candidates.length,2+lv+(evolved?2:0)),dmg=player.damage*(.62+lv*.16)*boost*(crit?1.5:1);for(let n=0;n<count;n++){let best=null,bd=(evolved?480:420)**2;for(const e of candidates){const d=dist2(cur.x,cur.y,e.x,e.y);if(d<bd){bd=d;best=e}}if(!best)break;dealDirectDamage(best,dmg,crit,sk.color);points.push({x:best.x,y:best.y});cur=best;candidates=candidates.filter(e=>e!==best)}if(points.length>1)attackEffects.push({type:'chain',points,life:.3,max:.3,color:sk.color})}else if(id==='frost'){const t=nearestEnemy(evolved?520:460);if(!t)return;const r=(86+(lv-1)*10)*rangeBoost,dmg=player.damage*(.55+lv*.13)*boost;attackEffects.push({type:'frost',x:t.x,y:t.y,r,life:.5,max:.5,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-t.x,e.y-t.y)<=r+e.r){dealDirectDamage(e,dmg,false,sk.color);e.slow=Math.max(e.slow||0,2+lv*.24)}}else if(id==='meteor'){const t=nearestEnemy(evolved?540:480);if(!t)return;const r=(92+(lv-1)*11)*rangeBoost,dmg=player.damage*(1.15+lv*.28)*boost*(crit?1.5:1);attackEffects.push({type:'meteor',x:t.x,y:t.y,r,life:.58,max:.58,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-t.x,e.y-t.y)<=r+e.r)dealDirectDamage(e,dmg,crit,sk.color)}else if(id==='blades'){const count=4+lv+(evolved?3:0),wd={speed:440,range:evolved?440:390,pierce:evolved?2:1,damageMult:1};for(let n=0;n<count;n++){const a=Math.PI*2*n/count+elapsed*.35;createBullet(a,wd,false,{damage:player.damage*(.55+lv*.1)*boost,r:evolved?7:6,shape:'soulblade',weaponType:'skill',color:sk.color,pierce:evolved?2:1})}}else if(id==='ward'){const amount=(18+lv*11+player.maxHp*.035)*boost;player.shield=Math.min(player.maxHp*(evolved ? .9 : .65),(player.shield||0)+amount);attackEffects.push({type:'ward',x:player.x,y:player.y,r:evolved?42:32,life:.5,max:.5,color:sk.color});floatText(player.x,player.y-30,`+${Math.round(amount)} 호신`,sk.color)}updateSkillHUD()}
function updateSkills(dt){for(const id of profile.equippedSkills){if(!id||!skillDefs[id])continue;skillCooldowns[id]=(skillCooldowns[id]??1)-dt;if(skillCooldowns[id]<=0){castSkill(id);skillCooldowns[id]=skillCooldown(id)}}}
function updateAttackEffects(dt){for(const a of attackEffects)a.life-=dt;attackEffects=attackEffects.filter(a=>a.life>0)}
function updateSkillHUD(){if(!skillBar)return;skillBar.innerHTML=profile.equippedSkills.map((id,idx)=>{if(!id||!skillDefs[id])return `<div class="battleSkill empty"><span class="icon">＋</span></div>`;const sk=skillDefs[id],cd=Math.max(0,skillCooldowns[id]||0),total=skillCooldown(id),pct=Math.min(1,cd/total);return `<div class="battleSkill"><div class="cd" style="transform:scaleY(${pct})"></div><span class="icon">${sk.icon}</span><span class="lv">Lv.${skillLevel(id)}</span><span class="sec">${cd>0.15?cd.toFixed(1):'준비'}</span></div>`}).join('')}

function shoot(){if(!enemies.length)return;const wd=weaponDefs[player.weaponType]||weaponDefs.sword,target=nearestEnemy(Math.max(wd.range,160));if(!target)return;const base=Math.atan2(target.y-player.y,target.x-player.x),crit=weaponCrit();player.facing=base;if(player.weaponType==='sword'){if(Math.hypot(target.x-player.x,target.y-player.y)<=wd.range*(runEvolution==='infernoBlade'?1.22:1)+target.r)hitSword(base,wd,crit);return}if(player.weaponType==='hammer'){if(Math.hypot(target.x-player.x,target.y-player.y)<=wd.range*(runEvolution==='aegisMaul'?1.16:1)+target.r)hitHammer(base,wd,crit);return}if(player.weaponType==='spear'){if(Math.hypot(target.x-player.x,target.y-player.y)<=wd.range*(runEvolution==='soulLance'?1.18:1)+target.r)hitSpear(base,wd,crit);return}if(player.weaponType==='axe'){const evolved=runEvolution==='volcanicAxes',count=evolved?8:wd.count;for(let n=0;n<count;n++)createBullet((Math.PI*2/count)*n+elapsed*.8,wd,crit,{shape:'axe',damage:player.damage*wd.damageMult*(evolved?1.12:1)*(crit?1.8:1),pierce:evolved?2:wd.pierce,r:evolved?10:player.bulletSize});return}if(player.weaponType==='dagger'&&runEvolution==='stormFangs'){for(let n=0;n<5;n++){const off=(n-2)*.115;createBullet(base+off,wd,crit,{shape:'dagger',damage:player.damage*wd.damageMult*.92*(crit?1.8:1),pierce:1,chain:1})}return}if(player.weaponType==='bow'&&runEvolution==='thunderBow'){for(let n=0;n<3;n++){const off=(n-1)*.11;createBullet(base+off,wd,crit,{shape:'arrow',damage:player.damage*wd.damageMult*1.08*(crit?1.8:1),pierce:3,chain:1})}return}if(player.weaponType==='staff'&&runEvolution==='glacialStaff'){for(let n=0;n<3;n++){const off=(n-1)*.17;createBullet(base+off,wd,crit,{shape:'arcane',damage:player.damage*wd.damageMult*1.05*(crit?1.8:1),pierce:3,r:player.bulletSize+2,slow:1.7})}return}if(player.weaponType==='grimoire'&&runEvolution==='astralCodex'){for(let n=0;n<5;n++){const off=(n-2)*.20;createBullet(base+off,wd,crit,{shape:'rune',homing:4.4,damage:player.damage*wd.damageMult*1.02*(crit?1.8:1),pierce:1})}return}for(let n=0;n<wd.count;n++){const off=wd.count===1?0:(n-(wd.count-1)/2)*(wd.spread||.12);const shape=player.weaponType==='dagger'?'dagger':player.weaponType==='bow'?'arrow':player.weaponType==='staff'?'arcane':'rune';createBullet(base+off,wd,crit,{shape,homing:player.weaponType==='grimoire'?3.2:0})}}
function addGem(x,y,value){gems.push({x,y,value,phase:Math.random()*6.28,dead:false})}function addCoin(x,y,value){coins.push({x,y,value,phase:Math.random()*6.28,dead:false})}function dropLoot(x,y,better){lootOrbs.push({x,y,r:13,phase:0,dead:false,item:generateItem(stageItemLevel(),better)})}function burst(x,y,n,col){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=rand(30,130);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(1,3.2),life:rand(.2,.55),max:.55,col})}}function floatText(x,y,text,col){texts.push({x,y,text,col,life:.75})}
function gainXp(v){xp+=v;while(xp>=xpNeed){xp-=xpNeed;level++;xpNeed=xpNeededForLevel(level);showLevelUp();break}}
const upgrades=[{icon:'⚔️',name:'공격력 강화',desc:'공격력 +18%',apply:()=>player.damage*=1.18},{icon:'💨',name:'공격속도 강화',desc:'공격속도 +14%',apply:()=>player.fireRate*=.86},{icon:'👟',name:'이동속도 강화',desc:'이동속도 +12%',apply:()=>player.speed*=1.12},{icon:'❤️',name:'생명력 강화',desc:'최대 HP +25, HP 25 회복',apply:()=>{player.maxHp+=25;player.hp=Math.min(player.maxHp,player.hp+25)}},{icon:'🎯',name:'치명타 강화',desc:'치명타 확률 +8%',apply:()=>player.crit+=8},{icon:'🧲',name:'영혼 자석',desc:'획득 범위 +30',apply:()=>player.magnet+=30},{icon:'🛡️',name:'피해 감소',desc:'받는 피해 8% 감소',apply:()=>player.damageReduction+=8},{icon:'💚',name:'재생',desc:'초당 HP 0.5 회복',apply:()=>player.regen+=.5}];
function updateHUD(){$('stageNo').textContent=currentStage;$('level').textContent=level;const remain=Math.max(0,STAGE_DURATION-elapsed);$('time').textContent=stageExpired&&!finalBossDefeated?'BOSS':fmt(remain);$('kills').textContent=kills;$('runGold').textContent=runGold;$('lootCount').textContent=runLoot.length;$('hp').style.width=`${Math.max(0,player?player.hp/player.maxHp*100:100)}%`;$('xp').style.width=`${Math.min(100,xp/xpNeed*100)}%`;if(player){}updateSkillHUD()}
function damageEnemy(e,b){if(e.hp<=0||b.life<=0||b.hitIds.has(e))return;b.hitIds.add(e);e.hp-=b.damage;if(b.slow)e.slow=Math.max(e.slow||0,b.slow);if(b.splash>0){for(const o of enemies){if(o===e||o.hp<=0)continue;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<b.splash)o.hp-=b.damage*.45}burst(e.x,e.y,8,'#ffd164')}if(b.chain>0){let best=null,bd=150*150;for(const o of enemies){if(o===e||o.hp<=0||b.hitIds.has(o))continue;const d=dist2(e.x,e.y,o.x,o.y);if(d<bd){bd=d;best=o}}if(best){best.hp-=b.damage*.34;attackEffects.push({type:'chain',points:[{x:e.x,y:e.y},{x:best.x,y:best.y}],life:.2,max:.2,color:b.color||'#ffe36f'})}}burst(b.x,b.y,b.crit?5:3,b.crit?'#ffd164':(b.color||'#70b5ff'));if(b.crit)floatText(e.x,e.y-16,'회심!','#ffd164');if(b.pierce>0)b.pierce--;else b.life=0}
function killEnemy(e){kills++;addGem(e.x,e.y,e.xp);addCoin(e.x+rand(-7,7),e.y+rand(-7,7),Math.floor(rand(e.gold[0],e.gold[1]+1)));burst(e.x,e.y,(e.type==='boss'||e.type==='midboss')?22:8,(e.type==='boss'||e.type==='midboss')?'#ffb149':'#ff6479');if(e.type==='midboss'){midBossDefeated=true;bossesDefeated++;dropLoot(e.x,e.y,true);runGold+=18;showToast('⚔️ 중간 보스 처치! 고급 장비를 획득했습니다.')}else if(e.type==='boss'){bossesDefeated++;finalBossDefeated=true;dropLoot(e.x-18,e.y,true);dropLoot(e.x+18,e.y,true);showToast('👑 최종 보스 처치! 남은 시간까지 버티면 클리어입니다.')}else if(e.type==='elite'&&Math.random()<.46)dropLoot(e.x,e.y,true);else if(Math.random()<.022)dropLoot(e.x,e.y,false)}
function damagePlayer(amount,color='#ff6479',slow=0){if(!player||player.hp<=0)return false;let taken=amount*(1-Math.min(75,player.damageReduction)/100);if(player.shield>0){const absorbed=Math.min(player.shield,taken);player.shield-=absorbed;taken-=absorbed;if(absorbed>0)floatText(player.x,player.y-27,`-${Math.round(absorbed)} 호신`,'#72efc1')}if(taken>0){player.hp-=taken;floatText(player.x,player.y-18,`-${Math.round(taken)}`,color)}if(slow>0)player.moveSlow=Math.max(player.moveSlow||0,slow);player.hitFlash=.14;burst(player.x,player.y,6,taken>0?color:'#72efc1');if(navigator.vibrate)navigator.vibrate(18);if(player.hp<=0){player.hp=0;updateHUD();endGame();return true}return false}
function update(dt){elapsed+=dt;spawnTimer-=dt;shotTimer-=dt;player.hitFlash=Math.max(0,player.hitFlash-dt);player.moveSlow=Math.max(0,(player.moveSlow||0)-dt);if(player.regen>0)player.hp=Math.min(player.maxHp,player.hp+player.regen*dt);updateWorldInteractions(dt);updateSkills(dt);updateAttackEffects(dt);updateWaveState();if(!midBossSpawned&&elapsed>=MID_BOSS_AT)spawnMidBoss();if(!bossSpawned&&elapsed>=BOSS_SPAWN_AT){bossSpawned=true;spawnBoss()}if(elapsed>=STAGE_DURATION)stageExpired=true;const progress=stageProgress(),bossPhase=bossSpawned&&!finalBossDefeated,waveBoost=currentWave?1:0,baseRate=(.54-progress*.22)*currentMap.spawn-Math.min(.06,(currentStage-1)*.010),rate=currentWave?Math.max(.16,baseRate*.58):(bossPhase?Math.max(.31,baseRate+.04):Math.max(.25,baseRate));if(!stageExpired&&spawnTimer<=0&&enemies.length<MAX_LIVE_ENEMIES){let pack=progress<.18?2:progress<.48?3:4;if(currentWave)pack+=currentWave.type==='swarm'?4:3;if(bossPhase&&!currentWave)pack=Math.max(2,pack-1);pack+=Math.min(2,Math.floor((currentStage-1)/3));for(let n=0;n<pack&&enemies.length<MAX_LIVE_ENEMIES;n++)spawnEnemy();spawnTimer=rate}if(shotTimer<=0){shoot();shotTimer=player.fireRate*(runEvolution ? .88 : 1)}
 let kx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),ky=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),mx=input.x+kx,my=input.y+ky,m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m}if(m>.08&&!enemies.length)player.facing=Math.atan2(my,mx);const moveMul=player.moveSlow>0?.72:1;player.x+=mx*player.speed*moveMul*dt;player.y+=my*player.speed*moveMul*dt;resolveObstacleCollision(player,player.r);player.x=Math.max(player.r+18,Math.min(WORLD_W-player.r-18,player.x));player.y=Math.max(player.r+18,Math.min(WORLD_H-player.r-18,player.y));const tx=Math.max(0,Math.min(Math.max(0,WORLD_W-W),player.x-W/2)),ty=Math.max(0,Math.min(Math.max(0,WORLD_H-H),player.y-H/2));camera.x+=(tx-camera.x)*Math.min(1,dt*8);camera.y+=(ty-camera.y)*Math.min(1,dt*8);
 for(const b of bullets){if(b.homing>0&&enemies.length){let t=null,bd=360*360;for(const e of enemies){if(e.hp<=0)continue;const d=dist2(b.x,b.y,e.x,e.y);if(d<bd){bd=d;t=e}}if(t){const sp=Math.hypot(b.vx,b.vy)||1,ta=Math.atan2(t.y-b.y,t.x-b.x),ca=Math.atan2(b.vy,b.vx),na=ca+angleDiff(ta,ca)*Math.min(1,dt*b.homing);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}}b.trail.push({x:b.x,y:b.y});if(b.trail.length>6)b.trail.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(dist2(b.x,b.y,b.originX,b.originY)>b.maxRange*b.maxRange)b.life=0;if(b.weaponType!=='skill'&&(b.x<camera.x-55||b.x>camera.x+W+55||b.y<camera.y-55||b.y>camera.y+H+55))b.life=0;if(b.life>0&&bulletHitsObstacle(b)){b.life=0;burst(b.x,b.y,3,'#94a8b9')}}bullets=bullets.filter(b=>b.life>0&&b.x>-80&&b.x<WORLD_W+80&&b.y>-80&&b.y<WORLD_H+80);
 for(const b of enemyBullets){if(b.homing>0){const sp=Math.hypot(b.vx,b.vy)||1,ta=Math.atan2(player.y-b.y,player.x-b.x),ca=Math.atan2(b.vy,b.vx),na=ca+angleDiff(ta,ca)*Math.min(1,dt*b.homing);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}b.trail.push({x:b.x,y:b.y});if(b.trail.length>5)b.trail.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life>0&&bulletHitsObstacle(b))b.life=0;const rr=player.r+b.r;if(b.life>0&&dist2(b.x,b.y,player.x,player.y)<rr*rr){b.life=0;if(damagePlayer(b.damage,b.color,b.slow))return}}enemyBullets=enemyBullets.filter(b=>b.life>0&&b.x>-80&&b.x<WORLD_W+80&&b.y>-80&&b.y<WORLD_H+80);
 for(const h of bossHazards){h.delay-=dt;if(h.delay<=0&&!h.triggered){h.triggered=true;if(Math.hypot(player.x-h.x,player.y-h.y)<=h.r+player.r){if(damagePlayer(h.damage,h.color,currentMap.id==='frost'?1.1:0))return}burst(h.x,h.y,18,h.color)}if(h.triggered)h.life-=dt}bossHazards=bossHazards.filter(h=>!h.triggered||h.life>0);
 for(const e of enemies){e.slow=Math.max(0,(e.slow||0)-dt);e.hit=Math.max(0,e.hit-dt);e.attackTimer-=dt;if(e.type==='boss'||e.type==='midboss'){e.skillTimer-=dt;if(e.skillTimer<=0){triggerBossSkill(e);e.skillTimer=(e.type==='boss'?3.4:4.5)*rand(.86,1.15)}}let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,slowMul=e.slow>0?.62:1,px=-dy/d,py=dx/d;
  if(e.chargeState>0){e.chargeState-=dt;e.x+=Math.cos(e.chargeAngle)*e.speed*3.8*dt;e.y+=Math.sin(e.chargeAngle)*e.speed*3.8*dt}
  else if(e.behavior==='tank'){if(d<118&&e.attackTimer<=0){bossHazards.push({x:e.x,y:e.y,r:82,delay:.62,life:.22,triggered:false,damage:e.damage*.72,color:'#b89cff'});e.attackTimer=rand(3.0,4.0)}e.x+=dx/d*e.speed*slowMul*dt;e.y+=dy/d*e.speed*slowMul*dt}
  else if(e.behavior==='ranged'){const target=285;if(d>target+45){e.x+=dx/d*e.speed*slowMul*dt;e.y+=dy/d*e.speed*slowMul*dt}else if(d<target-55){e.x-=dx/d*e.speed*.75*slowMul*dt;e.y-=dy/d*e.speed*.75*slowMul*dt}else{e.x+=px*Math.sin(elapsed*.9+e.phase)*e.speed*.55*dt;e.y+=py*Math.sin(elapsed*.9+e.phase)*e.speed*.55*dt}if(e.attackTimer<=0){const a=Math.atan2(player.y-e.y,player.x-e.x),spread=currentMap.id==='crypt'?.12:0;createEnemyBullet(e.x,e.y,a+rand(-spread,spread),currentMap.id==='frost'?155:175,e.damage*.58,currentMap.accent,{r:6,homing:currentMap.id==='crypt'?.35:0,slow:currentMap.id==='frost'?.65:0});e.attackTimer=rand(2.0,2.7)}}
  else if(e.behavior==='charger'){e.chargeTimer-=dt;if(e.chargeTimer<=0&&d<430){e.chargeAngle=Math.atan2(dy,dx);e.chargeState=.58;e.chargeTimer=rand(3.4,4.8);attackEffects.push({type:'bossTelegraph',x:e.x,y:e.y,angle:e.chargeAngle,r:120,life:.38,max:.38,color:currentMap.accent})}else{e.x+=dx/d*e.speed*slowMul*dt;e.y+=dy/d*e.speed*slowMul*dt}}
  else if(e.behavior==='zigzag'){const sway=Math.sin(elapsed*2.4+e.phase)*.58;e.x+=(dx/d+px*sway)*e.speed*slowMul*dt;e.y+=(dy/d+py*sway)*e.speed*slowMul*dt}
  else{e.x+=dx/d*e.speed*slowMul*dt;e.y+=dy/d*e.speed*slowMul*dt}
  resolveObstacleCollision(e,e.r,Math.sin(e.phase)*1.5);dx=player.x-e.x;dy=player.y-e.y;d=Math.hypot(dx,dy)||1;if(d<player.r+e.r&&e.hit<=0){if(damagePlayer(e.damage,'#ff8da0'))return;e.hit=.76;e.x-=dx/d*20;e.y-=dy/d*20}}
 for(const b of bullets){for(const e of enemies){if(e.hp<=0||b.life<=0||b.hitIds.has(e))continue;const dx=b.x-e.x,dy=b.y-e.y;if(dx*dx+dy*dy<(b.r+e.r)**2)damageEnemy(e,b)}}for(const e of enemies)if(e.hp<=0&&!e.dead){e.dead=true;killEnemy(e)}enemies=enemies.filter(e=>!e.dead);
 for(const g of gems){g.phase+=dt*5;magnetize(g,dt,1);if(g.dead)gainXp(g.value)}gems=gems.filter(g=>!g.dead);if(paused){updateHUD();return}for(const c of coins){c.phase+=dt*6;magnetize(c,dt,1);if(c.dead)runGold+=Math.round(c.value*(1+player.goldBonus/100))}coins=coins.filter(c=>!c.dead);for(const l of lootOrbs){l.phase+=dt*3;let dx=player.x-l.x,dy=player.y-l.y,d=Math.hypot(dx,dy)||1;if(d<Math.max(player.magnet*.72,70)){const sp=Math.max(100,260-d);l.x+=dx/d*sp*dt;l.y+=dy/d*sp*dt}if(d<player.r+15){l.dead=true;acquireRunItem(l.item);break}}lootOrbs=lootOrbs.filter(l=>!l.dead);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.96;p.vy*=.96}particles=particles.filter(p=>p.life>0);for(const t of texts){t.y-=30*dt;t.life-=dt}texts=texts.filter(t=>t.life>0);if(stageExpired&&finalBossDefeated&&!paused){clearStage();return}updateHUD()}
function magnetize(o,dt,scale){let dx=player.x-o.x,dy=player.y-o.y,d=Math.hypot(dx,dy)||1;if(d<player.magnet){const s=Math.max(160,390-d*1.6);o.x+=dx/d*s*dt;o.y+=dy/d*s*dt}if(d<player.r+11*scale)o.dead=true}
function drawBackground(){const map=currentMap||MAP_THEMES[0],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,map.sky1);g.addColorStop(.52,map.ground);g.addColorStop(1,map.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(const s of stars){const sx=(s.x-camera.x*.12)%WORLD_W,sy=(s.y-camera.y*.12)%WORLD_H;if(sx<-5||sx>W+5||sy<-5||sy>H+5)continue;ctx.globalAlpha=s.a;ctx.fillStyle=map.accent;ctx.beginPath();ctx.arc(sx,sy,s.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;for(const f of fogWisps){const sx=f.x-camera.x*.18+Math.sin(elapsed*.1+f.phase)*24,sy=f.y-camera.y*.18+Math.cos(elapsed*.08+f.phase)*18;if(sx<-f.r||sx>W+f.r||sy<-f.r||sy>H+f.r)continue;const rg=ctx.createRadialGradient(sx,sy,0,sx,sy,f.r);rg.addColorStop(0,map.id==='ember'?'rgba(180,78,48,.045)':map.id==='frost'?'rgba(120,180,230,.045)':map.id==='crypt'?'rgba(145,92,185,.045)':'rgba(87,136,126,.055)');rg.addColorStop(1,'rgba(20,30,34,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(sx,sy,f.r,0,Math.PI*2);ctx.fill()}}
function drawLandmark(l){if(l.x+l.r*2<camera.x-70||l.x-l.r*2>camera.x+W+70||l.y+l.r*2<camera.y-70||l.y-l.r*2>camera.y+H+70)return;const map=currentMap||MAP_THEMES[0],pulse=.78+Math.sin(elapsed*1.8+l.phase)*.18;ctx.save();ctx.translate(l.x,l.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,l.r*.58,l.r*.9,l.r*.28,0,0,Math.PI*2);ctx.fill();ctx.shadowColor=map.accent;ctx.shadowBlur=18*pulse;ctx.strokeStyle=map.accent+'88';ctx.fillStyle=map.accent+'32';if(l.kind==='crystal'){ctx.beginPath();ctx.moveTo(0,-l.r);ctx.lineTo(l.r*.55,-l.r*.12);ctx.lineTo(l.r*.28,l.r*.72);ctx.lineTo(-l.r*.32,l.r*.72);ctx.lineTo(-l.r*.58,-l.r*.1);ctx.closePath();ctx.fill();ctx.stroke()}else if(l.kind==='gate'){ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,2,l.r*.72,Math.PI,0);ctx.stroke();ctx.fillStyle='#59615f';ctx.fillRect(-l.r*.82,0,10,l.r*.78);ctx.fillRect(l.r*.68,0,10,l.r*.78)}else if(l.kind==='tree'){ctx.fillStyle='#4a3528';ctx.fillRect(-7,-4,14,l.r);ctx.fillStyle=map.accent+'27';for(const [x,y,r] of [[0,-l.r*.55,l.r*.7],[-l.r*.42,-l.r*.25,l.r*.46],[l.r*.42,-l.r*.22,l.r*.45]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke()}}else if(l.kind==='forge'){ctx.fillStyle='#4d4038';ctx.fillRect(-l.r*.7,-l.r*.18,l.r*1.4,l.r*.68);ctx.fillStyle='#ff9a62';ctx.beginPath();ctx.arc(0,-l.r*.2,l.r*.3*pulse,0,Math.PI*2);ctx.fill()}else{ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,l.r*.72,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#515961';ctx.fillRect(-6,-l.r*.8,12,l.r*1.55);ctx.fillStyle=map.accent;ctx.beginPath();ctx.arc(0,-l.r*.55,6,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;ctx.restore()}
function drawArenaDetails(){const map=currentMap||MAP_THEMES[0];ctx.fillStyle=map.ground;ctx.fillRect(0,0,WORLD_W,WORLD_H);for(const p of terrainPatches){if(p.x+p.rx<camera.x-80||p.x-p.rx>camera.x+W+80||p.y+p.ry<camera.y-80||p.y-p.ry>camera.y+H+80)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=map.patch[p.kind];ctx.beginPath();ctx.ellipse(0,0,p.rx,p.ry,0,0,Math.PI*2);ctx.fill();ctx.restore()}ctx.lineCap='round';for(const pts of mapPaths){ctx.strokeStyle=map.road;ctx.lineWidth=82;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.bezierCurveTo(pts[1].x,pts[1].y,pts[2].x,pts[2].y,pts[3].x,pts[3].y);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.045)';ctx.lineWidth=2;ctx.setLineDash([18,32]);ctx.stroke();ctx.setLineDash([])}ctx.strokeStyle=map.accent+'3f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(WORLD_W/2,WORLD_H/2,150,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=map.accent+'18';ctx.lineWidth=2;ctx.beginPath();ctx.arc(WORLD_W/2,WORLD_H/2,108,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(WORLD_W/2+Math.cos(a)*108,WORLD_H/2+Math.sin(a)*108);ctx.lineTo(WORLD_W/2+Math.cos(a)*150,WORLD_H/2+Math.sin(a)*150);ctx.stroke()}for(const d of groundDecos){if(d.x<camera.x-50||d.x>camera.x+W+50||d.y<camera.y-50||d.y>camera.y+H+50)continue;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.scale(d.scale,d.scale);ctx.strokeStyle=map.deco;ctx.fillStyle=map.deco;if(d.kind===0){ctx.lineWidth=2;for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(j*3,7);ctx.quadraticCurveTo(j*5,-2,j*2,-9);ctx.stroke()}}else if(d.kind===1){ctx.beginPath();ctx.ellipse(0,0,7,3,0,0,Math.PI*2);ctx.fill()}else if(d.kind===2){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(-5,5);ctx.closePath();ctx.stroke()}else if(d.kind===3){ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke()}else{ctx.fillRect(-2,-8,4,16)}ctx.restore()}for(const l of mapLandmarks)drawLandmark(l);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=4;ctx.strokeRect(12,12,WORLD_W-24,WORLD_H-24);for(const r of ruins){if(r.x<camera.x-100||r.x>camera.x+W+100||r.y<camera.y-100||r.y>camera.y+H+100)continue;ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.rot);ctx.strokeStyle=map.accent+'0f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()}}
function drawObstacle(o){if(o.x+o.r<camera.x-30||o.x-o.r>camera.x+W+30||o.y+o.r<camera.y-30||o.y-o.r>camera.y+H+30)return;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(4,o.r*.62,o.r*.82,o.r*.32,0,0,Math.PI*2);ctx.fill();if(o.type==='rock'){ctx.fillStyle=o.variant===0?'#394445':o.variant===1?'#414a46':'#354047';ctx.strokeStyle='rgba(141,160,151,.18)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=o.r*(i%2?.82:1);const x=Math.cos(a)*r,y=Math.sin(a)*r*.72;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(10,18,19,.38)';ctx.beginPath();ctx.moveTo(-o.r*.35,-o.r*.18);ctx.lineTo(o.r*.05,o.r*.08);ctx.lineTo(o.r*.38,-o.r*.08);ctx.stroke()}else if(o.type==='tree'){ctx.fillStyle='#4a3629';ctx.fillRect(-7,-5,14,o.r*.75);ctx.fillStyle='#1f3b35';ctx.shadowColor='#18382f';ctx.shadowBlur=12;for(const [x,y,rr] of [[0,-o.r*.42,o.r*.72],[-o.r*.4,-o.r*.14,o.r*.52],[o.r*.4,-o.r*.12,o.r*.5]]){ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;ctx.fillStyle='rgba(92,150,119,.12)';ctx.beginPath();ctx.arc(-o.r*.2,-o.r*.5,o.r*.34,0,Math.PI*2);ctx.fill()}else if(o.type==='pillar'){ctx.fillStyle='#4b5550';ctx.beginPath();ctx.ellipse(0,6,o.r*.78,o.r*.48,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#65706a';ctx.fillRect(-o.r*.45,-o.r*.78,o.r*.9,o.r*.86);ctx.fillStyle='#747f78';ctx.fillRect(-o.r*.58,-o.r*.8,o.r*1.16,o.r*.18);ctx.fillStyle='rgba(153,211,187,.12)';ctx.fillRect(-o.r*.28,-o.r*.64,o.r*.14,o.r*.48)}else{ctx.fillStyle='#4b504a';ctx.fillRect(-o.r*.85,-o.r*.18,o.r*1.7,o.r*.38);ctx.fillRect(-o.r*.6,-o.r*.68,o.r*.42,o.r*1.02);ctx.fillStyle='#616760';ctx.fillRect(-o.r*.79,-o.r*.25,o.r*.5,o.r*.2);ctx.fillRect(o.r*.1,-o.r*.23,o.r*.58,o.r*.2);ctx.strokeStyle='rgba(19,27,27,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-o.r*.22,-o.r*.55);ctx.lineTo(o.r*.02,-o.r*.08);ctx.lineTo(o.r*.32,o.r*.08);ctx.stroke()}ctx.restore()}
function drawChest(c){if(c.x<camera.x-70||c.x>camera.x+W+70||c.y<camera.y-70||c.y>camera.y+H+70)return;ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,14,24,8,0,0,Math.PI*2);ctx.fill();const glow=c.elite?'#ff6fb7':'#ffd164';if(!c.opened){ctx.shadowColor=glow;ctx.shadowBlur=10+Math.sin(elapsed*4)*4;ctx.fillStyle=c.elite?'#71305b':'#6c4c22';ctx.fillRect(-20,-8,40,24);ctx.fillStyle=c.elite?'#ad4b89':'#a57632';ctx.beginPath();pathRoundRect(ctx,-20,-17,40,18,7);ctx.fill();ctx.fillStyle=glow;ctx.fillRect(-3,-2,6,9);ctx.strokeStyle='rgba(255,244,204,.45)';ctx.lineWidth=2;ctx.strokeRect(-18,-6,36,20);ctx.shadowBlur=0;ctx.fillStyle=glow;ctx.globalAlpha=.5+.5*Math.sin(elapsed*5);ctx.beginPath();ctx.arc(0,-27,3,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle='#443521';ctx.fillRect(-20,1,40,15);ctx.save();ctx.translate(0,-4);ctx.rotate(-.52);ctx.fillStyle='#60482a';ctx.fillRect(-20,-6,40,12);ctx.restore()}ctx.restore()}
function drawSpring(s){if(s.x<camera.x-100||s.x>camera.x+W+100||s.y<camera.y-100||s.y>camera.y+H+100)return;ctx.save();ctx.translate(s.x,s.y);const ready=s.cooldown<=0,pulse=.5+.5*Math.sin(elapsed*3);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,12,48,22,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(97,120,111,.7)';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();const g=ctx.createRadialGradient(0,0,2,0,0,30);g.addColorStop(0,ready?'rgba(157,255,229,.88)':'rgba(73,122,112,.48)');g.addColorStop(1,ready?'rgba(52,173,151,.4)':'rgba(30,69,64,.25)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ready?`rgba(114,239,193,${.45+pulse*.4})`:'rgba(92,136,126,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,40+pulse*3,0,Math.PI*2);ctx.stroke();if(!ready){ctx.fillStyle='rgba(214,230,226,.72)';ctx.font='800 9px system-ui';ctx.textAlign='center';ctx.fillText(`${Math.ceil(s.cooldown)}초`,0,4)}ctx.restore()}
function draw(){ctx.clearRect(0,0,W,H);drawBackground();ctx.save();ctx.translate(-camera.x,-camera.y);drawArenaDetails();for(const s of springs)drawSpring(s);for(const c of chests)drawChest(c);for(const o of obstacles)drawObstacle(o);for(const g of gems){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.phase);ctx.shadowColor='#72efc1';ctx.shadowBlur=10;ctx.fillStyle='#72efc1';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(5,0);ctx.lineTo(0,6);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();ctx.restore()}for(const c of coins){ctx.save();ctx.translate(c.x,c.y);ctx.scale(.7+Math.abs(Math.sin(c.phase))*.3,1);ctx.shadowColor='#ffd164';ctx.shadowBlur=6;ctx.fillStyle='#ffd164';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7d5914';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()}for(const l of lootOrbs){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.phase);ctx.shadowColor=rarityColor(l.item.rarity);ctx.shadowBlur=16;ctx.strokeStyle=rarityColor(l.item.rarity);ctx.lineWidth=2;ctx.fillStyle='rgba(20,28,48,.94)';ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,x=Math.cos(a)*l.r,y=Math.sin(a)*l.r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;for(const h of bossHazards)drawBossHazard(h);for(const a of attackEffects)drawAttackEffect(a);for(const b of bullets)drawBullet(b);for(const b of enemyBullets)drawEnemyBullet(b);for(const e of enemies)drawEnemy(e);if(player)drawPlayer();for(const t of texts){ctx.globalAlpha=Math.max(0,t.life/.75);ctx.fillStyle=t.col;ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillText(t.text,t.x,t.y)}ctx.globalAlpha=1;ctx.restore();drawMinimap();if(player){const sx=player.x-camera.x,sy=player.y-camera.y,light=ctx.createRadialGradient(sx,sy,20,sx,sy,Math.min(300,Math.max(W,H)*.32));light.addColorStop(0,(runEvolution?evolutionDefs[runEvolution].color:(currentMap?.accent||'#72efc1'))+'13');light.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=light;ctx.fillRect(0,0,W,H)}const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.8);vig.addColorStop(.55,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.42)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)}
function drawMinimap(){if(miniMap.classList.contains('hidden')||!player)return;const mw=152,mh=152;mctx.clearRect(0,0,mw,mh);mctx.fillStyle='rgba(7,13,18,.95)';mctx.fillRect(0,0,mw,mh);mctx.strokeStyle=(currentMap?.accent||'#72efc1')+'55';mctx.lineWidth=3;mctx.strokeRect(3,3,mw-6,mh-6);const sx=(mw-12)/WORLD_W,sy=(mh-12)/WORLD_H,px=6+player.x*sx,py=6+player.y*sy;mctx.fillStyle='rgba(112,128,123,.34)';for(const o of obstacles){mctx.beginPath();mctx.arc(6+o.x*sx,6+o.y*sy,1.25,0,Math.PI*2);mctx.fill()}for(const c of chests){if(c.opened)continue;mctx.fillStyle=c.elite?'#ffd164':'#e8c86f';mctx.fillRect(4+c.x*sx,4+c.y*sy,4,4)}for(const s of springs){mctx.fillStyle=s.cooldown<=0?'#72efc1':'rgba(114,239,193,.35)';mctx.beginPath();mctx.arc(6+s.x*sx,6+s.y*sy,2.4,0,Math.PI*2);mctx.fill()}for(const e of enemies){if(!['elite','midboss','boss'].includes(e.type))continue;mctx.fillStyle=e.type==='boss'?'#ffbd58':e.type==='midboss'?'#ff8c69':'#ff57aa';mctx.beginPath();mctx.arc(6+e.x*sx,6+e.y*sy,e.type==='boss'?5:e.type==='midboss'?4:3,0,Math.PI*2);mctx.fill()}mctx.shadowColor=currentMap?.accent||'#72efc1';mctx.shadowBlur=10;mctx.fillStyle=currentMap?.accent||'#72efc1';mctx.beginPath();mctx.arc(px,py,4.5,0,Math.PI*2);mctx.fill();mctx.shadowBlur=0;mctx.strokeStyle='rgba(255,255,255,.22)';mctx.lineWidth=1.5;const vw=W*sx,vh=H*sy;mctx.strokeRect(6+camera.x*sx,6+camera.y*sy,vw,vh)}
function drawEnemyBullet(b){for(let i=0;i<b.trail.length;i++){const t=b.trail[i];ctx.globalAlpha=(i+1)/b.trail.length*.12;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(t.x,t.y,Math.max(1,b.r*.45),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.save();ctx.translate(b.x,b.y);ctx.shadowColor=b.color;ctx.shadowBlur=12;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,b.r+3,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawBossHazard(h){const pre=!h.triggered,a=pre?Math.max(.18,Math.min(.7,.75-h.delay*.4)):Math.max(0,h.life/.55);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=h.color;ctx.lineWidth=pre?3:6;ctx.setLineDash(pre?[9,7]:[]);ctx.beginPath();ctx.arc(h.x,h.y,h.r*(pre?1:.82+h.life*.3),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);if(!pre){ctx.globalAlpha=a*.18;ctx.fillStyle=h.color;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill()}ctx.restore()}
function drawBullet(b){for(let i=0;i<b.trail.length;i++){const t=b.trail[i];ctx.globalAlpha=(i+1)/b.trail.length*.13;ctx.fillStyle=b.color||(b.crit?'#ffd164':'#70b5ff');ctx.beginPath();ctx.arc(t.x,t.y,Math.max(1,b.r*(i+1)/b.trail.length*.55),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.save();ctx.translate(b.x,b.y);const ang=Math.atan2(b.vy,b.vx);ctx.rotate(ang);ctx.shadowBlur=b.evolution?18:12;ctx.shadowColor=b.color||(b.crit?'#ffd164':'#70b5ff');if(b.evolution){ctx.strokeStyle=b.color||'#ffe36f';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,b.r+5+Math.sin(elapsed*8)*2,0,Math.PI*2);ctx.stroke();}if(b.shape==='arrow'){ctx.strokeStyle='#f2df9a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(11,0);ctx.stroke();ctx.fillStyle='#f6eab8';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(5,-5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.fillStyle='#b98c55';ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-15,-4);ctx.lineTo(-13,0);ctx.lineTo(-15,4);ctx.closePath();ctx.fill()}else if(b.shape==='dagger'){ctx.fillStyle='#edf4ff';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.fillStyle='#c49a58';ctx.fillRect(-8,-2,5,4)}else if(b.shape==='axe'){ctx.rotate(elapsed*9);ctx.strokeStyle='#9a744e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.stroke();ctx.fillStyle='#dce6f3';ctx.beginPath();ctx.moveTo(1,-8);ctx.quadraticCurveTo(12,-6,10,2);ctx.lineTo(1,4);ctx.closePath();ctx.fill()}else if(b.shape==='arcane'){ctx.fillStyle='#b987ff';ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eadcff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,b.r+4,0,Math.PI*2);ctx.stroke();ctx.rotate(elapsed*3);ctx.beginPath();ctx.moveTo(-b.r-4,0);ctx.lineTo(b.r+4,0);ctx.moveTo(0,-b.r-4);ctx.lineTo(0,b.r+4);ctx.stroke()}else if(b.shape==='rune'){ctx.fillStyle='#d7a7ff';ctx.rotate(Math.PI/4+elapsed*2);ctx.fillRect(-b.r*.7,-b.r*.7,b.r*1.4,b.r*1.4);ctx.strokeStyle='#f0dcff';ctx.lineWidth=1.5;ctx.strokeRect(-b.r-3,-b.r-3,(b.r+3)*2,(b.r+3)*2)}else if(b.shape==='soulblade'){ctx.fillStyle=b.color||'#c59aff';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-5,-4);ctx.lineTo(-1,0);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.strokeStyle='#f1e9ff';ctx.lineWidth=1;ctx.stroke()}else{ctx.fillStyle=b.crit?'#ffe7a7':'#a9d7ff';ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill()}ctx.restore();ctx.shadowBlur=0}
function enemyPalette(type){return{basic:['#ff6d87','#b7355f'],fast:['#ffb05f','#c85542'],tank:['#9a79ff','#4d3a8e'],ranged:[currentMap?.accent||'#8fdcff','#3d587d'],charger:['#ff8668','#8d392d'],elite:['#ff57aa','#8d245d'],midboss:['#ff8b6d','#8e3d35'],boss:['#ffbd58','#8e4926']}[type]||['#ff6d87','#b7355f']}
function drawEnemy(e){const [col,dark]=enemyPalette(e.type),bob=Math.sin(elapsed*5+e.phase)*(e.type==='fast'?2.4:1.2);ctx.save();ctx.translate(e.x,e.y+bob);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,e.r*.76,e.r*.82,e.r*.28,0,0,Math.PI*2);ctx.fill();ctx.shadowColor=col;ctx.shadowBlur=e.type==='boss'?26:e.type==='elite'?18:9;if(e.type==='basic'){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-e.r*.72,-e.r*.35);ctx.lineTo(-e.r*.28,-e.r*.92);ctx.lineTo(-e.r*.04,-e.r*.45);ctx.lineTo(e.r*.3,-e.r*.9);ctx.lineTo(e.r*.72,-e.r*.28);ctx.quadraticCurveTo(e.r*.92,e.r*.5,0,e.r*.82);ctx.quadraticCurveTo(-e.r*.92,e.r*.5,-e.r*.72,-e.r*.35);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,e.r*.08,e.r*.7,0,Math.PI*2);ctx.fill()}else if(e.type==='fast'){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-e.r*.25,0);ctx.lineTo(-e.r*1.35,-e.r*.55);ctx.lineTo(-e.r*.95,e.r*.45);ctx.lineTo(-e.r*.3,e.r*.25);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(e.r*.25,0);ctx.lineTo(e.r*1.35,-e.r*.55);ctx.lineTo(e.r*.95,e.r*.45);ctx.lineTo(e.r*.3,e.r*.25);ctx.closePath();ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,e.r*.63,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-e.r*.4,-e.r*.45);ctx.lineTo(-e.r*.14,-e.r*1.05);ctx.lineTo(e.r*.02,-e.r*.42);ctx.fill();ctx.beginPath();ctx.moveTo(e.r*.4,-e.r*.45);ctx.lineTo(e.r*.14,-e.r*1.05);ctx.lineTo(-e.r*.02,-e.r*.42);ctx.fill()}else if(e.type==='tank'){ctx.fillStyle=dark;ctx.fillRect(-e.r*.82,-e.r*.55,e.r*1.64,e.r*1.15);ctx.fillStyle=col;ctx.fillRect(-e.r*.6,-e.r*.72,e.r*1.2,e.r*1.25);ctx.fillStyle='#c5baff';ctx.fillRect(-e.r*.82,-e.r*.25,e.r*.3,e.r*.62);ctx.fillRect(e.r*.52,-e.r*.25,e.r*.3,e.r*.62);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;ctx.strokeRect(-e.r*.6,-e.r*.72,e.r*1.2,e.r*1.25)}else if(e.type==='ranged'){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(0,-e.r);ctx.lineTo(e.r*.82,e.r*.64);ctx.lineTo(-e.r*.82,e.r*.64);ctx.closePath();ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*.64,0,Math.PI*2);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,e.r*.26,0,Math.PI*2);ctx.fill()}else if(e.type==='charger'){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-e.r*.85,-e.r*.55);ctx.lineTo(-e.r*.2,-e.r*.9);ctx.lineTo(e.r*.85,-e.r*.55);ctx.lineTo(e.r*.72,e.r*.62);ctx.lineTo(-e.r*.72,e.r*.62);ctx.closePath();ctx.fill();ctx.fillStyle=col;ctx.fillRect(-e.r*.58,-e.r*.36,e.r*1.16,e.r*.78)}else{ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-e.r*.45,-e.r*.52);ctx.lineTo(-e.r*.82,-e.r*1.12);ctx.lineTo(-e.r*.12,-e.r*.72);ctx.lineTo(0,-e.r*.5);ctx.lineTo(e.r*.82,-e.r*1.12);ctx.lineTo(e.r*.45,-e.r*.52);ctx.closePath();ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,e.r*.72,0,Math.PI*2);ctx.fill();ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-e.r*.88,.15*e.r);ctx.lineTo(-e.r*1.12,e.r*.45);ctx.lineTo(-e.r*.64,e.r*.62);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(e.r*.88,.15*e.r);ctx.lineTo(e.r*1.12,e.r*.45);ctx.lineTo(e.r*.64,e.r*.62);ctx.closePath();ctx.fill();if(e.type==='boss'||e.type==='midboss'){ctx.strokeStyle=e.type==='boss'?'#ffd86d':'#ff9c86';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*.92,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe27f';ctx.beginPath();ctx.moveTo(-e.r*.42,-e.r*.82);ctx.lineTo(-e.r*.18,-e.r*1.18);ctx.lineTo(0,-e.r*.85);ctx.lineTo(e.r*.24,-e.r*1.18);ctx.lineTo(e.r*.46,-e.r*.8);ctx.closePath();ctx.fill()}}ctx.shadowBlur=0;ctx.fillStyle='#0b0f18';const ey=(e.type==='boss'||e.type==='midboss')?e.r*.02:-e.r*.06,es=e.type==='boss'?4:e.type==='midboss'?3.5:3;ctx.beginPath();ctx.arc(-e.r*.28,ey,es,0,Math.PI*2);ctx.arc(e.r*.28,ey,es,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-e.r*.27,ey-1,1,0,Math.PI*2);ctx.arc(e.r*.29,ey-1,1,0,Math.PI*2);ctx.fill();ctx.restore();if(['fast','tank','ranged','charger'].includes(e.type)){const role={fast:'⚡',tank:'🛡️',ranged:'🎯',charger:'💥'}[e.type];ctx.save();ctx.font='700 9px system-ui';ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.88)';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=4;ctx.fillText(role,e.x,e.y-e.r-7);ctx.restore()}if(e.type==='boss'||e.type==='midboss'||e.type==='elite'){const w=e.r*2.4;ctx.fillStyle='rgba(0,0,0,.58)';ctx.fillRect(e.x-w/2,e.y-e.r-15,w,5);ctx.fillStyle=col;ctx.fillRect(e.x-w/2,e.y-e.r-15,w*Math.max(0,e.hp/e.maxHp),5)}}

function drawAttackEffect(a){const t=Math.max(0,a.life/a.max),alpha=Math.min(1,t*1.5);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=a.color||'#fff';ctx.fillStyle=a.color||'#fff';ctx.shadowColor=a.color||'#fff';ctx.shadowBlur=16;if(a.type==='slash'){ctx.lineWidth=10*(1-t)+3;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.72+.22*(1-t)),a.angle-.72,a.angle+.72);ctx.stroke();ctx.lineWidth=2;ctx.globalAlpha=alpha*.7;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.48+.3*(1-t)),a.angle-.58,a.angle+.58);ctx.stroke()}else if(a.type==='slam'){ctx.lineWidth=5;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(1-t*.35),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=alpha*.18;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()}else if(a.type==='thrust'){ctx.lineWidth=9*t+3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x2,a.y2);ctx.stroke();ctx.globalAlpha=alpha*.7;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x2,a.y2);ctx.stroke()}else if(a.type==='skillRing'){ctx.lineWidth=7;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(1-t*.5),0,Math.PI*2);ctx.stroke();for(let n=0;n<10;n++){const ang=Math.PI*2*n/10+elapsed*2,rr=a.r*(.45+.45*(1-t));ctx.beginPath();ctx.arc(a.x+Math.cos(ang)*rr,a.y+Math.sin(ang)*rr,4+3*(1-t),0,Math.PI*2);ctx.fill()}}else if(a.type==='chain'){ctx.lineWidth=3;ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=alpha*.5;ctx.lineWidth=8;ctx.stroke()}else if(a.type==='frost'){ctx.lineWidth=3;for(let n=0;n<8;n++){const ang=Math.PI*2*n/8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(ang)*a.r*(1-t*.25),a.y+Math.sin(ang)*a.r*(1-t*.25));ctx.stroke()}ctx.beginPath();ctx.arc(a.x,a.y,a.r*(1-t*.25),0,Math.PI*2);ctx.stroke()}else if(a.type==='meteor'){ctx.globalAlpha=alpha*.24;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=alpha;ctx.lineWidth=5;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(1-t*.45),0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(a.x-a.r*.55,a.y-a.r*.9);ctx.lineTo(a.x,a.y);ctx.stroke()}else if(a.type==='ward'){ctx.lineWidth=5;ctx.beginPath();ctx.arc(a.x,a.y,a.r+18*(1-t),0,Math.PI*2);ctx.stroke()}else if(a.type==='bossTelegraph'){ctx.lineWidth=4;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(a.angle)*a.r,a.y+Math.sin(a.angle)*a.r);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(a.x,a.y,28+10*(1-t),0,Math.PI*2);ctx.stroke()}ctx.restore()}

function drawPlayerWeapon(type,ang){const evo=runEvolution?evolutionDefs[runEvolution]:null,color=evo?.color||'#9eeed3';ctx.save();ctx.rotate(ang);ctx.translate(18,0);ctx.shadowColor=color;ctx.shadowBlur=evo?15:8;ctx.strokeStyle='#071017';ctx.lineWidth=5;if(type==='sword'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(25,0);ctx.stroke();ctx.strokeStyle=evo?color:'#d9edf6';ctx.lineWidth=evo?6:4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(evo?29:23,0);ctx.stroke();ctx.fillStyle=evo?color:'#ffd164';ctx.fillRect(-4,-5,8,10)}else if(type==='dagger'){ctx.fillStyle=evo?color:'#edf4ff';ctx.beginPath();ctx.moveTo(evo?21:18,0);ctx.lineTo(-4,-5);ctx.lineTo(-1,0);ctx.lineTo(-4,5);ctx.closePath();ctx.fill()}else if(type==='bow'){ctx.strokeStyle=evo?color:'#e5c98f';ctx.lineWidth=evo?4:3;ctx.beginPath();ctx.arc(5,0,evo?18:15,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#f6f0dd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(5,-18);ctx.lineTo(5,18);ctx.stroke()}else if(type==='hammer'){ctx.fillStyle=evo?color:'#cfd8e5';ctx.fillRect(1,-9,evo?22:18,evo?18:14);ctx.fillStyle='#8e6f50';ctx.fillRect(-6,-2,12,4)}else if(type==='spear'){ctx.fillStyle=evo?color:'#bcd9ef';ctx.fillRect(-4,-2,evo?34:29,evo?4:3);ctx.beginPath();ctx.moveTo(evo?34:29,0);ctx.lineTo(20,-6);ctx.lineTo(20,6);ctx.closePath();ctx.fill()}else if(type==='axe'){ctx.fillStyle=evo?color:'#dfe8f7';ctx.beginPath();ctx.moveTo(6,-11);ctx.lineTo(evo?24:20,-6);ctx.lineTo(evo?24:20,6);ctx.lineTo(6,11);ctx.closePath();ctx.fill();ctx.fillStyle='#8e6f50';ctx.fillRect(-4,-2,14,4)}else{ctx.fillStyle=evo?color:(type==='grimoire'?'#d27cff':'#b980ff');ctx.beginPath();ctx.arc(12,0,evo?10:(type==='grimoire'?8:6),0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f2e5ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(12,0,evo?15:(type==='grimoire'?12:10),0,Math.PI*2);ctx.stroke()}ctx.restore();ctx.shadowBlur=0}
function drawPlayer(){const bob=Math.sin(elapsed*7)*1.4,move=Math.hypot(input.x,input.y)>.08,accent=runEvolution?evolutionDefs[runEvolution].color:'#72efc1';ctx.save();ctx.translate(player.x,player.y+bob);if(player.hitFlash>0)ctx.globalAlpha=.56+Math.sin(performance.now()*.04)*.38;ctx.fillStyle='rgba(0,0,0,.36)';ctx.beginPath();ctx.ellipse(0,18,20,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,1,25+Math.sin(elapsed*4)*1.6,0,Math.PI*2);ctx.stroke();if(runEvolution){ctx.strokeStyle=accent+'45';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,1,31+Math.sin(elapsed*3)*2,0,Math.PI*2);ctx.stroke()}if(player.shield>0){ctx.strokeStyle='rgba(130,241,220,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,1,30+Math.sin(elapsed*5)*1.2,0,Math.PI*2);ctx.stroke()}ctx.save();ctx.rotate((player.facing||0)+Math.PI);ctx.fillStyle='#121a2a';ctx.strokeStyle='#050911';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-11,-3);ctx.quadraticCurveTo(-18,16+(move?4:0),-6,22);ctx.lineTo(0,15);ctx.lineTo(6,22);ctx.quadraticCurveTo(18,16-(move?4:0),11,-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.shadowColor=accent;ctx.shadowBlur=15;ctx.fillStyle='#173f3b';ctx.strokeStyle='#071015';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,8);ctx.lineTo(-11,-7);ctx.lineTo(-6,-14);ctx.lineTo(6,-14);ctx.lineTo(11,-7);ctx.lineTo(13,8);ctx.lineTo(8,16);ctx.lineTo(-8,16);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=accent;ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(-9,6);ctx.lineTo(-7,-5);ctx.lineTo(0,-9);ctx.lineTo(7,-5);ctx.lineTo(9,6);ctx.lineTo(4,12);ctx.lineTo(-4,12);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.fillStyle='#2d3549';ctx.beginPath();ctx.arc(0,-15,10,Math.PI,Math.PI*2);ctx.lineTo(8,-12);ctx.lineTo(-8,-12);ctx.closePath();ctx.fill();ctx.strokeStyle='#080c13';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#d7ad87';ctx.beginPath();ctx.arc(0,-13,7,0,Math.PI);ctx.fill();ctx.fillStyle=accent;ctx.shadowColor=accent;ctx.shadowBlur=7;ctx.beginPath();ctx.arc(-2,-13,1.4,0,Math.PI*2);ctx.arc(3,-13,1.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#516179';ctx.fillRect(-9,13,7,5);ctx.fillRect(2,13,7,5);drawPlayerWeapon(player.weaponType,player.facing||0);ctx.restore()}
function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;if(!paused)update(dt);draw();requestAnimationFrame(loop)}
function joyStart(e){if(!running||paused)return;if(e.touches){const t=e.changedTouches[0];if(t.clientX>W*.62&&t.clientY<H*.72)return;joyId=t.identifier;joyOrigin={x:t.clientX,y:t.clientY}}else{joyId='mouse';joyOrigin={x:e.clientX,y:e.clientY}}joyMove(e)}function joyMove(e){if(joyId===null)return;let t;if(e.touches){t=[...e.changedTouches].find(v=>v.identifier===joyId)||[...e.touches].find(v=>v.identifier===joyId);if(!t)return}else t=e;let dx=t.clientX-joyOrigin.x,dy=t.clientY-joyOrigin.y,mag=Math.hypot(dx,dy),max=42;if(mag>max){dx=dx/mag*max;dy=dy/mag*max}input.x=dx/max;input.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}function joyEnd(e){if(joyId===null)return;if(e.changedTouches&&![...e.changedTouches].some(v=>v.identifier===joyId))return;joyId=null;input={x:0,y:0};stick.style.transform='translate(0,0)'}

/* ===== LOOT / SKILL FOUNDATION MODULE ===== */
const baseSkillIds=['flame','lightning','frost','meteor','blades','ward'];
const skillFusionDefs={
 infernoCyclone:{name:'적염회풍검',icon:'🔥🌀',ingredients:['flame','blades'],color:'#ff8b58',baseCooldown:4.8,desc:'화염 고리와 영혼 칼날이 융합되어 불타는 칼날이 주변을 휩쓸고 사방으로 퍼집니다.'},
 stormNova:{name:'빙뢰무극',icon:'⚡❄️',ingredients:['lightning','frost'],color:'#9edfff',baseCooldown:5.2,desc:'연쇄 번개가 적 무리를 타고 흐른 뒤 냉기 폭발을 일으켜 주변 적을 둔화합니다.'},
 astralAegis:{name:'천성금종진',icon:'☄️🛡️',ingredients:['meteor','ward'],color:'#d8adff',baseCooldown:7.1,desc:'보호막을 생성하는 동시에 적 무리에 별똥별을 떨어뜨리는 공격·방어 복합 스킬입니다.'}
};
for(const [id,f] of Object.entries(skillFusionDefs))skillDefs[id]={name:f.name,icon:f.icon,desc:f.desc,baseCooldown:f.baseCooldown,price:9999,color:f.color,fusion:true};
let runSkills=[null,null,null],potions=[],pendingSkillLoot=null,bossLootGraceUntil=0;

// Fresh profiles no longer start with a skill. Existing v3.7 skills are retained only as discovered codex entries.
function freshProfile(){const w=starterItem('weapon','수련용 청강검','⚔️',{damage:4},'sword');return {version:6,gold:0,soulXp:0,soulLevel:1,highestStage:1,bestTime:0,bestKills:0,totalKills:0,inventory:[w],equipped:{weapon:w.id,head:null,chest:null,gloves:null,legs:null,boots:null,accessory1:null,accessory2:null,accessory3:null},skillsOwned:[],equippedSkills:[null,null,null],shopStock:[],shopRefreshes:0,starterLoadoutV414:true}}
function upgradeProfile(p){if(!p)return freshProfile();const oldVersion=p.version||0;p.version=Math.max(6,oldVersion);p.highestStage=p.highestStage||1;p.inventory=Array.isArray(p.inventory)?p.inventory:[];p.equipped=p.equipped||{};p.skillsOwned=Array.isArray(p.skillsOwned)?[...new Set(p.skillsOwned.filter(id=>skillDefs[id]||['infernoCyclone','stormNova','astralAegis'].includes(id)))]:[];p.equippedSkills=[null,null,null];p.shopStock=Array.isArray(p.shopStock)&&oldVersion>=5?p.shopStock.filter(o=>o&&o.type==='item'):[];p.shopRefreshes=Number.isFinite(p.shopRefreshes)?p.shopRefreshes:0;return p}
function loadProfile(){try{const cur=JSON.parse(localStorage.getItem(STORAGE_KEY));if(cur&&Array.isArray(cur.inventory))return upgradeProfile(cur);for(const key of [OLD_KEY,OLDER_KEY,LEGACY_KEY]){const old=JSON.parse(localStorage.getItem(key));if(!old)continue;const migrated=old.version===2?upgradeProfile(migrateV2(old)):upgradeProfile(old);localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}}catch(e){}return freshProfile()}

// Mobile scale tuning: smaller player, monsters and ammunition while preserving combat ranges.
weaponDefs.sword.size=4.5;weaponDefs.dagger.size=3.4;weaponDefs.bow.size=3.2;weaponDefs.staff.size=7.2;weaponDefs.hammer.size=8;weaponDefs.spear.size=4;weaponDefs.axe.size=6;weaponDefs.grimoire.size=5.2;
const v37SpawnEnemy=spawnEnemy;spawnEnemy=function(type=null){const n=enemies.length;v37SpawnEnemy(type);const e=enemies[n];if(e){e.r*=e.type==='boss'?.74:e.type==='midboss'?.75:e.type==='elite'?.76:.72}};
const v37CreateEnemyBullet=createEnemyBullet;createEnemyBullet=function(x,y,angle,speed,damage,color,extra={}){v37CreateEnemyBullet(x,y,angle,speed,damage,color,{...extra,r:(extra.r||6)*.72})};
const v37DrawPlayer=drawPlayer;drawPlayer=function(){if(!player)return;ctx.save();ctx.translate(player.x,player.y);ctx.scale(.78,.78);ctx.translate(-player.x,-player.y);v37DrawPlayer();ctx.restore()};
const v37DrawBullet=drawBullet;drawBullet=function(b){ctx.save();ctx.translate(b.x,b.y);ctx.scale(.76,.76);ctx.translate(-b.x,-b.y);v37DrawBullet(b);ctx.restore()};
const v37DrawEnemyBullet=drawEnemyBullet;drawEnemyBullet=function(b){ctx.save();ctx.translate(b.x,b.y);ctx.scale(.76,.76);ctx.translate(-b.x,-b.y);v37DrawEnemyBullet(b);ctx.restore()};

function safeCratePoint(minCenter=360){return safeWorldPoint(minCenter)}
function generateWorld(){selectMapTheme();terrainPatches=Array.from({length:96},(_,i)=>({x:rand(120,WORLD_W-120),y:rand(120,WORLD_H-120),rx:rand(120,330),ry:rand(90,250),rot:rand(0,Math.PI),kind:i%4}));groundDecos=Array.from({length:680},()=>({x:rand(60,WORLD_W-60),y:rand(60,WORLD_H-60),kind:Math.floor(rand(0,5)),rot:rand(0,Math.PI*2),scale:rand(.7,1.45)}));fogWisps=Array.from({length:58},()=>({x:rand(0,WORLD_W),y:rand(0,WORLD_H),r:rand(100,240),speed:rand(4,12),phase:rand(0,Math.PI*2)}));mapPaths=[];for(let p=0;p<3;p++){const horizontal=p!==1,pts=[];if(horizontal){pts.push({x:80,y:rand(WORLD_H*.18,WORLD_H*.82)});pts.push({x:WORLD_W*.32,y:rand(WORLD_H*.15,WORLD_H*.85)});pts.push({x:WORLD_W*.68,y:rand(WORLD_H*.15,WORLD_H*.85)});pts.push({x:WORLD_W-80,y:rand(WORLD_H*.18,WORLD_H*.82)})}else{pts.push({x:rand(WORLD_W*.2,WORLD_W*.8),y:80});pts.push({x:rand(WORLD_W*.15,WORLD_W*.85),y:WORLD_H*.34});pts.push({x:rand(WORLD_W*.15,WORLD_W*.85),y:WORLD_H*.68});pts.push({x:rand(WORLD_W*.2,WORLD_W*.8),y:WORLD_H-80})}mapPaths.push(pts)}mapLandmarks=[];const lmKinds=currentMap.id==='forest'?['shrine','tree','crystal','gate']:currentMap.id==='frost'?['crystal','obelisk','gate','shrine']:currentMap.id==='ember'?['forge','obelisk','crystal','gate']:['obelisk','shrine','gate','crystal'];for(let i=0;i<14;i++){const p=safeWorldPoint(420);mapLandmarks.push({x:p.x,y:p.y,kind:pick(lmKinds),r:rand(32,55),phase:rand(0,Math.PI*2)})}chests=[];for(let i=0;i<22;i++){const p=safeCratePoint(310),reinforced=i>=18,maxHp=reinforced?70:44;chests.push({x:p.x,y:p.y,r:reinforced?18:16,hp:maxHp,maxHp,broken:false,elite:reinforced,tier:reinforced?1:0,hitFlash:0})}springs=[];obstacles=[];const poi=[...chests.map(o=>[o.x,o.y,90]),...mapLandmarks.map(o=>[o.x,o.y,o.r+70]),[WORLD_W/2,WORLD_H/2,330]],types=currentMap.id==='frost'?['rock','pillar','pillar','ruin','ruin','tree']:currentMap.id==='ember'?['rock','rock','rock','ruin','pillar','tree']:currentMap.id==='crypt'?['pillar','ruin','ruin','tree','rock','pillar']:['rock','rock','tree','tree','pillar','ruin'];for(let n=0;n<210&&obstacles.length<96;n++){const x=rand(110,WORLD_W-110),y=rand(110,WORLD_H-110),type=pick(types),r=type==='rock'?rand(28,46):type==='tree'?rand(28,40):type==='pillar'?rand(25,34):rand(36,52);if(poi.some(([px,py,pr])=>dist2(x,y,px,py)<(r+pr)*(r+pr)))continue;if(obstacles.some(o=>dist2(x,y,o.x,o.y)<(r+o.r+52)*(r+o.r+52)))continue;obstacles.push({x,y,r,type,rot:rand(0,Math.PI*2),variant:Math.floor(rand(0,3))})}}
function resetWorldInteractions(){for(const c of chests){c.broken=false;c.hp=c.maxHp;c.hitFlash=0}springs=[]}
function updateWorldInteractions(dt){for(const c of chests)c.hitFlash=Math.max(0,(c.hitFlash||0)-dt);zoneBadge.classList.remove('danger');zoneBadge.textContent=`${currentMap.icon} ${currentMap.name} · ${currentMap.tag}`;enemyGuide.textContent=MAP_GUIDES[currentMap.roster]||'👹 다양한 적 패턴'}
function spawnRewardChest(x,y,tier=1){const maxHp=52+tier*18;chests.push({x:Math.max(40,Math.min(WORLD_W-40,x)),y:Math.max(40,Math.min(WORLD_H-40,y)),r:18+tier*1.5,hp:maxHp,maxHp,broken:false,elite:true,tier,hitFlash:0,dropped:true});showToast(tier>=3?'👑 보스 보상 상자가 떨어졌습니다!':'📦 강한 적이 보상 상자를 떨어뜨렸습니다.')}
function nearestCrate(maxD=500){let best=null,bd=maxD*maxD;for(const c of chests){if(c.broken)continue;const d=dist2(player.x,player.y,c.x,c.y);if(d<bd&&isOnCombatScreen(c,70)){bd=d;best=c}}return best}
function dropPotion(x,y,better=false){potions.push({x,y,r:8,phase:rand(0,Math.PI*2),healPct:better?.30:.20,dead:false})}
function breakChest(c){if(c.broken)return;c.broken=true;c.hp=0;const tier=c.tier||0,glow=tier>=2?'#ffd164':currentMap.accent;burst(c.x,c.y,16+tier*5,glow);const gold=Math.floor(rand(7+tier*10,16+tier*18));for(let n=0;n<Math.min(4,1+tier);n++)addCoin(c.x+rand(-12,12),c.y+rand(-12,12),Math.max(1,Math.round(gold/Math.min(4,1+tier))));const gearChance=tier>=2?1:tier===1?.68:.34,skillChance=tier>=3?1:tier===2?.72:tier===1?.42:.18,potionChance=tier>=2?.58:tier===1?.38:.24;if(Math.random()<gearChance)dropLoot(c.x+rand(-10,10),c.y-8,tier>=1);if(Math.random()<potionChance)dropPotion(c.x+rand(-12,12),c.y+10,tier>=2);if(Math.random()<skillChance)acquireSkillFromChest(tier>=2);showToast(tier?`📦 보상 상자 파괴 · 보상 획득`:'🪵 보급 상자 파괴 · 랜덤 보상');if(navigator.vibrate)navigator.vibrate([16,18,24])}
function damageChest(c,damage,color='#ffd164'){if(!c||c.broken)return;c.hp-=Math.max(1,damage);c.hitFlash=.10;burst(c.x,c.y,3,color);if(c.hp<=0)breakChest(c)}

// Make melee weapons and projectiles able to destroy crates.
const v37HitSword=hitSword;hitSword=function(angle,wd,crit){v37HitSword(angle,wd,crit);const r=wd.range,arc=.72;for(const c of chests){if(c.broken)continue;const dx=c.x-player.x,dy=c.y-player.y,d=Math.hypot(dx,dy);if(d<=r+c.r&&Math.abs(angleDiff(Math.atan2(dy,dx),angle))<=arc)damageChest(c,player.damage*wd.damageMult*(crit?1.5:1),'#aef3dc')}};
const v37HitHammer=hitHammer;hitHammer=function(angle,wd,crit){v37HitHammer(angle,wd,crit);const cx=player.x+Math.cos(angle)*62,cy=player.y+Math.sin(angle)*62,r=78;for(const c of chests)if(!c.broken&&Math.hypot(c.x-cx,c.y-cy)<=r+c.r)damageChest(c,player.damage*wd.damageMult*(crit?1.5:1),'#f5c77c')};
const v37HitSpear=hitSpear;hitSpear=function(angle,wd,crit){v37HitSpear(angle,wd,crit);const x2=player.x+Math.cos(angle)*wd.range,y2=player.y+Math.sin(angle)*wd.range;for(const c of chests)if(!c.broken&&pointSegDistance(c.x,c.y,player.x,player.y,x2,y2)<=c.r+13)damageChest(c,player.damage*wd.damageMult*(crit?1.5:1),'#bde9ff')};
const v37Shoot=shoot;shoot=function(){const wd=weaponDefs[player.weaponType]||weaponDefs.sword;if(nearestEnemy(Math.max(wd.range,160))){v37Shoot();return}const c=nearestCrate(Math.max(wd.range,160));if(!c)return;const base=Math.atan2(c.y-player.y,c.x-player.x),crit=weaponCrit();player.facing=base;if(player.weaponType==='sword'){hitSword(base,wd,crit);return}if(player.weaponType==='hammer'){hitHammer(base,wd,crit);return}if(player.weaponType==='spear'){hitSpear(base,wd,crit);return}if(player.weaponType==='axe'){for(let n=0;n<wd.count;n++)createBullet((Math.PI*2/wd.count)*n+elapsed*.8,wd,crit,{shape:'axe'});return}for(let n=0;n<wd.count;n++){const off=wd.count===1?0:(n-(wd.count-1)/2)*(wd.spread||.12),shape=player.weaponType==='dagger'?'dagger':player.weaponType==='bow'?'arrow':player.weaponType==='staff'?'arcane':'rune';createBullet(base+off,wd,crit,{shape,homing:0})}};

// Run skills: empty at stage start, found from crates, max 3 active. Compatible pairs fuse into a new skill.
function markSkillDiscovered(id){if(!profile.skillsOwned.includes(id)){profile.skillsOwned.push(id);saveProfile()}}
function fusionReadySkill(){for(const [id,f] of Object.entries(skillFusionDefs))if(f.ingredients.every(x=>runSkills.includes(x))&&!runSkills.includes(id))return id;return null}
function fuseRunSkills(id){const f=skillFusionDefs[id];if(!f)return;const slots=f.ingredients.map(x=>runSkills.indexOf(x));if(slots.some(x=>x<0))return;const lv=Math.min(5,Math.max(...f.ingredients.map(x=>runSkillLevels[x]||1))+1);for(const ing of f.ingredients){delete runSkillLevels[ing];delete skillCooldowns[ing]}runSkills[slots[0]]=id;runSkills[slots[1]]=null;runSkillLevels[id]=lv;skillCooldowns[id]=1.4;markSkillDiscovered(id);showToast(`${f.icon} 스킬 융합! ${f.name}`);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r:125,life:.7,max:.7,color:f.color});updateSkillHUD();if(navigator.vibrate)navigator.vibrate([30,20,50])}
function attachRunSkill(id,slot){pendingSkillLoot=null;const old=runSkills[slot];if(old&&old!==id){delete runSkillLevels[old];delete skillCooldowns[old]}runSkills[slot]=id;runSkillLevels[id]=Math.max(1,runSkillLevels[id]||1);skillCooldowns[id]=1+slot*.5;markSkillDiscovered(id);updateSkillHUD();closeItemModal();showToast(`${skillDefs[id].icon} ${skillDefs[id].name} 획득`)}
function showSkillLootModal(id){const sk=skillDefs[id];paused=true;itemModalResume=true;pendingSkillLoot=id;const empty=runSkills.findIndex(x=>!x);$('itemDetail').innerHTML=`<div class="lootPause">⏸ 전투 일시정지 · 상자에서 스킬을 발견했습니다.</div><div class="itemHero"><div class="itemIcon" style="box-shadow:0 0 24px ${sk.color}55">${sk.icon}</div><div><h3>${sk.name}</h3><div class="rarityLabel epic">전투 스킬 · 자동 발동</div><div style="font-size:10px;color:#aab2c7;margin-top:5px">${sk.desc}</div></div></div><div class="specialEffect"><b>✨ 스킬 조합</b><br>${Object.values(skillFusionDefs).filter(f=>f.ingredients.includes(id)).map(f=>`${f.ingredients.map(x=>skillDefs[x].icon+skillDefs[x].name).join(' + ')} → ${f.icon} ${f.name}`).join('<br>')||'현재 알려진 조합 없음'}</div>${empty>=0?`<button class="btn wide" id="takeSkillBtn">스킬 ${empty+1}번 슬롯에 획득</button>`:`<div class="accessoryChoices">${runSkills.map((x,n)=>`<button class="btn secondary" data-skill-replace="${n}">${n+1}번 교체<br>${skillDefs[x].icon} ${skillDefs[x].name}</button>`).join('')}</div>`}<button class="btn ghost wide mt8" id="discardSkillBtn">버리기</button>`;if(empty>=0)$('takeSkillBtn').onclick=()=>attachRunSkill(id,empty);document.querySelectorAll('[data-skill-replace]').forEach(b=>b.onclick=()=>attachRunSkill(id,+b.dataset.skillReplace));$('discardSkillBtn').onclick=()=>{pendingSkillLoot=null;closeItemModal()};itemModal.classList.remove('hidden')}
function acquireSkillFromChest(forceNew=false){let pool=baseSkillIds;if(forceNew){const fresh=baseSkillIds.filter(id=>!runSkills.includes(id));if(fresh.length)pool=fresh}const id=pick(pool);if(runSkills.includes(id)){runSkillLevels[id]=Math.min(5,(runSkillLevels[id]||1)+1);markSkillDiscovered(id);skillCooldowns[id]=Math.min(skillCooldowns[id]||0,skillCooldown(id));showToast(`${skillDefs[id].icon} ${skillDefs[id].name} 강화 · Lv.${runSkillLevels[id]}`);updateSkillHUD();return}showSkillLootModal(id)}
function updateSkills(dt){for(const id of runSkills){if(!id||!skillDefs[id])continue;skillCooldowns[id]=(skillCooldowns[id]??1)-dt;if(skillCooldowns[id]<=0){castSkill(id);skillCooldowns[id]=skillCooldown(id)}}}
function updateSkillHUD(){if(!skillBar)return;skillBar.innerHTML=runSkills.map((id,idx)=>{if(!id||!skillDefs[id])return `<div class="battleSkill empty"><span class="icon">＋</span><span class="sec">상자</span></div>`;const sk=skillDefs[id],cd=Math.max(0,skillCooldowns[id]||0),total=skillCooldown(id),pct=Math.min(1,cd/total);return `<div class="battleSkill"><div class="cd" style="transform:scaleY(${pct})"></div><span class="icon">${sk.icon}</span><span class="lv">${sk.fusion?'융합 ':''}Lv.${skillLevel(id)}</span><span class="sec">${cd>0.15?cd.toFixed(1):'준비'}</span></div>`}).join('')}
const v37CastSkill=castSkill;castSkill=function(id){const lv=skillLevel(id),sk=skillDefs[id];if(id==='infernoCyclone'){const r=118+(lv-1)*10,dmg=player.damage*(1.0+lv*.22);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.48,max:.48,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color);for(const c of chests)if(!c.broken&&Math.hypot(c.x-player.x,c.y-player.y)<=r+c.r)damageChest(c,dmg*.7,sk.color);const count=6+lv;for(let n=0;n<count;n++){const a=Math.PI*2*n/count+elapsed*.5;createBullet(a,{speed:420,range:300,pierce:1,damageMult:1},false,{damage:player.damage*(.42+lv*.07),r:4.5,shape:'soulblade',weaponType:'skill',color:sk.color,pierce:1})}}else if(id==='stormNova'){let candidates=enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,90)),cur={x:player.x,y:player.y},points=[cur],lastTarget=null;for(let n=0;n<Math.min(candidates.length,4+lv);n++){let best=null,bd=430*430;for(const e of candidates){const d=dist2(cur.x,cur.y,e.x,e.y);if(d<bd){bd=d;best=e}}if(!best)break;dealDirectDamage(best,player.damage*(.72+lv*.16),false,sk.color);best.slow=Math.max(best.slow||0,2.2);points.push({x:best.x,y:best.y});cur=best;lastTarget=best;candidates=candidates.filter(e=>e!==best)}if(points.length>1)attackEffects.push({type:'chain',points,life:.32,max:.32,color:sk.color});if(lastTarget){const r=78+lv*8;attackEffects.push({type:'frost',x:lastTarget.x,y:lastTarget.y,r,life:.45,max:.45,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-lastTarget.x,e.y-lastTarget.y)<=r+e.r)e.slow=Math.max(e.slow||0,2.4)}}else if(id==='astralAegis'){const amount=22+lv*12+player.maxHp*.04;player.shield=Math.min(player.maxHp*.8,(player.shield||0)+amount);attackEffects.push({type:'ward',x:player.x,y:player.y,r:35,life:.5,max:.5,color:sk.color});const targets=enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,80)).sort((a,b)=>dist2(player.x,player.y,a.x,a.y)-dist2(player.x,player.y,b.x,b.y)).slice(0,Math.min(3,1+Math.floor(lv/2)));for(const t of targets){const r=78+lv*6,dmg=player.damage*(1.05+lv*.22);attackEffects.push({type:'meteor',x:t.x,y:t.y,r,life:.56,max:.56,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-t.x,e.y-t.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color)}}else v37CastSkill(id);updateSkillHUD()};

// Inventory loot is a decision: equip, store, or discard. Weapons always show the current weapon comparison.
function commitRunLoot(item){if(!runLoot.some(x=>x.id===item.id))runLoot.push(item);saveProfile()}
function acquireRunItem(item){if(runLoot.length>=18){runGold+=15;showToast('🎒 전투 가방이 가득 차 장비를 15골드로 전환했습니다.');return}profile.inventory.push(item);saveProfile();paused=true;itemModalResume=true;openItem(item.id,null,true);const curClose=$('modalCloseBtn');if(curClose){curClose.textContent='보관하고 계속';curClose.onclick=()=>{commitRunLoot(item);closeItemModal()}}const eqBtn=$('modalEquipBtn');if(eqBtn&&!eqBtn.disabled){const old=eqBtn.onclick;eqBtn.textContent=item.slot==='weapon'?'장착':'장착하고 계속';eqBtn.onclick=()=>{commitRunLoot(item);old&&old()}}document.querySelectorAll('[data-quickslot]').forEach(b=>{const old=b.onclick;b.onclick=()=>{commitRunLoot(item);old&&old()}});const discard=document.createElement('button');discard.className='btn ghost wide mt8';discard.textContent='버리기';discard.onclick=()=>{profile.inventory=profile.inventory.filter(x=>x.id!==item.id);saveProfile();showToast(`${item.icon} 장비를 버렸습니다.`);closeItemModal()};$('itemDetail').appendChild(discard);if(navigator.vibrate)navigator.vibrate([20,20,35])}

// Shop sells equipment only. Skills are stage loot.
function createShopStock(){const stage=Math.max(1,profile.highestStage||1),stock=[];for(let i=0;i<5;i++){const item=generateItem(stage,Math.random()<(i>=3?.55:.35));stock.push({offerId:uid(),type:'item',item,price:shopItemPrice(item),sold:false})}profile.shopStock=stock;saveProfile()}
function renderHome(){$('profileLevel').textContent=profile.soulLevel;$('combatPower').textContent=combatPower();$('profileGold').textContent=profile.gold;const st=profile.highestStage||1;$('stageHomeTitle').textContent=`STAGE ${st} · 랜덤 원정`;$('stageHomeDesc').textContent='7:00 · 파괴 상자 · 스킬 융합 · 중간/최종 보스';$('startBtn').textContent=`스테이지 ${st} 시작`;const order=['weapon','head','chest','gloves','legs','boots','accessory1','accessory2','accessory3'];$('homeEquip').innerHTML=order.map(slot=>{const i=equippedItem(slot),info=equipSlots[slot];return `<div class="homeSlot"><span class="hi">${i?i.icon:info.icon}</span><small>${info.name.replace('장신구 ','장')}</small><b class="${i?rarityInfo[i.rarity].class:''}">${i?escapeHtml(i.name):'비어 있음'}</b></div>`}).join('');$('homeSkills').innerHTML=[0,1,2].map(idx=>`<div class="homeSkill empty"><span class="si">📦</span><small>전투 스킬 ${idx+1}</small><b>상자에서 획득</b></div>`).join('')}
function renderSkills(){const discovered=new Set(profile.skillsOwned||[]);$('skillSlots').innerHTML=`<div class="skillSlot"><span class="icon">🔥🌀</span><small>조합 1</small><b>화염 고리 + 영혼 칼날</b></div><div class="skillSlot"><span class="icon">⚡❄️</span><small>조합 2</small><b>연쇄 번개 + 빙결 폭풍</b></div><div class="skillSlot"><span class="icon">☄️🛡️</span><small>조합 3</small><b>별똥별 + 수호 결계</b></div>`;$('ownedSkillCount').textContent=`${discovered.size}개 발견`;$('skillInventory').innerHTML=[...baseSkillIds,...Object.keys(skillFusionDefs)].map(id=>{const sk=skillDefs[id],known=discovered.has(id),fusion=skillFusionDefs[id];return `<div class="skillCard" style="opacity:${known?1:.58}"><div class="skillCardTop"><div class="skillIcon">${known?sk.icon:'❔'}</div><div><h3>${known?sk.name:'미발견 스킬'}${fusion?' · 융합':''}</h3><p>${known?sk.desc:'상자를 파괴해 발견하세요.'}${fusion?`<br><b style="color:#f2d787">조합:</b> ${fusion.ingredients.map(x=>skillDefs[x].icon+' '+skillDefs[x].name).join(' + ')}`:''}</p></div></div></div>`}).join('')}

// Strong enemies now drop breakable reward crates; normal enemies have a low potion chance.
function killEnemy(e){kills++;addGem(e.x,e.y,e.xp);addCoin(e.x+rand(-5,5),e.y+rand(-5,5),Math.floor(rand(e.gold[0],e.gold[1]+1)));burst(e.x,e.y,(e.type==='boss'||e.type==='midboss')?20:7,(e.type==='boss'||e.type==='midboss')?'#ffb149':'#ff6479');if(e.type==='midboss'){midBossDefeated=true;bossesDefeated++;spawnRewardChest(e.x,e.y,2);runGold+=12;showToast('⚔️ 중간 보스 처치! 보상 상자를 부수세요.')}else if(e.type==='boss'){bossesDefeated++;finalBossDefeated=true;bossLootGraceUntil=elapsed+12;spawnRewardChest(e.x-22,e.y,3);spawnRewardChest(e.x+22,e.y,2);showToast('👑 최종 보스 처치! 12초 안에 보상 상자를 확보하세요.')}else if(e.type==='elite'){if(Math.random()<.55)spawnRewardChest(e.x,e.y,1);if(Math.random()<.08)dropPotion(e.x+rand(-8,8),e.y+rand(-8,8),true)}else{const chance=e.type==='tank'?.045:.027;if(Math.random()<chance)dropPotion(e.x+rand(-8,8),e.y+rand(-8,8),false)}}

// Give the player a short post-boss loot window if the 7-minute timer has already expired.
const v37ClearStage=clearStage;clearStage=function(){const pending=chests.some(c=>c.dropped&&!c.broken&&(c.tier||0)>=2);if(finalBossDefeated&&pending&&elapsed<bossLootGraceUntil)return;v37ClearStage()};

// Stage reset: no starting skill, no weapon mastery level, smaller player collision radius.
const v37Reset=reset;reset=function(){v37Reset();bossLootGraceUntil=0;runSkills=[null,null,null];runSkillLevels={};skillCooldowns={};potions=[];runEvolution=null;player.r=12.5;player.bulletSize=(weaponDefs[player.weaponType]||weaponDefs.sword).size+aggregateStats().bulletSize;weaponBadge.classList.remove('evolved');updateSkillHUD();resetWorldInteractions()};

// Process crate hits from projectiles and potion pickup after the legacy battle update.
const v37Update=update;update=function(dt){v37Update(dt);if(!running||!player)return;for(const b of bullets){if(b.life<=0)continue;for(const c of chests){if(c.broken)continue;const rr=b.r+c.r;if(dist2(b.x,b.y,c.x,c.y)<rr*rr){damageChest(c,b.damage*.72,b.color||'#ffd164');if(b.pierce>0)b.pierce--;else b.life=0;break}}}bullets=bullets.filter(b=>b.life>0);if(paused)return;for(const p of potions){p.phase+=dt*5;let dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1;if(d<Math.max(player.magnet*.6,62)){const sp=Math.max(120,250-d);p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt}if(d<player.r+p.r+5){p.dead=true;const heal=Math.max(16,player.maxHp*p.healPct);player.hp=Math.min(player.maxHp,player.hp+heal);floatText(player.x,player.y-24,`+${Math.round(heal)} HP`,'#7bf1c8');showToast('🧪 회복 단약 획득')}}potions=potions.filter(p=>!p.dead)};

function drawPotion(p){if(p.x<camera.x-45||p.x>camera.x+W+45||p.y<camera.y-45||p.y>camera.y+H+45)return;ctx.save();ctx.translate(p.x,p.y);const bob=Math.sin(elapsed*5+p.phase)*2;ctx.translate(0,bob);ctx.shadowColor='#72efc1';ctx.shadowBlur=10;ctx.fillStyle='#d9e6e2';ctx.fillRect(-3,-8,6,4);ctx.fillStyle='#57dcae';ctx.beginPath();pathRoundRect(ctx,-6,-4,12,13,4);ctx.fill();ctx.strokeStyle='#e8fff7';ctx.lineWidth=1.2;ctx.stroke();ctx.restore()}
const v37Draw=draw;draw=function(){v37Draw();ctx.save();ctx.translate(-camera.x,-camera.y);for(const p of potions)drawPotion(p);ctx.restore()};
function drawChest(c){if(c.broken||c.x<camera.x-55||c.x>camera.x+W+55||c.y<camera.y-55||c.y>camera.y+H+55)return;ctx.save();ctx.translate(c.x,c.y);const tier=c.tier||0,glow=tier>=2?'#ffd164':tier===1?'#c598ff':currentMap.accent;ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,12,c.r*1.15,c.r*.38,0,0,Math.PI*2);ctx.fill();ctx.shadowColor=glow;ctx.shadowBlur=6+tier*4+(c.hitFlash>0?8:0);ctx.fillStyle=tier>=2?'#6c4b27':tier===1?'#4b365f':'#54452f';ctx.strokeStyle=glow+'aa';ctx.lineWidth=2;ctx.beginPath();pathRoundRect(ctx,-c.r,-c.r*.7,c.r*2,c.r*1.45,4);ctx.fill();ctx.stroke();ctx.fillStyle=glow;ctx.fillRect(-2,-c.r*.72,4,c.r*1.42);ctx.fillRect(-c.r,-2,c.r*2,4);ctx.shadowBlur=0;const w=c.r*2.1;ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(-w/2,c.r+5,w,3);ctx.fillStyle=glow;ctx.fillRect(-w/2,c.r+5,w*Math.max(0,c.hp/c.maxHp),3);ctx.restore()}
function drawMinimap(){if(miniMap.classList.contains('hidden')||!player)return;const mw=152,mh=152;mctx.clearRect(0,0,mw,mh);mctx.fillStyle='rgba(7,13,18,.95)';mctx.fillRect(0,0,mw,mh);mctx.strokeStyle=(currentMap?.accent||'#72efc1')+'55';mctx.lineWidth=3;mctx.strokeRect(3,3,mw-6,mh-6);const sx=(mw-12)/WORLD_W,sy=(mh-12)/WORLD_H,px=6+player.x*sx,py=6+player.y*sy;mctx.fillStyle='rgba(112,128,123,.28)';for(const o of obstacles){mctx.beginPath();mctx.arc(6+o.x*sx,6+o.y*sy,1.1,0,Math.PI*2);mctx.fill()}for(const c of chests){if(c.broken)continue;mctx.fillStyle=(c.tier||0)>=2?'#ffd164':(c.tier||0)===1?'#c598ff':'#b9a36f';mctx.fillRect(4+c.x*sx,4+c.y*sy,3.5,3.5)}for(const e of enemies){if(!['elite','midboss','boss'].includes(e.type))continue;mctx.fillStyle=e.type==='boss'?'#ffbd58':e.type==='midboss'?'#ff8c69':'#ff57aa';mctx.beginPath();mctx.arc(6+e.x*sx,6+e.y*sy,e.type==='boss'?4:e.type==='midboss'?3.5:2.5,0,Math.PI*2);mctx.fill()}mctx.shadowColor=currentMap?.accent||'#72efc1';mctx.shadowBlur=8;mctx.fillStyle=currentMap?.accent||'#72efc1';mctx.beginPath();mctx.arc(px,py,3.7,0,Math.PI*2);mctx.fill();mctx.shadowBlur=0;mctx.strokeStyle='rgba(255,255,255,.22)';mctx.lineWidth=1.2;mctx.strokeRect(6+camera.x*sx,6+camera.y*sy,W*sx,H*sy)}
/* ===== END LOOT / SKILL FOUNDATION ===== */

/* ===== UNLIMITED AUTO-SKILL / CORE FUSION MODULE ===== */
// v3.9 design: no skill slots. Every acquired skill is active automatically.
// Fusion requires two component skills PLUS one designated rare key skill.
Object.assign(skillDefs,{
 poison:{name:'독무공',icon:'☠️',desc:'적 무리에 독성 안개를 폭발시켜 범위 피해를 줍니다.',baseCooldown:6.1,price:9999,color:'#86e56f'},
 orbit:{name:'호신강기',icon:'🌀',desc:'주변을 도는 강기 구체가 적을 관통합니다.',baseCooldown:5.8,price:9999,color:'#72c8ff'},
 laser:{name:'일양지',icon:'☝️',desc:'응축한 지력을 직선으로 쏘아 적을 관통합니다.',baseCooldown:6.7,price:9999,color:'#ffe58a'},
 shadow:{name:'흑월비도',icon:'🌙',desc:'그림자 비도를 연속 투척해 적을 관통합니다.',baseCooldown:6.0,price:9999,color:'#b99aff'},
 wind:{name:'질풍검',icon:'🌪️',desc:'전방 넓은 부채꼴로 빠른 바람 칼날을 발사합니다.',baseCooldown:5.1,price:9999,color:'#8ff0df'},
 quake:{name:'진각',icon:'🪨',desc:'지면을 울려 주변 적에게 피해를 주고 잠시 둔화합니다.',baseCooldown:7.4,price:9999,color:'#d7a96f'},
 dragonHeart:{name:'용맥심법',icon:'🐉',desc:'핵심 심법. 주기적으로 화염 내공을 전방으로 방출합니다.',baseCooldown:8.2,price:9999,color:'#ff785d',keySkill:true},
 stormCore:{name:'뇌령주',icon:'⚡',desc:'핵심 기물. 주기적으로 가까운 적을 벽력으로 타격합니다.',baseCooldown:7.6,price:9999,color:'#70d9ff',keySkill:true},
 starSigil:{name:'천성인',icon:'🌟',desc:'핵심 기물. 가까운 적에게 천성 검기를 떨어뜨립니다.',baseCooldown:8.5,price:9999,color:'#ffd878',keySkill:true},
 worldSeed:{name:'청목진기',icon:'🌿',desc:'핵심 심법. 소량 회복과 주변 가시 강기를 발생시킵니다.',baseCooldown:9.6,price:9999,color:'#79e39b',keySkill:true},
 moonSeal:{name:'월영패',icon:'🌙',desc:'핵심 기물. 사방에 음영의 비도를 방출합니다.',baseCooldown:8.0,price:9999,color:'#a985e8',keySkill:true},
 primalCore:{name:'혼원진기',icon:'☯️',desc:'핵심 심법. 주변에 혼원 충격파를 일으킵니다.',baseCooldown:8.8,price:9999,color:'#e2ad70',keySkill:true}
});

baseSkillIds.splice(0,baseSkillIds.length,
 'flame','lightning','frost','meteor','blades','ward',
 'poison','orbit','laser','shadow','wind','quake',
 'dragonHeart','stormCore','starSigil','worldSeed','moonSeal','primalCore'
);

for(const k of Object.keys(skillFusionDefs))delete skillFusionDefs[k];
Object.assign(skillFusionDefs,{
 infernoCyclone:{name:'적염회풍검',icon:'🔥🌀',ingredients:['flame','blades'],key:'dragonHeart',color:'#ff8b58',baseCooldown:4.6,desc:'화염장과 회풍검기를 용맥심법으로 합일. 불타는 회전검과 화염 파동을 동시에 방출합니다.'},
 stormNova:{name:'빙뢰무극',icon:'⚡❄️',ingredients:['lightning','frost'],key:'stormCore',color:'#92e9ff',baseCooldown:4.4,desc:'벽력지와 한빙장을 뇌령주로 합일. 번개 전이와 광역 빙결이 함께 발생합니다.'},
 astralAegis:{name:'천성금종진',icon:'☄️🛡️',ingredients:['meteor','ward'],key:'starSigil',color:'#e2b6ff',baseCooldown:6.0,desc:'유성검우와 금종조를 천성인으로 합일. 보호막과 다중 천성 검기를 동시에 발동합니다.'},
 verdantPlague:{name:'청목만독진',icon:'🌿☠️',ingredients:['poison','orbit'],key:'worldSeed',color:'#8ae58a',baseCooldown:5.2,desc:'독무공과 호신강기를 청목진기로 합일. 넓은 독성 고리와 관통 청목 강기를 생성합니다.'},
 eclipseRay:{name:'일월멸광',icon:'🌑🌟',ingredients:['laser','shadow'],key:'moonSeal',color:'#c7a6ff',baseCooldown:5.0,desc:'일양지와 흑월비도를 월영패로 합일. 여러 적을 관통하는 월식 광선과 그림자 파편을 방출합니다.'},
 tempestRift:{name:'건곤폭풍진',icon:'🌪️🪨',ingredients:['wind','quake'],key:'primalCore',color:'#a9e8c9',baseCooldown:5.5,desc:'질풍검과 진각을 혼원진기로 합일. 전방 폭풍과 전방위 지진파가 동시에 발생합니다.'}
});
for(const [id,f] of Object.entries(skillFusionDefs))skillDefs[id]={name:f.name,icon:f.icon,desc:f.desc,baseCooldown:f.baseCooldown,price:9999,color:f.color,fusion:true};
const keySkillIds=['dragonHeart','stormCore','starSigil','worldSeed','moonSeal','primalCore'];
const normalSkillIds=baseSkillIds.filter(id=>!keySkillIds.includes(id));

function v39RemoveRunSkill(id){
 runSkills=runSkills.filter(x=>x&&x!==id);
 delete runSkillLevels[id];delete skillCooldowns[id];
}
function v39RecipeText(id){
 const rows=Object.values(skillFusionDefs).filter(f=>f.ingredients.includes(id)||f.key===id);
 return rows.map(f=>`${f.ingredients.map(x=>skillDefs[x].icon+' '+skillDefs[x].name).join(' + ')} + <b>${skillDefs[f.key].icon} ${skillDefs[f.key].name}</b> → ${f.icon} ${f.name}`).join('<br>')||'현재 알려진 융합 조합 없음';
}
function v39ReadyFusion(){
 for(const [id,f] of Object.entries(skillFusionDefs)){
  if(runSkills.includes(id))continue;
  if(!runSkills.includes(f.key))continue;
  if(f.ingredients.every(x=>runSkills.includes(x)))return id;
 }
 return null;
}
function v39TryAutoFusion(){
 let id;
 while((id=v39ReadyFusion()))fuseRunSkills(id);
}
fusionReadySkill=function(){return v39ReadyFusion()};
fuseRunSkills=function(id){
 const f=skillFusionDefs[id];if(!f||runSkills.includes(id)||!runSkills.includes(f.key)||!f.ingredients.every(x=>runSkills.includes(x)))return;
 const consumed=[...f.ingredients,f.key];
 const lv=Math.min(5,Math.max(...consumed.map(x=>runSkillLevels[x]||1))+1);
 consumed.forEach(v39RemoveRunSkill);
 runSkills.push(id);runSkillLevels[id]=lv;skillCooldowns[id]=1.15;markSkillDiscovered(id);
 showToast(`${f.icon} 핵심 융합 완성! ${f.name}`);
 attackEffects.push({type:'skillRing',x:player.x,y:player.y,r:130,life:.72,max:.72,color:f.color});
 if(navigator.vibrate)navigator.vibrate([30,18,48,18,65]);
 updateSkillHUD();
};
attachRunSkill=function(id){
 pendingSkillLoot=null;
 if(!runSkills.includes(id))runSkills.push(id);
 runSkillLevels[id]=Math.max(1,runSkillLevels[id]||1);
 skillCooldowns[id]=Math.min(skillCooldowns[id]??1.1,1.1);
 markSkillDiscovered(id);closeItemModal();showToast(`${skillDefs[id].icon} ${skillDefs[id].name} 획득 · 자동 적용`);
 v39TryAutoFusion();updateSkillHUD();
};
showSkillLootModal=function(id){
 const sk=skillDefs[id];paused=true;itemModalResume=true;pendingSkillLoot=id;
 const keyBadge=sk.keySkill?'<div class="rarityLabel legendary">핵심 스킬 · 융합 촉매</div>':'<div class="rarityLabel epic">자동 전투 스킬</div>';
 $('itemDetail').innerHTML=`<div class="lootPause">⏸ 전투 일시정지 · 상자에서 스킬을 발견했습니다.</div><div class="itemHero"><div class="itemIcon" style="box-shadow:0 0 24px ${sk.color}55">${sk.icon}</div><div><h3>${sk.name}</h3>${keyBadge}<div style="font-size:10px;color:#aab2c7;margin-top:5px">${sk.desc}</div></div></div><div class="specialEffect"><b>✨ 융합 정보</b><br>${v39RecipeText(id)}<br><small style="color:#9ca7bf">※ 일반 스킬 두 개만으로는 융합되지 않으며 지정된 핵심 스킬이 반드시 필요합니다.</small></div><button class="btn wide" id="takeSkillBtn">획득 · 자동 적용</button><button class="btn ghost wide mt8" id="discardSkillBtn">버리기</button>`;
 $('takeSkillBtn').onclick=()=>attachRunSkill(id);
 $('discardSkillBtn').onclick=()=>{pendingSkillLoot=null;closeItemModal()};itemModal.classList.remove('hidden');
};
acquireSkillFromChest=function(forceNew=false){
 // 핵심 스킬은 희귀. 상위 보상 상자에서는 확률이 조금 상승합니다.
 const keyChance=forceNew?.24:.11;
 let pool=Math.random()<keyChance?keySkillIds:normalSkillIds;
 if(forceNew){const fresh=pool.filter(id=>!runSkills.includes(id));if(fresh.length)pool=fresh}
 const id=pick(pool);
 if(runSkills.includes(id)){
  runSkillLevels[id]=Math.min(5,(runSkillLevels[id]||1)+1);markSkillDiscovered(id);
  skillCooldowns[id]=Math.min(skillCooldowns[id]||0,skillCooldown(id));
  showToast(`${skillDefs[id].icon} ${skillDefs[id].name} 강화 · Lv.${runSkillLevels[id]}`);v39TryAutoFusion();return;
 }
 showSkillLootModal(id);
};
updateSkills=function(dt){
 for(const id of [...runSkills]){
  if(!id||!skillDefs[id])continue;
  skillCooldowns[id]=(skillCooldowns[id]??1)-dt;
  if(skillCooldowns[id]<=0){castSkill(id);skillCooldowns[id]=skillCooldown(id)}
 }
};
updateSkillHUD=function(){
 if(!skillBar)return;skillBar.innerHTML='';skillBar.classList.add('hidden');
};

function v39DamageChests(x,y,r,dmg,color){for(const c of chests)if(!c.broken&&Math.hypot(c.x-x,c.y-y)<=r+c.r)damageChest(c,dmg*.65,color)}
function v39Nearest(max=520){return enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,100)).sort((a,b)=>dist2(player.x,player.y,a.x,a.y)-dist2(player.x,player.y,b.x,b.y)).find(e=>dist2(player.x,player.y,e.x,e.y)<=max*max)||null}
function v39BeamDamage(target,dmg,color,width=24){
 if(!target)return;const ax=player.x,ay=player.y,bx=target.x,by=target.y,dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy||1;
 attackEffects.push({type:'chain',points:[{x:ax,y:ay},{x:bx,y:by}],life:.27,max:.27,color});
 for(const e of enemies){if(e.hp<=0)continue;const t=Math.max(0,Math.min(1,((e.x-ax)*dx+(e.y-ay)*dy)/len2)),px=ax+t*dx,py=ay+t*dy;if(Math.hypot(e.x-px,e.y-py)<=e.r+width)dealDirectDamage(e,dmg,false,color)}
}
const v38CastSkill=castSkill;
castSkill=function(id){
 const lv=skillLevel(id),sk=skillDefs[id];if(!sk||!player)return;
 if(id==='poison'){
  const t=v39Nearest(500)||player,r=78+lv*10,dmg=player.damage*(.58+lv*.14);attackEffects.push({type:'frost',x:t.x,y:t.y,r,life:.52,max:.52,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-t.x,e.y-t.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color);v39DamageChests(t.x,t.y,r,dmg,sk.color);
 }else if(id==='orbit'){
  const count=5+lv;for(let n=0;n<count;n++){const a=Math.PI*2*n/count+elapsed*.45;createBullet(a,{speed:330,range:245,pierce:1,damageMult:1},false,{damage:player.damage*(.43+lv*.07),r:4.2,shape:'orb',weaponType:'skill',color:sk.color,pierce:1})}
 }else if(id==='laser'){
  const t=v39Nearest(520);if(t)v39BeamDamage(t,player.damage*(1.0+lv*.22),sk.color,18+lv*2);
 }else if(id==='shadow'){
  const t=v39Nearest(500);const a=t?Math.atan2(t.y-player.y,t.x-player.x):player.facing;for(const off of [-.2,0,.2])createBullet(a+off,{speed:470,range:360,pierce:2,damageMult:1},false,{damage:player.damage*(.55+lv*.1),r:5.2,shape:'soulblade',weaponType:'skill',color:sk.color,pierce:2});
 }else if(id==='wind'){
  const t=v39Nearest(480);const a=t?Math.atan2(t.y-player.y,t.x-player.x):player.facing;const count=3+Math.floor(lv/2);for(let n=0;n<count;n++){const off=(n-(count-1)/2)*.15;createBullet(a+off,{speed:560,range:325,pierce:1,damageMult:1},false,{damage:player.damage*(.42+lv*.075),r:3.8,shape:'arrow',weaponType:'skill',color:sk.color,pierce:1})}
 }else if(id==='quake'){
  const r=105+lv*10,dmg=player.damage*(.72+lv*.17);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.48,max:.48,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r){dealDirectDamage(e,dmg,false,sk.color);e.slow=Math.max(e.slow||0,1.5+lv*.2)}v39DamageChests(player.x,player.y,r,dmg,sk.color);
 }else if(id==='dragonHeart'){
  const t=v39Nearest(300),a=t?Math.atan2(t.y-player.y,t.x-player.x):player.facing,r=155,dmg=player.damage*(.72+lv*.12);attackEffects.push({type:'chain',points:[{x:player.x,y:player.y},{x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r}],life:.3,max:.3,color:sk.color});for(const e of enemies){const d=Math.hypot(e.x-player.x,e.y-player.y),ea=Math.atan2(e.y-player.y,e.x-player.x);if(d<=r+e.r&&Math.abs(angleDiff(ea,a))<.55)dealDirectDamage(e,dmg,false,sk.color)}
 }else if(id==='stormCore'){
  let arr=enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,70)).sort((a,b)=>dist2(player.x,player.y,a.x,a.y)-dist2(player.x,player.y,b.x,b.y)).slice(0,2+Math.floor(lv/3));for(const e of arr){dealDirectDamage(e,player.damage*(.65+lv*.11),false,sk.color);attackEffects.push({type:'chain',points:[{x:player.x,y:player.y},{x:e.x,y:e.y}],life:.24,max:.24,color:sk.color})}
 }else if(id==='starSigil'){
  const t=v39Nearest(500);if(t){const r=54+lv*5,dmg=player.damage*(.82+lv*.16);attackEffects.push({type:'meteor',x:t.x,y:t.y,r,life:.48,max:.48,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-t.x,e.y-t.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color)}
 }else if(id==='worldSeed'){
  const heal=Math.max(2,player.maxHp*(.012+lv*.002));player.hp=Math.min(player.maxHp,player.hp+heal);const r=72+lv*5,dmg=player.damage*(.34+lv*.07);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.35,max:.35,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color);
 }else if(id==='moonSeal'){
  for(let n=0;n<4+Math.floor(lv/3);n++){const a=Math.PI*2*n/(4+Math.floor(lv/3))+elapsed*.2;createBullet(a,{speed:410,range:285,pierce:1,damageMult:1},false,{damage:player.damage*(.42+lv*.08),r:4.3,shape:'soulblade',weaponType:'skill',color:sk.color,pierce:1})}
 }else if(id==='primalCore'){
  const r=78+lv*6,dmg=player.damage*(.46+lv*.09);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.38,max:.38,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r){dealDirectDamage(e,dmg,false,sk.color);e.slow=Math.max(e.slow||0,1.1)}
 }else if(id==='verdantPlague'){
  const r=140+lv*8,dmg=player.damage*(.9+lv*.18);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.52,max:.52,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r)dealDirectDamage(e,dmg,false,sk.color);v39DamageChests(player.x,player.y,r,dmg,sk.color);for(let n=0;n<7+lv;n++){const a=Math.PI*2*n/(7+lv)+elapsed*.4;createBullet(a,{speed:360,range:330,pierce:2,damageMult:1},false,{damage:player.damage*(.42+lv*.06),r:4.2,shape:'orb',weaponType:'skill',color:sk.color,pierce:2})}
 }else if(id==='eclipseRay'){
  const targets=enemies.filter(e=>e.hp>0&&isOnCombatScreen(e,80)).sort((a,b)=>dist2(player.x,player.y,a.x,a.y)-dist2(player.x,player.y,b.x,b.y)).slice(0,2+Math.floor(lv/2));for(const t of targets)v39BeamDamage(t,player.damage*(.84+lv*.16),sk.color,22);for(let n=0;n<4;n++){const a=Math.PI*.5*n+elapsed*.3;createBullet(a,{speed:430,range:270,pierce:2,damageMult:1},false,{damage:player.damage*(.35+lv*.06),r:4.5,shape:'soulblade',weaponType:'skill',color:sk.color,pierce:2})}
 }else if(id==='tempestRift'){
  const r=122+lv*7,dmg=player.damage*(.68+lv*.14);attackEffects.push({type:'skillRing',x:player.x,y:player.y,r,life:.45,max:.45,color:sk.color});for(const e of enemies)if(Math.hypot(e.x-player.x,e.y-player.y)<=r+e.r){dealDirectDamage(e,dmg,false,sk.color);e.slow=Math.max(e.slow||0,1.6)}const t=v39Nearest(480),a=t?Math.atan2(t.y-player.y,t.x-player.x):player.facing;for(let n=-3;n<=3;n++)createBullet(a+n*.12,{speed:590,range:340,pierce:2,damageMult:1},false,{damage:player.damage*(.33+lv*.055),r:3.6,shape:'arrow',weaponType:'skill',color:sk.color,pierce:2});
 }else v38CastSkill(id);
};

// Level-up now improves already collected skills, but fusion itself never appears as a generic level-up choice.
showLevelUp=function(){
 paused=true;const picks=[];
 const skillUps=runSkills.filter(Boolean).filter(id=>skillLevel(id)<5).map(id=>{const sk=skillDefs[id],cur=skillLevel(id);return{icon:sk.icon,name:`${sk.name} 강화`,desc:`스킬 Lv.${cur} → Lv.${cur+1} · 효과 증가 / 재사용 감소`,apply:()=>{runSkillLevels[id]=Math.min(5,skillLevel(id)+1);skillCooldowns[id]=Math.min(skillCooldowns[id]||0,skillCooldown(id))}}});
 if(skillUps.length)picks.push(pick(skillUps));
 const pool=[...upgrades,...skillUps.filter(x=>!picks.includes(x))];
 while(picks.length<3&&pool.length){const u=pick(pool);const ix=pool.indexOf(u);pool.splice(ix,1);picks.push(u)}
 $('upgradeList').innerHTML=picks.map((u,i)=>`<button class="upgrade" data-up="${i}"><div class="uicon">${u.icon}</div><div><strong>${u.name}</strong><span>${u.desc}</span></div></button>`).join('');
 document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{picks[+b.dataset.up].apply();paused=false;levelupScreen.classList.add('hidden');last=performance.now();updateHUD()});levelupScreen.classList.remove('hidden');
};

const v38RenderHome=renderHome;
renderHome=function(){
 v38RenderHome();
 $('stageHomeDesc').textContent='7:00 · 파괴 상자 · 무제한 자동 스킬 · 핵심 융합';
 $('homeSkills').innerHTML=`<div class="homeSkill"><span class="si">✨</span><small>스킬 시스템</small><b>획득 즉시 자동 적용</b></div><div class="homeSkill"><span class="si">∞</span><small>슬롯 제한</small><b>없음</b></div><div class="homeSkill"><span class="si">🔑</span><small>융합 조건</small><b>핵심 스킬 필요</b></div>`;
};
renderSkills=function(){
 const discovered=new Set(profile.skillsOwned||[]);
 $('skillSlots').innerHTML=Object.values(skillFusionDefs).map(f=>`<div class="skillSlot"><span class="icon">${f.icon}</span><small>${skillDefs[f.key].icon} 핵심 융합</small><b>${f.ingredients.map(x=>skillDefs[x].icon).join(' + ')} + ${skillDefs[f.key].icon}</b></div>`).join('');
 $('ownedSkillCount').textContent=`${discovered.size} / ${baseSkillIds.length+Object.keys(skillFusionDefs).length}개 발견`;
 $('skillInventory').innerHTML=[...baseSkillIds,...Object.keys(skillFusionDefs)].map(id=>{const sk=skillDefs[id],known=discovered.has(id),fusion=skillFusionDefs[id],key=sk.keySkill;let recipe='';if(fusion)recipe=`<br><b style="color:#f2d787">융합:</b> ${fusion.ingredients.map(x=>skillDefs[x].icon+' '+skillDefs[x].name).join(' + ')} + <b>${skillDefs[fusion.key].icon} ${skillDefs[fusion.key].name}</b>`;else{const refs=Object.values(skillFusionDefs).filter(f=>f.ingredients.includes(id)||f.key===id);if(refs.length)recipe='<br><b style="color:#f2d787">관련 융합:</b> '+refs.map(f=>f.icon+' '+f.name).join(' / ')}return `<div class="skillCard" style="opacity:${known?1:.58}"><div class="skillCardTop"><div class="skillIcon">${known?sk.icon:'❔'}</div><div><h3>${known?sk.name:'미발견 스킬'}${fusion?' · 융합':key?' · 핵심':''}</h3><p>${known?sk.desc:'상자를 파괴해 발견하세요.'}${recipe}</p></div></div></div>`}).join('');
};
const v38Reset=reset;
reset=function(){v38Reset();runSkills=[];runSkillLevels={};skillCooldowns={};updateSkillHUD()};
/* ===== END AUTO-SKILL / CORE FUSION ===== */

/* ===== WUXIA SECT / CAMPAIGN MODULE ===== */
const SECT_NAME='청운문';
const RIVAL_SECTS=[
 {name:'흑풍문',icon:'🌪️',master:'흑풍문주 독고람',style:'비도·경공',theme:0,roster:'swarm',accent:'#b4c88b',intro:'강호의 약탈로 세력을 넓힌 흑풍문이 청운문의 재건을 막아선다.'},
 {name:'적월방',icon:'🌙',master:'적월방주 혈연화',style:'암기·빙독',theme:1,roster:'ranged',accent:'#d97878',intro:'적월방은 상단과 표국을 장악해 청운문의 자금줄을 끊으려 한다.'},
 {name:'철산파',icon:'⛰️',master:'철산장문 악진',style:'외공·철포삼',theme:2,roster:'brute',accent:'#d69b63',intro:'철산파의 중갑 고수들이 영맥을 차지하며 정면 승부를 요구한다.'},
 {name:'독룡곡',icon:'🐍',master:'독룡곡주 사무진',style:'독공·기문',theme:3,roster:'arcane',accent:'#78bd78',intro:'독룡곡은 금지된 독공으로 주변 문파를 굴복시키며 청운문을 노린다.'},
 {name:'천마련',icon:'🔥',master:'천마련주 천무극',style:'마공·패도',theme:2,roster:'brute',accent:'#d85645',intro:'강호의 패권을 노리는 천마련과의 전면전이 시작된다.'}
];
const GROWTH_MISSIONS=[
 {title:'산문 수복',icon:'🏯',desc:'무너진 산문 주변의 무뢰배를 몰아내고 청운문의 첫 거점을 되찾는다.'},
 {title:'영맥 확보',icon:'⛰️',desc:'수련에 필요한 영맥을 확보하고 문파의 내공 수련 기반을 세운다.'},
 {title:'제자 규합',icon:'🥋',desc:'강호의 도전자들을 꺾고 청운문의 이름을 알려 새로운 제자를 모은다.'},
 {title:'비급 회수',icon:'📜',desc:'흩어진 청운문의 비급과 병장기를 회수해 다음 문파전에 대비한다.'}
];
function v40StageInfo(stage){
 const chapter=Math.floor((stage-1)/5)+1,step=(stage-1)%5+1,rival=RIVAL_SECTS[(chapter-1)%RIVAL_SECTS.length];
 if(step===5)return{stage,chapter,step,isSectBattle:true,rival,title:`${rival.icon} ${rival.name} 격파전`,desc:`${rival.intro} 총단으로 진입해 ${rival.master}을 쓰러뜨리고 강호의 세력을 넓히세요.`};
 const m=GROWTH_MISSIONS[step-1];
 return{stage,chapter,step,isSectBattle:false,rival,title:`${m.icon} ${m.title}`,desc:`제${chapter}장 · ${m.desc}`};
}
function v40SectRank(){const s=profile.highestStage||1;if(s<5)return'무명 문파';if(s<10)return'신흥 문파';if(s<15)return'삼류 문파';if(s<20)return'이류 문파';if(s<25)return'일류 문파';return'무림 맹주 후보'}
function v40EnsureProfile(){if(!Number.isFinite(profile.sectPrestige))profile.sectPrestige=Math.max(0,((profile.highestStage||1)-1)*25);if(typeof profile.shopRefreshPending!=='boolean')profile.shopRefreshPending=false;}
v40EnsureProfile();


MAP_GUIDES.swarm='🥋 외문 무사 · 🥷 경공 자객 · 🛡️ 철포삼 고수';
MAP_GUIDES.ranged='🎯 암기수 · 🛡️ 철포삼 고수 · 🥷 경공 자객';
MAP_GUIDES.brute='💥 패도 무사 · 🛡️ 철포삼 고수 · 🥷 경공 자객';
MAP_GUIDES.arcane='☯️ 기문 고수 · 🎯 암기수 · 💥 패도 무사';

// Rename equipment bases to wuxia gear.
const v40BaseNames={
 head:['청운 도건','야행 두건','도인의 관','철면'],
 chest:['호신 경갑','야행 장포','운문 도복','철갑 도포'],
 gloves:['검객 수갑','철사장 장갑','운문 수갑','매응 완갑'],
 legs:['유운 행전','철갑 각반','야행 행전','운문 각반'],
 boots:['답설화','유운화','금사화','철갑화'],
 accessory:['호심옥','매응옥패','흡기패','황금전표','회춘옥','질풍패','호신부','벽력패']
};
for(const [slot,names] of Object.entries(v40BaseNames))if(itemBases[slot])itemBases[slot].forEach((x,i)=>x.name=names[i]||x.name);
Object.assign(setDefs.shadow,{name:'흑영문 야행복',icon:'🌑'});Object.assign(setDefs.guardian,{name:'금강문 호신갑',icon:'🛡️'});Object.assign(setDefs.sage,{name:'태허문 도가복',icon:'☯️'});

const v39SelectMapTheme=selectMapTheme;
selectMapTheme=function(){
 const info=v40StageInfo(currentStage||profile.highestStage||1);
 if(info.isSectBattle){const base=MAP_THEMES[info.rival.theme%MAP_THEMES.length];currentMap={...base,name:`${info.rival.name} 총단`,tag:`문파전 · ${info.rival.style}`,accent:info.rival.accent,enemyTint:info.rival.accent,roster:info.rival.roster,spawn:Math.max(.92,base.spawn*.95)};lastMapId=`sect-${info.rival.name}`;return currentMap}
 const m=v39SelectMapTheme(),names={forest:['청죽림','경공·군집'],frost:['설봉고도','암기·한기'],ember:['적벽협곡','외공·돌진'],crypt:['고묘지궁','기문·변칙']};currentMap={...m,name:names[m.id][0],tag:names[m.id][1]};return currentMap;
};

const v39ResetWuxia=reset;
reset=function(){v39ResetWuxia();const info=v40StageInfo(currentStage);zoneBadge.textContent=info.isSectBattle?`${info.rival.icon} ${info.rival.name} 총단 · 문파전`:`${currentMap.icon} ${currentMap.name} · ${info.title}`;showToast(info.isSectBattle?`⚔️ 문파전 개시 · ${info.rival.master}을 격파하라!`:`📜 ${info.title} · 청운문의 세력을 넓혀라`)};

const v39SpawnBossWuxia=spawnBoss;
spawnBoss=function(){v39SpawnBossWuxia();const info=v40StageInfo(currentStage);if(info.isSectBattle){const e=[...enemies].reverse().find(x=>x.type==='boss');if(e){e.hp*=1.42;e.maxHp*=1.42;e.damage*=1.18;e.skillTimer=.8}showToast(`👑 ${info.rival.master} 등장! ${info.rival.name}의 절기를 돌파하세요.`)}};
const v39SpawnMidBossWuxia=spawnMidBoss;
spawnMidBoss=function(){v39SpawnMidBossWuxia();const info=v40StageInfo(currentStage);showToast(info.isSectBattle?`⚔️ ${info.rival.name} 수석 호법 등장!`:'⚔️ 강호 고수 등장!')};

const v39RenderHomeWuxia=renderHome;
renderHome=function(){
 v40EnsureProfile();v39RenderHomeWuxia();const st=profile.highestStage||1,info=v40StageInfo(st),rank=v40SectRank();
 $('profileLevel').textContent=profile.soulLevel;$('stageHomeTitle').textContent=info.isSectBattle?`STAGE ${st} · ${info.rival.icon} ${info.rival.name} 문파전`:`STAGE ${st} · ${info.title}`;
 $('stageHomeDesc').textContent=info.isSectBattle?'7:00 · 경쟁 문파 총단 · 강화 장문인':'7:00 · 문파 성장 원정 · 상자/무공/보스';
 $('startBtn').textContent=info.isSectBattle?`${info.rival.name} 총단 공격`:`스테이지 ${st} 출전`;
 const story=$('sectStory');if(story){story.classList.toggle('sectWar',info.isSectBattle);$('sectRank').textContent=rank;$('sectPrestige').textContent=profile.sectPrestige||0;$('sectStoryText').innerHTML=info.isSectBattle?`<b>${info.rival.name}</b>과의 결전입니다. ${info.desc}`:`${info.desc}<br><b>다음 문파전:</b> STAGE ${Math.ceil(st/5)*5} · ${info.rival.name}`;}
};

const v39FinishRunWuxia=finishRun;
finishRun=function(cleared=false){
 const info=v40StageInfo(currentStage);if(cleared){v40EnsureProfile();const fame=info.isSectBattle?120+info.chapter*25:24+currentStage*3;profile.sectPrestige+=fame;profile.shopRefreshPending=true;profile.shopStock=[];profile.shopRefreshes=0;if(info.isSectBattle)runGold+=90+info.chapter*20;}
 v39FinishRunWuxia(cleared);
 if(cleared){$('resultEyebrow').textContent=info.isSectBattle?'SECT VICTORY':'SECT GROWTH';$('resultTitle').textContent=info.isSectBattle?`🏯 ${info.rival.name} 격파!`:`☯️ ${SECT_NAME} 세력 확장`;$('resultMessage').textContent=info.isSectBattle?`${info.rival.master}을 쓰러뜨렸습니다. ${SECT_NAME}의 문파 명성이 크게 올라 새로운 강호 지역이 열렸습니다. 상단에 들어가면 새 물품이 입고됩니다.`:`${info.title}을 완료했습니다. 문파 명성이 상승했고 다음 원정이 열렸습니다. 상단에 들어가면 이번 스테이지에 맞춘 새 물품이 입고됩니다.`;}
};

const v39OpenShopWuxia=openShop;
openShop=function(from='home'){
 v40EnsureProfile();let refreshed=false;if(profile.shopRefreshPending){profile.shopStock=[];profile.shopRefreshes=0;createShopStock();profile.shopRefreshPending=false;profile.shopLastRefreshStage=Math.max(1,(profile.highestStage||1)-1);saveProfile();refreshed=true}
 v39OpenShopWuxia(from);if(refreshed)setTimeout(()=>showToast('🏮 새 스테이지 전리품이 강호 상단에 입고되었습니다.'),60);
};

const v39CreateShopStockWuxia=createShopStock;
createShopStock=function(){v39CreateShopStockWuxia();const stage=Math.max(1,profile.highestStage||1);for(const o of profile.shopStock||[])if(o.item&&stage%5===1&&Math.random()<.18)o.price=Math.max(20,Math.round(o.price*.9));saveProfile()};


// Wuxia canvas presentation: robed disciple, human martial enemies and jianghu landmarks.
drawPlayer=function(){
 const bob=Math.sin(elapsed*7)*1.1,accent=runEvolution?(evolutionDefs[runEvolution]?.color||'#d7bd78'):'#9fc59a',move=Math.hypot(input.x,input.y)>.08;ctx.save();ctx.translate(player.x,player.y+bob);
 ctx.fillStyle='rgba(0,0,0,.30)';ctx.beginPath();ctx.ellipse(0,17,17,5.5,0,0,Math.PI*2);ctx.fill();
 if(player.shield>0){ctx.strokeStyle='rgba(214,197,137,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.stroke()}
 ctx.save();ctx.rotate((player.facing||0)+Math.PI);ctx.fillStyle='#202018';ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(-14,18+(move?2:0));ctx.lineTo(-3,14);ctx.lineTo(0,8);ctx.lineTo(3,14);ctx.lineTo(14,18-(move?2:0));ctx.lineTo(8,2);ctx.closePath();ctx.fill();ctx.restore();
 ctx.fillStyle='#4f6b52';ctx.strokeStyle='#171812';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-10,11);ctx.lineTo(-9,-7);ctx.lineTo(-5,-12);ctx.lineTo(5,-12);ctx.lineTo(9,-7);ctx.lineTo(10,11);ctx.lineTo(5,16);ctx.lineTo(-5,16);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#d4b06f';ctx.fillRect(-10,4,20,3);ctx.fillStyle='#c99772';ctx.beginPath();ctx.arc(0,-14,6.5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#17150f';ctx.beginPath();ctx.arc(0,-18,6.8,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-2,-24,4,6);ctx.beginPath();ctx.arc(0,-25,3,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=accent;ctx.globalAlpha=.55;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,21+Math.sin(elapsed*4)*1.2,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;drawPlayerWeapon(player.weaponType,player.facing||0);ctx.restore();
};
drawEnemy=function(e){
 const info=ENEMY_INFO[e.type]||{},pal={basic:['#8c5d4f','#3a2823'],fast:['#5f6e62','#242b27'],tank:['#707277','#303236'],ranged:['#8d7758','#302a22'],charger:['#9c4f43','#3a211d'],elite:['#72536f','#2b202a'],midboss:['#a67948','#38291d'],boss:['#b04437','#321814']},[col,dark]=pal[e.type]||pal.basic,bob=Math.sin(elapsed*5+e.phase)*.8;ctx.save();ctx.translate(e.x,e.y+bob);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,e.r*.72,e.r*.72,e.r*.22,0,0,Math.PI*2);ctx.fill();
 const bodyW=e.r*(e.type==='tank'?1.25:.9),bodyH=e.r*1.15;ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-bodyW*.55,-e.r*.25);ctx.lineTo(-bodyW*.7,bodyH*.72);ctx.lineTo(0,bodyH*.52);ctx.lineTo(bodyW*.7,bodyH*.72);ctx.lineTo(bodyW*.55,-e.r*.25);ctx.closePath();ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-bodyW*.48,-e.r*.28);ctx.lineTo(-bodyW*.42,bodyH*.5);ctx.lineTo(bodyW*.42,bodyH*.5);ctx.lineTo(bodyW*.48,-e.r*.28);ctx.closePath();ctx.fill();
 ctx.fillStyle='#c99b73';ctx.beginPath();ctx.arc(0,-e.r*.62,e.r*.30,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17130f';ctx.beginPath();ctx.arc(0,-e.r*.72,e.r*.32,Math.PI,Math.PI*2);ctx.fill();
 if(e.type==='ranged'){ctx.strokeStyle='#d3bd82';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.r*.46,-e.r*.05,e.r*.42,-Math.PI/2,Math.PI/2);ctx.stroke()}
 if(e.type==='fast'){ctx.fillStyle='#20241f';ctx.fillRect(-e.r*.7,-e.r*.78,e.r*1.4,e.r*.12)}
 if(e.type==='tank'){ctx.strokeStyle='#b7a16f';ctx.lineWidth=3;ctx.strokeRect(-bodyW*.5,-e.r*.22,bodyW,e.r*.85)}
 if(e.type==='charger'){ctx.strokeStyle='#e1aa74';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-e.r*.72,-e.r*.18);ctx.lineTo(e.r*.72,e.r*.42);ctx.stroke()}
 if(['elite','midboss','boss'].includes(e.type)){ctx.strokeStyle=e.type==='boss'?'#e7c26e':'#c8a778';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-e.r*.1,e.r*.9,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d6b66f';ctx.fillRect(-e.r*.25,-e.r*.98,e.r*.5,e.r*.12)}
 ctx.restore();if(['fast','tank','ranged','charger'].includes(e.type)){ctx.save();ctx.font='700 8px system-ui';ctx.textAlign='center';ctx.fillStyle='rgba(244,239,226,.92)';ctx.fillText({fast:'경',tank:'철',ranged:'암',charger:'패'}[e.type],e.x,e.y-e.r-6);ctx.restore()}if(['boss','midboss','elite'].includes(e.type)){const w=e.r*2.2;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(e.x-w/2,e.y-e.r-14,w,4);ctx.fillStyle=col;ctx.fillRect(e.x-w/2,e.y-e.r-14,w*Math.max(0,e.hp/e.maxHp),4)}
};
drawLandmark=function(l){if(l.x+l.r*2<camera.x-70||l.x-l.r*2>camera.x+W+70||l.y+l.r*2<camera.y-70||l.y-l.r*2>camera.y+H+70)return;const map=currentMap||MAP_THEMES[0];ctx.save();ctx.translate(l.x,l.y);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,l.r*.58,l.r*.85,l.r*.22,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=map.accent+'88';ctx.fillStyle=map.accent+'22';ctx.lineWidth=3;if(l.kind==='gate'){ctx.strokeStyle='#8d633f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-l.r*.7,l.r*.7);ctx.lineTo(-l.r*.7,-l.r*.45);ctx.moveTo(l.r*.7,l.r*.7);ctx.lineTo(l.r*.7,-l.r*.45);ctx.moveTo(-l.r*.9,-l.r*.42);ctx.lineTo(l.r*.9,-l.r*.42);ctx.stroke();ctx.strokeStyle='#c6a15b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-l.r*.76,-l.r*.6);ctx.lineTo(0,-l.r*.82);ctx.lineTo(l.r*.76,-l.r*.6);ctx.stroke()}else if(l.kind==='tree'){ctx.strokeStyle='#47634a';ctx.lineWidth=4;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*7,l.r*.72);ctx.lineTo(i*5,-l.r*.72);ctx.stroke();ctx.fillStyle='#75906b55';ctx.beginPath();ctx.ellipse(i*5-5,-l.r*.5,8,18,-.4,0,Math.PI*2);ctx.fill()}}else if(l.kind==='forge'){ctx.fillStyle='#5b4632';ctx.fillRect(-l.r*.5,0,l.r,l.r*.45);ctx.fillStyle='#d86d49';ctx.beginPath();ctx.arc(0,-4,l.r*.28,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle='#68675c';ctx.fillRect(-7,-l.r*.7,14,l.r*1.35);ctx.strokeStyle=map.accent+'88';ctx.strokeRect(-7,-l.r*.7,14,l.r*1.35);ctx.fillStyle='#cbb57a';ctx.font=`700 ${Math.max(10,l.r*.3)}px serif`;ctx.textAlign='center';ctx.fillText(l.kind==='crystal'?'武':'道',0,3)}ctx.restore()};

// UI copy and wuxia ambience.
$('weaponBadge').innerHTML='<span id="weaponIcon">⚔️</span> <b id="weaponName">청강검</b> · 🎒 <span id="lootCount">0</span>';
$('shopBuyTab').textContent='구매';$('shopSellTab').textContent='판매';
document.querySelector('#shopScreen .shopHint').innerHTML='원정에서 모은 <b>문파 자금</b>으로 병장기와 방어구를 거래합니다. <b>스테이지 클리어 후 처음 입장할 때마다 상품이 자동 갱신</b>되며, 추가 자금을 내고 리로드할 수도 있습니다. 무공은 전투 중 상자와 강적의 전리품에서만 습득합니다.';
document.querySelector('#skillScreen .subtitle').innerHTML='원정 시작 시 무공은 0개입니다. 상자와 강적의 전리품에서 얻은 모든 무공은 자동으로 펼쳐집니다. 두 무공만 모아서는 절정 무공이 되지 않으며, 조합마다 지정된 <b>핵심 심법·기물</b>을 함께 얻어야 합일됩니다.';
/* ===== END WUXIA SECT / CAMPAIGN ===== */

/* ===== ECONOMY BALANCE MODULE ===== */
// Goal: stage gold should feel scarce enough to make shop choices meaningful.
const ECONOMY_V41={
  refreshBase:50,
  refreshStep:35,
  clearBase:22,
  clearStageStep:3,
  sectBase:48,
  sectChapterStep:10,
  coinChance:{basic:.045,fast:.04,tank:.09,ranged:.055,charger:.075,elite:.28,midboss:0,boss:0},
  coinValue:{basic:[1,3],fast:[1,3],tank:[2,5],ranged:[1,4],charger:[2,5],elite:[5,10]}
};

// One-time normalization for saves created before the new economy.
// Excess legacy gold is capped so the rebalanced shop has value immediately.
if(!profile.economyV41Applied){
  const legacyCeiling=450+Math.max(0,(profile.highestStage||1)-1)*35;
  if(profile.gold>legacyCeiling)profile.gold=legacyCeiling;
  profile.economyV41Applied=true;
  saveProfile();
}

// Shop prices are intentionally higher than a single normal-stage income.
shopItemPrice=function(item){
  const base={common:75,rare:145,epic:275,legendary:500,mythic:880}[item.rarity]||75;
  const levelPart=Math.max(0,(item.level||1)-1)*12;
  const scorePart=Math.round((item.score||0)*.58);
  return Math.max(70,Math.round(base+levelPart+scorePart));
};
sellItemPrice=function(item){return Math.max(8,Math.round(shopItemPrice(item)*.24))};

// Re-roll should be a real spending decision, because stock is already refreshed after each cleared stage.
const v41RenderShopBase=renderShop;
renderShop=function(){
  v41RenderShopBase();
  const cost=ECONOMY_V41.refreshBase+(profile.shopRefreshes||0)*ECONOMY_V41.refreshStep;
  $('shopRefreshBtn').textContent=`🔄 물품 리로드 · 🪙 ${cost}`;
  $('shopRefreshBtn').disabled=profile.gold<cost;
};
refreshShop=function(){
  const cost=ECONOMY_V41.refreshBase+(profile.shopRefreshes||0)*ECONOMY_V41.refreshStep;
  if(profile.gold<cost){showToast('🪙 문파 자금이 부족합니다.');return}
  profile.gold-=cost;
  profile.shopRefreshes=(profile.shopRefreshes||0)+1;
  createShopStock();
  renderShop();renderHome();
  showToast(`🔄 ${cost} 문파 자금을 사용해 물품을 갱신했습니다.`);
};

// Normal enemies no longer guarantee currency. Stronger enemies have a somewhat higher chance.
killEnemy=function(e){
  kills++;
  addGem(e.x,e.y,e.xp);
  const chance=ECONOMY_V41.coinChance[e.type]||0;
  if(chance>0&&Math.random()<chance){
    const range=ECONOMY_V41.coinValue[e.type]||[1,3];
    const stageBonus=Math.floor(Math.max(0,currentStage-1)/5);
    addCoin(e.x+rand(-5,5),e.y+rand(-5,5),Math.floor(rand(range[0],range[1]+1))+stageBonus);
  }
  burst(e.x,e.y,(e.type==='boss'||e.type==='midboss')?20:7,(e.type==='boss'||e.type==='midboss')?'#ffb149':'#ff6479');
  if(e.type==='midboss'){
    midBossDefeated=true;bossesDefeated++;spawnRewardChest(e.x,e.y,2);
    showToast('⚔️ 중간 보스 처치! 보상 상자를 부수세요.');
  }else if(e.type==='boss'){
    bossesDefeated++;finalBossDefeated=true;bossLootGraceUntil=elapsed+12;
    spawnRewardChest(e.x-22,e.y,3);spawnRewardChest(e.x+22,e.y,2);
    showToast('👑 최종 보스 처치! 12초 안에 보상 상자를 확보하세요.');
  }else if(e.type==='elite'){
    if(Math.random()<.55)spawnRewardChest(e.x,e.y,1);
    if(Math.random()<.08)dropPotion(e.x+rand(-8,8),e.y+rand(-8,8),true);
  }else{
    const potionChance=e.type==='tank'?.045:.027;
    if(Math.random()<potionChance)dropPotion(e.x+rand(-8,8),e.y+rand(-8,8),false);
  }
};

// Crates still matter, but even normal crates do not always contain currency.
breakChest=function(c){
  if(c.broken)return;c.broken=true;c.hp=0;
  const tier=c.tier||0,glow=tier>=2?'#ffd164':currentMap.accent;
  burst(c.x,c.y,16+tier*5,glow);
  const goldChance=[.36,.66,.90,1][Math.min(3,tier)];
  const goldRanges=[[3,8],[8,16],[15,28],[26,44]];
  if(Math.random()<goldChance){
    const [g0,g1]=goldRanges[Math.min(3,tier)],gold=Math.floor(rand(g0,g1+1));
    const pieces=Math.min(3,1+tier);
    for(let n=0;n<pieces;n++)addCoin(c.x+rand(-12,12),c.y+rand(-12,12),Math.max(1,Math.round(gold/pieces)));
  }
  const gearChance=tier>=2?1:tier===1?.68:.34,
        skillChance=tier>=3?1:tier===2?.72:tier===1?.42:.18,
        potionChance=tier>=2?.58:tier===1?.38:.24;
  if(Math.random()<gearChance)dropLoot(c.x+rand(-10,10),c.y-8,tier>=1);
  if(Math.random()<potionChance)dropPotion(c.x+rand(-12,12),c.y+10,tier>=2);
  if(Math.random()<skillChance)acquireSkillFromChest(tier>=2);
  showToast(tier?'📦 보상 상자 파괴 · 전리품 획득':'🪵 보급 상자 파괴 · 랜덤 전리품');
  if(navigator.vibrate)navigator.vibrate([16,18,24]);
};

// Remove the old kills × 2 + survival-time gold fountain from the result calculation.
const v41FinishRunBase=finishRun;
finishRun=function(cleared=false){
  if(!running)return;
  const info=v40StageInfo(currentStage);
  const collectedBefore=runGold;
  const oldSectBonus=cleared&&info.isSectBattle?(90+info.chapter*20):0;
  const oldSynthetic=Math.round((kills*2+Math.floor(Math.min(elapsed,STAGE_DURATION)/5)+bossesDefeated*28+(cleared?45+currentStage*12:0))*(1+player.goldBonus/100));
  const desiredBonus=cleared?(info.isSectBattle?(ECONOMY_V41.sectBase+info.chapter*ECONOMY_V41.sectChapterStep):(ECONOMY_V41.clearBase+currentStage*ECONOMY_V41.clearStageStep)):0;
  v41FinishRunBase(cleared);
  const removeAmount=oldSectBonus+oldSynthetic-desiredBonus;
  if(removeAmount>0){
    profile.gold=Math.max(0,profile.gold-removeAmount);
    runGold=Math.max(0,runGold-removeAmount);
    $('finalGold').textContent=runGold;
    saveProfile();renderHome();
  }
};

// Full combat bag / inventory overflow should not become a secondary money farm.
const v41AcquireRunItemBase=acquireRunItem;
acquireRunItem=function(item){
  if(runLoot.length>=18){runGold+=5;showToast('🎒 전투 가방이 가득 차 장비를 5 문파 자금으로 정리했습니다.');return}
  return v41AcquireRunItemBase(item);
};
addItemToInventory=function(item){
  profile.inventory.push(item);
  if(profile.inventory.length>MAX_INVENTORY){
    const eq=equippedIds(),sellable=profile.inventory.filter(i=>!eq.has(i.id)).sort((a,b)=>a.score-b.score);
    if(sellable.length){
      const rem=sellable[0];
      profile.inventory=profile.inventory.filter(i=>i.id!==rem.id);
      profile.gold+=Math.max(3,Math.round(sellItemPrice(rem)*.5));
    }
  }
};

const shopHintV41=document.querySelector('#shopScreen .shopHint');
if(shopHintV41)shopHintV41.innerHTML='원정에서 드물게 얻는 <b>문파 자금</b>으로 병장기와 방어구를 거래합니다. 일반 무사는 금화를 항상 떨어뜨리지 않으며, 강적·상자·스테이지 보상이 주요 수입원입니다. <b>스테이지 클리어 후 첫 입장 시 상품은 무료로 자동 갱신</b>되고, 추가 리로드는 비교적 큰 비용이 필요합니다.';
/* ===== END ECONOMY BALANCE ===== */





/* ===== SAFARI STARTUP RECOVERY / DIAGNOSTICS MODULE ===== */
const V412_BACKUP_KEY='soulSurvivorProfileV5_backup_412';
let v412LastFatal=null;
function v412Num(v,f=0){v=Number(v);return Number.isFinite(v)?v:f}
function v412SafeProfile(){
  try{
    if(!profile||typeof profile!=='object')profile=freshProfile();
    try{if(!localStorage.getItem(V412_BACKUP_KEY))localStorage.setItem(V412_BACKUP_KEY,JSON.stringify(profile))}catch(_){}
    const validSlots=new Set(['weapon','head','chest','gloves','legs','boots','accessory']);
    const validRarity=new Set(Object.keys(rarityInfo));
    const allowedStats=new Set(['damage','maxHp','fireRatePct','movePct','crit','damageReduction','magnet','goldBonus','regen','bulletSize']);
    profile.inventory=Array.isArray(profile.inventory)?profile.inventory.filter(Boolean):[];
    profile.inventory=profile.inventory.map((i,idx)=>{
      if(!i||typeof i!=='object')return null;
      if(!validSlots.has(i.slot))return null;
      i.id=i.id||('repair_'+Date.now()+'_'+idx+'_'+Math.random().toString(36).slice(2));
      i.rarity=validRarity.has(i.rarity)?i.rarity:'common';
      i.level=Math.max(1,Math.floor(v412Num(i.level,1)));
      i.stats=(i.stats&&typeof i.stats==='object')?i.stats:{};
      const clean={};for(const [k,v] of Object.entries(i.stats)){if(allowedStats.has(k)&&Number.isFinite(Number(v)))clean[k]=Number(v)}i.stats=clean;
      i.affixes=Array.isArray(i.affixes)?i.affixes.filter(a=>a&&typeof a==='object'):[];
      if(i.slot==='weapon'&&!weaponDefs[i.weaponType])i.weaponType='sword';
      if(i.setId&&!setDefs[i.setId])i.setId=null;
      i.name=String(i.name||'이름 없는 장비');i.icon=String(i.icon||'▫️');
      try{i.score=calcItemScore(i)}catch(_){i.score=Math.max(1,Math.round(v412Num(i.score,1)))}
      return i;
    }).filter(Boolean);
    profile.equipped=(profile.equipped&&typeof profile.equipped==='object')?profile.equipped:{};
    const slotKeys=['weapon','head','chest','gloves','legs','boots','accessory1','accessory2','accessory3'];
    const ids=new Set(profile.inventory.map(i=>i.id));
    for(const slot of slotKeys){if(!ids.has(profile.equipped[slot]))profile.equipped[slot]=null}
    let weapon=profile.inventory.find(i=>i.id===profile.equipped.weapon&&i.slot==='weapon');
    if(!weapon){
      weapon=profile.inventory.filter(i=>i.slot==='weapon').sort((a,b)=>(b.score||0)-(a.score||0))[0];
      if(!weapon){weapon=starterItem('weapon','수련용 청강검','⚔️',{damage:4},'sword');profile.inventory.unshift(weapon)}
      profile.equipped.weapon=weapon.id;
    }
    for(const s of ['head','chest','gloves','legs','boots']){
      const cur=profile.inventory.find(i=>i.id===profile.equipped[s]);
      if(cur&&cur.slot!==s)profile.equipped[s]=null;
    }
    for(const s of ['accessory1','accessory2','accessory3']){
      const cur=profile.inventory.find(i=>i.id===profile.equipped[s]);
      if(cur&&cur.slot!=='accessory')profile.equipped[s]=null;
    }
    profile.gold=Math.max(0,Math.floor(v412Num(profile.gold,0)));
    profile.soulXp=Math.max(0,v412Num(profile.soulXp,0));
    profile.soulLevel=Math.max(1,Math.floor(v412Num(profile.soulLevel,1)));
    profile.highestStage=Math.max(1,Math.floor(v412Num(profile.highestStage,1)));
    profile.sectPrestige=Math.max(0,Math.floor(v412Num(profile.sectPrestige,0)));
    profile.skillsOwned=Array.isArray(profile.skillsOwned)?[...new Set(profile.skillsOwned.filter(id=>skillDefs[id]))]:[];
    profile.equippedSkills=[null,null,null];
    profile.shopStock=Array.isArray(profile.shopStock)?profile.shopStock.filter(o=>o&&o.type==='item'&&o.item):[];
    profile.shopRefreshes=Math.max(0,Math.floor(v412Num(profile.shopRefreshes,0)));
    saveProfile();return true;
  }catch(err){console.error('Profile repair failed',err);return false}
}
function v412Fatal(err,phase='RUNTIME'){
  if(v412LastFatal&&v412LastFatal===err)return;
  v412LastFatal=err;
  const msg=(err&&err.message)||String(err||'Unknown error');
  const stack=(err&&err.stack)||'';
  console.error('[MURIM '+phase+']',err);
  running=false;paused=false;
  try{hud.classList.add('hidden');joystick.classList.add('hidden');miniMap.classList.add('hidden');weaponBadge.classList.add('hidden');zoneBadge.classList.add('hidden');enemyGuide.classList.add('hidden');waveBadge.classList.add('hidden')}catch(_){}
  let box=document.getElementById('fatalError412');
  if(!box){box=document.createElement('div');box.id='fatalError412';box.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,10,12,.96);color:#f6efe0;padding:24px 18px;overflow:auto;font:14px/1.55 system-ui,-apple-system,sans-serif';document.body.appendChild(box)}
  const safe=(t)=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  box.innerHTML='<div style="max-width:620px;margin:20px auto;background:#191711;border:1px solid #6a5734;border-radius:18px;padding:18px"><div style="font-size:12px;color:#d9b86e;font-weight:800">v4.1.5 · '+safe(phase)+'</div><h2 style="margin:6px 0 10px">⚠️ 실행 오류 상세 정보</h2><div style="background:#0d0d0b;border-radius:10px;padding:12px;word-break:break-word"><b>'+safe(msg)+'</b></div><pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;color:#bdb7aa;background:#10100d;padding:10px;border-radius:10px;max-height:180px;overflow:auto">'+safe(stack.slice(0,1800))+'</pre><p style="font-size:12px;color:#aaa394">아래 버튼은 현재 저장 데이터를 별도 백업한 뒤 장비 데이터를 정리하여 다시 시작합니다. 진행 스테이지·문파 명성·금화는 유지합니다.</p><button id="fatalRepair412" style="width:100%;border:0;border-radius:12px;padding:13px;background:#d3ad5d;color:#18130b;font-weight:900">저장 데이터 복구 후 다시 시작</button><button id="fatalClose412" style="width:100%;margin-top:8px;border:1px solid #4c4638;border-radius:12px;padding:12px;background:#27231a;color:#eee6d5;font-weight:800">메인 화면으로</button></div>';
  document.getElementById('fatalRepair412').onclick=()=>{v412LastFatal=null;box.remove();v412SafeProfile();try{renderHome();startScreen.classList.remove('hidden')}catch(_){};setTimeout(()=>{try{start()}catch(e){v412Fatal(e,'RETRY_START')}},60)};
  document.getElementById('fatalClose412').onclick=()=>{box.remove();try{renderHome();startScreen.classList.remove('hidden')}catch(_){location.reload()}};
}
v412SafeProfile();
const v412StartBase=start;
start=function(){try{v412SafeProfile();return v412StartBase()}catch(err){v412Fatal(err,'START')}};
const v412LoopBase=loop;
loop=function(now){try{return v412LoopBase(now)}catch(err){v412Fatal(err,'FRAME')}};
window.addEventListener('unhandledrejection',e=>{v412Fatal(e.reason||new Error('Unhandled promise rejection'),'PROMISE')});
/* ===== END SAFARI RECOVERY / DIAGNOSTICS ===== */

/* ===== WEAPON-ONLY START / SAVE MIGRATION MODULE ===== */
function v414ApplyWeaponOnlyStart(){
  try{
    if(!profile||typeof profile!=='object')return;
    const legacyStarterNames=new Set(['수습 투구','수습 갑옷','수습 장갑','수습 바지','수습 장화','낡은 부적']);
    if(!profile.starterLoadoutV414){
      const removedIds=new Set((profile.inventory||[]).filter(i=>i&&legacyStarterNames.has(i.name)).map(i=>i.id));
      if(removedIds.size){
        profile.inventory=(profile.inventory||[]).filter(i=>!removedIds.has(i.id));
        for(const slot of ['head','chest','gloves','legs','boots','accessory1','accessory2','accessory3']){
          if(removedIds.has(profile.equipped&&profile.equipped[slot]))profile.equipped[slot]=null;
        }
      }
      profile.starterLoadoutV414=true;
    }
    profile.equipped=profile.equipped||{};
    for(const slot of ['head','chest','gloves','legs','boots','accessory1','accessory2','accessory3']){
      if(!(slot in profile.equipped))profile.equipped[slot]=null;
    }
    let weapon=(profile.inventory||[]).find(i=>i&&i.id===profile.equipped.weapon&&i.slot==='weapon');
    if(!weapon){
      weapon=(profile.inventory||[]).find(i=>i&&i.slot==='weapon');
      if(!weapon){weapon=starterItem('weapon','수련용 청강검','⚔️',{damage:4},'sword');profile.inventory.unshift(weapon)}
      profile.equipped.weapon=weapon.id;
    }
    if(weapon.name==='훈련용 장검')weapon.name='수련용 청강검';
    profile.version=Math.max(6,Number(profile.version)||0);
    saveProfile();
  }catch(err){console.warn('v4.1.4 starter cleanup failed',err)}
}
v414ApplyWeaponOnlyStart();
/* ===== END WEAPON-ONLY START ===== */

/* ===== MOBILE COMBAT SCALE / LOOT COMPARE MODULE ===== */
// 플레이어가 일반 적보다 과도하게 크게 보이지 않도록 시각 크기와 충돌 반경을 함께 축소합니다.
const v415ResetBase=reset;
reset=function(){
  v415ResetBase();
  if(player){
    player.r=10.5;
    player.bulletSize=(weaponDefs[player.weaponType]||weaponDefs.sword).size+(aggregateStats().bulletSize||0);
  }
};

// 기존 v3.8의 0.78배 렌더 스케일 위에 추가 축소를 적용하여 최종 약 0.64배 크기로 보입니다.
const v415DrawPlayerBase=drawPlayer;
drawPlayer=function(){
  if(!player)return;
  ctx.save();
  ctx.translate(player.x,player.y);
  ctx.scale(.82,.82);
  ctx.translate(-player.x,-player.y);
  v415DrawPlayerBase();
  ctx.restore();
};


// 근접 무기는 단순 수치뿐 아니라 실제 판정 반경도 축소합니다.
hitSword=function(angle,wd,crit){
  const evo=runEvolution==='infernoBlade',dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1),arc=evo?.72:.58,r=wd.range*(evo?1.16:1);
  attackEffects.push({type:'slash',x:player.x,y:player.y,angle,r,life:.22,max:.22,color:evo?'#ff9b62':(crit?'#ffd164':'#aef3dc')});
  if(evo)attackEffects.push({type:'slash',x:player.x,y:player.y,angle:angle+.18,r:r*.8,life:.26,max:.26,color:'#ffd06a'});
  for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);if(d<=r+e.r&&Math.abs(angleDiff(Math.atan2(dy,dx),angle))<=arc)dealDirectDamage(e,dmg,crit,evo?'#ff9b62':'#aef3dc')}
};
hitHammer=function(angle,wd,crit){
  const evo=runEvolution==='aegisMaul',offset=evo?48:42,cx=player.x+Math.cos(angle)*offset,cy=player.y+Math.sin(angle)*offset,r=evo?74:54,dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1);
  attackEffects.push({type:'slam',x:cx,y:cy,r,life:.31,max:.31,color:evo?'#8df2d2':(crit?'#ffd164':'#f5c77c')});
  for(const e of enemies)if(Math.hypot(e.x-cx,e.y-cy)<=r+e.r)dealDirectDamage(e,dmg,crit,evo?'#8df2d2':'#f5c77c');
  if(evo)player.shield=Math.min(player.maxHp*.55,(player.shield||0)+5+player.maxHp*.018)
};
hitSpear=function(angle,wd,crit){
  const evo=runEvolution==='soulLance',angles=evo?[angle-.13,angle,angle+.13]:[angle],dmg=player.damage*wd.damageMult*(evo?1.12:1)*(crit?1.8:1);
  for(const a of angles){const r=wd.range*(evo?1.14:1),x2=player.x+Math.cos(a)*r,y2=player.y+Math.sin(a)*r;attackEffects.push({type:'thrust',x:player.x,y:player.y,x2,y2,angle:a,life:.18,max:.18,color:evo?'#c9a7ff':(crit?'#ffd164':'#bde9ff')});for(const e of enemies)if(pointSegDistance(e.x,e.y,player.x,player.y,x2,y2)<=e.r+(evo?14:10))dealDirectDamage(e,dmg,crit,evo?'#c9a7ff':'#bde9ff')}
};

function v415ItemStatRows(newItem,currentItem){
  const keys=[...new Set([...Object.keys((currentItem&&currentItem.stats)||{}),...Object.keys(newItem.stats||{})])];
  return keys.map(k=>{const nv=Number((newItem.stats||{})[k]||0),cv=Number((currentItem&&currentItem.stats||{})[k]||0),diff=nv-cv,[label]=statLabel(k,nv),better=diff>0,worse=diff<0;return `<div class="detailStat"><span>${label}</span><b>${cv?round(cv,1):0} → ${round(nv,1)} <em style="font-style:normal;color:${better?'#72efc1':worse?'#ff8292':'#aaa796'}">(${diff>0?'+':''}${round(diff,1)})</em></b></div>`}).join('');
}
function v415EnhanceLootComparison(item){
  if(!item||!itemModalResume)return;
  const box=$('itemDetail')&&$('itemDetail').querySelector('.compareBox');
  if(!box)return;
  if(item.slot==='accessory'){
    const slots=['accessory1','accessory2','accessory3'];
    box.style.gridTemplateColumns='1fr';
    box.innerHTML=`<div class="compareCell" style="grid-column:1/-1;text-align:left"><small style="color:#8e99b7">장신구 슬롯별 비교</small>${slots.map(s=>{const cur=equippedItem(s),d=item.score-(cur?.score||0);return `<div style="display:flex;justify-content:space-between;gap:8px;margin-top:7px"><span>${equipSlots[s].name} · ${cur?escapeHtml(cur.name):'비어 있음'}</span><b style="color:${d>=0?'#72efc1':'#ff8292'}">${cur?'⚡'+cur.score:'없음'} → ${d>=0?'+':''}${d}</b></div>`}).join('')}</div>`;
  }else{
    const cur=equippedItem(item.slot),delta=item.score-(cur?.score||0);
    box.innerHTML=`<div class="compareCell"><small>${equipSlots[item.slot].name} · 현재</small><b>${cur?`${cur.icon} ${escapeHtml(cur.name)}`:'비어 있음'}</b><span style="display:block;margin-top:4px;color:#aab2c7">${cur?'⚡ '+cur.score:'전투력 없음'}</span></div><div class="compareCell"><small>새 장비</small><b>${item.icon} ${escapeHtml(item.name)}</b><span style="display:block;margin-top:4px;color:${delta>=0?'#72efc1':'#ff8292'}">⚡ ${item.score} · ${delta>=0?'+':''}${delta}</span></div>`;
    const statCompare=document.createElement('div');
    statCompare.className='detailStats';
    statCompare.style.marginTop='8px';
    statCompare.innerHTML=v415ItemStatRows(item,cur);
    box.insertAdjacentElement('afterend',statCompare);
  }
  const equipBtn=$('modalEquipBtn');if(equipBtn&&!equipBtn.disabled)equipBtn.textContent='장착하고 계속';
  const closeBtn=$('modalCloseBtn');if(closeBtn)closeBtn.textContent='보관하고 계속';
}
const v415AcquireRunItemBase=acquireRunItem;
acquireRunItem=function(item){const result=v415AcquireRunItemBase(item);v415EnhanceLootComparison(item);return result};
/* ===== END MOBILE COMBAT SCALE / LOOT COMPARE ===== */

/* ===== MODERN WUXIA GRAPHICS MODULE ===== */
// Visual direction: restrained ink-wash atmosphere, jade / cinnabar / bronze accents,
// high combat readability and distinct martial silhouettes. No external image assets are required.
const V420_THEME={
 forest:{ground:'#172019',sky1:'#1a261e',sky2:'#0b0f0c',accent:'#94b58d',road:'rgba(104,102,72,.38)',deco:'rgba(131,154,105,.30)',patch:['rgba(66,86,58,.26)','rgba(51,70,52,.25)','rgba(86,77,52,.20)','rgba(48,63,50,.26)']},
 frost:{ground:'#1a2022',sky1:'#263034',sky2:'#0c1012',accent:'#b8d0cf',road:'rgba(124,130,123,.34)',deco:'rgba(195,215,211,.22)',patch:['rgba(86,104,108,.22)','rgba(65,82,88,.24)','rgba(123,135,132,.15)','rgba(63,73,78,.23)']},
 ember:{ground:'#211914',sky1:'#2a1a15',sky2:'#100b09',accent:'#c9784e',road:'rgba(122,85,62,.34)',deco:'rgba(197,115,69,.24)',patch:['rgba(105,61,43,.23)','rgba(83,59,46,.22)','rgba(126,69,42,.18)','rgba(65,48,42,.25)']},
 crypt:{ground:'#1b191b',sky1:'#252127',sky2:'#0c0b0d',accent:'#9f929d',road:'rgba(104,94,91,.34)',deco:'rgba(169,155,154,.19)',patch:['rgba(82,72,80,.21)','rgba(65,61,68,.23)','rgba(100,83,92,.16)','rgba(53,50,56,.25)']}
};
for(const m of MAP_THEMES){const p=V420_THEME[m.id];if(p)Object.assign(m,p)}
let wuxiaAmbient=[];
const v420GenerateWorldBase=generateWorld;
generateWorld=function(){v420GenerateWorldBase();const kind=currentMap.id==='forest'?'leaf':currentMap.id==='frost'?'snow':currentMap.id==='ember'?'ember':'wisp';wuxiaAmbient=Array.from({length:kind==='snow'?150:105},()=>({x:rand(0,WORLD_W),y:rand(0,WORLD_H),phase:rand(0,Math.PI*2),size:rand(.7,1.8),drift:rand(8,26),kind}))};
function v420MountainLayer(baseY,amp,step,color,parallax,phase){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-40,H+20);for(let x=-80;x<=W+100;x+=step){const wx=x+camera.x*parallax;const y=baseY-Math.abs(Math.sin(wx*.004+phase))*amp-Math.abs(Math.sin(wx*.0017+phase*.7))*amp*.55;ctx.lineTo(x,y)}ctx.lineTo(W+80,H+20);ctx.closePath();ctx.fill()}
function v420MistBand(y,alpha,offset){const g=ctx.createLinearGradient(0,y-55,0,y+55);g.addColorStop(0,'rgba(224,225,210,0)');g.addColorStop(.5,`rgba(211,216,202,${alpha})`);g.addColorStop(1,'rgba(224,225,210,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=W;x+=24){ctx.lineTo(x,y+Math.sin(x*.018+elapsed*.07+offset)*10)}ctx.lineTo(W,y+80);ctx.lineTo(0,y+80);ctx.closePath();ctx.fill()}
drawBackground=function(){const map=currentMap||MAP_THEMES[0];const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,map.sky1);g.addColorStop(.48,map.ground);g.addColorStop(1,map.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);v420MountainLayer(H*.34,70,82,'rgba(8,13,10,.34)',.06,.4);v420MountainLayer(H*.44,54,66,'rgba(13,18,14,.42)',.1,1.1);if(map.id!=='ember'){v420MistBand(H*.29,.035,0);v420MistBand(H*.53,.027,1.7)}else{const rg=ctx.createRadialGradient(W*.72,H*.22,0,W*.72,H*.22,Math.max(W,H)*.7);rg.addColorStop(0,'rgba(150,72,39,.08)');rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H)}for(const f of fogWisps){const sx=f.x-camera.x*.16+Math.sin(elapsed*.08+f.phase)*18,sy=f.y-camera.y*.16+Math.cos(elapsed*.06+f.phase)*13;if(sx<-f.r||sx>W+f.r||sy<-f.r||sy>H+f.r)continue;const r=ctx.createRadialGradient(sx,sy,0,sx,sy,f.r);r.addColorStop(0,map.id==='ember'?'rgba(175,96,60,.022)':'rgba(205,212,196,.024)');r.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=r;ctx.beginPath();ctx.arc(sx,sy,f.r,0,Math.PI*2);ctx.fill()}}
const v420ArenaBase=drawArenaDetails;
drawArenaDetails=function(){v420ArenaBase();const map=currentMap||MAP_THEMES[0];for(const a of wuxiaAmbient){let x=a.x,y=a.y;if(a.kind==='leaf'){x+=Math.sin(elapsed*.45+a.phase)*20;y=(a.y+elapsed*a.drift)%WORLD_H}else if(a.kind==='snow'){x+=Math.sin(elapsed*.65+a.phase)*15;y=(a.y+elapsed*a.drift*.75)%WORLD_H}else if(a.kind==='ember'){x+=Math.sin(elapsed*.8+a.phase)*9;y=(a.y-elapsed*a.drift+WORLD_H*10)%WORLD_H}else{x+=Math.sin(elapsed*.3+a.phase)*13;y+=Math.cos(elapsed*.24+a.phase)*9}if(x<camera.x-30||x>camera.x+W+30||y<camera.y-30||y>camera.y+H+30)continue;ctx.save();ctx.translate(x,y);ctx.rotate(a.phase+elapsed*.5);if(a.kind==='leaf'){ctx.fillStyle='rgba(133,157,103,.32)';ctx.beginPath();ctx.ellipse(0,0,4*a.size,1.5*a.size,.5,0,Math.PI*2);ctx.fill()}else if(a.kind==='snow'){ctx.fillStyle='rgba(225,236,232,.35)';ctx.beginPath();ctx.arc(0,0,1.1*a.size,0,Math.PI*2);ctx.fill()}else if(a.kind==='ember'){ctx.fillStyle='rgba(213,107,58,.38)';ctx.fillRect(-.8*a.size,-2.2*a.size,1.6*a.size,4.4*a.size)}else{ctx.globalAlpha=.18+.12*Math.sin(elapsed+a.phase);ctx.fillStyle=map.accent;ctx.beginPath();ctx.arc(0,0,2.2*a.size,0,Math.PI*2);ctx.fill()}ctx.restore()}}
function v420DrawRobe(ctx2,main,trim,scale=1){ctx2.fillStyle=main;ctx2.strokeStyle='#181711';ctx2.lineWidth=1.5*scale;ctx2.beginPath();ctx2.moveTo(-8*scale,8*scale);ctx2.lineTo(-7*scale,-6*scale);ctx2.lineTo(-3.5*scale,-10*scale);ctx2.lineTo(3.5*scale,-10*scale);ctx2.lineTo(7*scale,-6*scale);ctx2.lineTo(8*scale,8*scale);ctx2.lineTo(4.5*scale,13*scale);ctx2.lineTo(-4.5*scale,13*scale);ctx2.closePath();ctx2.fill();ctx2.stroke();ctx2.strokeStyle=trim;ctx2.lineWidth=1.2*scale;ctx2.beginPath();ctx2.moveTo(-3.8*scale,-8*scale);ctx2.lineTo(0,0);ctx2.lineTo(3.8*scale,-8*scale);ctx2.stroke();ctx2.fillStyle=trim;ctx2.fillRect(-7.5*scale,3*scale,15*scale,2*scale)}
drawPlayerWeapon=function(type,ang){const evo=runEvolution?evolutionDefs[runEvolution]:null,qi=evo?evo.color:'#d7c28a';ctx.save();ctx.rotate(ang);ctx.translate(11.5,0);ctx.shadowColor=qi;ctx.shadowBlur=evo?8:3;if(type==='sword'){ctx.strokeStyle='#d7d7cf';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(15,0);ctx.stroke();ctx.fillStyle='#d3aa58';ctx.fillRect(-3,-3.2,3.5,6.4);ctx.fillStyle='#6f4b2f';ctx.fillRect(-7,-1.2,4.5,2.4)}else if(type==='dagger'){ctx.fillStyle='#dfe2dc';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-1,-3);ctx.lineTo(2,0);ctx.lineTo(-1,3);ctx.closePath();ctx.fill();ctx.fillStyle='#8b5f36';ctx.fillRect(-5,-1.2,4,2.4)}else if(type==='bow'){ctx.strokeStyle='#b5894f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(1,0,10,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#ddd7c6';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(1,-10);ctx.lineTo(1,10);ctx.stroke()}else if(type==='hammer'){ctx.fillStyle='#77756b';ctx.fillRect(0,-5,12,10);ctx.fillStyle='#7c5738';ctx.fillRect(-5,-1,7,2)}else if(type==='spear'){ctx.strokeStyle='#7b5431';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(19,0);ctx.stroke();ctx.fillStyle='#d8d8d0';ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(16,-3.5);ctx.lineTo(16,3.5);ctx.closePath();ctx.fill();ctx.fillStyle='#a94b3d';ctx.fillRect(13,-1,3,2)}else if(type==='axe'){ctx.strokeStyle='#735134';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(8,0);ctx.stroke();ctx.fillStyle='#d7d8d2';ctx.beginPath();ctx.moveTo(5,-6);ctx.quadraticCurveTo(15,-4,12,4);ctx.lineTo(5,3);ctx.closePath();ctx.fill()}else{ctx.fillStyle=type==='grimoire'?'#7c5a67':'#5b725e';ctx.beginPath();ctx.arc(7,0,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=qi;ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(7,0,7,0,Math.PI*2);ctx.stroke()}ctx.restore();ctx.shadowBlur=0}
drawPlayer=function(){if(!player)return;const bob=Math.sin(elapsed*7)*.75,move=Math.hypot(input.x,input.y)>.08,accent=runEvolution?(evolutionDefs[runEvolution]?.color||'#d7b46a'):'#9ab394';ctx.save();ctx.translate(player.x,player.y+bob);if(player.hitFlash>0)ctx.globalAlpha=.62+Math.sin(performance.now()*.04)*.28;ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(0,11,11,3.4,0,0,Math.PI*2);ctx.fill();if(player.shield>0){ctx.strokeStyle='rgba(220,196,127,.72)';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(0,0,17+Math.sin(elapsed*5),0,Math.PI*2);ctx.stroke()}ctx.save();ctx.rotate((player.facing||0)+Math.PI);ctx.fillStyle='rgba(34,34,26,.92)';ctx.beginPath();ctx.moveTo(-5,1);ctx.quadraticCurveTo(-10,12+(move?2:0),-3,15);ctx.lineTo(0,9);ctx.lineTo(3,15);ctx.quadraticCurveTo(10,12-(move?2:0),5,1);ctx.closePath();ctx.fill();ctx.restore();v420DrawRobe(ctx,'#526a53',accent,1);ctx.fillStyle='#c79b73';ctx.beginPath();ctx.arc(0,-11.5,4.6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#19160f';ctx.beginPath();ctx.arc(0,-14,4.8,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-1.3,-18,2.6,4.5);ctx.beginPath();ctx.arc(0,-18.5,2.1,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2a2016';ctx.fillRect(-5,12,3.7,2.5);ctx.fillRect(1.3,12,3.7,2.5);ctx.strokeStyle=accent;ctx.globalAlpha=.30;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,15.5+Math.sin(elapsed*4)*.7,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;drawPlayerWeapon(player.weaponType,player.facing||0);ctx.restore()}
function v420EnemyColors(type){return{basic:['#6d5947','#302720'],fast:['#394e43','#202823'],tank:['#62615a','#2c2d29'],ranged:['#79684c','#30291f'],charger:['#874638','#39211d'],elite:['#65506a','#2c232e'],midboss:['#936e3f','#37291d'],boss:['#8f342c','#321713']}[type]||['#6d5947','#302720']}
drawEnemy=function(e){const cc=v420EnemyColors(e.type),col=cc[0],dark=cc[1],bob=Math.sin(elapsed*5+e.phase)*(e.type==='fast'?1:.55),s=e.r/10;ctx.save();ctx.translate(e.x,e.y+bob);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,e.r*.72,e.r*.72,e.r*.22,0,0,Math.PI*2);ctx.fill();if(e.type==='tank'){ctx.fillStyle='#4a4a44';ctx.fillRect(-7*s,-7*s,14*s,15*s);ctx.strokeStyle='#a4895c';ctx.lineWidth=1.5*s;ctx.strokeRect(-6*s,-6*s,12*s,12*s);ctx.fillStyle='#68675f';ctx.fillRect(-9*s,-4*s,3*s,9*s);ctx.fillRect(6*s,-4*s,3*s,9*s)}else{v420DrawRobe(ctx,col,e.type==='boss'?'#c8a05a':e.type==='elite'?'#a2768f':'#a98b58',Math.max(.68,s*.8))}ctx.fillStyle='#c28f68';ctx.beginPath();ctx.arc(0,-7.5*s,3.3*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17130f';ctx.beginPath();ctx.arc(0,-9.4*s,3.5*s,Math.PI,Math.PI*2);ctx.fill();if(e.type==='fast'){ctx.fillStyle='#172019';ctx.fillRect(-5*s,-10*s,10*s,1.8*s);ctx.strokeStyle='#d3d7d0';ctx.lineWidth=1*s;ctx.beginPath();ctx.moveTo(-7*s,2*s);ctx.lineTo(-12*s,7*s);ctx.moveTo(7*s,2*s);ctx.lineTo(12*s,7*s);ctx.stroke()}else if(e.type==='ranged'){ctx.strokeStyle='#b98b4d';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(7*s,1*s,5*s,-Math.PI/2,Math.PI/2);ctx.stroke()}else if(e.type==='charger'){ctx.strokeStyle='#c8c9c1';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-7*s,-1*s);ctx.lineTo(10*s,7*s);ctx.stroke()}else if(e.type==='basic'){ctx.strokeStyle='#d6d5cd';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(5*s,-1*s);ctx.lineTo(12*s,5*s);ctx.stroke()}if(['elite','midboss','boss'].includes(e.type)){ctx.strokeStyle=e.type==='boss'?'rgba(184,63,48,.75)':'rgba(197,158,89,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,e.r*.92+Math.sin(elapsed*3+e.phase)*1.2,0,Math.PI*2);ctx.stroke();if(e.type==='boss'){ctx.fillStyle='#a74335';ctx.beginPath();ctx.moveTo(-4*s,-12*s);ctx.lineTo(0,-16*s);ctx.lineTo(4*s,-12*s);ctx.closePath();ctx.fill()}}ctx.restore();if(['fast','tank','ranged','charger'].includes(e.type)){ctx.save();ctx.font='800 7px serif';ctx.textAlign='center';ctx.fillStyle='rgba(239,229,207,.88)';ctx.fillText({fast:'輕',tank:'鐵',ranged:'暗',charger:'霸'}[e.type],e.x,e.y-e.r-5);ctx.restore()}if(['boss','midboss','elite'].includes(e.type)){const w=e.r*2.15;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(e.x-w/2,e.y-e.r-13,w,3.5);ctx.fillStyle=e.type==='boss'?'#b94b3f':'#c29b57';ctx.fillRect(e.x-w/2,e.y-e.r-13,w*Math.max(0,e.hp/e.maxHp),3.5)}}
const v420AttackEffectBase=drawAttackEffect;
drawAttackEffect=function(a){if(!['slash','slam','thrust','bossTelegraph'].includes(a.type)){v420AttackEffectBase(a);return}const t=Math.max(0,a.life/a.max),alpha=Math.min(1,t*1.6),c=a.color||'#d9c58a';ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';if(a.type==='slash'){ctx.strokeStyle='rgba(16,18,14,.68)';ctx.lineWidth=8*(1-t)+3;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.76+.18*(1-t)),a.angle-.58,a.angle+.58);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=3.5*(1-t)+1.2;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.78+.17*(1-t)),a.angle-.58,a.angle+.58);ctx.stroke();ctx.globalAlpha=alpha*.45;ctx.strokeStyle='#f0e6cb';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.70+.2*(1-t)),a.angle-.5,a.angle+.5);ctx.stroke()}else if(a.type==='thrust'){ctx.strokeStyle='rgba(18,18,14,.65)';ctx.lineWidth=7*t+3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x2,a.y2);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=2.5*t+1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x2,a.y2);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(a.x2,a.y2,2.2+3*(1-t),0,Math.PI*2);ctx.fill()}else if(a.type==='slam'){ctx.strokeStyle='rgba(20,18,13,.60)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.74+.24*(1-t)),0,Math.PI*2);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(a.x,a.y,a.r*(.72+.23*(1-t)),0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const ang=i*Math.PI/3+.2;ctx.beginPath();ctx.moveTo(a.x+Math.cos(ang)*a.r*.25,a.y+Math.sin(ang)*a.r*.25);ctx.lineTo(a.x+Math.cos(ang)*a.r*(.55+.2*(1-t)),a.y+Math.sin(ang)*a.r*(.55+.2*(1-t)));ctx.stroke()}}else{ctx.strokeStyle='#b84a3d';ctx.lineWidth=2;ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(a.angle)*a.r,a.y+Math.sin(a.angle)*a.r);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(184,74,61,.10)';ctx.beginPath();ctx.arc(a.x,a.y,20+8*(1-t),0,Math.PI*2);ctx.fill()}ctx.restore()}
drawBullet=function(b){const col=b.color||(b.crit?'#d7b45f':'#cfd3c8');ctx.save();for(let i=0;i<(b.trail||[]).length;i++){const p=b.trail[i],a=(i+1)/(b.trail.length||1)*.08;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=Math.max(.7,b.r*.35);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.globalAlpha=1;ctx.translate(b.x,b.y);const ang=Math.atan2(b.vy,b.vx);ctx.rotate(ang);ctx.shadowColor=col;ctx.shadowBlur=b.evolution?7:2;if(b.shape==='arrow'){ctx.strokeStyle='#ded7c2';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(7,0);ctx.stroke();ctx.fillStyle='#b9b8ae';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(4,-2.5);ctx.lineTo(4,2.5);ctx.closePath();ctx.fill()}else if(b.shape==='dagger'||b.shape==='soulblade'){ctx.fillStyle='#d9dad4';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-3,-2.2);ctx.lineTo(-1,0);ctx.lineTo(-3,2.2);ctx.closePath();ctx.fill()}else if(b.shape==='axe'){ctx.rotate(elapsed*8);ctx.strokeStyle='#765337';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.stroke();ctx.fillStyle='#c8cac4';ctx.beginPath();ctx.moveTo(1,-5);ctx.quadraticCurveTo(8,-4,7,2);ctx.lineTo(1,3);ctx.closePath();ctx.fill()}else if(b.shape==='arcane'||b.shape==='rune'){ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,Math.max(2,b.r*.72),0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(221,211,181,.55)';ctx.beginPath();ctx.arc(0,0,Math.max(1,b.r*.28),0,Math.PI*2);ctx.fill()}else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,Math.max(1.2,b.r*.72),0,Math.PI*2);ctx.fill()}ctx.restore()}
drawEnemyBullet=function(b){ctx.save();for(let i=0;i<(b.trail||[]).length;i++){const p=b.trail[i];ctx.globalAlpha=(i+1)/(b.trail.length||1)*.07;ctx.strokeStyle=b.color||'#b84a3d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.globalAlpha=1;ctx.translate(b.x,b.y);const ang=Math.atan2(b.vy||0,b.vx||0);ctx.rotate(ang);ctx.fillStyle=b.color||'#b84a3d';ctx.beginPath();ctx.moveTo(Math.max(5,b.r),0);ctx.lineTo(-Math.max(4,b.r*.8),-Math.max(1.7,b.r*.3));ctx.lineTo(-Math.max(2,b.r*.45),0);ctx.lineTo(-Math.max(4,b.r*.8),Math.max(1.7,b.r*.3));ctx.closePath();ctx.fill();ctx.restore()}
drawChest=function(c){if(c.broken||c.x<camera.x-50||c.x>camera.x+W+50||c.y<camera.y-50||c.y>camera.y+H+50)return;ctx.save();ctx.translate(c.x,c.y);const tier=c.tier||0,metal=tier>=2?'#c9a45a':tier===1?'#9c8170':'#8c7450';ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,10,c.r*1.0,c.r*.28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=tier>=2?'#60452a':'#4f402e';ctx.strokeStyle=metal;ctx.lineWidth=1.5;ctx.beginPath();pathRoundRect(ctx,-c.r,-c.r*.62,c.r*2,c.r*1.25,3);ctx.fill();ctx.stroke();ctx.fillStyle=metal;ctx.fillRect(-2,-c.r*.62,4,c.r*1.25);ctx.fillRect(-c.r,-1.5,c.r*2,3);ctx.fillStyle='#d8c9a3';ctx.save();ctx.rotate(-.08);ctx.fillRect(-5,-c.r*.52,10,c.r*.56);ctx.fillStyle=tier>=2?'#a84437':'#745a3f';ctx.font=`800 ${Math.max(6,c.r*.42)}px serif`;ctx.textAlign='center';ctx.fillText(tier>=2?'賞':'封',0,-c.r*.13);ctx.restore();const w=c.r*1.85;ctx.fillStyle='rgba(0,0,0,.44)';ctx.fillRect(-w/2,c.r+3,w,2.5);ctx.fillStyle=metal;ctx.fillRect(-w/2,c.r+3,w*Math.max(0,c.hp/c.maxHp),2.5);ctx.restore()}
drawPotion=function(p){if(p.x<camera.x-35||p.x>camera.x+W+35||p.y<camera.y-35||p.y>camera.y+H+35)return;ctx.save();ctx.translate(p.x,p.y+Math.sin(elapsed*5+p.phase)*1.5);ctx.fillStyle='#d8cba8';ctx.beginPath();ctx.ellipse(0,1,4.6,6.4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#94724c';ctx.fillRect(-2.5,-7,5,3);ctx.strokeStyle='#6fa079';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,1,6.8,0,Math.PI*2);ctx.stroke();ctx.restore()}
/* ===== END MODERN WUXIA GRAPHICS ===== */


/* ===== SECT BASE / SIDE MISSION / DISCIPLE MODULE ===== */
const V43_BUILDINGS={
  training:{name:'연무장',icon:'🥋',desc:'전투 기본기를 단련합니다.',effect:'공격력 +4% / Lv.'},
  library:{name:'장경각',icon:'📚',desc:'비급과 심법을 정리합니다.',effect:'경험치 획득 +6% / Lv.'},
  forge:{name:'대장간',icon:'⚒️',desc:'병장기 거래와 손질을 돕습니다.',effect:'상점 구매가 -3% / Lv.'},
  medicine:{name:'약방',icon:'🧪',desc:'상처 치료와 영약 제조를 담당합니다.',effect:'최대 HP +4% · 약효 +6% / Lv.'},
  dormitory:{name:'제자 숙소',icon:'🏠',desc:'더 많은 무인을 받아들입니다.',effect:'동행 제자 해금 · Lv.1~5에서 순차 영입'}
};
const V43_BUILDING_COST=[2,4,7,11,16];
const V43_DISCIPLES={
  swordsman:{name:'검수 · 서진',icon:'⚔️',need:1,desc:'근거리에서 검격으로 적을 견제하는 첫 동행 제자.',apply:()=>{}},
  assassin:{name:'암기수 · 연화',icon:'🥷',need:2,desc:'후방에서 비도를 던져 빠르게 적을 끊어내는 동행 제자.',apply:()=>{}},
  lancer:{name:'창수 · 무진',icon:'🔱',need:3,desc:'긴 장창으로 여러 적을 직선 관통하는 동행 제자.',apply:()=>{}},
  brawler:{name:'권사 · 태산',icon:'👊',need:4,desc:'가까운 적에게 묵직한 범위 충격을 가하는 동행 제자.',apply:()=>{}},
  healer:{name:'의원 · 소연',icon:'🌿',need:5,desc:'원거리 지원과 주기적인 치유를 담당하는 동행 제자.',apply:()=>{}}
};
const V43_MANUALS=[
  {id:'blackwind',sect:'흑풍문',name:'흑풍비도결',icon:'🌪️',desc:'속도와 빈틈을 노리는 흑풍문의 비전.',perRank:'공격속도 +4% · 치명타 +2%',apply:(b,r)=>{b.fireRatePct+=.04*r;b.crit+=2*r}},
  {id:'redmoon',sect:'적월방',name:'적월빙독공',icon:'🌙',desc:'차가운 독기와 암기를 함께 운용하는 심법.',perRank:'공격력 +3% · 이동속도 +2%',apply:(b,r)=>{b.damagePct+=.03*r;b.movePct+=.02*r}},
  {id:'ironmountain',sect:'철산파',name:'철산금강체',icon:'⛰️',desc:'외공을 극한까지 단련하는 호신 비전.',perRank:'최대 HP +8% · 피해 감소 +2%',apply:(b,r)=>{b.hpPct+=.08*r;b.damageReduction+=2*r}},
  {id:'poisondragon',sect:'독룡곡',name:'독룡심법',icon:'🐍',desc:'독기 속에서도 기혈을 보존하는 내공법.',perRank:'공격력 +3% · 초당 회복 +0.15',apply:(b,r)=>{b.damagePct+=.03*r;b.regen+=.15*r}},
  {id:'heavenlydemon',sect:'천마련',name:'천마대법',icon:'🔥',desc:'폭발적인 내공 운용을 중시하는 패도 심법.',perRank:'공격력 +6% · 공격속도 +3%',apply:(b,r)=>{b.damagePct+=.06*r;b.fireRatePct+=.03*r}}
];
const V43_MISSION_TYPES={
  banner:{name:'적 문파 깃발 파괴',icon:'🚩',goal:3,desc:'지도에 표시된 깃발을 찾아 공격으로 파괴하세요.'},
  rescue:{name:'청운문 제자 구출',icon:'🪢',goal:2,desc:'포로 우리를 공격해 부수고 제자를 구출하세요.'},
  scroll:{name:'분실 비급 회수',icon:'📜',goal:3,desc:'지도에 흩어진 청운문 비급을 회수하세요.'},
  herb:{name:'영약 재료 채집',icon:'🌿',goal:5,desc:'약방에 필요한 희귀 약초를 모으세요.'},
  hunt:{name:'강호 고수 토벌',icon:'🎯',goal:4,desc:'패도 무사 또는 내문 고수를 처치하세요.'}
};
let v43Mission=null,v43MissionObjects=[],v43MissionRewarded=false;
function v43EnsureProfile(){
  profile.sectContribution=Math.max(0,Number(profile.sectContribution)||0);
  profile.sectBuildings=profile.sectBuildings&&typeof profile.sectBuildings==='object'?profile.sectBuildings:{};
  for(const k of Object.keys(V43_BUILDINGS))profile.sectBuildings[k]=Math.max(0,Math.min(5,Number(profile.sectBuildings[k])||0));
  profile.sectManuals=profile.sectManuals&&typeof profile.sectManuals==='object'?profile.sectManuals:{};
  for(const m of V43_MANUALS)profile.sectManuals[m.id]=Math.max(0,Math.min(3,Number(profile.sectManuals[m.id])||0));
  const dorm=profile.sectBuildings.dormitory||0;
  if(!V43_DISCIPLES[profile.activeDisciple]||V43_DISCIPLES[profile.activeDisciple].need>dorm)profile.activeDisciple=null;
  profile.sideMissionsCompleted=Math.max(0,Number(profile.sideMissionsCompleted)||0);
  profile.version=Math.max(7,Number(profile.version)||0);
}
v43EnsureProfile();saveProfile();
function v43BuildingCost(key){const lv=profile.sectBuildings[key]||0;return lv>=5?null:V43_BUILDING_COST[lv]}
function v43BuildBonus(){
  v43EnsureProfile();const b={damagePct:0,hpPct:0,movePct:0,fireRatePct:0,crit:0,damageReduction:0,regen:0,healPct:0,xpPct:0,shopPct:0};
  const s=profile.sectBuildings;
  b.damagePct+=s.training*.04;b.xpPct+=s.library*.06;b.shopPct+=s.forge*.03;b.hpPct+=s.medicine*.04;b.healPct+=s.medicine*.06;b.movePct+=s.dormitory*.02;
  for(const m of V43_MANUALS){const r=profile.sectManuals[m.id]||0;if(r)m.apply(b,r)}
  const d=V43_DISCIPLES[profile.activeDisciple]||V43_DISCIPLES.swordsman;d.apply(b,(getWeapon().weaponType||'sword'));
  return b;
}
function v43SectLevel(){return Object.values(profile.sectBuildings||{}).reduce((a,b)=>a+(Number(b)||0),0)}
function v43UnlockedDisciples(){const dorm=profile.sectBuildings.dormitory||0;return Object.entries(V43_DISCIPLES).filter(([,d])=>d.need<=dorm)}

// ----- Sect base & disciple UI -----
const v43Style=document.createElement('style');v43Style.textContent=`
#v43MissionBadge{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 124px);transform:translateX(-50%);z-index:5;pointer-events:none;background:rgba(25,22,16,.88);border:1px solid rgba(212,178,100,.35);border-radius:12px;padding:7px 10px;min-width:190px;max-width:80vw;text-align:center;font-size:9px;color:#d8ccb0;backdrop-filter:blur(7px)}#v43MissionBadge b{display:block;color:#f2dfaa;font-size:10px;margin-bottom:2px}
.v43Summary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0 12px}.v43Summary div{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:11px;padding:7px;text-align:center}.v43Summary small{display:block;color:#958e7c;font-size:8px}.v43Summary b{font-size:10px;color:#e9dfc8}
.v43Cards{display:grid;gap:7px}.v43Card{background:#17150f;border:1px solid #433a2a;border-radius:14px;padding:10px}.v43Top{display:flex;justify-content:space-between;gap:8px;align-items:center}.v43Top b{font-size:12px}.v43Top span{font-size:9px;color:#c3b89d}.v43Card p{font-size:9px;color:#9e9787;margin:5px 0 8px;line-height:1.45}.v43Mini{font-size:9px;color:#d4c496}.v43Disciple{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center}.v43Disciple .ico{font-size:25px;text-align:center}.v43Disciple.locked{opacity:.48}.v43Manuals{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v43Manual{background:#11100d;border:1px solid #3c3427;border-radius:11px;padding:8px}.v43Manual b{font-size:10px}.v43Manual span{display:block;font-size:8px;color:#9d9583;margin-top:3px}.v43Objective{font-size:8px;color:#c9b36f;margin-top:4px}
`;
document.head.appendChild(v43Style);
const v43MissionBadge=document.createElement('div');v43MissionBadge.id='v43MissionBadge';v43MissionBadge.className='hidden';document.body.appendChild(v43MissionBadge);
const v43HomeGrid=document.querySelector('#startScreen .homeActionGrid');
if(v43HomeGrid){const b1=document.createElement('button');b1.className='btn secondary';b1.id='v43SectBtn';b1.textContent='🏯 문파 본거지';const b2=document.createElement('button');b2.className='btn secondary';b2.id='v43DiscipleBtn';b2.textContent='🥋 전투 제자';v43HomeGrid.append(b1,b2)}
const v43Summary=document.createElement('div');v43Summary.id='v43Summary';v43Summary.className='v43Summary';const v43Story=document.getElementById('sectStory');if(v43Story)v43Story.insertAdjacentElement('afterend',v43Summary);
const v43SectScreen=document.createElement('div');v43SectScreen.id='v43SectScreen';v43SectScreen.className='overlay hidden';v43SectScreen.innerHTML=`<div class="panel equipmentPanel"><div class="sectionTitle"><h2>🏯 청운문 본거지</h2><span id="v43SectRes"></span></div><p class="subtitle">원정과 부가 임무에서 얻은 <b>문파 공헌</b>으로 본거지를 성장시키세요. 건물 효과는 모든 원정에 영구 적용됩니다.</p><div id="v43BuildingList" class="v43Cards"></div><div class="sectionTitle mt12"><h2 style="font-size:16px">📜 문파 비전</h2><span>문파전 전리품</span></div><div id="v43ManualList" class="v43Manuals"></div><button class="btn secondary wide mt12" id="v43SectBack">돌아가기</button></div>`;document.body.appendChild(v43SectScreen);
const v43DiscipleScreen=document.createElement('div');v43DiscipleScreen.id='v43DiscipleScreen';v43DiscipleScreen.className='overlay hidden';v43DiscipleScreen.innerHTML=`<div class="panel equipmentPanel"><div class="sectionTitle"><h2>🥋 전투 제자</h2><span id="v43DiscipleCount"></span></div><p class="subtitle">청운문의 제자 중 이번 원정을 수행할 무인을 선택합니다. 제자 숙소를 확장하면 새로운 전투 스타일이 해금됩니다.</p><div id="v43DiscipleList" class="v43Cards"></div><button class="btn secondary wide mt12" id="v43DiscipleBack">돌아가기</button></div>`;document.body.appendChild(v43DiscipleScreen);
function v43RenderSect(){
  v43EnsureProfile();document.getElementById('v43SectRes').textContent=`공헌 ${profile.sectContribution} · 건물 Lv.${v43SectLevel()}`;
  document.getElementById('v43BuildingList').innerHTML=Object.entries(V43_BUILDINGS).map(([id,d])=>{const lv=profile.sectBuildings[id]||0,c=v43BuildingCost(id);return `<div class="v43Card"><div class="v43Top"><b>${d.icon} ${d.name} · Lv.${lv}/5</b><span>${c===null?'최대 단계':'공헌 '+c}</span></div><p>${d.desc}</p><div class="v43Mini">${d.effect}</div><button class="miniBtn mt8" data-v43-build="${id}" ${c===null||profile.sectContribution<c?'disabled':''}>${c===null?'완성':'증축'}</button></div>`}).join('');
  document.getElementById('v43ManualList').innerHTML=V43_MANUALS.map(m=>{const r=profile.sectManuals[m.id]||0;return `<div class="v43Manual" style="opacity:${r?1:.48}"><b>${r?m.icon:'❔'} ${r?m.name:m.sect+' 비전'}</b><span>${r?'Rank '+r+'/3 · '+m.perRank:'해당 문파 장문인을 격파하면 획득'}</span></div>`}).join('');
  document.querySelectorAll('[data-v43-build]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.v43Build,c=v43BuildingCost(id);if(c===null||profile.sectContribution<c)return;profile.sectContribution-=c;profile.sectBuildings[id]++;v43EnsureProfile();saveProfile();v43RenderSect();renderHome();showToast(`${V43_BUILDINGS[id].icon} ${V43_BUILDINGS[id].name} Lv.${profile.sectBuildings[id]} 완성`)})
}
function v43RenderDisciples(){v43EnsureProfile();const unlocked=v43UnlockedDisciples();document.getElementById('v43DiscipleCount').textContent=`${unlocked.length} / ${Object.keys(V43_DISCIPLES).length}명 해금`;document.getElementById('v43DiscipleList').innerHTML=Object.entries(V43_DISCIPLES).map(([id,d])=>{const ok=(profile.sectBuildings.dormitory||0)>=d.need,active=profile.activeDisciple===id;return `<div class="v43Card v43Disciple ${ok?'':'locked'}"><div class="ico">${d.icon}</div><div><b>${d.name}</b><p>${d.desc}${ok?'':`<br>제자 숙소 Lv.${d.need} 필요`}</p></div><button class="miniBtn ${active?'active':''}" data-v43-disciple="${id}" ${ok?'':'disabled'}>${active?'선택 중':'선택'}</button></div>`}).join('');document.querySelectorAll('[data-v43-disciple]').forEach(btn=>btn.onclick=()=>{profile.activeDisciple=btn.dataset.v43Disciple;saveProfile();v43RenderDisciples();renderHome();showToast(`${V43_DISCIPLES[profile.activeDisciple].icon} ${V43_DISCIPLES[profile.activeDisciple].name} 출전 준비`)})}
function v43OpenSect(){startScreen.classList.add('hidden');v43RenderSect();v43SectScreen.classList.remove('hidden')}
function v43OpenDisciple(){startScreen.classList.add('hidden');v43RenderDisciples();v43DiscipleScreen.classList.remove('hidden')}
document.getElementById('v43SectBtn').onclick=v43OpenSect;document.getElementById('v43DiscipleBtn').onclick=v43OpenDisciple;document.getElementById('v43SectBack').onclick=()=>{v43SectScreen.classList.add('hidden');renderHome();startScreen.classList.remove('hidden')};document.getElementById('v43DiscipleBack').onclick=()=>{v43DiscipleScreen.classList.add('hidden');renderHome();startScreen.classList.remove('hidden')};

// ----- Permanent progression bonuses -----
const v43AddGemBase=addGem;addGem=function(x,y,value){const b=v43BuildBonus();return v43AddGemBase(x,y,Math.max(1,Math.round(value*(1+b.xpPct))))};
const v43ShopPriceBase=shopItemPrice;shopItemPrice=function(item){const b=v43BuildBonus();return Math.max(1,Math.round(v43ShopPriceBase(item)*(1-b.shopPct)))};
const v43DropPotionBase=dropPotion;dropPotion=function(x,y,better=false){const before=potions.length;v43DropPotionBase(x,y,better);if(potions.length>before){const b=v43BuildBonus();potions[potions.length-1].healPct*=1+b.healPct}};
const v43ResetBase=reset;reset=function(){v43ResetBase();v43EnsureProfile();const b=v43BuildBonus();if(player){player.damage*=1+b.damagePct;player.maxHp*=1+b.hpPct;player.hp=player.maxHp;player.speed*=1+b.movePct;player.fireRate/=1+b.fireRatePct;player.crit+=b.crit;player.damageReduction+=b.damageReduction;player.regen+=b.regen}v43PrepareMission()};

// ----- Random side missions -----
function v43MissionPoint(){for(let n=0;n<100;n++){const a=rand(0,Math.PI*2),r=rand(700,2500),x=WORLD_W/2+Math.cos(a)*r,y=WORLD_H/2+Math.sin(a)*r;if(x<120||x>WORLD_W-120||y<120||y>WORLD_H-120)continue;if(obstacles.some(o=>dist2(x,y,o.x,o.y)<(o.r+80)*(o.r+80)))continue;if(chests.some(c=>dist2(x,y,c.x,c.y)<100*100))continue;return{x,y}}return{x:WORLD_W/2+600,y:WORLD_H/2}}
function v43PrepareMission(){
  const info=v40StageInfo(currentStage);const keys=info.isSectBattle?['banner','rescue','hunt']:['banner','rescue','scroll','herb','hunt'];const type=pick(keys),def=V43_MISSION_TYPES[type];v43Mission={type,name:def.name,icon:def.icon,goal:def.goal,progress:0,complete:false,desc:def.desc};v43MissionObjects=[];v43MissionRewarded=false;
  if(type==='banner'||type==='rescue'){for(let i=0;i<def.goal;i++){const p=v43MissionPoint();v43MissionObjects.push({kind:type,x:p.x,y:p.y,r:type==='banner'?15:17,hp:55+currentStage*6,maxHp:55+currentStage*6,done:false,hitFlash:0})}}
  else if(type==='scroll'||type==='herb'){for(let i=0;i<def.goal;i++){const p=v43MissionPoint();v43MissionObjects.push({kind:type,x:p.x,y:p.y,r:10,done:false,phase:rand(0,Math.PI*2)})}}
  v43UpdateMissionHUD();
}
function v43UpdateMissionHUD(){if(!v43Mission){v43MissionBadge.classList.add('hidden');return}v43MissionBadge.innerHTML=`<b>${v43Mission.complete?'✅':'📌'} 부가 임무 · ${v43Mission.icon} ${v43Mission.name}</b>${v43Mission.progress} / ${v43Mission.goal}${v43Mission.complete?' · 완료':' · '+v43Mission.desc}`}
function v43DamageMissionObjects(x,y,r,dmg,color='#d8bd72'){if(!v43Mission||v43Mission.complete)return;for(const o of v43MissionObjects){if(o.done||!('hp'in o))continue;if(Math.hypot(o.x-x,o.y-y)<=r+o.r){o.hp-=Math.max(1,dmg);o.hitFlash=.12;burst(o.x,o.y,2,color);if(o.hp<=0){o.done=true;v43Mission.progress++;burst(o.x,o.y,10,color);showToast(o.kind==='banner'?'🚩 적 문파 깃발 파괴':'🪢 청운문 제자 구출');v43CheckMission()}}}}
function v43CheckMission(){if(!v43Mission||v43Mission.complete)return;if(v43Mission.progress>=v43Mission.goal){v43Mission.complete=true;v43CompleteMission()}v43UpdateMissionHUD()}
function v43CompleteMission(){if(v43MissionRewarded)return;v43MissionRewarded=true;const info=v40StageInfo(currentStage),gain=info.isSectBattle?3:2;profile.sectContribution+=gain;profile.sectPrestige=(profile.sectPrestige||0)+(info.isSectBattle?18:10);profile.sideMissionsCompleted=(profile.sideMissionsCompleted||0)+1;saveProfile();spawnRewardChest(player.x+36,player.y,info.isSectBattle?2:1);showToast(`✅ 부가 임무 완료 · 문파 공헌 +${gain} · 보상 상자`)}
function v43UpdateMission(dt){if(!v43Mission||v43Mission.complete||!player)return;for(const o of v43MissionObjects){if(o.done)continue;o.hitFlash=Math.max(0,(o.hitFlash||0)-dt);if(o.kind==='scroll'||o.kind==='herb'){o.phase=(o.phase||0)+dt*2.5;if(Math.hypot(player.x-o.x,player.y-o.y)<player.r+22){o.done=true;v43Mission.progress++;burst(o.x,o.y,7,o.kind==='scroll'?'#d8bd72':'#7ba06f');showToast(o.kind==='scroll'?'📜 청운문 비급 회수':'🌿 희귀 약초 채집');v43CheckMission()}}}}
const v43UpdateBase=update;update=function(dt){v43UpdateBase(dt);if(!running||!player||paused)return;v43UpdateMission(dt);if(v43Mission&&!v43Mission.complete){for(const b of bullets){if(b.life<=0)continue;for(const o of v43MissionObjects){if(o.done||!('hp'in o))continue;const rr=b.r+o.r;if(dist2(b.x,b.y,o.x,o.y)<rr*rr){v43DamageMissionObjects(o.x,o.y,1,b.damage*.68,b.color||'#d8bd72');if(b.pierce>0)b.pierce--;else b.life=0;break}}}bullets=bullets.filter(b=>b.life>0)}};
const v43HitSwordBase=hitSword;hitSword=function(angle,wd,crit){v43HitSwordBase(angle,wd,crit);v43DamageMissionObjects(player.x,player.y,wd.range,player.damage*wd.damageMult*(crit?1.5:1),'#d8bd72')};
const v43HitHammerBase=hitHammer;hitHammer=function(angle,wd,crit){v43HitHammerBase(angle,wd,crit);const cx=player.x+Math.cos(angle)*42,cy=player.y+Math.sin(angle)*42;v43DamageMissionObjects(cx,cy,60,player.damage*wd.damageMult*(crit?1.5:1),'#c99b62')};
const v43HitSpearBase=hitSpear;hitSpear=function(angle,wd,crit){v43HitSpearBase(angle,wd,crit);const x2=player.x+Math.cos(angle)*wd.range,y2=player.y+Math.sin(angle)*wd.range;for(const o of v43MissionObjects){if(o.done||!('hp'in o))continue;if(pointSegDistance(o.x,o.y,player.x,player.y,x2,y2)<=o.r+10)v43DamageMissionObjects(o.x,o.y,1,player.damage*wd.damageMult*(crit?1.5:1),'#d9d2b6')}};
const v43DamageChestsBase=v39DamageChests;v39DamageChests=function(x,y,r,dmg,color){v43DamageChestsBase(x,y,r,dmg,color);v43DamageMissionObjects(x,y,r,dmg*.65,color)};
const v43KillEnemyBase=killEnemy;killEnemy=function(e){const counts=v43Mission&&!v43Mission.complete&&v43Mission.type==='hunt'&&['charger','elite','midboss'].includes(e.type);v43KillEnemyBase(e);if(counts){v43Mission.progress++;v43CheckMission()}};
function v43DrawMissionObject(o){if(o.done||o.x<camera.x-60||o.x>camera.x+W+60||o.y<camera.y-60||o.y>camera.y+H+60)return;ctx.save();ctx.translate(o.x,o.y);if(o.kind==='banner'){ctx.strokeStyle='#6d5132';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,15);ctx.lineTo(0,-18);ctx.stroke();ctx.fillStyle='#9f4137';ctx.beginPath();ctx.moveTo(1,-17);ctx.lineTo(17,-12);ctx.lineTo(1,-5);ctx.closePath();ctx.fill();ctx.fillStyle='#e0c586';ctx.font='800 8px serif';ctx.fillText('敵',6,-9)}else if(o.kind==='rescue'){ctx.strokeStyle='#a1875e';ctx.lineWidth=2;ctx.strokeRect(-13,-12,26,24);for(let x=-8;x<=8;x+=8){ctx.beginPath();ctx.moveTo(x,-12);ctx.lineTo(x,12);ctx.stroke()}ctx.fillStyle='#b88262';ctx.beginPath();ctx.arc(0,3,4,0,Math.PI*2);ctx.fill()}else if(o.kind==='scroll'){ctx.fillStyle='#ded1aa';ctx.fillRect(-8,-5,16,10);ctx.strokeStyle='#806943';ctx.strokeRect(-8,-5,16,10);ctx.fillStyle='#a33f35';ctx.font='800 7px serif';ctx.fillText('訣',-3,2)}else if(o.kind==='herb'){ctx.strokeStyle='#719466';ctx.lineWidth=2;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(0,8);ctx.quadraticCurveTo(i*7,-1,i*5,-10);ctx.stroke()}}if('hp'in o){const w=30;ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(-w/2,18,w,3);ctx.fillStyle='#d5b45f';ctx.fillRect(-w/2,18,w*Math.max(0,o.hp/o.maxHp),3)}ctx.restore()}
const v43DrawBase=draw;draw=function(){v43DrawBase();if(!running)return;ctx.save();ctx.translate(-camera.x,-camera.y);for(const o of v43MissionObjects)v43DrawMissionObject(o);ctx.restore()};
const v43MinimapBase=drawMinimap;drawMinimap=function(){v43MinimapBase();if(miniMap.classList.contains('hidden')||!v43Mission)return;const sx=(152-12)/WORLD_W,sy=(152-12)/WORLD_H;mctx.fillStyle='#f1cf70';for(const o of v43MissionObjects){if(o.done)continue;mctx.beginPath();mctx.arc(6+o.x*sx,6+o.y*sy,2.4,0,Math.PI*2);mctx.fill()}};

// ----- Rival sect manuals & stage progression -----
function v43GrantSectManual(info){if(!info||!info.isSectBattle)return null;const idx=(info.chapter-1)%V43_MANUALS.length,m=V43_MANUALS[idx],old=profile.sectManuals[m.id]||0;if(old>=3)return{manual:m,rank:3,maxed:true};profile.sectManuals[m.id]=old+1;return{manual:m,rank:old+1,maxed:false}}
const v43FinishRunBase=finishRun;finishRun=function(cleared=false){const info=v40StageInfo(currentStage);let manualReward=null;if(cleared){v43EnsureProfile();profile.sectContribution+=info.isSectBattle?4:1;if(info.isSectBattle)manualReward=v43GrantSectManual(info)}v43FinishRunBase(cleared);v43MissionBadge.classList.add('hidden');if(cleared){saveProfile();renderHome();const extra=` 문파 공헌 +${info.isSectBattle?4:1}.`;if($('resultMessage'))$('resultMessage').textContent+=extra;if(manualReward&&!manualReward.maxed){$('rewardItems').insertAdjacentHTML('afterbegin',`<div class="rewardItem"><div class="riLeft"><span class="riIcon">${manualReward.manual.icon}</span><div><b style="color:#e8cb76">${manualReward.manual.name}</b><small>${manualReward.manual.sect} 비전 · Rank ${manualReward.rank}/3 · 영구 효과</small></div></div><b>비급</b></div>`)}else if(manualReward&&manualReward.maxed){profile.sectContribution+=2;saveProfile()}}};
const v43StartBase=start;start=function(){v43SectScreen.classList.add('hidden');v43DiscipleScreen.classList.add('hidden');const r=v43StartBase();v43MissionBadge.classList.remove('hidden');v43UpdateMissionHUD();return r};

// Home summary
const v43RenderHomeBase=renderHome;renderHome=function(){v43EnsureProfile();v43RenderHomeBase();const d=V43_DISCIPLES[profile.activeDisciple]||V43_DISCIPLES.swordsman;if(v43Summary)v43Summary.innerHTML=`<div><small>문파 공헌</small><b>${profile.sectContribution}</b></div><div><small>본거지 성장</small><b>Lv.${v43SectLevel()}</b></div><div><small>전투 제자</small><b>${d.icon} ${d.name.split('·')[0].trim()}</b></div>`;const story=document.getElementById('sectStoryText');if(story)story.innerHTML+=`<div class="v43Objective">📌 원정마다 랜덤 부가 임무 1개 · 문파 공헌과 보상 상자 획득</div>`};
/* ===== END SECT BASE / SIDE MISSION / DISCIPLE ===== */

/* ===== FIELD UX / COMPANION / WORLD POPULATION MODULE ===== */
// 1) 상자를 플레이어/적 스케일에 맞추고, 시작 무기(검)도 확실히 파괴할 수 있도록 보강합니다.
const v440GenerateWorldBase=generateWorld;
generateWorld=function(){
  v440GenerateWorldBase();
  for(const c of chests){
    const tier=c.tier||0;
    c.r=tier>=1?10.5:9;
    const hp=24+tier*13+Math.min(15,currentStage*1.2);
    c.maxHp=hp;c.hp=hp;c.hitFlash=0;
  }
};
const v440SpawnRewardChestBase=spawnRewardChest;
spawnRewardChest=function(x,y,tier=1){
  const before=chests.length;v440SpawnRewardChestBase(x,y,tier);const c=chests[before];
  if(c){c.r=10.5+tier*1.15;c.maxHp=34+tier*13+Math.min(18,currentStage);c.hp=c.maxHp;c.hitFlash=0}
};

// 근접 무기의 실제 판정에도 상자 피해를 복원합니다. v4.1.5에서 적 판정만 남았던 부분의 보정입니다.
const v440HitSwordBase=hitSword;
hitSword=function(angle,wd,crit){
  v440HitSwordBase(angle,wd,crit);
  const evo=runEvolution==='infernoBlade',r=wd.range*(evo?1.16:1),arc=evo?.72:.58,dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1);
  for(const c of chests){if(c.broken)continue;const dx=c.x-player.x,dy=c.y-player.y,d=Math.hypot(dx,dy);if(d<=r+c.r&&Math.abs(angleDiff(Math.atan2(dy,dx),angle))<=arc)damageChest(c,dmg*.9,crit?'#ffd164':'#d8bd72')}
};
const v440HitHammerBase=hitHammer;
hitHammer=function(angle,wd,crit){
  v440HitHammerBase(angle,wd,crit);const evo=runEvolution==='aegisMaul',cx=player.x+Math.cos(angle)*(evo?48:42),cy=player.y+Math.sin(angle)*(evo?48:42),r=evo?74:54,dmg=player.damage*wd.damageMult*(evo?1.18:1)*(crit?1.8:1);
  for(const c of chests)if(!c.broken&&Math.hypot(c.x-cx,c.y-cy)<=r+c.r)damageChest(c,dmg*.9,crit?'#ffd164':'#c99b62')
};
const v440HitSpearBase=hitSpear;
hitSpear=function(angle,wd,crit){
  v440HitSpearBase(angle,wd,crit);const evo=runEvolution==='soulLance',r=wd.range*(evo?1.14:1),x2=player.x+Math.cos(angle)*r,y2=player.y+Math.sin(angle)*r,dmg=player.damage*wd.damageMult*(evo?1.12:1)*(crit?1.8:1);
  for(const c of chests)if(!c.broken&&pointSegDistance(c.x,c.y,player.x,player.y,x2,y2)<=c.r+8)damageChest(c,dmg*.9,crit?'#ffd164':'#d9d2b6')
};
let v440ChestStrikeTimer=0;
function v440UpdateChestStrike(dt){
  v440ChestStrikeTimer=Math.max(0,v440ChestStrikeTimer-dt);if(v440ChestStrikeTimer>0||!player)return;
  const wd=weaponDefs[player.weaponType]||weaponDefs.sword,maxD=['sword','hammer'].includes(player.weaponType)?68:player.weaponType==='spear'?92:Math.min(125,Math.max(82,wd.range*.34));
  let best=null,bd=maxD*maxD;for(const c of chests){if(c.broken)continue;const d=dist2(player.x,player.y,c.x,c.y);if(d<bd){bd=d;best=c}}
  if(!best)return;const a=Math.atan2(best.y-player.y,best.x-player.x);player.facing=a;damageChest(best,player.damage*(['sword','hammer','spear'].includes(player.weaponType)?.82:.62),'#d8bd72');
  attackEffects.push({type:'slash',x:player.x,y:player.y,angle:a,r:Math.min(maxD,54),life:.14,max:.14,color:'#cdb879'});v440ChestStrikeTimer=Math.max(.42,player.fireRate*.82)
}

// 2) 제자는 플레이어 능력치 프리셋이 아니라 실제로 따라다니며 싸우는 '동행 제자'로 변경합니다.
Object.assign(V43_DISCIPLES.swordsman,{need:1,desc:'근거리에서 검으로 적을 베는 동행 제자. 제자 숙소 Lv.1에서 해금.',apply:()=>{}});
Object.assign(V43_DISCIPLES.assassin,{need:2,desc:'원거리에서 비도를 던지는 동행 제자. 제자 숙소 Lv.2에서 해금.',apply:()=>{}});
Object.assign(V43_DISCIPLES.lancer,{need:3,desc:'긴 장창으로 일직선의 적을 관통하는 동행 제자. 제자 숙소 Lv.3에서 해금.',apply:()=>{}});
Object.assign(V43_DISCIPLES.brawler,{need:4,desc:'가까운 적 무리를 충격파로 공격하는 동행 제자. 제자 숙소 Lv.4에서 해금.',apply:()=>{}});
Object.assign(V43_DISCIPLES.healer,{need:5,desc:'전투 중 주기적으로 체력을 회복시키는 동행 제자. 제자 숙소 Lv.5에서 해금.',apply:()=>{}});
V43_BUILDINGS.dormitory.desc='본거지에 머물고 수련할 제자를 받아들입니다.';
V43_BUILDINGS.dormitory.effect='Lv.1~5마다 동행 제자 1명 해금';

v43EnsureProfile=function(){
  profile.sectContribution=Math.max(0,Number(profile.sectContribution)||0);
  profile.sectBuildings=profile.sectBuildings&&typeof profile.sectBuildings==='object'?profile.sectBuildings:{};
  for(const k of Object.keys(V43_BUILDINGS))profile.sectBuildings[k]=Math.max(0,Math.min(5,Number(profile.sectBuildings[k])||0));
  profile.sectManuals=profile.sectManuals&&typeof profile.sectManuals==='object'?profile.sectManuals:{};
  for(const m of V43_MANUALS)profile.sectManuals[m.id]=Math.max(0,Math.min(3,Number(profile.sectManuals[m.id])||0));
  const dorm=profile.sectBuildings.dormitory||0;
  if(profile.activeDisciple&&(!V43_DISCIPLES[profile.activeDisciple]||V43_DISCIPLES[profile.activeDisciple].need>dorm))profile.activeDisciple=null;
  profile.sideMissionsCompleted=Math.max(0,Number(profile.sideMissionsCompleted)||0);profile.version=Math.max(8,Number(profile.version)||0)
};
v43BuildBonus=function(){
  v43EnsureProfile();const b={damagePct:0,hpPct:0,movePct:0,fireRatePct:0,crit:0,damageReduction:0,regen:0,healPct:0,xpPct:0,shopPct:0},s=profile.sectBuildings;
  b.damagePct+=s.training*.04;b.xpPct+=s.library*.06;b.shopPct+=s.forge*.03;b.hpPct+=s.medicine*.04;b.healPct+=s.medicine*.06;
  for(const m of V43_MANUALS){const r=profile.sectManuals[m.id]||0;if(r)m.apply(b,r)}return b
};
v43UnlockedDisciples=function(){const dorm=profile.sectBuildings.dormitory||0;return Object.entries(V43_DISCIPLES).filter(([,d])=>d.need<=dorm)};
v43EnsureProfile();saveProfile();

if(document.getElementById('v43DiscipleBtn'))document.getElementById('v43DiscipleBtn').textContent='🧑‍🤝‍🧑 동행 제자';
const v440DiscTitle=document.querySelector('#v43DiscipleScreen h2');if(v440DiscTitle)v440DiscTitle.textContent='🧑‍🤝‍🧑 동행 제자';
const v440DiscSub=document.querySelector('#v43DiscipleScreen .subtitle');if(v440DiscSub)v440DiscSub.innerHTML='본거지의 <b>제자 숙소</b>를 발전시키면 제자가 한 명씩 해금됩니다. 원정 전 한 명을 선택하면 플레이어를 따라다니며 함께 전투합니다.';
v43RenderDisciples=function(){
  v43EnsureProfile();const dorm=profile.sectBuildings.dormitory||0,unlocked=v43UnlockedDisciples(),count=document.getElementById('v43DiscipleCount');if(count)count.textContent=`${unlocked.length} / ${Object.keys(V43_DISCIPLES).length}명 해금`;
  const list=document.getElementById('v43DiscipleList');if(!list)return;
  const none=`<div class="v43Card v43Disciple"><div class="ico">🚶</div><div><b>혼자 출전</b><p>동행 제자 없이 원정합니다.</p></div><button class="miniBtn ${!profile.activeDisciple?'active':''}" data-v440-disciple="">${!profile.activeDisciple?'선택 중':'선택'}</button></div>`;
  list.innerHTML=none+Object.entries(V43_DISCIPLES).map(([id,d])=>{const ok=dorm>=d.need,active=profile.activeDisciple===id;return `<div class="v43Card v43Disciple ${ok?'':'locked'}"><div class="ico">${d.icon}</div><div><b>${d.name}</b><p>${d.desc}${ok?'':`<br><b>제자 숙소 Lv.${d.need}</b> 필요`}</p></div><button class="miniBtn ${active?'active':''}" data-v440-disciple="${id}" ${ok?'':'disabled'}>${active?'선택 중':'선택'}</button></div>`}).join('');
  document.querySelectorAll('[data-v440-disciple]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.v440Disciple||null;profile.activeDisciple=id;saveProfile();v43RenderDisciples();renderHome();showToast(id?`${V43_DISCIPLES[id].icon} ${V43_DISCIPLES[id].name} 동행 준비`:'🚶 이번 원정은 혼자 출전합니다.')})
};

let v440Companion=null;
function v440CompanionAllowed(){const id=profile.activeDisciple,d=V43_DISCIPLES[id];return !!(id&&d&&(profile.sectBuildings.dormitory||0)>=d.need)}
function v440CreateCompanion(){if(!player||!v440CompanionAllowed())return null;return{id:profile.activeDisciple,x:player.x-24,y:player.y+20,attackCd:.5,supportCd:3.5,phase:rand(0,Math.PI*2)}}
function v440CompanionTarget(c,range){let best=null,bd=range*range;for(const e of enemies){if(e.hp<=0)continue;const d=dist2(c.x,c.y,e.x,e.y);if(d<bd){bd=d;best=e}}return best}
function v440UpdateCompanion(dt){
  const c=v440Companion;if(!c||!player)return;const face=player.facing||0,side=c.id==='assassin'?1:-1,tx=player.x-Math.cos(face)*28-Math.sin(face)*side*16,ty=player.y-Math.sin(face)*28+Math.cos(face)*side*16,dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);
  if(d>260){c.x=tx;c.y=ty}else{const k=Math.min(1,dt*7.5);c.x+=dx*k;c.y+=dy*k}c.attackCd-=dt;c.supportCd-=dt;
  if(c.id==='healer'&&c.supportCd<=0&&player.hp<player.maxHp*.96){const heal=Math.max(5,player.maxHp*.055);player.hp=Math.min(player.maxHp,player.hp+heal);floatText(player.x,player.y-26,`+${Math.round(heal)} HP`,'#8ebf91');attackEffects.push({type:'ward',x:player.x,y:player.y,r:24,life:.38,max:.38,color:'#8ebf91'});c.supportCd=7.2;showToast('🌿 소연의 치유')}
  if(c.attackCd>0)return;
  if(c.id==='swordsman'){const t=v440CompanionTarget(c,92);if(t){const a=Math.atan2(t.y-c.y,t.x-c.x);dealDirectDamage(t,player.damage*.42,false,'#c9bb8c');attackEffects.push({type:'slash',x:c.x,y:c.y,angle:a,r:38,life:.16,max:.16,color:'#c9bb8c'});c.attackCd=1.05}}
  else if(c.id==='assassin'){const t=v440CompanionTarget(c,285);if(t){const a=Math.atan2(t.y-c.y,t.x-c.x);createBullet(a,{speed:410,range:280,pierce:0,damageMult:1},false,{x:c.x,y:c.y,damage:player.damage*.34,r:2.5,shape:'dagger',weaponType:'skill',color:'#aeb6a5',maxRange:280});c.attackCd=.88}}
  else if(c.id==='lancer'){const t=v440CompanionTarget(c,175);if(t){const a=Math.atan2(t.y-c.y,t.x-c.x),x2=c.x+Math.cos(a)*165,y2=c.y+Math.sin(a)*165;attackEffects.push({type:'thrust',x:c.x,y:c.y,x2,y2,angle:a,life:.16,max:.16,color:'#c5c0a8'});for(const e of enemies)if(e.hp>0&&pointSegDistance(e.x,e.y,c.x,c.y,x2,y2)<=e.r+6)dealDirectDamage(e,player.damage*.40,false,'#c5c0a8');c.attackCd=1.2}}
  else if(c.id==='brawler'){const t=v440CompanionTarget(c,78);if(t){const r=52;attackEffects.push({type:'slam',x:c.x,y:c.y,r,life:.24,max:.24,color:'#b38c6c'});for(const e of enemies)if(e.hp>0&&Math.hypot(e.x-c.x,e.y-c.y)<=r+e.r)dealDirectDamage(e,player.damage*.48,false,'#b38c6c');c.attackCd=1.45}}
  else if(c.id==='healer'){const t=v440CompanionTarget(c,225);if(t){const a=Math.atan2(t.y-c.y,t.x-c.x);createBullet(a,{speed:360,range:220,pierce:0,damageMult:1},false,{x:c.x,y:c.y,damage:player.damage*.20,r:2.2,shape:'soulblade',weaponType:'skill',color:'#8ebf91',maxRange:220});c.attackCd=1.55}}
}
function v440DrawCompanion(){
  const c=v440Companion;if(!c)return;const id=c.id,accent={swordsman:'#bca66d',assassin:'#7d9783',lancer:'#9d8870',brawler:'#a56f5b',healer:'#86a77e'}[id]||'#a99a73',main={swordsman:'#4c5a55',assassin:'#303d38',lancer:'#5b5346',brawler:'#5a4036',healer:'#4d624c'}[id]||'#4c5147';ctx.save();ctx.translate(c.x,c.y+Math.sin(elapsed*6+c.phase)*.5);ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(0,8,7,2.2,0,0,Math.PI*2);ctx.fill();v420DrawRobe(ctx,main,accent,.62);ctx.fillStyle='#c69a75';ctx.beginPath();ctx.arc(0,-7.5,2.9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17140f';ctx.beginPath();ctx.arc(0,-9,3,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-.8,-11.5,1.6,3);ctx.strokeStyle=accent;ctx.lineWidth=1.2;if(id==='swordsman'){ctx.beginPath();ctx.moveTo(4,-1);ctx.lineTo(12,4);ctx.stroke()}else if(id==='assassin'){ctx.beginPath();ctx.moveTo(-5,1);ctx.lineTo(-10,5);ctx.moveTo(5,1);ctx.lineTo(10,5);ctx.stroke()}else if(id==='lancer'){ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(14,-3);ctx.stroke()}else if(id==='brawler'){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(-6,3,2,0,Math.PI*2);ctx.arc(6,3,2,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle='#b7a36a';ctx.beginPath();ctx.ellipse(7,2,3,4,0,0,Math.PI*2);ctx.fill()}ctx.restore()
}

// 3) 전투 정보는 필요한 순간에만 짧게 표시하고, 상시 HUD는 체력/경험치/시간 중심으로 간소화합니다.
const v440Style=document.createElement('style');v440Style.textContent=`
.hudTop .pill:nth-child(3),.hudTop .pill:nth-child(4){display:none!important}
#miniMap{width:64px!important;height:64px!important;border-radius:13px!important;opacity:.86}
#zoneBadge,#enemyGuide,#weaponBadge,#v43MissionBadge{transition:opacity .18s ease}
#v43MissionBadge{top:calc(env(safe-area-inset-top) + 76px)!important;min-width:0!important;max-width:68vw!important;padding:6px 9px!important}
#v43MissionBadge b{font-size:9px!important;margin:0!important}
@media (orientation:landscape){#miniMap{width:70px!important;height:70px!important}#v43MissionBadge{top:calc(env(safe-area-inset-top) + 56px)!important;max-width:48vw!important}}
`;document.head.appendChild(v440Style);
let v440MissionHideTimer=null,v440MissionShowDesc=true,v440ZoneTimer=null,v440GuideTimer=null,v440WeaponTimer=null;
function v440HideLater(el,ms,key){if(!el)return;el.classList.remove('hidden');if(key)clearTimeout(key);return setTimeout(()=>el.classList.add('hidden'),ms)}
v43UpdateMissionHUD=function(){
  if(!v43Mission){v43MissionBadge.classList.add('hidden');return}const extra=v440MissionShowDesc&&!v43Mission.complete?`<span style="display:block;margin-top:2px;font-size:8px;color:#aaa18d">${v43Mission.desc}</span>`:'';
  v43MissionBadge.innerHTML=`<b>${v43Mission.complete?'✅':'📌'} ${v43Mission.icon} ${v43Mission.name} · ${v43Mission.progress}/${v43Mission.goal}</b>${extra}`;
  if(running){v43MissionBadge.classList.remove('hidden');clearTimeout(v440MissionHideTimer);v440MissionHideTimer=setTimeout(()=>{v43MissionBadge.classList.add('hidden');v440MissionShowDesc=false},v43Mission.complete?2200:(v440MissionShowDesc?4200:1800))}
};
const v440SyncEquipBase=syncPlayerToEquipment;syncPlayerToEquipment=function(...args){const r=v440SyncEquipBase(...args);if(running){clearTimeout(v440WeaponTimer);weaponBadge.classList.remove('hidden');v440WeaponTimer=setTimeout(()=>weaponBadge.classList.add('hidden'),1700)}return r};

// 4) 맵 전체에 기본 개체군을 깔고, 플레이어가 멀리 이동해도 주변 적 밀도가 비지 않도록 재배치합니다.
let v440PopulationTimer=0;
function v440WorldEnemyPoint(){for(let n=0;n<80;n++){const x=rand(90,WORLD_W-90),y=rand(90,WORLD_H-90);if(player&&dist2(x,y,player.x,player.y)<420*420)continue;if(obstacles.some(o=>dist2(x,y,o.x,o.y)<(o.r+38)*(o.r+38)))continue;return{x,y}}return{x:rand(100,WORLD_W-100),y:rand(100,WORLD_H-100)}}
function v440SeedWorldEnemies(){
  if(!player)return;['basic','fast','tank','ranged','charger'].forEach(t=>seenEnemyTypes.add(t));const target=72+Math.min(24,currentStage*2);
  while(enemies.length<target&&enemies.length<MAX_LIVE_ENEMIES){const before=enemies.length;spawnEnemy();const e=enemies[before];if(!e)break;const p=v440WorldEnemyPoint();e.x=p.x;e.y=p.y}
}
function v440MaintainWorldPopulation(dt){
  if(!player||stageExpired)return;v440PopulationTimer-=dt;if(v440PopulationTimer>0)return;v440PopulationTimer=.75;
  const localR=Math.max(720,Math.hypot(W,H)*.82),localR2=localR*localR,targetLocal=18+Math.min(10,Math.floor(stageProgress()*10))+Math.min(5,Math.floor((currentStage-1)/3));
  let local=0;for(const e of enemies)if(e.hp>0&&dist2(player.x,player.y,e.x,e.y)<localR2)local++;
  let need=Math.min(6,Math.max(0,targetLocal-local));if(need>0){const far=enemies.filter(e=>e.hp>0&&!['elite','midboss','boss'].includes(e.type)&&dist2(player.x,player.y,e.x,e.y)>(localR*1.65)**2).sort((a,b)=>dist2(player.x,player.y,b.x,b.y)-dist2(player.x,player.y,a.x,a.y));while(need-->0){let e=far.shift();if(e){const p=spawnPointAroundPlayer();e.x=p.x;e.y=p.y;e.attackTimer=rand(.7,1.8);e.chargeState=0}else if(enemies.length<MAX_LIVE_ENEMIES)spawnEnemy()}}
  const ordinary=enemies.filter(e=>e.hp>0&&!['midboss','boss'].includes(e.type)).length;if(ordinary<70&&enemies.length<MAX_LIVE_ENEMIES){const before=enemies.length;spawnEnemy();const e=enemies[before];if(e){const p=v440WorldEnemyPoint();e.x=p.x;e.y=p.y}}
}

const v440ResetBase=reset;reset=function(){v440MissionShowDesc=true;v440ResetBase();v440ChestStrikeTimer=0;v440PopulationTimer=.35;v440SeedWorldEnemies();v440Companion=v440CreateCompanion()};
const v440UpdateBase=update;update=function(dt){v440UpdateBase(dt);if(!running||!player||paused)return;v440UpdateChestStrike(dt);v440UpdateCompanion(dt);v440MaintainWorldPopulation(dt)};
const v440DrawBase=draw;draw=function(){v440DrawBase();if(!running||!v440Companion)return;ctx.save();ctx.translate(-camera.x,-camera.y);v440DrawCompanion();ctx.restore()};
const v440StartBase=start;start=function(){const r=v440StartBase();clearTimeout(v440ZoneTimer);clearTimeout(v440GuideTimer);clearTimeout(v440WeaponTimer);zoneBadge.classList.remove('hidden');enemyGuide.classList.remove('hidden');weaponBadge.classList.remove('hidden');v440ZoneTimer=setTimeout(()=>zoneBadge.classList.add('hidden'),2400);v440GuideTimer=setTimeout(()=>enemyGuide.classList.add('hidden'),3000);v440WeaponTimer=setTimeout(()=>weaponBadge.classList.add('hidden'),2800);v43UpdateMissionHUD();return r};

const v440RenderHomeBase=renderHome;renderHome=function(){v440RenderHomeBase();v43EnsureProfile();if(v43Summary){const cells=v43Summary.querySelectorAll('div');if(cells[2]){const d=profile.activeDisciple&&V43_DISCIPLES[profile.activeDisciple];cells[2].innerHTML=`<small>동행 제자</small><b>${d?`${d.icon} ${d.name.split('·')[0].trim()}`:'없음'}</b>`}}};
/* ===== END FIELD UX / COMPANION / WORLD POPULATION ===== */



window.addEventListener('error' ,e=>{const err=e.error||new Error((e.message||'Resource/runtime error')+' @ '+(e.filename||'')+':'+(e.lineno||0)+':'+(e.colno||0));v412Fatal(err,'WINDOW')});
addEventListener('touchstart',joyStart,{passive:false});addEventListener('touchmove',e=>{if(running)e.preventDefault();joyMove(e)},{passive:false});addEventListener('touchend',joyEnd,{passive:false});addEventListener('touchcancel',joyEnd,{passive:false});addEventListener('mousedown',joyStart);addEventListener('mousemove',joyMove);addEventListener('mouseup',joyEnd);addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
$('startBtn').onclick=start;$('retryBtn').onclick=start;$('equipBtn').onclick=()=>{equipmentReturn='home';inventoryFilter='all';startScreen.classList.add('hidden');renderEquipment();equipmentScreen.classList.remove('hidden')};$('equipBackBtn').onclick=()=>{equipmentScreen.classList.add('hidden');renderHome();if(equipmentReturn==='result')gameover.classList.remove('hidden');else startScreen.classList.remove('hidden')};$('autoEquipBtn').onclick=autoEquip;$('skillBtn').onclick=()=>openSkillScreen('home');$('skillBackBtn').onclick=closeSkillScreen;$('shopBtn').onclick=()=>openShop('home');$('resultShopBtn').onclick=()=>openShop('result');$('shopBackBtn').onclick=closeShop;$('shopBuyTab').onclick=()=>{shopMode='buy';renderShop()};$('shopSellTab').onclick=()=>{shopMode='sell';renderShop()};$('shopRefreshBtn').onclick=refreshShop;$('homeBtn').onclick=()=>{gameover.classList.add('hidden');startScreen.classList.remove('hidden');renderHome()};$('resultEquipBtn').onclick=()=>{equipmentReturn='result';inventoryFilter='all';gameover.classList.add('hidden');renderEquipment();equipmentScreen.classList.remove('hidden')};document.querySelectorAll('.filterBtn').forEach(b=>b.onclick=()=>{inventoryFilter=b.dataset.filter;renderEquipment()});$('howBtn').onclick=()=>alert(`☯️ 무림 생존록 · 7분 원정
1~4 스테이지에서는 청운문의 산문·영맥·제자·비급을 확보하며 문파를 키웁니다. 매 5번째 스테이지는 경쟁 문파의 총단을 공격하는 문파전입니다. 세로·가로 화면을 모두 지원합니다.

📦 파괴 가능한 보급 상자
기존 보물상자와 회복 샘은 제거되었습니다. 맵의 상자는 자동으로 열리지 않으며 무기로 공격해 파괴해야 합니다. 상자에서는 골드, 장비, 회복 단약, 스킬이 확률적으로 나옵니다.

🧪 회복 단약
일반 적 처치 시 낮은 확률로 회복 단약이 떨어집니다. 정예 적은 조금 더 높은 확률로 회복 단약이나 보상 상자를 남깁니다.

⚔️ 무기
무기 숙련 레벨은 제거되었습니다. 전투 중 얻은 무기는 현재 장착 무기와 바로 비교한 뒤 장착, 보관, 버리기를 선택합니다.

✨ 스킬 획득·융합
스테이지 시작 시 보유 스킬은 0개입니다. 상자에서 획득한 모든 스킬은 슬롯 제한 없이 자동 발동합니다. 일반 스킬 두 종류만으로는 융합되지 않으며, 각 조합에 지정된 희귀 핵심 스킬까지 확보해야 상위 스킬이 자동 완성됩니다.

👾 강한 적 보상
정예·중간 보스·최종 보스는 장비를 바로 떨어뜨리지 않고 파괴 가능한 보상 상자를 남깁니다.

🏮 강호 상단
문파 자금으로 장비를 구매·판매할 수 있습니다. 스테이지를 클리어한 뒤 처음 상단에 들어오면 물품이 자동으로 새로 입고되며, 추가 자금으로 다시 리로드할 수도 있습니다. 무공은 전투 중 상자에서만 획득합니다.`);itemModal.addEventListener('click',e=>{if(e.target===itemModal&&!pendingSkillLoot)closeItemModal()});
currentMap=MAP_THEMES[0];renderHome();drawBackground();
const installBtn=$('installBtn');
if(installBtn&&!isStandalone){
  if(isIos){installBtn.classList.remove('hidden');installBtn.textContent='📲 홈 화면에 설치';}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;installBtn.classList.remove('hidden');installBtn.textContent='📲 앱으로 설치';});
  installBtn.onclick=async()=>{
    if(isIos&&!deferredInstallPrompt){alert('iPhone/iPad 설치 방법\n\nSafari 하단의 공유 버튼(□↑) → “홈 화면에 추가” → “추가”를 누르면 앱처럼 설치됩니다.');return;}
    if(!deferredInstallPrompt){alert('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택해 주세요.');return;}
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt=null;
    installBtn.classList.add('hidden');
  };
}
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installBtn)installBtn.classList.add('hidden');});
if('serviceWorker'in navigator){
  addEventListener('load',async()=>{
    try{const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});reg.update();}
    catch(e){console.warn('Service worker registration failed',e);}
  });
}

/* ===== CURRENT WUXIA MERCHANT / LEGACY SAVE MIGRATION ===== */
const WUXIA_PREFIXES={
 common:['낡은','단련된','수련용'],rare:['청명의','정예의','백련의'],epic:['명문의','현철의','절정의'],legendary:['대종사의','무림명기의','천강의'],mythic:['천하제일의','무극의','태허의']
};
function generateWuxiaItem(itemLevel=1,forceBetter=false,forcedSlot=null){
 let slot=forcedSlot;if(!slot){const r=Math.random();slot=r<.25?'weapon':r<.72?pick(['head','chest','gloves','legs','boots']):'accessory'}
 const base=pick(itemBases[slot]),rarity=chooseRarity(forceBetter),ri=rarityInfo[rarity],mult=ri.mult*(1+(itemLevel-1)*.13),stats={};
 for(const [k,v] of Object.entries(base.stats)){const n=v*mult*rand(.9,1.12);stats[k]=k==='regen'?round(n,2):round(n,1)}
 const affixes=[],pool=affixPools[slot];for(let n=0;n<ri.affixes;n++){const candidates=pool.filter(x=>!affixes.some(a=>a.key===x[0]));if(!candidates.length)break;const [k,v,label]=pick(candidates),amount=v*(1+(itemLevel-1)*.08)*rand(.85,1.18)*(rarity==='mythic'?1.15:1);stats[k]=round((stats[k]||0)+amount,k==='regen'?2:1);affixes.push({key:k,name:`${label} · ${statLabel(k,amount)[0]} ${statLabel(k,amount)[1]}`})}
 let setId=null;if(['head','chest','gloves','legs','boots'].includes(slot)&&['epic','legendary','mythic'].includes(rarity)&&Math.random()<(rarity==='mythic'?.7:rarity==='legendary'?.5:.34))setId=pick(Object.keys(setDefs));
 const setPrefix=setId?`${setDefs[setId].name} · `:'';const item={id:uid(),slot,name:`${setPrefix}${pick(WUXIA_PREFIXES[rarity])} ${base.name}`,icon:base.icon,rarity,level:itemLevel,stats,affixes,weaponType:base.weaponType||null,setId};item.score=calcItemScore(item);return item
}
generateItem=generateWuxiaItem;
createShopStock=function(){
 const stage=Math.max(1,profile.highestStage||1),stock=[],armorSlots=['head','chest','gloves','legs','boots'],missingArmor=armorSlots.filter(s=>!profile.equipped?.[s]);
 const firstArmor=missingArmor.length?pick(missingArmor):pick(armorSlots),secondArmor=(missingArmor.filter(s=>s!==firstArmor)[0]||pick(armorSlots.filter(s=>s!==firstArmor)));
 const offers=[generateWuxiaItem(stage,Math.random()<.32,'weapon'),generateWuxiaItem(stage,Math.random()<.34,firstArmor),generateWuxiaItem(stage,Math.random()<.38,secondArmor),generateWuxiaItem(stage,Math.random()<.38,'accessory')];
 const missingAll=['head','chest','gloves','legs','boots','accessory'].filter(s=>s==='accessory'?!(profile.equipped?.accessory1&&profile.equipped?.accessory2&&profile.equipped?.accessory3):!profile.equipped?.[s]);offers.push(generateWuxiaItem(stage,true,missingAll.length?pick(missingAll):null));
 for(const item of offers)stock.push({offerId:uid(),type:'item',item,price:shopItemPrice(item),sold:false});profile.shopStock=stock;saveProfile()
};
const LEGACY_WEAPON_ENDINGS={sword:/((장검|청강검))$/,dagger:/((단검|비도))$/,bow:/((활|철궁))$/,staff:/((지팡이|죽장|철선|백우선))$/,hammer:/((해머|철추))$/,spear:/((장창|창))$/,axe:/((도끼|쌍월도|쌍월륜))$/,grimoire:/((마법서|검결 비급|검부))$/};
if(!profile.wuxiaUnifiedV442){for(const item of profile.inventory||[]){if(!item?.weaponType||!weaponDefs[item.weaponType])continue;const d=weaponDefs[item.weaponType],re=LEGACY_WEAPON_ENDINGS[item.weaponType];item.icon=d.icon;if(re&&re.test(item.name||''))item.name=(item.name||'').replace(re,d.name)}profile.shopStock=[];profile.shopRefreshes=0;profile.wuxiaUnifiedV442=true;saveProfile()}
try{renderHome()}catch(e){}
/* ===== END CURRENT WUXIA MERCHANT ===== */


/* ===== v4.5.1 PICTORIAL ITEM ICON MIGRATION ===== */
function v451PictureIcon(item){
 if(!item)return '🎒';
 if(item.weaponType&&weaponDefs[item.weaponType])return weaponDefs[item.weaponType].icon;
 const n=String(item.name||'');
 if(item.slot==='head')return /야행/.test(n)?'🥷':/도인/.test(n)?'👒':'🪖';
 if(item.slot==='chest')return /장포/.test(n)?'🧥':/중갑|호신/.test(n)?'🛡️':'🥋';
 if(item.slot==='gloves')return /철사장/.test(n)?'🥊':'🧤';
 if(item.slot==='legs')return '👖';
 if(item.slot==='boots')return '🥾';
 if(item.slot==='accessory'){
   if(/탐물/.test(n))return '🧭';if(/전표/.test(n))return '🪙';if(/회춘/.test(n))return '💚';if(/질풍/.test(n))return '💨';if(/호신/.test(n))return '🪬';if(/벽력/.test(n))return '⚡';return '📿';
 }
 return item.icon||'🎒';
}
if(!profile.pictureItemIconsV451){
 for(const item of profile.inventory||[])item.icon=v451PictureIcon(item);
 for(const offer of profile.shopStock||[])if(offer?.item)offer.item.icon=v451PictureIcon(offer.item);
 profile.pictureItemIconsV451=true;saveProfile();
}
try{renderHome()}catch(e){}
/* ===== END v4.5.1 PICTORIAL ITEM ICON MIGRATION ===== */
