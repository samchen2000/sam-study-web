import { rgbToLab } from "../color/color";

export function analyzeROI(
  imageData: ImageData,
  roi: ROI
){
  let r=0;
  let g=0;
  let b=0;

  let count=0;

  for(
    let y=roi.y;
    y<roi.y+roi.height;
    y++
  ){
    for(
      let x=roi.x;
      x<roi.x+roi.width;
      x++
    ){
      const idx=
        (y*imageData.width+x)*4;

      r+=imageData.data[idx];
      g+=imageData.data[idx+1];
      b+=imageData.data[idx+2];

      count++;
    }
  }

  r/=count;
  g/=count;
  b/=count;

  const lab=
    rgbToLab(r,g,b);

  return {
    rgb:{r,g,b},
    lab
  };
}