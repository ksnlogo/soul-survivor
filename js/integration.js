(() => {
  const A=window.MurimAudio;if(!A)return;
  const homePanel=document.querySelector('#startScreen .heroPanel');
  if(homePanel&&!document.getElementById('audioSettingsBtn')){
    const b=document.createElement('button');b.id='audioSettingsBtn';b.className='btn ghost wide audioSettingsBtn';b.textContent='🎵 소리 설정';homePanel.appendChild(b);
  }
  const overlay=document.createElement('div');overlay.id='audioSettingsScreen';overlay.className='overlay hidden';
  overlay.innerHTML=`<div class="panel">
    <div class="sectionTitle"><h2>🎵 소리 설정</h2><span id="audioStateText">오디오 준비</span></div>
    <p class="subtitle">iPhone Safari에서는 첫 터치로 오디오가 활성화됩니다. 아래 <b>소리 점검</b>을 누르면 BGM과 효과음을 즉시 확인할 수 있습니다.</p>
    <div class="audioRow"><label>전체</label><input id="audMaster" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audMasterV"></span></div>
    <div class="audioRow"><label>배경음악</label><input id="audMusic" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audMusicV"></span></div>
    <div class="audioRow"><label>효과음</label><input id="audSfx" type="range" min="0" max="1" step="0.01"><span class="audioValue" id="audSfxV"></span></div>
    <div class="toggleRow"><span>배경음악 사용</span><button class="toggleBtn" id="audMusicOn"></button></div>
    <div class="toggleRow"><span>효과음 사용</span><button class="toggleBtn" id="audSfxOn"></button></div>
    <div class="btnRow mt12"><button class="btn gold" id="audioTestBtn">▶ 소리 점검</button><button class="btn ghost" id="audioResetBtn">설정 초기화</button></div>
    <button class="btn secondary wide mt12" id="audioBackBtn">돌아가기</button>
  </div>`;
  document.body.appendChild(overlay);
  function sync(){
    const s=A.settings;
    audMaster.value=s.master;audMusic.value=s.music;audSfx.value=s.sfx;
    audMasterV.textContent=Math.round(s.master*100)+'%';audMusicV.textContent=Math.round(s.music*100)+'%';audSfxV.textContent=Math.round(s.sfx*100)+'%';
    audMusicOn.textContent=s.musicOn?'켜짐':'꺼짐';audMusicOn.classList.toggle('on',s.musicOn);
    audSfxOn.textContent=s.sfxOn?'켜짐':'꺼짐';audSfxOn.classList.toggle('on',s.sfxOn);
    const st=A.state();audioStateText.textContent=!st.supported?'지원 안 됨':st.state==='running'?'재생 준비됨':st.state==='suspended'?'터치 필요':'오디오 준비';
  }
  audMaster.oninput=e=>{A.set('master',e.target.value);sync()};audMusic.oninput=e=>{A.set('music',e.target.value);sync()};audSfx.oninput=e=>{A.set('sfx',e.target.value);sync()};
  audMusicOn.onclick=async()=>{await A.unlock();A.set('musicOn',!A.settings.musicOn);if(A.settings.musicOn)A.playMusic('home',true);A.sfx.ui();sync()};
  audSfxOn.onclick=async()=>{await A.unlock();A.set('sfxOn',!A.settings.sfxOn);A.sfx.ui();sync()};
  audioSettingsBtn.onclick=async()=>{await A.unlock();if(A.settings.musicOn)A.playMusic('home');A.sfx.ui();sync();startScreen.classList.add('hidden');overlay.classList.remove('hidden')};
  audioTestBtn.onclick=async()=>{await A.unlock();A.set('musicOn',true);A.set('sfxOn',true);A.playMusic('home',true);A.sfx.success();setTimeout(sync,80)};
  audioResetBtn.onclick=async()=>{await A.unlock();A.resetSettings();A.sfx.ui();sync()};
  audioBackBtn.onclick=()=>{A.sfx.ui();overlay.classList.add('hidden');startScreen.classList.remove('hidden')};
  sync();

  document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#audioSettingsBtn,#audioBackBtn,#audioTestBtn,#audioResetBtn'))A.sfx.ui()},true);
  const baseStart=start;start=function(){A.unlock().then(()=>A.playMusic(A.mapMode(currentMap?.id||'forest'),true));return baseStart()};
  const baseFinish=finishRun;finishRun=function(cleared=false){const r=baseFinish(cleared);cleared?A.sfx.success():A.sfx.fail();A.playMusic('home',true);return r};
  const baseBoss=spawnBoss;spawnBoss=function(){const r=baseBoss();A.sfx.boss();A.playMusic('boss',true);return r};
  const baseMidBoss=spawnMidBoss;spawnMidBoss=function(){const r=baseMidBoss();A.sfx.boss();return r};
  const baseShoot=shoot;shoot=function(){const wt=player?.weaponType||'sword',r=baseShoot(),key={sword:'sword',dagger:'dagger',bow:'bow',staff:'fan',hammer:'hammer',spear:'spear',axe:'ring',grimoire:'talisman'}[wt];if(key)A.sfx[key]();return r};
  const baseDamageEnemy=damageEnemy;damageEnemy=function(e,b){const hp=e?.hp,r=baseDamageEnemy(e,b);if(hp!=null&&e&&e.hp<hp)A.sfx.hit();return r};
  const baseDirect=dealDirectDamage;dealDirectDamage=function(e,dmg,crit,color){const hp=e?.hp,r=baseDirect(e,dmg,crit,color);if(hp!=null&&e&&e.hp<hp)(crit?A.sfx.heavyHit():A.sfx.hit());return r};
  if(typeof damageChest==='function'){const f=damageChest;damageChest=function(c,amount,color){const before=c?.hp,wasBroken=!!c?.broken,r=f(c,amount,color);if(!wasBroken&&c?.broken)A.sfx.chestBreak();else if(before!=null&&c?.hp<before)A.sfx.chestHit();return r}};
  if(typeof acquireRunItem==='function'){const f=acquireRunItem;acquireRunItem=function(item){const r=f(item);if(item?.rarity&&['epic','legendary','mythic'].includes(item.rarity))A.sfx.rare();else A.sfx.pickup();return r}};
})();
