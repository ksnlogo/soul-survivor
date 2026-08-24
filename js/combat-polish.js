(() => {
  // v4.5.4: performance governor + lightweight combat feedback.
  const P={shake:0,shakePower:0,flash:0,lastShake:0,hudAt:0,waveAt:0,mapAt:0};
  const now=()=>performance.now();
  function addShake(power=1,dur=.075){const n=now();if(n-P.lastShake<45&&power<2)return;P.lastShake=n;P.shake=Math.max(P.shake,dur);P.shakePower=Math.max(P.shakePower,power)}
  function addFlash(v=.055){P.flash=Math.max(P.flash,v)}

  // DOM/UI work was previously executed every animation frame.
  const baseHUD=updateHUD;updateHUD=function(force=false){const n=now();if(!force&&running&&n<P.hudAt)return;P.hudAt=n+85;return baseHUD()};
  const baseWave=updateWaveState;updateWaveState=function(){const n=now();if(n<P.waveAt)return;P.waveAt=n+120;return baseWave()};
  const baseMini=drawMinimap;drawMinimap=function(){const n=now();if(n<P.mapAt)return;P.mapAt=n+180;return baseMini()};

  // Cap cosmetics so a large mob/skill combo cannot trigger a GC spike.
  const baseBurst=burst;burst=function(x,y,n,col){const budget=Math.max(0,210-particles.length);if(budget<=0)return;return baseBurst(x,y,Math.min(n,budget,n>18?16:n),col)};
  const baseFloat=floatText;floatText=function(x,y,text,col){if(texts.length>34)texts.shift();return baseFloat(x,y,text,col)};

  // Animation timers remain visual only; no artificial full-frame hit-stop is used.
  const baseUpdate=update;update=function(dt){
    if(player&&player._attackAnim>0)player._attackAnim=Math.max(0,player._attackAnim-dt);
    if(P.shake>0){P.shake=Math.max(0,P.shake-dt);if(P.shake===0)P.shakePower=0}
    if(P.flash>0)P.flash=Math.max(0,P.flash-dt*2.8);
    for(const e of enemies)if(e._impactFlash>0)e._impactFlash=Math.max(0,e._impactFlash-dt);
    const r=baseUpdate(dt);
    if(particles.length>230)particles.splice(0,particles.length-230);
    if(attackEffects.length>70)attackEffects.splice(0,attackEffects.length-70);
    return r;
  };

  // Weapon motion: swing/lunge/recoil without changing collision coordinates.
  const baseDrawPlayer=drawPlayer;drawPlayer=function(){
    if(!player||!player._attackAnim)return baseDrawPlayer();
    const ox=player.x,oy=player.y,oa=player.facing||0,d=player._attackDur||.13,p=1-player._attackAnim/d,s=Math.sin(Math.PI*Math.max(0,Math.min(1,p))),wt=player._attackKind||player.weaponType;
    if(wt==='sword'||wt==='hammer'){player.facing=oa+(-.30+p*.60)*s;player.x=ox+Math.cos(oa)*2.4*s;player.y=oy+Math.sin(oa)*2.4*s}
    else if(wt==='spear'){player.x=ox+Math.cos(oa)*5.2*s;player.y=oy+Math.sin(oa)*5.2*s}
    else {player.x=ox-Math.cos(oa)*1.8*s;player.y=oy-Math.sin(oa)*1.8*s}
    baseDrawPlayer();player.x=ox;player.y=oy;player.facing=oa;
  };

  // Impact spark rendering and enemy hit flash.
  const baseDrawEnemy=drawEnemy;drawEnemy=function(e){baseDrawEnemy(e);if(!e._impactFlash)return;ctx.save();ctx.globalAlpha=Math.min(.7,e._impactFlash*9);ctx.strokeStyle='#fff1c9';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(5,e.r*.72),0,Math.PI*2);ctx.stroke();ctx.restore()};
  const baseDrawEffect=drawAttackEffect;drawAttackEffect=function(a){
    if(a.type!=='impact')return baseDrawEffect(a);
    const t=Math.max(0,a.life/a.max),r=(a.r||10)*(1+(1-t)*.55);ctx.save();ctx.translate(a.x,a.y);ctx.globalAlpha=Math.min(1,t*1.8);ctx.strokeStyle=a.color||'#fff0b0';ctx.lineCap='round';ctx.lineWidth=a.crit?2.4:1.5;
    for(let k=0;k<4;k++){const q=k*Math.PI/2+(a.angle||0),r1=r*.25,r2=r;ctx.beginPath();ctx.moveTo(Math.cos(q)*r1,Math.sin(q)*r1);ctx.lineTo(Math.cos(q)*r2,Math.sin(q)*r2);ctx.stroke()}
    ctx.globalAlpha*=.55;ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.restore();
  };

  let meleeKind=null;
  function armAttack(kind,dur){if(!player)return;player._attackKind=kind;player._attackDur=dur;player._attackAnim=dur}
  const hs=hitSword;hitSword=function(a,w,c){armAttack('sword',.14);meleeKind='sword';const r=hs(a,w,c);meleeKind=null;addShake(c?1.8:.8,c?.095:.065);return r};
  const hh=hitHammer;hitHammer=function(a,w,c){armAttack('hammer',.20);meleeKind='hammer';const r=hh(a,w,c);meleeKind=null;addShake(c?3.3:2.4,.11);addFlash(c?.07:.04);return r};
  const hp=hitSpear;hitSpear=function(a,w,c){armAttack('spear',.13);meleeKind='spear';const r=hp(a,w,c);meleeKind=null;addShake(c?1.7:.7,.06);return r};
  const bs=shoot;shoot=function(){const wt=player?.weaponType||'sword',r=bs();if(player&&['dagger','bow','staff','axe','grimoire'].includes(wt))armAttack(wt,.10);return r};

  const bd=dealDirectDamage;dealDirectDamage=function(e,damage,crit=false,color='#72efc1'){
    const before=e?.hp??0,r=bd(e,damage,crit,color);if(e&&e.hp<before){e._impactFlash=crit?.10:.065;const ang=player?Math.atan2(e.y-player.y,e.x-player.x):0;attackEffects.push({type:'impact',x:e.x,y:e.y,r:crit?14:9,angle:ang,crit,life:crit?.15:.11,max:crit?.15:.11,color:crit?'#ffd164':'#fff0ba'});if(meleeKind){const kb=meleeKind==='hammer'?8:meleeKind==='spear'?4.5:3.5;e.x+=Math.cos(ang)*kb;e.y+=Math.sin(ang)*kb}if(crit){addShake(2.0,.085);addFlash(.055)}}return r
  };
  const bde=damageEnemy;damageEnemy=function(e,b){const before=e?.hp??0,r=bde(e,b);if(e&&e.hp<before){e._impactFlash=b?.crit?.09:.055;attackEffects.push({type:'impact',x:e.x,y:e.y,r:b?.crit?13:8,angle:Math.atan2(b?.vy||0,b?.vx||1),crit:!!b?.crit,life:.10,max:.10,color:b?.crit?'#ffd164':(b?.color||'#e9f3e2')});if(b?.crit){addShake(1.5,.065);addFlash(.035)}}return r};

  // Skill impact: restrained camera feedback on large skills only.
  const bc=castSkill;castSkill=function(id){const a0=attackEffects.length,b0=bullets.length,r=bc(id);if(attackEffects.length>a0||bullets.length>b0){if(['meteor','quake','tempestRift'].includes(id)){addShake(3.0,.13);addFlash(.07)}else if(['flame','lightning','stormNova','infernoCyclone','eclipseRay'].includes(id)){addShake(1.3,.07)}}return r};

  // Camera shake is applied only to the world render; UI remains stable.
  const baseDraw=draw;draw=function(){
    let ox,oy;if(camera&&P.shake>0){ox=camera.x;oy=camera.y;const t=now()*.055,amp=P.shakePower*Math.min(1,P.shake/.055);camera.x=ox+Math.sin(t*1.7)*amp;camera.y=oy+Math.cos(t*2.3)*amp}
    baseDraw();if(ox!==undefined){camera.x=ox;camera.y=oy}
    if(P.flash>0){ctx.save();ctx.globalAlpha=Math.min(.11,P.flash);ctx.fillStyle='#fff3cf';ctx.fillRect(0,0,W,H);ctx.restore()}
  };
})();
