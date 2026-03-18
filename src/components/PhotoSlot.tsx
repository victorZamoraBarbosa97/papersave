import React, { useState, useEffect, type DragEvent } from "react";
import type { PhotoSlotProps } from "../types";
import { PASSPORT_WIDTH_CM, PASSPORT_HEIGHT_CM } from "../config/constants";

export const PhotoSlot = React.memo<PhotoSlotProps>(
  ({
    id,
    imageSrc,
    onClear,
    onEdit,
    onMouseEnter: propOnMouseEnter,
    onMouseLeave: propOnMouseLeave,
    onDuplicate,
    isPrinted,
    onTogglePrinted,
    isSelected,
    onSelect,
    selectionCount,
    isExporting,
    className = "",
  }) => {
    const [showClearButton, setShowClearButton] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateCount, setDuplicateCount] = useState("1");
    const [failedImageSrc, setFailedImageSrc] = useState<string | undefined>(
      undefined,
    );

    // Derivamos el error automáticamente: solo hay error si la imagen actual coincide con la que falló
    const imageError = imageSrc !== undefined && failedImageSrc === imageSrc;

    const isMultiSelect = (selectionCount || 0) > 1;

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

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
      const closeMenu = () => setContextMenu(null);
      if (contextMenu) {
        window.addEventListener("click", closeMenu);
      }
      return () => window.removeEventListener("click", closeMenu);
    }, [contextMenu]);

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
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

        {contextMenu && !isExporting && (
          <div
            className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-md py-1 min-w-35 flex flex-col print:hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {!isMultiSelect && imageSrc && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(id);
                  setContextMenu(null);
                }}
                className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Editar Recorte
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePrinted?.(id);
                setContextMenu(null);
              }}
              className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              {isPrinted ? (
                <svg
                  className="w-4 h-4 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
              {isPrinted
                ? isMultiSelect
                  ? "Desbloquear Espacios"
                  : "Desbloquear Espacio"
                : isMultiSelect
                  ? "Marcar como Impresos"
                  : "Marcar como Impreso"}
            </button>
            {(imageSrc || isMultiSelect) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDuplicateModal(true);
                  setContextMenu(null);
                }}
                className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
                {isMultiSelect ? `Duplicar (${selectionCount})` : "Duplicar"}
              </button>
            )}
            {(imageSrc || isMultiSelect) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear?.(id);
                  setContextMenu(null);
                }}
                className="text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
                {isMultiSelect
                  ? `Limpiar Espacios (${selectionCount})`
                  : "Limpiar Espacio"}
              </button>
            )}
          </div>
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
                  className="w-full h-full object-cover"
                  src={imageSrc}
                  onError={() => setFailedImageSrc(imageSrc)}
                />
              ) : (
                <svg
                  className="w-6 h-6 text-slate-300 print:hidden"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            {/* Indicador de candado visual cuando está impreso (oculto en impresión) */}
            {isPrinted && !isExporting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none print:hidden">
                <svg
                  className="w-6 h-6 mb-1 opacity-70"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 text-center leading-none">
                  Impreso
                </span>
              </div>
            )}
          </>
        ) : !isExporting ? (
          <span className="text-xs text-slate-300 print:hidden">Vacío</span>
        ) : null}

        {/* Modal para ingresar cantidad a duplicar */}
        {showDuplicateModal && !isExporting && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setShowDuplicateModal(false);
              setDuplicateCount("1");
            }}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-2xl w-80 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800">
                Duplicar imagen
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                ¿Cuántas copias deseas crear?
              </p>
              <input
                type="number"
                min="1"
                value={duplicateCount}
                onChange={(e) => setDuplicateCount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const count = parseInt(duplicateCount || "0", 10);
                    if (count > 0) onDuplicate?.(id, count);
                    setShowDuplicateModal(false);
                    setDuplicateCount("1");
                  } else if (e.key === "Escape") {
                    setShowDuplicateModal(false);
                    setDuplicateCount("1");
                  }
                }}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDuplicateModal(false);
                    setDuplicateCount("1");
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const count = parseInt(duplicateCount || "0", 10);
                    if (count > 0) onDuplicate?.(id, count);
                    setShowDuplicateModal(false);
                    setDuplicateCount("1");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);
