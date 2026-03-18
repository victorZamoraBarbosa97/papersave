import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { temporal } from "zundo";

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoSlot {
  id: number;
  isOccupied: boolean;
  imageData?: string;
  originalImageData?: string;
  cropData?: CropData;
  isPrinted?: boolean; // <-- Nuevo estado
  imageId?: string; // ID de la imagen en IndexedDB
  originalImageId?: string; // ID de la imagen original en IndexedDB
}

export interface UploadedImage {
  id: string;
  url: string;
  originalUrl?: string;
  originalId?: string;
  cropData?: CropData;
}

interface PaperState {
  slots: PhotoSlot[];
  clearSlot: (id: number | number[]) => void;
  resetPaper: () => void;
  uploadedImages: UploadedImage[]; // New state for images not yet placed
  setUploadedImages: (images: UploadedImage[]) => void;
  removeUploadedImage: (id: string) => void;
  updateUploadedImage: (id: string, image: UploadedImage) => void;
  addImageAndFillSlot: (image: UploadedImage) => void;
  occupySlot: (
    id: number,
    data: string,
    originalData?: string,
    cropData?: CropData,
    imageId?: string,
    originalImageId?: string,
  ) => void;
  duplicateSlot: (id: number | number[], count?: number) => void;
  toggleSlotPrinted: (id: number | number[]) => void;
  updateSlotUrls: (
    id: number,
    imageData?: string,
    originalImageData?: string,
  ) => void;
  selectedSlotIds: number[];
  toggleSlotSelection: (id: number) => void;
  clearSelection: () => void;
  setSelectedSlots: (ids: number[]) => void;
}

