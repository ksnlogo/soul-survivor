(() => {
  const P={shake:0,shakePower:0,flash:0,lastShake:0,hudAt:0,waveAt:0,mapAt:0};
  const now=()=>performance.now();
  function addShake(power=1,dur=.06){const n=now();if(n-P.lastShake<65)return;P.lastShake=n;P.shake=Math.max(P.shake,dur);P.shakePower=Math.max(P.shakePower,power)}
  function addFlash(v=.035){P.flash=Math.max(P.flash,v)}

  const baseHUD=updateHUD;updateHUD=function(force=false){const n=now();if(!force&&running&&n<P.hudAt)return;P.hudAt=n+90;return baseHUD()};
  const baseWave=updateWaveState;updateWaveState=function(){const n=now();if(n<P.waveAt)return;P.waveAt=n+130;return baseWave()};
  const baseMini=drawMinimap;drawMinimap=function(){const n=now();if(n<P.mapAt)return;P.mapAt=n+190;return baseMini()};

  const baseBurst=burst;burst=function(x,y,n,col){const budget=Math.max(0,140-particles.length);if(budget<=0)return;return baseBurst(x,y,Math.min(n,budget,n>14?10:n),col)};
  const baseFloat=floatText;floatText=function(x,y,text,col){if(texts.length>26)texts.shift();return baseFloat(x,y,text,col)};

  const baseUpdate=update;update=function(dt){
    if(player&&player._attackAnim>0)player._attackAnim=Math.max(0,player._attackAnim-dt);
    if(P.shake>0){P.shake=Math.max(0,P.shake-dt);if(P.shake===0)P.shakePower=0}
    if(P.flash>0)P.flash=Math.max(0,P.flash-dt*3.4);
    for(const e of enemies)if(e._impactFlash>0)e._impactFlash=Math.max(0,e._impactFlash-dt);
    const r=baseUpdate(dt);
    if(particles.length>160)particles.splice(0,particles.length-160);
    if(attackEffects.length>52)attackEffects.splice(0,attackEffects.length-52);
    return r;
  };

  const baseDrawPlayer=drawPlayer;drawPlayer=function(){
    if(!player||!player._attackAnim)return baseDrawPlayer();
    const ox=player.x,oy=player.y,oa=player.facing||0,d=player._attackDur||.13,p=1-player._attackAnim/d,s=Math.sin(Math.PI*Math.max(0,Math.min(1,p))),wt=player._attackKind||player.weaponType;
    if(wt==='sword'||wt==='hammer'){player.facing=oa+(-.24+p*.48)*s;player.x=ox+Math.cos(oa)*1.7*s;player.y=oy+Math.sin(oa)*1.7*s}
    else if(wt==='spear'){player.x=ox+Math.cos(oa)*4*s;player.y=oy+Math.sin(oa)*4*s}
    else {player.x=ox-Math.cos(oa)*1.2*s;player.y=oy-Math.sin(oa)*1.2*s}
    baseDrawPlayer();player.x=ox;player.y=oy;player.facing=oa;
  };

  const baseDrawEnemy=drawEnemy;drawEnemy=function(e){baseDrawEnemy(e);if(!e._impactFlash)return;ctx.save();ctx.globalAlpha=Math.min(.55,e._impactFlash*8);ctx.strokeStyle='#fff1c9';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(5,e.r*.65),0,Math.PI*2);ctx.stroke();ctx.restore()};
  const baseDrawEffect=drawAttackEffect;drawAttackEffect=function(a){
    if(a.type!=='impact')return baseDrawEffect(a);
    const t=Math.max(0,a.life/a.max),r=(a.r||9)*(1+(1-t)*.42);ctx.save();ctx.translate(a.x,a.y);ctx.globalAlpha=Math.min(.85,t*1.6);ctx.strokeStyle=a.color||'#fff0b0';ctx.lineCap='round';ctx.lineWidth=a.crit?2:1.25;
    for(let k=0;k<4;k++){const q=k*Math.PI/2+(a.angle||0),r1=r*.28,r2=r;ctx.beginPath();ctx.moveTo(Math.cos(q)*r1,Math.sin(q)*r1);ctx.lineTo(Math.cos(q)*r2,Math.sin(q)*r2);ctx.stroke()}
    ctx.restore();
  };

  let meleeKind=null,impactWindow=0,impactCount=0;
  function armAttack(kind,dur){if(!player)return;player._attackKind=kind;player._attackDur=dur;player._attackAnim=dur}
  function allowImpact(crit=false){const n=now();if(n-impactWindow>30){impactWindow=n;impactCount=0}if(crit)return true;if(impactCount>=3)return false;impactCount++;return true}

  const hs=hitSword;hitSword=function(a,w,c){armAttack('sword',.13);meleeKind='sword';const r=hs(a,w,c);meleeKind=null;return r};
  const hh=hitHammer;hitHammer=function(a,w,c){armAttack('hammer',.18);meleeKind='hammer';const r=hh(a,w,c);meleeKind=null;return r};
  const hp=hitSpear;hitSpear=function(a,w,c){armAttack('spear',.12);meleeKind='spear';const r=hp(a,w,c);meleeKind=null;return r};
  const bs=shoot;shoot=function(){const wt=player?.weaponType||'sword',r=bs();if(player&&['dagger','bow','staff','axe','grimoire'].includes(wt))armAttack(wt,.09);return r};

  const bd=dealDirectDamage;dealDirectDamage=function(e,damage,crit=false,color='#72efc1'){
    const before=e?.hp??0,r=bd(e,damage,crit,color);
    if(e&&e.hp<before){
      e._impactFlash=crit?.09:.05;
      const ang=player?Math.atan2(e.y-player.y,e.x-player.x):0;
      if(allowImpact(crit))attackEffects.push({type:'impact',x:e.x,y:e.y,r:crit?12:7.5,angle:ang,crit,life:crit?.13:.085,max:crit?.13:.085,color:crit?'#ffd164':'#fff0ba'});
      if(meleeKind){const kb=meleeKind==='hammer'?7:meleeKind==='spear'?4:3;e.x+=Math.cos(ang)*kb;e.y+=Math.sin(ang)*kb}
      if(meleeKind==='hammer')addShake(crit?1.25:.65,crit?.07:.045);else if(crit){addShake(.9,.05);addFlash(.025)}
    }
    return r
  };
  const bde=damageEnemy;damageEnemy=function(e,b){
    const before=e?.hp??0,r=bde(e,b);
    if(e&&e.hp<before){
      const crit=!!b?.crit;e._impactFlash=crit?.08:.045;
      if(allowImpact(crit))attackEffects.push({type:'impact',x:e.x,y:e.y,r:crit?11:7,angle:Math.atan2(b?.vy||0,b?.vx||1),crit,life:.08,max:.08,color:crit?'#ffd164':(b?.color||'#e9f3e2')});
      if(crit){addShake(.75,.045);addFlash(.02)}
    }
    return r
  };

  const bc=castSkill;castSkill=function(id){const a0=attackEffects.length,b0=bullets.length,r=bc(id);if((attackEffects.length>a0||bullets.length>b0)&&['meteor','quake','tempestRift'].includes(id)){addShake(1.1,.075);addFlash(.03)}return r};

  const baseDraw=draw;draw=function(){
    let ox,oy;if(camera&&P.shake>0){ox=camera.x;oy=camera.y;const t=now()*.04,amp=P.shakePower*Math.min(1,P.shake/.05);camera.x=ox+Math.sin(t*1.7)*amp;camera.y=oy+Math.cos(t*2.1)*amp}
    baseDraw();if(ox!==undefined){camera.x=ox;camera.y=oy}
    if(P.flash>0){ctx.save();ctx.globalAlpha=Math.min(.07,P.flash);ctx.fillStyle='#fff3cf';ctx.fillRect(0,0,W,H);ctx.restore()}
  };
})();