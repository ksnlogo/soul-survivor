(() => {
  const KEY='murimAudioSettingsV5';
  const defaults={master:.90,music:.52,sfx:.74,musicOn:true,sfxOn:true};
  let settings={...defaults};try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  const BGM={home:'assets/audio/bgm_home.mp3',forest:'assets/audio/bgm_bamboo.mp3',frost:'assets/audio/bgm_snow.mp3',ember:'assets/audio/bgm_canyon.mp3',crypt:'assets/audio/bgm_tomb.mp3',boss:'assets/audio/bgm_boss.mp3'};
  const SFX={ui:'assets/audio/sfx_ui.mp3',sword:'assets/audio/sfx_sword.mp3',dagger:'assets/audio/sfx_dagger.mp3',bow:'assets/audio/sfx_bow.mp3',fan:'assets/audio/sfx_fan.mp3',hammer:'assets/audio/sfx_hammer.mp3',spear:'assets/audio/sfx_spear.mp3',ring:'assets/audio/sfx_ring.mp3',talisman:'assets/audio/sfx_talisman.mp3',hit:'assets/audio/sfx_hit.mp3',heavyHit:'assets/audio/sfx_heavy.mp3',chestHit:'assets/audio/sfx_chest_hit.mp3',chestBreak:'assets/audio/sfx_chest_break.mp3',pickup:'assets/audio/sfx_pickup.mp3',rare:'assets/audio/sfx_rare.mp3',boss:'assets/audio/sfx_boss.mp3',heal:'assets/audio/sfx_heal.mp3',success:'assets/audio/sfx_success.mp3',fail:'assets/audio/sfx_fail.mp3'};
  const SK=['flame','lightning','frost','meteor','blades','ward','poison','orbit','laser','shadow','wind','quake','dragonHeart','stormCore','starSigil','worldSeed','moonSeal','primalCore','infernoCyclone','stormNova','astralAegis','verdantPlague','eclipseRay','tempestRift'];
  const SKILL={};for(const k of SK)SKILL[k]=`assets/audio/sfx_skill_${k}.mp3`;
  const pools=new Map(),last=new Map();let bgm=null,currentMode='none',unlocked=false,primeStarted=false,activeSfx=0;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
  const mv=()=>Math.max(0,Math.min(1,settings.master*settings.music));
  const sv=()=>Math.max(0,Math.min(1,settings.master*settings.sfx));
  function make(src,loop=false){const a=new Audio();a.preload='auto';a.loop=loop;a.playsInline=true;a.setAttribute('playsinline','');a.src=src;return a}
  function primeOne(src){if(pools.has(src))return;const a=make(src);try{a.load()}catch{}pools.set(src,[a])}
  function prime(){
    if(primeStarted)return;primeStarted=true;
    const queue=[...Object.values(SFX),...Object.values(SKILL)];let i=0;
    const step=()=>{let n=0;while(i<queue.length&&n++<3)primeOne(queue[i++]);if(i<queue.length){if('requestIdleCallback'in window)requestIdleCallback(step,{timeout:400});else setTimeout(step,55)}};
    setTimeout(step,120);
  }
  function unlock(){unlocked=true;prime();return Promise.resolve(true)}
  async function playMusic(mode='home',force=false){currentMode=mode;if(!settings.musicOn)return false;const src=BGM[mode]||BGM.home;if(bgm&&!force&&bgm.dataset.mode===mode&&!bgm.paused)return true;if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}bgm=make(src,true);bgm.dataset.mode=mode;bgm.volume=mv();try{await bgm.play();return true}catch(e){console.warn('BGM blocked',e);return false}}
  function stopMusic(){if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}}
  function playFile(src,key,gap=80,priority=1){
    if(!settings.sfxOn||!src)return false;
    const now=performance.now(),prev=last.get(key)||0;if(now-prev<gap)return false;
    if(activeSfx>=7&&priority<2)return false;last.set(key,now);
    let arr=pools.get(src);if(!arr){primeOne(src);arr=pools.get(src)}
    let a=arr.find(x=>x.paused||x.ended);
    if(!a&&arr.length<2){a=make(src);arr.push(a)}
    if(!a){if(priority<2)return false;a=arr[0];try{a.pause()}catch{}}
    try{a.currentTime=0}catch{}a.volume=sv();activeSfx++;
    let done=false;const release=()=>{if(done)return;done=true;activeSfx=Math.max(0,activeSfx-1);a.removeEventListener('ended',release);a.removeEventListener('pause',release);a.removeEventListener('error',release)};
    a.addEventListener('ended',release,{once:true});a.addEventListener('pause',release,{once:true});a.addEventListener('error',release,{once:true});
    try{const p=a.play();if(p?.catch)p.catch(release)}catch{release();return false}return true;
  }
  const sfx={
    ui:()=>playFile(SFX.ui,'ui',90,0), sword:()=>playFile(SFX.sword,'sword',105,2), dagger:()=>playFile(SFX.dagger,'dagger',80,2), bow:()=>playFile(SFX.bow,'bow',100,2), fan:()=>playFile(SFX.fan,'fan',120,2), hammer:()=>playFile(SFX.hammer,'hammer',150,2), spear:()=>playFile(SFX.spear,'spear',110,2), ring:()=>playFile(SFX.ring,'ring',110,2), talisman:()=>playFile(SFX.talisman,'talisman',120,2),
    hit:()=>playFile(SFX.hit,'hit',95,0), heavyHit:()=>playFile(SFX.heavyHit,'heavyHit',140,1), chestHit:()=>playFile(SFX.chestHit,'chestHit',120,1), chestBreak:()=>playFile(SFX.chestBreak,'chestBreak',220,2), pickup:()=>playFile(SFX.pickup,'pickup',120,1), rare:()=>playFile(SFX.rare,'rare',250,2), boss:()=>playFile(SFX.boss,'boss',500,2), heal:()=>playFile(SFX.heal,'heal',240,1), success:()=>playFile(SFX.success,'success',500,2), fail:()=>playFile(SFX.fail,'fail',500,2)
  };
  function skill(id){return playFile(SKILL[id]||SFX.talisman,'skill_'+id,260,2)}
  function set(part,val){if(part==='musicOn'||part==='sfxOn')settings[part]=!!val;else settings[part]=Math.max(0,Math.min(1,Number(val)||0));persist();if(bgm)bgm.volume=mv();if(part==='musicOn'){if(settings.musicOn)playMusic(currentMode==='none'?'home':currentMode,true);else stopMusic()}}
  function mapMode(id){return ({forest:'forest',frost:'frost',ember:'ember',crypt:'crypt'})[id]||'forest'}
  function state(){return {supported:true,state:unlocked?'ready':'tap-required',musicMode:currentMode,playingMode:bgm&&!bgm.paused?currentMode:'none',activeSfx,settings:{...settings}}}
  function resetSettings(){settings={...defaults};persist();if(bgm)bgm.volume=mv();playMusic(currentMode==='none'?'home':currentMode,true)}
  async function test(){unlock();settings.musicOn=settings.sfxOn=true;persist();const ok=await playMusic('home',true);sfx.sword();setTimeout(()=>skill('flame'),260);return ok}
  document.addEventListener('pointerdown',prime,{once:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(bgm)bgm.pause()}else if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)});
  window.addEventListener('pageshow',()=>{if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)});
  window.MurimAudio={settings,set,unlock,playMusic,stopMusic,mapMode,sfx,skill,state,resetSettings,defaults,test,prime};
})();
