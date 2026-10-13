/* Runs locally in a Worker. Camera frames are never uploaded. */
'use strict';
var exports = {};
let detector=null,lastTimestamp=-1;
self.onmessage=async function(event){
  const message=event.data;
  if(message.type==='init'){
    try{
      if(typeof OffscreenCanvas==='undefined')throw new Error('OffscreenCanvas unavailable');
      importScripts('./vendor/mediapipe/vision-bundle.js');
      const base=new URL('./vendor/mediapipe/',self.location.href);
      const files=await exports.FilesetResolver.forVisionTasks(new URL('wasm',base).href);
      const options={runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.5,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:false};
      try{detector=await exports.FaceLandmarker.createFromOptions(files,{...options,canvas:new OffscreenCanvas(1,1),baseOptions:{modelAssetPath:new URL('face_landmarker.task',base).href,delegate:'GPU'}});}
      catch(error){detector=await exports.FaceLandmarker.createFromOptions(files,{...options,canvas:new OffscreenCanvas(1,1),baseOptions:{modelAssetPath:new URL('face_landmarker.task',base).href,delegate:'CPU'}});}
      self.postMessage({type:'ready'});
    }catch(error){self.postMessage({type:'error',fatal:true});}
  }else if(message.type==='frame'){
    try{
      if(!detector)throw new Error('Tracker unavailable');
      const timestamp=Math.max(lastTimestamp+1,Number(message.timestamp)||0);lastTimestamp=timestamp;
      const result=detector.detectForVideo(message.frame,timestamp);
      const expressions={};for(const category of(result.faceBlendshapes?.[0]?.categories||[]))expressions[category.categoryName]=category.score;
      self.postMessage({type:'face',landmarks:result.faceLandmarks?.[0]||null,expressions,revision:message.revision});
    }catch(error){self.postMessage({type:'error',fatal:false,revision:message.revision});}
    finally{message.frame.close();}
  }else if(message.type==='close'){
    if(detector){detector.close();detector=null;}self.close();
  }
};
