"use strict";
var cv=document.getElementById("stage"),ctx=cv.getContext("2d");
var W=0,H=0,DPR=1;
var cleanC,cctx,dirtC,dctx,wetC,wctx,vigC;
var drops=[],splashes=[],mists=[];
var mouse={x:0,y:0},lastMove=-1e9,T=0,last=performance.now();
var frame={nx:0,ny:0};
var meterC=document.createElement("canvas");meterC.width=160;meterC.height=100;
var meterG=meterC.getContext("2d",{willReadFrequently:true});
function R(a,b){return a+Math.random()*(b-a);}
function mkCanvas(){var c=document.createElement("canvas");c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);var g=c.getContext("2d");g.setTransform(DPR,0,0,DPR,0,0);return[c,g];}
function rr(g,x,y,w,h,r){g.beginPath();if(g.roundRect){g.roundRect(x,y,w,h,r);}else{g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}}
function sizeAll(){
 DPR=Math.min(window.devicePixelRatio||1,1.5);W=window.innerWidth;H=window.innerHeight;
 cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);
 var t;
 t=mkCanvas();cleanC=t[0];cctx=t[1];
 t=mkCanvas();dirtC=t[0];dctx=t[1];
 t=mkCanvas();wetC=t[0];wctx=t[1];
 paintClean();paintDirt();
 t=mkCanvas();vigC=t[0];
 var g=t[1],rg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
 rg.addColorStop(0,"rgba(0,0,0,0)");rg.addColorStop(1,"rgba(0,0,0,.5)");
 g.fillStyle=rg;g.fillRect(0,0,W,H);
 if(!mouse.x){mouse.x=W*.6;mouse.y=H*.4;}
 frame.nx=W*.1;frame.ny=H*.85;
}
function paintClean(){
 var g=cctx;
 var base=g.createLinearGradient(0,0,0,H);
 base.addColorStop(0,"#ccd1d7");base.addColorStop(1,"#aab2bb");
 g.fillStyle=base;g.fillRect(0,0,W,H);
 var P=Math.max(180,Math.round(W/6));
 g.lineWidth=2;g.strokeStyle="rgba(70,80,92,.30)";
 for(var x=P;x<W;x+=P){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
 for(var y=P;y<H;y+=P){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 g.lineWidth=1;g.strokeStyle="rgba(255,255,255,.20)";
 for(var x2=P+1;x2<W;x2+=P){g.beginPath();g.moveTo(x2,0);g.lineTo(x2,H);g.stroke();}
 for(var y2=P+1;y2<H;y2+=P){g.beginPath();g.moveTo(0,y2);g.lineTo(W,y2);g.stroke();}
 var n=Math.round(W*H/150);
 for(var i=0;i<n;i++){g.fillStyle="rgba(60,70,80,"+R(.02,.09)+")";g.fillRect(R(0,W),R(0,H),R(1,2),R(1,2));}
 for(var j=0;j<14;j++){var sx=R(0,W),sy=R(0,H),sr=R(60,220);
  var sg=g.createRadialGradient(sx,sy,0,sx,sy,sr);
  sg.addColorStop(0,"rgba(90,100,110,"+R(.03,.07)+")");sg.addColorStop(1,"rgba(90,100,110,0)");
  g.fillStyle=sg;g.beginPath();g.arc(sx,sy,sr,0,7);g.fill();}
 var fs=Math.min(W/13.5,120);
 g.textAlign="center";g.textBaseline="middle";g.fillStyle="rgba(42,53,63,.92)";
 function fit(txt,yy,f){var s=f;g.font="800 "+s+"px system-ui,-apple-system,'Segoe UI',sans-serif";
  while(g.measureText(txt).width>W*.84&&s>12){s-=2;g.font="800 "+s+"px system-ui,-apple-system,'Segoe UI',sans-serif";}
  g.fillText(txt,W/2,yy);}
 fit("Your website should work harder",H*.38,fs);
 fit("than your pressure washer",H*.38+fs*1.25,fs);
 g.font="700 "+Math.max(16,fs*.22)+"px system-ui,-apple-system,'Segoe UI',sans-serif";
 g.fillStyle="#f6821f";g.fillText("\u25C8 Instant quotes · booked while you're on the wand",W/2,H*.38+fs*2.5);
}
function paintDirt(){
 var g=dctx;g.clearRect(0,0,W,H);
 g.fillStyle="#2a2e28";g.fillRect(0,0,W,H);
 for(var i=0;i<46;i++){var x=R(0,W),y=R(0,H),r=R(60,260);
  var col=Math.random()<.7?"0,0,0":"84,102,74";
  var sg=g.createRadialGradient(x,y,0,x,y,r);
  sg.addColorStop(0,"rgba("+col+","+R(.06,.18)+")");sg.addColorStop(1,"rgba("+col+",0)");
  g.fillStyle=sg;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
 for(var d=0;d<30;d++){var dx=R(0,W),dy=R(0,H*.7),len=R(120,520),w=R(5,22);
  var dg=g.createLinearGradient(0,dy,0,dy+len);
  dg.addColorStop(0,"rgba(10,12,9,"+R(.10,.22)+")");dg.addColorStop(1,"rgba(10,12,9,0)");
  g.fillStyle=dg;g.fillRect(dx,dy,w,len);}
 for(var m=0;m<26;m++){var mx=R(0,W),my=R(H*.3,H),mr=R(18,70);
  var mg=g.createRadialGradient(mx,my,0,mx,my,mr);
  mg.addColorStop(0,"rgba(96,124,74,"+R(.10,.22)+")");mg.addColorStop(1,"rgba(96,124,74,0)");
  g.fillStyle=mg;g.beginPath();g.arc(mx,my,mr,0,7);g.fill();}
 var n=Math.round(W*H/60);
 for(var s=0;s<n;s++){var a=R(.05,.25);
  g.fillStyle=Math.random()<.85?"rgba(12,14,11,"+a+")":"rgba(120,126,110,"+(a*.6)+")";
  g.fillRect(R(0,W),R(0,H),R(1,2.4),R(1,2.4));}
 drops.length=0;splashes.length=0;mists.length=0;
 if(wctx)wctx.clearRect(0,0,W,H);
}
function erase(x,y,pow){
 var g=dctx;g.globalCompositeOperation="destination-out";
 var r=(20+Math.random()*16)*pow;
 var rg=g.createRadialGradient(x,y,r*.15,x,y,r);
 rg.addColorStop(0,"rgba(0,0,0,.95)");rg.addColorStop(.65,"rgba(0,0,0,.6)");rg.addColorStop(1,"rgba(0,0,0,0)");
 g.fillStyle=rg;g.beginPath();g.arc(x,y,r,0,7);g.fill();
 for(var i=0;i<9;i++){var a=Math.random()*6.2832,d=r*(0.65+Math.random()*1.3);
  g.fillStyle="rgba(0,0,0,"+R(.35,.75)+")";
  g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,R(1.5,6.5)*pow,0,7);g.fill();}
 for(var i2=0;i2<3;i2++){var dx=x+R(-14,14),len=R(50,150)*pow,w=R(3,9);
  var dg=g.createLinearGradient(0,y,0,y+len);
  dg.addColorStop(0,"rgba(0,0,0,.55)");dg.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=dg;g.fillRect(dx-w/2,y,w,len);}
 g.globalCompositeOperation="source-over";
 if(wctx){wctx.fillStyle="rgba(110,155,195,.15)";wctx.beginPath();wctx.arc(x,y,r*1.2,0,7);wctx.fill();}
}
function drawNozzle(g,x,y,ang){
 g.save();g.translate(x,y);g.rotate(ang);
 var gl=g.createRadialGradient(0,0,0,0,0,26);
 gl.addColorStop(0,"rgba(170,220,255,.5)");gl.addColorStop(1,"rgba(170,220,255,0)");
 g.fillStyle=gl;g.beginPath();g.arc(0,0,26,0,7);g.fill();
 var tube=g.createLinearGradient(0,-6,0,6);
 tube.addColorStop(0,"#eef3f7");tube.addColorStop(.5,"#9aa6b1");tube.addColorStop(1,"#525d66");
 g.fillStyle=tube;rr(g,6,-5,96,10,5);g.fill();
 g.fillStyle="#f6821f";rr(g,58,-6,26,12,4);g.fill();
 g.fillStyle="#2c3138";rr(g,96,-9,34,18,6);g.fill();
 g.fillStyle="#f6821f";rr(g,100,-14,16,6,2);g.fill();
 g.strokeStyle="#1d2126";g.lineWidth=7;g.lineCap="round";
 g.beginPath();g.moveTo(128,0);g.quadraticCurveTo(152,20,176,30);g.stroke();
 g.restore();
}
function frameLoop(now){
 var dt=Math.min(.033,(now-last)/1000);last=now;T+=dt;
 var idle=now-lastMove>2400;
 var tx,ty;
 if(idle){tx=W*.5+Math.sin(T*.55)*W*.33;ty=H*.42+Math.sin(T*.87+1.3)*H*.2;}
 else{tx=mouse.x;ty=mouse.y;}
 tx=Math.max(10,Math.min(W-10,tx));ty=Math.max(10,Math.min(H-10,ty));
 var wantX=tx-230,wantY=ty+170;
 frame.nx+=(wantX-frame.nx)*Math.min(1,dt*6);
 frame.ny+=(wantY-frame.ny)*Math.min(1,dt*6);
 var ang=Math.atan2(ty-frame.ny,tx-frame.nx)+R(-.012,.012);
 var tipX=frame.nx+Math.cos(ang)*70,tipY=frame.ny+Math.sin(ang)*70;
 erase(tx,ty,1);
 var cnt=Math.max(1,Math.round(26*dt*60));
 for(var i=0;i<cnt;i++){var a=ang+R(-.045,.045),sp=R(2300,3100);
  drops.push({x:tipX,y:tipY,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:R(.16,.28),ml:.28});}
 var i2,k;
 for(i2=drops.length-1;i2>=0;i2--){var p=drops[i2];p.life-=dt;
  if(p.life<=0){
   for(k=0;k<3;k++){var sa=ang+R(-1.1,1.1),ss=R(180,760);
    splashes.push({x:p.x,y:p.y,vx:Math.cos(sa)*ss,vy:Math.sin(sa)*ss-R(0,220),life:R(.12,.3),ml:.3});}
   if(Math.random()<.3)mists.push({x:p.x,y:p.y,r:R(6,14),vr:R(30,80),life:R(.3,.6),ml:.6});
   drops.splice(i2,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=3400*dt;}
 if(drops.length>900)drops.splice(0,drops.length-900);
 for(i2=splashes.length-1;i2>=0;i2--){var q=splashes[i2];q.life-=dt;
  if(q.life<=0||q.y>H+20){splashes.splice(i2,1);continue;}
  q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=3000*dt;}
 for(i2=mists.length-1;i2>=0;i2--){var mm=mists[i2];mm.life-=dt;
  if(mm.life<=0){mists.splice(i2,1);continue;}
  mm.r+=mm.vr*dt;mm.y-=14*dt;}
 if(mists.length>140)mists.splice(0,mists.length-140);
 wctx.globalCompositeOperation="destination-out";
 wctx.fillStyle="rgba(0,0,0,0.012)";wctx.fillRect(0,0,W,H);
 wctx.globalCompositeOperation="source-over";
 ctx.drawImage(cleanC,0,0,W,H);
 ctx.drawImage(dirtC,0,0,W,H);
 ctx.drawImage(wetC,0,0,W,H);
 for(i2=0;i2<mists.length;i2++){var m2=mists[i2],ma=Math.max(0,m2.life/m2.ml)*.16;
  var mg2=ctx.createRadialGradient(m2.x,m2.y,0,m2.x,m2.y,m2.r);
  mg2.addColorStop(0,"rgba(225,240,250,"+ma+")");mg2.addColorStop(1,"rgba(225,240,250,0)");
  ctx.fillStyle=mg2;ctx.beginPath();ctx.arc(m2.x,m2.y,m2.r,0,7);ctx.fill();}
 ctx.lineCap="round";
 ctx.lineWidth=1.6;
 for(i2=0;i2<drops.length;i2++){var d2=drops[i2],da=Math.max(0,d2.life/d2.ml)*.55;
  ctx.strokeStyle="rgba(198,230,252,"+da+")";
  ctx.beginPath();ctx.moveTo(d2.x,d2.y);ctx.lineTo(d2.x-d2.vx*.012,d2.y-d2.vy*.012);ctx.stroke();}
 ctx.lineWidth=1.2;
 for(i2=0;i2<splashes.length;i2++){var s2=splashes[i2],sa2=Math.max(0,s2.life/s2.ml)*.5;
  ctx.strokeStyle="rgba(214,240,252,"+sa2+")";
  ctx.beginPath();ctx.moveTo(s2.x,s2.y);ctx.lineTo(s2.x-s2.vx*.01,s2.y-s2.vy*.01);ctx.stroke();}
 ctx.drawImage(vigC,0,0,W,H);
 drawNozzle(ctx,frame.nx,frame.ny,ang);
 requestAnimationFrame(frameLoop);
}
window.addEventListener("pointermove",function(e){mouse.x=e.clientX;mouse.y=e.clientY;lastMove=performance.now();});
window.addEventListener("resize",sizeAll);
document.getElementById("reset").addEventListener("click",paintDirt);
window.addEventListener("keydown",function(e){if(e.key==="r"||e.key==="R")paintDirt();});
setInterval(function(){
 try{
  meterG.clearRect(0,0,160,100);
  meterG.drawImage(dirtC,0,0,160,100);
  var data=meterG.getImageData(0,0,160,100).data;
  var tot=0,hit=0;
  for(var i=0;i<data.length;i+=16){tot++;if(data[i+3]<110)hit++;}
  var pc=Math.round(hit/tot*100);
  document.getElementById("pct").textContent=pc>=92?"wall cleaned · spotless \u2713":("wall cleaned · "+pc+"%");
  document.getElementById("barfill").style.width=pc+"%";
 }catch(e){}
},600);
sizeAll();
requestAnimationFrame(frameLoop);