(function(root){
  'use strict';
  const INK='#202c31',PAPER='#fff7e8',CORAL='#ef6749',CYAN='#50d2d4',LIME='#d3ed87',PINK='#f293b3',PURPLE='#b9a5dc';
  const WORLDS={robots:{title:'The short-circuit club.',description:'Old parts. Big feelings. New faces.',keys:['ziggy','bloop','nova']},aliens:{title:'Earth is getting weird.',description:'A very friendly transmission from elsewhere.',keys:['orbit','zorb']},monsters:{title:'Big-hearted little weirdos.',description:'More giggles than growls.',keys:['fuzz','gloop']},halloween:{title:'A little spooky. A lot of silly.',description:'All treats. Just a tiny bit of trouble.',keys:['pumpkin','boo']}};
  const LOOKS={
    ziggy:{name:'Ziggy',world:'robots',number:'01',tag:'Human heart. Robot energy.',story:'Built from spare parts. Runs entirely on kindness.',challenge:'Smile to supercharge your circuits.',color:'#e7b280'},
    bloop:{name:'Bloop',world:'robots',number:'02',tag:'Soft circuits. Loud giggles.',story:'A round little invention with a very unround personality.',challenge:'Blink to send a little robot hello.',color:CYAN},
    nova:{name:'Nova',world:'robots',number:'03',tag:'Stardust in the wiring.',story:'Solar-powered daydreamer. Collector of impossible ideas.',challenge:'Open your mouth for a cosmic power burst.',color:PURPLE},
    orbit:{name:'UFO Kid',world:'aliens',number:'04',tag:'Visiting Earth. Staying for snacks.',story:'Lost the spaceship keys. Found a new best friend.',challenge:'Smile to call your tiny UFO fleet.',color:CYAN},
    zorb:{name:'Zorb 408',world:'aliens',number:'05',tag:'Three eyes. One very kind heart.',story:'Sees the good in everybody. Sometimes three times.',challenge:'Blink and watch your antenna eyes blink too.',color:LIME},
    fuzz:{name:'Fuzzilla',world:'monsters',number:'06',tag:'Professional hug monster.',story:'Scary at absolutely nothing. Brilliant at being your friend.',challenge:'Say “wow” for a fuzzy bubble celebration.',color:PINK},
    gloop:{name:'Gloop Loop',world:'monsters',number:'07',tag:'Gooey. Goofy. Glorious.',story:'A beautifully weird puddle with excellent dance moves.',challenge:'Open your mouth for maximum silly.',color:CYAN},
    pumpkin:{name:'Pumpkin Panic',world:'halloween',number:'08',tag:'Little witch. Big treat energy.',story:'Accidentally enchanted the candy. It now tells terrible jokes.',challenge:'Smile for a candy-and-bat party.',color:'#f9ad56'},
    boo:{name:'Boo Crew',world:'halloween',number:'09',tag:'Too friendly to haunt.',story:'Tried to be spooky. Got distracted making friends.',challenge:'Blink twice. Your ghost is saying hello.',color:PAPER}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  function cover(vw,vh,w,h,mirror=false){if(!vw||!vh)return null;const scale=Math.max(w/vw,h/vh);return{scale,x:(w-vw*scale)/2,y:(h-vh*scale)/2,vw,vh,w,h,mirror};}
  function project(p,g){const x=p.x*g.vw*g.scale+g.x;return{x:g.mirror?g.w-x:x,y:p.y*g.vh*g.scale+g.y,z:p.z||0};}
  function usable(points){return Array.isArray(points)&&points.length>=468&&[1,10,33,152,234,263,454].every(i=>points[i]&&Number.isFinite(points[i].x)&&Number.isFinite(points[i].y));}
  function rig(points,expressions,g){
    if(!usable(points)||!g)return null;
    const left=project(points[234],g),right=project(points[454],g),top=project(points[10],g),bottom=project(points[152],g),nose=project(points[1],g);
    let a=project(points[33],g),b=project(points[263],g);if(a.x>b.x)[a,b]=[b,a];
    const eyeSpan=Math.hypot(a.x-b.x,a.y-b.y),width=Math.max(Math.hypot(left.x-right.x,left.y-right.y),eyeSpan*1.8),height=Math.hypot(top.x-bottom.x,top.y-bottom.y);
    if(width<25||height<35||width>g.w*1.8||height>g.h*1.8)return null;
    const x=(top.x+bottom.x)*.5,y=(top.y+bottom.y)*.5;
    if(x<0||x>g.w||y<0||y>g.h)return null;
    const scores=expressions||{},e=(key)=>clamp(Number(scores[key])||0,0,1),midX=(a.x+b.x)*.5;
    return{x,y,width,height,angle:clamp(Math.atan2(b.y-a.y,b.x-a.x),-1.15,1.15),yaw:clamp((nose.x-midX)/Math.max(eyeSpan*.55,1),-1,1),mouth:e('jawOpen'),smile:(e('mouthSmileLeft')+e('mouthSmileRight'))*.5,blinkLeft:e(g.mirror?'eyeBlinkLeft':'eyeBlinkRight'),blinkRight:e(g.mirror?'eyeBlinkRight':'eyeBlinkLeft'),brow:e('browInnerUp')};
  }
  function smooth(previous,next,dt=80){if(!next)return null;if(!previous||Math.hypot(previous.x-next.x,previous.y-next.y)>next.width*.85)return{...next};const t=clamp(1-Math.exp(-dt/55),.25,.95),r={...next};for(const key of Object.keys(next))r[key]=lerp(previous[key]??next[key],next[key],t);return r;}
  function path(c,d,color,stroke=3){const p=new Path2D(d);c.fillStyle=color;c.fill(p);if(stroke){c.strokeStyle=INK;c.lineWidth=stroke;c.lineJoin='round';c.stroke(p);}}
  function line(c,d,color=INK,width=3){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(d));}
  function ellipse(c,x,y,rx,ry,color,stroke=3){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=INK;c.lineWidth=stroke;c.stroke();}}
  function rect(c,x,y,w,h,r,color,stroke=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=INK;c.lineWidth=stroke;c.stroke();}}
  function star(c,x,y,r,color,stroke=2){path(c,`M${x} ${y-r}l${r*.27} ${r*.73} ${r*.73} ${r*.27}-${r*.73} ${r*.27}-${r*.27} ${r*.73}-${r*.27}-${r*.73}-${r*.73}-${r*.27} ${r*.73}-${r*.27}Z`,color,stroke);}
  function heart(c,x,y,r,color){c.save();c.translate(x,y);c.scale(r/30,r/30);path(c,'M0 20C-51-5-18-43 0-19C19-44 51-5 0 20Z',color,2);c.restore();}
  function eye(c,x,y,rx,ry,blink,yaw,color=INK){const open=clamp(1-blink,.035,1);if(open<.13){line(c,`M${x-rx} ${y}q${rx} 9 ${rx*2} 0`,color,5);return;}ellipse(c,x,y,rx,ry*open,PAPER,3);ellipse(c,x+clamp(yaw*8,-rx*.24,rx*.24),y,rx*.4,Math.max(1,ry*.57*open),color,0);if(open>.55)ellipse(c,x+rx*.17,y-ry*.2,rx*.09,ry*.1,'#fff',0);}
  function mouth(c,y,r,style){const h=12+r.mouth*55,smile=r.smile;if(r.mouth>.12){ellipse(c,0,y,28+smile*8,h,INK,0);ellipse(c,3,y+h*.53,18,Math.max(4,h*.27),PINK,0);if(style==='monster'||style==='pumpkin'){path(c,`M-24 ${y-h*.72}h14l-6 17Z`,PAPER,0);path(c,`M11 ${y-h*.75}h14l-7 17Z`,PAPER,0);}}else{line(c,`M-35 ${y}Q0 ${y+18+smile*22} 35 ${y}`,INK,5);if(style==='robot'){line(c,`M-14 ${y+8}v7M4 ${y+9}v8M21 ${y+7}v7`,INK,2);}}}
  function mask(c,key,r,options={}){
    if(!r)return false;const look=LOOKS[key]||LOOKS.ziggy,world=look.world;
    c.save();c.translate(r.x,r.y);c.rotate(r.angle);c.scale(r.width/250,r.height/300);c.transform(1,0,r.yaw*.11,1,0,0);c.lineCap='round';c.lineJoin='round';
    if(key==='ziggy'){
      line(c,'M0-137V-194M-15-187h31M-15-177h31M-15-167h31',INK,4);ellipse(c,0,-205,18,18,CORAL,3);
      rect(c,-158,-44,36,96,9,CORAL);rect(c,120,-39,32,81,10,CYAN);rect(c,-126,-136,252,277,29,look.color);
      rect(c,-111,-119,28,239,6,INK,0);for(let y=-100;y<110;y+=28)line(c,`M-111 ${y}l28-15`,PAPER,7);
      rect(c,-72,-79,176,114,16,LIME,3);eye(c,-27,-24,34,38,r.blinkLeft,r.yaw);eye(c,66,-20,21,26,r.blinkRight,r.yaw);
      line(c,'M-66-98h51M64-104h32',PAPER,6);ellipse(c,95,87,13,13,CORAL);line(c,'M89 87h12M95 81v12',INK,2);mouth(c,68,r,'robot');
    }else if(key==='bloop'){
      line(c,'M0-147q-39-58 0-75',INK,5);ellipse(c,0,-224,19,19,PINK);ellipse(c,-134,-5,28,47,PURPLE);ellipse(c,134,-5,28,47,PURPLE);ellipse(c,0,0,133,150,CYAN,4);
      rect(c,-105,-82,210,121,39,INK,0);eye(c,-51,-22,36,42,r.blinkLeft,r.yaw,LIME);eye(c,50,-22,30,35,r.blinkRight,r.yaw,LIME);
      ellipse(c,-80,61,18,13,PINK,0);ellipse(c,83,61,18,13,PINK,0);mouth(c,72,r,'robot');line(c,'M-92-113q29-19 59-16',PAPER,7);
      [-89,89].forEach(x=>{ellipse(c,x,109,8,8,PURPLE,2);line(c,`M${x-4} 109h8`,INK,2);});
    }else if(key==='nova'){
      path(c,'M-97-147 90-142 127-98 117 126 79 150-81 145-129 98-128-100Z',PURPLE,4);
      path(c,'M-101-130-140-182-120-203-73-139Z',CORAL);path(c,'M94-130 129-204 154-181 123-97Z',CYAN);star(c,0,-190,30,LIME);
      rect(c,-102,-81,204,114,20,INK,0);eye(c,-51,-22,31,38,r.blinkLeft,r.yaw,CYAN);eye(c,51,-22,31,38,r.blinkRight,r.yaw,CYAN);
      line(c,'M-91 72h39M-91 86h22M58 69h28M67 84h19',PAPER,4);mouth(c,61,r,'robot');heart(c,0,117,19,CORAL);
    }else if(key==='orbit'){
      path(c,'M-115-89Q-133-26-92 86Q0 182 92 86Q139-25 113-94Z',CYAN,4);
      path(c,'M-100-148Q-72-239 9-226Q91-221 106-142Z',LIME,4);ellipse(c,0,-138,175,33,PINK,4);[-133,-85,-37,13,62,111].forEach((x,i)=>ellipse(c,x,-134,10,7,i%2?CORAL:CYAN,2));
      line(c,'M10-226v-29',INK,4);star(c,10,-267,14,CORAL);eye(c,-55,-20,38,46,r.blinkLeft,r.yaw);eye(c,55,-20,38,46,r.blinkRight,r.yaw);mouth(c,69,r,'alien');ellipse(c,-85,54,15,8,PINK,0);ellipse(c,85,54,15,8,PINK,0);
    }else if(key==='zorb'){
      path(c,'M-93-113Q-8-168 100-105Q156 0 88 105Q0 175-92 107Q-156 2-93-113Z',LIME,4);
      path(c,'M-120-28Q-200-51-175 22Q-165 56-117 46Z',PINK);path(c,'M118-30Q195-49 175 28Q157 62 117 46Z',PINK);
      line(c,'M-68-107Q-133-156-101-196M68-111Q120-158 105-194M0-137Q-28-193 8-223',INK,9);
      eye(c,-101,-207,31,31,r.blinkLeft,r.yaw);eye(c,108,-206,31,31,r.blinkRight,r.yaw);eye(c,10,-244,29,30,(r.blinkLeft+r.blinkRight)*.5,r.yaw);
      ellipse(c,-50,-11,24,27,PURPLE);ellipse(c,50,-11,24,27,PURPLE);ellipse(c,-49,-8,7,9,INK,0);ellipse(c,52,-8,7,9,INK,0);mouth(c,62,r,'alien');ellipse(c,-80,60,15,11,CORAL,0);ellipse(c,83,60,15,11,CORAL,0);
    }else if(key==='fuzz'){
      path(c,'M-88-114Q-167-157-111-228Q-75-206-60-124Z',LIME);path(c,'M71-118Q108-227 156-177Q132-138 104-97Z',PURPLE);
      let d='';for(let i=0;i<60;i++){const a=i/60*Math.PI*2,s=i%2?1:1.085;d+=(i?'L':'M')+(Math.cos(a)*131*s)+' '+(Math.sin(a)*146*s);}path(c,d+'Z',PINK,4);
      eye(c,-54,-28,38,44,r.blinkLeft,r.yaw);eye(c,50,-19,44,48,r.blinkRight,r.yaw);mouth(c,67,r,'monster');star(c,-90,56,15,CYAN);star(c,91,56,12,LIME);
      line(c,'M-57-85q14-13 33-10M43-90q23-7 39 9',INK,4);line(c,'M-15 119l9 7M16 117l9 8',PURPLE,6);
    }else if(key==='gloop'){
      path(c,'M-111-87Q-150-159-61-123Q-18-208 39-135Q126-179 111-88Q162-30 125 88L103 158 74 127 40 160 10 130-22 160-57 130-95 155-111 113Q-163 20-111-87Z',CYAN,4);
      eye(c,-52,-20,35,42,r.blinkLeft,r.yaw);eye(c,54,-22,40,47,r.blinkRight,r.yaw);eye(c,0,-118,22,26,(r.blinkLeft+r.blinkRight)*.5,r.yaw,PURPLE);mouth(c,60,r,'monster');
      ellipse(c,-97,63,13,21,LIME,0);ellipse(c,96,51,15,15,PINK,0);line(c,'M-109-81q-12 22-12 46',PAPER,7);
    }else if(key==='pumpkin'){
      ellipse(c,-45,0,97,140,'#f9ad56',3);ellipse(c,48,0,94,138,'#f9ad56',3);ellipse(c,0,0,100,149,'#f9ad56',3);
      line(c,'M-66-115Q-97 0-62 120M65-118Q96 0 60 125','#ce6c34',4);
      path(c,'M-115-128-59-267Q-47-303-23-269L56-154 111-130Z',PURPLE,4);ellipse(c,-7,-126,159,24,PURPLE,4);path(c,'M-75-176 38-179 58-151-87-153Z',INK,0);rect(c,-37,-180,34,28,3,CORAL,2);star(c,-42,-231,13,LIME);
      eye(c,-45,-26,29,32,r.blinkLeft,r.yaw);eye(c,48,-22,29,32,r.blinkRight,r.yaw);mouth(c,62,r,'pumpkin');ellipse(c,-79,54,13,10,CORAL,0);ellipse(c,83,55,13,10,CORAL,0);
    }else{
      path(c,'M-129-14Q-141-142-41-150Q50-185 110-113Q139-50 137 64L124 156 98 131 74 157 46 132 19 156-10 133-39 156-66 132-97 156-132 129Z',PAPER,4);
      path(c,'M-32-132-65-183-12-165 51-194 33-143-11-152Z',PINK);ellipse(c,-12,-156,11,12,CORAL,2);
      eye(c,-50,-20,28,35,r.blinkLeft,r.yaw);eye(c,51,-18,28,35,r.blinkRight,r.yaw);ellipse(c,-78,47,20,11,PINK,0);ellipse(c,79,47,20,11,PINK,0);mouth(c,61,r,'ghost');star(c,85,-92,15,CYAN);
    }
    if(options.effects&&options.wildness>0)effects(c,world,r,options);
    c.restore();return true;
  }
  function effects(c,world,r,o){
    const t=o.motion===false?0:(o.time||0)/1000,strength=clamp(o.wildness,0,1),count=Math.round(4+strength*9),burst=Math.max(r.smile,r.mouth)*strength;
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2+t*.18,rad=174+Math.sin(i*3+t)*17+burst*40,x=Math.cos(a)*rad,y=Math.sin(a)*rad*1.15;
      if(world==='aliens'){ellipse(c,x,y,12,4,PINK,1.3);path(c,`M${x-7} ${y-1}q1-15 8-12q7 0 7 12Z`,LIME,1.2);}
      else if(world==='monsters'){ellipse(c,x,y,4+i%3*3,4+i%3*3,i%2?LIME:PINK,1.2);}
      else if(world==='halloween'&&i%2){c.save();c.translate(x,y);path(c,'M-15-3-12-11-2-5 0-10 2-5 12-11 15-3 10 2 6-1 0 6-6-1-10 2Z',INK,0);c.restore();}
      else star(c,x,y,5+i%3*2,i%3===0?CORAL:i%3===1?LIME:CYAN,1.2);
    }
  }
  function demoRig(w,h,time=0,motion=true){const t=motion?time/1000:0;return{x:w*.5+Math.sin(t*.7)*w*.03,y:h*.49+Math.sin(t*.9)*h*.012,width:w*.45,height:h*.37,angle:Math.sin(t*.55)*.075,yaw:Math.sin(t*.65)*.5,mouth:Math.max(0,Math.sin(t*.8)-.6)*1.4,smile:.4+Math.sin(t*.6)*.25,blinkLeft:motion&&t%5>4.82?.95:0,blinkRight:motion&&t%5>4.82?.95:0,brow:0};}
  function demo(c,w,h,key,time=0,motion=true,opts={}){
    c.fillStyle='#c3b1e0';c.fillRect(0,0,w,h);c.save();c.globalAlpha=.22;c.strokeStyle=PAPER;c.lineWidth=1;for(let x=0;x<w;x+=w/10){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=w/10){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}c.restore();
    c.save();c.translate(w*.5,h*.88);c.scale(w/720,h/960);path(c,'M-310 80Q-305-104-150-97L-91-150 83-150 154-98Q305-100 311 80Z',LOOKS[key].color,4);rect(c,-102,-73,204,137,16,INK,3);heart(c,0,-8,39,CORAL);line(c,'M-252-23v61M247-22v61',PAPER,10);c.restore();
    star(c,w*.17,h*.25,w*.025,LIME,2);star(c,w*.85,h*.3,w*.023,CORAL,2);c.save();c.translate(w*.12,h*.66);c.rotate(-.13);rect(c,-28,-18,56,36,5,PAPER,2);c.fillStyle=INK;c.font='bold 15px Arial';c.textAlign='center';c.fillText('408',0,5);c.restore();
    mask(c,key,demoRig(w,h,time,motion),{effects:true,wildness:.6,...opts,time,motion});
  }
  function thumbnail(canvas,key){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);const r={x:canvas.width/2,y:canvas.height*.61,width:canvas.width*.48,height:canvas.height*.53,angle:-.025,yaw:0,mouth:0,smile:.6,blinkLeft:0,blinkRight:0,brow:0};mask(c,key,r);}
  root.A408XFaceArt={LOOKS,WORLDS,cover,project,usable,rig,smooth,mask,demo,demoRig,thumbnail};
})(typeof window==='undefined'?globalThis:window);
