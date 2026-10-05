/* Botón "Subir Fotos" del panel lateral: abre el selector de archivos y envía lo
elegido al procesador. Soltar archivos sobre la ventana lo maneja
useGlobalDragAndDrop; ambos comparten processAndQueueFiles.
*/
import { useRef, type ChangeEvent } from "react";
import { processAndQueueFiles } from "../services/imageProcessor";

export const useSidebarUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Se limpia el input para poder volver a elegir los mismos archivos.
    e.target.value = "";
    await processAndQueueFiles(files);
  };

  return { fileInputRef, handleUploadClick, handleFileChange };
};
