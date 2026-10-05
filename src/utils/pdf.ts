import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";

export const exportPaperAsPDF = async (element: HTMLElement) => {
  if (!element) {
    console.error("Element to export not found.");
    return;
  }

  // Use html-to-image which supports modern CSS (like oklch colors in Tailwind 4)
  // JPEG en vez de PNG: la hoja son fotos, y el PNG sin comprimir hacía PDFs
  // enormes (varios MB de más) sin ganancia visible al imprimir.
  const imgData = await toJpeg(element, {
    pixelRatio: 3, // High resolution
    quality: 0.95,
    backgroundColor: "#ffffff", // Ensure background is white for the PDF
    style: {
      backgroundImage: "none", // Remove the dotted grid for the PDF export
    },
  });

  // Create a new PDF in Letter size (inches).
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
    compress: true,
  });

  // Add the image to the PDF, fitting it to the page.
  pdf.addImage(imgData, "JPEG", 0, 0, 8.5, 11, undefined, "FAST");
  pdf.save("papersave-export.pdf");
};
