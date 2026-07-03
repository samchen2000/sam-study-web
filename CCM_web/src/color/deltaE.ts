export function deltaE76(
  lab1:any,
  lab2:any
){
  return Math.sqrt(
    Math.pow(lab1.L-lab2.L,2)+
    Math.pow(lab1.a-lab2.a,2)+
    Math.pow(lab1.b-lab2.b,2)
  );
}