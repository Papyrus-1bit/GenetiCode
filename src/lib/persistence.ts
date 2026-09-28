import type { GenealogyState } from "./types";
import { createSeedState } from "./seed";
import { migrateState } from "./migrations";

const DB_NAME = "rodoslovnaya-vovy";
const STORE = "state";
const KEY = "current";
const BACKUP_KEY = "rodoslovnaya-vovy-state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(): Promise<unknown | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(state: GenealogyState): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(state, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadState(): Promise<GenealogyState> {
  const fromIdb = await idbGet();
  if (fromIdb) return migrateState(fromIdb);
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) return migrateState(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return migrateState(createSeedState());
}

export async function saveState(state: GenealogyState): Promise<void> {
  await idbSet(state);
  try {
    const lite = { ...state, photos: {} as Record<string, string> };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(lite));
  } catch {
    /* quota */
  }
}
