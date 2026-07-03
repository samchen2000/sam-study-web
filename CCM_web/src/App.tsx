import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import ImageLoader from "./components/ImageLoader";
import { useAppStore } from "./stores/useAppStore";
import { useROIStore } from "./stores/useROIStore";
import { detectColorChecker } from "./services/detect";

export default function App() {
  const setImage = useAppStore((s) => s.setImage);
  const setBoxes = useROIStore((s) => s.setBoxes);

  const handleDetect = async (img: HTMLImageElement) => {
    const boxes = await detectColorChecker(img);
    setBoxes(boxes as any);
  };

  return (
    <div className="h-full flex flex-col">
      <Toolbar onDetect={handleDetect} />

      <div className="flex flex-1">
        <Sidebar />

        <div className="flex-1 bg-black">
          <ImageLoader
            onImage={(img) => {
              setImage(img.src);
              handleDetect(img);
            }}
          />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}