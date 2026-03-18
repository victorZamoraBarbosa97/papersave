import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

export const exportPaperAsPDF = async (element: HTMLElement) => {
  if (!element) {
    console.error("Element to export not found.");
    return;
  }

  // Use html-to-image which supports modern CSS (like oklch colors in Tailwind 4)
  const imgData = await toPng(element, {
    pixelRatio: 3, // High resolution
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
  });

  // Add the image to the PDF, fitting it to the page.
  pdf.addImage(imgData, "PNG", 0, 0, 8.5, 11);
  pdf.save("papersave-export.pdf");
};
