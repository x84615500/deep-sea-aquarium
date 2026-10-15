(function(root){
'use strict';
function create(doc,timers){
 const view=doc.defaultView||root;
 const clock=timers||{
  set:(...args)=>view.setTimeout(...args),
  clear:id=>view.clearTimeout(id)
 };
 let active=false,timer=null;const body=doc.body;
 function stop(){active=false;if(timer!==null)clock.clear(timer);timer=null;body.classList.remove('frame-idle','frame-keyboard');}
 function reveal(keyboard=false){if(!active)return;if(timer!==null)clock.clear(timer);body.classList.remove('frame-idle');body.classList.toggle('frame-keyboard',keyboard);timer=keyboard?null:clock.set(()=>{timer=null;if(active)body.classList.add('frame-idle');},4500);}
 function start(){active=true;reveal();}
 doc.addEventListener('pointermove',()=>reveal(),{passive:true});
 doc.addEventListener('pointerdown',()=>reveal(),{passive:true});
 doc.addEventListener('keydown',()=>reveal(true));
 doc.addEventListener('focusin',e=>{if(e.target.closest?.('#frameControls'))reveal(true);});
 return {start,stop,reveal};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else root.FrameUI=api;
})(typeof window!=='undefined'?window:globalThis);
