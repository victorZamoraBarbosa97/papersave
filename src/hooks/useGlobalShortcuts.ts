// Aísla los eventos del teclado (Ctrl+P, Ctrl+Z, Suprimir, etc).

import { useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";

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

      if (isCtrlOrCmd && event.key === "p") {
        event.preventDefault();
        window.print();
      }

      if (isCtrlOrCmd && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        usePaperStore.temporal.getState().undo();
      }

      if (isCtrlOrCmd && event.key === "y") {
        event.preventDefault();
        usePaperStore.temporal.getState().redo();
      }

      if (event.key === "Escape") clearSelection();

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        editingSlotId === null
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
