import { forwardRef } from "react";
import type { PaperSheetProps } from "../types";

export const PaperSheet = forwardRef<HTMLElement, PaperSheetProps>(
  ({ children, isExporting }, ref) => {
    return (
      <article
        ref={ref}
        className="letter-paper"
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
          className="p-4 grid grid-cols-6 gap-1 pr-35.5"
          data-purpose="grid-layout"
        >
          {children}
        </div>
      </article>
    );
  },
);

PaperSheet.displayName = "PaperSheet";
