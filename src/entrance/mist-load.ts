import { CLOUD_KEY } from "./mist-cloud";

/**
 * The cloud of points of the mist, as soon as it can be had: from the browser's own storage when an earlier visit kept it
 * (a sign-in page is visited again and again), otherwise worked out in a worker (the page stays usable) and kept for next
 * time. `loadCloud` starts the work once, so it can be called early, while the picture's own code is still being fetched,
 * and again later for the same answer. It rejects when the cloud can be had neither way.
 */

const DB = "swingset";
const STORE = "cloud";

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.addEventListener("upgradeneeded", () => open.result.createObjectStore(STORE));
    open.addEventListener("success", () => resolve(open.result));
    open.addEventListener("error", () => reject(open.error));
  });
}

async function keptCloud(): Promise<Float32Array | undefined> {
  try {
    const db = await openStore();
    return await new Promise((resolve) => {
      const get = db.transaction(STORE).objectStore(STORE).get(CLOUD_KEY);
      get.addEventListener("success", () => resolve(get.result instanceof Float32Array ? get.result : undefined));
      get.addEventListener("error", () => resolve(undefined));
    });
  } catch {
    return undefined; // no storage (a private window, say): work it out every time
  }
}

async function keepCloud(places: Float32Array): Promise<void> {
  try {
    const db = await openStore();
    db.transaction(STORE, "readwrite").objectStore(STORE).put(places, CLOUD_KEY);
  } catch {
    // not kept; the next visit works it out again
  }
}

function workedOut(): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./mist-cloud.worker.ts", import.meta.url), { type: "module" });
    // the worker starts working the moment it is created and answers once
    worker.addEventListener("message", (e: MessageEvent<Float32Array>) => {
      worker.terminate();
      resolve(e.data);
    });
    worker.addEventListener("error", (e) => {
      worker.terminate();
      reject(new Error(e.message));
    });
  });
}

let pending: Promise<Float32Array> | undefined;
export function loadCloud(): Promise<Float32Array> {
  pending ??= (async () => {
    const kept = await keptCloud();
    if (kept) return kept;
    const places = await workedOut();
    void keepCloud(places);
    return places;
  })();
  return pending;
}
