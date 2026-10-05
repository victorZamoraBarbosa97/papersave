import React from "react";
import { Spinner } from "./Icon";

export const ProcessingOverlay: React.FC = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
      <Spinner className="animate-spin h-12 w-12 text-blue-600" />
      <p className="text-lg font-semibold text-slate-700">
        Procesando imagen...
      </p>
    </div>
  </div>
);
