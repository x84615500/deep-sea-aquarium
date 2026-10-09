(function(root){
'use strict';
const TRACK={title:'深海夜曲',url:'./assets/audio/deep-sea-nocturne-ambient.mp3',seconds:192};
function create(_context,{createAudio=()=>new Audio(),onStatus=()=>{},createFallback=()=>root.AquariumScore?root.AquariumScore.create():null}={}){
 const media=createAudio();media.src=TRACK.url;media.loop=true;media.preload='auto';media.volume=.8;media.muted=false;media.playsInline=true;
 media.setAttribute('playsinline','');media.setAttribute('webkit-playsinline','');
 let wanted=false,starting=null,generation=0,fallback=null,failed=false,nativeReady=false,warming=null;
 function status(value){if(wanted)onStatus(value);}
 function warm(){if(!wanted||!fallback)return Promise.resolve();if(warming)return warming;
  warming=fallback.play(media.currentTime||0).then(()=>{if(!wanted)fallback.pause();else if(!nativeReady)status('fallback');}).finally(()=>{warming=null;});return warming;
 }
 function finish(){if(!wanted||nativeReady)return;nativeReady=true;if(fallback){if(fallback.fadePause)fallback.fadePause(.8);else fallback.pause();}status('playing');}
 function recover(){if(!wanted)return Promise.resolve();failed=true;nativeReady=false;media.pause();if(!fallback){status('error');return Promise.reject(Error('no fallback'));}return warm().catch(error=>{status('error');throw error;});}
 media.addEventListener('playing',finish);
 for(const name of ['waiting','stalled'])media.addEventListener(name,()=>{if(!wanted)return;nativeReady=false;warm().catch(()=>status('loading'));});
 media.addEventListener('error',()=>{recover().catch(()=>{});});
 function play(){
  wanted=true;if(!fallback)try{fallback=createFallback();}catch(e){}
  fallback?.unlock().catch(()=>{});
  if(!nativeReady)warm().catch(()=>{});
  if(failed)return recover();if(starting)return starting;
  if(!media.paused&&!media.ended&&!media.error){if(media.readyState>=3)finish();return Promise.resolve();}
  const ticket=++generation;status('loading');if(media.error)media.load();
  let result;try{result=media.play();}catch(error){return recover();}
  const attempt=Promise.resolve(result).then(()=>{if(ticket!==generation)return;if(!wanted){media.pause();return;}finish();}).catch(error=>{
   if(ticket!==generation||!wanted)return;if(error.name==='NotAllowedError'){if(!fallback){status('blocked');throw error;}return warm().catch(()=>{status('blocked');throw error;});}return recover();
  }).finally(()=>{if(starting===attempt)starting=null;});starting=attempt;return attempt;
 }
 function pause(){wanted=false;nativeReady=false;generation++;starting=null;media.pause();fallback?.pause();}
 return {play,pause,track:TRACK};
}
const api={create,TRACK};if(typeof module!=='undefined')module.exports=api;else root.AquariumMusic=api;
})(typeof window!=='undefined'?window:globalThis);
