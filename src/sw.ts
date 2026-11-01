/// <reference lib="webworker" />
// Service Worker: macht die App offline nutzbar und installierbar.
//
// Alle Dateien werden beim ersten Laden im Browser-Cache abgelegt (cache first). Die Seite selbst
// (index.html) wird zuerst frisch geholt, damit Updates ankommen; ohne Netz kommt sie aus dem Cache.
// Jede neue Version hat einen eigenen Cache-Namen; alte Caches werden beim Aktivieren gelöscht.

export {};
declare const self: ServiceWorkerGlobalScope;
declare const VERSION: string;

const CACHE = `laesehjaelper-${VERSION}`;
const SHELL = ["./", "index.html", "manifest.webmanifest", "tesseract.min.js", "worker.min.js", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("laesehjaelper-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(req: Request): Promise<Response> {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req: Request): Promise<Response> {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (await caches.match("index.html")) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // Schriften von Google Fonts ebenfalls zwischenspeichern
    if (/(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req));
    return;
  }
  e.respondWith(req.mode === "navigate" ? networkFirst(req) : cacheFirst(req));
});
