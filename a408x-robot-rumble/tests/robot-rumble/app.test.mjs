import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { Game, BOTS, ARENAS, InputState, clamp } from '../../dist/games/robot-rumble/engine.js';

class Element {
  constructor(tag='div'){this.tag=tag;this.listeners={};this.dataset={};this.attributes={};this.children=[];this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.clientWidth=340;this.open=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c)};this.firstElementChild={style:{}};}
  addEventListener(name,fn){(this.listeners[name]||=[]).push(fn);}
  dispatch(name,data={}){const event={code:'',pointerId:1,repeat:false,target:this,preventDefault(){},...data};for(const fn of this.listeners[name]||[])fn(event);}
  setAttribute(name,value){this.attributes[name]=value;}
  append(...children){this.children.push(...children);}
  matches(selector){return selector==='[data-action]'&&!!this.dataset.action;}
  closest(){return ['button','a','input','select','textarea'].includes(this.tag)?this:null;}
  focus(){this.focused=true;}
  setPointerCapture(){}
  getContext(){return {};}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatch('close');}
}
class Select extends Element {constructor(){super('select');}}
function app({storageFails=false}={}){
  const html=fs.readFileSync(new URL('../../dist/games/robot-rumble/index.html',import.meta.url),'utf8'),source=fs.readFileSync(new URL('../../dist/games/robot-rumble/game.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');
  const nodes={};for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))nodes[match[2]]=match[1]==='select'?new Select():new Element(match[1]);
  const buttons=[...html.matchAll(/<button[^>]*\bdata-action="([^"]+)"[^>]*>/g)].map(m=>{const b=new Element('button');b.dataset.action=m[1];b.dataset.player=/data-player="2"/.test(m[0])?'2':'1';return b;});
  const doc=new Element();doc.hidden=false;doc.getElementById=id=>nodes[id];doc.querySelectorAll=()=>buttons;doc.querySelector=selector=>buttons.find(b=>selector.includes(`"${b.dataset.action}"`));doc.createElement=tag=>new Element(tag);
  const win=new Element();win.matchMedia=()=>({matches:false});let callback=null,now=0;
  const sandbox={Game,BOTS,ARENAS,InputState,clamp,render:()=>{},avatar:()=>{},document:doc,window:win,HTMLSelectElement:Select,localStorage:{getItem:()=>{if(storageFails)throw Error('disabled');return null;},setItem:()=>{if(storageFails)throw Error('disabled');}},performance:{now:()=>now},Date,console,setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:cb=>{callback=cb;}};
  const context=vm.createContext(sandbox);vm.runInContext(source,context);const game=vm.runInContext('game',context),input=vm.runInContext('input',context),input2=vm.runInContext('input2',context);
  const frames=count=>{for(let i=0;i<count;i++){now+=1000/60;callback(now);}};
  return{nodes,buttons,doc,win,game,input,input2,frames,context};
}
test('real app initialization works when browser storage is unavailable',()=>{const a=app({storageFails:true});a.frames(1);assert.equal(a.nodes['bot-grid'].children.length,4);assert.equal(a.nodes['overlay-title'].textContent,'READY TO\nRUMBLE?');});
test('start button, countdown and pause/resume drive the real app',()=>{const a=app();a.nodes.play.dispatch('click');assert.equal(a.game.phase,'intro');a.frames(190);assert.equal(a.game.phase,'fight');assert.equal(a.nodes.overlay.hidden,true);a.nodes.pause.dispatch('click');const time=a.game.time;a.frames(30);assert.equal(a.game.time,time);assert.equal(a.nodes['overlay-title'].textContent,'PAUSED.');a.nodes.play.dispatch('click');a.frames(2);assert.ok(a.game.time<time);});
test('two touch buttons work together; pointer cancellation clears only its own action',()=>{const a=app();a.nodes.play.dispatch('click');a.frames(190);const right=a.buttons.find(b=>b.dataset.action==='right'),punch=a.buttons.find(b=>b.dataset.action==='punch');right.dispatch('pointerdown',{pointerId:1});punch.dispatch('pointerdown',{pointerId:2});assert.equal(a.input.read().right,true);assert.equal(a.input.read().punch,true);right.dispatch('pointercancel',{pointerId:1});assert.equal(a.input.read().right,false);assert.equal(a.input.read().punch,true);punch.dispatch('lostpointercapture',{pointerId:2});assert.equal(a.input.read().punch,false);});
test('losing visibility pauses the game and clears held controls',()=>{const a=app();a.nodes.play.dispatch('click');a.frames(190);a.buttons[0].dispatch('pointerdown',{pointerId:4});a.doc.hidden=true;a.doc.dispatch('visibilitychange');assert.equal(a.game.paused,true);assert.equal(Object.values(a.input.read()).some(Boolean),false);});
test('keyboard aliases release independently and P pauses',()=>{const a=app();a.nodes.play.dispatch('click');a.frames(190);const body=new Element();a.win.dispatch('keydown',{code:'KeyA',target:body});a.win.dispatch('keydown',{code:'ArrowLeft',target:body});a.win.dispatch('keyup',{code:'KeyA'});assert.equal(a.input.read().left,true);a.win.dispatch('keyup',{code:'ArrowLeft'});assert.equal(a.input.read().left,false);a.win.dispatch('keydown',{code:'KeyP',target:body});assert.equal(a.game.paused,true);});
test('instructions restore the previous pause state and restart returns to selection',()=>{const a=app();a.nodes.play.dispatch('click');a.frames(190);a.nodes.help.dispatch('click');assert.equal(a.game.paused,true);a.nodes['got-it'].dispatch('click');assert.equal(a.game.paused,false);a.nodes.restart.dispatch('click');a.frames(1);assert.equal(a.game.phase,'select');assert.equal(a.nodes['arena-select'].disabled,false);});
test('finishing a match records the result once and makes a rematch available',()=>{const a=app();a.nodes.play.dispatch('click');a.game.phase='fight';a.game.wins=[1,0];a.game.fighters[1].health=0;a.game.finishRound();a.frames(170);assert.equal(a.game.phase,'matchover');assert.equal(a.nodes.record.textContent,'1 WINS / 1 MATCHES');a.frames(50);assert.equal(a.nodes.record.textContent,'1 WINS / 1 MATCHES');a.nodes.play.dispatch('click');assert.equal(a.game.phase,'intro');assert.deepEqual(a.game.wins,[0,0]);});

