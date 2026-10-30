/* v4.8.1 - martial paths and readable hostile projectiles. Additive to v4.8.0. */
(() => {
  'use strict';
  const MAX_SKILLS = 3;
  const PATHS = [
    {id:'infernoCyclone', name:'적염검도', icon:'🔥', role:'광역 화력', color:'#ff946d',
      brief:'화염장·회풍검기·용맥심법 → 적염회풍검', perk:'공격력 +8%'},
    {id:'stormNova', name:'빙뢰심법', icon:'⚡', role:'빙결 제어', color:'#9adeff',
      brief:'벽력지·한빙장·뇌령주 → 빙뢰무극', perk:'무공 재사용 -10%'},
    {id:'astralAegis', name:'천성호신', icon:'🛡️', role:'공방 균형', color:'#e6c6ff',
      brief:'유성검우·금종조·천성인 → 천성금종진', perk:'최대 체력 +18'},
    {id:'verdantPlague', name:'청목독공', icon:'🌿', role:'지속 피해·회복', color:'#9cdda4',
      brief:'독무공·호신강기·청목진기 → 청목만독진', perk:'초당 체력 회복 +0.4'},
    {id:'eclipseRay', name:'월영비술', icon:'🌙', role:'관통·치명타', color:'#c7adff',
      brief:'일양지·흑월비도·월영패 → 일월멸광', perk:'치명타 확률 +5%'},
    {id:'tempestRift', name:'건곤풍뢰', icon:'🌀', role:'기동·충격파', color:'#abe6c8',
      brief:'질풍검·진각·혼원진기 → 건곤폭풍진', perk:'이동속도 +10%'}
  ];
  const PERKS = [
    {id:'attack',icon:'⚔️',name:'내공 단련',desc:'이번 원정 공격력 +10%',apply:()=>{player.damage*=1.10}},
    {id:'haste',icon:'📜',name:'운기 조식',desc:'무공 재사용 대기시간 -7%',apply:()=>{player.v481Haste=(player.v481Haste||0)+.07}},
    {id:'survive',icon:'🛡️',name:'호체 수련',desc:'최대 HP +16 · 즉시 HP 16 회복',apply:()=>{player.maxHp+=16;player.hp=Math.min(player.maxHp,player.hp+16)}},
    {id:'move',icon:'💨',name:'경공 연마',desc:'이동속도 +8%',apply:()=>{player.speed*=1.08}}
  ];
  const getPath = () => PATHS.find(p => player && p.id === player.v481Path);
  const getRecipe = () => { const p=getPath();return p && skillFusionDefs[p.id]; };
  const hasFusion = () => {const p=getPath();return !!(p && runSkills.includes(p.id));};
  const readSkill = id => skillDefs[id] || {name:id,icon:'✨',desc:''};
  const chooseOne = arr => arr.length ? arr[Math.floor(Math.random()*arr.length)] : null;
  const shuffled = arr => [...arr].sort(() => Math.random()-.5);
  let hudSignature = '';

  // A simple field journal makes the equipped build visible even though the older
  // v3.9 UI intentionally hides #skillBar.
  const status = document.createElement('div');
  status.id='v481BuildHud';
  status.className='hidden';
  document.body.appendChild(status);

  function syncHud() {
    if (!running || !player) {
      status.classList.add('hidden');
      return;
    }
    const p=getPath();
    const equipped=runSkills.filter(id=>skillDefs[id]).slice(0,MAX_SKILLS);
    const sig=(p?.id||'none')+'|'+equipped.map(id=>id+':'+(runSkillLevels[id]||1)).join(',');
    status.classList.remove('hidden');
    if(sig===hudSignature)return;
    hudSignature=sig;
    status.innerHTML='<div class="v481BuildLabel">'+(p?p.icon+' '+p.name+' · '+p.role:'📜 유파 선택 대기')+
      '<span>'+equipped.length+'/'+MAX_SKILLS+'</span></div>'+
      '<div class="v481BuildSkills">'+
      Array.from({length:MAX_SKILLS},(_,i)=>{
        const id=equipped[i],sk=id?readSkill(id):null;
        return '<div class="v481BuildSkill" title="'+(sk?sk.name:'빈 무공')+'">'+
          (sk?'<b>'+sk.icon+'</b><small>Lv.'+(runSkillLevels[id]||1)+'</small>':'<b>＋</b><small>빈 슬롯</small>')+
          '</div>';
      }).join('')+'</div>';
  }
  const prevSkillHUD = updateSkillHUD;
  updateSkillHUD = function() {
    const result = prevSkillHUD();
    syncHud();
    return result;
  };

  // Each path uses one existing three-skill fusion. Other paths' catalysts
  // cannot enter the same run; at most 3 active skills are equipped.
  function pathOptions() {
    return shuffled(PATHS).slice(0,3).map(p=>({
      kind:'path',id:p.id,skill:p.id,icon:p.icon,
      title:p.name+' · '+p.role,desc:p.brief+' / '+p.perk
    }));
  }
  function nextOptions() {
    const p=getPath(),f=getRecipe();
    if (!p || !f) return pathOptions();
    const rewards=player.v481Rewards||1;
    const fused=hasFusion();
    const missing=fused?[]:[...f.ingredients,f.key].filter(id=>!runSkills.includes(id));
    const regular=normalSkillIds.filter(id=>!runSkills.includes(id) &&
      !(fused && f.ingredients.includes(id)));
    const notAtMax=runSkills.filter(id=>skillDefs[id]&&!skillDefs[id].fusion&&skillLevel(id)<5);
    const upgradable=runSkills.filter(id=>skillDefs[id]&&skillLevel(id)<5);
    const opts=[];
    function addSkill(id,tag) {
      if(!id||opts.some(x=>x.kind==='skill'&&x.id===id))return;
      const sk=readSkill(id);
      opts.push({kind:'skill',id,icon:sk.icon,
        title:sk.name,desc:(tag||'새로운 무공')+' · '+sk.desc});
    }
    function addUpgrade(id) {
      if(!id||opts.some(x=>x.kind==='upgrade'&&x.id===id))return;
      const sk=readSkill(id);
      opts.push({kind:'upgrade',id,icon:sk.icon,title:sk.name+' 강화',
        desc:'Lv.'+skillLevel(id)+' → Lv.'+(skillLevel(id)+1)+' · 화력/재사용 강화'});
    }
    function addPerk(id) {
      const k=PERKS.find(x=>x.id===id);
      if(k&&!opts.some(x=>x.kind==='perk'&&x.id===id)){
        opts.push({kind:'perk',id,icon:k.icon,title:k.name,desc:k.desc});
      }
    }

    // Prioritize the chosen recipe rather than random unrelated martial arts.
    // Core catalyst is made available after two skill rewards, so fusion can
    // be reached within a seven-minute run through deliberate choices.
    const missingBase=missing.filter(id=>id!==f.key);
    const catalystReady=rewards>=2 || elapsed>=90;
    if (catalystReady && missing.includes(f.key)) addSkill(f.key,'선택 유파의 융합 핵심');
    if (missingBase.length) addSkill(missingBase[0],'융합 재료 · '+p.name);
    if (!opts.length && regular.length) addSkill(chooseOne(regular),'다른 계열 보조 무공');
    if (upgradable.length) addUpgrade(chooseOne(upgradable));
    if(opts.length<3 && regular.length) addSkill(chooseOne(regular),'보조 무공 · 3칸 제한');
    if(opts.length<3 && notAtMax.length) addUpgrade(chooseOne(notAtMax));
    if(opts.length<3)addPerk(chooseOne(PERKS).id);
    if(opts.length<3)addPerk(PERKS.find(x=>!opts.some(o=>o.kind==='perk'&&o.id===x.id))?.id);
    if(opts.length<3 && regular.length){
      const rest=regular.filter(id=>!opts.some(x=>x.id===id));
      addSkill(chooseOne(rest),'보조 무공');
    }
    if(opts.length<3)addPerk(PERKS.find(x=>!opts.some(o=>o.kind==='perk'&&o.id===x.id))?.id);
    return opts.slice(0,3);
  }

  const applyPathPerk = id => {
    if(player.v481Path)return;
    player.v481Path=id;
    if(id==='infernoCyclone')player.damage*=1.08;
    if(id==='stormNova')player.v481Haste=(player.v481Haste||0)+.10;
    if(id==='astralAegis'){player.maxHp+=18;player.hp+=18}
    if(id==='verdantPlague')player.regen+=.4;
    if(id==='eclipseRay')player.crit+=5;
    if(id==='tempestRift')player.speed*=1.10;
  };

  function clearOffer() {
    if(player){player.v481Offers=null;player.v481Replace=null;player.v481Rewards=(player.v481Rewards||0)+1}
    pendingSkillLoot=null;
  }
  function chooseSkill(id) {
    clearOffer();
    if(runSkills.includes(id)){
      runSkillLevels[id]=Math.min(5,(runSkillLevels[id]||1)+1);
      markSkillDiscovered(id);
      skillCooldowns[id]=Math.min(skillCooldowns[id]||0,skillCooldown(id));
      closeItemModal();updateSkillHUD();
    } else {
      attachRunSkill(id);
    }
    syncHud();
  }
  function showReplacement(id) {
    player.v481Replace=id;
    const sk=readSkill(id);
    $('itemDetail').innerHTML='<div class="lootPause">🎒 무공 운용 한도 '+MAX_SKILLS+'개</div>'+
      '<h3>교체할 무공 선택</h3><p class="subtitle">'+sk.icon+' '+sk.name+
      '을(를) 배우려면 기존 무공 하나를 교체해야 합니다. 교체한 무공의 레벨은 사라집니다.</p>'+
      '<div class="v481ChoiceList">'+runSkills.map((old,i)=>{
        const a=readSkill(old);
        return '<button class="v481Choice" data-replace="'+i+'"><span class="v481Icon">'+a.icon+
          '</span><span><b>'+a.name+'</b><small>Lv.'+(runSkillLevels[old]||1)+' · 이 무공을 교체</small></span></button>';
      }).join('')+'</div><button class="btn ghost wide mt8" id="v481Back">다른 보상 선택</button>';
    $('itemDetail').querySelectorAll('[data-replace]').forEach(b=>b.onclick=()=>{
      const i=Number(b.dataset.replace),old=runSkills[i];
      if(!old)return;
      runSkills.splice(i,1);
      if(!runSkills.includes(old)){delete runSkillLevels[old];delete skillCooldowns[old]}
      chooseSkill(id);
    });
    $('v481Back').onclick=()=>{player.v481Replace=null;renderChoice()};
  }

  function chooseOption(option) {
    if(!option || !player)return;
    if(option.kind==='path') {
      const f=skillFusionDefs[option.id];
      if(!f || player.v481Path)return;
      applyPathPerk(option.id);
      showToast('📜 '+getPath().name+' 선택! 이 원정에서는 해당 유파의 핵심만 등장합니다.');
      chooseSkill(f.ingredients[0]);
      return;
    }
    if(option.kind==='skill'){
      if(runSkills.includes(option.id)){chooseSkill(option.id);return}
      if(runSkills.length>=MAX_SKILLS){showReplacement(option.id);return}
      chooseSkill(option.id);return;
    }
    if(option.kind==='upgrade'){if(runSkills.includes(option.id))chooseSkill(option.id);return}
    if(option.kind==='perk'){
      const perk=PERKS.find(k=>k.id===option.id);
      if(!perk)return;
      perk.apply();
      clearOffer();closeItemModal();updateHUD(true);
      showToast('📜 '+perk.name+' 습득');
    }
  }

  function renderChoice() {
    if(!player)return;
    if(player.v481Replace){showReplacement(player.v481Replace);return}
    const options=player.v481Offers||[];
    const p=getPath(),intro=!p;
    $('itemDetail').innerHTML=
      '<div class="lootPause">'+(intro?'📜 무공 유파를 선택하세요':'📦 무공 보상 · 3개 중 1개 선택')+'</div>'+
      '<h3>'+(intro?'나만의 무공 수련 방향':'무공 전술 선택')+'</h3>'+
      '<p class="subtitle">'+(intro?
        '이번 원정에서 집중할 유파를 선택합니다. 유파마다 융합 무공과 성장 보너스가 다릅니다.':
        p.icon+' '+p.name+' · 무공은 최대 '+MAX_SKILLS+'개만 유지됩니다. 융합에 필요한 무공을 모으거나 다른 무공으로 교체할 수 있습니다.')+'</p>'+
      '<div class="v481ChoiceList">'+options.map((o,i)=>
        '<button class="v481Choice" data-v481-choice="'+i+'"><span class="v481Icon">'+o.icon+
        '</span><span><b>'+o.title+'</b><small>'+o.desc+'</small></span><span class="v481Chevron">›</span></button>'
      ).join('')+'</div><p class="v481Hint">보상을 선택하면 전투가 계속됩니다.</p>';
    $('itemDetail').querySelectorAll('[data-v481-choice]').forEach(b=>b.onclick=()=>{
      chooseOption(options[Number(b.dataset.v481Choice)]);
    });
    itemModal.classList.remove('hidden');
  }

  // v4.8.0 checkpoints already serialize player and pendingSkillLoot.
  // Persist offerings on player so a reloaded choice screen restores exactly.
  showSkillLootModal=function(id){
    if(!player)return;
    paused=true;itemModalResume=true;
    if(!Array.isArray(player.v481Offers)||!player.v481Offers.length){
      player.v481Offers=player.v481Path?nextOptions():pathOptions();
      player.v481Replace=null;
    }
    pendingSkillLoot=id&&skillDefs[id]?id:player.v481Path?
      (getRecipe()?.ingredients[0]||'flame'):'flame';
    renderChoice();
  };

  // All skill rewards now ask for a choice rather than automatically adding
  // every discovered skill, and off-path core catalysts are never offered.
  acquireSkillFromChest=function(){
    if(!running || !player || pendingSkillLoot ||
       !itemModal.classList.contains('hidden'))return;
    showSkillLootModal('flame');
  };

  // The first destroyed chest always triggers a doctrine choice, removing
  // the previous long random wait to find the first useful martial art.
  const oldBreakChest=breakChest;
  breakChest=function(c){
    if(!c || c.broken)return;
    const first=!!(player && !player.v481Path && !player.v481FirstChest);
    const result=oldBreakChest(c);
    if(first && c.broken){
      player.v481FirstChest=true;
      if(!pendingSkillLoot && itemModal.classList.contains('hidden'))
        acquireSkillFromChest(true);
    }
    return result;
  };

  const oldSkillCooldown=skillCooldown;
  skillCooldown=function(id){
    const cd=oldSkillCooldown(id);
    return Math.max(1.35,cd*(1-Math.min(.35,player?.v481Haste||0)));
  };

  const oldStart=start;
  start=function(){
    hudSignature='';
    const result=oldStart();
    syncHud();
    return result;
  };
  const oldFinishRun=finishRun;
  finishRun=function(cleared){
    const result=oldFinishRun(cleared);
    status.classList.add('hidden');
    return result;
  };

  // Hostile shots always use high-contrast coral with an ivory center and
  // near-black rim. No shadows, dynamic gradients or large texture effects.
  drawEnemyBullet=function(b){
    const r=Math.max(6.5,b.r||6);
    if(b.x<camera.x-r-20||b.x>camera.x+W+r+20||
       b.y<camera.y-r-20||b.y>camera.y+H+r+20)return;
    ctx.save();ctx.translate(b.x,b.y);
    ctx.rotate(Math.atan2(b.vy,b.vx));
    ctx.fillStyle='#ff6b59';
    ctx.strokeStyle='#161116';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(-r-12,0);ctx.lineTo(-r+1,-r*.7);ctx.lineTo(-r+1,r*.7);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle='#180f18';
    ctx.beginPath();ctx.arc(0,0,r+4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff515f';
    ctx.beginPath();ctx.arc(0,0,r+1,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff0bc';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,r+1.7,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#fffdf1';
    ctx.beginPath();ctx.arc(0,0,Math.max(3,r*.52),0,Math.PI*2);ctx.fill();
    ctx.restore();
  };

  drawBossHazard=function(h){
    if(h.x+h.r<camera.x-30||h.x-h.r>camera.x+W+30||
       h.y+h.r<camera.y-30||h.y-h.r>camera.y+H+30)return;
    const pre=!h.triggered;
    const alpha=pre?.65+Math.sin(elapsed*13)*.18:Math.max(.2,h.life/.55);
    ctx.save();
    ctx.globalAlpha=Math.max(.25,Math.min(1,alpha));
    ctx.strokeStyle='#100e13';ctx.lineWidth=7;
    ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=pre?'#ffe2a0':'#ff6d6b';ctx.lineWidth=3.5;
    ctx.setLineDash(pre?[11,6]:[]);
    ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    if(!pre){
      ctx.globalAlpha=.16;ctx.fillStyle='#ff5f58';
      ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  };

  const oldHome=renderHome;
  renderHome=function(){
    const r=oldHome();
    $('stageHomeDesc').textContent='7:00 · 유파 선택 · 무공 3칸 · 핵심 융합';
    $('homeSkills').innerHTML=
      '<div class="homeSkill"><span class="si">🧭</span><small>전투 유파</small><b>첫 상자에서 선택</b></div>'+
      '<div class="homeSkill"><span class="si">⚔️</span><small>무공 한도</small><b>최대 3개 · 교체 가능</b></div>'+
      '<div class="homeSkill"><span class="si">🔑</span><small>융합</small><b>선택 유파의 핵심만 획득</b></div>';
    return r;
  };
  const skillGuide=document.querySelector('#skillScreen .subtitle');
  if(skillGuide)skillGuide.textContent=
    '원정마다 첫 보급 상자에서 무공 유파를 선택합니다. 무공은 최대 3개까지만 운용할 수 있으며, 보상에서 강화 또는 교체를 선택합니다. 선택 유파의 재료 무공 2개와 핵심 심법 1개를 모으면 해당 융합 무공이 완성됩니다. 다른 유파의 핵심 심법은 같은 원정에서 등장하지 않습니다.';

  window.MurimBuildVersion='4.8.1';
})();
