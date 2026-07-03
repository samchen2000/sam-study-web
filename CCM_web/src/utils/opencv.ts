export const loadOpenCV = async () => {
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.x/opencv.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};