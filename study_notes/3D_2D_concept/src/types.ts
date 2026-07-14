export interface SimSettings {
  noiseLevel: number; // 0 to 100
  spatialStrength: number; // 2DNR strength: 0 to 100
  temporalStrength: number; // 3DNR strength: 0 to 100
  motionAdaptive: boolean; // 3DNR motion adaptive toggle
  motionThreshold: number; // Threshold for motion detection (0 to 100)
  speed: number; // Object movement speed (0 to 10)
  isPlaying: boolean;
  viewMode: 'all' | 'split' | 'compare';
  noiseType: 'gaussian' | 'salt-pepper';
}

export interface DenoiseStats {
  fps: number;
  staticPsnr2D: number;
  staticPsnr3D: number;
  motionBlurIndex2D: number;
  ghostingIndex3D: number;
}
