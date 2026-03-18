//  Aísla toda la lógica de seleccionar fotos arrastrando un cuadro (Marquee).

import { useState, useEffect } from "react";
import { usePaperStore } from "../store/usePaperStore";

export const useMarqueeSelection = () => {
  const [marqueeStart, setMarqueeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const setSelectedSlots = usePaperStore((state) => state.setSelectedSlots);
  const clearSelection = usePaperStore((state) => state.clearSelection);

  useEffect(() => {
    if (!marqueeStart) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMarqueeCurrent({ x: e.clientX, y: e.clientY });

      const left = Math.min(marqueeStart.x, e.clientX);
      const top = Math.min(marqueeStart.y, e.clientY);
      const right = Math.max(marqueeStart.x, e.clientX);
      const bottom = Math.max(marqueeStart.y, e.clientY);

      const newSelectedIds: number[] = [];
      document.querySelectorAll("[data-slot-id]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isIntersecting = !(
          rect.right < left ||
          rect.left > right ||
          rect.bottom < top ||
          rect.top > bottom
        );
        if (isIntersecting) {
          const id = parseInt(el.getAttribute("data-slot-id") || "-1", 10);
          if (id !== -1) newSelectedIds.push(id);
        }
      });
      setSelectedSlots(newSelectedIds);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const dist = Math.hypot(
        e.clientX - marqueeStart.x,
        e.clientY - marqueeStart.y,
      );
      if (
        dist < 3 &&
        !(e.target as HTMLElement).closest('[data-purpose="photo-entry"]')
      ) {
        clearSelection();
      }
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [marqueeStart, setSelectedSlots, clearSelection]);

  const handleMainMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    if ((e.target as HTMLElement).closest("button")) return; // Ignorar botones
    if ((e.target as HTMLElement).closest('[data-purpose="photo-entry"]'))
      return;

    setMarqueeStart({ x: e.clientX, y: e.clientY });
    setMarqueeCurrent({ x: e.clientX, y: e.clientY });
  };

  return { marqueeStart, marqueeCurrent, handleMainMouseDown };
};
