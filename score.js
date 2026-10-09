(function(root){
'use strict';
function create({getContext=()=>new (root.AudioContext||root.webkitAudioContext)(),events=root.AquariumScoreData,setTimer=setInterval,clearTimer=clearInterval,setDelay=setTimeout,clearDelay=clearTimeout}={}){
 let fading=null,wanted=false,context=null,timer=null,offset=0,epoch=0,cursor=0,cycle=0,master=null;const voices=new Set(),period=192;
 function unlock(){try{if(!context){context=getContext();master=context.createGain();master.gain.value=.1512;master.connect(context.destination);
  const delay=context.createDelay(1),wet=context.createGain();delay.delayTime.value=.431;wet.gain.value=.16;master.connect(delay);delay.connect(wet);wet.connect(context.destination);}
 return context.state==='running'?Promise.resolve():context.resume();}catch(e){return Promise.reject(e);}}
 function note(e,time){const [m,,length,amp,kind,pan]=e;const osc=context.createOscillator(),gain=context.createGain();
  osc.type=kind==='keys'?'triangle':'sine';osc.frequency.value=440*Math.pow(2,(m-69)/12);
  const attack=kind==='pad'?.9:kind==='flute'?.2:.035,peak=amp*(kind==='keys'?1.4:kind==='pad'?.8:1.1);
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(peak,time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  osc.connect(gain);let panner=null;if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(master);}else gain.connect(master);
  const voice={osc,gain,panner};voices.add(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();panner?.disconnect();voices.delete(voice);};osc.start(time);osc.stop(time+length+.02);
 }
 function schedule(){if(context.state!=='running')return;const horizon=context.currentTime+.8;
  while(epoch+cycle*period+events[cursor][1]<horizon){const time=epoch+cycle*period+events[cursor][1];if(time>=context.currentTime-.01)note(events[cursor],Math.max(time,context.currentTime+.01));cursor++;if(cursor===events.length){cursor=0;cycle++;}}
 }
 async function play(position){wanted=true;if(fading!==null){clearDelay(fading);fading=null;}await unlock();if(!wanted)return;master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(.1512,context.currentTime);if(timer!==null)return;if(Number.isFinite(position))offset=((position%period)+period)%period;epoch=context.currentTime-offset;cycle=0;cursor=events.findIndex(e=>e[1]>=offset);if(cursor<0){cursor=0;cycle=1;}schedule();timer=setTimer(schedule,250);}
 function pause(){wanted=false;if(fading!==null){clearDelay(fading);fading=null;}if(timer===null)return;offset=((context.currentTime-epoch)%period+period)%period;clearTimer(timer);timer=null;for(const v of voices){v.osc.stop();}voices.clear();}
 function fadePause(seconds=.8){if(!context||timer===null){pause();return;}if(fading!==null)clearDelay(fading);master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(master.gain.value,context.currentTime);master.gain.linearRampToValueAtTime(0,context.currentTime+seconds);fading=setDelay(()=>{fading=null;pause();},seconds*1000);}
 return {unlock,play,pause,fadePause};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else root.AquariumScore=api;
})(typeof window!=='undefined'?window:globalThis);
