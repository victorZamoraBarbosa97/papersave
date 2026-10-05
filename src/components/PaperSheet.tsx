import { forwardRef } from "react";
import type React from "react";
import type { PaperSheetProps } from "../types";
import { PAPER_COLS } from "../config/constants";

export const PaperSheet = forwardRef<HTMLElement, PaperSheetProps>(
  ({ children, isExporting, scale = 1 }, ref) => {
    return (
      <article
        ref={ref}
        className="letter-paper paper-scale"
        data-exporting={isExporting || undefined}
        style={{ "--paper-scale": scale } as React.CSSProperties}
        data-purpose="letter-paper-sheet"
      >
        {/* Safety Margin Overlay */}
        {!isExporting && (
          <div className="safety-margin print:hidden">
            MARGEN DE SEGURIDAD DE 5 CM · NO COLOCAR FOTOS AQUÍ
          </div>
        )}

        {/* Grid Container */}
        <div
          className="p-4 grid gap-1 pr-35.5"
          style={{ gridTemplateColumns: `repeat(${PAPER_COLS}, minmax(0, 1fr))` }}
          data-purpose="grid-layout"
        >
          {children}
        </div>
      </article>
    );
  },
);

PaperSheet.displayName = "PaperSheet";
