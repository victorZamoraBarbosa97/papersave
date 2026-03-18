// Maneja la carga de modelos, hidratación de IndexedDB y el recolector de basura

import { useEffect } from "react";
import { usePaperStore, trackedUrls } from "../store/usePaperStore";
import {
  loadImagesFromDB,
  getBlobFromDB,
  cleanupOrphanedImages,
} from "../utils/storage";
import { loadFaceApiModels } from "../utils/faceDetection";
import type { PaperState, PhotoSlot, UploadedImage } from "../types";

export const useAppInitialization = () => {
  const setUploadedImages = usePaperStore((state) => state.setUploadedImages);

  useEffect(() => {
    loadFaceApiModels();
    loadImagesFromDB().then((images) => setUploadedImages(images));

    const rehydrateSlots = async () => {
      const currentSlots = usePaperStore.getState().slots;
      for (const slot of currentSlots) {
        if (slot.isOccupied) {
          let newImageData = slot.imageData;
          let newOriginalData = slot.originalImageData;

          if (slot.imageId) {
            const blob = await getBlobFromDB(slot.imageId);
            if (blob) newImageData = URL.createObjectURL(blob);
          }
          if (slot.originalImageId) {
            const originalBlob = await getBlobFromDB(slot.originalImageId);
            if (originalBlob)
              newOriginalData = URL.createObjectURL(originalBlob);
          }
          usePaperStore
            .getState()
            .updateSlotUrls(slot.id, newImageData, newOriginalData);
        }
      }
    };
    rehydrateSlots();
  }, [setUploadedImages]);

  useEffect(() => {
    const performCleanup = async () => {
      const state = usePaperStore.getState();
      const activeIds = new Set<string>();
      const activeUrls = new Set<string>();

      const addActive = (s: Partial<PaperState>) => {
        s.slots?.forEach((slot: PhotoSlot) => {
          if (slot.imageId) activeIds.add(slot.imageId);
          if (slot.originalImageId) activeIds.add(slot.originalImageId);
          if (slot.imageData) activeUrls.add(slot.imageData);
          if (slot.originalImageData) activeUrls.add(slot.originalImageData);
        });
        s.uploadedImages?.forEach((img: UploadedImage) => {
          activeIds.add(img.id);
          if (img.originalId) activeIds.add(img.originalId);
          if (img.url) activeUrls.add(img.url);
          if (img.originalUrl) activeUrls.add(img.originalUrl);
        });
      };

      addActive(state);
      const temporalState = usePaperStore.temporal?.getState();
      if (temporalState) {
        temporalState.pastStates.forEach(addActive);
        temporalState.futureStates.forEach(addActive);
      }

      // Limpieza de IndexedDB
      await cleanupOrphanedImages(Array.from(activeIds));

      // Limpieza de Memoria RAM
      trackedUrls.forEach((url: string) => {
        if (!activeUrls.has(url)) {
          URL.revokeObjectURL(url);
          trackedUrls.delete(url);
        }
      });
    };

    const timeout = setTimeout(performCleanup, 5000);
    const interval = setInterval(performCleanup, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
};
