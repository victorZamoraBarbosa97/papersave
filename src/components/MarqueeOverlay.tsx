import React from "react";

interface MarqueeOverlayProps {
  marqueeStart: { x: number; y: number };
  marqueeCurrent: { x: number; y: number };
}

export const MarqueeOverlay: React.FC<MarqueeOverlayProps> = ({
  marqueeStart,
  marqueeCurrent,
}) => (
  <div
    className="fixed bg-blue-500/20 border border-blue-500/50 pointer-events-none z-100"
    style={{
      left: Math.min(marqueeStart.x, marqueeCurrent.x),
      top: Math.min(marqueeStart.y, marqueeCurrent.y),
      width: Math.abs(marqueeCurrent.x - marqueeStart.x),
      height: Math.abs(marqueeCurrent.y - marqueeStart.y),
    }}
  />
);
