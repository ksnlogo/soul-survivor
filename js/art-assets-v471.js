(() => {
  'use strict';

  const ROOT='assets/art/';
  const sources={
    characters:ROOT+'v470/character-atlas-v470.webp',
    forest:ROOT+'v471/forest-environment-v471.webp',
    frost:ROOT+'v471/frost-environment-v471.webp',
    ember:ROOT+'v471/ember-environment-v471.webp',
    crypt:ROOT+'v471/crypt-environment-v471.webp'
  };
  const images={},ready={characters:false,forest:false,frost:false,ember:false,crypt:false};
  const groundPatterns=new Map();

  function load(key){
    const img=new Image();images[key]=img;img.decoding='async';
    img.onload=()=>{ready[key]=true;groundPatterns.delete(key)};
    img.onerror=()=>{ready[key]=false};img.src=sources[key];
  }
  load('characters');load('forest');
  const loadRemaining=()=>['frost','ember','crypt'].forEach(key=>{if(!images[key])load(key)});
  if('requestIdleCallback'in window)requestIdleCallback(loadRemaining,{timeout:1200});else setTimeout(loadRemaining,180);

  function stageId(){const id=currentMap&&currentMap.id;return sources[id]?id:'forest'}
  function visible(x,y,pad=90){return x>=camera.x-pad&&x<=camera.x+W+pad&&y>=camera.y-pad&&y<=camera.y+H+pad}

  function atlasCell(img,cols,rows,index){
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    return {sx:(index%cols)*sw,sy:Math.floor(index/cols)*sh,sw,sh};
  }

  function getGroundPattern(target,mapId){
    const id=mapId||stageId(),img=images[id];
    if(!ready[id]||!img||!img.complete)return null;
    const cached=groundPatterns.get(id);if(cached&&cached.context===target)return cached.pattern;
    // Upscale once into a broad mirrored tile: phone viewports no longer expose a repeating cell grid.
    const c=atlasCell(img,3,2,0),size=Math.round(c.sw*3),tile=document.createElement('canvas');
    tile.width=size*2;tile.height=size*2;
    const g=tile.getContext('2d',{alpha:false});g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    for(let y=0;y<2;y++)for(let x=0;x<2;x++){
      g.save();g.translate(x*size,y*size);g.translate(x?size:0,y?size:0);g.scale(x?-1:1,y?-1:1);
      g.drawImage(img,c.sx,c.sy,c.sw,c.sh,0,0,size,size);g.restore();
    }
    const tint={forest:'rgba(15,24,17,.08)',frost:'rgba(35,48,55,.07)',ember:'rgba(48,24,14,.08)',crypt:'rgba(12,12,10,.11)'}[id];
    g.fillStyle=tint;g.fillRect(0,0,tile.width,tile.height);
    const pattern=target.createPattern(tile,'repeat');groundPatterns.set(id,{context:target,pattern});return pattern;
  }

  function shadow(x,y,rx,ry,alpha=.24){
    ctx.fillStyle=`rgba(9,11,9,${alpha})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  }

  function character(index,x,y,height,flip=false,alpha=1){
    const img=images.characters,c=atlasCell(img,5,1,index),width=height*(c.sw/c.sh);
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;
    ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,-width/2,-height*.78,width,height);ctx.restore();
  }

  function objectSprite(index,x,y,height,flip=false,alpha=1){
    const img=images[stageId()],c=atlasCell(img,3,2,index),width=height*(c.sw/c.sh);
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;
    ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,-width/2,-height*.78,width,height);ctx.restore();
  }

  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!ready.characters||!player)return basePlayer();
    const facing=player.facing||0,flip=Math.cos(facing)<0,hit=player.hitFlash>0;
    shadow(player.x,player.y+15,13,4,.29);
    if(player.shield>0){ctx.strokeStyle='rgba(222,212,180,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y-3,23+Math.sin(elapsed*5),0,Math.PI*2);ctx.stroke();}
    character(0,player.x,player.y,70,flip,hit?.68:1);
  };

  const baseEnemy=drawEnemy;
  const enemyCells={basic:1,fast:2,tank:3,ranged:4};
  drawEnemy=function(e){
    const cell=e&&enemyCells[e.type];
    if(!ready.characters||cell===undefined||!visible(e.x,e.y,e.r+60))return baseEnemy(e);
    const scale=e.type==='tank'?1.16:e.type==='fast'?.96:1,height=55*scale*Math.max(.9,e.r/10),flip=player?player.x<e.x:false;
    shadow(e.x,e.y+e.r*.7,e.r*.75,e.r*.22,.25);character(cell,e.x,e.y,height,flip,e._impactFlash>0?.76:1);
  };

  const baseObstacle=drawObstacle;
  const obstacleCells={tree:1,rock:2,ruin:3,pillar:2};
  drawObstacle=function(o){
    const id=stageId(),cell=obstacleCells[o.type];
    if(!ready[id]||cell===undefined||!visible(o.x,o.y,o.r+70))return baseObstacle(o);
    const height=o.type==='tree'?o.r*2.65:o.type==='ruin'?o.r*2.35:o.type==='pillar'?o.r*2.4:o.r*2.25;
    shadow(o.x,o.y+o.r*.58,o.r*.72,o.r*.2,.20);objectSprite(cell,o.x,o.y,height,(o.variant||0)%2===1,.98);
  };

  const baseLandmark=drawLandmark;
  const landmarkCells={tree:1,crystal:2,obelisk:2,shrine:3,forge:3,gate:4};
  drawLandmark=function(l){
    const id=stageId(),cell=landmarkCells[l.kind];
    if(!ready[id]||cell===undefined||!visible(l.x,l.y,l.r+105))return baseLandmark(l);
    const height=l.kind==='gate'?l.r*3.25:(l.kind==='shrine'||l.kind==='forge')?l.r*2.75:l.kind==='tree'?l.r*2.8:l.r*2.55;
    shadow(l.x,l.y+l.r*.55,l.r*.8,l.r*.22,.22);objectSprite(cell,l.x,l.y,height,false,1);
  };

  const baseChest=drawChest;
  drawChest=function(c){
    const id=stageId();if(!ready[id]||c.broken||!visible(c.x,c.y,55))return baseChest(c);
    const height=c.r*3.7,flash=c.hitFlash>0;shadow(c.x,c.y+c.r*.62,c.r*.92,c.r*.25,.24);objectSprite(5,c.x,c.y,height,false,flash?.72:1);
    const w=c.r*1.95;ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(c.x-w/2,c.y+c.r+4,w,3);ctx.fillStyle=c.tier>=2?'#cfb66d':currentMap.accent;ctx.fillRect(c.x-w/2,c.y+c.r+4,w*Math.max(0,c.hp/c.maxHp),3);
  };

  window.MurimArtV471={
    version:'4.7.1',sources,images,ready,getGroundPattern,
    state:()=>Object.fromEntries(Object.keys(ready).map(key=>[key,ready[key]]))
  };
})();
