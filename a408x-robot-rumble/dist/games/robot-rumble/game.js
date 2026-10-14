import { Game, BOTS, ARENAS, InputState, clamp } from './engine.js';
import { render, avatar } from './render.js';
const $ = id => document.getElementById(id);
const canvas = $('game'), input = new InputState(), input2 = new InputState();
const inputs = [input, input2];
function load() {
  try { const value = JSON.parse(localStorage.getItem('a408x-rumble-v1')); return value && typeof value === 'object' ? value : {}; }
  catch { return {}; }
}
const saved = load();
const playerId = BOTS.some(b => b.id === saved.bot) ? saved.bot : 'beep';
const opponentId = BOTS.some(b => b.id === saved.opponent) ? saved.opponent : 'glitch';
const arenaId = ARENAS.some(a => a.id === saved.arena) ? saved.arena : 'miami';
const difficulty = ['easy', 'normal', 'spicy'].includes(saved.difficulty) ? saved.difficulty : 'normal';
const mode = saved.mode === 'local' ? 'local' : 'cpu';
const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const record = { matches: count(saved.matches), wins: Math.min(count(saved.wins), count(saved.matches)) };
const game = new Game({ seed: Date.now() >>> 0, playerId, opponentId, arenaId, difficulty, mode });
game.preview(playerId, arenaId, difficulty, mode, opponentId);
const controls = [...document.querySelectorAll('[data-action]')], cards = [];
let soundEnabled = saved.sound === true, lastOverlay = '', lastDots = '', helpWasPaused = false, toastTimer;
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
$('calm-motion').checked = saved.calm === true || motion.matches;
const active = () => ['intro', 'fight', 'roundover'].includes(game.phase);
const text = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
function save() {
  try { localStorage.setItem('a408x-rumble-v1', JSON.stringify({ bot: game.playerId, opponent: $('opponent-select').value, mode: game.mode, arena: game.arenaId, difficulty: game.difficulty, sound: soundEnabled, calm: $('calm-motion').checked, ...record })); }
  catch { /* Storage is optional. */ }
}
function tell(message) { text('announcement', message); }
function toast(message) {
  clearTimeout(toastTimer); text('toast', message); $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}
function clearInput() { for (const state of inputs) state.clear(); for (const b of controls) b.classList.remove('held'); }
function refreshRecord() { text('record', game.mode === 'local' ? 'TWO HUMANS / ONE SCREEN' : `${record.wins} WINS / ${record.matches} MATCHES`); }

class Sounds {
  constructor() { this.ctx = null; }
  activate() {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.ctx ||= new Audio();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch { /* Silent play remains available. */ }
  }
  tone(freq, duration = .09, type = 'square', volume = .045) {
    if (!soundEnabled || !this.ctx || this.ctx.state !== 'running') return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), now = this.ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * .65), now + duration);
    g.gain.setValueAtTime(volume, now); g.gain.exponentialRampToValueAtTime(.001, now + duration);
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(now + duration);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  event(e) {
    if (e.type === 'hit') this.tone(95, .1, 'triangle', .09);
    if (e.type === 'block') this.tone(260, .065);
    if (e.type === 'jump') this.tone(350, .07);
    if (e.type === 'zap') this.tone(710, .17, 'sawtooth', .04);
    if (e.type === 'go') this.tone(620, .15);
    if (e.type === 'roundend') this.tone(e.winner === 0 ? 810 : 150, .24);
  }
}
const sounds = new Sounds();
function soundLabel() {
  $('sound').innerHTML = `♪ <span>Sound ${soundEnabled ? 'on' : 'off'}</span>`;
  $('sound').setAttribute('aria-pressed', String(soundEnabled));
  $('sound').setAttribute('aria-label', soundEnabled ? 'Turn sound off' : 'Turn sound on');
}
$('sound').addEventListener('click', () => { soundEnabled = !soundEnabled; sounds.activate(); soundLabel(); save(); if (soundEnabled) sounds.tone(480, .08); });
soundLabel();
$('calm-motion').addEventListener('change', save);

