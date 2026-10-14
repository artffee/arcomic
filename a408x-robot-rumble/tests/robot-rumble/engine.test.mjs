import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, InputState, BOTS, ARENAS } from '../../dist/games/robot-rumble/engine.js';
const tick=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*120);i++)g.step(1/120,input);};
const battle=()=>{const g=new Game({seed:408});g.start();g.phase='fight';g.brain.think=9999;g.fighters[0].x=320;g.fighters[1].x=415;return g;};

test('four different original fighters and three arenas are available',()=>{assert.equal(new Set(BOTS.map(b=>b.id)).size,4);assert.equal(new Set(ARENAS.map(a=>a.id)).size,3);});
test('selection starts idle; countdown starts a timed match',()=>{const g=new Game();assert.equal(g.phase,'select');g.start();assert.equal(g.phase,'intro');tick(g,3.1);assert.equal(g.phase,'fight');assert.ok(g.time<60&&g.time>59);assert.notEqual(g.playerId,g.opponentId);});
test('settings fall back safely and cannot change an active fight',()=>{const g=new Game();g.preview('unknown','unknown','unknown');assert.equal(g.playerId,'beep');assert.equal(g.arenaId,'miami');assert.equal(g.difficulty,'normal');g.start();g.preview('bolt','moon','spicy');assert.equal(g.playerId,'beep');});
test('pause freezes all timers and player movement',()=>{const g=battle();g.paused=true;const previous=JSON.stringify(g.fighters);tick(g,2,{right:true,punch:true});assert.equal(JSON.stringify(g.fighters),previous);assert.equal(g.time,60);g.paused=false;tick(g,.1,{right:true});assert.ok(g.fighters[0].x>320);});
test('wall bounds hold during sustained movement',()=>{const g=battle();tick(g,5,{left:true});assert.equal(g.fighters[0].x,48);g.fighters[1].y=300;tick(g,8,{right:true});assert.equal(g.fighters[0].x,912);});
test('fighters cannot overlap when grounded',()=>{const g=battle();g.fighters[1].x=340;g.step(1/60);assert.ok(Math.abs(g.fighters[0].x-g.fighters[1].x)>=58.99);});
test('jumping rises and lands; holding jump does not repeatedly jump',()=>{const g=battle();tick(g,.2,{jump:true});assert.ok(g.fighters[0].y>30);tick(g,2,{jump:true});assert.equal(g.fighters[0].y,0);assert.equal(g.fighters[0].grounded,true);tick(g,.05);tick(g,.1,{jump:true});assert.ok(g.fighters[0].y>0);});
test('a punch connects exactly once during its active window',()=>{const g=battle();assert.equal(g.attack(g.fighters[0],'punch'),true);tick(g,.31);assert.equal(g.fighters[1].health,93);assert.equal(g.drainEvents().filter(e=>e.type==='hit').length,1);});
test('a distant punch misses and has a cooldown',()=>{const g=battle();g.fighters[1].x=600;assert.equal(g.attack(g.fighters[0],'punch'),true);assert.equal(g.attack(g.fighters[0],'kick'),false);tick(g,.31);assert.equal(g.fighters[1].health,100);assert.equal(g.attack(g.fighters[0],'punch'),false);tick(g,.1);assert.equal(g.attack(g.fighters[0],'punch'),true);});
test('kick has longer reach and heavier damage than punch',()=>{const g=battle();g.fighters[1].x=453;g.attack(g.fighters[0],'punch');tick(g,.5);assert.equal(g.fighters[1].health,100);g.attack(g.fighters[0],'kick');tick(g,.35);assert.equal(g.fighters[1].health,89);});
test('a held block reduces damage and consumes shield',()=>{const g=battle();g.brain.input.block=true;g.attack(g.fighters[0],'punch');tick(g,.23);assert.equal(g.fighters[1].health,98);assert.ok(g.fighters[1].guard<85);assert.ok(g.drainEvents().some(e=>e.type==='block'));});
test('blocking the wrong direction does not prevent a hit',()=>{const g=battle(),f=g.fighters[1];f.guarding=true;f.face=1;g.hit(f,g.fighters[0],11);assert.equal(f.health,89);});
test('blocking prevents simultaneous attacks',()=>{const g=battle();g.fighters[0].guarding=true;assert.equal(g.attack(g.fighters[0],'punch'),false);});
test('hurt invulnerability prevents one hit from landing twice',()=>{const g=battle(),f=g.fighters[1];g.hit(f,g.fighters[0],7);g.hit(f,g.fighters[0],7);assert.equal(f.health,93);});
test('zap consumes power and cannot fire without enough',()=>{const g=battle();const f=g.fighters[0];assert.equal(g.attack(f,'zap'),true);assert.equal(f.energy,25);f.attack=null;f.cooldown=0;assert.equal(g.attack(f,'zap'),false);});
test('energy projectile crosses the arena and damages the opponent',()=>{const g=battle();g.fighters[1].x=670;g.attack(g.fighters[0],'zap');tick(g,.9);assert.equal(g.fighters[1].health,86);assert.equal(g.projectiles.length,0);});
test('projectiles expire; power recharges',()=>{const g=battle();g.fighters[1].y=300;g.fighters[1].grounded=true;g.attack(g.fighters[0],'zap');tick(g,2);assert.equal(g.projectiles.length,0);assert.ok(g.fighters[0].energy>35);});
test('timeout awards the healthier robot a round',()=>{const g=battle();g.time=.002;g.fighters[1].health=60;g.step(.01);assert.equal(g.phase,'roundover');assert.equal(g.roundWinner,0);assert.equal(g.wins[0],1);});
test('equal batteries produce a drawn round',()=>{const g=battle();g.time=0;g.finishRound();assert.equal(g.roundWinner,null);assert.deepEqual(g.wins,[0,0]);});
test('two round wins end the match; a rematch starts fresh',()=>{const g=battle();for(let i=0;i<2;i++){g.phase='fight';g.fighters[1].health=0;g.finishRound();g.phaseTime=.001;g.step(.01);}assert.equal(g.phase,'matchover');assert.equal(g.result,'win');g.start();assert.deepEqual(g.wins,[0,0]);assert.equal(g.round,1);assert.equal(g.fighters[0].health,100);assert.equal(g.projectiles.length,0);});
test('three drawn rounds finish cleanly instead of looping forever',()=>{const g=battle();for(let i=0;i<3;i++){g.phase='fight';g.fighters[0].health=100;g.fighters[1].health=100;g.finishRound();g.phaseTime=.001;g.step(.01);}assert.equal(g.phase,'matchover');assert.equal(g.result,'draw');});
test('keyboard aliases and multitouch remain held until every source releases',()=>{const i=new InputState();i.key('left',true,'KeyA');i.key('left',true,'ArrowLeft');i.pointer(2,'left');i.pointer(3,'punch');i.key('left',false,'KeyA');assert.equal(i.read().left,true);i.key('left',false,'ArrowLeft');assert.equal(i.read().left,true);i.release(2);assert.equal(i.read().left,false);assert.equal(i.read().punch,true);i.clear();assert.equal(Object.values(i.read()).some(Boolean),false);});
test('invalid frame deltas cannot introduce NaN or skip a whole match',()=>{const g=battle();g.step(NaN);g.step(-100);assert.equal(g.time,60);g.step(1000);assert.ok(g.time>59.9);for(const f of g.fighters)assert.ok(Number.isFinite(f.x));});
test('different robot stats affect pace and punch damage',()=>{const g=battle();g.fighters[0].spec=BOTS.find(b=>b.id==='bolt');g.attack(g.fighters[0],'punch');tick(g,.23);assert.equal(g.fighters[1].health,92);});
test('seeded full matches stay bounded and reach a result',()=>{for(let seed=1;seed<=24;seed++){const g=new Game({seed,playerId:BOTS[seed%4].id,difficulty:['easy','normal','spicy'][seed%3]});g.start();for(let frame=0;frame<12600&&g.phase!=='matchover';frame++){const f=g.fighters[0],o=g.fighters[1],distance=Math.abs(f.x-o.x);g.step(1/60,{right:o.x>f.x&&distance>84,left:o.x<f.x&&distance>84,punch:distance<115,kick:frame%120<40&&distance<135,zap:frame%200<4,jump:frame%280<5});for(const actor of g.fighters){assert.ok(Number.isFinite(actor.x)&&Number.isFinite(actor.y));assert.ok(actor.health>=0&&actor.health<=100);assert.ok(actor.energy>=0&&actor.energy<=100);assert.ok(actor.guard>=0&&actor.guard<=100);}}assert.equal(g.phase,'matchover',`seed ${seed} did not finish`);assert.ok(['win','loss','draw'].includes(g.result));}});

