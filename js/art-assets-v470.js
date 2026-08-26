(() => {
  'use strict';

  const ROOT='assets/art/v470/';
  const sources={
    ground:ROOT+'forest-ground-v470.webp',
    characters:ROOT+'character-atlas-v470.webp',
    objects:ROOT+'forest-objects-v470.webp'
  };
  const images={},ready={ground:false,characters:false,objects:false};
  let groundCanvas=null,groundPattern=null,patternContext=null;

  function load(key){
    const img=new Image();images[key]=img;img.decoding='async';
    img.onload=()=>{ready[key]=true};img.onerror=()=>{ready[key]=false};img.src=sources[key];
  }
  load('ground');load('characters');load('objects');

  function forest(){return currentMap&&currentMap.id==='forest'}
  function visible(x,y,pad=90){return x>=camera.x-pad&&x<=camera.x+W+pad&&y>=camera.y-pad&&y<=camera.y+H+pad}

  function getGroundPattern(target){
    if(!ready.ground||!images.ground.complete)return null;
    if(groundPattern&&patternContext===target)return groundPattern;
    const size=images.ground.naturalWidth||768;groundCanvas=document.createElement('canvas');groundCanvas.width=size;groundCanvas.height=size;
    const g=groundCanvas.getContext('2d',{alpha:false});g.drawImage(images.ground,0,0,size,size);
    g.fillStyle='rgba(17,25,18,.25)';g.fillRect(0,0,size,size);
    groundPattern=target.createPattern(groundCanvas,'repeat');patternContext=target;return groundPattern;
  }

  function atlasCell(img,cols,rows,index){
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    return {sx:(index%cols)*sw,sy:Math.floor(index/cols)*sh,sw,sh};
  }

  function shadow(x,y,rx,ry,alpha=.30){
    ctx.fillStyle=`rgba(9,13,9,${alpha})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  }

  function character(index,x,y,height,flip=false,alpha=1){
    const img=images.characters,c=atlasCell(img,5,1,index),width=height*(c.sw/c.sh);
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;
    ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,-width/2,-height*.78,width,height);ctx.restore();
  }

  function objectSprite(index,x,y,height,flip=false,alpha=1){
    const img=images.objects,c=atlasCell(img,3,2,index),width=height*(c.sw/c.sh);
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;
    ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,-width/2,-height*.78,width,height);ctx.restore();
  }

  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!forest()||!ready.characters||!player)return basePlayer();
    const facing=player.facing||0,flip=Math.cos(facing)<0,hit=player.hitFlash>0;
    shadow(player.x,player.y+15,13,4,.32);
    if(player.shield>0){ctx.strokeStyle='rgba(222,212,180,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y-3,23+Math.sin(elapsed*5),0,Math.PI*2);ctx.stroke();}
    character(0,player.x,player.y,70,flip,hit ? .68 : 1);
  };

  const baseEnemy=drawEnemy;
  const enemyCells={basic:1,fast:2,tank:3,ranged:4};
  drawEnemy=function(e){
    const cell=e&&enemyCells[e.type];
    if(!forest()||!ready.characters||cell===undefined||!visible(e.x,e.y,e.r+60))return baseEnemy(e);
    const scale=e.type==='tank' ? 1.16 : e.type==='fast' ? .96 : 1,height=55*scale*Math.max(.9,e.r/10),flip=player ? player.x<e.x : false;
    shadow(e.x,e.y+e.r*.7,e.r*.75,e.r*.22,.28);character(cell,e.x,e.y,height,flip,e._impactFlash>0 ? .76 : 1);
  };

  const baseObstacle=drawObstacle;
  const obstacleCells={tree:0,rock:1,ruin:2,pillar:5};
  drawObstacle=function(o){
    if(!forest()||!ready.objects||obstacleCells[o.type]===undefined||!visible(o.x,o.y,o.r+70))return baseObstacle(o);
    const cell=obstacleCells[o.type],height=o.type==='tree'?o.r*2.65:o.type==='ruin'?o.r*2.35:o.type==='pillar'?o.r*2.65:o.r*2.25;
    shadow(o.x,o.y+o.r*.58,o.r*.72,o.r*.2,.24);objectSprite(cell,o.x,o.y,height,(o.variant||0)%2===1,.96);
  };

  const baseLandmark=drawLandmark;
  const landmarkCells={tree:0,shrine:2,gate:3};
  drawLandmark=function(l){
    if(!forest()||!ready.objects||landmarkCells[l.kind]===undefined||!visible(l.x,l.y,l.r+95))return baseLandmark(l);
    const cell=landmarkCells[l.kind],height=l.kind==='gate'?l.r*3.25:l.kind==='shrine'?l.r*2.75:l.r*2.8;
    shadow(l.x,l.y+l.r*.55,l.r*.8,l.r*.22,.26);objectSprite(cell,l.x,l.y,height,false,1);
  };

  const baseChest=drawChest;
  drawChest=function(c){
    if(!forest()||!ready.objects||c.broken||!visible(c.x,c.y,55))return baseChest(c);
    const height=c.r*3.7,flash=c.hitFlash>0;shadow(c.x,c.y+c.r*.62,c.r*.92,c.r*.25,.28);objectSprite(4,c.x,c.y,height,false,flash ? .72 : 1);
    const w=c.r*1.95;ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(c.x-w/2,c.y+c.r+4,w,3);ctx.fillStyle=c.tier>=2?'#9fbd91':'#b99a62';ctx.fillRect(c.x-w/2,c.y+c.r+4,w*Math.max(0,c.hp/c.maxHp),3);
  };

  window.MurimArtV470={
    version:'4.7.0',sources,images,ready,getGroundPattern,
    state:()=>({ground:ready.ground,characters:ready.characters,objects:ready.objects})
  };
})();
