(() => {
  'use strict';

  const ROOT='assets/art/';
  const sources={
    characters:ROOT+'v470/character-atlas-v470.webp',
    enemies:ROOT+'v472/enemy-atlas-v472.webp',
    groundForest:ROOT+'v472/forest-ground-v472.webp',
    groundFrost:ROOT+'v472/frost-ground-v472.webp',
    groundEmber:ROOT+'v472/ember-ground-v472.webp',
    groundCrypt:ROOT+'v472/crypt-ground-v472.webp',
    envForest:ROOT+'v471/forest-environment-v471.webp',
    envFrost:ROOT+'v471/frost-environment-v471.webp',
    envEmber:ROOT+'v471/ember-environment-v471.webp',
    envCrypt:ROOT+'v471/crypt-environment-v471.webp'
  };
  const images={},ready=Object.fromEntries(Object.keys(sources).map(key=>[key,false]));
  const groundPatterns=new Map();

  function load(key){
    if(images[key])return;
    const img=new Image();images[key]=img;img.decoding='async';
    img.onload=()=>{ready[key]=true;groundPatterns.delete(key)};
    img.onerror=()=>{ready[key]=false};img.src=sources[key];
  }
  ['characters','enemies','groundForest','envForest'].forEach(load);
  const loadRemaining=()=>['groundFrost','groundEmber','groundCrypt','envFrost','envEmber','envCrypt'].forEach(load);
  if('requestIdleCallback'in window)requestIdleCallback(loadRemaining,{timeout:1000});else setTimeout(loadRemaining,160);

  function stageId(){const id=currentMap&&currentMap.id;return ['forest','frost','ember','crypt'].includes(id)?id:'forest'}
  function cap(id){return id.charAt(0).toUpperCase()+id.slice(1)}
  function groundKey(id){return 'ground'+cap(id)}
  function envKey(id){return 'env'+cap(id)}
  function visible(x,y,pad=90){return x>=camera.x-pad&&x<=camera.x+W+pad&&y>=camera.y-pad&&y<=camera.y+H+pad}

  function atlasCell(img,cols,rows,index){
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    return {sx:(index%cols)*sw,sy:Math.floor(index/cols)*sh,sw,sh};
  }

  function getGroundPattern(target,mapId){
    const id=mapId||stageId(),key=groundKey(id),img=images[key];
    if(!ready[key]||!img||!img.complete)return null;
    const cached=groundPatterns.get(key);if(cached&&cached.context===target)return cached.pattern;
    const size=img.naturalWidth,tile=document.createElement('canvas');tile.width=size*2;tile.height=size*2;
    const g=tile.getContext('2d',{alpha:false});g.imageSmoothingEnabled=false;
    for(let y=0;y<2;y++)for(let x=0;x<2;x++){
      g.save();g.translate(x*size,y*size);g.translate(x?size:0,y?size:0);g.scale(x?-1:1,y?-1:1);
      g.drawImage(img,0,0,size,size);g.restore();
    }
    const tint={forest:'rgba(15,24,17,.08)',frost:'rgba(35,48,55,.07)',ember:'rgba(48,24,14,.08)',crypt:'rgba(12,12,10,.10)'}[id];
    g.fillStyle=tint;g.fillRect(0,0,tile.width,tile.height);
    let seed={forest:4721,frost:4722,ember:4723,crypt:4724}[id];
    const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    for(let i=0;i<10;i++){
      const radius=150+rnd()*220,x=radius+rnd()*(tile.width-radius*2),y=radius+rnd()*(tile.height-radius*2);
      const wash=g.createRadialGradient(x,y,radius*.1,x,y,radius);
      wash.addColorStop(0,i%3?'rgba(12,15,12,.035)':'rgba(225,218,190,.025)');wash.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=wash;g.beginPath();g.ellipse(x,y,radius,radius*(.42+rnd()*.32),rnd()*Math.PI,0,Math.PI*2);g.fill();
    }
    const pattern=target.createPattern(tile,'repeat');groundPatterns.set(key,{context:target,pattern});return pattern;
  }

  function shadow(x,y,rx,ry,alpha=.24){ctx.fillStyle=`rgba(9,11,9,${alpha})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}

  function sprite(img,cols,rows,index,x,y,height,flip=false,alpha=1){
    const c=atlasCell(img,cols,rows,index),width=height*(c.sw/c.sh);
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;
    ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,-width/2,-height*.78,width,height);ctx.restore();
  }

  const basePlayer=drawPlayer;
  drawPlayer=function(){
    if(!ready.characters||!player)return basePlayer();
    const flip=Math.cos(player.facing||0)<0,hit=player.hitFlash>0;shadow(player.x,player.y+15,13,4,.29);
    if(player.shield>0){ctx.strokeStyle='rgba(222,212,180,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y-3,23+Math.sin(elapsed*5),0,Math.PI*2);ctx.stroke()}
    sprite(images.characters,5,1,0,player.x,player.y,70,flip,hit?.68:1);
  };

  const baseEnemy=drawEnemy;
  const regularCells={basic:1,fast:2,tank:3,ranged:4};
  const detailedCells={charger:0,elite:1,midboss:2,boss:3};
  drawEnemy=function(e){
    if(!e||!visible(e.x,e.y,e.r+85))return baseEnemy(e);
    const flip=player?player.x<e.x:false,hit=e._impactFlash>0||e.hit>0;
    if(regularCells[e.type]!==undefined&&ready.characters){
      const scale=e.type==='tank'?1.16:e.type==='fast'?.96:1,height=55*scale*Math.max(.9,e.r/10);
      shadow(e.x,e.y+e.r*.7,e.r*.75,e.r*.22,.25);sprite(images.characters,5,1,regularCells[e.type],e.x,e.y,height,flip,hit?.74:1);return;
    }
    if(detailedCells[e.type]!==undefined&&ready.enemies){
      const height=Math.max(58,e.r*4),cell=detailedCells[e.type];
      shadow(e.x,e.y+e.r*.72,e.r*.82,e.r*.24,e.type==='boss'?.34:.27);
      sprite(images.enemies,2,2,cell,e.x,e.y,height,flip,hit?.72:1);
      if(['elite','midboss','boss'].includes(e.type)){
        const w=e.r*2.15,y=e.y-e.r-13;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(e.x-w/2,y,w,3.5);
        ctx.fillStyle=e.type==='boss'?'#b94b3f':'#c29b57';ctx.fillRect(e.x-w/2,y,w*Math.max(0,e.hp/e.maxHp),3.5);
      }
      return;
    }
    return baseEnemy(e);
  };

  function objectSprite(index,x,y,height,flip=false,alpha=1){sprite(images[envKey(stageId())],3,2,index,x,y,height,flip,alpha)}
  const baseObstacle=drawObstacle,obstacleCells={tree:1,rock:2,ruin:3,pillar:2};
  drawObstacle=function(o){
    const key=envKey(stageId()),cell=obstacleCells[o.type];if(!ready[key]||cell===undefined||!visible(o.x,o.y,o.r+70))return baseObstacle(o);
    const height=o.type==='tree'?o.r*2.65:o.type==='ruin'?o.r*2.35:o.type==='pillar'?o.r*2.4:o.r*2.25;
    shadow(o.x,o.y+o.r*.58,o.r*.72,o.r*.2,.20);objectSprite(cell,o.x,o.y,height,(o.variant||0)%2===1,.98);
  };

  const baseLandmark=drawLandmark,landmarkCells={tree:1,crystal:2,obelisk:2,shrine:3,forge:3,gate:4};
  drawLandmark=function(l){
    const key=envKey(stageId()),cell=landmarkCells[l.kind];if(!ready[key]||cell===undefined||!visible(l.x,l.y,l.r+105))return baseLandmark(l);
    const height=l.kind==='gate'?l.r*3.25:(l.kind==='shrine'||l.kind==='forge')?l.r*2.75:l.kind==='tree'?l.r*2.8:l.r*2.55;
    shadow(l.x,l.y+l.r*.55,l.r*.8,l.r*.22,.22);objectSprite(cell,l.x,l.y,height,false,1);
  };

  const baseChest=drawChest;
  drawChest=function(c){
    const key=envKey(stageId());if(!ready[key]||c.broken||!visible(c.x,c.y,55))return baseChest(c);
    const height=c.r*3.7,flash=c.hitFlash>0;shadow(c.x,c.y+c.r*.62,c.r*.92,c.r*.25,.24);objectSprite(5,c.x,c.y,height,false,flash?.72:1);
    const w=c.r*1.95;ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(c.x-w/2,c.y+c.r+4,w,3);ctx.fillStyle=c.tier>=2?'#cfb66d':currentMap.accent;ctx.fillRect(c.x-w/2,c.y+c.r+4,w*Math.max(0,c.hp/c.maxHp),3);
  };

  window.MurimArtV472={version:'4.7.2',sources,images,ready,getGroundPattern,state:()=>Object.fromEntries(Object.keys(ready).map(key=>[key,ready[key]]))};
})();
