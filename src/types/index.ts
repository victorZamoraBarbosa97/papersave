export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoSlot {
  id: number;
  isOccupied: boolean;
  imageData?: string;
  originalImageData?: string;
  cropData?: CropData;
  isPrinted?: boolean; // espacio ya impreso: bloqueado y sin foto
  imageId?: string; // ID de la imagen en IndexedDB
  originalImageId?: string; // ID de la imagen original en IndexedDB
}

export interface UploadedImage {
  id: string;
  url: string;
  originalUrl?: string;
  originalId?: string;
  cropData?: CropData;
}

export interface PaperState {
  slots: PhotoSlot[];
  clearSlot: (id: number | number[]) => void;
  resetPaper: () => void;
  uploadedImages: UploadedImage[]; // fotos subidas que aún no se colocan en la hoja
  setUploadedImages: (images: UploadedImage[]) => void;
  removeUploadedImage: (id: string) => void;
  updateUploadedImage: (id: string, image: UploadedImage) => void;
  // Una foto recién subida solo entra a la galería; el usuario decide en qué
  // espacio de la hoja colocarla.
  addUploadedImage: (image: UploadedImage) => void;
  // Coloca una foto que ya está en la galería. Sin slotId usa el primer espacio
  // libre. Devuelve false si no hubo lugar (hoja llena o espacio bloqueado).
  placeImageInSlot: (image: UploadedImage, slotId?: number) => boolean;
  // Mueve la foto de un espacio a otro (si el destino tiene foto, se intercambian).
  // Devuelve false si el movimiento no es válido (origen vacío o espacio bloqueado).
  moveSlot: (fromId: number, toId: number) => boolean;
  occupySlot: (
    id: number,
    data: string,
    originalData?: string,
    cropData?: CropData,
    imageId?: string,
    originalImageId?: string,
  ) => void;
  duplicateSlot: (id: number | number[], count?: number) => void;
  toggleSlotPrinted: (id: number | number[]) => void;
  selectedSlotIds: number[];
  toggleSlotSelection: (id: number) => void;
  clearSelection: () => void;
  setSelectedSlots: (ids: number[]) => void;
  // Hay fotos procesándose (subida). No se persiste ni entra al historial.
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export interface PhotoSlotProps {
  id: number;
  imageSrc?: string;
  // El espacio tiene foto aunque su imagen aún no esté lista (rehidratando)
  isOccupied?: boolean;
  className?: string;
  onClear?: (id: number) => void;
  onMouseEnter?: (id: number) => void;
  onMouseLeave?: (id: number) => void;
  isPrinted?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number, e?: React.MouseEvent) => void;
  isExporting?: boolean;
  // Se suelta una foto de la galería sobre este espacio
  onDropGalleryImage?: (slotId: number, imageId: string) => void;
  // Se suelta la foto de otro espacio sobre este (mover o intercambiar)
  onMoveImage?: (fromSlotId: number, toSlotId: number) => void;
  // Clic derecho: el padre abre el menú contextual en (x, y)
  onContextMenu?: (slotId: number, x: number, y: number) => void;
}

export interface CropModalProps {
  imageUrl: string;
  initialCrop?: CropData;
  onClose: () => void;
  onSave: (croppedBlob: Blob, cropData: CropData) => void;
}

export interface PaperSheetProps {
  children: React.ReactNode;
  isExporting?: boolean;
  // Factor de reducción en móvil (1 = tamaño real). Ver usePaperScale.
  scale?: number;
}

export interface HeaderProps {
  onExportPdf: () => void;
  isExporting?: boolean;
  // Abre/cierra el panel lateral (solo existe el botón en móvil)
  onToggleSidebar?: () => void;
}

export interface FaceDetectionResult {
  blob: Blob | File;
  sourceCrop?: { x: number; y: number; width: number; height: number };
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}