test('local mode keeps player two selection and never invokes the CPU brain',()=>{
  const g=new Game({mode:'local',playerId:'beep',opponentId:'nova'});g.start();g.phase='fight';
  g.ai=()=>{throw Error('CPU must be off in local mode');};
  const before=g.fighters.map(f=>f.x);g.step(.04,{left:true},{right:true});
  assert.ok(g.fighters[0].x<before[0]);assert.ok(g.fighters[1].x>before[1]);
  assert.equal(g.opponentId,'nova');g.start();assert.equal(g.opponentId,'nova');
});
test('local player two can attack, jump, and block independently',()=>{
  const g=new Game({mode:'local',opponentId:'beep'});g.start();g.phase='fight';
  g.fighters[0].x=320;g.fighters[1].x=415;
  for(let i=0;i<30;i++)g.step(1/120,{block:true},{punch:true});
  assert.equal(g.fighters[0].health,98);assert.equal(g.fighters[1].health,100);
  g.fighters[1].attack=null;g.fighters[1].hurt=0;g.step(.04,{}, {jump:true});
  assert.ok(g.fighters[1].y>0);assert.equal(g.fighters[0].y,0);
});
test('local mirror matches and invalid second-player settings are safe',()=>{
  const g=new Game();g.preview('nova','moon','normal','local','nova');g.start();
  assert.equal(g.fighters[0].spec.id,'nova');assert.equal(g.fighters[1].spec.id,'nova');
  g.phase='select';g.preview('beep','miami','easy','bad','missing');assert.equal(g.mode,'cpu');
  g.preview('beep','miami','easy','local','missing');assert.equal(g.opponentId,'beep');
});
test('each special has its own energy threshold, speed and damage',()=>{
  assert.equal(new Set(BOTS.map(b=>b.special.name)).size,4);
  for(const spec of BOTS){
    const g=new Game({mode:'local',playerId:spec.id});g.start();g.phase='fight';const f=g.fighters[0];
    f.energy=spec.special.cost-1;assert.equal(g.attack(f,'zap'),false);
    f.energy=spec.special.cost;assert.equal(g.attack(f,'zap'),true);assert.equal(f.energy,0);
    g.step(.04);g.step(.04);assert.equal(g.projectiles.length,1);
    assert.equal(g.projectiles[0].vx,spec.special.speed);assert.equal(g.projectiles[0].damage,spec.special.damage);
  }
});
test('a heavy special is stopped by blocking and cannot hit through the shield at full damage',()=>{
  const g=new Game({mode:'local',playerId:'bolt',opponentId:'beep'});g.start();g.phase='fight';
  g.fighters[0].x=280;g.fighters[1].x=610;g.attack(g.fighters[0],'zap');
  for(let i=0;i<120;i++)g.step(1/120,{}, {block:true});
  assert.equal(g.fighters[1].health,98);assert.equal(g.projectiles.length,0);
});
test('a local match can award player two the final result',()=>{
  const g=new Game({mode:'local'});g.start();
  for(let i=0;i<2;i++){g.phase='fight';g.fighters[0].health=0;g.fighters[1].health=70;g.finishRound();g.phaseTime=0;g.step(.01);}
  assert.equal(g.phase,'matchover');assert.equal(g.result,'loss');assert.deepEqual(g.wins,[0,2]);
});
