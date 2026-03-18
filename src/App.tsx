import { useState, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { PaperSheet } from "./components/PaperSheet";
import { PhotoSlot } from "./components/PhotoSlot";
import { usePaperStore } from "./store/usePaperStore";
import type { CropData } from "./types";
import { saveImageToDB } from "./utils/storage";
import { exportPaperAsPDF } from "./utils/pdf";
import { CropModal } from "./components/CropModal";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useMarqueeSelection } from "./hooks/useMarqueeSelection";
import { useGlobalDragAndDrop } from "./hooks/useGlobalDragAndDrop";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { DragDropOverlay } from "./components/DragDropOverlay";
import { StatusToast } from "./components/StatusToast";
import { MarqueeOverlay } from "./components/MarqueeOverlay";

function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const paperSheetRef = useRef<HTMLElement>(null);

  const slots = usePaperStore((state) => state.slots);
  const occupySlot = usePaperStore((state) => state.occupySlot);
  const selectedSlotIds = usePaperStore((state) => state.selectedSlotIds);

  // Custom Hooks para modularizar la lógica
  useAppInitialization();
  useGlobalShortcuts(editingSlotId, hoveredSlotId);
  const { marqueeStart, marqueeCurrent, handleMainMouseDown } =
    useMarqueeSelection();
  const {
    isDragging,
    isProcessing,
    handleDragEnter,
    handleDragLeave,
    handleGlobalDrop,
  } = useGlobalDragAndDrop();

  const handleExportPdf = async () => {
    if (paperSheetRef.current) {
      setIsExporting(true);

      // Esperamos un momento para que React actualice el DOM y oculte los elementos
      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        await exportPaperAsPDF(paperSheetRef.current);
      } catch (error) {
        console.error("Failed to export PDF:", error);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleSlotCropSave = async (blob: Blob, newCropData: CropData) => {
    if (editingSlotId === null) return;
    // Guardar el nuevo recorte en la base de datos
    const id = await saveImageToDB(blob, false);
    const url = URL.createObjectURL(blob);

    // Actualizamos el slot con la nueva imagen y los nuevos datos de recorte,
    // manteniendo la referencia a la imagen original.
    occupySlot(editingSlotId, url, undefined, newCropData, id);
    setEditingSlotId(null);
  };

  // Callbacks estables para PhotoSlot usando React.useCallback
  // Evitan renderizados innecesarios gracias a React.memo()
  const handleSlotSelect = useCallback((id: number) => {
    usePaperStore.getState().toggleSlotSelection(id);
  }, []);

  const handleSlotEdit = useCallback((id: number) => {
    setEditingSlotId(id);
  }, []);

  const handleSlotEnter = useCallback((id: number) => {
    setHoveredSlotId(id);
  }, []);

  const handleSlotLeave = useCallback(() => {
    setHoveredSlotId(null);
  }, []);

  const handleSlotDuplicate = useCallback((id: number, count: number) => {
    const state = usePaperStore.getState();
    const ids = state.selectedSlotIds.includes(id)
      ? state.selectedSlotIds
      : [id];
    state.duplicateSlot(ids, count);
  }, []);

  const handleSlotTogglePrinted = useCallback((id: number) => {
    const state = usePaperStore.getState();
    const ids = state.selectedSlotIds.includes(id)
      ? state.selectedSlotIds
      : [id];
    state.toggleSlotPrinted(ids);
  }, []);

  const handleSlotClear = useCallback((id: number) => {
    const state = usePaperStore.getState();
    const ids = state.selectedSlotIds.includes(id)
      ? state.selectedSlotIds
      : [id];
    state.clearSlot(ids);
  }, []);

  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden bg-slate-50 font-sans"
      onDragOver={(e) => e.preventDefault()}
      onDragEnterCapture={handleDragEnter}
    >
      {isProcessing && <ProcessingOverlay />}
      {isDragging && (
        <DragDropOverlay
          onDragLeave={handleDragLeave}
          onDrop={handleGlobalDrop}
        />
      )}

      {editingSlotId !== null &&
        (() => {
          const slot = slots.find((s) => s.id === editingSlotId);
          // Usamos originalImageData si existe (para permitir re-encuadre completo), sino imageData
          return slot?.originalImageData ? (
            <CropModal
              imageUrl={slot.originalImageData}
              initialCrop={slot.cropData}
              onClose={() => setEditingSlotId(null)}
              onSave={handleSlotCropSave}
            />
          ) : null;
        })()}

      <Header onExportPdf={handleExportPdf} isExporting={isExporting} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className="flex-1 overflow-auto print:overflow-hidden main-canvas-area flex items-center justify-center p-12 print:p-0 bg-slate-200 print:bg-transparent relative select-none"
          data-purpose="canvas-viewport"
          onMouseDown={handleMainMouseDown}
        >
          <PaperSheet ref={paperSheetRef} isExporting={isExporting}>
            {slots.map((slot) => (
              <PhotoSlot
                key={slot.id}
                id={slot.id}
                imageSrc={slot.imageData}
                isPrinted={slot.isPrinted}
                isExporting={isExporting}
                isSelected={selectedSlotIds.includes(slot.id)}
                selectionCount={
                  selectedSlotIds.includes(slot.id) ? selectedSlotIds.length : 0
                }
                onSelect={handleSlotSelect}
                onEdit={handleSlotEdit}
                onMouseEnter={handleSlotEnter}
                onMouseLeave={handleSlotLeave}
                onDuplicate={handleSlotDuplicate}
                onTogglePrinted={handleSlotTogglePrinted}
                onClear={handleSlotClear}
              />
            ))}
          </PaperSheet>
        </main>
      </div>

      <StatusToast />
      {marqueeStart && marqueeCurrent && (
        <MarqueeOverlay
          marqueeStart={marqueeStart}
          marqueeCurrent={marqueeCurrent}
        />
      )}
    </div>
  );
}

export default App;
