const REF_X = 95.047;
const REF_Y = 100;
const REF_Z = 108.883;

function f(t: number) {
  return t > 0.008856
    ? Math.cbrt(t)
    : 7.787 * t + 16 / 116;
}

export function xyzToLab(
  x: number,
  y: number,
  z: number
) {
  x /= REF_X;
  y /= REF_Y;
  z /= REF_Z;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}