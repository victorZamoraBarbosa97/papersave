import { useState, useRef, useEffect, useCallback } from "react";
import type { CropData } from "../types";

export const useCropModal = (
  initialCrop: CropData | undefined,
  CROP_WIDTH: number,
  CROP_HEIGHT: number,
  onSave: (blob: Blob, cropData: CropData) => void,
  onClose: () => void,
) => {
  // Initialize state directly from props to avoid cascading renders
  const [scale, setScale] = useState(() => {
    if (initialCrop) {
      return CROP_WIDTH / initialCrop.width;
    }
    return 1;
  });

  const [position, setPosition] = useState(() => {
    if (initialCrop) {
      const newScale = CROP_WIDTH / initialCrop.width;
      return { x: -initialCrop.x * newScale, y: -initialCrop.y * newScale };
    }
    return { x: 0, y: 0 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault(); // Ya no tirará error porque passive es false
      const zoomSpeed = 0.0001; // Adjust zoom sensitivity
      setScale((prevScale) => {
        const newScale = prevScale - e.deltaY * zoomSpeed;
        return Math.max(0.1, Math.min(newScale, 3));
      });
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CROP_WIDTH;
    canvas.height = CROP_HEIGHT;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (ctx && img) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      ctx.drawImage(
        img,
        position.x,
        position.y,
        img.naturalWidth * scale,
        img.naturalHeight * scale,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cropData: CropData = {
              x: -position.x / scale,
              y: -position.y / scale,
              width: CROP_WIDTH / scale,
              height: CROP_HEIGHT / scale,
            };
            onSave(blob, cropData);
          }
        },
        "image/jpeg",
        0.95,
      );
    }
  }, [brightness, contrast, position, scale, onSave, CROP_WIDTH, CROP_HEIGHT]);

  // Atajos de teclado para guardar y cancelar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, onClose]);

  return {
    scale,
    setScale,
    position,
    setPosition,
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
  };
};