function localApp(){const a=app();a.nodes['mode-select'].value='local';a.nodes['opponent-select'].value='nova';a.nodes['mode-select'].dispatch('change');a.frames(1);return a;}
test('local setup displays the second touch deck and selected robot',()=>{
  const a=localApp();assert.equal(a.nodes['p2-controls'].hidden,false);assert.equal(a.nodes['difficulty-option'].hidden,true);
  assert.equal(a.nodes['opponent-name'].textContent,'NOVA');a.nodes.play.dispatch('click');a.frames(190);
  assert.equal(a.game.mode,'local');assert.equal(a.game.fighters[1].spec.id,'nova');assert.equal(a.nodes['mode-select'].disabled,true);
});
test('local keyboard routes WASD to P1 and arrows plus UIO to P2',()=>{
  const a=localApp();a.nodes.play.dispatch('click');a.frames(190);const body=new Element();
  a.win.dispatch('keydown',{code:'KeyA',target:body});a.win.dispatch('keydown',{code:'ArrowRight',target:body});a.win.dispatch('keydown',{code:'KeyU',target:body});
  assert.equal(a.input.read().left,true);assert.equal(a.input.read().right,false);assert.equal(a.input2.read().right,true);assert.equal(a.input2.read().punch,true);
  a.win.dispatch('keyup',{code:'KeyU'});assert.equal(a.input2.read().punch,false);
});
test('both players can hold touch actions; cancellation is isolated by pointer ID',()=>{
  const a=localApp();a.nodes.play.dispatch('click');a.frames(190);
  const p1=a.buttons.find(b=>b.dataset.player==='1'&&b.dataset.action==='right'),p2=a.buttons.find(b=>b.dataset.player==='2'&&b.dataset.action==='punch');
  p1.dispatch('pointerdown',{pointerId:2});p2.dispatch('pointerdown',{pointerId:3});
  assert.equal(a.input.read().right,true);assert.equal(a.input2.read().punch,true);
  p2.dispatch('pointercancel',{pointerId:3});assert.equal(a.input.read().right,true);assert.equal(a.input2.read().punch,false);
  a.win.dispatch('blur');assert.equal(a.game.paused,true);assert.equal(Object.values(a.input.read()).some(Boolean),false);
});
test('toolbar button focus preserves native Space activation instead of jumping',()=>{
  const a=app();a.nodes.play.dispatch('click');a.frames(190);let prevented=false;
  a.win.dispatch('keydown',{code:'Space',target:a.nodes.sound,preventDefault(){prevented=true;}});
  assert.equal(prevented,false);assert.equal(a.input.read().jump,false);assert.equal(a.nodes.game.focused,true);
});
test('focused touch buttons support Space without leaking jump input',()=>{
  const a=localApp();a.nodes.play.dispatch('click');a.frames(190);const b=a.buttons.find(b=>b.dataset.player==='2'&&b.dataset.action==='punch');
  b.dispatch('keydown',{code:'Space'});a.win.dispatch('keydown',{code:'Space',target:b});
  assert.equal(a.input2.read().punch,true);assert.equal(a.input.read().jump,false);b.dispatch('keyup',{code:'Space'});assert.equal(a.input2.read().punch,false);
});
test('local player two wins are named and never counted as computer losses',()=>{
  const a=localApp();a.nodes.play.dispatch('click');a.game.phase='fight';a.game.wins=[0,1];a.game.fighters[0].health=0;a.game.finishRound();a.frames(170);
  assert.equal(a.nodes['overlay-title'].textContent,'P2 WINS!');assert.ok(a.nodes.announcement.textContent.includes('Player 2 (NOVA) won the match'));
  assert.equal(vm.runInContext('record.matches',a.context),0);assert.equal(a.nodes.play.focused,true);
  a.nodes.play.dispatch('click');assert.equal(a.game.opponentId,'nova');
});
test('mode changes clear both held input maps and restore single-player arrow aliases',()=>{
  const a=localApp();a.input2.key('punch',true);a.nodes['mode-select'].value='cpu';a.nodes['mode-select'].dispatch('change');a.frames(1);
  assert.equal(a.nodes['p2-controls'].hidden,true);assert.equal(a.input2.read().punch,false);
  a.nodes.play.dispatch('click');a.frames(190);a.win.dispatch('keydown',{code:'ArrowLeft',target:new Element()});assert.equal(a.input.read().left,true);
});
