const CACHE = "evidenta-ofiter-v107";
const GENERATED_CACHE = "evidenta-ofiter-generated-v12";

const CORE_ASSETS = [
  "./","./index.html","./styles.css?v=2","./generated/mobile-bundle.css","./dashboard-shell.css","./access-gate.css","./clean-learning.css","./access-gate.js",
  "./data-core.js?v=2","./bootstrap.js?v=2","./persistence-layer.js","./generated/runtime-bundle.js?v=2",
  "./generated/controllers/interview.js","./generated/controllers/legislation.js","./generated/controllers/official.js",
  "./heavy-data-loader.js","./legislation-virtual.js","./scenario-questions.js","./scenario-questions.css",
  "./manifest.webmanifest","./icon.svg","./icon-192.png","./apple-touch-icon.png"
];

self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key!==GENERATED_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});

self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:"no-store"});
        if(response.ok){
          const copy=response.clone();
          await caches.open(CACHE).then(cache=>cache.put("./index.html",copy)).catch(()=>{});
        }
        return response;
      }catch{
        return await caches.match("./index.html")||Response.error();
      }
    })());return;
  }
  if(url.pathname.includes("/generated/")&&url.pathname.endsWith(".json")){
    event.respondWith(caches.open(GENERATED_CACHE).then(async cache=>{const cached=await cache.match(request);const update=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone()).catch(()=>{});return response}).catch(()=>null);return cached||update}));return;
  }
  event.respondWith(caches.match(request).then(cached=>{if(cached)return cached;return fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}return response})}));
});
