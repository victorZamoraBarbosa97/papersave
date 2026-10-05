import React, { useState } from "react";
import { Modal } from "./Modal";

interface DuplicateDialogProps {
  onConfirm: (count: number) => void;
  onClose: () => void;
}

export const DuplicateDialog: React.FC<DuplicateDialogProps> = ({
  onConfirm,
  onClose,
}) => {
  const [count, setCount] = useState("1");

  const confirm = () => {
    const n = parseInt(count || "0", 10);
    if (n > 0) onConfirm(n);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      panelClassName="w-80 animate-in fade-in zoom-in-95 duration-200"
    >
      <h3 className="text-lg font-bold text-slate-800">Duplicar imagen</h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        ¿Cuántas copias deseas crear?
      </p>
      <input
        type="number"
        min="1"
        value={count}
        onChange={(e) => setCount(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirm();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
        onFocus={(e) => e.target.select()}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={confirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          Duplicar
        </button>
      </div>
    </Modal>
  );
};
