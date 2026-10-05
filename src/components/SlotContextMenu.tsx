import React, { useEffect } from "react";
import { Icon } from "./Icon";

interface SlotContextMenuProps {
  x: number;
  y: number;
  hasImage: boolean;
  isPrinted: boolean;
  // Cuántos espacios hay seleccionados (0 si el espacio no está seleccionado)
  selectionCount: number;
  onEdit: () => void;
  onTogglePrinted: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onClose: () => void;
}

const itemClass =
  "text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 cursor-pointer";

// Menú de clic derecho de un espacio de la hoja. Hay uno solo para toda la
// hoja (antes cada uno de los 48 espacios tenía el suyo).
export const SlotContextMenu: React.FC<SlotContextMenuProps> = ({
  x,
  y,
  hasImage,
  isPrinted,
  selectionCount,
  onEdit,
  onTogglePrinted,
  onDuplicate,
  onClear,
  onClose,
}) => {
  const isMultiSelect = selectionCount > 1;

  // Un clic en cualquier parte cierra el menú.
  useEffect(() => {
    window.addEventListener("click", onClose);
    return () => window.removeEventListener("click", onClose);
  }, [onClose]);

  const run = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <div
      data-modal-open
      className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-md py-1 min-w-35 flex flex-col print:hidden"
      style={{ top: y, left: x }}
    >
      {!isMultiSelect && hasImage && (
        <button onClick={run(onEdit)} className={`${itemClass} text-slate-700`}>
          <Icon name="pencil" className="w-4 h-4" />
          Editar Recorte
        </button>
      )}
      <button
        onClick={run(onTogglePrinted)}
        className={`${itemClass} text-slate-700`}
      >
        {isPrinted ? (
          <Icon name="lock-open" className="w-4 h-4 text-orange-500" />
        ) : (
          <Icon name="lock-closed" className="w-4 h-4 text-slate-500" />
        )}
        {isPrinted
          ? isMultiSelect
            ? "Desbloquear Espacios"
            : "Desbloquear Espacio"
          : isMultiSelect
            ? "Marcar como Impresos"
            : "Marcar como Impreso"}
      </button>
      {(hasImage || isMultiSelect) && (
        <button
          onClick={run(onDuplicate)}
          className={`${itemClass} text-slate-700`}
        >
          <Icon name="duplicate" className="w-4 h-4" />
          {isMultiSelect ? `Duplicar (${selectionCount})` : "Duplicar"}
        </button>
      )}
      {(hasImage || isMultiSelect) && (
        <button
          onClick={run(onClear)}
          className={`${itemClass} text-red-600 hover:bg-red-50`}
        >
          <Icon name="trash" className="w-4 h-4" />
          {isMultiSelect
            ? `Limpiar Espacios (${selectionCount})`
            : "Limpiar Espacio"}
        </button>
      )}
    </div>
  );
};
