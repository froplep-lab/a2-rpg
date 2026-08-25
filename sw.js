const CACHE='gestalt-v0.028';
const SHELL=['./','./index.html','./css/main.css','./js/app.js','./data/book-vocabulary-manifest.json','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(async cache=>{
    for(const url of SHELL){try{await cache.add(url)}catch{}}
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function networkFirst(request){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{});}
    return response;
  }catch{
    const cached=await caches.match(request);
    if(cached)return cached;
    throw new Error('network unavailable');
  }
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.endsWith('/data/words.json')||u.pathname.endsWith('/data/words.compact.json')){
    e.respondWith(networkFirst(e.request));return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c)).catch(()=>{});}
    return r;
  }).catch(()=>caches.match('./index.html'))));
});
