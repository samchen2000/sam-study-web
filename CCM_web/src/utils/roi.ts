export function generateROIs(centroids: number[]) {
  const boxes = [];

  const gridSize = 6; // 6x4 = 24

  let index = 0;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      boxes.push({
        id: index,
        x: 100 + x * 60,
        y: 100 + y * 60,
        width: 50,
        height: 50,
        color: centroids[index],
      });
      index++;
    }
  }

  return boxes;
}