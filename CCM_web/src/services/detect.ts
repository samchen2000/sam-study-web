import { getPixelsFromImage } from "../utils/cv";
import { generateROIs } from "../utils/roi";

export async function detectColorChecker(img: HTMLImageElement) {
  const pixels = getPixelsFromImage(img);

  const worker = new Worker(
    new URL("../workers/kmeans.worker.ts", import.meta.url)
  );

  return new Promise((resolve) => {
    worker.postMessage({ pixels, k: 24 });

    worker.onmessage = (e) => {
      const { centroids } = e.data;

      const boxes = generateROIs(centroids);

      resolve(boxes);
    };
  });
}