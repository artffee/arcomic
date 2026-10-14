import { ARENAS, BOTS, WORLD, clamp } from './engine.js';
const INK = '#192340';
const HEART = ['01100110', '11111111', '11111111', '01111110', '00111100', '00011000'];
function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function panel(c, color, x, y, w, h, p = 4) {
  rect(c, INK, x+p, y, w-p*2, h); rect(c, INK, x, y+p, w, h-p*2); rect(c, color, x+p, y+p, w-p*2, h-p*2);
}
function circle(c, color, cx, cy, radius, grid = 4) {
  for (let y = -radius; y <= radius; y += grid) for (let x = -radius; x <= radius; x += grid)
    if ((x+grid/2)**2 + (y+grid/2)**2 <= radius**2) rect(c, color, cx+x, cy+y, grid, grid);
}
function heart(c, x, y, color, scale = 3) {
  HEART.forEach((row, j) => [...row].forEach((cell, i) => { if (cell === '1') rect(c,color,x+i*scale,y+j*scale,scale,scale); }));
}
function eye(c, x, y, r, blink = false) {
  if (blink) { rect(c,INK,x-r,y-2,r*2,4); return; }
  circle(c,INK,x,y,r+4); circle(c,'#f5fcff',x,y,r);
  circle(c,INK,x+4,y+1,r*.58); rect(c,'#fff',x+4,y-5,4,4);
}
function spring(c, x, y, color, horizontal = false, length = 24) {
  for (let i=0;i<length;i+=8) { panel(c,color,x+(horizontal?i:0),y+(horizontal?0:i),horizontal?12:13,horizontal?13:12,3); }
}

export function drawRobot(c, f, x, floor, clock, scale = 1, reducedMotion = false) {
  const s = f.spec, walking = Math.abs(f.vx || 0) > 35;
  const sway = reducedMotion ? 0 : walking ? Math.sin(clock*15)*6 : Math.sin(clock*3+f.index)*2;
  const blink = !reducedMotion && (clock+f.index*1.7)%5.7 > 5.5;
  const move = f.attack, progress = move ? clamp((move.elapsed-move.windup+.07)/.16,0,1) : 0;
  const extend = move && move.type==='punch' ? Math.sin(clamp(move.elapsed / move.duration,0,1)*Math.PI)*62 : move?.type==='zap' ? 40 : 0;
  c.save(); c.translate(Math.round(x),Math.round(floor)); c.scale(scale*(f.face || 1),scale);
  if (f.hurt > 0 && !reducedMotion) c.rotate(-.08);
  if (f.flash > 0) c.globalAlpha = reducedMotion ? .8 : Math.floor(clock*60)%2 ? .6 : 1;
  const backStep = walking ? Math.sin(clock*15)*13 : 0;
  spring(c,-21+backStep,-46,s.dark); spring(c,7-backStep,-46,s.color);
  panel(c,s.dark,-31+backStep,-17,30,17); rect(c,s.light,-23+backStep,-13,15,4);
  if (move?.type==='kick') {
    const kick = Math.sin(clamp(move.elapsed/move.duration,0,1)*Math.PI)*66;
    spring(c,12,-58,s.accent,true,kick+10); panel(c,s.color,20+kick,-62,30,24); rect(c,s.light,26+kick,-56,13,4);
  } else { panel(c,s.color,4-backStep,-17,32,17); rect(c,s.light,12-backStep,-13,15,4); }
  c.translate(0,sway);
  spring(c,-49,-97,s.dark); panel(c,s.accent,-54,-74,21,24);
  panel(c,s.color,-27,-109,57,63); rect(c,s.light,-19,-101,9,37); rect(c,s.dark,-19,-59,39,8);
  panel(c,'#243455',-10,-53,23,9,2); spring(c,-8,-123,s.dark,false,16);
  heart(c,-11,-91,'#ff587e',3);
  rect(c,s.accent,18,-102,5,5); rect(c,s.accent,18,-94,5,5);
  if (f.guarding) {
    spring(c,28,-111,s.color,true,12); panel(c,s.accent,43,-122,23,34);
    rect(c,'#d3fbff',63,-137,7,67); rect(c,'#d3fbff',55,-141,8,8); rect(c,'#d3fbff',55,-76,8,8);
  } else {
    spring(c,27,-97,s.dark,true,15+extend); panel(c,s.accent,43+extend,-96,23,25);
    rect(c,s.light,48+extend,-91,9,4);
  }
  if (s.head==='round') {
    circle(c,INK,0,-147,37); circle(c,s.color,0,-147,32); eye(c,1,-149,19,blink);
    rect(c,INK,-9,-125,21,4); rect(c,'#fff',2,-125,4,4);
    spring(c,-19,-194,s.accent,false,17); panel(c,s.accent,-23,-204,16,14);
    panel(c,s.accent,23,-180,18,13); rect(c,s.light,-25,-165,5,6);
  } else if (s.head==='helmet') {
    panel(c,s.color,-36,-178,75,55); panel(c,s.dark,-43,-164,12,30); panel(c,s.dark,34,-164,12,30);
    panel(c,INK,-27,-161,57,23); rect(c,s.light,-19,-154,15,8); rect(c,s.light,9,-154,15,8);
    rect(c,s.light,-20,-172,35,4); rect(c,INK,-11,-131,27,4);
    rect(c,s.accent,-5,-192,13,15); rect(c,s.light,-1,-194,5,9);
  } else if (s.head==='dome') {
    panel(c,s.color,-32,-173,69,49); panel(c,s.color,-25,-181,55,17);
    eye(c,-13,-154,13,blink); eye(c,17,-154,13,blink); rect(c,INK,-7,-130,18,4);
    spring(c,-27,-196,s.accent,false,17); panel(c,s.accent,-31,-204,16,15);
    spring(c,21,-195,s.dark,false,18); panel(c,s.accent,18,-204,17,15);
  } else {
    panel(c,s.color,-34,-180,74,58); panel(c,s.accent,-42,-167,12,28); panel(c,s.accent,37,-167,12,28);
    rect(c,s.dark,8,-131,23,5); eye(c,-12,-156,17,blink); eye(c,19,-155,12,blink);
    rect(c,s.light,-25,-174,20,5); rect(c,INK,2,-198,5,18); panel(c,s.accent,-4,-207,18,14);
    rect(c,INK,-6,-130,20,4); rect(c,'#fff',-2,-130,5,4);
  }
  if (move?.type==='zap' && progress > .2) { circle(c,s.light,73,-83,12); circle(c,'#fff',73,-83,6); }
  c.restore();
}

