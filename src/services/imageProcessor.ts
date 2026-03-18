import { usePaperStore } from "../store/usePaperStore";
import { saveImageToDB } from "../utils/storage";
import { processImageWithFaceDetection } from "../utils/faceDetection";

export const processAndQueueFiles = async (files: File[]) => {
  const addImageAndFillSlot = usePaperStore.getState().addImageAndFillSlot;

  await Promise.all(
    files.map(async (file) => {
      if (file && file.type.startsWith("image/")) {
        // 1. Guardar original en alta resolución
        const originalId = await saveImageToDB(file, false);
        const originalUrl = URL.createObjectURL(file);

        // 2. Procesar recorte mágico con IA
        const { blob: processedBlob, sourceCrop } =
          await processImageWithFaceDetection(file);

        // 3. Guardar imagen recortada
        const id = await saveImageToDB(processedBlob);
        const url = URL.createObjectURL(processedBlob);

        // 4. Actualizar el Store de la UI
        addImageAndFillSlot({
          id,
          url,
          originalUrl,
          originalId,
          cropData: sourceCrop,
        });
      }
    }),
  );
};