function previewSettings() {
  if (active()) return;
  game.preview(game.playerId, $('arena-select').value, $('difficulty-select').value, $('mode-select').value, $('opponent-select').value);
  clearInput(); refreshRecord(); save();
}
for (const b of BOTS) {
  const button = document.createElement('button'); button.className = 'bot-card'; button.dataset.bot = b.id;
  button.setAttribute('aria-label', `Choose ${b.name}. ${b.tag} Special: ${b.special.name}, ${b.special.cost} power.`);
  const picture = document.createElement('canvas'); picture.width = 88; picture.height = 117; picture.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span'), name = document.createElement('strong'), tag = document.createElement('small');
  name.textContent = b.name; tag.textContent = b.tag; copy.append(name, tag); button.append(picture, copy);
  $('bot-grid').append(button); avatar(picture, b.id); cards.push(button);
  button.addEventListener('click', () => {
    if (active()) return;
    game.preview(b.id, $('arena-select').value, $('difficulty-select').value, $('mode-select').value, $('opponent-select').value);
    clearInput(); save(); tell(`${b.name} selected. ${b.special.name} uses ${b.special.cost} power.`);
  });
  const option = document.createElement('option'); option.value = b.id; option.textContent = `${b.name} · ${b.special.name}`; $('opponent-select').append(option);
}
$('arena-select').value = arenaId; $('difficulty-select').value = difficulty; $('mode-select').value = mode; $('opponent-select').value = opponentId;
for (const id of ['arena-select', 'difficulty-select', 'mode-select', 'opponent-select']) $(id).addEventListener('change', previewSettings);
function sideName(side) { return game.mode === 'local' ? `Player ${side + 1} (${game.fighters[side].spec.name})` : side === 0 ? 'You' : 'The computer'; }
function play() {
  clearInput(); sounds.activate();
  if (game.paused) { game.paused = false; tell('Game resumed.'); }
  else { game.start(); tell(`${game.fighters[0].spec.name} versus ${game.fighters[1].spec.name}. Round one.`); }
  canvas.focus({ preventScroll: true }); save();
}
$('play').addEventListener('click', play);
function pause() {
  if (!active()) return;
  game.paused = !game.paused; clearInput();
  if (!game.paused) { sounds.activate(); canvas.focus({ preventScroll: true }); }
  tell(game.paused ? 'Game paused.' : 'Game resumed.');
}
$('pause').addEventListener('click', pause);
$('restart').addEventListener('click', () => {
  clearInput(); game.phase = 'select'; game.paused = false; previewSettings();
  tell('Choose robots for a new match.'); $('mode-select').focus({ preventScroll: true });
});
if (!$('arcade').requestFullscreen) $('fullscreen').hidden = true;
$('fullscreen').addEventListener('click', async () => {
  clearInput();
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('arcade').requestFullscreen(); }
  catch { toast('Turn your phone sideways for a bigger arena.'); }
});

for (const button of controls) {
  const state = inputs[button.dataset.player === '2' ? 1 : 0], action = button.dataset.action;
  const source = `button-${button.dataset.player || '1'}-${action}`;
  button.addEventListener('pointerdown', e => {
    if (!active() || game.paused || game.phase === 'roundover') return;
    e.preventDefault(); state.pointer(e.pointerId, action); button.classList.add('held');
    try { button.setPointerCapture(e.pointerId); } catch { /* pointerup still releases. */ }
    sounds.activate();
  });
  function release(e) { state.release(e.pointerId); if (!state.read()[action]) button.classList.remove('held'); }
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
  button.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'Enter') && active() && !game.paused) {
      e.preventDefault(); state.key(action, true, source); button.classList.add('held'); sounds.activate();
    }
  });
  button.addEventListener('keyup', e => {
    if (e.code === 'Space' || e.code === 'Enter') { state.key(action, false, source); if (!state.read()[action]) button.classList.remove('held'); }
  });
  button.addEventListener('blur', () => { state.key(action, false, source); if (!state.read()[action]) button.classList.remove('held'); });
  // Assistive-technology button activation also makes a short, usable move.
  button.addEventListener('click', e => {
    if (e.detail !== 0 || !active() || game.paused || state.read()[action]) return;
    state.key(action, true, source); setTimeout(() => state.key(action, false, source), 180);
  });
}
const p1Keys = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', Space: 'jump', KeyS: 'block', KeyJ: 'punch', KeyK: 'kick', KeyL: 'zap' };
const arrows = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'block' };
const p2Keys = { ...arrows, KeyU: 'punch', KeyI: 'kick', KeyO: 'zap', Numpad1: 'punch', Numpad2: 'kick', Numpad3: 'zap' };
function binding(code) {
  if (p1Keys[code]) return [0, p1Keys[code]];
  if (game.mode === 'local' && p2Keys[code]) return [1, p2Keys[code]];
  if (game.mode === 'cpu' && arrows[code]) return [0, arrows[code]];
  return null;
}
window.addEventListener('keydown', e => {
  if ($('help-dialog').open || e.target instanceof HTMLSelectElement) return;
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) { e.preventDefault(); pause(); return; }
  // Space/Enter must continue activating toolbar and menu buttons natively.
  if (e.target.closest('button, a, input, select, textarea, [contenteditable]')) return;
  const key = binding(e.code);
  if (key && active() && !game.paused) { e.preventDefault(); inputs[key[0]].key(key[1], true, e.code); sounds.activate(); }
});
window.addEventListener('keyup', e => { for (const state of inputs) state.key('', false, e.code); });
window.addEventListener('pointerup', e => { for (const state of inputs) state.release(e.pointerId); });
window.addEventListener('pointercancel', e => { for (const state of inputs) state.release(e.pointerId); });
function background() { clearInput(); if (active()) game.paused = true; }
window.addEventListener('blur', background);
document.addEventListener('visibilitychange', () => { if (document.hidden) background(); });
$('help').addEventListener('click', () => { helpWasPaused = game.paused; clearInput(); if (active()) game.paused = true; $('help-dialog').showModal(); });
for (const id of ['close-help', 'got-it']) $(id).addEventListener('click', () => $('help-dialog').close());
$('help-dialog').addEventListener('close', () => {
  clearInput(); if (active() && !helpWasPaused && !document.hidden) { game.paused = false; canvas.focus({ preventScroll: true }); }
});

