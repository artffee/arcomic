// Download reproducible, pinned assets. This script handles no visitor data.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ar=path.resolve(process.argv[2]||path.join(projectRoot,'public/ar'));
const vendor=path.join(ar,'vendor/mediapipe');
const manifest=JSON.parse(await readFile(path.join(vendor,'assets.json'),'utf8'));
if(manifest.version!=='0.10.21')throw new Error('Unexpected tracking runtime version');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const [name,info] of Object.entries(manifest.files)){
  if(name.includes('..')||path.isAbsolute(name))throw new Error('Unsafe asset path');
  const target=path.join(vendor,name);let existing;
  try{existing=await readFile(target);}catch{}
  if(existing&&existing.length===info.size&&sha(existing)===info.sha256){console.log('Verified '+name);continue;}
  if(name==='LICENSE.txt')throw new Error('Restore the checked-in LICENSE.txt before downloading runtime assets');
  const url=name==='face_landmarker.task'?manifest.face_model_source:name==='pose_landmarker_lite.task'?manifest.model_source:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/'+(name==='vision-bundle.js'?'vision_bundle.cjs':name);
  const response=await fetch(url,{signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw new Error('Download failed: '+name+' HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length!==info.size||sha(bytes)!==info.sha256)throw new Error('Integrity mismatch: '+name);
  await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);console.log('Downloaded and verified '+name);
}
console.log('Tracking assets ready. Camera processing remains on the visitor’s device.');
