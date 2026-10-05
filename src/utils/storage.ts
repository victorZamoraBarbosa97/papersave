import { openDB, type IDBPDatabase } from "idb";
import type { CropData, UploadedImage } from "../types";

const DB_NAME = "PaperSaveDB";
const STORE_NAME = "images";

let dbPromise: Promise<IDBPDatabase> | null = null;

interface StoredImage {
  id: string;
  blob: Blob;
  date: Date;
  isGallery?: boolean;
  // Metadatos de las imágenes de galería: permiten volver a editar el recorte
  // desde la foto original aunque se cierre y reabra la app.
  originalId?: string;
  cropData?: CropData;
}

interface ImageMeta {
  originalId?: string;
  cropData?: CropData;
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
  meta: ImageMeta = {},
): Promise<string> => {
  const db = await initDB();
  const id = crypto.randomUUID();

  await db.put(STORE_NAME, {
    id,
    blob: file,
    date: new Date(),
    isGallery,
    ...meta,
  });
  return id;
};

export const loadImagesFromDB = async (): Promise<UploadedImage[]> => {
  const db = await initDB();
  const allItems: StoredImage[] = await db.getAll(STORE_NAME);
  const byId = new Map(allItems.map((item) => [item.id, item]));

  return allItems
    .filter((item) => item.isGallery !== false) // Evitamos mostrar imágenes internas
    .map((item) => {
      // Si el original ya no existe, se omite la referencia en vez de dejarla rota.
      const original = item.originalId ? byId.get(item.originalId) : undefined;
      return {
        id: item.id,
        url: URL.createObjectURL(item.blob),
        originalId: original?.id,
        originalUrl: original ? URL.createObjectURL(original.blob) : undefined,
        cropData: item.cropData,
      };
    });
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
