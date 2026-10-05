import { beforeEach, describe, expect, it } from "vitest";
import { usePaperStore } from "./usePaperStore";
import type { UploadedImage } from "../types";

const store = () => usePaperStore.getState();
const history = () => usePaperStore.temporal.getState();
const photo = (id: string): UploadedImage => ({
  id,
  url: `blob:${id}`,
  originalId: `orig-${id}`,
  originalUrl: `blob:orig-${id}`,
  cropData: { x: 1, y: 2, width: 3, height: 4 },
});

beforeEach(() => {
  store().resetPaper();
  store().setUploadedImages([]);
  store().clearSelection();
  history().clear();
  localStorage.clear();
});

describe("galería y colocación", () => {
  it("una foto subida solo entra a la galería, sin tocar la hoja ni el historial", () => {
    store().addUploadedImage(photo("a"));

    expect(store().uploadedImages).toHaveLength(1);
    expect(store().slots.every((s) => !s.isOccupied)).toBe(true);
    expect(history().pastStates).toHaveLength(0);
  });

  it("placeImageInSlot usa el primer espacio libre o el indicado, y rechaza uno impreso", () => {
    expect(store().placeImageInSlot(photo("a"))).toBe(true);
    expect(store().slots[0].imageId).toBe("a");
    expect(store().slots[0].originalImageId).toBe("orig-a");

    expect(store().placeImageInSlot(photo("b"), 5)).toBe(true);
    expect(store().slots[5].imageId).toBe("b");

    store().toggleSlotPrinted(7);
    expect(store().placeImageInSlot(photo("c"), 7)).toBe(false);
    expect(store().slots[7].imageData).toBeUndefined();
  });
});

describe("mover, limpiar y duplicar", () => {
  it("moveSlot mueve a un espacio vacío e intercambia con uno ocupado", () => {
    store().placeImageInSlot(photo("a"), 0);
    store().placeImageInSlot(photo("b"), 1);

    expect(store().moveSlot(0, 10)).toBe(true);
    expect(store().slots[10].imageId).toBe("a");
    expect(store().slots[0].isOccupied).toBe(false);

    expect(store().moveSlot(10, 1)).toBe(true);
    expect(store().slots[10].imageId).toBe("b");
    expect(store().slots[1].imageId).toBe("a");
    expect(store().slots[1].originalImageId).toBe("orig-a");
  });

  it("moveSlot rechaza orígenes vacíos o impresos y destinos impresos", () => {
    store().placeImageInSlot(photo("a"), 0);
    store().toggleSlotPrinted(3);

    expect(store().moveSlot(0, 3)).toBe(false);
    expect(store().moveSlot(20, 21)).toBe(false);
    expect(store().moveSlot(3, 0)).toBe(false);
    expect(store().slots[0].imageId).toBe("a");
  });

  it("clearSlot limpia imagen, original, recorte e ids", () => {
    store().placeImageInSlot(photo("a"), 2);
    store().clearSlot(2);

    const slot = store().slots[2];
    expect(slot.isOccupied).toBe(false);
    expect(slot.imageId).toBeUndefined();
    expect(slot.originalImageId).toBeUndefined();
    expect(slot.cropData).toBeUndefined();
  });

  it("duplicateSlot ignora espacios impresos y no deja pasos vacíos en el historial", () => {
    store().placeImageInSlot(photo("a"), 0);
    store().toggleSlotPrinted(0); // ya no tiene foto
    history().clear();

    store().duplicateSlot(0, 3);

    expect(store().slots.filter((s) => s.isOccupied)).toHaveLength(1);
    expect(history().pastStates).toHaveLength(0);
  });
});

describe("marcar como impreso", () => {
  it("libera la foto al marcar y deja el espacio vacío y libre al desbloquear", () => {
    store().placeImageInSlot(photo("a"), 0);

    store().toggleSlotPrinted(0);
    expect(store().slots[0]).toMatchObject({ isPrinted: true, isOccupied: true });
    expect(store().slots[0].imageData).toBeUndefined();
    expect(store().slots[0].imageId).toBeUndefined();

    store().toggleSlotPrinted(0);
    expect(store().slots[0]).toMatchObject({ isPrinted: false, isOccupied: false });
  });
});

describe("historial (deshacer)", () => {
  it("solo registra cambios de la hoja: la selección no ocupa pasos", () => {
    store().placeImageInSlot(photo("a"), 0);
    const steps = history().pastStates.length;

    for (let i = 0; i < 20; i++) store().setSelectedSlots([i, i + 1]);

    expect(history().pastStates).toHaveLength(steps);
  });
});

describe("persistencia", () => {
  it("guarda la versión y los ids, pero no las blob URLs", () => {
    store().placeImageInSlot(photo("a"), 0);

    const saved = JSON.parse(localStorage.getItem("paper-storage")!);
    expect(saved.version).toBe(1);
    expect(saved.state.slots[0].imageId).toBe("a");
    expect(saved.state.slots[0].imageData).toBeUndefined();
  });

  it("no descarta la hoja guardada por la versión anterior (zustand la guardaba con version 0)", async () => {
    const slots = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      isOccupied: i === 3,
      imageId: i === 3 ? "img-3" : undefined,
    }));
    // Formato real de la versión anterior: sin `version` en el código, zustand
    // escribía `version: 0`. Al abrir con version 1 debe llamar a `migrate`.
    localStorage.setItem(
      "paper-storage",
      JSON.stringify({ state: { slots }, version: 0 }),
    );

    await usePaperStore.persist.rehydrate();

    expect(store().slots).toHaveLength(48);
    expect(store().slots[3]).toMatchObject({ isOccupied: true, imageId: "img-3" });
  });
});
