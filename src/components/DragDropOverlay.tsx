import React, { type DragEvent } from "react";
import { Icon } from "./Icon";

interface DragDropOverlayProps {
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onDragLeave,
  onDrop,
}) => (
  // El contenedor externo cubre TODA la pantalla (el borde visual es el interno),
  // así no queda ninguna franja donde un archivo soltado abra el navegador.
  <div
    className="absolute inset-0 z-50 p-4"
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    onDragOver={(e) => e.preventDefault()}
  >
   <div className="w-full h-full bg-blue-500/20 backdrop-blur-sm border-8 border-blue-500/50 border-dashed rounded-2xl flex items-center justify-center transition-all duration-200">
    <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce pointer-events-none">
      <Icon name="cloud-upload" className="w-20 h-20 text-blue-500 mb-4" />
      <p className="text-2xl font-bold text-blue-600">
        ¡Suelta tus fotos aquí!
      </p>
      <p className="text-slate-400 mt-2">Se añadirán a tu galería</p>
    </div>
   </div>
  </div>
);
