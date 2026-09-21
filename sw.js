const PREFIX='akari-'+self.registration.scope, CACHE=PREFIX+'v4';
const FILES=['./','./index.html','./style.css','./app.js','./engine.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;try{return await fetch(event.request)}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error}}))});

