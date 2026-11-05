/* v4.8.3 - Class-first wuxia combat, class weapon loot, no disciple combat. */
(() => {
  'use strict';
  const CLASSES=[
    {id:'swordsman',name:'검객',icon:'⚔️',title:'근거리 돌파',color:'#cfb67b',
      weapons:['sword','spear'],main:'sword',style:'검기 참격과 관통 창술',
      perk:'공격력 +12% · 최대 HP +10',desc:'정면에서 적진을 가르며 단단하게 전진하는 근접 직업'},
    {id:'shadow',name:'암행객',icon:'🗡️',title:'고속 치명타',color:'#a6b5a7',
      weapons:['dagger','bow'],main:'dagger',style:'연속 비도와 원거리 관통 화살',
      perk:'치명타 +12% · 이동속도 +9%',desc:'기동과 빈틈을 이용해 적을 빠르게 제거하는 직업'},
    {id:'sage',name:'술사',icon:'☯️',title:'내공 원거리',color:'#a8c6e7',
      weapons:['staff','grimoire'],main:'staff',style:'장풍과 추적 검부',
      perk:'무공 재사용 -12% · 획득 범위 +25',desc:'무공·진화 조합으로 적 다수를 제압하는 술법형 직업'},
    {id:'guardian',name:'금강무사',icon:'🔨',title:'강타와 생존',color:'#d29f84',
      weapons:['hammer','axe'],main:'hammer',style:'묵직한 철추와 회전 쌍월륜',
      perk:'최대 HP +24% · 피해 감소 +3%',desc:'맷집으로 적진을 압박하며 충격파를 만드는 직업'}
  ];
  const el=id=>document.getElementById(id);
  const getClass=id=>CLASSES.find(x=>x.id===id)||null;
  const classForWeapon=weapon=>CLASSES.find(x=>x.weapons.includes(weapon))||CLASSES[0];
  const itemType=item=>item?.weaponType||'sword';
  const chosenClass=()=>getClass(player?.v483ClassId)||(player?.weaponType?classForWeapon(player.weaponType):null)||getClass(profile.selectedClass)||classForWeapon(itemType(equippedItem('weapon')));
  const weaponAllowed=(c,item)=>!!(c&&item&&item.slot==='weapon'&&c.weapons.includes(item.weaponType));
  const savedStart=el('startBtn').onclick;
  const savedRetry=el('retryBtn').onclick;
  let pendingClass=null,chosenId=null;
  let originalWeaponDefs=[];
  const selection=document.createElement('div');
  selection.id='v483ClassOverlay';selection.className='overlay hidden';
  selection.innerHTML='<div class="panel v483ClassPanel" role="dialog" aria-modal="true" aria-labelledby="v483SelectTitle">'+
    '<div class="eyebrow">청운문 · 출전 직업</div><h2 id="v483SelectTitle">전투 직업 선택</h2>'+
    '<p class="subtitle">매 원정 시작 전 직업을 고르세요. 직업마다 사용하는 무기와 전투 능력이 다릅니다.</p>'+
    '<div id="v483ClassGrid" class="v483ClassGrid"></div>'+
    '<p class="v483SelectHint">다른 직업에서 획득한 무기는 보관할 수 있지만, 현재 직업에서는 장착할 수 없습니다.</p>'+
    '<div class="v483ClassActions"><button type="button" id="v483ClassCancel" class="btn ghost">취소</button>'+
    '<button type="button" id="v483ClassConfirm" class="btn gold">출전하기</button></div></div>';
  document.body.appendChild(selection);

  function chooseClassMenu(nextClick){
    if(running)return;
    chosenId=getClass(profile.selectedClass)?.id||classForWeapon(itemType(equippedItem('weapon'))).id;
    const grid=el('v483ClassGrid');
    grid.innerHTML=CLASSES.map(c=>'<button type="button" class="v483ClassCard" data-v483-class="'+c.id+'">'+
      '<span class="v483ClassIcon">'+c.icon+'</span><span class="v483ClassContent">'+
      '<b>'+c.name+' <small>'+c.title+'</small></b>'+
      '<span>'+c.desc+'</span><em>'+c.weapons.map(w=>weaponDefs[w]?.icon+' '+weaponDefs[w]?.name).join(' · ')+'</em>'+
      '<strong>'+c.perk+'</strong></span></button>').join('');
    function select(id){
      chosenId=id;
      grid.querySelectorAll('[data-v483-class]').forEach(b=>{
        const isSelected=b.dataset.v483Class===id;
        b.classList.toggle('chosen',isSelected);b.setAttribute('aria-pressed',String(isSelected));
      });
    }
    grid.querySelectorAll('[data-v483-class]').forEach(b=>b.onclick=()=>select(b.dataset.v483Class));
    select(chosenId);
    el('v483ClassConfirm').onclick=()=>{
      if(!getClass(chosenId))return;
      pendingClass=chosenId;selection.classList.add('hidden');
      nextClick();
    };
    selection.classList.remove('hidden');
  }
  el('v483ClassCancel').onclick=()=>selection.classList.add('hidden');
  if(savedStart)el('startBtn').onclick=()=>chooseClassMenu(savedStart);
  if(savedRetry)el('retryBtn').onclick=()=>chooseClassMenu(savedRetry);

  // Keep previous weapons in the shared inventory and remember a compatible
  // equipped weapon for each character. No profile wipe or item conversion.
  function prepareWeapon(c) {
    profile.classWeaponIds=profile.classWeaponIds&&typeof profile.classWeaponIds==='object'?
      profile.classWeaponIds:{};
    const prev=equippedItem('weapon');
    if(prev?.weaponType){
      const prevOwner=getClass(profile.selectedClass)||classForWeapon(prev.weaponType);
      if(prevOwner.weapons.includes(prev.weaponType))profile.classWeaponIds[prevOwner.id]=prev.id;
    }
    let weapon=profile.inventory.find(i=>i.id===profile.classWeaponIds[c.id]&&weaponAllowed(c,i));
    if(!weapon){
      weapon=(profile.inventory||[]).filter(i=>weaponAllowed(c,i))
        .sort((a,b)=>(b.score||0)-(a.score||0))[0];
    }
    if(!weapon){
      const w=weaponDefs[c.main];
      weapon=starterItem('weapon','입문 '+w.name,w.icon,
        {damage:4,crit:c.id==='shadow'?2:0,maxHp:c.id==='guardian'?5:0},c.main);
      profile.inventory.push(weapon);
    }
    profile.equipped.weapon=weapon.id;
    profile.classWeaponIds[c.id]=weapon.id;
    return weapon;
  }
  function applyPerk(c) {
    if(!player||!c)return;
    player.v483ClassId=c.id;player.v483ClassName=c.name;player.v483ClassNote=c.perk;
    if(c.id==='swordsman'){player.damage*=1.12;player.maxHp+=10;player.hp+=10}
    else if(c.id==='shadow'){player.crit+=12;player.speed*=1.09}
    else if(c.id==='sage'){player.v481Haste=(player.v481Haste||0)+.12;player.magnet+=25}
    else if(c.id==='guardian'){player.maxHp*=1.24;player.hp=player.maxHp;player.damageReduction+=3}
  }
  const previousReset=reset;
  reset=function(){
    const desired=getClass(pendingClass)||getClass(profile.selectedClass)||
      classForWeapon(itemType(equippedItem('weapon')));
    const changed=profile.selectedClass!==desired.id;
    const weapon=prepareWeapon(desired);
    profile.selectedClass=desired.id;pendingClass=null;
    if(changed){
      // New shop inventory generated after changing class contains only that
      // class's weapons. Already bought items remain in player inventory.
      profile.shopStock=[];
    }
    saveProfile();
    const result=previousReset();
    v440Companion=null;
    profile.activeDisciple=null;
    if(player)applyPerk(desired);
    saveProfile();
    return result;
  };

  // Remove both the actual ally actor and its attack/animation path. Keep
  // legacy building investments and progression; repurpose the dormitory
  // benefit as generic character training.
  v440CompanionAllowed=()=>false;
  v440CreateCompanion=()=>null;
  v440UpdateCompanion=()=>{};
  v440DrawCompanion=()=>{};
  v440Companion=null;
  V43_BUILDINGS.dormitory={
    name:'직업 수련관',icon:'🏯',
    desc:'전투 직업의 급소 공략과 무예 감각을 단련합니다.',
    effect:'치명타 확률 +1% / Lv.'
  };
  const prevSectBonus=v43BuildBonus;
  v43BuildBonus=function(){
    const b=prevSectBonus();
    b.crit+=(profile.sectBuildings?.dormitory||0)*1;
    return b;
  };
  const discipleButton=el('v43DiscipleBtn');
  if(discipleButton){discipleButton.classList.add('hidden');discipleButton.setAttribute('aria-hidden','true')}
  const discipleScreen=el('v43DiscipleScreen');
  if(discipleScreen)discipleScreen.classList.add('hidden');
  profile.activeDisciple=null;saveProfile();

  // Class-specific loot. Reuse the original rarity, stat generation and
  // affix rules; only the weapon base pool is filtered during the synchronous
  // roll. Armor and accessories remain universally usable.
  const oldGenerate=generateItem;
  const originalPool=itemBases.weapon.slice();
  originalWeaponDefs=originalPool.slice();
  function rollByClass(level=1,better=false,forcedWeapon=false){
    const c=chosenClass();
    const pool=itemBases.weapon;
    const backup=pool.slice();
    const allowed=originalPool.filter(x=>c.weapons.includes(x.weaponType));
    pool.splice(0,pool.length,...allowed);
    let result=null;
    try{
      const attempts=forcedWeapon?32:1;
      for(let t=0;t<attempts;t++){
        const rolled=oldGenerate(level,better);
        if(!forcedWeapon||rolled.slot==='weapon'){result=rolled;break}
      }
    }finally{pool.splice(0,pool.length,...backup)}
    if(!result){
      const w=weaponDefs[c.main];
      result=starterItem('weapon','백련 '+w.name,w.icon,{damage:6+level*2},c.main);
      result.level=level;result.rarity='rare';
    }
    if(result.slot!=='weapon')return result;
    const w=result.weaponType;
    // The modifiers are active item stats, not labels-only cosmetics.
    const scale=1+(result.level||1)*.12;
    let mod,label;
    if(w==='sword'){mod={fireRatePct:Math.round(4*scale*10)/10};label='연검식 · 연속 참격'}
    else if(w==='spear'){mod={damage:Math.round(2.7*scale*10)/10};label='관일식 · 직선 관통'}
    else if(w==='dagger'){mod={crit:Math.round(2.4*scale*10)/10};label='무영수 · 급소 찌르기'}
    else if(w==='bow'){mod={damage:Math.round(2.2*scale*10)/10,crit:1};label='백발식 · 정확한 저격'}
    else if(w==='staff'){mod={damage:Math.round(2.6*scale*10)/10};label='장풍결 · 내공 강화'}
    else if(w==='grimoire'){mod={fireRatePct:Math.round(3.5*scale*10)/10,magnet:6};label='비검부 · 추적 검기'}
    else if(w==='hammer'){mod={maxHp:Math.round(9*scale)};label='철벽식 · 중량 강타'}
    else {mod={fireRatePct:Math.round(3.5*scale*10)/10,maxHp:4};label='폭풍식 · 회전 월륜'}
    result.stats=result.stats||{};
    for(const [k,v] of Object.entries(mod))result.stats[k]=Math.round(((result.stats[k]||0)+v)*10)/10;
    result.affixes=result.affixes||[];
    result.affixes.push({key:'classSignature',name:c.name+' 고유 절기 · '+label});
    result.classId=c.id;
    result.name=c.name+' · '+result.name;
    result.score=calcItemScore(result);
    return result;
  }
  generateItem=rollByClass;

  // First crate always grants a usable class-specific weapon. The normal
  // treasure generation still runs; later weapons use the class loot pool.
  const baseBreak=breakChest;
  breakChest=function(c){
    if(!c||c.broken)return;
    const result=baseBreak(c);
    if(c.broken&&running&&player&&!player.v483FirstClassWeaponChest){
      player.v483FirstClassWeaponChest=true;
      {
        const i=rollByClass(stageItemLevel(),true,true);
        lootOrbs.push({x:c.x+18,y:c.y-13,r:13,phase:0,dead:false,item:i});
        showToast(chosenClass().icon+' '+chosenClass().name+' 전용 무기 발견!');
      }
    }
    return result;
  };

  // Legacy cross-class items remain visible but are never equippable.
  const originalOpenItem=openItem;
  openItem=function(id,slot,fromLoot){
    const result=originalOpenItem(id,slot,fromLoot);
    const item=profile.inventory.find(i=>i.id===id);
    const c=chosenClass();
    if(item?.slot==='weapon'&&!weaponAllowed(c,item)){
      const b=el('modalEquipBtn');
      if(b){b.disabled=true;b.textContent='⛔ '+c.name+' 착용 불가'}
      const panel=el('itemDetail');
      if(panel)panel.insertAdjacentHTML('beforeend',
        '<p class="v483Incompatible">이 무기는 '+c.name+' 직업에서 사용할 수 없습니다. 다른 직업으로 출전하면 장착할 수 있습니다.</p>');
    }
    return result;
  };
  // Weapon switching during a run continues through the original equipment
  // handler; maintain the active class's remembered weapon after equipping.
  const originalSync=syncPlayerToEquipment;
  syncPlayerToEquipment=function(oldStats,oldType){
    const result=originalSync(oldStats,oldType);
    const item=equippedItem('weapon'),c=chosenClass();
    if(item&&weaponAllowed(c,item)){
      profile.classWeaponIds=profile.classWeaponIds||{};
      profile.classWeaponIds[c.id]=item.id;saveProfile();
    }
    return result;
  };

  // No ongoing companion updates or draw calls after loading an old checkpoint.
  const previousUpdate=update;
  update=function(dt){
    if(v440Companion)v440Companion=null;
    if(player&&!player.v483ClassId){
      const c=classForWeapon(player.weaponType);
      player.v483ClassId=c.id;player.v483ClassName=c.name;
      player.v483ClassNote='이전 버전 원정 복구 · 직업 특성은 다음 원정부터 적용';
    }
    return previousUpdate(dt);
  };
  const previousDraw=draw;
  draw=function(){
    if(v440Companion)v440Companion=null;
    return previousDraw();
  };
  // Small visual identity cue; only one icon is rendered per frame.
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function(){
    baseDrawPlayer();
    const c=chosenClass();if(!player||!c)return;
    ctx.save();ctx.textAlign='center';ctx.font='13px system-ui';
    ctx.fillText(c.icon,player.x,player.y-31);
    ctx.restore();
  };

  const oldHome=renderHome;
  renderHome=function(){
    const out=oldHome();
    const c=getClass(profile.selectedClass)||classForWeapon(itemType(equippedItem('weapon')));
    const summary=el('v43Summary');
    if(summary){
      const cells=summary.querySelectorAll('div');
      if(cells[2])cells[2].innerHTML='<small>출전 직업</small><b>'+c.icon+' '+c.name+'</b>';
    }
    el('stageHomeDesc').textContent='7:00 · 직업별 전용 무기 · 유파 3개 성장';
    el('startBtn').textContent='⚔️ 직업 선택 후 출전';
    return out;
  };
  const originalJournal=window.MurimJournal?.render;
  if(originalJournal)window.MurimJournal.render=function(){
    const result=originalJournal();
    if(el('v482JournalBody')){
      const body=el('v482JournalBody');
      if(body.querySelector('.v482StatTop')&&!body.querySelector('.v483JobLine')){
        const c=chosenClass();
        body.insertAdjacentHTML('afterbegin','<div class="v483JobLine">'+c.icon+
          ' '+c.name+' · '+c.title+'<small>'+c.perk+'</small></div>');
      }
    }
    return result;
  };
  // The pause tabs use the original closure handler; this capture listener
  // adds class identity to the stats tab after its HTML is rendered.
  const pause=el('v480PauseOverlay');
  if(pause)pause.addEventListener('click',()=>{
    const body=el('v482JournalBody');
    if(!body||!body.querySelector('.v482StatTop')||body.querySelector('.v483JobLine'))return;
    const c=chosenClass();
    body.insertAdjacentHTML('afterbegin','<div class="v483JobLine">'+c.icon+' '+
      c.name+' · '+c.title+'<small>'+c.perk+'</small></div>');
  });
  function refreshClassStats(){
    if(el('v480PauseOverlay')?.classList.contains('hidden'))return;
    window.MurimJournal?.render?.();
  }
  // v4.8.2 renders the journal on these events first; enrich its first
  // character tab with the selected class immediately afterwards.
  el('v480PauseButton')?.addEventListener('click',refreshClassStats);
  el('v480Continue')?.addEventListener('click',refreshClassStats);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)refreshClassStats();
  });
  window.MurimClassSystem={classes:CLASSES.map(c=>({id:c.id,name:c.name,weapons:c.weapons.slice()})),
    current:()=>chosenClass()?.id,allowedWeapon:(type)=>chosenClass()?.weapons.includes(type)};
  window.MurimBuildVersion='4.8.3';
})();
