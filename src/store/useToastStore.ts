import { create } from "zustand";

type ToastType = "success" | "error";

interface ToastState {
  message: string | null;
  type: ToastType;
}

// Un solo aviso a la vez: uno nuevo reemplaza al anterior y reinicia el tiempo.
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>()(() => ({
  message: null,
  type: "success",
}));

export const showToast = (message: string, type: ToastType = "success") => {
  clearTimeout(hideTimer);
  useToastStore.setState({ message, type });
  // Los errores se quedan más tiempo para que dé tiempo de leerlos.
  hideTimer = setTimeout(
    () => useToastStore.setState({ message: null }),
    type === "error" ? 5000 : 3000,
  );
};
