const ROOT=new URL('./',self.location.href).href;
const PREFIX='suishou-app-'+encodeURIComponent(new URL(ROOT).pathname)+'-';
const CACHE=PREFIX+'v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./ledger.mjs','./favicon.svg'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of ASSETS){const url=new URL(path,ROOT).href,response=await fetch(url,{cache:'reload'});if(!response.ok||response.redirected)throw Error('Cannot cache app asset');await cache.put(url,response);}await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;const allowed=ASSETS.map(path=>new URL(path,ROOT).href);if(!allowed.includes(url.href))return;event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok&&!response.redirected){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}catch(error){const cache=await caches.open(CACHE),cached=await cache.match(event.request);if(cached)return cached;throw error;}})());});
