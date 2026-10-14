export const WORLD = { width: 960, floor: 485, gravity: 1480 };
export const BOTS = [
  { id: 'beep', name: 'BEEP', tag: 'Big heart. Bigger punches.', color: '#12d9df', light: '#91ffff', dark: '#087f9d', accent: '#ffbd3b', speed: 266, power: 1, head: 'square', special: { name: 'Heartbeat', cost: 35, damage: 14, speed: 535 } },
  { id: 'glitch', name: 'GLITCH', tag: 'Fast feet. Happy chaos.', color: '#ff579a', light: '#ffb0ce', dark: '#b32978', accent: '#94f43f', speed: 304, power: .92, head: 'round', special: { name: 'Short Circuit', cost: 30, damage: 10, speed: 740 } },
  { id: 'bolt', name: 'BOLT', tag: 'Heavy metal. Soft heart.', color: '#ffcd46', light: '#fff2ad', dark: '#c67626', accent: '#419dff', speed: 232, power: 1.16, head: 'helmet', special: { name: 'Heavy Metal', cost: 45, damage: 20, speed: 380 } },
  { id: 'nova', name: 'NOVA', tag: 'A little cosmic trouble.', color: '#ad87ff', light: '#e2ceff', dark: '#714cc7', accent: '#64f5bc', speed: 264, power: 1, head: 'dome', special: { name: 'Stardust', cost: 40, damage: 16, speed: 575 } }
];
export const ARENAS = [
  { id: 'miami', name: 'Miami Sunset', sky: '#9765eb', low: '#ffb79c', ground: '#432854', tile: '#774474', grass: '#ffdb59' },
  { id: 'jungle', name: 'Jungle Circuit', sky: '#269ad9', low: '#b1edfa', ground: '#563543', tile: '#925448', grass: '#9bdb4b' },
  { id: 'moon', name: 'Moon Scrap', sky: '#211d4a', low: '#6b5da1', ground: '#283454', tile: '#4a5e7b', grass: '#73f3ef' }
];
const MOVES = {
  punch: { windup: .075, active: .095, duration: .27, reach: 71, damage: 7, cooldown: .36 },
  kick: { windup: .13, active: .12, duration: .4, reach: 100, damage: 11, cooldown: .55 },
  zap: { windup: .08, active: .01, duration: .31, reach: 0, damage: 14, cooldown: .63 }
};
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const empty = () => ({ left: false, right: false, jump: false, block: false, punch: false, kick: false, zap: false });
const bot = id => BOTS.find(b => b.id === id) || BOTS[0];

export class InputState {
  constructor() { this.keys = new Map(); this.pointers = new Map(); }
  key(action, down, source = action) { down ? this.keys.set(source, action) : this.keys.delete(source); }
  pointer(id, action) { this.pointers.set(id, action); }
  release(id) { this.pointers.delete(id); }
  clear() { this.keys.clear(); this.pointers.clear(); }
  read() { const value = empty(); for (const a of [...this.keys.values(), ...this.pointers.values()]) if (a in value) value[a] = true; return value; }
}

function fighter(id, index) {
  return { spec: bot(id), index, x: index ? 690 : 270, y: 0, vx: 0, vy: 0, face: index ? -1 : 1,
    health: 100, energy: 60, guard: 100, guarding: false, cooldown: 0, attack: null, hurt: 0,
    invincible: 0, grounded: true, lastJump: false, combo: 0, comboAge: 0, flash: 0 };
}

