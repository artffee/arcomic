(function(root){
  'use strict';
  const $=id=>document.getElementById(id),art=root.A408XFaceArt;
  class FaceLab{
    constructor(){
      this.canvas=$('faceCanvas');this.video=$('faceVideo');this.phase='demo';this.revision=0;this.stream=null;this.worker=null;this.workerReady=false;this.workerBusy=false;this.busyRevision=0;this.rig=null;this.lastGood=-Infinity;this.lastSent=-Infinity;this.lastVideoTime=-1;this.lastDraw=-Infinity;this.lastResult=0;this.lastInference=80;this.errors=0;this.facing='user';this.effects=true;this.wildness=.6;this.photo=null;this.photoURL=null;this.photoRevision=0;this.raf=0;this.returnFocus=null;
      this.mediaQuery=root.matchMedia('(prefers-reduced-motion: reduce)');this.calm=this.mediaQuery.matches;$('calmMotion').checked=this.calm;
      this.mediaQuery.addEventListener?.('change',event=>{this.calm=event.matches;$('calmMotion').checked=this.calm;});
      const requested=new URLSearchParams(root.location.search).get('world');this.world=Object.hasOwn(art.WORLDS,requested)?requested:'robots';this.key=art.WORLDS[this.world].keys[0];this.lastLooks={};
      document.querySelectorAll('[data-world]').forEach(button=>button.addEventListener('click',()=>this.selectWorld(button.dataset.world)));
      $('startCamera').addEventListener('click',()=>this.start());$('stopCamera').addEventListener('click',()=>this.demo('Camera off. Your character demo is ready.'));
      $('flipCamera').addEventListener('click',()=>this.flip());$('demoButton').addEventListener('click',()=>this.demo('Camera-free demo. Wiggles included.'));
      $('capturePhoto').addEventListener('click',()=>this.capture());$('savePhoto').addEventListener('click',()=>this.save());$('discardPhoto').addEventListener('click',()=>this.discard());$('closePhoto').addEventListener('click',()=>this.discard());
      $('photoDialog').addEventListener('close',()=>this.clearPhoto());$('photoDialog').addEventListener('cancel',()=>this.clearPhoto());
      $('effectsButton').addEventListener('click',()=>{this.effects=!this.effects;this.syncEffects();});$('wildness').addEventListener('input',event=>{this.wildness=Number(event.target.value)/100;this.syncEffects();});
      $('calmMotion').addEventListener('change',event=>{this.calm=event.target.checked;});
      $('surpriseButton').addEventListener('click',()=>{const keys=Object.keys(art.LOOKS).filter(key=>key!==this.key),key=keys[Math.floor(Math.random()*keys.length)];this.selectWorld(art.LOOKS[key].world,key);});
      document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(this.raf);if(document.hidden){this.demo('Camera paused while you were away. Tap Enable camera to continue.');this.discard();}else this.loop(performance.now());});
      root.addEventListener('pagehide',()=>{this.demo('Camera off. Tap Enable camera to continue.');this.discard();cancelAnimationFrame(this.raf);});
      root.addEventListener('pageshow',event=>{if(event.persisted&&!document.hidden){cancelAnimationFrame(this.raf);this.loop(performance.now());}});
      this.selectWorld(this.world);this.syncEffects();this.controls();this.loop(performance.now());
    }
    status(message){if($('cameraStatus').textContent!==message)$('cameraStatus').textContent=message;}
    controls(){const live=this.phase==='live',pending=this.phase==='requesting';$('startCamera').hidden=live||pending;$('startCamera').disabled=false;$('stopCamera').hidden=!live&&!pending;$('stopCamera').textContent=pending?'Cancel camera':'Camera off';$('flipCamera').hidden=!live;$('capturePhoto').disabled=true;$('modeLabel').classList.toggle('live',live);$('liveDot').classList.remove('live');$('modeLabel').textContent=live?'CAMERA LIVE · FINDING FACE':pending?'WAITING FOR PERMISSION':'DEMO · CAMERA OFF';this.canvas.setAttribute('aria-label',live?'Live camera transformation mirror':'Camera-free character demo');}
    selectWorld(world,key){if(!Object.hasOwn(art.WORLDS,world))return;this.world=world;const keys=art.WORLDS[world].keys;this.key=keys.includes(key)?key:keys.includes(this.lastLooks[world])?this.lastLooks[world]:keys[0];this.lastLooks[world]=this.key;this.syncCharacters();}
    selectCharacter(key){if(!art.WORLDS[this.world].keys.includes(key))return;this.key=key;this.lastLooks[this.world]=key;this.syncCharacters();}
    syncCharacters(){
      const world=art.WORLDS[this.world],look=art.LOOKS[this.key];document.querySelectorAll('[data-world]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.world===this.world)));
      $('worldName').textContent=world.title;$('worldDescription').textContent=world.description;$('characterName').textContent=look.name;$('characterStory').textContent=look.story;$('characterNumber').textContent='408 / '+look.number;$('challenge').textContent='✳ '+look.challenge;$('stageName').textContent=look.name;$('stageTag').textContent=look.tag;
      const previous=document.activeElement?.dataset?.character;
      $('characterList').replaceChildren(...world.keys.map(key=>{const button=document.createElement('button');button.type='button';button.className='character-card';button.dataset.character=key;button.setAttribute('aria-pressed',String(key===this.key));button.setAttribute('aria-label','Become '+art.LOOKS[key].name);const canvas=document.createElement('canvas');canvas.width=220;canvas.height=196;canvas.setAttribute('aria-hidden','true');art.thumbnail(canvas,key);const label=document.createElement('span');label.textContent=art.LOOKS[key].name;button.append(canvas,label);button.addEventListener('click',()=>this.selectCharacter(key));return button;}));
      if(previous&&world.keys.includes(previous))$('characterList').querySelector('[data-character="'+previous+'"]')?.focus();
    }
    syncEffects(){$('effectsButton').textContent=this.effects?'✧ Effects on':'✧ Effects off';$('effectsButton').setAttribute('aria-pressed',String(this.effects));$('wildnessValue').value=Math.round(this.wildness*100)+'%';}
    release(){this.revision++;clearTimeout(this.workerTimeout);clearTimeout(this.inferenceTimeout);clearTimeout(this.playTimeout);clearTimeout(this.permissionNotice);this.playReject?.();this.playReject=null;if(this.stream){this.stream.getTracks().forEach(track=>track.stop());this.stream=null;}this.video.pause();this.video.srcObject=null;if(this.worker){this.worker.terminate();this.worker=null;}this.workerReady=false;this.workerBusy=false;this.rig=null;this.lastGood=-Infinity;this.lastVideoTime=-1;this.lastSent=-Infinity;this.errors=0;}
    demo(message){this.release();this.phase='demo';this.controls();this.status(message||'The demo is ready. Your camera is off.');this.render(performance.now());}
    error(message){this.demo(message);$('startLabel').textContent='Try camera again';}
    async start(){
      if(this.phase==='requesting'||this.phase==='live'||$('photoDialog').open)return;
      this.clearPhoto();this.release();this.phase='requesting';const revision=this.revision;this.controls();this.status('Allow your browser’s camera request. Your video stays on this device.');
      if(!root.isSecureContext||!navigator.mediaDevices?.getUserMedia){this.error('Camera unavailable here. Open this page in an HTTPS browser, or enjoy the demo.');return;}
      if(typeof Worker==='undefined'||typeof createImageBitmap==='undefined'||typeof OffscreenCanvas==='undefined'){this.error('This browser cannot run face tracking. Try an updated Safari or Chrome, or enjoy the demo.');return;}
      this.permissionNotice=setTimeout(()=>{if(revision===this.revision&&this.phase==='requesting')this.status('Still waiting for camera permission. You can cancel and play with the demo.');},15000);
      try{
        const incoming=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:this.facing},width:{ideal:960},height:{ideal:1280},frameRate:{ideal:30,max:30}},audio:false});
        if(revision!==this.revision||this.phase!=='requesting'){incoming.getTracks().forEach(track=>track.stop());return;}
        clearTimeout(this.permissionNotice);this.stream=incoming;this.video.srcObject=incoming;
        for(const track of incoming.getVideoTracks?.()||[])track.addEventListener('ended',()=>{if(revision===this.revision&&this.phase==='live')this.error('The camera disconnected. Reconnect it and try again, or enjoy the demo.');},{once:true});
        await this.playVideo();if(revision!==this.revision||this.phase!=='requesting')return;
        this.phase='live';this.controls();this.setupWorker();this.status('Loading face magic on this device…');
      }catch(error){if(revision!==this.revision)return;const messages={NotAllowedError:'Camera access was not allowed. Enable it in your browser’s site settings and tap Try camera again. The demo still works.',NotFoundError:'No camera was found. Connect a camera, or play with the demo.',NotReadableError:'The camera is busy. Close another camera app and try again, or enjoy the demo.',SecurityError:'This browser blocked camera access. Open the app directly in Safari or Chrome, or enjoy the demo.'};this.error(messages[error?.name]||'The camera could not start. Try opening this page in Safari or Chrome, or enjoy the demo.');}
    }
    async playVideo(){let cancel,timeout;const cancelled=new Promise((resolve,reject)=>{cancel=()=>reject(new Error('Camera cancelled'));timeout=setTimeout(()=>reject(new Error('Camera video timed out')),12000);});this.playReject=cancel;this.playTimeout=timeout;await Promise.race([this.video.play(),cancelled]).finally(()=>{clearTimeout(timeout);if(this.playReject===cancel)this.playReject=null;});}
    setupWorker(){
      try{
        const worker=new Worker('./face-worker.js');this.worker=worker;this.workerReady=false;this.workerBusy=false;this.lastInference=80;
        worker.onmessage=event=>{
          if(this.worker!==worker||this.phase!=='live')return;const data=event.data;
          if(data.type==='ready'){clearTimeout(this.workerTimeout);this.workerReady=true;this.status('Look towards the camera. One face at a time.');}
          else if(data.type==='face'){
            if(data.revision===this.busyRevision){this.workerBusy=false;clearTimeout(this.inferenceTimeout);}
            if(data.revision!==this.revision)return;
            const now=performance.now(),geometry=art.cover(this.video.videoWidth,this.video.videoHeight,this.canvas.width,this.canvas.height,this.facing==='user'),next=art.rig(data.landmarks,data.expressions,geometry);
            this.lastInference=Math.max(0,now-this.lastSent);
            if(next){this.rig=art.smooth(this.rig,next,this.lastResult?now-this.lastResult:80);this.lastGood=now;this.errors=0;}else{this.rig=null;this.lastGood=-Infinity;}
            this.lastResult=now;
          }else if(data.type==='error'){
            if(data.revision!==undefined&&data.revision!==this.revision)return;
            this.workerBusy=false;clearTimeout(this.inferenceTimeout);if(data.fatal||++this.errors>=3)this.error('Face tracking could not start on this device. The camera is now off. Enjoy the demo or try again.');
          }
        };
        worker.onerror=()=>{if(this.worker===worker)this.error('Face tracking is unavailable in this browser. The camera is off; your demo is ready.');};
        this.workerTimeout=setTimeout(()=>{if(this.worker===worker&&!this.workerReady)this.error('Face tracking took too long to load. The camera is off. Check your connection and try again.');},30000);
        worker.postMessage({type:'init'});
      }catch(error){this.error('Face tracking is unavailable. The camera is off; you can still play with the demo.');}
    }
    async sendFrame(now){
      const interval=Math.max(80,Math.min(250,this.lastInference*1.3));
      if(!this.workerReady||this.workerBusy||!this.worker||now-this.lastSent<interval||this.video.currentTime===this.lastVideoTime||!this.video.videoWidth||this.video.readyState<2)return;
      const revision=this.revision,worker=this.worker;this.workerBusy=true;this.busyRevision=revision;this.lastSent=now;this.lastVideoTime=this.video.currentTime;
      this.inferenceTimeout=setTimeout(()=>{if(this.worker===worker&&this.workerBusy&&revision===this.revision)this.error('Face tracking stopped responding. Your camera is off. You can try again or use the demo.');},8000);
      try{
        const scale=Math.min(1,480/Math.max(this.video.videoWidth,this.video.videoHeight));
        const bitmap=await createImageBitmap(this.video,{resizeWidth:Math.max(1,Math.round(this.video.videoWidth*scale)),resizeHeight:Math.max(1,Math.round(this.video.videoHeight*scale)),resizeQuality:'low'});
        if(worker!==this.worker||revision!==this.revision||this.phase!=='live'){bitmap.close();return;}
        worker.postMessage({type:'frame',frame:bitmap,timestamp:now,revision},[bitmap]);
      }catch(error){if(worker!==this.worker||revision!==this.revision)return;this.workerBusy=false;clearTimeout(this.inferenceTimeout);if(++this.errors>=3)this.error('Your browser could not read camera frames. The camera is off; try the demo.');}
    }
    async flip(){if(this.phase!=='live')return;this.facing=this.facing==='user'?'environment':'user';this.demo('Switching camera…');await this.start();}
    loop(now){if(document.hidden)return;if(now-this.lastDraw>=32){this.lastDraw=now;this.render(now);}if(this.phase==='live')this.sendFrame(now);this.raf=requestAnimationFrame(time=>this.loop(time));}
    render(now){
      const c=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height,options={effects:this.effects,wildness:this.wildness,time:now,motion:!this.calm};
      if(this.phase!=='live'){art.demo(c,w,h,this.key,now,!this.calm,options);return;}
      const ready=this.stream&&this.video.readyState>=2&&this.video.videoWidth&&this.video.videoHeight;
      if(!ready){$('capturePhoto').disabled=true;return;}
      const g=art.cover(this.video.videoWidth,this.video.videoHeight,w,h,this.facing==='user');c.save();if(g.mirror){c.translate(w,0);c.scale(-1,1);}c.drawImage(this.video,g.x,g.y,g.vw*g.scale,g.vh*g.scale);c.restore();
      const tracked=!!this.rig&&now-this.lastGood<400;
      if(tracked)art.mask(c,this.key,this.rig,options);
      $('capturePhoto').disabled=!tracked;$('liveDot').classList.toggle('live',tracked);$('modeLabel').textContent=tracked?'LIVE · FACE LINKED':'CAMERA LIVE · FINDING FACE';
      if(tracked)this.status(art.LOOKS[this.key].challenge);else if(this.workerReady)this.status('Find your face: use good light, look forward, and move a little closer.');else this.status('Loading face magic on this device…');
    }
    async capture(){
      if(this.phase!=='live'||$('capturePhoto').disabled)return;this.render(performance.now());if($('capturePhoto').disabled)return;
      const canvas=document.createElement('canvas');canvas.width=this.canvas.width;canvas.height=this.canvas.height;const c=canvas.getContext('2d');c.drawImage(this.canvas,0,0);c.fillStyle='rgba(255,247,232,.95)';c.fillRect(18,canvas.height-66,canvas.width-36,48);c.fillStyle='#202c31';c.font='bold 22px Arial';c.fillText('A408X / '+art.LOOKS[this.key].name.toUpperCase(),32,canvas.height-35);
      this.returnFocus=$('startCamera');this.release();this.phase='demo';this.controls();this.status('Camera off. Review your photo; save it only if you want.');this.clearPhoto();const revision=this.photoRevision;this.photoName='A408X-'+art.LOOKS[this.key].name.replace(/[^a-z0-9-]/gi,'-')+'.png';$('capturePhoto').disabled=true;
      try{
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Empty photo')),'image/png'));
        if(revision!==this.photoRevision||document.hidden)return;this.photo=blob;this.photoURL=URL.createObjectURL(blob);$('photoPreview').src=this.photoURL;$('photoStatus').textContent='Only in memory. Save to your device if you want to keep it.';$('savePhoto').disabled=false;$('photoDialog').showModal();$('savePhoto').focus();
      }catch(error){if(revision===this.photoRevision)this.status('The photo could not be prepared. Your camera is off. Try again.');}
    }
    save(){if(!this.photo||!this.photoURL)return;const a=document.createElement('a');a.href=this.photoURL;a.download=this.photoName;document.body.append(a);a.click();a.remove();const fallback=$('photoDownload');fallback.href=this.photoURL;fallback.target='_blank';fallback.rel='noopener';fallback.download=this.photoName;fallback.hidden=false;$('photoStatus').textContent='Save requested on this device. If your browser opens the photo, use its Save Image option.';}
    clearPhoto(){this.photoRevision++;this.photo=null;if(this.photoURL){URL.revokeObjectURL(this.photoURL);this.photoURL=null;}$('photoPreview').removeAttribute('src');$('photoDownload').hidden=true;$('photoDownload').removeAttribute('href');}
    discard(){this.clearPhoto();if($('photoDialog').open)$('photoDialog').close();this.returnFocus?.focus();}
  }
  root.A408XFaceLab=FaceLab;root.a408xFaceLab=new FaceLab();
})(typeof window==='undefined'?globalThis:window);