function cloud(c,x,y,size=1,color='#f3fcff') {
  c.save(); c.translate(Math.round(x),Math.round(y)); c.scale(size,size);
  rect(c,color,0,16,96,16); rect(c,color,16,8,64,16); rect(c,color,32,0,32,24); rect(c,color,-8,24,112,8);
  rect(c,'#ffffff80',16,32,72,8); c.restore();
}
function palm(c,x,y,color,scale=1) {
  rect(c,color,x,y-88*scale,10*scale,88*scale);
  for(let i=0;i<5;i++) { rect(c,color,x-45*scale+i*8*scale,y-87*scale-i*4*scale,19*scale,7*scale); rect(c,color,x+8*scale+i*8*scale,y-104*scale+i*4*scale,19*scale,7*scale); }
}
function backdrop(c,arena,width,clock,camera) {
  const sky=c.createLinearGradient(0,0,0,500); sky.addColorStop(0,arena.sky); sky.addColorStop(1,arena.low); c.fillStyle=sky;c.fillRect(0,0,width,600);
  if(arena.id==='moon') {
    for(let i=0;i<55;i++) { const x=(i*173+37)%width,y=(i*89+19)%310;rect(c,i%3?'#d6c5ff':'#92fff0',x,y,i%7?3:6,i%7?3:6); }
    circle(c,'#b4c4e9',width*.7,118,63,8);circle(c,'#8f9fc5',width*.7-15,109,18,6);circle(c,'#8f9fc5',width*.7+18,140,13,6);
  } else {
    if(arena.id==='miami') { circle(c,'#ffd061',width*.72,173,65,6); for(let i=0;i<4;i++) rect(c,arena.sky,width*.72-72,180+i*14,144,5); }
    cloud(c,70+(clock*3)%60,71,1.15,arena.id==='miami'?'#ffe5df':'#f0fcff');cloud(c,width-220,104,.8,arena.id==='miami'?'#e4caf4':'#f0fcff');cloud(c,width*.4,196,.55,'#f0fcff85');
  }
  c.save();c.translate(-camera*.22,0);
  if(arena.id==='miami') {
    for(let i=0;i<16;i++){const h=57+(i*47)%110;rect(c,'#7d6dbd',i*83,396-h,69,h);rect(c,'#9a8acc',i*83+8,394-h,52,8);for(let j=0;j<3;j++)rect(c,'#ffdb76',i*83+14+j*15,420-h,7,11);}
    palm(c,100,418,'#494383',1.5);palm(c,819,436,'#494383',1.3);
  } else if(arena.id==='jungle') {
    for(let i=0;i<10;i++){rect(c,'#479f86',i*128,326+(i%3)*22,18,110);circle(c,'#58b99d',i*128+8,317+(i%3)*22,59,10);}
    for(let i=0;i<13;i++)rect(c,'#76cc83',i*89,398+(i%4)*9,68,45);
  } else {
    for(let i=0;i<9;i++){rect(c,'#534c88',i*131,390-(i%3)*26,90,60+(i%3)*26);rect(c,'#7765a4',i*131+14,385-(i%3)*26,55,12);}
    rect(c,'#899bc7',137,298,12,132);rect(c,'#899bc7',104,294,78,12);panel(c,'#68dddb',134,281,19,24);
  }
  c.restore();
  rect(c,arena.id==='jungle'?'#348c68':'#46385f',0,437,width,49);
  rect(c,arena.id==='moon'?'#b9cce6':'#ea83b9',0,460,width,5);
}
function ground(c,arena,camera) {
  const floor=WORLD.floor;rect(c,arena.ground,0,floor,WORLD.width,115);
  for(let row=0;row<3;row++) for(let i=-1;i<25;i++) {
    const x=i*48+(row%2?24:0);rect(c,arena.tile,x+3,floor+row*38+13,41,28);rect(c,arena.ground,x+11,floor+row*38+32,10,5);
  }
  rect(c,INK,0,floor-2,WORLD.width,12);rect(c,arena.grass,0,floor-4,WORLD.width,8);
  if(arena.id==='jungle')for(let i=0;i<80;i++)rect(c,i%2?'#9fd94b':'#76bc36',i*13,floor-10-(i%3)*4,7,12+(i%3)*4);
  else for(let i=0;i<60;i++)rect(c,arena.id==='miami'?'#ffd49d':'#b2fff7',i*17,floor-4,8,4);
}

