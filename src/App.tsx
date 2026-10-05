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
import { MarqueeOverlay } from "./components/MarqueeOverlay";
import { PrintPrompt } from "./components/PrintPrompt";
import { Toast } from "./components/Toast";
import { usePaperScale } from "./hooks/usePaperScale";
import { SlotContextMenu } from "./components/SlotContextMenu";
import { DuplicateDialog } from "./components/DuplicateDialog";
import { showToast } from "./store/useToastStore";
import { usePrintPrompt } from "./hooks/usePrintPrompt";

function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  // Menú de clic derecho y diálogo de duplicar: uno solo para toda la hoja
  const [contextMenu, setContextMenu] = useState<{
    slotId: number;
    x: number;
    y: number;
  } | null>(null);
  const [duplicateSlotId, setDuplicateSlotId] = useState<number | null>(null);
  // Solo móvil: el panel lateral es un cajón
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const paperScale = usePaperScale();
  const paperSheetRef = useRef<HTMLElement>(null);

  const slots = usePaperStore((state) => state.slots);
  const occupySlot = usePaperStore((state) => state.occupySlot);
  const selectedSlotIds = usePaperStore((state) => state.selectedSlotIds);
  const isProcessing = usePaperStore((state) => state.isProcessing);

  // Custom Hooks para modularizar la lógica
  useAppInitialization();
  useGlobalShortcuts(editingSlotId, hoveredSlotId);
  const { marqueeStart, marqueeCurrent, handleMainMouseDown } =
    useMarqueeSelection();
  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleGlobalDrop,
  } = useGlobalDragAndDrop();
  const { pendingCount, requestPrompt, confirm, dismiss } = usePrintPrompt();

  const handleExportPdf = async () => {
    if (paperSheetRef.current) {
      setIsExporting(true);

      // Esperamos un momento para que React actualice el DOM y oculte los elementos
      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        await exportPaperAsPDF(paperSheetRef.current);
        requestPrompt(); // el PDF ya se generó: ofrece marcar las fotos como impresas
      } catch (error) {
        console.error("Failed to export PDF:", error);
        showToast("No se pudo exportar el PDF. Inténtalo de nuevo.", "error");
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

  const handleSlotDropImage = useCallback((slotId: number, imageId: string) => {
    const state = usePaperStore.getState();
    const image = state.uploadedImages.find((img) => img.id === imageId);
    if (image) state.placeImageInSlot(image, slotId);
  }, []);

  const handleSlotContextMenu = useCallback(
    (slotId: number, x: number, y: number) => setContextMenu({ slotId, x, y }),
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleSlotMove = useCallback((fromId: number, toId: number) => {
    usePaperStore.getState().moveSlot(fromId, toId);
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
      // Red de seguridad: un drop fuera de cualquier zona nunca debe dejar que el
      // navegador abra el archivo (se perdería la sesión).
      onDrop={(e) => e.preventDefault()}
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

      <Header
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-x-0 top-16 bottom-0 z-30 bg-slate-900/40 print:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main
          className="flex-1 overflow-auto print:overflow-hidden main-canvas-area flex items-center justify-center p-12 max-md:p-4 print:p-0 bg-slate-200 print:bg-transparent relative select-none"
          data-purpose="canvas-viewport"
          onMouseDown={handleMainMouseDown}
        >
          <PaperSheet
            ref={paperSheetRef}
            isExporting={isExporting}
            scale={paperScale}
          >
            {slots.map((slot) => (
              <PhotoSlot
                key={slot.id}
                id={slot.id}
                imageSrc={slot.imageData}
                isPrinted={slot.isPrinted}
                isExporting={isExporting}
                isOccupied={slot.isOccupied}
                isSelected={selectedSlotIds.includes(slot.id)}
                onSelect={handleSlotSelect}
                onMouseEnter={handleSlotEnter}
                onMouseLeave={handleSlotLeave}
                onContextMenu={handleSlotContextMenu}
                onClear={handleSlotClear}
                onDropGalleryImage={handleSlotDropImage}
                onMoveImage={handleSlotMove}
              />
            ))}
          </PaperSheet>
        </main>
      </div>

      <Toast />
      {contextMenu &&
        !isExporting &&
        (() => {
          const slot = slots.find((s) => s.id === contextMenu.slotId);
          if (!slot) return null;
          const { slotId } = contextMenu;
          return (
            <SlotContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              hasImage={!!slot.imageData}
              isPrinted={!!slot.isPrinted}
              selectionCount={
                selectedSlotIds.includes(slotId) ? selectedSlotIds.length : 0
              }
              onEdit={() => handleSlotEdit(slotId)}
              onTogglePrinted={() => handleSlotTogglePrinted(slotId)}
              onDuplicate={() => setDuplicateSlotId(slotId)}
              onClear={() => handleSlotClear(slotId)}
              onClose={closeContextMenu}
            />
          );
        })()}
      {duplicateSlotId !== null && !isExporting && (
        <DuplicateDialog
          onConfirm={(count) => handleSlotDuplicate(duplicateSlotId, count)}
          onClose={() => setDuplicateSlotId(null)}
        />
      )}
      {pendingCount > 0 && (
        <PrintPrompt
          count={pendingCount}
          onConfirm={confirm}
          onDismiss={dismiss}
        />
      )}
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
