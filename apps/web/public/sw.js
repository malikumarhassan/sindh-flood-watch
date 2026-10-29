// Cache the public app shell and immutable static assets only. API/admin responses
// are never stored here. Public evidence has separate timestamped application caches.
const CACHE='sfw-shell-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/',copy));}return response;}).catch(async()=>await caches.match('/')||new Response('Offline. Open Sindh Flood Watch once while connected to save its interface.',{headers:{'Content-Type':'text/plain'}})));
 }else if(url.pathname.startsWith('/_next/static/')){
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;})));
 }
});
