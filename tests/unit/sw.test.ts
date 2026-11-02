import { expect, it } from "vitest";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";

const origin = "https://reader.test";
const urlOf = (request: Request | string) => new URL(typeof request === "string" ? request : request.url, origin + "/").href;

/** Cache Storage and the network form the browser boundaries; the real worker handles its events. */
async function worker() {
  const stores = new Map<string, Map<string, Response>>();
  const cache = (name: string) => {
    let data = stores.get(name);
    if (!data) { data = new Map(); stores.set(name, data); }
    const entries = data;
    return {
      keys: async () => [...entries.keys()].map(url => new Request(url)),
      match: async (request: Request | string) => entries.get(urlOf(request))?.clone(),
      put: async (request: Request | string, response: Response) => { entries.set(urlOf(request), response.clone()); },
      addAll: async (requests: (Request | string)[]) => {
        for (const request of requests) entries.set(urlOf(request), new Response("fresh " + urlOf(request)));
      },
    };
  };
  const caches = {
    open: async (name: string) => cache(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (request: Request | string) => {
      for (const name of stores.keys()) { const hit = await cache(name).match(request); if (hit) return hit; }
    },
  };
  const old = await caches.open("laesehjaelper-old");
  for (const path of ["lang/dan.js", "opencv.js", "core/tesseract-core-lstm.wasm.js", "https://fonts.gstatic.com/test.woff2"]) {
    await old.put(path, new Response("old " + path));
  }
  const handlers = new Map<string, (event: object) => void>();
  const source = await build({ entryPoints: ["src/sw.ts"], bundle: true, write: false, format: "iife", define: { VERSION: '"new"' } });
  let offline = false;
  runInNewContext(source.outputFiles[0].text, {
    caches, Request, Response, URL,
    fetch: async (request: Request | string) => {
      if (offline) throw new TypeError("offline");
      return new Response("fresh " + urlOf(request));
    },
    self: { location: { origin }, skipWaiting: async () => {}, clients: { claim: async () => {} }, addEventListener: (name: string, handler: (event: object) => void) => handlers.set(name, handler) },
  });
  const fire = async (name: string) => {
    let pending: Promise<unknown> | undefined;
    handlers.get(name)!({ waitUntil: (work: Promise<unknown>) => { pending = work; } });
    await pending;
  };
  return { caches, fire, goOffline: () => { offline = true; }, fetch: async (path: string) => {
    let response: Promise<Response> | undefined;
    handlers.get("fetch")!({ request: new Request(urlOf(path)), respondWith: (work: Promise<Response>) => { response = work; } });
    return response!;
  } };
}

it("Keeps loaded OCR resources and fonts after an offline update", async () => {
  const w = await worker();
  await w.fire("install"); await w.fire("activate"); w.goOffline();
  for (const path of ["lang/dan.js", "opencv.js", "core/tesseract-core-lstm.wasm.js"]) {
    expect(await (await w.fetch(path)).text()).toBe("fresh " + urlOf(path));
  }
  expect(await (await w.fetch("https://fonts.gstatic.com/test.woff2")).text()).toBe("old https://fonts.gstatic.com/test.woff2");
  expect(await w.caches.keys()).toEqual(["laesehjaelper-new"]);
});

it("Keeps the previous cache when refreshing an update fails", async () => {
  const w = await worker(); w.goOffline();
  await expect(w.fire("install")).rejects.toThrow("offline");
  expect(await (await w.caches.match("lang/dan.js"))!.text()).toBe("old lang/dan.js");
  expect(await w.caches.keys()).toContain("laesehjaelper-old");
});
