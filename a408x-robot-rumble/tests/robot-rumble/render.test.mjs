import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { Game, BOTS, ARENAS } from '../../dist/games/robot-rumble/engine.js';
import { render, avatar } from '../../dist/games/robot-rumble/render.js';
const require=createRequire(import.meta.url);
const {createCanvas}=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas') : require('@napi-rs/canvas');
const digest=c=>createHash('sha256').update(c.toBuffer('image/png')).digest('hex');
function scene(options={}){return{c:createCanvas(960,600),g:new Game({mode:'local',...options})};}
test('all four robot portraits render as distinct visible artwork',()=>{
  const pictures=BOTS.map(b=>{const c=createCanvas(88,117);avatar(c,b.id);assert.ok(c.toBuffer('image/png').length>600);return digest(c);});
  assert.equal(new Set(pictures).size,4);
});
test('every arena renders movement, guarding, punch, kick, special, hurt and particles',()=>{
  for(const arena of ARENAS)for(const bot of BOTS){
    const {c,g}=scene({playerId:bot.id,arenaId:arena.id});g.phase='fight';g.fighters[0].x=320;g.fighters[1].x=415;
    render(c,g);
    for(const move of ['punch','kick','zap']){g.fighters[0].attack=null;g.fighters[0].cooldown=0;g.fighters[0].hurt=0;g.fighters[0].energy=100;g.attack(g.fighters[0],move);g.step(.04,{},{block:true});g.step(.04,{},{block:true});render(c,g);render(c,g,{reducedMotion:true});}
    assert.ok(c.toBuffer('image/png').length>5000);
  }
});
test('calm effects freeze decorative idle motion at different animation times',()=>{
  const {c,g}=scene();g.clock=1;render(c,g,{reducedMotion:true});const first=digest(c);
  g.clock=8;render(c,g,{reducedMotion:true});assert.equal(digest(c),first);
});
test('calm effects still show meaningful attack and blocking states',()=>{
  const {c,g}=scene();g.phase='fight';render(c,g,{reducedMotion:true});const idle=digest(c);
  g.attack(g.fighters[0],'kick');g.fighters[0].attack.elapsed=.2;g.fighters[1].guarding=true;
  render(c,g,{reducedMotion:true});assert.notEqual(digest(c),idle);
});
test('both robots are visible at opposite arena walls in the phone backing canvas',()=>{
  const {c,g}=scene();g.fighters[0].x=48;g.fighters[1].x=912;render(c,g,{reducedMotion:true});
  const left=c.getContext('2d').getImageData(20,290,75,180).data;
  const right=c.getContext('2d').getImageData(867,290,75,180).data;
  const has=(data,color)=>{const rgb=color.match(/\w\w/g).map(n=>parseInt(n,16));for(let i=0;i<data.length;i+=4)if(rgb.every((v,j)=>data[i+j]===v))return true;return false;};
  assert.ok(has(left,g.fighters[0].spec.color.slice(1)));assert.ok(has(right,g.fighters[1].spec.color.slice(1)));
});
test('special projectiles render with each robot’s own visual signature',()=>{
  for(const b of BOTS){const {c,g}=scene({playerId:b.id});render(c,g);const before=digest(c);g.projectiles=[{owner:0,x:470,y:80,vx:b.special.speed}];render(c,g);assert.notEqual(digest(c),before);}
});
