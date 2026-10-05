import { useEffect, useState } from "react";
import { PAPER_WIDTH_PX } from "../config/constants";

// En móvil (< 768 px, el breakpoint `md` de Tailwind) la hoja de 612 px no cabe
// en pantalla: devuelve el factor (<= 1) que la ajusta al ancho disponible.
// En escritorio devuelve siempre 1 y no cambia nada.
const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_SIDE_PADDING_PX = 32; // p-4 a cada lado del área de la hoja

export const usePaperScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      setScale(
        isMobile
          ? Math.min(
              1,
              (window.innerWidth - MOBILE_SIDE_PADDING_PX) / PAPER_WIDTH_PX,
            )
          : 1,
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
};
