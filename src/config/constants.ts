/**
 * Configuraciones globales y dimensiones métricas de la aplicación.
 * Centralizar estos valores permite adaptar la aplicación rápidamente
 * a otros estándares de formato de papel o fotografías.
 */

// Dimensiones de la fotografía impresa
export const PASSPORT_WIDTH_CM = 2.5;
export const PASSPORT_HEIGHT_CM = 3.0;
export const PASSPORT_ASPECT_RATIO = PASSPORT_WIDTH_CM / PASSPORT_HEIGHT_CM;

// Modelo de eliminación de fondo (@imgly/background-removal). El build solo
// copia a dist/ los archivos de ESTE modelo (ver vite.config.ts).
export const BG_REMOVAL_MODEL = "isnet_fp16";

// Ajustes de Inteligencia Artificial (Detección Facial)
export const FACE_VERTICAL_OFFSET_PERCENTAGE = 0.13; // Mover el encuadre 13% hacia arriba

// Tipo de dato propio para arrastrar fotos DE LA GALERÍA hacia la hoja.
// Distingue ese arrastre interno de un archivo que viene de la computadora.
export const GALLERY_DRAG_MIME = "application/x-papersave-image";

// Tipo de dato para mover una foto de un espacio de la hoja a otro.
export const SLOT_DRAG_MIME = "application/x-papersave-slot";

// ¿El arrastre es interno de la app (galería u otro espacio)? Si lo es, NO es
// una subida de archivos aunque el navegador incluya "Files" en el dataTransfer.
export const isInternalDrag = (types: readonly string[]) =>
  types.includes(GALLERY_DRAG_MIME) || types.includes(SLOT_DRAG_MIME);

// Ancho en pantalla de la hoja Carta (.letter-paper en index.css). En móvil se
// reduce para caber en la ventana (ver usePaperScale).
export const PAPER_WIDTH_PX = 612;

// Cuadrícula de papel (Grid)
export const PAPER_COLS = 6;
export const PAPER_ROWS = 8;
export const TOTAL_PAPER_SLOTS = PAPER_COLS * PAPER_ROWS;

// Resoluciones en pantalla (Modal de Recorte)
// Multiplicamos por 100 para escalar la calidad del recorte base
export const CROP_WIDTH_PX = PASSPORT_WIDTH_CM * 100;
export const CROP_HEIGHT_PX = PASSPORT_HEIGHT_CM * 100;
