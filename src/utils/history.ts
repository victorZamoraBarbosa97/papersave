import { usePaperStore } from "../store/usePaperStore";
import { getBlobFromDB } from "./storage";

// Tras deshacer/rehacer, un slot restaurado podría apuntar a una foto que ya
// no está en IndexedDB. En ese caso no se restaura la imagen: el espacio queda
// vacío en lugar de mostrar una imagen rota.
const dropSlotsWithMissingImage = async () => {
  const missing: number[] = [];
  for (const slot of usePaperStore.getState().slots) {
    if (!slot.isOccupied || !slot.imageId) continue;
    if (!(await getBlobFromDB(slot.imageId))) missing.push(slot.id);
  }
  if (missing.length === 0) return;

  // La corrección no es una acción del usuario: no debe entrar al historial
  // (si entrara, borraría la pila de rehacer).
  const temporal = usePaperStore.temporal.getState();
  temporal.pause();
  try {
    usePaperStore.getState().clearSlot(missing);
  } finally {
    temporal.resume();
  }
};

export const undoSafely = async () => {
  usePaperStore.temporal.getState().undo();
  await dropSlotsWithMissingImage();
};

export const redoSafely = async () => {
  usePaperStore.temporal.getState().redo();
  await dropSlotsWithMissingImage();
};
