export type GeneratedImage = { blob: Blob; suffix: string; width: number };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function drawToCanvas(img: HTMLImageElement, targetWidth: number): Promise<Blob> {
  const scale = Math.min(1, targetWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85)
  );
  return blob;
}

export async function generateResponsiveImages(file: File): Promise<GeneratedImage[]> {
  const img = await loadImage(file);
  const targetWidths = [480, 960, 1600];
  const results: GeneratedImage[] = [];
  for (const w of targetWidths) {
    if (img.naturalWidth >= w) {
      const blob = await drawToCanvas(img, w);
      results.push({ blob, suffix: `${w}w`, width: w });
    }
  }
  // Also include the original file as the last variant
  results.push({ blob: file, suffix: "orig", width: img.naturalWidth });
  return results;
}
