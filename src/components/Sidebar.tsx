import React from "react";
import { usePaperStore } from "../store/usePaperStore";
import { CropModal } from "./CropModal";
import { Modal } from "./Modal";
import { GALLERY_DRAG_MIME } from "../config/constants";
import { useSidebarUpload } from "../hooks/useSidebarUpload";
import { useSidebarActions } from "../hooks/useSidebarActions";
import { Icon, Spinner } from "./Icon";

interface SidebarProps {
  // Solo móvil: el panel es un cajón que se abre desde la cabecera
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const uploadedImages = usePaperStore((state) => state.uploadedImages);
  const slots = usePaperStore((state) => state.slots);

  const isProcessing = usePaperStore((state) => state.isProcessing);

  const { fileInputRef, handleUploadClick, handleFileChange } =
    useSidebarUpload();

  const {
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
  } = useSidebarActions();

  const occupiedSlots = slots.filter((slot) => slot.isOccupied).length;
  const totalSlots = slots.length;
  const usagePercentage =
    totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return (
    <aside
      className={`w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 space-y-8 overflow-y-auto print:hidden ${
        isMobileOpen
          ? "max-md:fixed max-md:top-16 max-md:bottom-0 max-md:left-0 max-md:z-40 max-md:max-w-[85vw] max-md:shadow-2xl"
          : "max-md:hidden"
      }`}
      data-purpose="sidebar"
    >
      {editingImageId &&
        (() => {
          const img = uploadedImages.find((i) => i.id === editingImageId);
          return img ? (
            <CropModal
              imageUrl={img.originalUrl || img.url} // Usa original si existe
              initialCrop={img.cropData}
              onClose={() => setEditingImageId(null)}
              onSave={handleCropSave}
            />
          ) : null;
        })()}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      {/* Upload Section */}
      <section data-purpose="upload-controls">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Controles de Contenido
        </h3>
        <div
          onClick={handleUploadClick}
          className="w-full py-4 px-4 bg-white border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer border-blue-200 hover:border-blue-400 overflow-hidden"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
              <Spinner className="animate-spin h-8 w-8 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">
                Procesando...
              </span>
            </div>
          ) : (
            <>
              <Icon
                name="plus"
                className="h-8 w-8 transition-colors text-blue-400 group-hover:text-blue-600"
              />
              <span className="text-sm font-semibold text-blue-600">
                Subir Fotos
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 text-center italic">
          Arrastra y suelta imágenes de cualquier tamaño
        </p>
      </section>

      {/* Grid Settings */}
      <section data-purpose="grid-actions">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Gestión de Cuadrícula
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleResetGrid}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-100 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Icon name="refresh" className="h-4 w-4" />
              Reiniciar Cuadrícula
            </span>
          </button>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-100 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Icon name="trash" className="h-4 w-4" />
              Limpiar Todo
            </span>
          </button>
        </div>
      </section>

      {/* Uploaded Images Gallery */}
      {uploadedImages.length > 0 && (
        <section data-purpose="uploaded-gallery" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Imágenes ({uploadedImages.length})
            </h3>
            <button
              onClick={handleClearGallery}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
            >
              Borrar Todo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(GALLERY_DRAG_MIME, img.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onDoubleClick={() => {
                  handlePlaceImage(img.id);
                  onCloseMobile?.();
                }}
                title="Arrastra a la hoja o haz doble clic para colocarla"
                className="relative group aspect-3/4 bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={(e) => handleDeleteImage(e, img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 cursor-pointer"
                  title="Eliminar imagen"
                >
                  <Icon name="close" className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleEditClick(e, img.id)}
                  className="absolute top-1 right-8 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-600 cursor-pointer"
                  title="Recortar imagen"
                >
                  <Icon name="pencil" className="w-3 h-3" />
                </button>
                <img
                  src={img.url}
                  alt={`Upload ${img.id}`}
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 text-center italic">
            Arrastra una foto a la hoja o haz doble clic para colocarla.
          </p>
        </section>
      )}

      {/* Status/Stats */}
      <section className="mt-auto" data-purpose="available-slots-indicator">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Espacios Disponibles
            </span>
            <span className="text-xs font-bold text-blue-600">
              {totalSlots - occupiedSlots} / {totalSlots}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 leading-tight">
            Estás usando un {usagePercentage.toFixed(1)}% del papel.
          </p>
        </div>
      </section>

      {/* Modal de Confirmación */}
      {confirmDialog?.isOpen && (
        <Modal
          onClose={() => setConfirmDialog(null)}
          panelClassName="w-80 animate-in fade-in zoom-in-95 duration-200"
        >
            <h3 className="text-lg font-bold text-slate-800">
              Confirmar acción
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Confirmar
              </button>
            </div>
        </Modal>
      )}
    </aside>
  );
};
