export function labToLch(
  L:number,
  a:number,
  b:number
){
  const C =
    Math.sqrt(a*a+b*b);

  const H =
    (Math.atan2(b,a)*180)/Math.PI;

  return {
    L,
    C,
    H
  };
}