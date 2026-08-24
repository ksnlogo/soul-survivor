(() => {
  const KEY='murimAudioSettingsV3';
  const defaults={master:.90,music:.60,sfx:.72,musicOn:true,sfxOn:true};
  let settings={...defaults};
  try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  const BGM={home:'assets/audio/bgm_home.mp3',forest:'assets/audio/bgm_bamboo.mp3',frost:'assets/audio/bgm_snow.mp3',ember:'assets/audio/bgm_canyon.mp3',crypt:'assets/audio/bgm_tomb.mp3',boss:'assets/audio/bgm_boss.mp3'};
  const SFX={ui:'assets/audio/sfx_ui.mp3',sword:'assets/audio/sfx_sword.mp3',dagger:'assets/audio/sfx_dagger.mp3',bow:'assets/audio/sfx_bow.mp3',fan:'assets/audio/sfx_fan.mp3',hammer:'assets/audio/sfx_hammer.mp3',spear:'assets/audio/sfx_spear.mp3',ring:'assets/audio/sfx_ring.mp3',talisman:'assets/audio/sfx_talisman.mp3',hit:'assets/audio/sfx_hit.mp3',heavyHit:'assets/audio/sfx_heavy.mp3',chestHit:'assets/audio/sfx_chest_hit.mp3',chestBreak:'assets/audio/sfx_chest_break.mp3',pickup:'assets/audio/sfx_pickup.mp3',rare:'assets/audio/sfx_rare.mp3',boss:'assets/audio/sfx_boss.mp3',heal:'assets/audio/sfx_heal.mp3',success:'assets/audio/sfx_success.mp3',fail:'assets/audio/sfx_fail.mp3'};
  let bgm=null,currentMode='none',lastSfx={},activeSfx=new Set();
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
  const musicVolume=()=>Math.max(0,Math.min(1,settings.master*settings.music));
  const sfxVolume=()=>Math.max(0,Math.min(1,settings.master*settings.sfx));
  function createAudio(src,loop=false){const a=new Audio(src);a.preload='auto';a.loop=loop;a.playsInline=true;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');return a}
  function unlock(){return Promise.resolve(true)}
  async function playMusic(mode='home',force=false){
    currentMode=mode;if(!settings.musicOn)return false;const src=BGM[mode]||BGM.home;
    if(bgm&&!force&&bgm.dataset.mode===mode&&!bgm.paused)return true;
    if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}
    bgm=createAudio(src,true);bgm.dataset.mode=mode;bgm.volume=musicVolume();
    try{await bgm.play();return true}catch(e){console.warn('BGM play blocked',e);return false}
  }
  function stopMusic(){if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}}
  function playSfx(name,minGap=45){
    if(!settings.sfxOn||!SFX[name])return;const now=performance.now();if(now-(lastSfx[name]||0)<minGap)return;lastSfx[name]=now;
    const a=createAudio(SFX[name]);a.volume=sfxVolume();activeSfx.add(a);const done=()=>activeSfx.delete(a);a.addEventListener('ended',done,{once:true});a.addEventListener('error',done,{once:true});
    const p=a.play();if(p&&p.catch)p.catch(done);
  }
  const sfx={ui:()=>playSfx('ui',70),sword:()=>playSfx('sword',75),dagger:()=>playSfx('dagger',55),bow:()=>playSfx('bow',80),fan:()=>playSfx('fan',90),hammer:()=>playSfx('hammer',120),spear:()=>playSfx('spear',85),ring:()=>playSfx('ring',75),talisman:()=>playSfx('talisman',95),hit:()=>playSfx('hit',42),heavyHit:()=>playSfx('heavyHit',100),chestHit:()=>playSfx('chestHit',85),chestBreak:()=>playSfx('chestBreak',0),pickup:()=>playSfx('pickup',90),rare:()=>playSfx('rare',0),boss:()=>playSfx('boss',0),heal:()=>playSfx('heal',0),success:()=>playSfx('success',0),fail:()=>playSfx('fail',0)};
  function set(part,val){if(part==='musicOn'||part==='sfxOn')settings[part]=!!val;else settings[part]=Math.max(0,Math.min(1,Number(val)||0));persist();if(bgm)bgm.volume=musicVolume();for(const a of activeSfx)a.volume=sfxVolume();if(part==='musicOn'){if(settings.musicOn)playMusic(currentMode==='none'?'home':currentMode,true);else stopMusic()}}
  function mapMode(id){return ({forest:'forest',frost:'frost',ember:'ember',crypt:'crypt'})[id]||'forest'}
  function state(){return {supported:true,state:'ready',musicMode:currentMode,playingMode:bgm&&!bgm.paused?currentMode:'none',settings:{...settings}}}
  function resetSettings(){settings={...defaults};persist();if(bgm)bgm.volume=musicVolume();playMusic(currentMode==='none'?'home':currentMode,true)}
  async function test(){settings.musicOn=true;settings.sfxOn=true;persist();const ok=await playMusic('home',true);playSfx('success',0);return ok}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(bgm)bgm.pause()}else if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)});
  window.addEventListener('pageshow',()=>{if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)});
  window.MurimAudio={settings,set,unlock,playMusic,stopMusic,mapMode,sfx,state,resetSettings,defaults,test};
})();
