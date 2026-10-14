import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const gameDir=path.join(root,'dist/games/robot-rumble');
for(const file of ['engine.js','game.js','render.js'])execFileSync(process.execPath,['--check',path.join(gameDir,file)],{stdio:'inherit'});
const html=fs.readFileSync(path.join(gameDir,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const target=match[1].split('#')[0];if(!target||target.startsWith('https:'))continue;
  if(!fs.existsSync(path.resolve(gameDir,target)))throw Error('Missing local asset '+target);
}
console.log('Game syntax, modules and local entry/return paths verified.');
