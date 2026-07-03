export function rgbToXyz(
  r: number,
  g: number,
  b: number
) {
  r /= 255;
  g /= 255;
  b /= 255;

  r =
    r > 0.04045
      ? Math.pow((r + 0.055) / 1.055, 2.4)
      : r / 12.92;

  g =
    g > 0.04045
      ? Math.pow((g + 0.055) / 1.055, 2.4)
      : g / 12.92;

  b =
    b > 0.04045
      ? Math.pow((b + 0.055) / 1.055, 2.4)
      : b / 12.92;

  const x =
    r * 0.4124564 +
    g * 0.3575761 +
    b * 0.1804375;

  const y =
    r * 0.2126729 +
    g * 0.7151522 +
    b * 0.072175;

  const z =
    r * 0.0193339 +
    g * 0.119192 +
    b * 0.9503041;

  return {
    x: x * 100,
    y: y * 100,
    z: z * 100,
  };
}