export const usePaperStore = create<PaperState>()(
  devtools(
    persist(
      temporal(
        (set) => ({
          // Grid de 6x8 (48 fotos infantiles por hoja)
          slots: Array.from({ length: 48 }, (_, i) => ({
            id: i,
            isOccupied: false,
            isCircular: i === 1, // Example: make second slot circular
          })),
          uploadedImages: [], // Initialize empty
          selectedSlotIds: [],

          clearSelection: () => set({ selectedSlotIds: [] }),

          setSelectedSlots: (ids: number[]) => set({ selectedSlotIds: ids }),

          toggleSlotSelection: (id: number) =>
            set((state) => {
              const isSelected = state.selectedSlotIds.includes(id);
              if (isSelected) {
                return {
                  selectedSlotIds: state.selectedSlotIds.filter(
                    (sId) => sId !== id,
                  ),
                };
              } else {
                return { selectedSlotIds: [...state.selectedSlotIds, id] };
              }
            }),

          clearSlot: (idOrIds: number | number[]) =>
            set((state: PaperState) => {
              const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
              return {
                slots: state.slots.map((s: PhotoSlot) =>
                  ids.includes(s.id)
                    ? {
                        ...s,
                        isOccupied: false,
                        imageData: undefined,
                        imageId: undefined,
                        isPrinted: false,
                      }
                    : s,
                ),
                selectedSlotIds: state.selectedSlotIds.filter(
                  (id) => !ids.includes(id),
                ),
              };
            }),

          resetPaper: () =>
            set({
              slots: Array.from({ length: 48 }, (_, i) => ({
                id: i,
                isOccupied: false,
                isCircular: i === 1,
              })),
              selectedSlotIds: [],
            }),

          setUploadedImages: (images: UploadedImage[]) =>
            set({ uploadedImages: images }),

          removeUploadedImage: (id: string) =>
            set((state: PaperState) => ({
              uploadedImages: state.uploadedImages.filter(
                (img: UploadedImage) => img.id !== id,
              ),
            })),

          updateUploadedImage: (id: string, image: UploadedImage) =>
            set((state: PaperState) => ({
              uploadedImages: state.uploadedImages.map((img: UploadedImage) =>
                img.id === id ? image : img,
              ),
            })),

          addImageAndFillSlot: (image: UploadedImage) =>
            set((state) => {
              const firstEmptySlotIndex = state.slots.findIndex(
                (slot) => !slot.isOccupied && !slot.isPrinted,
              );
              const newSlots = [...state.slots];
              if (firstEmptySlotIndex !== -1) {
                newSlots[firstEmptySlotIndex] = {
                  ...newSlots[firstEmptySlotIndex],
                  isOccupied: true,
                  imageData: image.url,
                  originalImageData: image.originalUrl,
                  cropData: image.cropData,
                  imageId: image.id,
                  originalImageId: image.originalId,
                };
              }
              return {
                uploadedImages: [...state.uploadedImages, image],
                slots: newSlots,
              };
            }),

          occupySlot: (
            id: number,
            data: string,
            originalData?: string,
            cropData?: CropData,
            imageId?: string,
            originalImageId?: string,
          ) =>
            set((state: PaperState) => ({
              slots: state.slots.map((s: PhotoSlot) =>
                s.id === id
                  ? {
                      ...s,
                      isOccupied: true,
                      imageData: data,
                      originalImageData: originalData ?? s.originalImageData,
                      cropData: cropData ?? s.cropData,
                      imageId: imageId ?? s.imageId,
                      originalImageId: originalImageId ?? s.originalImageId,
                    }
                  : s,
              ),
            })),

          duplicateSlot: (idOrIds: number | number[], count = 1) =>
            set((state) => {
              const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
              const newSlots = [...state.slots];

              ids.forEach((id) => {
                const sourceSlot = state.slots.find((s) => s.id === id);
                if (!sourceSlot || !sourceSlot.isOccupied) return;

                let duplicatesCreated = 0;
                for (
                  let i = 0;
                  i < newSlots.length && duplicatesCreated < count;
                  i++
                ) {
                  if (!newSlots[i].isOccupied && !newSlots[i].isPrinted) {
                    newSlots[i] = {
                      ...newSlots[i],
                      isOccupied: true,
                      imageData: sourceSlot.imageData,
                      originalImageData: sourceSlot.originalImageData,
                      cropData: sourceSlot.cropData,
                      imageId: sourceSlot.imageId,
                      originalImageId: sourceSlot.originalImageId,
                    };
                    duplicatesCreated++;
                  }
                }
              });

              return { slots: newSlots, selectedSlotIds: [] };
            }),

          toggleSlotPrinted: (idOrIds: number | number[]) =>
            set((state: PaperState) => {
              const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
              return {
                slots: state.slots.map((s: PhotoSlot) =>
                  ids.includes(s.id) ? { ...s, isPrinted: !s.isPrinted } : s,
                ),
              };
            }),

          updateSlotUrls: (
            id: number,
            imageData?: string,
            originalImageData?: string,
          ) =>
            set((state: PaperState) => ({
              slots: state.slots.map((s: PhotoSlot) =>
                s.id === id
                  ? {
                      ...s,
                      imageData: imageData ?? s.imageData,
                      originalImageData:
                        originalImageData ?? s.originalImageData,
                    }
                  : s,
              ),
            })),
        }),
        {
          limit: 10,
        },
      ),
      {
        name: "paper-storage",
        // Solo persistimos la cuadrícula. La galería se recarga 100% de IndexedDB al iniciar.
        partialize: (state) => ({ slots: state.slots }),
      },
    ),
  ),
);

// Rastreador global de URLs en memoria para evitar fugas (Memory Leaks)
export const trackedUrls = new Set<string>();

usePaperStore.subscribe((state) => {
  state.slots.forEach((slot) => {
    if (slot.imageData && slot.imageData.startsWith("blob:")) {
      trackedUrls.add(slot.imageData);
    }
    if (slot.originalImageData && slot.originalImageData.startsWith("blob:")) {
      trackedUrls.add(slot.originalImageData);
    }
  });
  state.uploadedImages.forEach((img) => {
    if (img.url && img.url.startsWith("blob:")) {
      trackedUrls.add(img.url);
    }
    if (img.originalUrl && img.originalUrl.startsWith("blob:")) {
      trackedUrls.add(img.originalUrl);
    }
  });
});
