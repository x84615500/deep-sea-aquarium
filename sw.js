const CACHE='starsea-v29',AUDIO_CACHE='starsea-music-v1';const AUDIO_LOADING=new Map();
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./style.css?v=0.29','./engine.js?v=0.29','./swim.js?v=0.29','./themes.js?v=0.29','./score-data.js?v=0.29','./score.js?v=0.29','./music.js?v=0.29','./app.js?v=0.29','./frame-ui.js?v=0.29','./assets/fish/mermaid-sheet.png','./assets/fish/mermaid-straight-sheet-v26.png','./icon.svg','./manifest.webmanifest'])));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('starsea-')&&k!==CACHE&&k!==AUDIO_CACHE).map(k=>caches.delete(k))))])));
function byteRange(value,length){const match=/^bytes=(\d*)-(\d*)$/.exec(value||'');if(!match||(!match[1]&&!match[2]))return null;let start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):length-1):length-1;if(start>=length||end<start||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return null;return {start,end:Math.min(end,length-1)};}
async function audioResponse(request){
 const headers=new Headers(request.headers);headers.delete('Range');const fullRequest=new Request(request,{headers});const cache=await caches.open(AUDIO_CACHE);let full=await cache.match(fullRequest);
 if(!full){const key=fullRequest.url;if(!AUDIO_LOADING.has(key)){const load=(async()=>{const r=await fetch(fullRequest);if(r.status===200&&(r.headers.get('Content-Type')||'').includes('audio/'))await cache.put(fullRequest,r.clone());return r;})();AUDIO_LOADING.set(key,load);load.finally(()=>AUDIO_LOADING.delete(key)).catch(()=>{});}full=(await AUDIO_LOADING.get(key)).clone();}
 if(!request.headers.has('Range')||!full.ok)return full;
 const bytes=await full.arrayBuffer(),range=byteRange(request.headers.get('Range'),bytes.byteLength);
 if(!range)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});
 const output=new Headers({'Content-Type':full.headers.get('Content-Type')||'audio/mpeg','Accept-Ranges':'bytes','Content-Range':`bytes ${range.start}-${range.end}/${bytes.byteLength}`,'Content-Length':String(range.end-range.start+1)});
 return new Response(bytes.slice(range.start,range.end+1),{status:206,headers:output});
}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 const request=e.request,path=new URL(request.url).pathname;
 if(path.includes('/assets/audio/')){e.respondWith(audioResponse(request).catch(()=>new Response('音樂尚未載入',{status:503})));return;}
 const response=fetch(request).catch(()=>caches.match(request).then(r=>r||new Response('目前離線，請連線後重新開啟。',{status:503})));e.respondWith(response);
 if(path.includes('/assets/themes/'))e.waitUntil(response.then(r=>r.ok?caches.open(CACHE).then(c=>c.put(request,r.clone())):null).catch(()=>{}));
});
