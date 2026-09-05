const CACHE = "evidenta-ofiter-v113"; // upgrade from evidenta-ofiter-v112
const GENERATED_CACHE = "evidenta-ofiter-generated-v15";
const CACHE_PREFIX = "evidenta-ofiter-";

const CORE_ASSETS = [
  "./","./index.html","./styles.css?v=2","./generated/mobile-bundle.css","./dashboard-shell.css","./access-gate.css","./clean-learning.css","./access-gate.js",
  "./data-core.js?v=2","./bootstrap.js?v=3","./bootstrap.js?v=4","./persistence-layer.js","./heavy-data-loader.js","./heavy-data-loader.js?v=2","./data-health.js","./data-health.js?v=2","./data-health.js?v=3","./data-health.js?v=4","./generated/runtime-bundle.js?v=3","./dashboard-cockpit.js?v=1",
  "./generated/controllers/interview.js","./generated/controllers/interview.js?v=2","./generated/controllers/legislation.js?v=3","./generated/controllers/legislation.js?v=4","./generated/controllers/official.js","./generated/controllers/official.js?v=2",
  "./exam-training.css","./exam-training.css?v=2","./exam-training.js","./exam-training.js?v=2","./functional-fixes.js","./functional-fixes.js?v=2",
  "./calculation-engine.css","./calculation-engine.css?v=2","./calculation-engine.js","./calculation-engine.js?v=2","./calculation-age-cases.js","./calculation-age-cases.js?v=2",
  "./legislation-virtual.js?v=2","./scenario-questions.js","./scenario-questions.css",
  "../css/final-layer.css?v=1",
  "./manifest.webmanifest","./icon.svg","./icon-192.png","./apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});

async function rewriteNavigationResponse(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  const html=(await response.text()).replace(/bootstrap\.js\?v=3/g,"bootstrap.js?v=4");
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const obsolete=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE&&key!==GENERATED_CACHE);
    await Promise.all(obsolete.map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    await Promise.all(clients.map(client=>client.navigate(client.url).catch(()=>null)));
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const network=await fetch(request,{cache:"no-store"});
        const response=await rewriteNavigationResponse(network);
        if(response?.ok){
          const copy=response.clone();
          await caches.open(CACHE).then(cache=>cache.put("./index.html",copy)).catch(()=>{});
        }
        return response;
      }catch{
        const cached=await caches.match("./index.html");
        return cached?await rewriteNavigationResponse(cached):Response.error();
      }
    })());return;
  }
  if(url.pathname.endsWith("/data-health.js")&&["2","3"].includes(url.searchParams.get("v"))){
    event.respondWith(fetch("./data-health.js?v=4",{cache:"no-store"}).catch(()=>caches.match("./data-health.js?v=4").then(cached=>cached||Response.error())));return;
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
