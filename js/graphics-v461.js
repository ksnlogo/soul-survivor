(() => {
  'use strict';

  window.MurimGraphicsVersion='4.6.1';

  const PALETTES={
    forest:{ground:'#344137',ink:'#17231c',wash:'#4e604d',mist:'#89947b',road:'#55533d',roadInner:'#6c684b',accent:'#9fbd91',paper:'#ddd4b8',seal:'#b45848'},
    frost:{ground:'#455156',ink:'#263237',wash:'#64777c',mist:'#a9b9b8',road:'#596160',roadInner:'#727b78',accent:'#b8d1cf',paper:'#d8d8c8',seal:'#92564f'},
    ember:{ground:'#493429',ink:'#291d18',wash:'#71503d',mist:'#b68d6a',road:'#614b3d',roadInner:'#795d48',accent:'#cf8c58',paper:'#d8c39f',seal:'#bd4e3b'},
    crypt:{ground:'#383832',ink:'#20231e',wash:'#54564b',mist:'#8f8e79',road:'#4c4a3f',roadInner:'#605c4c',accent:'#aaa184',paper:'#c9c2a8',seal:'#914b43'}
  };

  const palette=()=>PALETTES[(currentMap&&currentMap.id)||'forest']||PALETTES.forest;
  const inView=(x,y,pad=80)=>x>=camera.x-pad&&x<=camera.x+W+pad&&y>=camera.y-pad&&y<=camera.y+H+pad;
  const TAU=Math.PI*2;
  let inkTile=null,inkPattern=null,inkTheme='';

  function seeded(seed){
    let s=seed>>>0;
    return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
  }

  function buildInkTile(){
    const id=(currentMap&&currentMap.id)||'forest';
    if(inkPattern&&inkTheme===id)return inkPattern;
    const L=palette(),rnd=seeded({forest:4611,frost:4612,ember:4613,crypt:4614}[id]||4611);
    inkTile=document.createElement('canvas');inkTile.width=640;inkTile.height=640;
    const g=inkTile.getContext('2d',{alpha:false});
    g.fillStyle=L.ground;g.fillRect(0,0,640,640);

    // Cached watercolor blooms. Gradients are built once per stage theme, never per frame.
    for(let i=0;i<20;i++){
      const x=rnd()*640,y=rnd()*640,r=55+rnd()*135;
      const grad=g.createRadialGradient(x,y,r*.08,x,y,r);
      grad.addColorStop(0,i%3===0?L.mist:L.wash);
      grad.addColorStop(.64,L.wash);grad.addColorStop(1,'rgba(0,0,0,0)');
      g.globalAlpha=.035+rnd()*.07;g.fillStyle=grad;g.beginPath();
      g.ellipse(x,y,r,r*(.45+rnd()*.5),rnd()*TAU,0,TAU);g.fill();
    }

    // Dry-brush streaks and paper fibres.
    g.lineCap='round';
    for(let i=0;i<92;i++){
      const x=rnd()*640,y=rnd()*640,len=18+rnd()*96,a=rnd()*TAU;
      g.globalAlpha=.025+rnd()*.055;g.strokeStyle=i%4===0?L.mist:L.ink;g.lineWidth=.45+rnd()*1.4;
      g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*len*.45,y+Math.sin(a)*len*.45+(rnd()-.5)*7,x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke();
    }
    for(let i=0;i<210;i++){
      const x=rnd()*640,y=rnd()*640;
      g.globalAlpha=.025+rnd()*.04;g.strokeStyle=L.paper;g.lineWidth=.35;
      g.beginPath();g.moveTo(x,y);g.lineTo(x+2+rnd()*8,y+(rnd()-.5)*2);g.stroke();
    }
    for(let i=0;i<7;i++){
      const x=rnd()*640,y=rnd()*640,r=18+rnd()*42;
      g.globalAlpha=.025+rnd()*.035;g.strokeStyle=L.ink;g.lineWidth=2+rnd()*4;
      g.beginPath();g.arc(x,y,r,rnd()*.8,TAU-rnd()*.7);g.stroke();
    }
    g.globalAlpha=1;
    inkPattern=ctx.createPattern(inkTile,'repeat');inkTheme=id;
    return inkPattern;
  }

  drawBackground=function(){
    ctx.fillStyle=palette().ground;ctx.fillRect(0,0,W,H);
  };

  function strokePath(pts,width,color){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);ctx.bezierCurveTo(pts[1].x,pts[1].y,pts[2].x,pts[2].y,pts[3].x,pts[3].y);ctx.stroke();
  }

  function drawGroundMark(d,L){
    if(!inView(d.x,d.y,24))return;
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.scale(d.scale,d.scale);
    ctx.strokeStyle=L.ink;ctx.fillStyle=L.ink;ctx.globalAlpha=.20;ctx.lineWidth=1.25;
    if(d.kind===0){
      for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(j*3,7);ctx.quadraticCurveTo(j*5,-2,j*2,-9);ctx.stroke();}
    }else if(d.kind===1){ctx.beginPath();ctx.ellipse(0,0,7,2.4,0,0,TAU);ctx.fill();}
    else if(d.kind===2){ctx.beginPath();ctx.moveTo(-7,4);ctx.quadraticCurveTo(0,-8,8,3);ctx.stroke();}
    else if(d.kind===3){ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(-8,1);ctx.lineTo(8,-1);ctx.stroke();}
    else{ctx.fillRect(-1,-8,2,16);}
    ctx.restore();
  }

  drawArenaDetails=function(){
    const L=palette();ctx.fillStyle=buildInkTile();ctx.fillRect(camera.x-2,camera.y-2,W+4,H+4);

    // Two restrained dry-brush roads remain readable without dominating the painting.
    for(const pts of mapPaths){
      strokePath(pts,72,'rgba(18,22,17,.20)');
      strokePath(pts,57,L.road);strokePath(pts,39,L.roadInner);
      ctx.globalAlpha=.18;ctx.setLineDash([24,38]);strokePath(pts,1.2,L.paper);ctx.setLineDash([]);ctx.globalAlpha=1;
    }

    const step=isIos?3:2;
    for(let i=0;i<groundDecos.length;i+=step)drawGroundMark(groundDecos[i],L);
    for(const l of mapLandmarks)drawLandmark(l);

    // The central formation is deliberately faint so characters remain the focus.
    const cx=WORLD_W/2,cy=WORLD_H/2;
    if(inView(cx,cy,180)){
      ctx.save();ctx.strokeStyle=L.accent;ctx.globalAlpha=.16;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,116,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,77,0,TAU);ctx.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*77,cy+Math.sin(a)*77);ctx.lineTo(cx+Math.cos(a)*116,cy+Math.sin(a)*116);ctx.stroke();}
      ctx.restore();
    }
    ctx.strokeStyle='rgba(222,211,176,.15)';ctx.lineWidth=3;ctx.strokeRect(12,12,WORLD_W-24,WORLD_H-24);
  };

  drawLandmark=function(l){
    if(!inView(l.x,l.y,l.r+55))return;
    const L=palette(),r=l.r;ctx.save();ctx.translate(l.x,l.y);
    ctx.fillStyle='rgba(12,16,12,.24)';ctx.beginPath();ctx.ellipse(3,r*.55,r*.78,r*.22,0,0,TAU);ctx.fill();
    ctx.strokeStyle=L.ink;ctx.fillStyle=L.wash;ctx.lineWidth=2.2;
    if(l.kind==='gate'){
      ctx.fillStyle=L.ink;ctx.fillRect(-r*.72,-r*.25,7,r*.95);ctx.fillRect(r*.57,-r*.25,7,r*.95);ctx.fillRect(-r*.82,-r*.34,r*1.64,8);
      ctx.fillStyle=L.seal;ctx.fillRect(-6,-r*.28,12,16);
    }else if(l.kind==='tree'){
      ctx.strokeStyle=L.ink;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,r*.58);ctx.quadraticCurveTo(-5,0,3,-r*.66);ctx.stroke();
      ctx.globalAlpha=.62;ctx.fillStyle=L.wash;for(let i=0;i<5;i++){const a=i*1.38+l.phase*.08;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.35,-r*.42+Math.sin(a)*r*.18,r*.38,r*.18,a*.3,0,TAU);ctx.fill();}
    }else if(l.kind==='crystal'){
      ctx.fillStyle=L.mist;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.46,-r*.08);ctx.lineTo(r*.22,r*.64);ctx.lineTo(-r*.28,r*.64);ctx.lineTo(-r*.5,-r*.06);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.stroke();
    }else if(l.kind==='forge'){
      ctx.fillStyle=L.ink;ctx.fillRect(-r*.65,-r*.08,r*1.3,r*.56);ctx.fillStyle=L.seal;ctx.beginPath();ctx.moveTo(-7,-r*.05);ctx.quadraticCurveTo(0,-r*.55,8,-r*.04);ctx.quadraticCurveTo(0,-r*.22,-7,-r*.05);ctx.fill();
    }else{
      ctx.fillStyle=L.ink;ctx.fillRect(-5,-r*.68,10,r*1.25);ctx.fillStyle=L.paper;ctx.globalAlpha=.42;ctx.fillRect(-3,-r*.48,6,r*.54);ctx.globalAlpha=1;ctx.strokeStyle=L.accent;ctx.beginPath();ctx.arc(0,-r*.74,6,0,TAU);ctx.stroke();
    }
    ctx.restore();
  };

  drawObstacle=function(o){
    if(!inView(o.x,o.y,o.r+45))return;
    const L=palette(),r=o.r,id=currentMap.id;ctx.save();ctx.translate(o.x,o.y);ctx.rotate((o.rot||0)*.16);
    ctx.fillStyle='rgba(10,14,10,.22)';ctx.beginPath();ctx.ellipse(3,r*.58,r*.76,r*.22,0,0,TAU);ctx.fill();
    if(o.type==='tree'&&id==='forest'){
      const n=3+(o.variant||0);for(let i=0;i<n;i++){const x=(i-(n-1)/2)*6;ctx.strokeStyle=i%2?L.wash:L.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,r*.55);ctx.lineTo(x+(i%2?2:-2),-r*.8);ctx.stroke();for(let j=0;j<3;j++){const y=-r*.12-j*r*.22,dir=(i+j)%2?1:-1;ctx.strokeStyle=L.accent;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dir*8,y-5,x+dir*15,y-2);ctx.stroke();}}
    }else if(o.type==='tree'){
      ctx.fillStyle=L.ink;ctx.fillRect(-4,-r*.05,8,r*.64);ctx.fillStyle=L.wash;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,-r*(.92-i*.2));ctx.lineTo(-r*(.55-i*.1),-r*(.28-i*.02));ctx.lineTo(r*(.55-i*.1),-r*(.28-i*.02));ctx.closePath();ctx.fill();}
    }else if(o.type==='pillar'){
      ctx.fillStyle=L.ink;ctx.fillRect(-r*.28,-r*.72,r*.56,r*1.3);ctx.fillStyle=L.wash;ctx.fillRect(-r*.42,-r*.78,r*.84,r*.18);ctx.fillRect(-r*.4,r*.43,r*.8,r*.18);ctx.strokeStyle=L.mist;ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(-r*.1,-r*.5);ctx.lineTo(r*.12,-r*.08);ctx.lineTo(-r*.08,r*.31);ctx.stroke();
    }else if(o.type==='ruin'){
      ctx.fillStyle=L.ink;ctx.beginPath();ctx.moveTo(-r*.65,r*.42);ctx.lineTo(-r*.48,-r*.28);ctx.lineTo(-r*.18,-r*.62);ctx.lineTo(r*.1,-r*.38);ctx.lineTo(r*.48,-r*.68);ctx.lineTo(r*.62,r*.42);ctx.closePath();ctx.fill();ctx.fillStyle=L.wash;ctx.fillRect(-r*.55,r*.2,r*1.1,r*.22);
    }else{
      ctx.fillStyle=L.ink;ctx.beginPath();for(let i=0;i<7;i++){const a=i*TAU/7,rr=r*(i%2?.78:1),x=Math.cos(a)*rr,y=Math.sin(a)*rr*.68;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle=L.wash;ctx.globalAlpha=.62;ctx.beginPath();ctx.moveTo(-r*.38,-r*.08);ctx.lineTo(-r*.08,-r*.48);ctx.lineTo(r*.4,-r*.25);ctx.lineTo(r*.22,.1);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  };

  function drawRobe(main,trim,scale=1,wide=false){
    ctx.save();ctx.scale(scale,scale);ctx.fillStyle=main;ctx.strokeStyle='#131711';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(wide?-10:-8,-7);ctx.lineTo(wide?-12:-9,7);ctx.lineTo(-7,16);ctx.lineTo(0,12);ctx.lineTo(7,16);ctx.lineTo(wide?12:9,7);ctx.lineTo(wide?10:8,-7);ctx.lineTo(5,-12);ctx.lineTo(-5,-12);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=trim;ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(0,0);ctx.lineTo(5,-10);ctx.stroke();ctx.fillStyle=trim;ctx.fillRect(-8,3,16,2.2);ctx.restore();
  }

  function drawWeapon(type,ang,scale=1){
    const L=palette();ctx.save();ctx.rotate(ang);ctx.scale(scale,scale);ctx.translate(10,0);ctx.lineCap='round';
    if(type==='sword'){ctx.strokeStyle='#171a16';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(22,0);ctx.stroke();ctx.strokeStyle='#e0ded0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(22,0);ctx.stroke();ctx.strokeStyle='#c6a358';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(0,4);ctx.stroke();}
    else if(type==='spear'){ctx.strokeStyle='#735238';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(28,0);ctx.stroke();ctx.fillStyle='#deded5';ctx.beginPath();ctx.moveTo(33,0);ctx.lineTo(26,-4);ctx.lineTo(26,4);ctx.closePath();ctx.fill();ctx.fillStyle=L.seal;ctx.fillRect(22,-1.5,5,3);}
    else if(type==='bow'){ctx.strokeStyle='#a87a45';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(5,0,13,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#dfd9c9';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(5,-13);ctx.lineTo(5,13);ctx.stroke();}
    else if(type==='dagger'){ctx.fillStyle='#e1e0d6';ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(2,-3.3);ctx.lineTo(5,0);ctx.lineTo(2,3.3);ctx.closePath();ctx.fill();ctx.fillStyle='#986f42';ctx.fillRect(-2,-1.3,5,2.6);}
    else if(type==='hammer'){ctx.strokeStyle='#73533a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(17,0);ctx.stroke();ctx.fillStyle='#555b55';ctx.fillRect(14,-7,12,14);ctx.strokeStyle='#a79d7b';ctx.lineWidth=1;ctx.strokeRect(14,-7,12,14);}
    else if(type==='axe'){ctx.strokeStyle='#77563a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(18,0);ctx.stroke();ctx.fillStyle='#d3d4cc';ctx.beginPath();ctx.moveTo(15,-8);ctx.quadraticCurveTo(28,-6,23,6);ctx.lineTo(15,4);ctx.closePath();ctx.fill();}
    else{ctx.fillStyle=type==='grimoire'?L.seal:L.paper;ctx.fillRect(5,-6,12,12);ctx.strokeStyle=L.ink;ctx.lineWidth=1.2;ctx.strokeRect(5,-6,12,12);ctx.beginPath();ctx.moveTo(8,-3);ctx.lineTo(14,3);ctx.moveTo(14,-3);ctx.lineTo(8,3);ctx.stroke();}
    ctx.restore();
  }

  drawPlayer=function(){
    if(!player)return;const L=palette(),ang=player.facing||0,moving=Math.abs(input.x)+Math.abs(input.y)>.08,bob=Math.sin(elapsed*(moving?9:5))*.7;
    ctx.save();ctx.translate(player.x,player.y+bob);
    ctx.fillStyle='rgba(7,11,7,.31)';ctx.beginPath();ctx.ellipse(0,15,13,4,0,0,TAU);ctx.fill();
    if(player.shield>0){ctx.strokeStyle=L.paper;ctx.globalAlpha=.56;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-1,21+Math.sin(elapsed*5),0,TAU);ctx.stroke();ctx.globalAlpha=1;}
    // Long back sash makes direction and movement visible at phone scale.
    ctx.save();ctx.rotate(ang+Math.PI);ctx.strokeStyle=L.accent;ctx.lineWidth=3;ctx.lineCap='round';ctx.globalAlpha=.76;ctx.beginPath();ctx.moveTo(-2,5);ctx.quadraticCurveTo(-8,13+(moving?3:0),-16,17);ctx.moveTo(2,5);ctx.quadraticCurveTo(7,12-(moving?2:0),13,19);ctx.stroke();ctx.restore();
    const main=runEvolution?'#405a4c':'#456653',trim=runEvolution?(evolutionDefs[runEvolution]?.color||L.accent):L.paper;
    drawRobe(main,trim,1.12,false);
    ctx.fillStyle='#c79671';ctx.beginPath();ctx.arc(0,-15,5,0,TAU);ctx.fill();ctx.fillStyle='#171712';ctx.beginPath();ctx.arc(0,-17,5.2,Math.PI,TAU);ctx.fill();ctx.fillRect(-1.5,-22,3,-5);ctx.beginPath();ctx.arc(0,-23,2.7,0,TAU);ctx.fill();
    ctx.fillStyle=L.accent;ctx.beginPath();ctx.arc(-7,7,2.4,0,TAU);ctx.fill();ctx.strokeStyle=L.paper;ctx.globalAlpha=.42;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-2,18,0,TAU);ctx.stroke();ctx.globalAlpha=1;
    drawWeapon(player.weaponType,ang,1.08);ctx.restore();
  };

  function enemyColors(type){
    return ({basic:['#714d3d','#b48b66'],fast:['#26372f','#8ba18b'],tank:['#4a4d47','#b79b68'],ranged:['#564232','#bc915f'],charger:['#773d32','#c27557'],elite:['#3f5148','#d0b66f'],midboss:['#67482e','#d1aa5b'],boss:['#642a27','#d3a05a']})[type]||['#654a3b','#ad8964'];
  }

  drawEnemy=function(e){
    if(!e||!inView(e.x,e.y,e.r+55))return;
    const L=palette(),C=enemyColors(e.type),s=Math.max(.92,e.r/10),a=player?Math.atan2(player.y-e.y,player.x-e.x):0,bob=Math.sin(elapsed*5+e.phase)*(e.type==='fast'?1:.45);
    ctx.save();ctx.translate(e.x,e.y+bob);ctx.fillStyle='rgba(7,10,7,.28)';ctx.beginPath();ctx.ellipse(0,e.r*.72,e.r*.76,e.r*.22,0,0,TAU);ctx.fill();
    if(e.type==='tank'){
      drawRobe(C[0],C[1],s,true);ctx.fillStyle='#696c64';ctx.fillRect(-11*s,-8*s,5*s,12*s);ctx.fillRect(6*s,-8*s,5*s,12*s);ctx.strokeStyle=C[1];ctx.lineWidth=1.4*s;ctx.strokeRect(-8*s,-8*s,16*s,13*s);
    }else{drawRobe(C[0],C[1],s,e.type==='boss'||e.type==='midboss');}
    ctx.fillStyle='#bd8b68';ctx.beginPath();ctx.arc(0,-13*s,4.1*s,0,TAU);ctx.fill();ctx.fillStyle='#17140f';ctx.beginPath();ctx.arc(0,-15*s,4.5*s,Math.PI,TAU);ctx.fill();
    if(e.type==='fast'){ctx.fillStyle='#1b2520';ctx.fillRect(-5*s,-15*s,10*s,2.4*s);ctx.strokeStyle='#d8d8ce';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(-6*s,0);ctx.lineTo(-15*s,7*s);ctx.moveTo(6*s,0);ctx.lineTo(15*s,7*s);ctx.stroke();ctx.strokeStyle=C[1];ctx.beginPath();ctx.moveTo(-5*s,-8*s);ctx.lineTo(-13*s,-14*s);ctx.moveTo(5*s,-8*s);ctx.lineTo(13*s,-14*s);ctx.stroke();}
    else if(e.type==='ranged'){ctx.save();ctx.rotate(a);ctx.strokeStyle='#b9874e';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(7*s,0,7*s,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#ddd4bd';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(7*s,-7*s);ctx.lineTo(7*s,7*s);ctx.stroke();ctx.restore();}
    else if(e.type==='charger'){ctx.save();ctx.rotate(a);ctx.strokeStyle='#805535';ctx.lineWidth=2.6*s;ctx.beginPath();ctx.moveTo(-8*s,2*s);ctx.lineTo(25*s,2*s);ctx.stroke();ctx.fillStyle='#dbd9ce';ctx.beginPath();ctx.moveTo(30*s,2*s);ctx.lineTo(23*s,-2*s);ctx.lineTo(23*s,6*s);ctx.closePath();ctx.fill();ctx.fillStyle=L.seal;ctx.beginPath();ctx.moveTo(13*s,2*s);ctx.lineTo(20*s,8*s);ctx.lineTo(20*s,2*s);ctx.closePath();ctx.fill();ctx.restore();}
    else if(e.type==='tank'){ctx.save();ctx.rotate(a);ctx.strokeStyle='#72533a';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(4*s,2*s);ctx.lineTo(18*s,2*s);ctx.stroke();ctx.fillStyle='#575b55';ctx.fillRect(15*s,-5*s,10*s,14*s);ctx.restore();}
    else{ctx.save();ctx.rotate(a);ctx.strokeStyle='#d7d4c7';ctx.lineWidth=(e.type==='boss'?2.5:1.8)*s;ctx.beginPath();ctx.moveTo(5*s,1*s);ctx.lineTo((e.type==='boss'?23:18)*s,1*s);ctx.stroke();ctx.restore();}
    if(['elite','midboss','boss'].includes(e.type)){
      ctx.strokeStyle=e.type==='boss'?L.seal:C[1];ctx.globalAlpha=e.type==='boss'?.7:.46;ctx.lineWidth=e.type==='boss'?2:1.3;ctx.beginPath();ctx.arc(0,0,e.r+6+Math.sin(elapsed*3+e.phase),0,TAU);ctx.stroke();
      if(e.type==='boss'){for(let i=0;i<6;i++){const q=i*Math.PI/3,r=e.r+9;ctx.beginPath();ctx.moveTo(Math.cos(q)*r,Math.sin(q)*r);ctx.lineTo(Math.cos(q)*(r+5),Math.sin(q)*(r+5));ctx.stroke();}ctx.fillStyle=L.seal;ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(-5*s,-18*s);ctx.lineTo(0,-24*s);ctx.lineTo(5*s,-18*s);ctx.closePath();ctx.fill();}
      ctx.globalAlpha=1;
    }
    ctx.restore();
    if(['elite','midboss','boss'].includes(e.type)){const w=e.type==='boss'?e.r*2.4:e.r*2.05;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(e.x-w/2,e.y-e.r-17,w,4);ctx.fillStyle=e.type==='boss'?L.seal:C[1];ctx.fillRect(e.x-w/2,e.y-e.r-17,w*Math.max(0,e.hp/e.maxHp),4);}
  };

  const legacyEffect=drawAttackEffect;
  drawAttackEffect=function(a){
    if(!a)return;const t=Math.max(0,a.life/a.max),fade=Math.min(1,t*1.8),col=a.color||palette().accent;
    if(a.type==='impact')return legacyEffect(a);
    ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
    if(a.type==='slash'){
      const grow=1-t,r=a.r*(.74+grow*.18);ctx.globalAlpha=fade*.22;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.arc(a.x,a.y,r,a.angle-.66,a.angle+.66);ctx.closePath();ctx.fill();ctx.globalAlpha=fade;ctx.strokeStyle='#171c16';ctx.lineWidth=7-3*t;ctx.beginPath();ctx.arc(a.x,a.y,r,a.angle-.66,a.angle+.66);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(a.x,a.y,r-2,a.angle-.62,a.angle+.62);ctx.stroke();ctx.strokeStyle='#eee4c7';ctx.globalAlpha=fade*.55;ctx.lineWidth=1;ctx.beginPath();ctx.arc(a.x,a.y,r-8,a.angle-.5,a.angle+.5);ctx.stroke();
    }else if(a.type==='thrust'){
      const ang=a.angle||Math.atan2(a.y2-a.y,a.x2-a.x),px=-Math.sin(ang),py=Math.cos(ang);ctx.strokeStyle='#171c17';ctx.lineWidth=8*t+3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x2,a.y2);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=3*t+1.4;for(let k=-1;k<=1;k++){ctx.globalAlpha=fade*(k===0?1:.42);ctx.beginPath();ctx.moveTo(a.x+px*k*4,a.y+py*k*4);ctx.lineTo(a.x2+px*k*1.4,a.y2+py*k*1.4);ctx.stroke();}ctx.globalAlpha=fade;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(a.x2+Math.cos(ang)*8,a.y2+Math.sin(ang)*8);ctx.lineTo(a.x2+px*5,a.y2+py*5);ctx.lineTo(a.x2-px*5,a.y2-py*5);ctx.closePath();ctx.fill();
    }else if(a.type==='slam'){
      const r=a.r*(.7+(1-t)*.28);ctx.globalAlpha=fade*.16;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,TAU);ctx.fill();ctx.globalAlpha=fade;ctx.strokeStyle='#1c1b15';ctx.lineWidth=5;ctx.beginPath();ctx.arc(a.x,a.y,r,0,TAU);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y,r-2,0,TAU);ctx.stroke();for(let i=0;i<8;i++){const q=i*Math.PI/4+.18,r1=a.r*.18,r2=a.r*(.56+(i%3)*.1);ctx.beginPath();ctx.moveTo(a.x+Math.cos(q)*r1,a.y+Math.sin(q)*r1);ctx.lineTo(a.x+Math.cos(q+.07)*r2,a.y+Math.sin(q+.07)*r2);ctx.stroke();}
    }else if(a.type==='skillRing'){
      const r=a.r*(.55+(1-t)*.42);ctx.lineWidth=4;ctx.beginPath();ctx.arc(a.x,a.y,r,0,TAU);ctx.stroke();ctx.globalAlpha=fade*.28;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,TAU);ctx.fill();ctx.globalAlpha=fade;for(let i=0;i<10;i++){const q=i*TAU/10+elapsed*.7,rr=r-5;ctx.beginPath();ctx.moveTo(a.x+Math.cos(q)*rr,a.y+Math.sin(q)*rr);ctx.quadraticCurveTo(a.x+Math.cos(q-.14)*(rr+13),a.y+Math.sin(q-.14)*(rr+13),a.x+Math.cos(q)*(rr+20),a.y+Math.sin(q)*(rr+20));ctx.stroke();}
    }else if(a.type==='chain'){
      ctx.lineWidth=5;ctx.globalAlpha=fade*.25;ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=fade;ctx.lineWidth=2;for(let i=1;i<a.points.length;i++){const p=a.points[i-1],q=a.points[i],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),nx=-dy/(len||1),ny=dx/(len||1),steps=Math.max(2,Math.min(7,Math.floor(len/35)));ctx.beginPath();ctx.moveTo(p.x,p.y);for(let k=1;k<steps;k++){const z=k/steps,off=(k%2?1:-1)*5;ctx.lineTo(p.x+dx*z+nx*off,p.y+dy*z+ny*off);}ctx.lineTo(q.x,q.y);ctx.stroke();}
    }else if(a.type==='frost'){
      const r=a.r*(.72+(1-t)*.25);ctx.lineWidth=2.2;for(let i=0;i<8;i++){const q=i*Math.PI/4,x=a.x+Math.cos(q)*r,y=a.y+Math.sin(q)*r;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.stroke();const bx=a.x+Math.cos(q)*r*.62,by=a.y+Math.sin(q)*r*.62;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(q+.7)*11,by+Math.sin(q+.7)*11);ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(q-.7)*11,by+Math.sin(q-.7)*11);ctx.stroke();}ctx.globalAlpha=fade*.28;ctx.beginPath();ctx.arc(a.x,a.y,r,0,TAU);ctx.stroke();
    }else if(a.type==='meteor'){
      const r=a.r*(.65+(1-t)*.3);ctx.globalAlpha=fade*.22;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,TAU);ctx.fill();ctx.globalAlpha=fade;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(a.x,a.y,r,0,TAU);ctx.stroke();for(let i=-2;i<=2;i++){const ox=i*a.r*.18;ctx.lineWidth=i===0?4:2;ctx.beginPath();ctx.moveTo(a.x+ox-a.r*.42,a.y-a.r*(1.05+Math.abs(i)*.12));ctx.lineTo(a.x+ox,a.y-a.r*.12);ctx.stroke();}
    }else if(a.type==='ward'){
      const r=a.r+16*(1-t);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(a.x,a.y,r,0,TAU);ctx.stroke();ctx.globalAlpha=fade*.55;for(let i=0;i<8;i++){const q=i*Math.PI/4;ctx.beginPath();ctx.arc(a.x+Math.cos(q)*r,a.y+Math.sin(q)*r,4,q-.55,q+.55);ctx.stroke();}
    }else if(a.type==='bossTelegraph'){
      ctx.strokeStyle=palette().seal;ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(a.angle)*a.r,a.y+Math.sin(a.angle)*a.r);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=fade*.18;ctx.beginPath();ctx.arc(a.x,a.y,28+12*(1-t),0,TAU);ctx.fill();
    }else{ctx.restore();return legacyEffect(a);}
    ctx.restore();
  };

  drawBullet=function(b){
    const col=b.color||(b.crit?'#d6b35e':'#d7dad0'),trail=b.trail||[];ctx.save();ctx.strokeStyle=col;ctx.globalAlpha=.14;ctx.lineWidth=Math.max(1,b.r*.32);ctx.beginPath();
    const start=Math.max(0,trail.length-3);for(let i=start;i<trail.length;i++){const p=trail[i];i===start?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.translate(b.x,b.y);const a=Math.atan2(b.vy,b.vx);ctx.rotate(a);
    if(b.shape==='arrow'){ctx.strokeStyle='#e0d9c4';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(8,0);ctx.stroke();ctx.fillStyle='#d7d5cb';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(5,-3);ctx.lineTo(5,3);ctx.closePath();ctx.fill();}
    else if(b.shape==='dagger'||b.shape==='soulblade'){ctx.fillStyle='#e0dfd4';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-4,-2.7);ctx.lineTo(-1,0);ctx.lineTo(-4,2.7);ctx.closePath();ctx.fill();}
    else if(b.shape==='axe'){ctx.rotate(elapsed*8);ctx.strokeStyle='#79583b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();ctx.fillStyle='#d0d2ca';ctx.beginPath();ctx.moveTo(1,-6);ctx.quadraticCurveTo(9,-5,8,3);ctx.lineTo(1,4);ctx.closePath();ctx.fill();}
    else if(b.shape==='arcane'||b.shape==='rune'||b.shape==='orb'){ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,Math.max(3,b.r*.82),0,TAU);ctx.stroke();ctx.fillStyle=col;ctx.globalAlpha=.52;ctx.beginPath();ctx.arc(0,0,Math.max(1.2,b.r*.3),0,TAU);ctx.fill();}
    else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,Math.max(1.6,b.r*.75),0,TAU);ctx.fill();}
    ctx.restore();
  };

  drawEnemyBullet=function(b){
    ctx.save();const col=b.color||palette().seal,trail=b.trail||[];ctx.strokeStyle=col;ctx.globalAlpha=.12;ctx.lineWidth=1.2;ctx.beginPath();const start=Math.max(0,trail.length-2);for(let i=start;i<trail.length;i++){const p=trail[i];i===start?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy||0,b.vx||0));ctx.fillStyle=col;const r=Math.max(5,b.r);ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(-r*.85,-r*.32);ctx.lineTo(-r*.42,0);ctx.lineTo(-r*.85,r*.32);ctx.closePath();ctx.fill();ctx.restore();
  };

  drawChest=function(c){
    if(c.broken||!inView(c.x,c.y,45))return;const L=palette(),tier=c.tier||0,r=c.r;ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='rgba(9,12,9,.27)';ctx.beginPath();ctx.ellipse(0,r*.68,r*.95,r*.24,0,0,TAU);ctx.fill();ctx.fillStyle=tier>=2?'#5f4028':'#463a2d';ctx.strokeStyle=tier>=2?L.accent:'#a58b5d';ctx.lineWidth=1.6;ctx.beginPath();pathRoundRect(ctx,-r,-r*.62,r*2,r*1.25,3);ctx.fill();ctx.stroke();ctx.fillStyle=tier>=2?L.accent:'#a58b5d';ctx.fillRect(-2,-r*.62,4,r*1.25);ctx.fillRect(-r,-2,r*2,4);ctx.save();ctx.rotate(-.07);ctx.fillStyle=L.paper;ctx.fillRect(-5,-r*.58,10,r*.68);ctx.fillStyle=L.seal;ctx.font=`800 ${Math.max(7,r*.43)}px serif`;ctx.textAlign='center';ctx.fillText(tier>=2?'賞':'封',0,-r*.14);ctx.restore();const w=r*1.9;ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(-w/2,r+4,w,3);ctx.fillStyle=tier>=2?L.accent:'#b6965d';ctx.fillRect(-w/2,r+4,w*Math.max(0,c.hp/c.maxHp),3);ctx.restore();
  };

  drawPotion=function(p){
    if(!inView(p.x,p.y,30))return;const L=palette();ctx.save();ctx.translate(p.x,p.y+Math.sin(elapsed*5+p.phase)*1.2);ctx.fillStyle=L.paper;ctx.beginPath();ctx.ellipse(0,1,5,7,0,0,TAU);ctx.fill();ctx.fillStyle='#84613f';ctx.fillRect(-2.7,-7,5.4,3);ctx.strokeStyle=L.accent;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,1,7.2,0,TAU);ctx.stroke();ctx.restore();
  };

  // Keep companions in the same larger, readable silhouette language.
  v440DrawCompanion=function(){
    const c=v440Companion;if(!c)return;const cfg={swordsman:['#4e6158','#c0ad72'],assassin:['#34433d','#a17782'],lancer:['#625946','#c09a6c'],brawler:['#69483b','#b87a61'],healer:['#506a52','#a2c18a']}[c.id]||['#50594f','#b2a17b'];
    ctx.save();ctx.translate(c.x,c.y+Math.sin(elapsed*6+c.phase)*.45);ctx.scale(.82,.82);ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(0,13,10,3,0,0,TAU);ctx.fill();drawRobe(cfg[0],cfg[1],1,false);ctx.fillStyle='#c79772';ctx.beginPath();ctx.arc(0,-14,4.5,0,TAU);ctx.fill();ctx.fillStyle='#17140f';ctx.beginPath();ctx.arc(0,-16,4.7,Math.PI,TAU);ctx.fill();ctx.fillRect(-1.2,-20,2.4,4);
    ctx.strokeStyle=cfg[1];ctx.fillStyle=cfg[1];ctx.lineWidth=2;if(c.id==='swordsman'){ctx.beginPath();ctx.moveTo(5,-1);ctx.lineTo(19,5);ctx.stroke();}else if(c.id==='assassin'){ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-14,7);ctx.moveTo(5,2);ctx.lineTo(14,7);ctx.stroke();}else if(c.id==='lancer'){ctx.strokeStyle='#825e3e';ctx.beginPath();ctx.moveTo(-7,4);ctx.lineTo(24,-4);ctx.stroke();}else if(c.id==='brawler'){ctx.beginPath();ctx.arc(-8,5,3,0,TAU);ctx.arc(8,5,3,0,TAU);ctx.fill();}else{ctx.fillStyle='#b8a66a';ctx.beginPath();ctx.ellipse(10,3,4,6,0,0,TAU);ctx.fill();}ctx.restore();
  };
})();
