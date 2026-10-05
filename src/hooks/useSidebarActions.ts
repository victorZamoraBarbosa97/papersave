/*  acciones relacionadas con los botones de la interfaz 
(borrar, editar, reiniciar), además del estado de las notificaciones (Toasts) 
y el modal de confirmación con sus atajos de teclado.
*/

import { useState, useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";
import { showToast } from "../store/useToastStore";
import type { CropData } from "../types";
import { saveImageToDB, clearAllImagesFromDB } from "../utils/storage";

export const useSidebarActions = () => {
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
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

  // La galería solo quita miniaturas: NUNCA borra blobs de IndexedDB, porque
  // la misma imagen puede estar en un slot de la hoja (o en el historial de
  // deshacer). El recolector de useAppInitialization elimina lo huérfano.
  const handleDeleteImage = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeUploadedImage(id);
  };

  // Doble clic en una miniatura: la coloca en el primer espacio libre.
  const handlePlaceImage = (id: string) => {
    const image = usePaperStore
      .getState()
      .uploadedImages.find((img) => img.id === id);
    if (!image) return;
    const placed = usePaperStore.getState().placeImageInSlot(image);
    showToast(
      placed
        ? "Foto colocada en la hoja."
        : "No hay espacios libres en la hoja.",
    );
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageId(id);
  };

  const handleCropSave = async (blob: Blob, newCropData: CropData) => {
    if (!editingImageId) return;
    const current = usePaperStore
      .getState()
      .uploadedImages.find((img) => img.id === editingImageId);
    try {
      const newId = await saveImageToDB(blob, true, {
        originalId: current?.originalId,
        cropData: newCropData,
      });
      const newUrl = URL.createObjectURL(blob);
      // Merge: se conserva el original (originalId/originalUrl) para poder
      // volver a re-encuadrar desde la foto completa.
      updateUploadedImage(editingImageId, {
        ...current,
        id: newId,
        url: newUrl,
        cropData: newCropData,
      });
      // El blob anterior no se borra aquí: un slot puede seguir usándolo.
    } catch (error) {
      console.error("Failed to save cropped image:", error);
    }
    setEditingImageId(null);
  };

  const handleClearGallery = () => {
    setConfirmDialog({
      isOpen: true,
      message:
        "¿Quitar todas las miniaturas de la galería? Las fotos que ya están en la hoja no se verán afectadas.",
      onConfirm: () => {
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
        // Borrado total e irreversible: se vacía el historial antes de la base
        // de datos para que Ctrl+Z no restaure slots cuyos blobs ya no existen.
        usePaperStore.temporal.getState().clear();
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
    confirmDialog,
    setConfirmDialog,
    handleDeleteImage,
    handlePlaceImage,
    handleEditClick,
    handleCropSave,
    handleClearGallery,
    handleClearAll,
    handleResetGrid,
  };
};
