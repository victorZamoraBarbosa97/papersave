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
  addUploadedImage: (image: UploadedImage) => void;
  // Coloca una foto que ya está en la galería. Sin slotId usa el primer espacio
  // libre. Devuelve false si no hubo lugar (hoja llena o espacio bloqueado).
  placeImageInSlot: (image: UploadedImage, slotId?: number) => boolean;
  // Mueve la foto de un espacio a otro (si el destino tiene foto, se intercambian).
  // Devuelve false si el movimiento no es válido (origen vacío o espacio bloqueado).
  moveSlot: (fromId: number, toId: number) => boolean;
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
                        originalImageData: undefined,
                        cropData: undefined,
                        imageId: undefined,
                        originalImageId: undefined,
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

          // Una foto recién subida solo entra a la galería; el usuario decide
          // en qué espacio de la hoja colocarla.
          addUploadedImage: (image: UploadedImage) =>
            set((state) => ({
              uploadedImages: [...state.uploadedImages, image],
            })),

          placeImageInSlot: (image: UploadedImage, slotId?: number) => {
            const { slots } = usePaperStore.getState();
            const targetIndex =
              slotId === undefined
                ? slots.findIndex((s) => !s.isOccupied && !s.isPrinted)
                : slots.findIndex((s) => s.id === slotId && !s.isPrinted);
            if (targetIndex === -1) return false;

            set((state) => ({
              slots: state.slots.map((s, i) =>
                i === targetIndex
                  ? {
                      ...s,
                      isOccupied: true,
                      imageData: image.url,
                      originalImageData: image.originalUrl,
                      cropData: image.cropData,
                      imageId: image.id,
                      originalImageId: image.originalId,
                    }
                  : s,
              ),
            }));
            return true;
          },

          moveSlot: (fromId: number, toId: number) => {
            const { slots } = usePaperStore.getState();
            const from = slots.find((s) => s.id === fromId);
            const to = slots.find((s) => s.id === toId);
            if (!from || !to || from.id === to.id) return false;
            if (!from.imageData || from.isPrinted || to.isPrinted) return false;

            const content = (s: PhotoSlot) => ({
              isOccupied: s.isOccupied,
              imageData: s.imageData,
              originalImageData: s.originalImageData,
              cropData: s.cropData,
              imageId: s.imageId,
              originalImageId: s.originalImageId,
            });
            const fromContent = content(from);
            const toContent = content(to);

            set((state) => ({
              slots: state.slots.map((s) =>
                s.id === fromId
                  ? { ...s, ...toContent }
                  : s.id === toId
                    ? { ...s, ...fromContent }
                    : s,
              ),
              selectedSlotIds: [],
            }));
            return true;
          },

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
              let anyChange = false;

              ids.forEach((id) => {
                const sourceSlot = state.slots.find((s) => s.id === id);
                // Un espacio impreso (sin foto) no se puede duplicar.
                if (!sourceSlot || !sourceSlot.isOccupied || !sourceSlot.imageData)
                  return;

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
                    anyChange = true;
                  }
                }
              });

              // Sin copias nuevas se conserva la misma referencia de slots, para
              // no registrar un paso vacío en el historial de deshacer.
              return anyChange
                ? { slots: newSlots, selectedSlotIds: [] }
                : { selectedSlotIds: [] };
            }),

          toggleSlotPrinted: (idOrIds: number | number[]) =>
            set((state: PaperState) => {
              const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
              // La foto de un espacio impreso ya no hace falta: se suelta la
              // referencia al blob (el GC lo borra si nadie más lo usa).
              const noImage = {
                imageData: undefined,
                originalImageData: undefined,
                cropData: undefined,
                imageId: undefined,
                originalImageId: undefined,
              };
              return {
                slots: state.slots.map((s: PhotoSlot) => {
                  if (!ids.includes(s.id)) return s;
                  // Desbloquear: queda vacío y disponible para una foto nueva.
                  if (s.isPrinted)
                    return { ...s, ...noImage, isPrinted: false, isOccupied: false };
                  // Marcar: conserva isOccupied para seguir contando como usado.
                  return { ...s, ...noImage, isPrinted: true };
                }),
              };
            }),
        }),
        {
          limit: 10,
          // El historial solo guarda la cuadrícula. Selección y galería son
          // estado de UI/derivado y no deben consumir pasos de deshacer.
          partialize: (state) => ({ slots: state.slots }),
          // Si `slots` conserva la misma referencia, el cambio no es deshacible
          // (ej. cambiar la selección) y no se registra ningún paso.
          equality: (past, current) => past.slots === current.slots,
        },
      ),
      {
        name: "paper-storage",
        // Solo persistimos la cuadrícula. La galería se recarga 100% de IndexedDB al iniciar.
        // Las blob URLs mueren al cerrar el navegador: solo se guardan los ids
        // (imageId/originalImageId) y useAppInitialization recrea las URLs
        // desde IndexedDB al abrir.
        partialize: (state) => ({
          slots: state.slots.map((slot) => ({
            ...slot,
            imageData: undefined,
            originalImageData: undefined,
          })),
        }),
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
