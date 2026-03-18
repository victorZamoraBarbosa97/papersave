import React, { useState, useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";
import type { HeaderProps } from "../types";

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
  ({ onExportPdf, isExporting }) => {
    return (
      <header
        className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 print:hidden"
        data-purpose="main-header"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            PaperSave
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-4 mr-2">
            <button
              onClick={() => usePaperStore.temporal.getState().undo()}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer active:scale-95"
              title="Deshacer (Ctrl+Z)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                ></path>
              </svg>
            </button>
            <button
              onClick={() => usePaperStore.temporal.getState().redo()}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer active:scale-95"
              title="Rehacer (Ctrl+Y)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                ></path>
              </svg>
            </button>
          </div>
          <SaveStatus />
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            className={`px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2 ${
              isExporting ? "opacity-75 cursor-wait" : ""
            }`}
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-700"
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
                Generando...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Exportar PDF
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              ></path>
            </svg>
            Imprimir
          </button>
        </div>
      </header>
    );
  },
);
