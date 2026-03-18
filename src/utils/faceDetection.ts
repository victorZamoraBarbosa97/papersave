import type { FaceDetectionResult } from "../types";
import type { FaceBox } from "../types";
import {
  PASSPORT_ASPECT_RATIO,
  FACE_VERTICAL_OFFSET_PERCENTAGE,
} from "../config/constants";

let worker: Worker | null = null;
let jobIdCounter = 0;
const pendingJobs = new Map<
  number,
  { resolve: (data: FaceBox[]) => void; reject: (err: Error) => void }
>();

const getWorker = () => {
  if (!worker) {
    // Instancia el Worker compatible con Vite y ESModules
    worker = new Worker(
      new URL("../workers/faceDetectionWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    worker.onmessage = (e) => {
      const { id, success, detections, error } = e.data;
      const job = pendingJobs.get(id);
      if (job) {
        if (success) job.resolve(detections);
        else job.reject(new Error(error));
        pendingJobs.delete(id);
      }
    };
  }
  return worker;
};

export const loadFaceApiModels = async () => {
  getWorker().postMessage({ id: -1, command: "preload" });
};

export const processImageWithFaceDetection = async (
  file: File | Blob,
): Promise<FaceDetectionResult> => {
  const imgUrl = URL.createObjectURL(file);

  try {
    const img = new Image();
    img.src = imgUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const w = getWorker();
    const jobId = jobIdCounter++;

    // Envía la petición de procesamiento al hilo en segundo plano (Web Worker)
    const detections = await new Promise<FaceBox[]>((resolve, reject) => {
      pendingJobs.set(jobId, { resolve, reject });
      w.postMessage({ id: jobId, file });
    });

    if (!detections || detections.length === 0) {
      URL.revokeObjectURL(imgUrl);
      return { blob: file };
    }

    // Ya vienen aplanadas desde el worker
    const face = detections.sort(
      (a: FaceBox, b: FaceBox) => b.area - a.area,
    )[0];
    const box = face;

    const targetRatio = PASSPORT_ASPECT_RATIO;

    const cropHeight = box.height / 0.7;
    const cropWidth = cropHeight * targetRatio;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    const verticalOffset = cropHeight * FACE_VERTICAL_OFFSET_PERCENTAGE;
    const x = centerX - cropWidth / 2;
    const y = centerY - cropHeight / 2 - verticalOffset;

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        x,
        y,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(imgUrl);
            resolve({
              blob: blob || file,
              sourceCrop: { x, y, width: cropWidth, height: cropHeight },
            });
          },
          "image/jpeg",
          0.95,
        );
      });
    } else {
      URL.revokeObjectURL(imgUrl);
      return { blob: file };
    }
  } catch (e) {
    console.error("Face detection error:", e);
    URL.revokeObjectURL(imgUrl);
    return { blob: file }; // Fallback to original
  }
};
