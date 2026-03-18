// Aísla la carga de archivos al soltarlos en la pantalla.

import { useState, type DragEvent } from "react";
import { processAndQueueFiles } from "../services/imageProcessor";

export const useGlobalDragAndDrop = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      await processAndQueueFiles(files);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isDragging,
    isProcessing,
    handleDragEnter,
    handleDragLeave,
    handleGlobalDrop,
  };
};
