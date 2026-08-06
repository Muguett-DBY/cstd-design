import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const serviceWorkerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function createRuntime({
  network,
  cachedResponse,
  cacheNames = [],
  cacheAddError = null,
  cacheDeleteError = null,
  cacheKeysError = null,
  cachePutError = null,
}) {
  const listeners = new Map();
  const operations = {
    deletes: [],
    fetches: [],
    claims: 0,
    matches: [],
    opens: [],
    puts: [],
    skips: 0,
  };
  const cache = {
    async addAll() {
      if (cacheAddError) throw cacheAddError;
    },
    async put(request, response) {
      operations.puts.push({ request, response });
      if (cachePutError) throw cachePutError;
    },
  };
  const caches = {
    async delete(name) {
      operations.deletes.push(name);
      if (cacheDeleteError) throw cacheDeleteError;
      return true;
    },
    async keys() {
      if (cacheKeysError) throw cacheKeysError;
      return cacheNames;
    },
    async match(request) {
      operations.matches.push(request);
      return cachedResponse ? cachedResponse.clone() : undefined;
    },
    async open(name) {
      operations.opens.push(name);
      return cache;
    },
  };
  const self = {
    location: { origin: "https://workspace.example" },
    clients: { claim: async () => { operations.claims += 1; } },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    async skipWaiting() {
      operations.skips += 1;
    },
  };
  const fetch = async (request) => {
    operations.fetches.push(request);
    return network(request);
  };

  vm.runInNewContext(serviceWorkerSource, {
    URL,
    Request,
    Response,
    caches,
    console,
    fetch,
    self,
  });

  return {
    operations,
    async install() {
      let completion;
      listeners.get("install")?.({
        waitUntil(promise) {
          completion = Promise.resolve(promise);
        },
      });
      assert.ok(completion, "install handler must register waitUntil work");
      await completion;
    },
    async activate() {
      let completion;
      listeners.get("activate")?.({
        waitUntil(promise) {
          completion = Promise.resolve(promise);
        },
      });
      assert.ok(completion, "activate handler must register waitUntil work");
      await completion;
    },
    async request(request) {
      let backgroundCompletion = Promise.resolve();
      let responsePromise;
      listeners.get("fetch")?.({
        request,
        respondWith(promise) {
          responsePromise = Promise.resolve(promise);
        },
        waitUntil(promise) {
          backgroundCompletion = Promise.resolve(promise);
        },
      });
      assert.ok(responsePromise, "fetch handler must provide a response");
      const response = await responsePromise;
      await backgroundCompletion;
      return response;
    },
  };
}

test("private API responses are network-only and never replayed from Cache Storage", async () => {
  const online = createRuntime({
    network: async () => Response.json({ assets: [{ id: "private-record" }] }),
    cachedResponse: Response.json({ assets: [{ id: "stale-record" }] }),
  });
  const onlineResponse = await online.request(new Request("https://workspace.example/api/assets"));

  assert.equal(onlineResponse.status, 200);
  assert.deepEqual(online.operations.puts, []);
  assert.deepEqual(online.operations.matches, []);

  const offline = createRuntime({
    network: async () => { throw new Error("offline"); },
    cachedResponse: Response.json({ assets: [{ id: "stale-private-record" }] }),
  });
  const offlineResponse = await offline.request(new Request("https://workspace.example/api/assets"));

  assert.equal(offlineResponse.status, 503);
  assert.match(await offlineResponse.text(), /离线/);
  assert.deepEqual(offline.operations.matches, []);
});

test("document navigation prefers the network and falls back to the cached shell only offline", async () => {
  const navigation = {
    destination: "document",
    method: "GET",
    mode: "navigate",
    url: "https://workspace.example/assets",
  };
  const online = createRuntime({
    network: async () => new Response("fresh-shell"),
    cachedResponse: new Response("stale-shell"),
  });

  assert.equal(await (await online.request(navigation)).text(), "fresh-shell");
  assert.equal(online.operations.fetches.length, 1);

  const offline = createRuntime({
    network: async () => { throw new Error("offline"); },
    cachedResponse: new Response("offline-shell"),
  });

  assert.equal(await (await offline.request(navigation)).text(), "offline-shell");
  assert.equal(offline.operations.fetches.length, 1);
  assert.equal(offline.operations.matches.length, 1);
});

test("a Cache Storage write failure cannot replace a successful navigation response", async () => {
  const runtime = createRuntime({
    network: async () => new Response("fresh-despite-cache-failure"),
    cachedResponse: new Response("stale-shell"),
    cachePutError: new Error("quota exceeded"),
  });
  const navigation = {
    destination: "document",
    method: "GET",
    mode: "navigate",
    url: "https://workspace.example/assets",
  };

  assert.equal(await (await runtime.request(navigation)).text(), "fresh-despite-cache-failure");
});

test("activation removes every legacy app cache without deleting unrelated origin caches", async () => {
  const runtime = createRuntime({
    network: async () => new Response("ok"),
    cacheNames: [
      "cstd-design-static-v1",
      "cstd-design-dynamic-v1",
      "unrelated-cache",
    ],
  });

  await runtime.activate();

  assert.deepEqual(runtime.operations.deletes.sort(), [
    "cstd-design-dynamic-v1",
    "cstd-design-static-v1",
  ]);
});

test("cache storage failures cannot block the privacy worker from installing and claiming clients", async () => {
  const runtime = createRuntime({
    network: async () => new Response("ok"),
    cacheAddError: new Error("quota exceeded"),
    cacheKeysError: new Error("cache index unavailable"),
  });

  await runtime.install();
  await runtime.activate();

  assert.equal(runtime.operations.skips, 1);
  assert.equal(runtime.operations.claims, 1);
});

test("private API traffic retries cleanup of a legacy cache recreated after activation", async () => {
  const runtime = createRuntime({
    network: async () => Response.json({ ok: true }),
    cacheNames: ["cstd-design-static-v2", "cstd-design-dynamic-v1"],
  });

  await runtime.request(new Request("https://workspace.example/api/session"));

  assert.deepEqual(runtime.operations.deletes, ["cstd-design-dynamic-v1"]);
});
