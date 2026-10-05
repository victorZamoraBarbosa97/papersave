import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { PaperState, PhotoSlot, UploadedImage, CropData } from "../types";
import { TOTAL_PAPER_SLOTS } from "../config/constants";

// Lo único que se guarda en localStorage (ver `partialize` más abajo).
type PersistedPaper = Pick<PaperState, "slots">;

const createEmptySlots = (): PhotoSlot[] =>
  Array.from({ length: TOTAL_PAPER_SLOTS }, (_, i) => ({
    id: i,
    isOccupied: false,
  }));

// Redux DevTools solo en desarrollo (en producción no se incluye).
const withDevtools = (
  import.meta.env.DEV ? devtools : (initializer: unknown) => initializer
) as unknown as typeof devtools;

export const usePaperStore = create<PaperState>()(
  withDevtools(
    persist(
      temporal(
        (set) => ({
          // Cuadrícula de PAPER_COLS x PAPER_ROWS fotos infantiles por hoja
          slots: createEmptySlots(),
          uploadedImages: [], // Initialize empty
          selectedSlotIds: [],
          isProcessing: false,

          setIsProcessing: (value: boolean) => set({ isProcessing: value }),

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
              slots: createEmptySlots(),
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
        // Versión del formato guardado. Si cambia la forma de `slots`, subir el
        // número y transformar el estado antiguo en `migrate` (sin migrate,
        // zustand descartaría la hoja guardada).
        version: 1,
        // v0 (sin campo version) -> v1: mismo formato, no hay nada que convertir.
        migrate: (persisted) => persisted as PersistedPaper,
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
