import React from "react";

export const StatusToast: React.FC = () => (
  <div
    className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-3 print:hidden"
    data-purpose="status-toast"
  >
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    Optimizado para la impresora de Mari.
  </div>
);
