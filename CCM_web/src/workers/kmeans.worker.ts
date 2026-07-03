self.onmessage = (e) => {
  const { pixels, k } = e.data;

  // 簡化版 KMeans（Web Worker 版）
  const centroids = initCentroids(pixels, k);

  let clusters = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < 10; iter++) {
    // assign
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let best = 0;

      for (let j = 0; j < k; j++) {
        const d = dist(pixels[i], centroids[j]);
        if (d < minDist) {
          minDist = d;
          best = j;
        }
      }
      clusters[i] = best;
    }

    // update
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);

    for (let i = 0; i < pixels.length; i++) {
      const c = clusters[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      sums[c][3] += 1;
    }

    for (let j = 0; j < k; j++) {
      if (sums[j][3] > 0) {
        centroids[j] = [
          sums[j][0] / sums[j][3],
          sums[j][1] / sums[j][3],
          sums[j][2] / sums[j][3],
        ];
      }
    }
  }

  self.postMessage({ centroids, clusters });
};

function dist(a: number[], b: number[]) {
  return (
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

function initCentroids(pixels: number[][], k: number) {
  const result = [];
  for (let i = 0; i < k; i++) {
    result.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }
  return result;
}