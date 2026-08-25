(() => {
  const KEY='murimAudioSettingsV6';
  const defaults={master:.90,music:.52,sfx:.72,musicOn:true,sfxOn:true};
  let settings={...defaults};
  try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}

  const BGM={
    home:'assets/audio/bgm_home.mp3',forest:'assets/audio/bgm_bamboo.mp3',
    frost:'assets/audio/bgm_snow.mp3',ember:'assets/audio/bgm_canyon.mp3',
    crypt:'assets/audio/bgm_tomb.mp3',boss:'assets/audio/bgm_boss.mp3'
  };
  const SFX={
    ui:'assets/audio/sfx_ui.mp3',sword:'assets/audio/sfx_sword.mp3',dagger:'assets/audio/sfx_dagger.mp3',
    bow:'assets/audio/sfx_bow.mp3',fan:'assets/audio/sfx_fan.mp3',hammer:'assets/audio/sfx_hammer.mp3',
    spear:'assets/audio/sfx_spear.mp3',ring:'assets/audio/sfx_ring.mp3',talisman:'assets/audio/sfx_talisman.mp3',
    hit:'assets/audio/sfx_hit.mp3',heavyHit:'assets/audio/sfx_heavy.mp3',chestHit:'assets/audio/sfx_chest_hit.mp3',
    chestBreak:'assets/audio/sfx_chest_break.mp3',pickup:'assets/audio/sfx_item_pickup.mp3',rare:'assets/audio/sfx_rare_drop.mp3',
    boss:'assets/audio/sfx_boss.mp3',heal:'assets/audio/sfx_heal.mp3',success:'assets/audio/sfx_success.mp3',
    fail:'assets/audio/sfx_fail.mp3'
  };
  const SK=['flame','lightning','frost','meteor','blades','ward','poison','orbit','laser','shadow','wind','quake','dragonHeart','stormCore','starSigil','worldSeed','moonSeal','primalCore','infernoCyclone','stormNova','astralAegis','verdantPlague','eclipseRay','tempestRift'];
  const SKILL={};for(const k of SK)SKILL[k]=`assets/audio/sfx_skill_${k}.mp3`;

  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  let ctx=null,masterGain=null,sfxGain=null,bgm=null,currentMode='none',unlocked=false,activeSfx=0,primeStarted=false;
  const buffers=new Map(),loading=new Map(),last=new Map();
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
  const mv=()=>Math.max(0,Math.min(1,settings.master*settings.music));
  const sv=()=>Math.max(0,Math.min(1,settings.master*settings.sfx));

  function ensureCtx(){
    if(!AudioCtx)return null;
    if(!ctx){
      try{
        ctx=new AudioCtx({latencyHint:'interactive'});
        masterGain=ctx.createGain();sfxGain=ctx.createGain();
        sfxGain.gain.value=sv();masterGain.gain.value=1;
        sfxGain.connect(masterGain);masterGain.connect(ctx.destination);
      }catch(e){console.warn('WebAudio init failed',e);ctx=null}
    }
    return ctx;
  }
  function makeMusic(src,loop=false){
    const a=new Audio();a.preload='auto';a.loop=loop;a.playsInline=true;a.setAttribute('playsinline','');a.src=src;return a
  }
  async function loadBuffer(src){
    if(buffers.has(src))return buffers.get(src);
    if(loading.has(src))return loading.get(src);
    const c=ensureCtx();if(!c)return null;
    const p=(async()=>{
      try{
        const res=await fetch(src,{cache:'force-cache'});if(!res.ok)throw new Error('audio '+res.status);
        const ab=await res.arrayBuffer();
        const buf=await c.decodeAudioData(ab.slice(0));
        buffers.set(src,buf);return buf;
      }catch(e){console.warn('SFX decode failed',src,e);return null}
      finally{loading.delete(src)}
    })();
    loading.set(src,p);return p;
  }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function prime(){
    if(primeStarted)return;primeStarted=true;ensureCtx();
    const essential=[SFX.sword,SFX.dagger,SFX.bow,SFX.fan,SFX.hammer,SFX.spear,SFX.ring,SFX.talisman,SFX.ui,SFX.chestHit,SFX.chestBreak,SFX.pickup,SFX.rare,SFX.heavyHit];
    for(const src of essential){await loadBuffer(src);await sleep(4)}
    const rest=[...Object.values(SKILL),SFX.boss,SFX.heal,SFX.success,SFX.fail,SFX.hit].filter(src=>!buffers.has(src));
    let i=0;
    const step=async()=>{
      if(i>=rest.length)return;
      await loadBuffer(rest[i++]);
      if('requestIdleCallback'in window)requestIdleCallback(()=>step(),{timeout:350});else setTimeout(step,35);
    };
    step();
  }
  async function unlock(){
    const c=ensureCtx();if(!c)return false;
    try{if(c.state!=='running')await c.resume();unlocked=c.state==='running'}catch(e){unlocked=false}
    prime();return unlocked;
  }

  async function playMusic(mode='home',force=false){
    currentMode=mode;if(!settings.musicOn)return false;
    const src=BGM[mode]||BGM.home;
    if(bgm&&!force&&bgm.dataset.mode===mode&&!bgm.paused)return true;
    if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}
    bgm=makeMusic(src,true);bgm.dataset.mode=mode;bgm.volume=mv();
    try{await bgm.play();return true}catch(e){console.warn('BGM blocked',e);return false}
  }
  function stopMusic(){if(bgm){try{bgm.pause();bgm.currentTime=0}catch{}}}

  function playBuffer(src,key,gap=90,priority=1){
    if(!settings.sfxOn||!src)return false;
    const n=performance.now(),prev=last.get(key)||0;if(n-prev<gap)return false;
    const c=ensureCtx();if(!c)return false;
    if(c.state!=='running'){unlock();return false}
    const buf=buffers.get(src);if(!buf){loadBuffer(src);return false}
    if(activeSfx>=6&&priority<2)return false;
    last.set(key,n);
    try{
      const source=c.createBufferSource(),gain=c.createGain();
      source.buffer=buf;gain.gain.value=sv();
      source.connect(gain);gain.connect(sfxGain);
      activeSfx++;source.onended=()=>{activeSfx=Math.max(0,activeSfx-1);try{source.disconnect();gain.disconnect()}catch{}};
      source.start(0);return true;
    }catch(e){return false}
  }

  const sfx={
    ui:()=>playBuffer(SFX.ui,'ui',100,0),
    sword:()=>playBuffer(SFX.sword,'sword',125,2),dagger:()=>playBuffer(SFX.dagger,'dagger',95,2),
    bow:()=>playBuffer(SFX.bow,'bow',120,2),fan:()=>playBuffer(SFX.fan,'fan',140,2),
    hammer:()=>playBuffer(SFX.hammer,'hammer',180,2),spear:()=>playBuffer(SFX.spear,'spear',130,2),
    ring:()=>playBuffer(SFX.ring,'ring',130,2),talisman:()=>playBuffer(SFX.talisman,'talisman',140,2),
    hit:()=>false,heavyHit:()=>playBuffer(SFX.heavyHit,'heavyHit',190,1),
    chestHit:()=>playBuffer(SFX.chestHit,'chestHit',150,1),chestBreak:()=>playBuffer(SFX.chestBreak,'chestBreak',250,2),
    pickup:()=>playBuffer(SFX.pickup,'pickup',140,1),rare:()=>playBuffer(SFX.rare,'rare',280,2),
    boss:()=>playBuffer(SFX.boss,'boss',550,2),heal:()=>playBuffer(SFX.heal,'heal',260,1),
    success:()=>playBuffer(SFX.success,'success',550,2),fail:()=>playBuffer(SFX.fail,'fail',550,2)
  };
  function skill(id){return playBuffer(SKILL[id]||SFX.talisman,'skill_'+id,300,2)}

  function set(part,val){
    if(part==='musicOn'||part==='sfxOn')settings[part]=!!val;else settings[part]=Math.max(0,Math.min(1,Number(val)||0));
    persist();if(bgm)bgm.volume=mv();
    if(sfxGain&&ctx){sfxGain.gain.setTargetAtTime(sv(),ctx.currentTime,.02)}
    if(part==='musicOn'){if(settings.musicOn)playMusic(currentMode==='none'?'home':currentMode,true);else stopMusic()}
  }
  function mapMode(id){return ({forest:'forest',frost:'frost',ember:'ember',crypt:'crypt'})[id]||'forest'}
  function state(){return {supported:!!AudioCtx,state:ctx?.state||'not-created',musicMode:currentMode,playingMode:bgm&&!bgm.paused?currentMode:'none',activeSfx,decoded:buffers.size,settings:{...settings}}}
  function resetSettings(){settings={...defaults};persist();if(bgm)bgm.volume=mv();if(sfxGain&&ctx)sfxGain.gain.value=sv();playMusic(currentMode==='none'?'home':currentMode,true)}
  async function test(){
    await unlock();settings.musicOn=settings.sfxOn=true;persist();
    await Promise.all([loadBuffer(SFX.sword),loadBuffer(SKILL.flame)]);
    const ok=await playMusic('home',true);sfx.sword();setTimeout(()=>skill('flame'),260);return ok
  }

  setTimeout(prime,180);
  document.addEventListener('pointerdown',()=>{unlock()},{passive:true});
  document.addEventListener('touchstart',()=>{unlock()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(bgm)bgm.pause()}else{unlock();if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)}});
  window.addEventListener('pageshow',()=>{unlock();if(settings.musicOn&&currentMode!=='none')playMusic(currentMode,true)});
  window.MurimAudio={settings,set,unlock,playMusic,stopMusic,mapMode,sfx,skill,state,resetSettings,defaults,test,prime};
})();