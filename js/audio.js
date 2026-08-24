(() => {
  const KEY='murimAudioSettingsV1';
  const Ctx=window.AudioContext||window.webkitAudioContext;
  const defaults={master:.78,music:.36,sfx:.62,musicOn:true,sfxOn:true};
  let settings={...defaults};
  try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  let ctx=null,master=null,musicGain=null,sfxGain=null,musicTimer=null,musicMode='none',musicVoices=[];
  let lastSfx={};

  function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}}
  function ensure(){
    if(!Ctx)return false;
    if(!ctx){
      ctx=new Ctx();
      master=ctx.createGain(); musicGain=ctx.createGain(); sfxGain=ctx.createGain();
      musicGain.connect(master);sfxGain.connect(master);master.connect(ctx.destination);
      apply();
    }
    return true;
  }
  function unlock(){
    if(!ensure())return;
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
  function apply(){
    if(!ctx)return;
    master.gain.setTargetAtTime(Math.max(0,settings.master),ctx.currentTime,.03);
    musicGain.gain.setTargetAtTime(settings.musicOn?settings.music:0,ctx.currentTime,.06);
    sfxGain.gain.setTargetAtTime(settings.sfxOn?settings.sfx:0,ctx.currentTime,.03);
  }
  function set(part,val){
    if(part==='musicOn'||part==='sfxOn')settings[part]=!!val;
    else settings[part]=Math.max(0,Math.min(1,Number(val)||0));
    persist();apply();
    if(part==='musicOn'&&settings.musicOn&&musicMode!=='none')playMusic(musicMode,true);
  }
  function tone(freq,dur=.12,type='sine',gain=.08,when=0,detune=0,out=sfxGain){
    if(!ensure()||!out)return;
    const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);o.detune.setValueAtTime(detune,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.03);
  }
  function noise(dur=.08,gain=.06,when=0,lowpass=1800,out=sfxGain){
    if(!ensure()||!out)return;
    const sr=ctx.sampleRate,len=Math.max(1,Math.floor(sr*dur)),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    src.buffer=buf;f.type='lowpass';f.frequency.value=lowpass;g.gain.value=gain;
    src.connect(f);f.connect(g);g.connect(out);src.start(ctx.currentTime+when);
  }
  function can(name,ms=45){const n=performance.now();if(n-(lastSfx[name]||0)<ms)return false;lastSfx[name]=n;return true}
  const sfx={
    ui(){if(!can('ui',70))return;tone(640,.045,'sine',.025);tone(880,.035,'sine',.018,.025)},
    sword(){if(!can('sword',75))return;noise(.075,.045,0,2600);tone(190,.06,'triangle',.025)},
    dagger(){if(!can('dagger',55))return;noise(.045,.026,0,4300);tone(760,.035,'triangle',.018)},
    bow(){if(!can('bow',80))return;tone(180,.07,'triangle',.02);noise(.055,.024,.012,3500)},
    fan(){if(!can('fan',90))return;noise(.13,.034,0,1500);tone(420,.13,'sine',.018)},
    hammer(){if(!can('hammer',120))return;tone(72,.14,'sine',.07);noise(.12,.06,0,700)},
    spear(){if(!can('spear',85))return;noise(.065,.034,0,3000);tone(320,.055,'triangle',.022)},
    ring(){if(!can('ring',75))return;tone(520,.07,'triangle',.026);tone(390,.08,'triangle',.018,.025)},
    talisman(){if(!can('talisman',95))return;tone(330,.14,'sine',.025);tone(660,.11,'sine',.018,.05)},
    hit(){if(!can('hit',42))return;noise(.05,.024,0,1100)},
    heavyHit(){if(!can('heavyHit',100))return;tone(90,.09,'sine',.045);noise(.08,.035,0,650)},
    chestHit(){if(!can('chestHit',85))return;noise(.055,.033,0,900);tone(130,.055,'triangle',.024)},
    chestBreak(){tone(96,.18,'sine',.05);noise(.15,.065,0,1000);tone(410,.12,'triangle',.022,.09)},
    pickup(){if(!can('pickup',90))return;tone(590,.07,'sine',.024);tone(790,.09,'sine',.025,.055)},
    rare(){tone(440,.11,'triangle',.03);tone(660,.12,'triangle',.028,.08);tone(880,.17,'sine',.025,.16)},
    boss(){tone(92,.45,'sine',.055);tone(138,.42,'triangle',.035,.15);noise(.35,.025,.03,500)},
    heal(){tone(520,.15,'sine',.022);tone(780,.18,'sine',.02,.08)},
    success(){tone(392,.12,'triangle',.028);tone(523,.14,'triangle',.028,.1);tone(659,.24,'triangle',.03,.21)},
    fail(){tone(196,.16,'triangle',.025);tone(147,.28,'sine',.03,.12)}
  };
  function stopMusic(){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null}
    for(const v of musicVoices){try{v.stop()}catch{}}
    musicVoices=[];
  }
  const modes={
    home:{root:196,steps:[0,7,12,7,3,7,10,7],pace:1400,pad:[98,147],type:'triangle'},
    forest:{root:220,steps:[0,3,7,10,7,3,5,7],pace:1050,pad:[110,165],type:'sine'},
    frost:{root:174.6,steps:[0,7,10,12,7,3,10,7],pace:1320,pad:[87.3,130.8],type:'sine'},
    ember:{root:164.8,steps:[0,3,7,3,10,7,12,10],pace:760,pad:[82.4,123.5],type:'triangle'},
    crypt:{root:146.8,steps:[0,1,7,10,6,1,10,7],pace:1180,pad:[73.4,110],type:'sine'},
    boss:{root:130.8,steps:[0,3,6,10,3,12,10,6],pace:520,pad:[65.4,98],type:'sawtooth'}
  };
  function playMusic(mode='home',force=false){
    musicMode=mode;
    if(!ensure()||!settings.musicOn)return;
    if(!force&&musicTimer&&musicMode===mode)return;
    stopMusic();
    const m=modes[mode]||modes.home;
    // Low, soft sustained drone.
    for(const [idx,f] of m.pad.entries()){
      const o=ctx.createOscillator(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
      o.type=idx?'sine':'triangle';o.frequency.value=f;
      g.gain.value=.014/(idx+1);lfo.frequency.value=.06+.025*idx;lg.gain.value=f*.008;
      lfo.connect(lg);lg.connect(o.frequency);o.connect(g);g.connect(musicGain);o.start();lfo.start();
      musicVoices.push(o,lfo);
    }
    let step=0;
    const tick=()=>{
      if(!settings.musicOn||!ctx)return;
      const semi=m.steps[step++%m.steps.length],f=m.root*Math.pow(2,semi/12);
      tone(f,.42,m.type,.014,0,0,musicGain);
      if(step%4===1)tone(f/2,.65,'sine',.009,.03,0,musicGain);
      if(mode==='ember'||mode==='boss'){
        noise(.035,mode==='boss'?.014:.009,.02,380,musicGain);
      }
    };
    tick();musicTimer=setInterval(tick,m.pace);
  }
  function mapMode(mapId){return ({forest:'forest',frost:'frost',ember:'ember',crypt:'crypt'})[mapId]||'forest'}
  document.addEventListener('pointerdown',unlock,{once:true,capture:true});
  window.MurimAudio={settings,set,unlock,playMusic,stopMusic,mapMode,sfx};
})();
