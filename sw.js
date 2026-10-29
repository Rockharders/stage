// Stagehand offline: die App (eine Datei) liegt zusätzlich im Gerätespeicher.
// Online kommt immer die neueste Fassung aus dem Netz (und ersetzt die gespeicherte),
// ohne Netz – oder wenn es zu lange dauert – die gespeicherte. Songs, Daten und Audio liegen ohnehin im Gerät.
const CACHE = "stagehand-app";
const WAIT = 4000;   // ms, danach die gespeicherte Fassung nehmen

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const fromNet = fetch(req, { cache: "no-store" }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  });
  const fromCache = () => caches.match(req).then((r) => r || caches.match("./index.html"));
  const slow = new Promise((res) => setTimeout(res, WAIT)).then(fromCache);
  e.respondWith(Promise.race([fromNet, slow.then((r) => r || fromNet)]).catch(fromCache));
});
