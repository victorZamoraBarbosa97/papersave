// Tras imprimir o exportar el PDF, ofrece marcar como impresas las fotos de la
// hoja. El navegador avisa cuándo se cierra el diálogo de impresión
// (`afterprint`), pero NO si se imprimió, se guardó como PDF o se canceló; por
// eso se pregunta en vez de marcar automáticamente (marcar libera la foto).

import { useCallback, useEffect, useState } from "react";
import { usePaperStore } from "../store/usePaperStore";

// Espacios con foto que todavía no están marcados como impresos
const getPendingSlotIds = () =>
  usePaperStore
    .getState()
    .slots.filter((s) => s.isOccupied && s.imageData && !s.isPrinted)
    .map((s) => s.id);

export const usePrintPrompt = () => {
  // Se guardan los ids de ESE momento: fotos agregadas después no se marcan.
  const [pendingIds, setPendingIds] = useState<number[] | null>(null);

  const requestPrompt = useCallback(() => {
    const ids = getPendingSlotIds();
    setPendingIds(ids.length > 0 ? ids : null);
  }, []);

  // Cubre Ctrl+P, el botón "Imprimir" y el menú de impresión del navegador.
  useEffect(() => {
    window.addEventListener("afterprint", requestPrompt);
    return () => window.removeEventListener("afterprint", requestPrompt);
  }, [requestPrompt]);

  const confirm = useCallback(() => {
    const state = usePaperStore.getState();
    // Solo los que siguen con foto y sin marcar (pudo cambiar mientras tanto).
    const ids = (pendingIds ?? []).filter((id) => {
      const slot = state.slots.find((s) => s.id === id);
      return !!slot?.imageData && !slot.isPrinted;
    });
    if (ids.length > 0) state.toggleSlotPrinted(ids);
    setPendingIds(null);
  }, [pendingIds]);

  const dismiss = useCallback(() => setPendingIds(null), []);

  return {
    pendingCount: pendingIds?.length ?? 0,
    requestPrompt,
    confirm,
    dismiss,
  };
};
