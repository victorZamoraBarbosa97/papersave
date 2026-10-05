import React, { useEffect, useRef, useState } from "react";
import type { CropModalProps } from "../types";
import { useCropModal } from "../hooks/useCropModal";
import { CROP_WIDTH_PX, CROP_HEIGHT_PX } from "../config/constants";
import { BG_REMOVAL_MODEL } from "../config/constants";
import { removeBackground } from "@imgly/background-removal";
import { showToast } from "../store/useToastStore";
import { Icon, Spinner } from "./Icon";
import { Modal } from "./Modal";

export const CropModal: React.FC<CropModalProps> = ({
  imageUrl,
  onClose,
  onSave,
  initialCrop,
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  // Blob URL del resultado de "Quitar fondo" (la crea este modal, así que él la libera)
  const bgUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
    },
    [],
  );

  const {
    scale,
    setScale,
    position,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    imageRef,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSave,
  } = useCropModal(initialCrop, CROP_WIDTH_PX, CROP_HEIGHT_PX, onSave, onClose);

  const handleRemoveBackground = async () => {
    try {
      setIsRemovingBg(true);
      // La IA procesa la imagen y devuelve un Blob PNG con transparencia
      const blob = await removeBackground(currentImageUrl, {
        model: BG_REMOVAL_MODEL,
        publicPath: `${window.location.origin}/`, // Volvemos a la raíz
      });
      const newUrl = URL.createObjectURL(blob);
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
      bgUrlRef.current = newUrl;
      setCurrentImageUrl(newUrl);
    } catch (error) {
      console.error("Error quitando el fondo:", error);
      showToast("No se pudo quitar el fondo. Inténtalo de nuevo.", "error");
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      backdropClassName="z-50 bg-black/70"
      panelClassName="w-100"
    >
        <h3 className="text-lg font-bold text-slate-800">Ajustar Recorte</h3>

        <div
          className="relative w-full h-87.5 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center cursor-move border border-slate-300"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Reference Frame / Crop Box (Visual Guide) */}
          <div
            className="absolute border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none z-10"
            style={{ width: CROP_WIDTH_PX, height: CROP_HEIGHT_PX }}
          />

          {/* Draggable Image */}
          <div
            style={{
              width: CROP_WIDTH_PX,
              height: CROP_HEIGHT_PX,
              position: "relative",
            }}
          >
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "top left",
                maxWidth: "none",
                display: "block",
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Zoom: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="text-[11px] text-slate-400 -mt-1">
              O usa la rueda del mouse.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Brillo
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Contraste
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <button
            onClick={handleRemoveBackground}
            disabled={isRemovingBg}
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 border transition-colors ${
              isRemovingBg
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-wait"
                : "text-purple-600 hover:bg-purple-50 border-purple-200 cursor-pointer group"
            }`}
            title="Quitar fondo mágicamente"
          >
            {isRemovingBg ? (
              <>
                <Spinner className="animate-spin w-4 h-4 text-slate-400" />
                Procesando IA...
              </>
            ) : (
              <>
                <Icon name="sparkles" className="w-4 h-4 group-hover:animate-pulse" />
                Quitar Fondo
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg cursor-pointer"
            >
              Guardar Recorte
            </button>
          </div>
        </div>
    </Modal>
  );
};
