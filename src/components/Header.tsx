import React, { useState, useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";
import type { HeaderProps } from "../types";
import { undoSafely, redoSafely } from "../utils/history";
import { Icon, Spinner } from "./Icon";

const SaveStatus: React.FC = () => {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [timeText, setTimeText] = useState("Justo ahora");

  useEffect(() => {
    const unsubscribe = usePaperStore.subscribe(() => {
      setLastSaved(new Date());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const updateTimeText = () => {
      const seconds = Math.floor(
        (new Date().getTime() - lastSaved.getTime()) / 1000,
      );
      if (seconds < 60) setTimeText("Justo ahora");
      else if (seconds < 3600)
        setTimeText(`hace ${Math.floor(seconds / 60)} min`);
      else setTimeText(`hace ${Math.floor(seconds / 3600)} hr`);
    };

    updateTimeText();
    const interval = setInterval(updateTimeText, 10000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  return (
    <div className="text-sm text-slate-500 mr-4">
      Guardado: <span className="font-medium">{timeText}</span>
    </div>
  );
};

export const Header = React.memo<HeaderProps>(
  ({ onExportPdf, isExporting, onToggleSidebar }) => {
    return (
      <header
        className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 max-md:px-3 shrink-0 z-10 print:hidden"
        data-purpose="main-header"
      >
        <div className="flex items-center gap-2">
          {/* Solo en móvil: abre el panel lateral */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Abrir o cerrar el panel de fotos"
          >
            <Icon name="menu" className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Icon name="document" className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight max-[380px]:hidden">
            PaperSave
          </h1>
        </div>
        <div className="flex items-center gap-4 max-md:gap-2">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-4 mr-2 max-md:border-r-0 max-md:pr-0 max-md:mr-0">
            <button
              onClick={() => undoSafely()}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer active:scale-95"
              title="Deshacer (Ctrl+Z)"
            >
              <Icon name="undo" className="w-5 h-5" />
            </button>
            <button
              onClick={() => redoSafely()}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer active:scale-95"
              title="Rehacer (Ctrl+Y)"
            >
              <Icon name="redo" className="w-5 h-5" />
            </button>
          </div>
          <span className="max-md:hidden">
            <SaveStatus />
          </span>
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            aria-label="Exportar PDF"
            className={`px-4 py-2 max-md:px-2.5 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2 ${
              isExporting ? "opacity-75 cursor-wait" : ""
            }`}
          >
            {isExporting ? (
              <>
                <Spinner className="animate-spin -ml-1 mr-2 max-md:mr-0 h-4 w-4 text-slate-700" />
                <span className="max-md:hidden">Generando...</span>
              </>
            ) : (
              <>
                <Icon name="document-download" className="w-4 h-4" />
                <span className="max-md:hidden">Exportar PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            aria-label="Imprimir"
            className="px-4 py-2 max-md:px-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <Icon name="print" className="w-4 h-4" />
            <span className="max-md:hidden">Imprimir</span>
          </button>
        </div>
      </header>
    );
  },
);
