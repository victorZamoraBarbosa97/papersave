import React from "react";
import { usePaperStore } from "../store/usePaperStore";
import { CropModal } from "./CropModal";
import { useSidebarUpload } from "../hooks/useSidebarUpload";
import { useSidebarActions } from "../hooks/useSidebarActions";

export const Sidebar: React.FC = () => {
  const uploadedImages = usePaperStore((state) => state.uploadedImages);
  const slots = usePaperStore((state) => state.slots);

  const {
    isDragging,
    isProcessing,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useSidebarUpload();

  const {
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
  } = useSidebarActions();

  const occupiedSlots = slots.filter((slot) => slot.isOccupied).length;
  const totalSlots = slots.length;
  const usagePercentage =
    totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return (
    <aside
      className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 space-y-8 overflow-y-auto print:hidden"
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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full py-4 px-4 bg-white border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-105 shadow-md"
              : "border-blue-200 hover:border-blue-400"
          } overflow-hidden`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm font-semibold text-blue-600">
                Procesando...
              </span>
            </div>
          ) : (
            <>
              <svg
                className={`h-8 w-8 transition-colors ${
                  isDragging
                    ? "text-blue-600"
                    : "text-blue-400 group-hover:text-blue-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-sm font-semibold text-blue-600">
                {isDragging ? "Suelta tus fotos aquí" : "Subir Fotos"}
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
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Reiniciar Cuadrícula
            </span>
          </button>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-100 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
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
                className="relative group aspect-3/4 bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={(e) => handleDeleteImage(e, img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 cursor-pointer"
                  title="Eliminar imagen"
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
                <button
                  onClick={(e) => handleEditClick(e, img.id)}
                  className="absolute top-1 right-8 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-600 cursor-pointer"
                  title="Recortar imagen"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <img
                  src={img.url}
                  alt={`Upload ${img.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
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

      {/* Notificación (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-lg shadow-2xl text-sm flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span className="font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmDialog?.isOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-2xl w-80 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
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
          </div>
        </div>
      )}
    </aside>
  );
};
