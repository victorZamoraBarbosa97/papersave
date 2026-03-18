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
  isPrinted?: boolean; //
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
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[]) => void;
  removeUploadedImage: (id: string) => void;
  updateUploadedImage: (id: string, image: UploadedImage) => void;
  addImageAndFillSlot: (image: UploadedImage) => void;
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
  updateSlotUrls: (
    id: number,
    imageData?: string,
    originalImageData?: string,
  ) => void;
  selectedSlotIds: number[];
  toggleSlotSelection: (id: number) => void;
  clearSelection: () => void;
  setSelectedSlots: (ids: number[]) => void;
}

export interface PhotoSlotProps {
  id: number;
  imageSrc?: string;
  className?: string;
  onClear?: (id: number) => void;
  onEdit?: (id: number) => void;
  onMouseEnter?: (id: number) => void;
  onMouseLeave?: (id: number) => void;
  onDuplicate?: (id: number, count: number) => void;
  isPrinted?: boolean;
  onTogglePrinted?: (id: number) => void;
  isSelected?: boolean;
  onSelect?: (id: number, e?: React.MouseEvent) => void;
  selectionCount?: number;
  isExporting?: boolean;
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
}

export interface HeaderProps {
  onExportPdf: () => void;
  isExporting?: boolean;
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
