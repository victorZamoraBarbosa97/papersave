import React, { useState, type DragEvent } from "react";
import type { PhotoSlotProps } from "../types";
import {
  PASSPORT_WIDTH_CM,
  PASSPORT_HEIGHT_CM,
  GALLERY_DRAG_MIME,
  SLOT_DRAG_MIME,
} from "../config/constants";
import { Icon } from "./Icon";

export const PhotoSlot = React.memo<PhotoSlotProps>(
  ({
    id,
    imageSrc,
    isOccupied,
    onClear,
    onMouseEnter: propOnMouseEnter,
    onMouseLeave: propOnMouseLeave,
    isPrinted,
    isSelected,
    onSelect,
    isExporting,
    onDropGalleryImage,
    onMoveImage,
    onContextMenu,
    className = "",
  }) => {
    const [showClearButton, setShowClearButton] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [failedImageSrc, setFailedImageSrc] = useState<string | undefined>(
      undefined,
    );

    // Derivamos el error automáticamente: solo hay error si la imagen actual coincide con la que falló
    const imageError = imageSrc !== undefined && failedImageSrc === imageSrc;

    // Convertimos CM a PX con factor aproximado ~28.346 (para la pantalla a 72 PPI)
    const slotStyle = {
      "--slot-w": `${Math.round(PASSPORT_WIDTH_CM * 28.346)}px`,
      "--slot-h": `${Math.round(PASSPORT_HEIGHT_CM * 28.346)}px`,
      "--print-w": `${PASSPORT_WIDTH_CM}cm`, // Tamaño real e inamovible para imprimir
      "--print-h": `${PASSPORT_HEIGHT_CM}cm`,
    } as React.CSSProperties;

    const baseClasses =
      "w-[var(--slot-w)] h-[var(--slot-h)] print:w-[var(--print-w)] print:h-[var(--print-h)] border border-dashed flex items-center justify-center transition-all duration-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 print:!border-transparent print:!bg-transparent";

    const occupiedClasses = `bg-white overflow-hidden border-transparent ${isExporting ? "shadow-none" : "shadow-sm print:shadow-none"}`;
    const emptyClasses = isExporting
      ? "border-transparent"
      : "border-slate-300 print:border-transparent";
    const printedClasses = isExporting
      ? "border-transparent bg-transparent shadow-none"
      : "bg-slate-200 border-slate-300 print:border-transparent print:bg-transparent print:shadow-none";

    const handleSlotClick = (e: React.MouseEvent) => {
      if (onSelect) {
        e.stopPropagation();
        onSelect(id, e);
      }
    };

    // Solo se puede arrastrar un espacio con foto y no impreso.
    const canDrag = !!imageSrc && !isPrinted && !isExporting;

    // Espacio con foto cuya imagen aún no está lista (se están recreando las
    // blob URLs desde IndexedDB al abrir la app): se muestra un marcador de
    // carga en vez de "Vacío".
    const isLoading = !!isOccupied && !imageSrc && !isPrinted;

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData(SLOT_DRAG_MIME, String(id));
      e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Resalta el espacio solo si acepta el arrastre (no si está bloqueado).
      const { types } = e.dataTransfer;
      if (
        (types.includes(GALLERY_DRAG_MIME) || types.includes(SLOT_DRAG_MIME)) &&
        !isPrinted
      ) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const imageId = e.dataTransfer.getData(GALLERY_DRAG_MIME);
      if (imageId) onDropGalleryImage?.(id, imageId);
      const fromSlotId = e.dataTransfer.getData(SLOT_DRAG_MIME);
      if (fromSlotId) onMoveImage?.(parseInt(fromSlotId, 10), id);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu?.(id, e.clientX, e.clientY);
    };

    return (
      <div
        style={slotStyle}
        className={`${baseClasses} ${imageSrc ? occupiedClasses : emptyClasses} ${isDragOver ? "border-blue-500! bg-blue-100!" : ""} ${isPrinted ? printedClasses : ""} ${isSelected && !isExporting ? "border-transparent!" : ""} ${className} relative select-none`}
        data-purpose="photo-entry"
        data-slot-id={id}
        onClick={handleSlotClick}
        onMouseEnter={() => {
          setShowClearButton(true);
          propOnMouseEnter?.(id);
        }}
        onMouseLeave={() => {
          setShowClearButton(false);
          propOnMouseLeave?.(id);
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        draggable={canDrag}
        onDragStart={handleDragStart}
      >
        {/* Overlay de selección (se dibuja por encima de la imagen) */}
        {isSelected && !isExporting && (
          <div className="absolute inset-0 border-4 border-blue-500 pointer-events-none z-10 print:hidden" />
        )}

        {imageSrc &&
          onClear &&
          showClearButton &&
          !isPrinted &&
          !isExporting && (
            <button
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none opacity-80 hover:opacity-100 transition-opacity z-20 print:hidden"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering handleSlotClick
                onClear(id);
              }}
              aria-label="Limpiar espacio"
            >
              <Icon name="close" className="w-3 h-3" />
            </button>
          )}

        {/* Content of the slot */}
        {imageSrc ? (
          <>
            <div
              className={`w-full h-full transition-all flex items-center justify-center ${isPrinted ? `grayscale ${isExporting ? "opacity-0" : "opacity-30 print:opacity-0"}` : "print:opacity-100"}`}
            >
              {!imageError ? (
                <img
                  alt="ID Photo"
                  draggable={false}
                  className="w-full h-full object-cover"
                  src={imageSrc}
                  onError={() => setFailedImageSrc(imageSrc)}
                />
              ) : (
                <Icon name="image" className="w-6 h-6 text-slate-300 print:hidden" />
              )}
            </div>
          </>
        ) : isLoading && !isExporting ? (
          <div
            className="w-full h-full bg-slate-100 animate-pulse print:hidden"
            aria-label="Cargando foto"
          />
        ) : !isExporting && !isPrinted ? (
          <span className="text-xs text-slate-300 print:hidden">Vacío</span>
        ) : null}

        {/* Indicador de candado cuando está impreso (oculto en impresión).
            Al marcar como impreso la foto se libera: solo queda este recuadro. */}
        {isPrinted && !isExporting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none print:hidden">
            <Icon name="lock-solid" className="w-6 h-6 mb-1 opacity-70" />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 text-center leading-none">
              Impreso
            </span>
          </div>
        )}
      </div>
    );
  },
);
