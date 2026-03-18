import * as faceapi from "face-api.js";

class Dummy {}

// Parcheamos el entorno para que face-api.js funcione en el Web Worker
// y no falle con "getEnv - environment is not defined"
faceapi.env.setEnv({
  Canvas: OffscreenCanvas,
  CanvasRenderingContext2D:
    (globalThis as unknown as Record<string, unknown>)
      .OffscreenCanvasRenderingContext2D || Dummy,
  Image: Dummy,
  ImageData: ImageData,
  Video: Dummy,
  createCanvasElement: () => new OffscreenCanvas(1, 1),
  createImageElement: () => new Dummy(),
  fetch: fetch.bind(globalThis),
  readFile: () => Promise.reject("File system not available in Web Worker"),
} as unknown as Parameters<typeof faceapi.env.setEnv>[0]);

const MODEL_URL = "/models";
let isModelLoaded = false;

const loadFaceApiModels = async () => {
  if (isModelLoaded) return;
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    isModelLoaded = true;
    console.log("Worker: FaceAPI models loaded successfully");
  } catch (error) {
    console.warn("Worker: Failed to load FaceAPI models", error);
  }
};

self.onmessage = async (e: MessageEvent) => {
  const { id, command, file } = e.data;

  if (command === "preload") {
    await loadFaceApiModels();
    return;
  }

  try {
    await loadFaceApiModels();
    if (!isModelLoaded) {
      self.postMessage({ id, success: true, detections: [] });
      return;
    }

    const bmp = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(bmp, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Convertimos la imagen a un Tensor de TensorFlow.
      // Esto evita por completo el error de validación de elementos HTML en el Worker.
      const tensor = faceapi.tf.browser.fromPixels(imageData);

      const detections = await faceapi.detectAllFaces(
        tensor as unknown as faceapi.TNetInput,
        new faceapi.TinyFaceDetectorOptions(),
      );

      // Liberamos memoria gráfica (crucial para evitar Memory Leaks en TF)
      tensor.dispose();

      // Simplificamos los datos para enviarlos de vuelta al hilo principal por el puente
      const boxes = detections.map((d) => ({
        x: d.box.x,
        y: d.box.y,
        width: d.box.width,
        height: d.box.height,
        area: d.box.area,
      }));
      self.postMessage({ id, success: true, detections: boxes });
    } else {
      self.postMessage({ id, success: true, detections: [] });
    }
  } catch (error) {
    self.postMessage({ id, success: false, error: String(error) });
  }
};
