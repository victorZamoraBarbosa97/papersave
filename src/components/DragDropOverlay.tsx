import React, { type DragEvent } from "react";

interface DragDropOverlayProps {
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onDragLeave,
  onDrop,
}) => (
  <div
    className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-8 border-blue-500/50 border-dashed m-4 rounded-2xl flex items-center justify-center transition-all duration-200"
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    onDragOver={(e) => e.preventDefault()}
  >
    <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce pointer-events-none">
      <svg
        className="w-20 h-20 text-blue-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        ></path>
      </svg>
      <p className="text-2xl font-bold text-blue-600">
        ¡Suelta tus fotos aquí!
      </p>
      <p className="text-slate-400 mt-2">Se añadirán a tu galería</p>
    </div>
  </div>
);
