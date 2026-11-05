/* Murim Survival v4.8.4 — combat identities, weapon techniques, class/sect resonance.
 * Event-driven hooks keep per-frame Canvas work minimal on iPhone.
 */
(() => {
  'use strict';
  const TECHNIQUES = {
    sword:[
      {id:'sword-flow',name:'연환검식',desc:'세 번째 검격마다 부채꼴 추가 참격',symbol:'⚔️'},
      {id:'sword-scar',name:'혈흔검식',desc:'검격이 적에게 지속 출혈 부여',symbol:'🩸'}
    ],
    spear:[
      {id:'spear-edge',name:'관일창식',desc:'장창 끝에서 추가 관통 검기 발생',symbol:'🔱'},
      {id:'spear-wind',name:'파풍창식',desc:'장창 타격이 적을 밀어내고 둔화',symbol:'💨'}
    ],
    dagger:[
      {id:'dagger-venom',name:'독영비도',desc:'비도 명중 시 중독 피해',symbol:'☠️'},
      {id:'dagger-fan',name:'환영비도',desc:'비도 4발마다 분신 비도 추가 발사',symbol:'🥷'}
    ],
    bow:[
      {id:'bow-pierce',name:'천공철시',desc:'적 관통 횟수 +2, 피해 강화',symbol:'🏹'},
      {id:'bow-storm',name:'낙뢰철시',desc:'화살이 인접한 적에게 전격 연쇄',symbol:'⚡'}
    ],
    staff:[
      {id:'staff-frost',name:'빙혼장풍',desc:'장풍의 냉기 확산, 적 둔화',symbol:'❄️'},
      {id:'staff-sun',name:'태양장풍',desc:'장풍 폭발 범위 및 피해 증가',symbol:'☀️'}
    ],
    grimoire:[
      {id:'grimoire-seeker',name:'추혼검부',desc:'검부의 유도력 증가',symbol:'📜'},
      {id:'grimoire-echo',name:'쌍령검부',desc:'검부 명중 시 추가 연쇄 검기',symbol:'✨'}
    ],
    hammer:[
      {id:'hammer-quake',name:'지진철추',desc:'두 번째 강타마다 광역 충격파',symbol:'🌋'},
      {id:'hammer-guard',name:'금강철추',desc:'강타할 때마다 호신 보호막 획득',symbol:'🛡️'}
    ],
    axe:[
      {id:'axe-ember',name:'염화월륜',desc:'월륜이 화염 폭발과 화상을 유발',symbol:'🔥'},
      {id:'axe-gale',name:'질풍월륜',desc:'월륜이 추가 관통 및 둔화',symbol:'🌪️'}
    ]
  };
  const TRAITS={
    swordsman:{name:'연검기',text:'근접 공격 네 번마다 추가 검기 발동',symbol:'⚔️'},
    shadow:{name:'그림자 낙인',text:'비도·활 명중 시 낙인 중첩, 3중첩 폭발',symbol:'🥷'},
    sage:{name:'내공 공명',text:'무공 3회 발동마다 해당 무공 메아리 재발동',symbol:'☯️'},
    guardian:{name:'금강반격',text:'피해를 받아 반격 게이지를 채우면 광역 충격파',symbol:'🛡️'}
  };
  const SYNERGY={
    swordsman:[
      {school:'infernoCyclone',name:'적염검기',desc:'연검기에 화상 추가'},
      {school:'tempestRift',name:'풍압연검',desc:'연검기가 적을 둔화·밀어냄'}
    ],
    shadow:[
      {school:'eclipseRay',name:'월영암습',desc:'그림자 낙인 폭발 범위·피해 증가'},
      {school:'stormNova',name:'빙뢰암기',desc:'낙인이 적을 둔화, 폭발 시 연쇄 타격'}
    ],
    sage:[
      {school:'stormNova',name:'뇌령공명',desc:'무공 2회마다 내공 공명 발동'},
      {school:'verdantPlague',name:'청목기맥',desc:'내공 공명 발동 시 체력 회복'}
    ],
    guardian:[
      {school:'astralAegis',name:'천성호체',desc:'금강반격 시 보호막 충전'},
      {school:'infernoCyclone',name:'적염반격',desc:'금강반격에 화상 부여'}
    ]
  };
  const techById=id=>{
    for(const list of Object.values(TECHNIQUES)){
      const t=list.find(x=>x.id===id);if(t)return t;
    }
    return null;
  };
  const el=id=>document.getElementById(id);
  const equippedWeapon=()=>equippedItem('weapon');
  const classId=()=>player?.v483ClassId || profile.selectedClass || 'swordsman';
  const selectedSchools=()=>Array.isArray(player?.v482Paths)?player.v482Paths:[];
  const hasSchool=id=>selectedSchools().some(p=>p.id===id);
  const hasSynergy=id=>hasSchool(id);
  const currentTech=()=>player?.v484Technique||equippedWeapon()?.v484Technique||null;
  const fmtNum=n=>Number.isFinite(n)?Math.round(n*10)/10:0;
  const techniqueFor=item=> {
    if(!item||item.slot!=='weapon'||!TECHNIQUES[item.weaponType])return null;
    const list=TECHNIQUES[item.weaponType];
    if(list.some(t=>t.id===item.v484Technique))return item.v484Technique;
    const key=String(item.id||item.name||item.weaponType);
    let hash=0;for(let i=0;i<key.length;i++)hash=((hash*31)+key.charCodeAt(i))|0;
    item.v484Technique=list[(hash>>>0)%list.length].id;
    const desc=list.find(t=>t.id===item.v484Technique);
    item.affixes=Array.isArray(item.affixes)?item.affixes:[];
    if(!item.affixes.some(a=>a.key==='v484Technique')){
      item.affixes.push({key:'v484Technique',name:'전용 절기 · '+desc.name+' — '+desc.desc});
    }
    return item.v484Technique;
  };
  const randomTechnique=item=>{
    if(!item||item.slot!=='weapon'||!TECHNIQUES[item.weaponType])return;
    const list=TECHNIQUES[item.weaponType];
    item.v484Technique=list[Math.floor(Math.random()*list.length)].id;
    techniqueFor(item);
  };
  function refreshWeapon(){
    if(!player)return;
    const item=equippedWeapon();
    player.v484Technique=techniqueFor(item);
    player.v484WeaponName=item?.name||'맨손';
  }
  const originalGenerate=generateItem;
  generateItem=function(level,better){
    const item=originalGenerate(level,better);
    if(item?.slot==='weapon')randomTechnique(item);
    return item;
  };
  const originalReset=reset;
  reset=function(){
    const value=originalReset();
    if(player){
      player.v484SwordsmanHits=0;
      player.v484ShadowMarks=0;
      player.v484SageCasts=0;
      player.v484GuardCharge=0;
      player.v484MeleeCount=0;
      player.v484ShotCount=0;
      player.v484DotAccumulator=0;
      player.v484SageEchoAt=0;
      player.v484ShadowBurstAt=0;
      player.v484SwordsmanAt=0;
      player.v484GuardAt=0;
      refreshWeapon();
    }
    return value;
  };
  const originalSync=syncPlayerToEquipment;
  syncPlayerToEquipment=function(oldStats,oldType){
    const r=originalSync(oldStats,oldType);
    refreshWeapon();
    return r;
  };
  // Damage over time is recorded on each enemy and processed at 4 Hz,
  // avoiding per-frame animation nodes and timers.
  function dot(e,dps,time,color){
    if(!e||e.hp<=0)return;
    const prev=e.v484Dot;
    if(!prev || prev.life<=0 || dps>prev.dps){
      e.v484Dot={dps,life:Math.min(5,time),color};
    }else prev.life=Math.min(5,Math.max(prev.life,time));
  }
  function pulse(x,y,r,color,duration=.30){
    attackEffects.push({type:'skillRing',x,y,r,life:duration,max:duration,color});
  }
  function strikeArea(x,y,r,dmg,color,opts={}){
    let hits=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const dx=e.x-x,dy=e.y-y;
      if(dx*dx+dy*dy>(r+e.r)*(r+e.r))continue;
      e.hp-=dmg;hits++;
      if(opts.slow)e.slow=Math.max(e.slow||0,opts.slow);
      if(opts.dot)dot(e,opts.dot,2.5,color);
      if(opts.push){
        const len=Math.hypot(dx,dy)||1;
        e.x+=dx/len*opts.push;e.y+=dy/len*opts.push;
      }
    }
    pulse(x,y,r,color);
    return hits;
  }
  function showProc(msg,cdKey,seconds=1.7){
    if(!player)return;
    const stamp=elapsed;
    if(stamp<(player[cdKey]||-999)+seconds)return;
    player[cdKey]=stamp;
    showToast(msg);
  }
  // Basic melee hooks: one class action per actual strike, not per target.
  function afterMelee(type,angle,wd,crit){
    if(!running||!player||player.weaponType!==type)return;
    const tech=currentTech(),c=classId();
    player.v484MeleeCount=(player.v484MeleeCount||0)+1;
    const f=player.v484MeleeCount;
    if(tech==='sword-flow'&&f%3===0){
      const x=player.x+Math.cos(angle)*55,y=player.y+Math.sin(angle)*55;
      strikeArea(x,y,72,player.damage*.5,'#e0bf85');
      showProc('⚔️ 연환검식 · 추가 참격','v484MsgWeapon',2.5);
    }else if(tech==='sword-scar'){
      for(const e of enemies){
        const dx=e.x-player.x,dy=e.y-player.y;
        if(dx*dx+dy*dy>110*110)continue;
        if(Math.abs(angleDiff(Math.atan2(dy,dx),angle))>.85)continue;
        dot(e,Math.max(2,player.damage*.22),2.6,'#ff6a78');
      }
    }else if(tech==='spear-edge'&&f%2===0){
      const x=player.x+Math.cos(angle)*145,y=player.y+Math.sin(angle)*145;
      strikeArea(x,y,55,player.damage*.58,'#d3e7f2');
    }else if(tech==='spear-wind'){
      for(const e of enemies){
        if(e.hp<=0)continue;
        const dx=e.x-player.x,dy=e.y-player.y;
        if(dx*dx+dy*dy>180*180||Math.abs(angleDiff(Math.atan2(dy,dx),angle))>.36)continue;
        const len=Math.hypot(dx,dy)||1;
        e.x+=dx/len*16;e.y+=dy/len*16;
        e.slow=Math.max(e.slow||0,1.1);
      }
    }else if(tech==='hammer-quake'&&f%2===0){
      strikeArea(player.x,player.y,118,player.damage*.48,'#f2bd7e');
    }else if(tech==='hammer-guard'){
      player.shield=Math.min(player.maxHp*.28,(player.shield||0)+3.5);
    }
    if(c==='swordsman'&&(type==='sword'||type==='spear')){
      player.v484SwordsmanHits=(player.v484SwordsmanHits||0)+1;
      if(player.v484SwordsmanHits>=4){
        player.v484SwordsmanHits=0;
        const fire=hasSynergy('infernoCyclone'),storm=hasSynergy('tempestRift');
        const color=fire?'#ff895f':storm?'#97e8c5':'#d8f1d6';
        const x=player.x+Math.cos(angle)*65,y=player.y+Math.sin(angle)*65;
        strikeArea(x,y,96,player.damage*(fire?.95:.72),color,{
          dot:fire?player.damage*.19:0,slow:storm?1.8:0,push:storm?18:0
        });
        showProc('⚔️ '+(fire?'적염검기':storm?'풍압연검':'연검기')+' 발동!','v484MsgTrait',1.6);
      }
    }
  }
  for(const type of ['sword','spear','hammer']){
    if(type==='sword'){
      const old=hitSword;hitSword=function(angle,wd,crit){const r=old(angle,wd,crit);afterMelee(type,angle,wd,crit);return r};
    }else if(type==='spear'){
      const old=hitSpear;hitSpear=function(angle,wd,crit){const r=old(angle,wd,crit);afterMelee(type,angle,wd,crit);return r};
    }else {
      const old=hitHammer;hitHammer=function(angle,wd,crit){const r=old(angle,wd,crit);afterMelee(type,angle,wd,crit);return r};
    }
  }
  // Projectiles use their existing collision/rendering; the weapon technique
  // changes their flight and hit behavior, without additional assets.
  const baseCreate=createBullet;
  createBullet=function(angle,wd,crit,extra={}){
    const before=bullets.length;
    const result=baseCreate(angle,wd,crit,extra);
    if(!player||bullets.length<=before)return result;
    const b=bullets[bullets.length-1];
    if(b.weaponType==='skill')return result;
    const tech=currentTech();
    b.v484Technique=tech;
    player.v484ShotCount=(player.v484ShotCount||0)+1;
    if(tech==='dagger-venom')b.v484Dot='poison';
    else if(tech==='dagger-fan'&&player.v484ShotCount%4===0){
      const echoAngle=angle+.18;
      baseCreate(echoAngle,wd,crit,{...extra,damage:b.damage*.55,color:'#c4bedb',shape:'dagger'});
    }else if(tech==='bow-pierce'){b.pierce+=2;b.damage*=1.12}
    else if(tech==='bow-storm'){b.chain=Math.max(b.chain,2);b.color='#e3d67b'}
    else if(tech==='staff-frost'){b.slow=Math.max(b.slow,1.7);b.splash=Math.max(b.splash,32)}
    else if(tech==='staff-sun'){b.splash=Math.max(b.splash,68);b.damage*=1.12;b.color='#ffbc7d'}
    else if(tech==='grimoire-seeker'){b.homing=Math.max(b.homing,5);b.pierce+=1}
    else if(tech==='grimoire-echo'){b.chain=Math.max(b.chain,2)}
    else if(tech==='axe-ember'){b.splash=Math.max(b.splash,44);b.v484Dot='fire';b.color='#ff9470'}
    else if(tech==='axe-gale'){b.pierce+=1;b.slow=Math.max(b.slow,1.45)}
    if(classId()==='shadow'&&hasSchool('stormNova')){
      b.slow=Math.max(b.slow,.55);
    }
    return result;
  };
  const baseDamageEnemy=damageEnemy;
  damageEnemy=function(e,b){
    if(!player||!e||e.hp<=0)return baseDamageEnemy(e,b);
    const prior=e.hp;
    const result=baseDamageEnemy(e,b);
    if(e.hp>=prior||b.weaponType==='skill')return result;
    if(b.v484Dot==='poison')dot(e,Math.max(2,player.damage*.28),2.5,'#8ed489');
    else if(b.v484Dot==='fire')dot(e,Math.max(2,player.damage*.24),2.4,'#f4a375');
    if(classId()==='shadow'&&(player.weaponType==='dagger'||player.weaponType==='bow')){
      e.v484ShadowMarks=Math.min(3,(e.v484ShadowMarks||0)+1);
      if(hasSynergy('stormNova'))e.slow=Math.max(e.slow||0,1.4);
      if(e.v484ShadowMarks>=3){
        e.v484ShadowMarks=0;
        const moon=hasSynergy('eclipseRay'),storm=hasSynergy('stormNova');
        const radius=moon?84:storm?65:49;
        const dmg=player.damage*(moon?1.20:.78);
        strikeArea(e.x,e.y,radius,dmg,moon?'#b9a0ee':storm?'#92e6ff':'#b6b5ce',
          {slow:storm?1.2:0});
        showProc('🥷 '+(moon?'월영암습':storm?'빙뢰암기':'그림자 낙인')+' 폭발','v484MsgTrait',1.7);
      }
    }
    return result;
  };
  const baseCast=castSkill;
  castSkill=function(id){
    const r=baseCast(id);
    if(!running||!player||classId()!=='sage'||!skillDefs[id])return r;
    player.v484SageCasts=(player.v484SageCasts||0)+1;
    const storm=hasSynergy('stormNova'),verdant=hasSynergy('verdantPlague');
    if(player.v484SageCasts<(storm?2:3)||elapsed<(player.v484SageEchoAt||0)+1.6)return r;
    player.v484SageCasts=0;player.v484SageEchoAt=elapsed;
    const damage=player.damage;
    try{
      player.damage=damage*.48;
      baseCast(id);
    }finally{player.damage=damage}
    pulse(player.x,player.y,55,storm?'#9bdfff':verdant?'#a0eab2':'#b8caff',.35);
    if(verdant)player.hp=Math.min(player.maxHp,player.hp+Math.max(3,player.maxHp*.035));
    showProc('☯️ '+(storm?'뇌령공명':verdant?'청목기맥':'내공 공명')+' · 무공 재발동','v484MsgTrait',1.4);
    return r;
  };
  const baseDamagePlayer=damagePlayer;
  damagePlayer=function(amount,color,slow){
    const before=player?player.hp:0,shieldBefore=player?.shield||0;
    const r=baseDamagePlayer(amount,color,slow);
    if(!player||player.hp<=0||!running||classId()!=='guardian')return r;
    const taken=Math.max(0,before-player.hp)+.55*Math.max(0,shieldBefore-(player.shield||0));
    if(taken<=0)return r;
    const limit=20+player.maxHp*.075;
    player.v484GuardCharge=(player.v484GuardCharge||0)+taken;
    if(player.v484GuardCharge>=limit&&elapsed>=(player.v484GuardAt||0)+.8){
      player.v484GuardCharge=0;player.v484GuardAt=elapsed;
      const star=hasSynergy('astralAegis'),fire=hasSynergy('infernoCyclone');
      strikeArea(player.x,player.y,137,player.damage*(fire?1.2:.85),
        fire?'#ff9370':star?'#ead7a9':'#d9b17e',
        {slow:1.2,dot:fire?player.damage*.23:0});
      if(star)player.shield=Math.min(player.maxHp*.40,(player.shield||0)+10+player.maxHp*.035);
      showProc('🛡️ '+(star?'천성호체':fire?'적염반격':'금강반격')+' 발동','v484MsgTrait',1.1);
    }
    return r;
  };
  const baseUpdate=update;
  update=function(dt){
    const r=baseUpdate(dt);
    if(!running||!player||paused)return r;
    player.v484DotAccumulator=(player.v484DotAccumulator||0)+dt;
    if(player.v484DotAccumulator>=.25){
      const tick=Math.min(.5,player.v484DotAccumulator);
      player.v484DotAccumulator=0;
      for(const e of enemies){
        const d=e.v484Dot;if(!d||d.life<=0||e.hp<=0)continue;
        e.hp-=d.dps*tick;d.life-=tick;
      }
    }
    return r;
  };

  // UI communicates the existing mechanics without affecting hit rates.
  const badge=document.createElement('div');
  badge.id='v484CombatIdentity';badge.className='hidden';
  document.body.appendChild(badge);
  let badgeKey='',badgeTimer=0;
  function refreshBadge(force=false){
    if(!running||!player){badge.classList.add('hidden');return}
    const c=classId(),t=techById(currentTech()),trait=TRAITS[c],parts=SYNERGY[c]||[];
    if(!trait)return;
    const synergies=parts.filter(p=>hasSchool(p.school));
    const key=c+'|'+(t?.id||'')+'|'+synergies.map(s=>s.school).join(',');
    const limit=20+player.maxHp*.075;
    const progress=c==='swordsman'?Math.min(1,(player.v484SwordsmanHits||0)/4):
      c==='shadow'?Math.min(1,(player.v484ShadowMarks||0)/3):
      c==='sage'?Math.min(1,(player.v484SageCasts||0)/(hasSchool('stormNova')?2:3)):
      Math.min(1,(player.v484GuardCharge||0)/Math.max(1,limit));
    badge.classList.remove('hidden');
    if(key!==badgeKey||force){
      badgeKey=key;
      badge.innerHTML='<div class="v484Heading">'+trait.symbol+' '+trait.name+'</div>'+
        '<div class="v484WeaponLine">'+(t?t.symbol+' '+t.name:'무기 절기 미선택')+'</div>'+
        (synergies.length?'<div class="v484SynergyLine">✨ '+synergies.map(x=>x.name).join(' · ')+'</div>':'')+
        '<div class="v484Gauge"><i id="v484GaugeFill"></i></div>';
    }
    const fill=el('v484GaugeFill');if(fill)fill.style.width=Math.round(progress*100)+'%';
  }
  const oldHud=updateSkillHUD;
  updateSkillHUD=function(){
    const result=oldHud();
    // Called on loot/upgrade/menu changes; never cause new Canvas effects.
    refreshBadge();
    return result;
  };
  const oldStart=start;
  start=function(){
    badgeKey='';badgeTimer=0;
    const out=oldStart();refreshBadge(true);return out;
  };
  const oldFinish=finishRun;
  finishRun=function(cleared){const r=oldFinish(cleared);badge.classList.add('hidden');return r};
  const previousUpdateBadge=update;
  update=function(dt){
    const r=previousUpdateBadge(dt);
    badgeTimer+=dt;
    if(badgeTimer>=.35){badgeTimer=0;refreshBadge()}
    return r;
  };
  // Give old weapons an identifier as they are inspected; no deletions.
  const oldOpenItem=openItem;
  openItem=function(id,slot,loot){
    const item=profile.inventory?.find(i=>i.id===id);
    if(item?.slot==='weapon'&&techniqueFor(item))saveProfile();
    return oldOpenItem(id,slot,loot);
  };
  const oldRender=window.MurimJournal?.render;
  if(oldRender)window.MurimJournal.render=function(){
    const result=oldRender();
    const body=el('v482JournalBody');
    if(!body||!player)return result;
    const trait=TRAITS[classId()],t=techById(currentTech());
    const active=(SYNERGY[classId()]||[]).filter(x=>hasSchool(x.school));
    const passive=body.querySelector('.v482StatTop');
    if(passive&&!body.querySelector('.v484JournalEffects')){
      passive.insertAdjacentHTML('beforebegin',
        '<div class="v484JournalEffects"><b>🎯 직업 특성 · '+trait.name+'</b><small>'+trait.text+'</small>'+
        '<b>⚔️ 장착 무기 절기 · '+(t?.name||'미확인')+'</b><small>'+(t?.desc||'전용 무기를 획득하세요.')+'</small>'+
        '<b>✨ 직업 × 유파 공명</b><small>'+(active.length?active.map(x=>x.name+' · '+x.desc).join(' / '):
          '해당 직업에 맞는 유파를 수련하면 시너지가 활성화됩니다.')+'</small></div>');
    }else if(body.querySelector('.v482PathCard')&&!body.querySelector('.v484JournalEffects')){
      body.insertAdjacentHTML('afterbegin',
        '<div class="v484JournalEffects"><b>✨ 활성화된 직업 × 유파 시너지</b><small>'+
        (active.length?active.map(x=>x.name+' · '+x.desc).join(' / '):'아직 활성화된 시너지가 없습니다.')+
        '</small></div>');
    }
    return result;
  };
  // Old pause system uses a click handler on its own button. Refresh the
  // newly added effects section on subsequent tab switches.
  const pause=el('v480PauseOverlay');
  if(pause)pause.addEventListener('click',()=>{
    if(window.MurimJournal?.render)window.MurimJournal.render();
  });
  const priorHome=renderHome;
  renderHome=function(){
    const r=priorHome();
    const selected=profile.selectedClass;
    const tr=TRAITS[selected];
    if(tr){
      const s=el('stageHomeDesc');
      if(s)s.textContent='7:00 · '+tr.name+' · 전용 절기 무기 · 유파 공명';
    }
    return r;
  };
  window.MurimCombat484={TECHNIQUES,TRAITS,SYNERGY,
    active:()=>({classId:classId(),weapon:currentTech(),
      schools:selectedSchools().map(s=>s.id),
      synergies:(SYNERGY[classId()]||[]).filter(s=>hasSchool(s.school)).map(s=>s.name)})};
  window.MurimBuildVersion='4.8.4';
})();
