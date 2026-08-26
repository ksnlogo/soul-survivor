(() => {
  'use strict';
  window.MurimGraphicsVersion='4.6.0';

  const looks={
    forest:{ink:'#273c32',mid:'#4f6b55',accent:'#8bad83',paper:'#b4b393',seal:'#a54d3f'},
    frost:{ink:'#29353a',mid:'#53666a',accent:'#9eb8b8',paper:'#c3c2b1',seal:'#7f4d49'},
    ember:{ink:'#432f27',mid:'#75503c',accent:'#ad7950',paper:'#bda783',seal:'#aa4937'},
    crypt:{ink:'#282824',mid:'#535044',accent:'#8d856b',paper:'#aaa38b',seal:'#82443d'}
  };
  const look=()=>looks[(typeof currentMap!=='undefined'&&currentMap&&currentMap.id)||'forest']||looks.forest;
  const inView=(x,y,pad=80)=>typeof camera==='undefined'||!camera||x>=camera.x-pad&&x<=camera.x+W+pad&&y>=camera.y-pad&&y<=camera.y+H+pad;

  function inkLine(x1,y1,x2,y2,color,width=1,alpha=.22){
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
  }
  function drawRibbon(x,y,ang,len,color,alpha=.55){
    const bx=x-Math.cos(ang)*7,by=y-Math.sin(ang)*7,px=-Math.sin(ang),py=Math.cos(ang);
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(bx+px*2.2,by+py*2.2);ctx.quadraticCurveTo(bx-Math.cos(ang)*len*.45+px*4,by-Math.sin(ang)*len*.45+py*4,bx-Math.cos(ang)*len,by-Math.sin(ang)*len);ctx.quadraticCurveTo(bx-Math.cos(ang)*len*.48-px*2,by-Math.sin(ang)*len*.48-py*2,bx-px*2.2,by-py*2.2);ctx.closePath();ctx.fill();ctx.restore();
  }

  if(typeof drawBackground==='function'){
    const base=drawBackground;
    drawBackground=function(){
      base();
      const L=look(),mx=(typeof camera!=='undefined'&&camera?camera.x:0),my=(typeof camera!=='undefined'&&camera?camera.y:0);
      ctx.save();
      // Low-cost ink silhouettes: fixed geometry, no per-frame gradients or random allocations.
      ctx.globalAlpha=.055;ctx.fillStyle=L.ink;
      for(let layer=0;layer<2;layer++){
        const step=150+layer*58,off=-((mx*(.018+layer*.012))%step)-step;
        ctx.beginPath();ctx.moveTo(-step,H);
        for(let x=off;x<W+step;x+=step){const n=(Math.sin((x+mx*.02)*.017+layer*1.8)+1)*.5;ctx.lineTo(x,H*(.60-layer*.08)-n*(26+layer*13));ctx.lineTo(x+step*.48,H*(.50-layer*.05)-n*(38+layer*10));}
        ctx.lineTo(W+step,H);ctx.closePath();ctx.fill();
      }
      // Brush-edge vegetation / cliff marks identify each biome without texture assets.
      ctx.strokeStyle=L.accent;ctx.lineCap='round';ctx.globalAlpha=.11;
      const count=typeof isIos!=='undefined'&&isIos?7:10;
      for(let i=0;i<count;i++){
        const x=((i*137-mx*.07)%(W+180)+W+180)%(W+180)-90;
        const y=H-18-(i%3)*8;
        if(currentMap&&currentMap.id==='frost'){
          ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-25);ctx.moveTo(x+3,y-13);ctx.lineTo(x-8,y-19);ctx.moveTo(x+4,y-18);ctx.lineTo(x+14,y-25);ctx.stroke();
        }else if(currentMap&&currentMap.id==='ember'){
          ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x,y-22);ctx.lineTo(x+7,y-5);ctx.lineTo(x+18,y-28);ctx.stroke();
        }else if(currentMap&&currentMap.id==='crypt'){
          ctx.lineWidth=2;ctx.strokeRect(x,y-25,10,25);ctx.beginPath();ctx.moveTo(x-3,y-25);ctx.lineTo(x+5,y-34);ctx.lineTo(x+13,y-25);ctx.stroke();
        }else{
          ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y-34);ctx.moveTo(x+1,y-14);ctx.lineTo(x-10,y-21);ctx.moveTo(x+2,y-23);ctx.lineTo(x+13,y-29);ctx.stroke();
        }
      }
      // Sparse cinnabar seal marks create a painted-scroll identity.
      ctx.globalAlpha=.075;ctx.strokeStyle=L.seal;ctx.lineWidth=1;
      for(let i=0;i<3;i++){const x=28+i*(W-56)/2,y=H*.18+(i%2)*18;ctx.strokeRect(x-5,y-5,10,10);}
      ctx.restore();
    };
  }

  if(typeof drawPlayer==='function'){
    const base=drawPlayer;
    drawPlayer=function(){
      if(typeof player==='undefined'||!player)return base();
      const a=player.facing||0,L=look();
      // Cloth ribbon is drawn behind the figure, giving motion without particles.
      drawRibbon(player.x,player.y+4,a,14+Math.min(6,Math.hypot((typeof input!=='undefined'&&input?input.x:0)||0,(typeof input!=='undefined'&&input?input.y:0)||0)*6),L.accent,.38);
      base();
      // Small sect-jade ornament and ink outline improve readability at mobile scale.
      ctx.save();ctx.translate(player.x,player.y);ctx.strokeStyle='rgba(222,214,188,.58)';ctx.lineWidth=.75;ctx.beginPath();ctx.arc(0,-3,9.5,0,Math.PI*2);ctx.stroke();ctx.fillStyle=L.accent;ctx.globalAlpha=.72;ctx.beginPath();ctx.arc(-6,6,1.8,0,Math.PI*2);ctx.fill();ctx.restore();
    };
  }

  if(typeof drawEnemy==='function'){
    const base=drawEnemy;
    drawEnemy=function(e){
      base(e);if(!e||!inView(e.x,e.y,55))return;
      const L=look();ctx.save();ctx.translate(e.x,e.y);
      // Role silhouettes: readable without labels or extra particles.
      if(e.type==='fast'){
        ctx.strokeStyle='rgba(139,173,143,.58)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(-12,-15);ctx.moveTo(5,-8);ctx.lineTo(12,-15);ctx.stroke();
      }else if(e.type==='tank'){
        ctx.fillStyle='rgba(164,149,111,.42)';ctx.fillRect(-11,-8,4,9);ctx.fillRect(7,-8,4,9);inkLine(e.x-8,e.y-4,e.x+8,e.y-4,L.paper,1.1,.32);
      }else if(e.type==='ranged'){
        ctx.strokeStyle='rgba(194,178,137,.48)';ctx.lineWidth=1;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-9+k*2,-4);ctx.lineTo(-13+k*2,-15);ctx.stroke();}
      }else if(e.type==='charger'){
        ctx.fillStyle='rgba(165,73,58,.5)';ctx.beginPath();ctx.moveTo(8,-7);ctx.lineTo(17,-11);ctx.lineTo(12,-3);ctx.closePath();ctx.fill();
      }else if(e.type==='elite'||e.type==='midboss'||e.type==='boss'){
        ctx.globalAlpha=e.type==='boss'?.42:.28;ctx.strokeStyle=e.type==='boss'?'#b85c4e':'#c1a463';ctx.lineWidth=e.type==='boss'?1.7:1.1;ctx.beginPath();ctx.arc(0,1,(e.r||13)+5,0,Math.PI*2);ctx.stroke();
        if(e.type==='boss'){ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3,r=(e.r||18)+9;ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));}ctx.stroke();}
      }
      ctx.restore();
    };
  }

  if(typeof drawAttackEffect==='function'){
    const base=drawAttackEffect;
    drawAttackEffect=function(a){
      base(a);if(!a||a.type==='impact')return;
      const t=Math.max(0,Math.min(1,(a.life||0)/(a.max||a.life||1))),col=a.color||look().accent;
      ctx.save();ctx.globalAlpha=.16+.42*t;ctx.strokeStyle=col;ctx.lineCap='round';
      if(a.type==='slash'){
        const r=a.r||60,ang=a.angle||0;ctx.lineWidth=1.3+1.4*t;ctx.beginPath();ctx.arc(a.x,a.y,r*.72,ang-.58,ang+.58);ctx.stroke();ctx.globalAlpha*=.52;ctx.lineWidth=.7;ctx.beginPath();ctx.arc(a.x,a.y,r*.58,ang-.46,ang+.46);ctx.stroke();
      }else if(a.type==='slam'){
        const r=a.r||45;ctx.lineWidth=1.15;for(let k=0;k<7;k++){const q=k*Math.PI*2/7+.15,r1=r*.35,r2=r*(.64+.18*((k%3)/2));ctx.beginPath();ctx.moveTo(a.x+Math.cos(q)*r1,a.y+Math.sin(q)*r1);ctx.lineTo(a.x+Math.cos(q+.08)*r2,a.y+Math.sin(q+.08)*r2);ctx.stroke();}
      }else if(a.type==='thrust'&&Number.isFinite(a.x2)&&Number.isFinite(a.y2)){
        const ang=a.angle||Math.atan2(a.y2-a.y,a.x2-a.x),px=-Math.sin(ang),py=Math.cos(ang);ctx.lineWidth=1;for(let k=-1;k<=1;k+=2){ctx.beginPath();ctx.moveTo(a.x+px*k*3,a.y+py*k*3);ctx.lineTo(a.x2+px*k*1.2,a.y2+py*k*1.2);ctx.stroke();}
      }
      ctx.restore();
    };
  }

  if(typeof drawChest==='function'){
    const base=drawChest;
    drawChest=function(c){
      base(c);if(!c||c.broken||!inView(c.x,c.y,45))return;
      const L=look();ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=.28;ctx.strokeStyle=L.accent;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,1,(c.r||12)+4,0,Math.PI*2);ctx.stroke();ctx.restore();
    };
  }
})();
