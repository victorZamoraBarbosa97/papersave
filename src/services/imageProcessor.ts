import { usePaperStore } from "../store/usePaperStore";
import { showToast } from "../store/useToastStore";
import { saveImageToDB } from "../utils/storage";
import { processImageWithFaceDetection } from "../utils/faceDetection";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

// Mensaje único con el resultado de la subida (qué entró y qué no).
const notifyResult = (added: number, failed: number, skipped: number) => {
  const parts: string[] = [];
  if (added > 0)
    parts.push(
      `${plural(added, "foto agregada", "fotos agregadas")} a la galería.`,
    );
  if (failed > 0)
    parts.push(`No se pudo procesar ${plural(failed, "foto", "fotos")}.`);
  if (skipped > 0)
    parts.push(
      `${plural(skipped, "archivo ignorado", "archivos ignorados")}: no ${skipped === 1 ? "es" : "son"} imagen.`,
    );
  if (parts.length === 0) return;
  showToast(parts.join(" "), failed > 0 || added === 0 ? "error" : "success");
};

// Procesa las fotos de una en una: conserva el orden de subida en la galería y
// evita saturar memoria/CPU con lotes grandes (la detección facial ya corre en
// un único worker, así que paralelizar no la acelera). Si una foto falla, las
// demás continúan. Mientras corre, `isProcessing` está activo en el store.
export const processAndQueueFiles = async (files: File[]) => {
  if (files.length === 0) return { added: 0, failed: 0, skipped: 0 };

  const { addUploadedImage, setIsProcessing } = usePaperStore.getState();
  let added = 0;
  let failed = 0;
  let skipped = 0;

  setIsProcessing(true);
  try {
    for (const file of files) {
      if (!file || !file.type.startsWith("image/")) {
        skipped++;
        continue;
      }

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
  } finally {
    setIsProcessing(false);
  }

  notifyResult(added, failed, skipped);
  return { added, failed, skipped };
};
