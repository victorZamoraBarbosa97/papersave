import React from "react";

interface PrintPromptProps {
  count: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const PrintPrompt: React.FC<PrintPromptProps> = ({
  count,
  onConfirm,
  onDismiss,
}) => (
  <div
    role="alertdialog"
    aria-label="Marcar fotos como impresas"
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white pl-5 pr-3 py-3 rounded-xl shadow-2xl flex items-center gap-4 text-sm print:hidden"
  >
    <span>
      {count === 1
        ? "Enviaste 1 foto a imprimir."
        : `Enviaste ${count} fotos a imprimir.`}{" "}
      ¿Marcarlas como impresas?
    </span>
    <div className="flex gap-2">
      <button
        onClick={onDismiss}
        className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
      >
        Ahora no
      </button>
      <button
        onClick={onConfirm}
        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold transition-colors cursor-pointer"
      >
        Marcar como impresas
      </button>
    </div>
  </div>
);
