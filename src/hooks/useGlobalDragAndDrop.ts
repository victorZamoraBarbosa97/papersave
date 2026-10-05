// Aísla la carga de archivos al soltarlos en la pantalla.

import { useState, type DragEvent } from "react";
import { processAndQueueFiles } from "../services/imageProcessor";
import { isInternalDrag } from "../config/constants";

export const useGlobalDragAndDrop = () => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Un arrastre interno (galería u otro espacio) no es una subida: sin overlay.
    if (
      e.dataTransfer.types.includes("Files") &&
      !isInternalDrag(e.dataTransfer.types)
    ) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const handleGlobalDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isInternalDrag(e.dataTransfer.types)) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await processAndQueueFiles(files);
  };

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleGlobalDrop,
  };
};
