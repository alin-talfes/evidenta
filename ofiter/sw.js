const CACHE = "evidenta-ofiter-v111";
const GENERATED_CACHE = "evidenta-ofiter-generated-v15";
const CACHE_PREFIX = "evidenta-ofiter-";

const CORE_ASSETS = [
  "./","./index.html","./styles.css?v=2","./generated/mobile-bundle.css","./dashboard-shell.css","./access-gate.css","./clean-learning.css","./access-gate.js",
  "./data-core.js?v=2","./bootstrap.js?v=3","./persistence-layer.js","./heavy-data-loader.js","./data-health.js","./generated/runtime-bundle.js?v=3","./dashboard-cockpit.js?v=1",
  "./generated/controllers/interview.js","./generated/controllers/legislation.js?v=3","./generated/controllers/official.js",
  "./legislation-virtual.js?v=2","./scenario-questions.js","./scenario-questions.css",
  "../css/final-layer.css?v=1",
  "./manifest.webmanifest","./icon.svg","./icon-192.png","./apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const obsolete=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE&&key!==GENERATED_CACHE);
    const upgrading=obsolete.length>0;
    await Promise.all(obsolete.map(key=>caches.delete(key)));
    await self.clients.claim();
    if(upgrading){
      const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
      await Promise.all(clients.map(client=>client.navigate(client.url).catch(()=>null)));
    }
  })());
});

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
    event.respondWith((async()=>{
      const cache=await caches.open(GENERATED_CACHE);
      try{
        const response=await fetch(request,{cache:"no-store"});
        if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
        return response;
      }catch{
        return await cache.match(request)||cache.match(url.pathname.split("/").pop())||Response.error();
      }
    })());return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
    }
    return response;
  })));
});
