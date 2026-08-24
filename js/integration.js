(() => {
  const A=window.MurimAudio;
  if(!A)return;

  // Settings UI is injected rather than entangling the main game DOM.
  const homePanel=document.querySelector('#startScreen .heroPanel');
  if(homePanel&&!document.getElementById('audioSettingsBtn')){
    const b=document.createElement('button');b.id='audioSettingsBtn';b.className='btn ghost wide audioSettingsBtn';b.textContent='🎵 소리 설정';homePanel.appendChild(b);
  }
  const overlay=document.createElement('div');
  overlay.id='audioSettingsScreen';overlay.className='overlay hidden';
  overlay.innerHTML=`<div class="panel">
    <div class="sectionTitle"><h2>🎵 소리 설정</h2><span>기기에서 바로 저장</span></div>
    <p class="subtitle">모바일 브라우저 정책상 첫 터치 이후부터 음악과 효과음이 활성화됩니다.</p>
    <div class="audioRow"><label>전체</label><input id="audMaster" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audMasterV"></span></div>
    <div class="audioRow"><label>배경음악</label><input id="audMusic" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audMusicV"></span></div>
    <div class="audioRow"><label>효과음</label><input id="audSfx" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audSfxV"></span></div>
    <div class="toggleRow"><span>배경음악 사용</span><button class="toggleBtn" id="audMusicOn"></button></div>
    <div class="toggleRow"><span>효과음 사용</span><button class="toggleBtn" id="audSfxOn"></button></div>
    <button class="btn secondary wide mt12" id="audioBackBtn">돌아가기</button>
  </div>`;
  document.body.appendChild(overlay);

  function sync(){
    const s=A.settings;
    for(const [id,k] of [['audMaster','master'],['audMusic','music'],['audSfx','sfx']]){
      const el=document.getElementById(id),v=document.getElementById(id+'V'.replace('aud',''));
      el.value=s[k];
    }
    document.getElementById('audMasterV').textContent=Math.round(s.master*100)+'%';
    document.getElementById('audMusicV').textContent=Math.round(s.music*100)+'%';
    document.getElementById('audSfxV').textContent=Math.round(s.sfx*100)+'%';
    const mo=document.getElementById('audMusicOn'),so=document.getElementById('audSfxOn');
    mo.textContent=s.musicOn?'켜짐':'꺼짐';mo.classList.toggle('on',s.musicOn);
    so.textContent=s.sfxOn?'켜짐':'꺼짐';so.classList.toggle('on',s.sfxOn);
  }
  document.getElementById('audMaster').oninput=e=>{A.set('master',e.target.value);sync()};
  document.getElementById('audMusic').oninput=e=>{A.set('music',e.target.value);sync()};
  document.getElementById('audSfx').oninput=e=>{A.set('sfx',e.target.value);sync()};
  document.getElementById('audMusicOn').onclick=()=>{A.set('musicOn',!A.settings.musicOn);A.sfx.ui();sync()};
  document.getElementById('audSfxOn').onclick=()=>{A.set('sfxOn',!A.settings.sfxOn);A.sfx.ui();sync()};
  document.getElementById('audioSettingsBtn').onclick=()=>{A.unlock();A.sfx.ui();sync();startScreen.classList.add('hidden');overlay.classList.remove('hidden')};
  document.getElementById('audioBackBtn').onclick=()=>{A.sfx.ui();overlay.classList.add('hidden');startScreen.classList.remove('hidden')};
  sync();

  // UI clicks, but throttled inside the audio engine.
  document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#audioSettingsBtn,#audioBackBtn'))A.sfx.ui()},true);

  const baseStart=start;
  start=function(){
    A.unlock();
    const r=baseStart();
    A.playMusic(A.mapMode(currentMap?.id||'forest'),true);
    return r;
  };
  const baseFinish=finishRun;
  finishRun=function(cleared=false){
    const r=baseFinish(cleared);
    cleared?A.sfx.success():A.sfx.fail();
    A.playMusic('home',true);
    return r;
  };
  const baseBoss=spawnBoss;
  spawnBoss=function(){
    const r=baseBoss();
    A.sfx.boss();A.playMusic('boss',true);
    return r;
  };
  const baseMidBoss=spawnMidBoss;
  spawnMidBoss=function(){const r=baseMidBoss();A.sfx.boss();return r};

  const baseShoot=shoot;
  shoot=function(){
    const wt=player?.weaponType||'sword';
    const r=baseShoot();
    ({sword:'sword',dagger:'dagger',bow:'bow',staff:'fan',hammer:'hammer',spear:'spear',axe:'ring',grimoire:'talisman'}[wt]&&A.sfx[{sword:'sword',dagger:'dagger',bow:'bow',staff:'fan',hammer:'hammer',spear:'spear',axe:'ring',grimoire:'talisman'}[wt]]());
    return r;
  };
  const baseDamageEnemy=damageEnemy;
  damageEnemy=function(e,b){const hp=e?.hp;const r=baseDamageEnemy(e,b);if(hp!=null&&e&&e.hp<hp)A.sfx.hit();return r};
  const baseDirect=dealDirectDamage;
  dealDirectDamage=function(e,dmg,crit,color){const hp=e?.hp;const r=baseDirect(e,dmg,crit,color);if(hp!=null&&e&&e.hp<hp)(crit?A.sfx.heavyHit():A.sfx.hit());return r};

  if(typeof damageChest==='function'){
    const baseChest=damageChest;
    damageChest=function(c,amount,color){
      const before=c?.hp,wasBroken=!!c?.broken;
      const r=baseChest(c,amount,color);
      if(!wasBroken&&c?.broken)A.sfx.chestBreak();
      else if(before!=null&&c?.hp<before)A.sfx.chestHit();
      return r;
    };
  }
  if(typeof acquireRunItem==='function'){
    const baseAcquire=acquireRunItem;
    acquireRunItem=function(item){const r=baseAcquire(item);if(item?.rarity&&['epic','legendary','mythic'].includes(item.rarity))A.sfx.rare();else A.sfx.pickup();return r};
  }
  if(typeof gainXp==='function'){
    const baseGain=gainXp;
    gainXp=function(v){return baseGain(v)};
  }

  // Home ambience after the first user gesture.
  document.addEventListener('pointerdown',()=>{if(!running)A.playMusic('home')},{once:true});
})();
