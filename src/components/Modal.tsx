import React from "react";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  // Capa y fondo (ej. "z-100 bg-slate-900/50")
  backdropClassName?: string;
  // Ancho y animación del panel (ej. "w-80 animate-in fade-in")
  panelClassName?: string;
}

// Ventana modal: fondo que cierra al hacer clic fuera + panel blanco.
// `data-modal-open` le avisa a los atajos de teclado que hay un popup abierto
// (ver useGlobalShortcuts) para que no borren ni deshagan cosas de la hoja.
export const Modal: React.FC<ModalProps> = ({
  onClose,
  children,
  backdropClassName = "z-100 bg-slate-900/50",
  panelClassName = "",
}) => (
  <div
    data-modal-open
    role="dialog"
    aria-modal="true"
    className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm print:hidden ${backdropClassName}`}
    onClick={onClose}
  >
    <div
      className={`bg-white p-6 rounded-xl shadow-2xl flex flex-col gap-4 max-md:max-w-[calc(100vw-2rem)] max-md:max-h-[95dvh] max-md:overflow-y-auto ${panelClassName}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);
