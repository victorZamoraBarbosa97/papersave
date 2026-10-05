import React from "react";
import { useToastStore } from "../store/useToastStore";
import { Icon } from "./Icon";

export const Toast: React.FC = () => {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);

  if (!message) return null;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-lg shadow-2xl text-sm flex items-center gap-3 z-50 max-md:max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 print:hidden"
    >
      {type === "error" ? (
        <Icon name="alert-circle" className="w-5 h-5 text-red-400" />
      ) : (
        <Icon name="check-circle" className="w-5 h-5 text-green-400" />
      )}
      <span className="font-medium tracking-wide">{message}</span>
    </div>
  );
};
