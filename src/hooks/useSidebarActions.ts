/*  acciones relacionadas con los botones de la interfaz 
(borrar, editar, reiniciar), además del estado de las notificaciones (Toasts) 
y el modal de confirmación con sus atajos de teclado.
*/

import { useState, useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";
import type { CropData } from "../types";
import {
  saveImageToDB,
  deleteImageFromDB,
  clearAllImagesFromDB,
} from "../utils/storage";

export const useSidebarActions = () => {
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const removeUploadedImage = usePaperStore(
    (state) => state.removeUploadedImage,
  );
  const setUploadedImages = usePaperStore((state) => state.setUploadedImages);
  const updateUploadedImage = usePaperStore(
    (state) => state.updateUploadedImage,
  );
  const resetPaper = usePaperStore((state) => state.resetPaper);

  useEffect(() => {
    if (!confirmDialog?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmDialog.onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setConfirmDialog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDialog]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteImage = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteImageFromDB(id);
      removeUploadedImage(id);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageId(id);
  };

  const handleCropSave = async (blob: Blob, newCropData: CropData) => {
    if (!editingImageId) return;
    try {
      const newId = await saveImageToDB(blob);
      const newUrl = URL.createObjectURL(blob);
      updateUploadedImage(editingImageId, {
        id: newId,
        url: newUrl,
        cropData: newCropData,
      });
      await deleteImageFromDB(editingImageId);
    } catch (error) {
      console.error("Failed to save cropped image:", error);
    }
    setEditingImageId(null);
  };

  const handleClearGallery = () => {
    setConfirmDialog({
      isOpen: true,
      message:
        "¿Estás seguro de que deseas eliminar todas las fotos de la galería? Esto liberará memoria del navegador.",
      onConfirm: async () => {
        await clearAllImagesFromDB();
        setUploadedImages([]);
        showToast("Galería limpiada correctamente.");
        setConfirmDialog(null);
      },
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      message:
        "¿Estás seguro de que deseas vaciar la cuadrícula por completo y eliminar todas las imágenes subidas?",
      onConfirm: async () => {
        resetPaper();
        await clearAllImagesFromDB();
        setUploadedImages([]);
        showToast("Todo se ha limpiado correctamente.");
        setConfirmDialog(null);
      },
    });
  };

  const handleResetGrid = () => {
    resetPaper();
    showToast("Cuadrícula reiniciada correctamente.");
  };

  return {
    editingImageId,
    setEditingImageId,
    toastMessage,
    confirmDialog,
    setConfirmDialog,
    handleDeleteImage,
    handleEditClick,
    handleCropSave,
    handleClearGallery,
    handleClearAll,
    handleResetGrid,
  };
};
