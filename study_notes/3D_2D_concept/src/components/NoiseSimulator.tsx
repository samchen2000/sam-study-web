import React, { useRef, useEffect, useState } from 'react';
import { SimSettings, DenoiseStats } from '../types';
import { Play, Pause, RefreshCw, Eye, Sparkles, Settings2, Check } from 'lucide-react';

interface Props {
  settings: SimSettings;
  setSettings: React.Dispatch<React.SetStateAction<SimSettings>>;
}

export default function NoiseSimulator({ settings, setSettings }: Props) {
  const [stats, setStats] = useState<DenoiseStats>({
    fps: 0,
    staticPsnr2D: 35,
    staticPsnr3D: 42,
    motionBlurIndex2D: 25,
    ghostingIndex3D: 45,
  });

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Canvases
  const canvasOriginalRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2DNRRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3DNRRef = useRef<HTMLCanvasElement | null>(null);

  // Offscreen generation canvas to build the perfect, clean video stream
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep a buffer of the previous 3DNR output frame to perform temporal blending
  const prev3DFrameBufferRef = useRef<Uint8ClampedArray | null>(null);

  // Object state: Bouncing ball coordinate
  const objectPosRef = useRef({ x: 50, y: 75, dx: 2, dy: 1 });

  // Handle setting updates
  const handleSliderChange = (key: keyof SimSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    // Initialize offscreen canvas
    const width = 240;
    const height = 150;
    
    if (!offscreenCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      offscreenCanvasRef.current = canvas;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const renderLoop = (time: number) => {
      if (!active) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;

      if (delta >= 1000) {
        setStats((prev) => ({
          ...prev,
          fps: Math.round((frameCountRef.current * 1000) / delta),
          // Dynamically compute estimated PSNR/degradation indicators for educational purposes
          staticPsnr2D: Math.round(30 + (settings.spatialStrength * 0.15) - (settings.noiseLevel * 0.1)),
          staticPsnr3D: Math.round(
            32 + 
            (settings.temporalStrength * 0.25) - 
            (settings.noiseLevel * 0.08) - 
            (settings.motionAdaptive ? 0 : settings.speed * 0.5)
          ),
          motionBlurIndex2D: Math.round(settings.spatialStrength * 0.75),
          ghostingIndex3D: settings.motionAdaptive 
            ? Math.round(settings.speed * 1.5) 
            : Math.round(settings.speed * settings.temporalStrength * 0.08)
        }));
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }

      if (settings.isPlaying) {
        drawFrame();
        frameCountRef.current++;
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [settings]);

  // Execute one initial render if paused, or when parameters change
  useEffect(() => {
    if (!settings.isPlaying) {
      drawFrame();
    }
  }, [settings.noiseLevel, settings.spatialStrength, settings.temporalStrength, settings.motionAdaptive, settings.noiseType, settings.speed]);

  const drawFrame = () => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = offscreen.width;
    const h = offscreen.height;

    // 1. Draw Static Pristine Background (Text, grids, fine structures)
    ctx.fillStyle = '#0f172a'; // slate-900 background
    ctx.fillRect(0, 0, w, h);

    // Draw some fine details (simulating static scene detail like barcode, textures)
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    for (let i = 10; i < w; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 10; j < h; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    // High detail zone: Horizontal and vertical lines
    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('CAMERA TEST CHART', w / 2 - 45, h / 2 + 4);

    // Fine spatial resolution detail (a mini resolution wedge)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(15, 110 + k * 3);
      ctx.lineTo(55, 110 + k * 1.5);
      ctx.stroke();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('細節解析區', 15, 105);

    // 2. Update and Draw Moving Object (simulates a target crossing the security camera feed)
    const obj = objectPosRef.current;
    if (settings.isPlaying) {
      obj.x += obj.dx * (settings.speed / 2);
      obj.y += obj.dy * (settings.speed / 2);

      // Boundaries bouncing
      if (obj.x < 15 || obj.x > w - 15) obj.dx *= -1;
      if (obj.y < 15 || obj.y > h - 15) obj.dy *= -1;
    }

    // Draw moving sphere with gradient or highlight
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Small glowing center
    ctx.beginPath();
    ctx.arc(obj.x - 3, obj.y - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw speed vector indicator
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y);
    ctx.lineTo(obj.x + obj.dx * 6, obj.y + obj.dy * 6);
    ctx.stroke();

    // Extract Clean frame pixel data
    const cleanImgData = ctx.getImageData(0, 0, w, h);
    const cleanPixels = cleanImgData.data;

    // Create Noisy Frame pixel data
    const noisyImgData = ctx.createImageData(w, h);
    const noisyPixels = noisyImgData.data;

    // Apply Noise to generate the "Noisy Input" (Gaussian / Salt-and-Pepper)
    const noiseLevel = settings.noiseLevel;
    
    for (let i = 0; i < cleanPixels.length; i += 4) {
      const r = cleanPixels[i];
      const g = cleanPixels[i + 1];
      const b = cleanPixels[i + 2];
      const a = cleanPixels[i + 3];

      let nr = r;
      let ng = g;
      let nb = b;

      if (noiseLevel > 0) {
        if (settings.noiseType === 'gaussian') {
          // Box-Muller transform for Gaussian Noise
          const u1 = Math.random() || 0.0001;
          const u2 = Math.random() || 0.0001;
          const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
          const noiseFactor = noiseLevel * 0.7;
          const noise = randStdNormal * noiseFactor;

          nr = Math.min(255, Math.max(0, r + noise));
          ng = Math.min(255, Math.max(0, g + noise));
          nb = Math.min(255, Math.max(0, b + noise));
        } else {
          // Salt and Pepper Noise
          const roll = Math.random();
          const p = noiseLevel / 200; // probability
          if (roll < p) {
            nr = ng = nb = 0; // pepper
          } else if (roll < p * 2) {
            nr = ng = nb = 255; // salt
          }
        }
      }

      noisyPixels[i] = nr;
      noisyPixels[i + 1] = ng;
      noisyPixels[i + 2] = nb;
      noisyPixels[i + 3] = a;
    }

    // Render original noisy image to Original Canvas
    const canvasOrig = canvasOriginalRef.current;
    if (canvasOrig) {
      const ctxOrig = canvasOrig.getContext('2d');
      if (ctxOrig) ctxOrig.putImageData(noisyImgData, 0, 0);
    }

    // 3. APPLY 2DNR (Spatial Domain Noise Reduction)
    // We implement a fast approximate Bilateral/Smart Edge Blur filter
    const denoise2DImgData = ctx.createImageData(w, h);
    const d2dPixels = denoise2DImgData.data;
    const strength2D = settings.spatialStrength / 100; // 0 to 1

    if (strength2D === 0) {
      // Direct copy of noisy
      for (let i = 0; i < noisyPixels.length; i++) d2dPixels[i] = noisyPixels[i];
    } else {
      // 2D Spatial smart filter: horizontal/vertical neighbor averaging
      // To keep it fast, we do an edge-preserving adaptive blur
      // kernel radius depends on strength
      const radius = strength2D < 0.4 ? 1 : strength2D < 0.8 ? 2 : 3;
      const edgeThreshold = 40 + (1 - strength2D) * 100; // higher strength means blur across larger edges too

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;

          // Target pixel color
          const tr = noisyPixels[idx];
          const tg = noisyPixels[idx + 1];
          const tb = noisyPixels[idx + 2];

          let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

          // Average over neighbors
          for (let ky = -radius; ky <= radius; ky++) {
            const ny = Math.min(h - 1, Math.max(0, y + ky));
            for (let kx = -radius; kx <= radius; kx++) {
              const nx = Math.min(w - 1, Math.max(0, x + kx));
              const nIdx = (ny * w + nx) * 4;

              const nr = noisyPixels[nIdx];
              const ng = noisyPixels[nIdx + 1];
              const nb = noisyPixels[nIdx + 2];

              // Calculate edge difference
              const diff = Math.abs(tr - nr) + Math.abs(tg - ng) + Math.abs(tb - nb);

              // Bilateral weight component: decrease weight if difference is huge (edge preservation)
              let weight = 1.0;
              if (diff > edgeThreshold) {
                weight = 0.05; // ignore neighbor across strong edge
              } else {
                weight = 1.0 - (diff / edgeThreshold) * 0.8;
              }

              // Distance weight
              const dist = Math.sqrt(kx*kx + ky*ky);
              if (dist > 0) {
                weight *= (1 / (dist * 0.5 + 1));
              }

              sumR += nr * weight;
              sumG += ng * weight;
              sumB += nb * weight;
              sumW += weight;
            }
          }

          // Compute final blurred/filtered output blended with original based on strength
          if (sumW > 0) {
            const blurR = sumR / sumW;
            const blurG = sumG / sumW;
            const blurB = sumB / sumW;

            d2dPixels[idx] = Math.round(tr * (1 - strength2D) + blurR * strength2D);
            d2dPixels[idx + 1] = Math.round(tg * (1 - strength2D) + blurG * strength2D);
            d2dPixels[idx + 2] = Math.round(tb * (1 - strength2D) + blurB * strength2D);
            d2dPixels[idx + 3] = 255;
          } else {
            d2dPixels[idx] = tr;
            d2dPixels[idx + 1] = tg;
            d2dPixels[idx + 2] = tb;
            d2dPixels[idx + 3] = 255;
          }
        }
      }
    }

    const canvas2D = canvas2DNRRef.current;
    if (canvas2D) {
      const ctx2D = canvas2D.getContext('2d');
      if (ctx2D) ctx2D.putImageData(denoise2DImgData, 0, 0);
    }

    // 4. APPLY 3DNR (Temporal Domain Noise Reduction)
    const denoise3DImgData = ctx.createImageData(w, h);
    const d3dPixels = denoise3DImgData.data;

    const strength3D = settings.temporalStrength / 100; // 0 to 1: amount of history we retain
    const motionAdaptive = settings.motionAdaptive;
    const motionThresh = settings.motionThreshold; // 0 to 100

    const prevBuffer = prev3DFrameBufferRef.current;

    if (!prevBuffer || prevBuffer.length !== noisyPixels.length) {
      // First frame or size mismatch, initialize buffer with current noisy
      prev3DFrameBufferRef.current = new Uint8ClampedArray(noisyPixels);
      for (let i = 0; i < noisyPixels.length; i++) d3dPixels[i] = noisyPixels[i];
    } else {
      // Apply Temporal Filter (IIR recursive blend with previous frame)
      for (let i = 0; i < noisyPixels.length; i += 4) {
        const nr = noisyPixels[i];
        const ng = noisyPixels[i + 1];
        const nb = noisyPixels[i + 2];

        const pr = prevBuffer[i];
        const pg = prevBuffer[i + 1];
        const pb = prevBuffer[i + 2];

        // Temporal Difference (Luminance change)
        const frameDiff = (Math.abs(nr - pr) + Math.abs(ng - pg) + Math.abs(nb - pb)) / 3;

        // Motion Adaptive check
        let blendFactor = strength3D; // blendFactor is how much we prefer the history. Higher means cleaner static, more ghosting.

        if (motionAdaptive) {
          // If frame difference is higher than the motion threshold, we have motion!
          // We must reduce history preference (blendFactor) to 0 or very small to react instantly to the new frame, avoiding ghosting.
          const normalizedThresh = motionThresh * 0.8; // scaled
          if (frameDiff > normalizedThresh) {
            // High motion area: bypass temporal filter (use current noisy pixel or lightweight 2D filtered pixel instead)
            // Let's drop blend factor to 0 or very small
            blendFactor = 0.05; // instantly adapt to new frame
          } else {
            // Some motion or slight noise, smoothly scale down blending
            const scale = (normalizedThresh - frameDiff) / normalizedThresh;
            blendFactor = strength3D * Math.max(0.1, scale);
          }
        }

        // Apply Temporal IIR blending formula:
        // Output = (1 - blendFactor) * CurrentNoisy + blendFactor * PreviousOutput
        // To show 3DNR's capability: It integrates the noise out perfectly over static regions.
        const outR = (1 - blendFactor) * nr + blendFactor * pr;
        const outG = (1 - blendFactor) * ng + blendFactor * pg;
        const outB = (1 - blendFactor) * nb + blendFactor * pb;

        d3dPixels[i] = Math.round(outR);
        d3dPixels[i + 1] = Math.round(outG);
        d3dPixels[i + 2] = Math.round(outB);
        d3dPixels[i + 3] = 255;
      }

      // Save output as the next frame's history/previous buffer
      prev3DFrameBufferRef.current.set(d3dPixels);
    }

    const canvas3D = canvas3DNRRef.current;
    if (canvas3D) {
      const ctx3D = canvas3D.getContext('2d');
      if (ctx3D) ctx3D.putImageData(denoise3DImgData, 0, 0);
    }
  };

  const triggerReset = () => {
    // Reset object coordinates and buffers
    objectPosRef.current = { x: 50, y: 75, dx: 2, dy: 1 };
    prev3DFrameBufferRef.current = null;
    drawFrame();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-emerald-400" />
            2D/3DNR 晶片級即時降噪濾波模擬器
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            硬體 ISP 晶片實時流模擬。控制左側參數，觀察各路視訊訊號的降噪與殘影（鬼影）表現差異。
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSliderChange('isPlaying', !settings.isPlaying)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              settings.isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {settings.isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                暫停視訊
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                播放視訊
              </>
            )}
          </button>

          <button
            onClick={triggerReset}
            title="重設影像緩衝區"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters Tuning Console */}
        <div className="xl:col-span-4 bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-5">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            ISP 控制台面板
          </div>

          {/* Noise controls */}
          <div className="space-y-3.5 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">
                1. 原始感光元件雜訊雜訊值 (Noise Level)
              </label>
              <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.noiseLevel}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={settings.noiseLevel}
              onChange={(e) => handleSliderChange('noiseLevel', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />

            {/* Noise type toggle */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800/80 text-[11px]">
              <button
                onClick={() => handleSliderChange('noiseType', 'gaussian')}
                className={`flex-1 py-1 rounded text-center transition-colors font-medium ${
                  settings.noiseType === 'gaussian'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                高斯熱噪點 (低照度雜訊)
              </button>
              <button
                onClick={() => handleSliderChange('noiseType', 'salt-pepper')}
                className={`flex-1 py-1 rounded text-center transition-colors font-medium ${
                  settings.noiseType === 'salt-pepper'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                椒鹽熱噪點 (感光壞點)
              </button>
            </div>
          </div>

          <hr className="border-slate-900" />

          {/* 2DNR Parameter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                2. 2DNR 降噪強度 (Spatial Strength)
              </label>
              <span className="text-xs text-indigo-400 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50">
                {settings.spatialStrength}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              針對單張影格鄰近像素進行模糊。數值越高畫面越乾淨，但物體邊緣與細節也會隨之變得模糊。
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.spatialStrength}
              onChange={(e) => handleSliderChange('spatialStrength', Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <hr className="border-slate-900" />

          {/* 3DNR Parameter */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                3. 3DNR 降噪強度 (Temporal Strength)
              </label>
              <span className="text-xs text-purple-400 font-mono bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/50">
                {settings.temporalStrength}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              在時間跨度進行畫面融合。高數值可使靜態區域雜訊徹底抹平，但高速移動的物體會出現拖尾殘影。
            </p>
            <input
              type="range"
              min="0"
              max="95"
              value={settings.temporalStrength}
              onChange={(e) => handleSliderChange('temporalStrength', Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />

            {/* Motion Adaptive System Switch */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  💡 運動適應開關 (Motion Adaptive)
                </span>
                <button
                  onClick={() => handleSliderChange('motionAdaptive', !settings.motionAdaptive)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.motionAdaptive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.motionAdaptive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                【核心科技】開啟後，當檢測到目標在移動（綠球），時域降噪會自動降為0，保持移動物體不留殘影，同時保持靜態背景乾淨。
              </p>
            </div>
          </div>

          <hr className="border-slate-900" />

          {/* Speed slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">
                4. 運動物體移動速度 (Target Speed)
              </label>
              <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.speed}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={settings.speed}
              onChange={(e) => handleSliderChange('speed', Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Side: Real-time Live Video Streams previews */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Stream 1: Original Noisy */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-ping"></span>
                  路一: 原始帶噪訊號 (RAW)
                </span>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                  CH1 Input
                </span>
              </div>
              <div className="relative aspect-[8/5] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                <canvas
                  ref={canvasOriginalRef}
                  width={240}
                  height={150}
                  className="w-full h-full object-cover"
                />
                {settings.noiseLevel === 0 && (
                  <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 text-[9px] font-mono">
                    無雜訊感光
                  </div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                <p>• 模擬感光元件在低光下的噪點表現</p>
                <p className="font-mono text-slate-500">畫面狀態: 噪點飛舞 / 邊緣銳利</p>
              </div>
            </div>

            {/* Stream 2: 2DNR Processed */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>
                  路二: 2DNR 空間域輸出
                </span>
                <span className="text-[10px] bg-indigo-950/40 text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-indigo-900/50">
                  ISP-2D
                </span>
              </div>
              <div className="relative aspect-[8/5] bg-slate-900 rounded-lg overflow-hidden border border-indigo-950 flex items-center justify-center">
                <canvas
                  ref={canvas2DNRRef}
                  width={240}
                  height={150}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                <p>• 降噪特徵: 空間模糊、細節受損</p>
                <p className="font-mono text-indigo-400">
                  預估 PSNR: {stats.staticPsnr2D} dB (細節模糊: {stats.motionBlurIndex2D}%)
                </p>
              </div>
            </div>

            {/* Stream 3: 3DNR Processed */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block"></span>
                  路三: 3DNR 時域降噪輸出
                </span>
                <span className="text-[10px] bg-purple-950/40 text-purple-400 px-1.5 py-0.5 rounded font-mono border border-purple-900/50">
                  ISP-3D
                </span>
              </div>
              <div className="relative aspect-[8/5] bg-slate-900 rounded-lg overflow-hidden border border-purple-950 flex items-center justify-center">
                <canvas
                  ref={canvas3DNRRef}
                  width={240}
                  height={150}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                <p>• 降噪特徵: 靜態純淨、運動拖尾/殘影</p>
                <p className="font-mono text-purple-400">
                  預估 PSNR: {stats.staticPsnr3D} dB (殘影度: {stats.ghostingIndex3D}%)
                </p>
              </div>
            </div>

          </div>

          {/* Live Simulator Status Bar / Observations */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5 flex-1">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1">
              <Eye className="h-4 w-4 text-emerald-400" />
              實時動態觀測報告 (ISP Monitoring Log)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-slate-500 text-[10px]">畫面解碼幀率 (FPS)</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{stats.fps} FPS</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-slate-500 text-[10px]">2D 邊緣損失率</div>
                <div className="text-lg font-bold text-indigo-400 mt-0.5">
                  {settings.spatialStrength > 0 ? `${Math.round(settings.spatialStrength * 0.7)}%` : '0%'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-slate-500 text-[10px]">3D 時域拖尾(殘影)評估</div>
                <div className="text-lg font-bold text-purple-400 mt-0.5">
                  {settings.motionAdaptive ? '極低 (0~5%)' : `${Math.round(settings.temporalStrength * (settings.speed / 10))}%`}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-slate-500 text-[10px]">運動適應晶片狀態</div>
                <div className={`text-lg font-bold mt-0.5 ${settings.motionAdaptive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {settings.motionAdaptive ? 'ACTIVE (智慧檢測)' : 'BYPASS (常開無適應)'}
                </div>
              </div>
            </div>

            {/* Educational observation guidelines */}
            <div className="text-[11px] text-slate-400 space-y-2 border-t border-slate-900 pt-3">
              <div className="font-semibold text-slate-300">💡 建議動態觀察重點：</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 list-none">
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
                  <span><strong>靜態解析區 (背景格線)</strong>: 在 3DNR 下，不論雜訊多大，靜態條紋和文字都極度清晰；而在 2DNR 下則會變得斑駁、甚至細節全部被抹除。</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
                  <span><strong>綠色運動標靶 (鬼影測試)</strong>: 關閉「運動適應」，讓綠球高速運動並將 3DNR 拉大，綠色球會拖出長長的「幽靈尾巴」；開啟「運動適應」後，尾巴瞬間消失，但綠球表面會殘留一些原生的白色噪點，此為 ISP 物理定律。</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