export function render(canvas,game,{reducedMotion=false}={}) {
  const c=canvas.getContext('2d');if(!c)return;
  const width=canvas.width;c.imageSmoothingEnabled=false;
  const camera=clamp((game.fighters[0].x+game.fighters[1].x)/2-width/2,0,WORLD.width-width);
  const arena=ARENAS.find(a=>a.id===game.arenaId)||ARENAS[0];
  c.clearRect(0,0,width,600);backdrop(c,arena,width,reducedMotion?0:game.clock,camera);
  c.save();c.translate(-camera,0);
  if(!reducedMotion&&game.shake>0)c.translate(Math.sin(game.clock*125)*game.shake,Math.cos(game.clock*101)*game.shake*.5);
  ground(c,arena,camera);
  for(const f of game.fighters){const w=62+f.y*.11;rect(c,'#14253f44',f.x-w/2,WORLD.floor+2,w,9);}
  for(const f of [...game.fighters].sort((a,b)=>a.y-b.y))drawRobot(c,f,f.x,WORLD.floor-f.y,game.clock,1,reducedMotion);
  for(const p of game.projectiles){const f=game.fighters[p.owner];const y=WORLD.floor-p.y;rect(c,f.spec.dark,p.x-Math.sign(p.vx)*26,y-9,29,18);panel(c,f.spec.light,p.x-14,y-12,28,24);rect(c,'#fff',p.x-7,y-6,10,8);
    if(f.spec.id==='beep')heart(c,p.x-8,y-6,f.spec.accent,2);
    if(f.spec.id==='glitch'){rect(c,f.spec.accent,p.x-20,y-19,16,5);rect(c,f.spec.accent,p.x+7,y+15,17,5);}
    if(f.spec.id==='bolt')panel(c,f.spec.accent,p.x-18,y-16,36,32,5);
    if(f.spec.id==='nova'){circle(c,f.spec.accent,p.x,y,22,4);circle(c,f.spec.light,p.x,y,13,4);rect(c,'#fff',p.x-4,y-4,8,8);}
  }
  if(!reducedMotion)for(const p of game.particles){const color=game.fighters[p.side].spec.accent;c.globalAlpha=clamp(p.life/.28,0,1);rect(c,color,p.x,WORLD.floor-p.y,7,7);}c.globalAlpha=1;
  for(const f of game.fighters)if(f.combo>=2&&f.comboAge<.75){c.font='bold 19px monospace';c.textAlign='center';c.fillStyle='#fff9c9';c.fillText(`${f.combo} HIT!`,f.x,WORLD.floor-f.y-229);}
  c.restore();
  // Bright scan lines are deliberately subtle and don't animate.
  c.fillStyle='#19234008';for(let y=0;y<600;y+=6)c.fillRect(0,y,width,1);
}

export function avatar(canvas,id) {
  const c=canvas.getContext('2d');if(!c)return; c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
  const spec=BOTS.find(b=>b.id===id)||BOTS[0];drawRobot(c,{spec,index:0,face:1,vx:0,attack:null,hurt:0,flash:0},canvas.width/2,canvas.height-3,0,.52);
}
