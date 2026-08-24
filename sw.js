
const CACHE='gestalt-v006';
const ASSETS=['./','./index.html','./css/main.css','./css/components.css','./css/animations.css','./css/v001.css','./js/app.js','./js/v001.js','./data/words.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{
    const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}); return resp;
  }).catch(()=>cached)));
});
