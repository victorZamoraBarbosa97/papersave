// Aísla los eventos del teclado (Ctrl+P, Ctrl+Z, Suprimir, etc).

import { useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";
import { undoSafely, redoSafely } from "../utils/history";

export const useGlobalShortcuts = (
  editingSlotId: number | null,
  hoveredSlotId: number | null,
) => {
  const clearSlot = usePaperStore((state) => state.clearSlot);
  const selectedSlotIds = usePaperStore((state) => state.selectedSlotIds);
  const clearSelection = usePaperStore((state) => state.clearSelection);

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Si el usuario está escribiendo en un campo (ej. cantidad de copias),
      // Backspace/Delete/Ctrl+Z deben editar el texto, no la cuadrícula.
      const target = event.target as HTMLElement | null;
      const isTyping = !!target?.closest(
        "input, textarea, select, [contenteditable='true']",
      );

      // Con un popup abierto (crop, confirmación, duplicar, menú contextual)
      // la cuadrícula es "vista secundaria": se protege de borrados y undo/redo
      // aunque el foco ya no esté dentro del popup (ej. tras pulsar Tab).
      const isModalOpen = !!document.querySelector("[data-modal-open]");

      // En minúscula para que Bloq Mayús no desactive los atajos.
      const key = event.key.toLowerCase();
      const canEditGrid = !isTyping && !isModalOpen;

      if (isCtrlOrCmd && key === "p") {
        event.preventDefault();
        window.print();
      }

      if (isCtrlOrCmd && key === "z" && !event.shiftKey && canEditGrid) {
        event.preventDefault();
        undoSafely();
      }

      // Rehacer: Ctrl+Y o Ctrl+Shift+Z
      if (
        isCtrlOrCmd &&
        (key === "y" || (key === "z" && event.shiftKey)) &&
        canEditGrid
      ) {
        event.preventDefault();
        redoSafely();
      }

      if (event.key === "Escape") clearSelection();

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        editingSlotId === null &&
        !isTyping &&
        !isModalOpen
      ) {
        if (selectedSlotIds.length > 0) {
          clearSlot(selectedSlotIds);
          clearSelection();
        } else if (hoveredSlotId !== null) {
          clearSlot(hoveredSlotId);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [
    hoveredSlotId,
    editingSlotId,
    clearSlot,
    selectedSlotIds,
    clearSelection,
  ]);
};
