import { useAppStore } from "../stores/useAppStore";

export default function ImageLoader() {
  const setImage = useAppStore((s) => s.setImage);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <input
      type="file"
      accept="image/*"
      className="text-white"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
      }}
    />
  );
}