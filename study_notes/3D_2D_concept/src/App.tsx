import React, { useState } from 'react';
import { Layers, HelpCircle, ShieldAlert, Sparkles, Video, Settings2, Sliders, Info, Zap } from 'lucide-react';
import InteractiveDiagram from './components/InteractiveDiagram';
import NoiseSimulator from './components/NoiseSimulator';
import ComparisonTable from './components/ComparisonTable';
import { SimSettings } from './types';

export default function App() {
  const [settings, setSettings] = useState<SimSettings>({
    noiseLevel: 45,
    spatialStrength: 50,
    temporalStrength: 60,
    motionAdaptive: true,
    motionThreshold: 35,
    speed: 4,
    isPlaying: true,
    viewMode: 'all',
    noiseType: 'gaussian'
  });

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'simulation' | 'theory'>('simulation');

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Sleek Top Banner */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100 font-sans">
                  2DNR & 3DNR 影像降噪概念視覺化與模擬器
                </h1>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                  ISP V5.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                空間域降噪 (Spatial) 與時域降噪 (Temporal) 的動態模擬與算法深探
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simple Workspace Tabs */}
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex text-xs">
              <button
                onClick={() => setActiveWorkspaceTab('simulation')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeWorkspaceTab === 'simulation'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                實時模擬實驗室
              </button>
              <button
                onClick={() => setActiveWorkspaceTab('theory')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeWorkspaceTab === 'theory'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                原理演算法探究
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Intro Hero Section */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-3 max-w-3xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40">
                教育型概念展示平台
              </span>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight font-sans">
                為什麼相機降噪如此關鍵？
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                在夜間、地下停車場或低照度監控場景中，感光元件會產生大量隨機雜訊（如雪花般的白點）。
                <strong>2DNR (空間域)</strong> 與 <strong>3DNR (時域)</strong> 是 ISP（影像訊號處理器）晶片內部對抗噪點的雙核心利器。
                本平台將硬體晶片級降噪功能移植到前端 Web Canvas 中，幫助您直觀理解其物理學、電學與演算法邊界。
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0 w-full md:w-80 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-indigo-400" />
                極速指南
              </div>
              <p className="text-slate-400 leading-normal">
                1. 點擊頂部的 <strong className="text-indigo-300">實時模擬實驗室</strong> 可以自由調整感光噪點、2D/3DNR 降噪強度，觀察綠色運動標靶的殘影與抹平效果。
              </p>
              <p className="text-slate-400 leading-normal">
                2. 切換至 <strong className="text-indigo-300">原理演算法探究</strong> 可以查看點對點的公式加權值、雙邊濾波核心以及 2D/3D 降噪的精確數學模型。
              </p>
            </div>
          </div>
        </section>

        {/* Dynamic Workspace Switch */}
        {activeWorkspaceTab === 'simulation' ? (
          <section className="space-y-8 animate-fade-in">
            {/* Live Noise Simulator Canvas */}
            <NoiseSimulator settings={settings} setSettings={setSettings} />
            
            {/* Brief Visual Concept Panel right below */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl space-y-2.5">
                <h3 className="font-semibold text-indigo-400 flex items-center gap-2 text-sm font-sans">
                  <Zap className="h-4.5 w-4.5" />
                  2DNR 快速備忘錄 (2D Spatial Denoise)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  2DNR 在單張影像（空間域）內運作。它會尋找鄰近像素，並對其進行模糊處理。
                  <strong>它的強項是：</strong>不限幀率，即使畫面有劇烈晃動，也不會產生任何拖尾（鬼影）。
                  <strong>缺點是：</strong>用力過猛會導致畫面中精緻的文字和紋理細節消失，呈現如同美顏相機般的「塑膠感」或「塗抹感」。
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl space-y-2.5">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2 text-sm font-sans">
                  <Layers className="h-4.5 w-4.5" />
                  3DNR 快速備忘錄 (3D Temporal Denoise)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  3DNR 跨越多個前後影格（時間域）運作。它把前後多張圖片重疊，對相同的坐標點進行平均。
                  <strong>它的強項是：</strong>降噪能力極強，能將夜晚微光背景洗得像白晝般純淨，且100%保留靜態細節。
                  <strong>缺點是：</strong>當畫面有東西在移動（如車輛），會出現「重影疊圖」的致命拉絲殘影。必須搭配運動適應檢測（Motion Adaptive）才能在實務中落地。
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-8 animate-fade-in">
            {/* Interactive schematic diagram showing pixels and temporal stack */}
            <InteractiveDiagram />
            
            {/* Dynamic Comparison Table */}
            <ComparisonTable />
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12 font-mono">
        <p>© 2026 影像訊號處理（ISP）學堂 - 2DNR & 3DNR 概念教學專利面板</p>
        <p className="mt-1 text-slate-600">
          Powered by HTML5 Canvas & Web Pixel Manipulation. Desktop-First Web Preview.
        </p>
      </footer>
    </div>
  );
}
