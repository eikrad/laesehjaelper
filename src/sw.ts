/// <reference lib="webworker" />
// Service worker: makes the app usable offline and installable.
//
// All files enter the browser cache on first load (cache first). The page itself
// (index.html) uses the network first to receive updates, falling back to the cache when offline.
// Each new version has its own cache name; activation deletes old caches.

export {};
declare const self: ServiceWorkerGlobalScope;
declare const VERSION: string;

const CACHE = `laesehjaelper-${VERSION}`;
const SHELL = ["./", "index.html", "manifest.webmanifest", "tesseract.min.js", "worker.min.js", "pdf.js", "icon-192.png", "icon-512.png"];

async function install() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Refresh previously used languages and OCR files before activation.
  // If the network fails, the previous worker and its cache remain active.
  for (const name of await caches.keys()) {
    if (!name.startsWith("laesehjaelper-") || name === CACHE) continue;
    const previous = await caches.open(name);
    for (const req of await previous.keys()) {
      if (await cache.match(req)) continue;
      if (new URL(req.url).origin === self.location.origin) {
        const res = await fetch(req, { cache: "reload" });
        if (res.status === 404) continue; // The file was removed in the new version
        if (!res.ok) throw new Error(`Offline resource unavailable: ${req.url}`);
        await cache.put(req, res);
      } else {
        // Font URLs contain the version; preserve opaque responses too.
        const hit = await previous.match(req);
        if (hit) await cache.put(req, hit);
      }
    }
  }
  await self.skipWaiting();
}

self.addEventListener("install", (e) => {
  e.waitUntil(install());
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
    // Cache Google Fonts as well
    if (/(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req));
    return;
  }
  e.respondWith(req.mode === "navigate" ? networkFirst(req) : cacheFirst(req));
});
