import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "PaperSaveDB";
const STORE_NAME = "images";

let dbPromise: Promise<IDBPDatabase> | null = null;

interface StoredImage {
  id: string;
  blob: Blob;
  date: Date;
  isGallery?: boolean;
}

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
};

export const saveImageToDB = async (
  file: File | Blob,
  isGallery: boolean = true,
): Promise<string> => {
  const db = await initDB();
  const id = crypto.randomUUID();

  await db.put(STORE_NAME, { id, blob: file, date: new Date(), isGallery });
  return id;
};

export const loadImagesFromDB = async (): Promise<
  { id: string; url: string }[]
> => {
  const db = await initDB();
  const allItems = await db.getAll(STORE_NAME);

  return allItems
    .filter((item: StoredImage) => item.isGallery !== false) // Evitamos mostrar imágenes internas
    .map((item: StoredImage) => ({
      id: item.id,
      url: URL.createObjectURL(item.blob),
    }));
};

export const getBlobFromDB = async (id: string): Promise<Blob | undefined> => {
  const db = await initDB();
  const item = await db.get(STORE_NAME, id);
  return item?.blob;
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const clearAllImagesFromDB = async (): Promise<void> => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};

export const cleanupOrphanedImages = async (
  activeIds: string[],
): Promise<void> => {
  const db = await initDB();
  const activeSet = new Set(activeIds);
  const now = Date.now();
  const ONE_MINUTE = 60 * 1000; // 1 minuto de gracia

  const tx = db.transaction(STORE_NAME, "readwrite");
  let cursor = await tx.store.openCursor();

  while (cursor) {
    const item = cursor.value;
    const isRecent =
      item.date && now - new Date(item.date).getTime() < ONE_MINUTE;

    if (!activeSet.has(item.id) && !isRecent) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }

  await tx.done;
};
