/* v4.8.2 - three martial schools, independent evolution tracks and pause journal.
 * Layers on top of v4.8.1 without touching the combat simulation.
 */
(() => {
  'use strict';
  const MAX_PATHS=3;
  const SCHOOLS=[
    {id:'infernoCyclone',name:'적염검도',icon:'🔥',role:'화염·범위 공격',bonus:'공격력 +8%'},
    {id:'stormNova',name:'빙뢰심법',icon:'⚡',role:'빙결·연쇄 제어',bonus:'무공 재사용 -10%'},
    {id:'astralAegis',name:'천성호신',icon:'🛡️',role:'방어·생존',bonus:'최대 HP +18'},
    {id:'verdantPlague',name:'청목독공',icon:'🌿',role:'독·체력 회복',bonus:'초당 체력 회복 +0.4'},
    {id:'eclipseRay',name:'월영비술',icon:'🌙',role:'관통·회심',bonus:'치명타 +5%'},
    {id:'tempestRift',name:'건곤풍뢰',icon:'🌀',role:'경공·충격파',bonus:'이동속도 +10%'}
  ];
  const BONUS=[
    {id:'attack',icon:'⚔️',name:'내공 단련',detail:'이번 원정 공격력 +10%',apply:()=>{player.damage*=1.1}},
    {id:'haste',icon:'📜',name:'운기 조식',detail:'무공 재사용 대기시간 -7%',apply:()=>{player.v481Haste=(player.v481Haste||0)+.07}},
    {id:'survive',icon:'🛡️',name:'호체 수련',detail:'최대 HP +16, 현재 HP +16',apply:()=>{player.maxHp+=16;player.hp=Math.min(player.maxHp,player.hp+16)}},
    {id:'move',icon:'💨',name:'경공 연마',detail:'이동속도 +8%',apply:()=>{player.speed*=1.08}}
  ];
  const pick=arr=>arr.length?arr[Math.floor(Math.random()*arr.length)]:null;
  const mix=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const el=id=>document.getElementById(id);
  const safe=s=>escapeHtml(String(s==null?'':s));
  const skill=id=>skillDefs[id]||{icon:'📜',name:id||'미발견',desc:''};
  const definition=id=>SCHOOLS.find(p=>p.id===id);
  const recipe=id=>skillFusionDefs[id];
  const owned=()=>player?.v482Paths||[];
  const school=id=>owned().find(p=>p.id===id);
  const ingredients=id=>{const f=recipe(id);return f?[...f.ingredients,f.key]:[]};
  const progress=p=>ingredients(p.id).filter(id=>p.materials?.[id]).length;
  let hudSignature='__init__';

  function ensureState(){
    if(!player)return;
    if(Array.isArray(player.v482Paths))return;
    const paths=[];
    const create=(id,bonused)=>{if(!recipe(id)||paths.some(p=>p.id===id)||paths.length>=MAX_PATHS)return null;
      const p={id,materials:{},fused:false,bonusApplied:!!bonused};paths.push(p);return p};
    // Older v4.8.1 checkpoints used one preferred path and at most three skills.
    // Preserve that path's previously applied passive bonus; never award it twice.
    if(player.v481Path)create(player.v481Path,true);
    for(const id of (runSkills||[])){
      const found=SCHOOLS.find(x=>x.id===id||ingredients(x.id).includes(id));
      if(found)create(found.id,found.id===player.v481Path);
    }
    for(const p of paths){
      for(const id of ingredients(p.id))if(runSkills.includes(id))p.materials[id]=true;
      p.fused=runSkills.includes(p.id);
      if(p.fused)ingredients(p.id).forEach(id=>p.materials[id]=true);
      if(!p.bonusApplied)grantBonus(p.id),p.bonusApplied=true;
    }
    // Key catalysts are collected as passive recipe components, not combat skills.
    for(const p of paths){
      const f=recipe(p.id);
      if(runSkills.includes(f.key)&&!p.fused){
        runSkills=runSkills.filter(id=>id!==f.key);
        delete runSkillLevels[f.key];delete skillCooldowns[f.key];
      }
    }
    player.v482Paths=paths;
    if(player.v481Rewards)player.v482Rewards=player.v481Rewards;
    // Old offers are incompatible with the three-school format.
    player.v481Offers=null;player.v481Replace=null;
  }

  function grantBonus(id){
    if(id==='infernoCyclone')player.damage*=1.08;
    else if(id==='stormNova')player.v481Haste=(player.v481Haste||0)+.10;
    else if(id==='astralAegis'){player.maxHp+=18;player.hp+=18}
    else if(id==='verdantPlague')player.regen+=.4;
    else if(id==='eclipseRay')player.crit+=5;
    else if(id==='tempestRift')player.speed*=1.1;
  }

  function addSchool(id){
    ensureState();
    if(owned().length>=MAX_PATHS||school(id)||!definition(id))return false;
    const p={id,materials:{},fused:false,bonusApplied:true};
    owned().push(p);
    grantBonus(id);
    // A chosen school starts with its first real, automatically cast martial art.
    const first=recipe(id).ingredients[0];
    addMaterial(p,first);
    return true;
  }

  function tryEvolve(p){
    const f=recipe(p.id);
    if(!f||p.fused||!ingredients(p.id).every(id=>p.materials[id]))return false;
    // Insert the core catalyst only temporarily to use the battle's genuine
    // three-component fusion (sound/animation/level math/skill unlock).
    const core=f.key;
    if(!runSkills.includes(core)){
      runSkills.push(core);
      runSkillLevels[core]=1;skillCooldowns[core]=1;
    }
    v39TryAutoFusion();
    p.fused=runSkills.includes(p.id);
    if(!p.fused){
      runSkills=runSkills.filter(id=>id!==core);
      delete runSkillLevels[core];delete skillCooldowns[core];
      console.warn('v4.8.2 fusion unavailable',p.id);
    }
    return p.fused;
  }

  function addMaterial(p,id){
    const f=recipe(p.id);
    if(!f||!ingredients(p.id).includes(id)||p.materials[id])return false;
    p.materials[id]=true;
    markSkillDiscovered(id);
    if(id!==f.key){
      if(!runSkills.includes(id)){
        runSkills.push(id);
        runSkillLevels[id]=1;
        skillCooldowns[id]=1.2;
      }
    }
    if(tryEvolve(p)){
      showToast(definition(p.id).icon+' '+definition(p.id).name+' · 상위 무공 진화!');
    }
    return true;
  }

  function levelUpSkill(id){
    if(!runSkills.includes(id)||skillLevel(id)>=5)return false;
    runSkillLevels[id]=Math.min(5,skillLevel(id)+1);
    skillCooldowns[id]=Math.min(skillCooldowns[id]||0,skillCooldown(id));
    return true;
  }

  function schoolOptions(){
    return mix(SCHOOLS.filter(p=>!school(p.id))).slice(0,MAX_PATHS)
      .map(p=>({type:'school',id:p.id,icon:p.icon,title:p.name+' · '+p.role,
        detail:'유파 슬롯 1칸 · '+p.bonus+' · '+ingredients(p.id).map(id=>skill(id).name).join(' + ')+' → '+skill(p.id).name}));
  }

  function rewardOptions(){
    ensureState();
    if(!owned().length)return schoolOptions();
    const options=[];
    for(const p of owned()){
      const f=recipe(p.id),next=ingredients(p.id).find(id=>!p.materials[id]);
      if(next){
        const k=skill(next);
        options.push({type:'material',id:next,path:p.id,icon:k.icon,
          title:definition(p.id).name+' · '+k.name,
          detail:(next===f.key?'🔑 핵심 심법 (별도 수집)':'⚔️ 전투 재료 무공')+
            ' · 진화 '+progress(p)+'/3 → '+(progress(p)+1)+'/3'});
      }else{
        const targets=[p.id,...f.ingredients].filter(id=>runSkills.includes(id)&&skillLevel(id)<5);
        if(targets.length){
          const id=targets[0],k=skill(id);
          options.push({type:'upgrade',id,path:p.id,icon:k.icon,
            title:definition(p.id).name+' · '+k.name+' 강화',
            detail:'무공 Lv.'+skillLevel(id)+' → Lv.'+(skillLevel(id)+1)});
        }
      }
    }
    if(owned().length<MAX_PATHS){
      const newSchool=pick(SCHOOLS.filter(p=>!school(p.id)));
      if(newSchool)options.push({type:'school',id:newSchool.id,icon:newSchool.icon,
        title:'새 유파 · '+newSchool.name,detail:newSchool.role+' · '+newSchool.bonus+' · 새 유파 슬롯 사용'});
    }
    if(options.length<3){
      const id=pick(runSkills.filter(id=>skillDefs[id]&&skillLevel(id)<5));
      if(id&&!options.some(o=>o.type==='upgrade'&&o.id===id)){
        options.push({type:'upgrade',id,icon:skill(id).icon,
          title:skill(id).name+' 강화',detail:'Lv.'+skillLevel(id)+' → Lv.'+(skillLevel(id)+1)});
      }
    }
    for(const b of mix(BONUS)){
      if(options.length>=3)break;
      options.push({type:'bonus',id:b.id,icon:b.icon,title:b.name,detail:b.detail});
    }
    return options.slice(0,3);
  }

  function renderReward(){
    ensureState();
    if(!player)return;
    const opts=player.v482Offers||[];
    el('itemDetail').innerHTML=
      '<div class="lootPause">📜 '+(!owned().length?'입문 · 유파 선택':'원정 비급 · 3개 중 택 1')+'</div>'+
      '<h3>'+(owned().length?'유파 성장 방향 선택':'전투 유파를 선택하세요')+'</h3>'+
      '<p class="subtitle">'+(owned().length?
        '유파는 최대 3개입니다. 각 유파의 무공 2종과 핵심 심법을 모으면 해당 유파가 진화합니다. 재료는 유파 내부에 축적됩니다.':
        '세 유파를 조합할 수 있습니다. 각 유파는 독립적으로 재료를 모아 진화합니다.')+'</p>'+
      '<div class="v481ChoiceList">'+opts.map((o,i)=>'<button class="v481Choice" data-v482-option="'+i+'">'+
        '<span class="v481Icon">'+o.icon+'</span><span><b>'+safe(o.title)+'</b><small>'+safe(o.detail)+'</small></span>'+
        '<span class="v481Chevron">›</span></button>').join('')+'</div>'+
      '<div class="v482ChoiceState">'+owned().map(p=>safe(definition(p.id)?.icon||'📜')+' '+safe(definition(p.id)?.name||p.id)+
        ' '+(p.fused?'진화 완료':progress(p)+'/3')).join('　')+'</div>';
    el('itemDetail').querySelectorAll('[data-v482-option]').forEach(b=>{
      b.onclick=()=>chooseOption(opts[Number(b.dataset.v482Option)]);
    });
    itemModal.classList.remove('hidden');
  }

  function chooseOption(o){
    if(!o||!running||!player)return;
    let success=false;
    if(o.type==='school')success=addSchool(o.id);
    else if(o.type==='material'){
      const p=school(o.path);success=!!(p&&addMaterial(p,o.id));
    }else if(o.type==='upgrade')success=levelUpSkill(o.id);
    else if(o.type==='bonus'){
      const b=BONUS.find(x=>x.id===o.id);
      if(b){b.apply();success=true}
    }
    if(!success)return;
    player.v482Rewards=(player.v482Rewards||0)+1;
    player.v482Offers=null;
    pendingSkillLoot=null;
    closeItemModal();
    hudSignature='';
    updateSkillHUD();
    if(o.type==='school')showToast('📜 '+definition(o.id).name+' 수련 시작! ('+owned().length+'/'+MAX_PATHS+')');
    else if(o.type==='material'&&!school(o.path)?.fused)showToast('📜 '+skill(o.id).name+' 습득 · '+definition(o.path).name+' '+progress(school(o.path))+'/3');
    else if(o.type==='upgrade')showToast('⬆️ '+skill(o.id).name+' Lv.'+skillLevel(o.id));
    else if(o.type==='bonus')showToast('🌟 '+BONUS.find(b=>b.id===o.id).name+' 적용');
  }

  // Override the previous v4.8.1 reward handler, NOT the underlying battle's
  // real skill casting and fusion math.
  showSkillLootModal=function(id){
    if(!player||!running)return;
    ensureState();
    paused=true;itemModalResume=true;
    if(!Array.isArray(player.v482Offers)||!player.v482Offers.length)
      player.v482Offers=rewardOptions();
    pendingSkillLoot=skillDefs[id]?id:'flame';
    renderReward();
  };
  acquireSkillFromChest=function(){
    if(!running||!player||pendingSkillLoot||!itemModal.classList.contains('hidden'))return;
    showSkillLootModal('flame');
  };

  const baseStart=start;
  start=function(){
    hudSignature='__init__';
    const result=baseStart();
    if(player){player.v482Paths=[];player.v482Offers=null;player.v482Rewards=0}
    syncHud();
    return result;
  };
  const baseFinish=finishRun;
  finishRun=function(cleared){
    const result=baseFinish(cleared);
    const h=el('v482PathsHud');if(h)h.classList.add('hidden');
    return result;
  };

  // Lightweight, event-driven battle panel; never rebuilt during each frame.
  const hud=document.createElement('div');
  hud.id='v482PathsHud';hud.className='hidden';document.body.appendChild(hud);
  function syncHud(){
    if(!running||!player){hud.classList.add('hidden');return}
    ensureState();
    const s=owned().map(p=>p.id+':'+progress(p)+':'+p.fused+':'+
      (p.fused?(runSkillLevels[p.id]||1):'')).join('|');
    if(hudSignature===s)return;
    hudSignature=s;hud.classList.remove('hidden');
    hud.innerHTML='<div class="v482HudHeading">🏮 수련 중인 유파 <b>'+owned().length+'/'+MAX_PATHS+'</b></div>'+
      '<div class="v482HudRows">'+Array.from({length:MAX_PATHS},(_,i)=>{
        const p=owned()[i],meta=p&&definition(p.id);
        return '<div class="v482HudRow">'+(p?
          '<span>'+meta.icon+' '+meta.name+'</span><b>'+(p.fused?'✨ 진화':progress(p)+'/3')+'</b>':
          '<span class="v482Empty">＋ 빈 유파</span>')+'</div>';
      }).join('')+'</div>';
  }
  updateSkillHUD=function(){
    if(skillBar)skillBar.classList.add('hidden');
    syncHud();
  };
  const baseRenderHome=renderHome;
  renderHome=function(){
    const r=baseRenderHome();
    el('stageHomeDesc').textContent='7:00 · 유파 최대 3개 · 유파별 독립 진화';
    el('homeSkills').innerHTML=
      '<div class="homeSkill"><span class="si">🏮</span><small>유파 슬롯</small><b>최대 3개</b></div>'+
      '<div class="homeSkill"><span class="si">📜</span><small>재료 수집</small><b>각 유파별 2무공 + 1심법</b></div>'+
      '<div class="homeSkill"><span class="si">✨</span><small>진화</small><b>조건 충족 시 자동</b></div>';
    return r;
  };

  // Pause-room journal. Reuse v4.8.0's pause control and resume / save logic.
  const overlay=el('v480PauseOverlay'),panel=overlay?.querySelector('.v480Panel');
  let activeTab='stats';
  if(panel){
    const details=el('v480PauseDetails');
    details.insertAdjacentHTML('afterend',
      '<div id="v482Journal" class="v482Journal"><div class="v482Tabs" role="tablist" aria-label="원정 정보">'+
      '<button class="v482Tab active" data-v482-tab="stats" role="tab">능력</button>'+
      '<button class="v482Tab" data-v482-tab="gear" role="tab">장비·가방</button>'+
      '<button class="v482Tab" data-v482-tab="schools" role="tab">유파</button>'+
      '<button class="v482Tab" data-v482-tab="recipes" role="tab">진화 도감</button>'+
      '</div><div class="v482JournalBody" id="v482JournalBody" role="tabpanel"></div></div>');
    overlay.querySelectorAll('[data-v482-tab]').forEach(btn=>{
      btn.onclick=()=>{
        activeTab=btn.dataset.v482Tab;renderJournal();
      };
    });
  }

  function statLine(label,value){
    return '<div class="v482Stat"><small>'+safe(label)+'</small><b>'+safe(value)+'</b></div>';
  }
  function num(x,d=1){return Number(Number(x||0).toFixed(d)).toLocaleString('ko-KR')}
  function statsTab(){
    if(!player)return '<p class="subtitle">진행 중인 원정이 없습니다.</p>';
    const w=weaponDefs[player.weaponType]||weaponDefs.sword;
    const hp=Math.max(0,player.hp),max=Math.max(1,player.maxHp);
    const stats=[
      ['전투 레벨','Lv.'+level],['문파 수련 레벨','Lv.'+profile.soulLevel],
      ['무기',w.icon+' '+w.name],['처치 수',kills+'명'],
      ['공격력',num(player.damage)],['공격 주기',num(player.fireRate,2)+'초'],
      ['초당 공격 횟수',num(1/Math.max(.05,player.fireRate),2)],
      ['이동 속도',num(player.speed)],['치명타 확률',num(player.crit)+'%'],
      ['피해 감소',num(player.damageReduction)+'%'],
      ['초당 HP 회복',num(player.regen,2)],
      ['무공 재사용 감소',num((player.v481Haste||0)*100)+'%'],
      ['전투 획득 골드',num(runGold,0)]
    ];
    return '<div class="v482StatTop"><strong>❤️ HP '+num(hp,0)+' / '+num(max,0)+'</strong>'+
      '<div class="v482HpTrack"><i style="width:'+Math.min(100,hp/max*100)+'%"></i></div></div>'+
      '<div class="v482StatGrid">'+stats.map(x=>statLine(x[0],x[1])).join('')+'</div>'+
      '<p class="v482JournalHelp">수치는 현재 원정 중 장비·무공·유파 보너스를 반영합니다. 공격 주기는 값이 낮을수록 빠릅니다.</p>';
  }

  function itemRow(i,slot){
    if(!i)return '<div class="v482ItemRow empty"><span>·</span><div><small>'+safe(slot)+'</small><b>착용하지 않음</b></div></div>';
    const stats=Object.entries(i.stats||{}).slice(0,5).map(([k,v])=>{
      const p=statLabel(k,v);return safe(p[0]+' '+p[1]);
    }).join(' · ');
    return '<div class="v482ItemRow"><span class="v482ItemIcon">'+safe(i.icon||'🎒')+'</span>'+
      '<div><small>'+safe(slot)+' · '+safe((rarityInfo[i.rarity]||{}).name||'장비')+'</small>'+
      '<b class="'+safe(i.rarity||'common')+'">'+safe(i.name)+'</b>'+
      '<small>'+stats+(i.score?' · 전투력 '+safe(i.score):'')+'</small></div></div>';
  }
  function gearTab(){
    const slots=Object.keys(equipSlots);
    const equipped=new Set(Object.values(profile.equipped||{}).filter(Boolean));
    const bag=(profile.inventory||[]).filter(i=>i&&!equipped.has(i.id))
      .slice().sort((a,b)=>(b.score||0)-(a.score||0));
    return '<h3>착용 중 장비 <small>'+equipped.size+'개</small></h3>'+
      '<div class="v482ItemList">'+slots.map(s=>itemRow(equippedItem(s),equipSlots[s].name)).join('')+'</div>'+
      '<h3>보유 아이템 <small>'+bag.length+'개 · 조회 전용</small></h3>'+
      '<div class="v482ItemList">'+(bag.length?bag.map(i=>itemRow(i,slotLabelForItem(i))).join(''):
        '<p class="subtitle">보관 중인 다른 장비가 없습니다.</p>')+'</div>'+
      '<p class="v482JournalHelp">안전한 원정 중단을 위해 이 화면에서는 장비를 변경하지 않습니다. 메인 화면의 장비 메뉴에서 정비할 수 있습니다.</p>';
  }

  function pathCard(p,id){
    const m=definition(id),f=recipe(id),isOwned=!!p;
    const vals=ingredients(id).map(k=>{
      const got=!!(p?.materials?.[k]||p?.fused);
      return '<div class="v482Material '+(got?'got':'')+'"><span>'+(got?'✓':'○')+' '+skill(k).icon+'</span>'+
        '<small>'+safe(skill(k).name)+(k===f.key?' · 핵심':'')+'</small></div>';
    }).join('');
    return '<div class="v482PathCard"><div class="v482PathHead"><b>'+m.icon+' '+m.name+
      '</b><small>'+(p?.fused?'✨ 진화 완료':isOwned?progress(p)+'/3 수집':'미수련')+'</small></div>'+
      '<p>'+m.role+' · '+m.bonus+'</p><div class="v482Materials">'+vals+'</div>'+
      '<div class="v482Progress"><i style="width:'+(isOwned?progress(p)/3*100:0)+'%"></i></div>'+
      '<div class="v482PathEvolution">'+(p?.fused?'✨ '+skill(id).name+' Lv.'+(runSkillLevels[id]||1):
        '목표 진화: '+skill(id).name)+'</div></div>';
  }
  function schoolsTab(){
    ensureState();
    return '<p class="v482JournalHelp">이번 원정 유파 '+owned().length+'/'+MAX_PATHS+
      ' · 각 유파의 재료는 다른 유파의 슬롯을 차지하지 않습니다.</p>'+
      Array.from({length:MAX_PATHS},(_,i)=>{
        const p=owned()[i];
        return p?pathCard(p,p.id):'<div class="v482Vacant">＋ 비어 있는 유파 슬롯 '+(i+1)+'</div>';
      }).join('');
  }
  function recipesTab(){
    ensureState();
    return '<p class="v482JournalHelp">진화 조건: 재료 무공 2개 + 해당 유파의 핵심 심법 1개. 세 가지를 모두 모으면 즉시 진화하며, 재료 무공은 하나의 상위 무공으로 합쳐집니다.</p>'+
      SCHOOLS.map(m=>pathCard(school(m.id),m.id)).join('');
  }

  function renderJournal(){
    const body=el('v482JournalBody');
    if(!body||overlay.classList.contains('hidden'))return;
    ensureState();
    overlay.querySelectorAll('[data-v482-tab]').forEach(b=>{
      const selected=b.dataset.v482Tab===activeTab;
      b.classList.toggle('active',selected);
      b.setAttribute('aria-selected',String(selected));
    });
    body.innerHTML=activeTab==='gear'?gearTab():activeTab==='schools'?schoolsTab():
      activeTab==='recipes'?recipesTab():statsTab();
    body.scrollTop=0;
  }
  // The original handler is already registered; these listeners run afterwards.
  el('v480PauseButton').addEventListener('click',()=>{if(!overlay.classList.contains('hidden'))renderJournal()});
  el('v480Continue').addEventListener('click',()=>{if(!overlay.classList.contains('hidden'))renderJournal()});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&running&&!overlay.classList.contains('hidden'))renderJournal();
  });
  el('v480HelpInGame').addEventListener('click',()=>{activeTab='stats'});
  // Expose the journal refresh for inspection without modifying gameplay.
  window.MurimJournal={render:renderJournal,getPaths:()=>owned().map(p=>({
    id:p.id,progress:progress(p),fused:p.fused
  }))};
  const pauseGuide=document.querySelector('#skillScreen .subtitle');
  if(pauseGuide)pauseGuide.textContent='각 원정에서 유파 최대 3개를 선택합니다. 재료 무공 2종과 핵심 심법 1종은 각 유파 내부에 축적되고, 조건을 완성하면 해당 유파가 자동 진화합니다. 3개 유파는 모두 독립적으로 진화할 수 있습니다. 일시정지의 유파/진화 도감 탭에서 진행 상황을 확인하세요.';

  window.MurimBuildVersion='4.8.2';
})();
