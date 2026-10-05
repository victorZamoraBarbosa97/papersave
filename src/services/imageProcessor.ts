import { usePaperStore } from "../store/usePaperStore";
import { saveImageToDB } from "../utils/storage";
import { processImageWithFaceDetection } from "../utils/faceDetection";

// Procesa las fotos de una en una: conserva el orden de subida en la galería y
// evita saturar memoria/CPU con lotes grandes (la detección facial ya corre en
// un único worker, así que paralelizar no la acelera). Si una foto falla, las
// demás continúan.
export const processAndQueueFiles = async (files: File[]) => {
  const addUploadedImage = usePaperStore.getState().addUploadedImage;
  let added = 0;
  let failed = 0;

  for (const file of files) {
    if (!file || !file.type.startsWith("image/")) continue;

    try {
      // 1. Guardar original en alta resolución
      const originalId = await saveImageToDB(file, false);
      const originalUrl = URL.createObjectURL(file);

      // 2. Procesar recorte mágico con IA
      const { blob: processedBlob, sourceCrop } =
        await processImageWithFaceDetection(file);

      // 3. Guardar imagen recortada
      const id = await saveImageToDB(processedBlob, true, {
        originalId,
        cropData: sourceCrop,
      });
      const url = URL.createObjectURL(processedBlob);

      // 4. Agregar a la galería (no se coloca en la hoja automáticamente)
      addUploadedImage({
        id,
        url,
        originalUrl,
        originalId,
        cropData: sourceCrop,
      });
      added++;
    } catch (error) {
      failed++;
      console.error(`No se pudo procesar "${file.name}":`, error);
    }
  }

  return { added, failed };
};
