(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const range=(r,a,b)=>a+(b-a)*r();
function create(r=Math.random){return {x:range(r,.12,.82),y:range(r,.14,.7),vx:0,vy:0,tx:range(r,.1,.9),ty:range(r,.08,.8),pace:range(r,.035,.065),plan:range(r,4,9),idle:0,lookIn:range(r,10,35),lookTime:0,pose:0,wink:false,heading:r()>.5?1:-1,facing:1,bank:0,clock:range(r,0,10)};}
function displaySize(stage,mermaid,count,width,height,viewing){
 const density=Math.max(.68,1-Math.max(0,count-7)*.035);
 const base=mermaid?108+stage*15:(48+stage*10)*1.25;
 const areaBudget=Math.sqrt(width*Math.max(1,height-35)*.32/Math.max(1,count)/(mermaid?941/1672:.75));
 return Math.max(20,Math.min(base*(viewing?1.45:1)*density,areaBudget,width*(mermaid?.35:.22),(height-35)*(mermaid?.48:.35)));
}
function dimensions(env){const w=env.size,h=env.heightSize||w*.75;return {w,h,spanX:Math.max(1,env.width-w),spanY:Math.max(1,env.height-h-35)};}
function box(p,env){const {w,h,spanX,spanY}=dimensions(env);return {cx:p.x*spanX+w/2,cy:p.y*spanY+h/2,w,h};}
function separation(p,env){
 if(!env||!env.neighbors)return {x:0,y:0};
 const me=box(p,env);let sx=0,sy=0;
 for(const q of env.neighbors){if(q.id===env.id)continue;
  const rx=(me.w+(q.w||q.size))*.62+22,ry=(me.h+(q.h||q.size*.75))*.60+18;
  let dx=(me.cx-q.cx)/rx,dy=(me.cy-q.cy)/ry,d=Math.hypot(dx,dy);
  if(d<1.45){if(d<.01){const a=env.id<q.id?-.8:2.34;dx=Math.cos(a);dy=Math.sin(a);d=.01;}
   const length=Math.hypot(dx,dy),strength=Math.min(1,(1.45-d)/1.05);
   sx+=dx/length*strength*.15;sy+=dy/length*strength*.15;
  }
 }
 const total=Math.hypot(sx,sy);if(total>.16){sx*=.16/total;sy*=.16/total;}
 return {x:sx,y:sy};
}
function portrait(p){
 const turn=Math.abs(p.facing);
 // Crossfade the side and front drawings through the turn so their silhouettes
 // stay present instead of shrinking and popping between two poses.
 const turnFront=clamp((.88-turn)/.38,0,1);
 const front=Math.max(turnFront,clamp(p.pose,0,1));
 const side=1-front;
 const scale=(p.facing<0?-1:1)*(.58+.42*turn);
 return {front,side,scale};
}
function chooseTarget(p,r,env){
 let best=-Infinity,bx=p.tx,by=p.ty;
 for(let i=0;i<48;i++){const x=range(r,.04,.94),y=range(r,.08,.88);let crowd=0;
  if(env){const at=box({x,y},env);for(const q of env.neighbors){if(q.id===env.id)continue;
   const d=Math.hypot((at.cx-q.cx)/env.width,(at.cy-q.cy)/env.height);
   crowd+=Math.exp(-d*d/.035);
  }}
  const travel=Math.hypot(x-p.x,(y-p.y)*.8);const score=-crowd+Math.min(.5,travel)*.6-(travel<.18?.5:0);
  if(score>best){best=score;bx=x;by=y;}
 }
 p.tx=bx;p.ty=by;p.pace=range(r,.033,.052);
 p.plan=clamp(Math.hypot(bx-p.x,by-p.y)/p.pace+2,8,24);
}
function gemLayout(gems){const placed=[];for(const gem of gems){let seed=2166136261;for(const c of gem.id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;const r=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);let best=-1,x=50,bottom=7;for(let k=0;k<20;k++){const nx=range(r,6,92),ny=range(r,5,13);let gap=Infinity;for(const q of placed)gap=Math.min(gap,Math.hypot(nx-q.x,(ny-q.bottom)*3));if(gap>best){best=gap;x=nx;bottom=ny;}}placed.push({x,bottom,size:range(r,20,27),delay:range(r,-3,0)});}return placed;}
function step(p,dt,r=Math.random,food=null,env=null){
 dt=clamp(dt,0,.05);if(!dt)return p;p.clock+=dt;p.lookIn-=dt;
 if(p.lookTime>0){p.lookTime=Math.max(0,p.lookTime-dt);if(p.lookTime===0)p.lookIn=range(r,40,90);}
 else if(p.lookIn<=0&&!food){p.lookTime=1.9;p.idle=0;}
 const looking=p.lookTime>0;
 p.pose+=(Number(looking)-p.pose)*Math.min(1,dt*7);
 p.wink=looking&&p.lookTime<1.12&&p.lookTime>.78;
 p.plan-=dt;p.idle=Math.max(0,p.idle-dt);
 if(!looking&&!food&&(p.plan<=0||Math.hypot(p.tx-p.x,p.ty-p.y)<.07)){chooseTarget(p,r,env);if(r()<.12)p.idle=range(r,.6,1.4);}
 let targetX=p.tx,targetY=p.ty;if(food){targetX=food.x;targetY=food.y;p.idle=0;}
 if(!food&&!looking){targetX+=Math.sin(p.clock*.63)*.022;targetY+=Math.sin(p.clock*.47+1.5)*.028;}
 const dx=targetX-p.x,dy=targetY-p.y,d=Math.hypot(dx,dy);const speed=looking||p.idle>0?0:p.pace*(food?1.45:1)*Math.min(1,d/.09);
 const avoid=separation(p,env);let desiredX=(d>.005?dx/d*speed:0)+avoid.x,desiredY=(d>.005?dy/d*speed:0)+avoid.y;
 const combined=Math.hypot(desiredX,desiredY);if(combined>.105){desiredX*=.105/combined;desiredY*=.105/combined;}
 p.vx+=(desiredX-p.vx)*Math.min(1,dt*3);p.vy+=(desiredY-p.vy)*Math.min(1,dt*3);
 p.x=clamp(p.x+p.vx*dt,.025,.95);p.y=clamp(p.y+p.vy*dt,.035,.90);
 if(Math.abs(p.vx)>.003)p.heading=p.vx>0?1:-1;
 // Orientation blends through a front portrait rather than flattening the silhouette.
 p.facing+=(-p.heading-p.facing)*Math.min(1,dt*5);
 const roll=looking?0:clamp(p.vy*110*p.heading,-8,8);p.bank+=(roll-p.bank)*Math.min(1,dt*4);
 return p;
}
const api={displaySize,box,chooseTarget,create,step,separation,portrait,gemLayout};if(typeof module!=='undefined')module.exports=api;else root.FishSwim=api;
})(typeof window!=='undefined'?window:globalThis);
