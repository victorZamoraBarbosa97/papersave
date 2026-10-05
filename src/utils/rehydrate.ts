import { usePaperStore } from "../store/usePaperStore";
import { getBlobFromDB } from "./storage";

interface SlotRefresh {
  imageId: string;
  imageData?: string;
  originalImageData?: string;
  // Qué referencias ya no existen en IndexedDB
  missingImage: boolean;
  missingOriginal: boolean;
}

// Al abrir la app las blob URLs guardadas están muertas (solo se persisten los
// ids). Aquí se recrean desde IndexedDB; si una foto ya no existe, el espacio
// queda vacío en vez de mostrar una imagen rota.
export const rehydrateSlots = async () => {
  const refreshed = new Map<number, SlotRefresh>();

  for (const slot of usePaperStore.getState().slots) {
    if (!slot.isOccupied || !slot.imageId) continue;

    const blob = await getBlobFromDB(slot.imageId);
    const originalBlob = slot.originalImageId
      ? await getBlobFromDB(slot.originalImageId)
      : undefined;

    refreshed.set(slot.id, {
      imageId: slot.imageId,
      imageData: blob ? URL.createObjectURL(blob) : undefined,
      originalImageData: originalBlob
        ? URL.createObjectURL(originalBlob)
        : undefined,
      missingImage: !blob,
      missingOriginal: !!slot.originalImageId && !originalBlob,
    });
  }

  // Esto no es una acción del usuario: se aplica de golpe y con el historial en
  // pausa para que Ctrl+Z no regrese a URLs muertas.
  const temporal = usePaperStore.temporal.getState();
  temporal.pause();
  try {
    usePaperStore.setState((state) => ({
      slots: state.slots.map((s) => {
        const r = refreshed.get(s.id);
        // Si el usuario cambió el slot mientras se leía la base, no se toca.
        if (!r || s.imageId !== r.imageId) return s;

        if (r.missingImage) {
          return {
            ...s,
            isOccupied: false,
            imageData: undefined,
            originalImageData: undefined,
            cropData: undefined,
            imageId: undefined,
            originalImageId: undefined,
          };
        }
        return {
          ...s,
          imageData: r.imageData,
          originalImageData: r.originalImageData,
          // Sin original no se puede re-encuadrar: se suelta esa referencia.
          originalImageId: r.missingOriginal ? undefined : s.originalImageId,
        };
      }),
    }));
  } finally {
    temporal.resume();
  }
};
