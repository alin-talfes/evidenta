self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("evidenta-training")).map(key => caches.delete(key)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map(client => client.navigate(new URL("../ofiter/", self.location.href).href)));
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") event.respondWith(Response.redirect(new URL("../ofiter/", self.location.href), 302));
});