export class Game {
  constructor({ seed = 408, playerId = 'beep', arenaId = 'miami', difficulty = 'normal', mode = 'cpu', opponentId = 'glitch' } = {}) {
    this.seed = seed >>> 0 || 408; this.playerId = playerId; this.arenaId = arenaId; this.difficulty = difficulty;
    this.clock = 0; this.phase = 'select'; this.paused = false; this.wins = [0, 0]; this.round = 1;
    this.events = []; this.result = null; this.mode = mode === 'local' ? 'local' : 'cpu'; this.opponentId = bot(opponentId).id; this.resetRound();
  }
  random() { this.seed ^= this.seed << 13; this.seed ^= this.seed >>> 17; this.seed ^= this.seed << 5; return (this.seed >>> 0) / 4294967296; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { const list = this.events; this.events = []; return list; }
  preview(playerId, arenaId, difficulty, mode = this.mode, opponentId = this.opponentId) {
    if (this.phase !== 'select' && this.phase !== 'matchover') return;
    this.playerId = bot(playerId).id; this.arenaId = ARENAS.some(a => a.id === arenaId) ? arenaId : 'miami';
    this.difficulty = ['easy', 'normal', 'spicy'].includes(difficulty) ? difficulty : 'normal';
    this.mode = mode === 'local' ? 'local' : 'cpu';
    this.opponentId = this.mode === 'local' ? bot(opponentId).id : BOTS[(BOTS.findIndex(b => b.id === this.playerId) + 1) % BOTS.length].id;
    this.phase = 'select'; this.result = null; this.wins = [0, 0]; this.round = 1; this.resetRound();
  }
  start() {
    const options = BOTS.filter(b => b.id !== this.playerId);
    if (this.mode !== 'local') this.opponentId = options[Math.floor(this.random() * options.length)].id;
    this.wins = [0, 0]; this.round = 1; this.result = null; this.paused = false; this.events = [];
    this.resetRound(); this.phase = 'intro'; this.phaseTime = 3; this.emit('round', { round: 1 });
  }
  resetRound() {
    this.fighters = [fighter(this.playerId, 0), fighter(this.opponentId, 1)]; this.time = 60;
    this.projectiles = []; this.particles = []; this.shake = 0;
    this.brain = { think: 0, input: empty() }; this.roundWinner = null;
  }
  attack(f, type) {
    if (this.phase !== 'fight' || f.attack || f.cooldown > 0 || f.hurt > 0 || f.guarding) return false;
    if (type === 'zap' && f.energy < f.spec.special.cost) return false;
    const move = MOVES[type]; if (!move) return false;
    if (type === 'zap') f.energy -= f.spec.special.cost;
    f.attack = { type, elapsed: 0, hit: false, fired: false, ...move };
    f.cooldown = move.cooldown; this.emit('swing', { type, side: f.index }); return true;
  }
  hit(target, attacker, damage, projectile = false) {
    if (target.invincible > 0 || target.health <= 0) return false;
    const incoming = attacker.x > target.x ? 1 : -1;
    const blocked = target.guarding && target.face === incoming && target.guard > 0;
    const amount = blocked ? 2 : Math.round(damage * attacker.spec.power * (projectile && attacker.spec.id === 'nova' ? 1.15 : 1));
    target.health = Math.max(0, target.health - amount);
    target.guard = Math.max(0, target.guard - (blocked ? damage * 2.4 : 0));
    target.vx = (target.x > attacker.x ? 1 : -1) * (blocked ? 90 : 235);
    target.hurt = blocked ? .055 : .15; target.invincible = blocked ? .12 : .2; target.flash = .13;
    if (!blocked) { target.attack = null; attacker.combo = attacker.comboAge < 1.25 ? attacker.combo + 1 : 1; attacker.comboAge = 0; }
    attacker.energy = clamp(attacker.energy + (blocked ? 2 : 7), 0, 100); this.shake = blocked ? 1.8 : 5;
    for (let i = 0; i < (blocked ? 5 : 10); i++) this.particles.push({ x: target.x - incoming * 19, y: target.y + 79,
      vx: (this.random() - .5) * 320, vy: 80 + this.random() * 220, life: .28 + this.random() * .25, max: .6, side: blocked ? target.index : attacker.index });
    this.emit(blocked ? 'block' : 'hit', { side: attacker.index, damage: amount, combo: attacker.combo }); return true;
  }
  ai(dt) {
    const f = this.fighters[1], other = this.fighters[0]; this.brain.think -= dt;
    if (this.brain.think > 0) return this.brain.input;
    const level = this.difficulty === 'easy' ? 0 : this.difficulty === 'spicy' ? 2 : 1;
    this.brain.think = [.27, .17, .1][level] + this.random() * .08;
    const input = empty(), distance = Math.abs(other.x - f.x);
    const approachingShot = this.projectiles.some(p => p.owner === 0 && Math.abs(p.x - f.x) < 180 && Math.abs(p.y - (f.y + 75)) < 70);
    const danger = (other.attack && distance < 157) || approachingShot;
    if (danger && this.random() < [.16, .43, .67][level] && f.guard > 15) input.block = true;
    else {
      const desired = f.spec.id === 'nova' && f.energy >= f.spec.special.cost ? 215 : 87;
      if (distance > desired + 15) input[other.x < f.x ? 'left' : 'right'] = true;
      if (distance < 57 && this.random() < .4) input[other.x < f.x ? 'right' : 'left'] = true;
      if (distance < 127 && this.random() < [.45, .68, .87][level]) input[this.random() < .55 ? 'punch' : 'kick'] = true;
      if (distance > 165 && distance < 650 && f.energy >= f.spec.special.cost && this.random() < [.13, .3, .42][level]) input.zap = true;
      if ((approachingShot && this.random() < .55) || (distance < 235 && this.random() < [.025, .06, .11][level])) input.jump = true;
    }
    this.brain.input = input; return input;
  }
  step(delta, controls = {}, opponentControls = {}) {
    if (this.paused) return;
    const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .04); this.clock += dt;
    this.shake = Math.max(0, this.shake - dt * 22);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 580 * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.phase === 'intro' || this.phase === 'roundover') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0 && this.phase === 'intro') { this.phase = 'fight'; this.emit('go'); }
      else if (this.phaseTime <= 0) {
        if (this.wins.some(n => n >= 2) || this.round >= 3) {
          this.phase = 'matchover'; this.result = this.wins[0] === this.wins[1] ? 'draw' : this.wins[0] > this.wins[1] ? 'win' : 'loss';
          this.emit('match', { result: this.result });
        } else { this.round++; this.resetRound(); this.phase = 'intro'; this.phaseTime = 2; this.emit('round', { round: this.round }); }
      }
      return;
    }
    if (this.phase !== 'fight') return;
    this.time = Math.max(0, this.time - dt);
    const inputs = [{ ...empty(), ...controls }, this.mode === 'local' ? { ...empty(), ...opponentControls } : this.ai(dt)];
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i], other = this.fighters[1 - i], input = inputs[i];
      f.cooldown = Math.max(0, f.cooldown - dt); f.hurt = Math.max(0, f.hurt - dt); f.invincible = Math.max(0, f.invincible - dt); f.flash = Math.max(0, f.flash - dt);
      f.comboAge += dt; f.energy = clamp(f.energy + dt * 7, 0, 100);
      if (!f.attack && f.hurt <= 0) f.face = other.x >= f.x ? 1 : -1;
      f.guarding = !!input.block && f.grounded && !f.attack && f.hurt <= 0 && f.guard > 1;
      f.guard = clamp(f.guard + dt * (f.guarding ? -23 : 19), 0, 100);
      if (input.jump && !f.lastJump && f.grounded && f.hurt <= 0 && !f.guarding) { f.vy = 565; f.grounded = false; this.emit('jump', { side: i }); }
      f.lastJump = !!input.jump;
      if (f.hurt <= 0) {
        f.vx = (Number(input.right) - Number(input.left)) * f.spec.speed * (f.guarding ? .27 : f.attack ? .58 : 1);
        if (input.zap) this.attack(f, 'zap'); else if (input.kick) this.attack(f, 'kick'); else if (input.punch) this.attack(f, 'punch');
      } else f.vx *= Math.exp(-8 * dt);
      f.x = clamp(f.x + f.vx * dt, 48, WORLD.width - 48);
      if (!f.grounded) { f.vy -= WORLD.gravity * dt; f.y += f.vy * dt; if (f.y <= 0) { f.y = 0; f.vy = 0; f.grounded = true; } }
    }
    const [a, b] = this.fighters;
    if (Math.abs(a.x - b.x) < 59 && Math.abs(a.y - b.y) < 120) {
      const sign = b.x >= a.x ? 1 : -1, push = (59 - Math.abs(a.x - b.x)) / 2;
      a.x = clamp(a.x - sign * push, 48, 912); b.x = clamp(b.x + sign * push, 48, 912);
    }
    for (const f of this.fighters) if (f.attack) {
      const move = f.attack, other = this.fighters[1 - f.index]; move.elapsed += dt;
      if (move.type === 'zap' && move.elapsed >= move.windup && !move.fired) {
        move.fired = true; this.projectiles.push({ x: f.x + f.face * 50, y: f.y + 80, vx: f.face * f.spec.special.speed, owner: f.index, life: 2.5, damage: f.spec.special.damage });
        this.emit('zap', { side: f.index });
      }
      if (move.type !== 'zap' && !move.hit && move.elapsed >= move.windup && move.elapsed <= move.windup + move.active) {
        const frontDistance = (other.x - f.x) * f.face;
        const vertical = f.y + 76 >= other.y + 12 && f.y + 61 <= other.y + 143;
        if (frontDistance >= 0 && frontDistance <= move.reach + 39 && vertical) move.hit = this.hit(other, f, move.damage);
      }
      if (move.elapsed >= move.duration) f.attack = null;
    }
    for (const p of this.projectiles) {
      const previousX = p.x; p.x += p.vx * dt; p.life -= dt;
      const target = this.fighters[1 - p.owner];
      const crosses = Math.min(previousX, p.x) <= target.x + 31 && Math.max(previousX, p.x) >= target.x - 31;
      if (p.life > 0 && crosses && p.y >= target.y + 11 && p.y <= target.y + 151 && target.invincible <= 0) {
        if (this.hit(target, this.fighters[p.owner], p.damage, true)) p.life = -1;
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x >= -30 && p.x <= 990);
    if (a.health <= 0 || b.health <= 0 || this.time <= 0) this.finishRound();
  }
  finishRound() {
    if (this.phase !== 'fight') return;
    const [a, b] = this.fighters;
    const winner = a.health === b.health ? null : a.health > b.health ? 0 : 1;
    this.roundWinner = winner; if (winner !== null) this.wins[winner]++;
    this.phase = 'roundover'; this.phaseTime = 2.65;
    for (const f of this.fighters) { f.attack = null; f.guarding = false; f.vx = 0; }
    this.projectiles = []; this.emit('roundend', { winner, timeout: this.time <= 0 });
  }
}