function meters() {
  const [a, b] = game.fighters, local = game.mode === 'local', locked = active();
  for (const [id, f] of [['player', a], ['opponent', b]]) {
    const health = $(id + '-health'); health.firstElementChild.style.width = `${f.health}%`;
    health.setAttribute('aria-valuenow', String(f.health)); health.setAttribute('aria-valuetext', `${f.health} of 100 battery`);
    $(id + '-power').style.width = `${f.energy}%`; text(id + '-name', f.spec.name);
  }
  text('timer', String(Math.ceil(game.time)).padStart(2, '0')); text('round-number', `ROUND ${game.round}`);
  text('arena-name', ARENAS.find(arena => arena.id === game.arenaId).name.toUpperCase());
  text('mode-caption', local ? 'TWO HUMANS · LOCAL PLAY' : 'HUMAN VS COMPUTER');
  text('player-role', local ? 'P1' : 'YOU'); text('opponent-role', local ? 'P2' : 'CPU');
  text('touch-caption', local ? 'PLAYER ONE / WASD + J K L · OR USE THESE BUTTONS' : 'YOUR CONTROLS / HOLD TO MOVE · TAP OR HOLD TO ATTACK');
  for (const id of ['p2-controls', 'p2-touch-caption', 'opponent-option']) $(id).hidden = !local;
  $('difficulty-option').hidden = local;
  for (const button of controls) {
    const f = button.dataset.player === '2' ? b : a;
    button.disabled = !locked || game.paused || game.phase === 'roundover';
    if (button.dataset.action === 'zap') {
      button.classList.toggle('no-power', f.energy < f.spec.special.cost);
      button.setAttribute('aria-label', `${button.dataset.player === '2' ? 'Player two' : 'Player one'} special: ${f.spec.special.name}. ${f.spec.special.cost} power required. ${Math.floor(f.energy)} power available.`);
    }
  }
  text('zap-status', a.energy >= a.spec.special.cost ? 'ZAP READY' : 'CHARGING');
  text('opponent-charge-label', b.energy >= b.spec.special.cost ? 'ZAP READY' : 'CHARGING');
  $('shield-meter').style.width = `${a.guard}%`; $('shield-meter-2').style.width = `${b.guard}%`;
  text('special-note', `${a.spec.name} / ${a.spec.special.name.toUpperCase()} · ${a.spec.special.cost} POWER${local ? `  |  ${b.spec.name} / ${b.spec.special.name.toUpperCase()} · ${b.spec.special.cost} POWER` : ''}`);
  const dots = game.wins.join('/');
  if (dots !== lastDots) {
    lastDots = dots;
    for (const [id, side] of [['player', 0], ['opponent', 1]]) {
      const d = $(id + '-rounds'); d.innerHTML = [0, 1].map(n => `<i aria-hidden="true" class="${game.wins[side] > n ? 'won' : ''}"></i>`).join('');
      d.setAttribute('aria-label', `Player ${side + 1} round wins: ${game.wins[side]}`);
    }
  }
  $('pause').disabled = !locked; $('pause').innerHTML = game.paused ? '▶ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', game.paused ? 'Resume game' : 'Pause game');
  for (const c of cards) { c.disabled = locked; c.classList.toggle('selected', c.dataset.bot === game.playerId); c.setAttribute('aria-pressed', String(c.dataset.bot === game.playerId)); }
  for (const id of ['arena-select', 'mode-select', 'opponent-select', 'difficulty-select']) $(id).disabled = locked;
  text('setup-note', locked ? 'Use ↺ above the arena to choose a new match. Hold a direction and an attack together.' : local ? 'Share one keyboard or use both touch decks. A wider screen gives two humans more elbow room.' : 'Choose a robot, then tap Let’s Play. Hold the phone buttons to move or repeat attacks.');
  const phase = game.paused ? 'paused' : game.phase;
  text('live-tag', phase === 'fight' ? 'LIVE RUMBLE' : phase === 'paused' ? 'PAUSED' : 'FREE PLAY');
  const overlayKey = `${phase}/${game.round}/${game.result}/${local}/${phase === 'intro' ? Math.ceil(game.phaseTime) : ''}`;
  if (overlayKey === lastOverlay) return;
  lastOverlay = overlayKey;
  const over = $('overlay'); over.hidden = phase === 'fight'; over.classList.toggle('countdown', phase === 'intro' || phase === 'roundover');
  $('play').hidden = phase === 'intro' || phase === 'roundover';
  let kicker = '', title = '', note = '', button = 'LET’S PLAY ▶';
  if (phase === 'select') { kicker = local ? 'TWO HUMANS. ONE FRIENDLY RUMBLE.' : 'WELCOME TO THE SQUAD'; title = 'READY TO\nRUMBLE?'; note = 'Choose your bot. Bring your best beep.'; }
  if (phase === 'intro') { kicker = `ROUND ${game.round} / ${a.spec.name} VS ${b.spec.name}`; title = String(Math.max(1, Math.ceil(game.phaseTime))); note = 'Get those tiny robot fists ready.'; }
  if (phase === 'roundover') { kicker = `ROUND ${game.round} COMPLETE`; title = game.roundWinner === null ? 'DRAW!' : local ? `P${game.roundWinner + 1} WINS!` : game.roundWinner === 0 ? 'YOU WIN!' : 'CPU WINS!'; note = game.round >= 3 || game.wins.some(n => n >= 2) ? 'Checking the scoreboard…' : 'Next round coming up…'; }
  if (phase === 'paused') { kicker = 'TAKE A TINY BREATHER'; title = 'PAUSED.'; note = 'Your match will be right here.'; button = 'RESUME ▶'; }
  if (phase === 'matchover') {
    kicker = `FINAL SCORE / ${game.wins[0]} – ${game.wins[1]}`;
    title = game.result === 'draw' ? 'GOOD MATCH!' : local ? `P${game.result === 'win' ? 1 : 2} WINS!` : game.result === 'win' ? 'YOU ROCK!' : 'BEEP. AGAIN?';
    note = game.result === 'draw' ? 'Evenly matched. Perfectly chaotic.' : `${game.result === 'win' ? a.spec.name : b.spec.name} takes the match. Ready for another rumble?`;
    button = 'REMATCH ▶';
  }
  text('overlay-kicker', kicker); text('overlay-title', title); $('overlay-title').style.whiteSpace = 'pre-line'; text('overlay-note', note); text('play', button);
  if ((phase === 'paused' || phase === 'matchover') && !$('help-dialog').open && !document.hidden) $('play').focus({ preventScroll: true });
}
let previous = performance.now();
function frame(now) {
  const dt = clamp((now - previous) / 1000, 0, .04); previous = now;
  game.step(dt, input.read(), input2.read());
  for (const e of game.drainEvents()) {
    sounds.event(e);
    if (e.type === 'round') { clearInput(); tell(`Round ${e.round}.`); }
    if (e.type === 'go') tell('Fight!');
    if (e.type === 'roundend') { clearInput(); tell(e.winner === null ? 'Round drawn.' : `${sideName(e.winner)} won this round.`); }
    if (e.type === 'match') {
      clearInput(); if (game.mode === 'cpu') { record.matches++; if (e.result === 'win') record.wins++; }
      save(); refreshRecord(); tell(e.result === 'draw' ? 'The match was a draw.' : `${sideName(e.result === 'win' ? 0 : 1)} won the match! Final score ${game.wins[0]} to ${game.wins[1]}.`);
    }
  }
  render(canvas, game, { reducedMotion: motion.matches || $('calm-motion').checked }); meters(); requestAnimationFrame(frame);
}
refreshRecord();
if (!canvas.getContext('2d')) { tell('Your browser does not support the game canvas.'); $('play').disabled = true; }
else requestAnimationFrame(frame);
