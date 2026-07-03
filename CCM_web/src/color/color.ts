import { rgbToXyz } from "./xyz";
import { xyzToLab } from "./lab";

export function rgbToLab(
  r:number,
  g:number,
  b:number
){
  const xyz = rgbToXyz(r,g,b);

  return xyzToLab(
    xyz.x,
    xyz.y,
    xyz.z
  );
}