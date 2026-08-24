(() => {
  // v4.5 vertical slice: sharpen the visual identity without adding image-file weight.
  const baseBackground=drawBackground;
  drawBackground=function(){
    baseBackground();
    if(!currentMap||currentMap.id!=='forest')return;
    const t=elapsed||0;
    ctx.save();
    // Layered ink-wash mountains: subtle parallax relative to camera.
    const layers=[
      {y:H*.27,amp:25,step:92,a:.10,par:.018,col:'#6f806f'},
      {y:H*.34,amp:34,step:118,a:.085,par:.030,col:'#52675d'},
      {y:H*.42,amp:42,step:145,a:.065,par:.045,col:'#384e48'}
    ];
    for(const L of layers){
      ctx.globalAlpha=L.a;ctx.fillStyle=L.col;ctx.beginPath();ctx.moveTo(0,H);
      const off=-(camera?.x||0)*L.par;
      for(let x=-L.step;x<=W+L.step;x+=L.step){
        const y=L.y+Math.sin((x+off)*.013)*L.amp+Math.sin((x+off)*.027+1.7)*L.amp*.35;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();
    }
    // Bamboo silhouettes around the edge of the viewport.
    ctx.globalAlpha=.14;ctx.strokeStyle='#8ba178';ctx.lineWidth=2;
    for(let i=0;i<9;i++){
      const x=((i*97-(camera?.x||0)*.06)% (W+120))-60;
      const h=H*(.22+.08*Math.sin(i*2.1));
      ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+Math.sin(t*.15+i)*4,H-h);ctx.stroke();
      for(let j=1;j<4;j++){
        const yy=H-h*j/4+8,dir=(j+i)%2?1:-1;
        ctx.beginPath();ctx.moveTo(x,yy);ctx.quadraticCurveTo(x+dir*11,yy-7,x+dir*17,yy-4);ctx.stroke();
      }
    }
    // Thin travelling mist.
    const g=ctx.createLinearGradient(0,H*.4,W,H*.72);
    g.addColorStop(0,'rgba(205,219,199,0)');
    g.addColorStop(.48,'rgba(205,219,199,.045)');
    g.addColorStop(1,'rgba(205,219,199,0)');
    ctx.fillStyle=g;ctx.fillRect(0,H*.32,W,H*.42);
    ctx.restore();
  };

  function robeBody(main,trim,scale=1){
    ctx.save();ctx.scale(scale,scale);
    // flowing lower robe
    ctx.fillStyle=main;ctx.beginPath();ctx.moveTo(-8,-1);ctx.quadraticCurveTo(-9,11,-12,17);ctx.lineTo(0,13);ctx.lineTo(12,17);ctx.quadraticCurveTo(9,11,8,-1);ctx.closePath();ctx.fill();
    // upper robe
    ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(-5,-11);ctx.lineTo(5,-11);ctx.lineTo(8,-5);ctx.lineTo(6,7);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
    ctx.strokeStyle=trim;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-5,-9);ctx.lineTo(4,4);ctx.moveTo(5,-9);ctx.lineTo(-2,1);ctx.stroke();
    ctx.fillStyle=trim;ctx.fillRect(-7,3,14,2);
    ctx.restore();
  }
  function faceAndHair(){
    ctx.fillStyle='#c99b75';ctx.beginPath();ctx.arc(0,-13,4.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#161612';ctx.beginPath();ctx.arc(0,-14.5,4.4,Math.PI,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(0,-19,2.1,0,Math.PI*2);ctx.fill();
  }
  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!player)return;
    const bob=Math.sin(elapsed*7)*.55,ang=player.facing||0,move=Math.hypot(input?.x||0,input?.y||0);
    ctx.save();ctx.translate(player.x,player.y+bob);
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(0,11,9.5,3.1,0,0,Math.PI*2);ctx.fill();
    // sleeve movement makes the tiny figure feel alive
    const sway=Math.sin(elapsed*(move>.1?11:5))*1.3;
    ctx.strokeStyle='#334d4b';ctx.lineWidth=4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,-5);ctx.lineTo(-10,1+sway);ctx.moveTo(6,-5);ctx.lineTo(10,1-sway);ctx.stroke();
    robeBody('#243d3e','#73a899',.82);faceAndHair();
    // sect sash
    ctx.strokeStyle='#77ad9b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,5);ctx.lineTo(-10,13);ctx.stroke();
    // weapon is drawn with reduced glow and stronger silhouette
    ctx.save();ctx.rotate(ang);ctx.translate(8,0);ctx.shadowBlur=0;ctx.strokeStyle='#161814';ctx.lineWidth=3.8;
    if(player.weaponType==='sword'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(21,0);ctx.stroke();ctx.strokeStyle='#d9d2bc';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(21,0);ctx.stroke();ctx.strokeStyle='#a7874c';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(1,-3.5);ctx.lineTo(1,3.5);ctx.stroke()}
    else if(player.weaponType==='spear'){ctx.strokeStyle='#8a6845';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(26,0);ctx.stroke();ctx.fillStyle='#c9c6b4';ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(23,-3);ctx.lineTo(23,3);ctx.closePath();ctx.fill()}
    else if(player.weaponType==='bow'){ctx.strokeStyle='#98754f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(7,0,12,-Math.PI/2,Math.PI/2);ctx.stroke()}
    else if(player.weaponType==='dagger'){ctx.fillStyle='#cbc8b7';ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(3,-2.5);ctx.lineTo(5,0);ctx.lineTo(3,2.5);ctx.closePath();ctx.fill()}
    else if(player.weaponType==='hammer'){ctx.strokeStyle='#76583f';ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(16,0);ctx.stroke();ctx.fillStyle='#6e716c';ctx.fillRect(14,-6,10,12)}
    else if(player.weaponType==='staff'){ctx.strokeStyle='#ddd2ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(18,0);ctx.stroke();ctx.fillStyle='#f0ead2';ctx.beginPath();ctx.ellipse(19,0,5,8,0,0,Math.PI*2);ctx.fill()}
    else if(player.weaponType==='axe'){ctx.strokeStyle='#8b6c48';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(17,0);ctx.stroke();ctx.strokeStyle='#c8c2ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(18,0,5,-1.25,1.25);ctx.stroke()}
    else {ctx.fillStyle='#d2b55f';ctx.fillRect(7,-5,9,10);ctx.strokeStyle='#b74638';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(9,-2);ctx.lineTo(14,2);ctx.moveTo(14,-2);ctx.lineTo(9,2);ctx.stroke()}
    ctx.restore();
    if(player.hitFlash>0){ctx.globalAlpha=Math.min(1,player.hitFlash*7);ctx.fillStyle='rgba(240,228,196,.75)';ctx.beginPath();ctx.arc(0,-2,11,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  };

  function enemyPalette(type){
    return ({
      basic:['#594a3c','#87705a','#b28d68'],
      fast:['#29342e','#546359','#9b8a6e'],
      tank:['#4a4c47','#73756f','#b49a6a'],
      ranged:['#514238','#76604b','#a47e5f'],
      charger:['#593c32','#8b5948','#c38b62'],
      elite:['#3d4b45','#7e8f76','#c7ad6f'],
      midboss:['#4e4032','#92754b','#d1af63'],
      boss:['#4a2424','#8c4037','#d0a45e']
    })[type]||['#54483c','#756454','#a88766'];
  }
  const baseEnemy=drawEnemy;
  drawEnemy=function(e){
    if(e.x<camera.x-80||e.x>camera.x+W+80||e.y<camera.y-80||e.y>camera.y+H+80)return;
    const [main,sub,accent]=enemyPalette(e.type),big=e.type==='boss'?1.28:e.type==='midboss'?1.12:e.type==='tank'?.99:.84;
    const a=Math.atan2((player?.y||e.y)-e.y,(player?.x||e.x)-e.x);
    ctx.save();ctx.translate(e.x,e.y);ctx.scale(big,big);
    ctx.fillStyle='rgba(0,0,0,.23)';ctx.beginPath();ctx.ellipse(0,7,Math.max(6,e.r*.72),2.5,0,0,Math.PI*2);ctx.fill();
    // role silhouette
    if(e.type==='tank'||e.type==='charger'||e.type==='midboss'||e.type==='boss'){
      ctx.fillStyle=main;ctx.beginPath();ctx.moveTo(-9,-7);ctx.lineTo(-11,6);ctx.lineTo(-7,13);ctx.lineTo(7,13);ctx.lineTo(11,6);ctx.lineTo(9,-7);ctx.closePath();ctx.fill();
      ctx.fillStyle=sub;ctx.fillRect(-10,-5,20,5);
    }else{
      ctx.fillStyle=main;ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-8,7);ctx.lineTo(-5,14);ctx.lineTo(0,11);ctx.lineTo(5,14);ctx.lineTo(8,7);ctx.lineTo(7,-8);ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle=accent;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-5,-6);ctx.lineTo(4,5);ctx.stroke();
    ctx.fillStyle='#bc8d6e';ctx.beginPath();ctx.arc(0,-12,3.7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=e.type==='fast'?'#121714':'#181510';ctx.beginPath();ctx.arc(0,-14,4,Math.PI,Math.PI*2);ctx.fill();
    if(e.type==='fast'){ctx.fillStyle='#222a25';ctx.fillRect(-4,-12,8,2.3)}
    ctx.rotate(a);
    ctx.strokeStyle='#d0c5ab';ctx.fillStyle='#d0c5ab';ctx.lineWidth=2;
    if(e.type==='ranged'){ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(15,0);ctx.stroke();ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(11,-2.5);ctx.lineTo(11,2.5);ctx.closePath();ctx.fill()}
    else if(e.type==='tank'){ctx.strokeStyle='#81745f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(17,0);ctx.stroke();ctx.fillStyle='#676963';ctx.fillRect(14,-5,8,10)}
    else if(e.type==='charger'){ctx.strokeStyle='#8d6849';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(21,0);ctx.stroke();ctx.fillStyle='#c9c3ae';ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(18,-3);ctx.lineTo(18,3);ctx.closePath();ctx.fill()}
    else{ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(e.type==='boss'?22:17,0);ctx.stroke()}
    ctx.restore();
    // HP only for stronger enemies; keeps the screen quiet.
    if(['elite','midboss','boss'].includes(e.type)){
      const w=e.type==='boss'?42:e.type==='midboss'?34:25,p=Math.max(0,e.hp/e.maxHp);
      ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(e.x-w/2,e.y-e.r-15,w,3);
      ctx.fillStyle=accent;ctx.fillRect(e.x-w/2,e.y-e.r-15,w*p,3);
    }
  };

  const baseChest=drawChest;
  drawChest=function(c){
    if(c.broken||c.x<camera.x-55||c.x>camera.x+W+55||c.y<camera.y-55||c.y>camera.y+H+55)return;
    ctx.save();ctx.translate(c.x,c.y);
    const tier=c.tier||0,scale=tier>=2?1.08:1;
    ctx.scale(scale,scale);
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(0,8,c.r*.95,c.r*.25,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=tier>=2?'#493526':'#403429';ctx.strokeStyle=tier>=2?'#b99554':'#8d7959';ctx.lineWidth=1.25;
    ctx.beginPath();pathRoundRect(ctx,-c.r*.9,-c.r*.5,c.r*1.8,c.r,2.5);ctx.fill();ctx.stroke();
    ctx.fillStyle=tier>=2?'#b99554':'#8d7959';ctx.fillRect(-1.4,-c.r*.5,2.8,c.r);
    // paper seal
    ctx.fillStyle='#d7c79e';ctx.save();ctx.rotate(-.08);ctx.fillRect(-3.4,-c.r*.52,6.8,c.r*.58);ctx.fillStyle=tier>=2?'#a03d33':'#674d38';ctx.font=`800 ${Math.max(5,c.r*.38)}px serif`;ctx.textAlign='center';ctx.fillText(tier>=2?'賞':'封',0,-c.r*.13);ctx.restore();
    ctx.restore();
  };

  const baseObstacle=drawObstacle;
  drawObstacle=function(o){
    if(!currentMap||currentMap.id!=='forest'){baseObstacle(o);return}
    if(o.x<camera.x-90||o.x>camera.x+W+90||o.y<camera.y-90||o.y>camera.y+H+90)return;
    ctx.save();ctx.translate(o.x,o.y);ctx.rotate((o.rot||0)*.18);
    if(o.type==='tree'){
      // bamboo clump
      const n=3+(o.variant||0);
      for(let i=0;i<n;i++){
        const x=(i-(n-1)/2)*5;
        ctx.strokeStyle=i%2?'#486249':'#587253';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x+Math.sin(i*1.7)*3,-28-(i%2)*8);ctx.stroke();
        ctx.strokeStyle='#718665';ctx.lineWidth=1.3;
        for(let j=0;j<3;j++){
          const yy=-2-j*10-(i%2)*3,dir=(i+j)%2?1:-1;
          ctx.beginPath();ctx.moveTo(x,yy);ctx.quadraticCurveTo(x+dir*9,yy-5,x+dir*14,yy-2);ctx.stroke();
        }
      }
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,18,13,4,0,0,Math.PI*2);ctx.fill();
    }else if(o.type==='pillar'){
      ctx.fillStyle='#4f4b3d';ctx.fillRect(-6,-18,12,36);ctx.fillStyle='#69624e';ctx.fillRect(-8,-20,16,5);ctx.fillRect(-8,14,16,5);
      ctx.strokeStyle='#8b805f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2,-12);ctx.lineTo(2,-2);ctx.lineTo(-1,8);ctx.stroke();
    }else if(o.type==='ruin'){
      ctx.fillStyle='#4d4738';ctx.beginPath();ctx.moveTo(-18,14);ctx.lineTo(-13,-7);ctx.lineTo(-5,-15);ctx.lineTo(4,-10);ctx.lineTo(13,-18);ctx.lineTo(17,14);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#756b50';ctx.lineWidth=1.2;ctx.stroke();
    }else{
      ctx.fillStyle='#4c5144';ctx.beginPath();ctx.moveTo(-17,10);ctx.lineTo(-10,-10);ctx.lineTo(2,-16);ctx.lineTo(16,-5);ctx.lineTo(13,11);ctx.closePath();ctx.fill();
      ctx.fillStyle='#626956';ctx.beginPath();ctx.moveTo(-8,3);ctx.lineTo(-3,-7);ctx.lineTo(8,-8);ctx.lineTo(11,2);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  };

  // companion art: slightly smaller than the player and role-readable.
  v440DrawCompanion=function(){
    const c=v440Companion;if(!c)return;
    const cfg={
      swordsman:['#485955','#b59f69'],
      assassin:['#303b36','#8b6572'],
      lancer:['#5a5142','#aa8d67'],
      brawler:['#594238','#9f6a58'],
      healer:['#4c614d','#91ad7c']
    }[c.id]||['#4b5148','#a89973'];
    ctx.save();ctx.translate(c.x,c.y+Math.sin(elapsed*6+c.phase)*.45);ctx.scale(.78,.78);
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,11,8,2.5,0,0,Math.PI*2);ctx.fill();
    robeBody(cfg[0],cfg[1],.9);faceAndHair();
    ctx.strokeStyle=cfg[1];ctx.fillStyle=cfg[1];ctx.lineWidth=2;
    if(c.id==='swordsman'){ctx.beginPath();ctx.moveTo(4,-1);ctx.lineTo(18,5);ctx.stroke()}
    else if(c.id==='assassin'){ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-13,6);ctx.moveTo(5,2);ctx.lineTo(13,6);ctx.stroke()}
    else if(c.id==='lancer'){ctx.strokeStyle='#8b6a47';ctx.beginPath();ctx.moveTo(-7,4);ctx.lineTo(21,-4);ctx.stroke()}
    else if(c.id==='brawler'){ctx.beginPath();ctx.arc(-7,4,3,0,Math.PI*2);ctx.arc(7,4,3,0,Math.PI*2);ctx.fill()}
    else{ctx.fillStyle='#b7a469';ctx.beginPath();ctx.ellipse(9,3,4,6,0,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  };

  const tag=document.createElement('div');tag.className='artSliceTag';tag.textContent='ART SLICE · v4.5';document.body.appendChild(tag);
})();
