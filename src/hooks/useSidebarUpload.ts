/* Se encargará de la gestión de archivos (Drag & Drop local y el input de archivos), 
además de centralizar y evitar la duplicación del código que procesa las imágenes con IA.
*/
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { processAndQueueFiles } from "../services/imageProcessor";

export const useSidebarUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      await processAndQueueFiles(files);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files));
  };

  return {
    isDragging,
    isProcessing,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
