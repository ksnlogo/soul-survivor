(() => {
  const KEY='murimAudioSettingsV2';
  const Ctx=window.AudioContext||window.webkitAudioContext;
  const defaults={master:.86,music:.56,sfx:.58,musicOn:true,sfxOn:true};
  let settings={...defaults};
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
    settings={...defaults,...saved};
    for(const k of ['master','music','sfx'])if(!Number.isFinite(settings[k]))settings[k]=defaults[k];
    for(const k of ['musicOn','sfxOn'])if(typeof settings[k]!=='boolean')settings[k]=defaults[k];
  }catch{}
  let ctx=null,master=null,musicGain=null,sfxGain=null,compressor=null;
  let musicTimer=null,musicMode='none',playingMode='none',musicVoices=[],resumePromise=null,lastSfx={};

  function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}}
  function ensure(){
    if(!Ctx)return false;
    if(!ctx){
      ctx=new Ctx();
      master=ctx.createGain();musicGain=ctx.createGain();sfxGain=ctx.createGain();compressor=ctx.createDynamicsCompressor();
      compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.006;compressor.release.value=.18;
      musicGain.connect(master);sfxGain.connect(master);master.connect(compressor);compressor.connect(ctx.destination);
      apply();
    }
    return true;
  }
  function warmup(){
    if(!ctx||ctx.state!=='running')return;
    const o=ctx.createOscillator(),g=ctx.createGain();g.gain.value=.00001;o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+.015);
  }
  function unlock(){
    if(!ensure())return Promise.resolve(false);
    if(ctx.state==='running'){warmup();return Promise.resolve(true)}
    if(resumePromise)return resumePromise;
    resumePromise=ctx.resume().then(()=>{resumePromise=null;warmup();return ctx.state==='running'}).catch(()=>{resumePromise=null;return false});
    return resumePromise;
  }
  function apply(){
    if(!ctx)return;
    const t=ctx.currentTime;
    master.gain.setTargetAtTime(Math.max(0,settings.master),t,.025);
    musicGain.gain.setTargetAtTime(settings.musicOn?settings.music:0,t,.05);
    sfxGain.gain.setTargetAtTime(settings.sfxOn?settings.sfx:0,t,.025);
  }
  function set(part,val){
    if(part==='musicOn'||part==='sfxOn')settings[part]=!!val;
    else settings[part]=Math.max(0,Math.min(1,Number(val)||0));
    persist();apply();
    if(part==='musicOn'){
      if(settings.musicOn&&musicMode!=='none')playMusic(musicMode,true);
      else if(!settings.musicOn)stopMusic();
    }
  }
  function tone(freq,dur=.12,type='sine',gain=.08,when=0,detune=0,out=null){
    if(!ensure())return;
    out=out||sfxGain;if(!out)return;
    const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);o.detune.setValueAtTime(detune,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.035);
  }
  function noise(dur=.08,gain=.06,when=0,lowpass=1800,out=null){
    if(!ensure())return;out=out||sfxGain;if(!out)return;
    const sr=ctx.sampleRate,len=Math.max(1,Math.floor(sr*dur)),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    src.buffer=buf;f.type='lowpass';f.frequency.value=lowpass;g.gain.value=gain;src.connect(f);f.connect(g);g.connect(out);src.start(ctx.currentTime+when);
  }
  function can(name,ms=45){const n=performance.now();if(n-(lastSfx[name]||0)<ms)return false;lastSfx[name]=n;return true}
  const sfx={
    ui(){if(!settings.sfxOn||!can('ui',70))return;tone(640,.045,'sine',.035);tone(880,.035,'sine',.025,.025)},
    sword(){if(!settings.sfxOn||!can('sword',75))return;noise(.075,.055,0,2600);tone(190,.06,'triangle',.035)},
    dagger(){if(!settings.sfxOn||!can('dagger',55))return;noise(.045,.038,0,4300);tone(760,.035,'triangle',.025)},
    bow(){if(!settings.sfxOn||!can('bow',80))return;tone(180,.07,'triangle',.03);noise(.055,.033,.012,3500)},
    fan(){if(!settings.sfxOn||!can('fan',90))return;noise(.13,.045,0,1500);tone(420,.13,'sine',.026)},
    hammer(){if(!settings.sfxOn||!can('hammer',120))return;tone(72,.14,'sine',.085);noise(.12,.07,0,700)},
    spear(){if(!settings.sfxOn||!can('spear',85))return;noise(.065,.044,0,3000);tone(320,.055,'triangle',.03)},
    ring(){if(!settings.sfxOn||!can('ring',75))return;tone(520,.07,'triangle',.035);tone(390,.08,'triangle',.026,.025)},
    talisman(){if(!settings.sfxOn||!can('talisman',95))return;tone(330,.14,'sine',.035);tone(660,.11,'sine',.027,.05)},
    hit(){if(!settings.sfxOn||!can('hit',42))return;noise(.05,.032,0,1100)},
    heavyHit(){if(!settings.sfxOn||!can('heavyHit',100))return;tone(90,.09,'sine',.058);noise(.08,.045,0,650)},
    chestHit(){if(!settings.sfxOn||!can('chestHit',85))return;noise(.055,.045,0,900);tone(130,.055,'triangle',.032)},
    chestBreak(){if(!settings.sfxOn)return;tone(96,.18,'sine',.065);noise(.15,.08,0,1000);tone(410,.12,'triangle',.03,.09)},
    pickup(){if(!settings.sfxOn||!can('pickup',90))return;tone(590,.07,'sine',.034);tone(790,.09,'sine',.034,.055)},
    rare(){if(!settings.sfxOn)return;tone(440,.11,'triangle',.04);tone(660,.12,'triangle',.04,.08);tone(880,.17,'sine',.035,.16)},
    boss(){if(!settings.sfxOn)return;tone(92,.45,'sine',.07);tone(138,.42,'triangle',.045,.15);noise(.35,.034,.03,500)},
    heal(){if(!settings.sfxOn)return;tone(520,.15,'sine',.032);tone(780,.18,'sine',.03,.08)},
    success(){if(!settings.sfxOn)return;tone(392,.12,'triangle',.04);tone(523,.14,'triangle',.04,.1);tone(659,.24,'triangle',.045,.21)},
    fail(){if(!settings.sfxOn)return;tone(196,.16,'triangle',.035);tone(147,.28,'sine',.04,.12)}
  };
  function stopMusic(){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null}
    for(const v of musicVoices){try{v.stop()}catch{}}
    musicVoices=[];playingMode='none';
  }
  const modes={
    home:{root:196,steps:[0,7,12,7,3,7,10,7],pace:1280,pad:[98,147],type:'triangle'},
    forest:{root:220,steps:[0,3,7,10,7,3,5,7],pace:940,pad:[110,165],type:'sine'},
    frost:{root:174.6,steps:[0,7,10,12,7,3,10,7],pace:1190,pad:[87.3,130.8],type:'sine'},
    ember:{root:164.8,steps:[0,3,7,3,10,7,12,10],pace:720,pad:[82.4,123.5],type:'triangle'},
    crypt:{root:146.8,steps:[0,1,7,10,6,1,10,7],pace:1080,pad:[73.4,110],type:'sine'},
    boss:{root:130.8,steps:[0,3,6,10,3,12,10,6],pace:500,pad:[65.4,98],type:'sawtooth'}
  };
  function beginMusic(mode){
    if(!ctx||ctx.state!=='running'||!settings.musicOn)return;
    if(playingMode===mode&&musicTimer)return;
    stopMusic();playingMode=mode;
    const m=modes[mode]||modes.home;
    for(const [idx,f] of m.pad.entries()){
      const o=ctx.createOscillator(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
      o.type=idx?'sine':'triangle';o.frequency.value=f;g.gain.value=.035/(idx+1);lfo.frequency.value=.06+.025*idx;lg.gain.value=f*.008;
      lfo.connect(lg);lg.connect(o.frequency);o.connect(g);g.connect(musicGain);o.start();lfo.start();musicVoices.push(o,lfo);
    }
    let step=0;
    const tick=()=>{
      if(!settings.musicOn||!ctx||ctx.state!=='running')return;
      const semi=m.steps[step++%m.steps.length],f=m.root*Math.pow(2,semi/12);
      tone(f,.46,m.type,.042,0,0,musicGain);
      if(step%4===1)tone(f/2,.72,'sine',.025,.03,0,musicGain);
      if(mode==='ember'||mode==='boss')noise(.04,mode==='boss'?.022:.014,.02,380,musicGain);
    };
    tick();musicTimer=setInterval(tick,m.pace);
  }
  function playMusic(mode='home',force=false){
    musicMode=mode;
    if(!settings.musicOn){stopMusic();return}
    if(!ensure())return;
    if(!force&&playingMode===mode&&musicTimer)return;
    if(ctx.state==='running')beginMusic(mode);
    else unlock().then(ok=>{if(ok&&settings.musicOn&&musicMode===mode)beginMusic(mode)});
  }
  function mapMode(mapId){return ({forest:'forest',frost:'frost',ember:'ember',crypt:'crypt'})[mapId]||'forest'}
  function state(){return {supported:!!Ctx,state:ctx?ctx.state:'not-created',musicMode,playingMode,settings:{...settings}}}
  function resetSettings(){settings={...defaults};persist();apply();playMusic(musicMode==='none'?'home':musicMode,true)}
  ['pointerdown','touchstart','click'].forEach(ev=>document.addEventListener(ev,()=>{unlock().then(ok=>{if(ok&&settings.musicOn&&playingMode==='none')playMusic('home',true)})},{once:true,capture:true}));
  window.MurimAudio={settings,set,unlock,playMusic,stopMusic,mapMode,sfx,state,resetSettings,defaults};
})();
