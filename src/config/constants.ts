/**
 * Configuraciones globales y dimensiones métricas de la aplicación.
 * Centralizar estos valores permite adaptar la aplicación rápidamente
 * a otros estándares de formato de papel o fotografías.
 */

// Dimensiones de la fotografía impresa
export const PASSPORT_WIDTH_CM = 2.5;
export const PASSPORT_HEIGHT_CM = 3.0;
export const PASSPORT_ASPECT_RATIO = PASSPORT_WIDTH_CM / PASSPORT_HEIGHT_CM;

// Ajustes de Inteligencia Artificial (Detección Facial)
export const FACE_VERTICAL_OFFSET_PERCENTAGE = 0.13; // Mover el encuadre 13% hacia arriba

// Cuadrícula de papel (Grid)
export const PAPER_COLS = 6;
export const PAPER_ROWS = 8;
export const TOTAL_PAPER_SLOTS = PAPER_COLS * PAPER_ROWS;

// Resoluciones en pantalla (Modal de Recorte)
// Multiplicamos por 100 para escalar la calidad del recorte base
export const CROP_WIDTH_PX = PASSPORT_WIDTH_CM * 100;
export const CROP_HEIGHT_PX = PASSPORT_HEIGHT_CM * 100;
