import React, { useState } from 'react';
import { Eye, HelpCircle, Layers, Sliders, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InteractiveDiagram() {
  const [activeTab, setActiveTab] = useState<'2dnr' | '3dnr'>('2dnr');
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [simulatedMotion, setSimulatedMotion] = useState<boolean>(false);
  const [edgeSensitivity, setEdgeSensitivity] = useState<number>(40); // 2DNR edge preservation limit
  const [motionThreshold, setMotionThreshold] = useState<number>(30); // 3DNR motion threshold

  // 2DNR grid pixels (5x5 around center)
  const centerCoord = 2; // (2, 2) is the target pixel
  const gridRange = [0, 1, 2, 3, 4];

  // Helper to determine weight in 2DNR (bilateral-like filter)
  const get2DWeight = (x: number, y: number) => {
    const dist = Math.sqrt(Math.pow(x - centerCoord, 2) + Math.pow(y - centerCoord, 2));
    if (dist === 0) return 1.0;
    
    // Is it an edge pixel? Let's simulate a diagonal edge running from top-left to bottom-right
    // (x == y) is the edge.
    const isEdgeLine = (x === y) || (x - y === 1) || (y - x === 1);
    const targetIsEdge = true; // center (2,2) is on the edge x===y
    
    let weight = 1 / (1 + dist * 0.8);
    
    // If we cross the edge (e.g., center is on the edge, but this pixel is far from edge or on the other side)
    const crossEdge = (x > y) !== (centerCoord > centerCoord); // simple sim
    if (isEdgeLine) {
      weight = weight * 1.0; // keep weight high for pixels on the same edge
    } else {
      // Reduce weight based on edge sensitivity to simulate edge preservation
      weight = weight * (1 - edgeSensitivity / 100);
    }
    
    return parseFloat(weight.toFixed(2));
  };

  // Helper for 3DNR weights
  const get3DWeights = () => {
    if (simulatedMotion) {
      // With motion, weight shifts back to current frame to avoid ghosting
      const motionAmt = 0.8; // High motion
      const currentWeight = 1.0 - (1 - motionAmt) * (motionThreshold / 100);
      const prevWeight = (1 - currentWeight) / 2;
      return {
        prev: parseFloat(prevWeight.toFixed(2)),
        curr: parseFloat(currentWeight.toFixed(2)),
        next: parseFloat(prevWeight.toFixed(2)),
        status: '偵測到運動！降低時域權重（避免殘影）'
      };
    } else {
      // Static background, high temporal blending
      return {
        prev: 0.35,
        curr: 0.30,
        next: 0.35,
        status: '靜態畫面。高時域融合（降噪效果極佳）'
      };
    }
  };

  const weights3D = get3DWeights();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            降噪原理互動架構圖
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            點擊切換 2DNR 與 3DNR 體系，移動滑鼠探索像素點的空間與時域關聯計算方式。
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex w-full md:w-auto">
          <button
            onClick={() => setActiveTab('2dnr')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === '2dnr'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            2DNR 空間域降噪
          </button>
          <button
            onClick={() => setActiveTab('3dnr')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === '3dnr'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            3DNR 時域降噪
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive SVG Panel */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
          
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-xs text-indigo-400 font-mono flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Interactive Canvas
          </div>

          <AnimatePresence mode="wait">
            {activeTab === '2dnr' ? (
              <motion.div
                key="2dnr-schematic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                {/* 2DNR Spatial Grid */}
                <div className="mb-6 text-center">
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-500/20 font-medium">
                    單張影格內 (Intra-frame) 空間濾波
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    目標像素 $P(x,y)$ 與周圍鄰近像素進行加權平均。
                  </p>
                </div>

                <div className="relative p-4 bg-slate-900 rounded-xl border border-slate-800 max-w-sm w-full">
                  <div className="text-center text-xs font-mono text-slate-500 mb-2">當前影格 Frame T (2D 矩陣)</div>
                  
                  {/* Grid */}
                  <div className="grid grid-cols-5 gap-1.5 mx-auto w-fit">
                    {gridRange.map((y) =>
                      gridRange.map((x) => {
                        const isCenter = x === centerCoord && y === centerCoord;
                        const weight = get2DWeight(x, y);
                        const isHovered = hoveredPixel?.x === x && hoveredPixel?.y === y;
                        
                        // Edge simulation visualization (diagonal)
                        const isEdge = x === y;

                        return (
                          <div
                            key={`${x}-${y}`}
                            onMouseEnter={() => setHoveredPixel({ x, y })}
                            onMouseLeave={() => setHoveredPixel(null)}
                            className={`w-12 h-12 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                              isCenter
                                ? 'bg-indigo-500 text-white font-bold ring-4 ring-indigo-500/30 z-10 scale-105'
                                : isEdge
                                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                                : 'bg-slate-900 text-slate-400 border border-slate-800/50 hover:bg-slate-800'
                            } ${isHovered ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''}`}
                          >
                            <span className="text-[10px] opacity-70 font-mono">
                              ({x - 2},{y - 2})
                            </span>
                            <span className="text-[11px] font-bold font-mono">
                              w:{weight}
                            </span>
                            
                            {/* Visual cue of spatial link */}
                            {!isCenter && (
                              <div className="absolute inset-0 border border-dashed border-indigo-500/10 rounded-md pointer-events-none" />
                            )}

                            {/* Edge indicator */}
                            {isEdge && (
                              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" title="高對比邊緣" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Connecting lines simulation */}
                  <div className="mt-4 flex justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span> 邊緣像素 (權重降)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block"></span> 目標核心像素
                    </span>
                  </div>
                </div>

                {/* 2DNR Mathematical Model Explainer */}
                <div className="mt-6 w-full max-w-md bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5 text-xs">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    雙邊濾波核心演算法 (Bilateral Filter Concept)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    2DNR 通常使用雙邊濾波器，權重由<strong>空間距離</strong>與<strong>亮度差（灰階差）</strong>共同決定。在亮度差大的地方（黃點邊緣），大幅降低權重（如 2D 矩陣中 w 值下降），藉此保護邊緣不被模糊。
                  </p>
                  
                  {/* Controls */}
                  <div className="mt-3 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">邊緣保護靈敏度 (降低雜色對邊緣判斷)</span>
                      <span className="text-indigo-400 font-mono">{edgeSensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={edgeSensitivity}
                      onChange={(e) => setEdgeSensitivity(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>無邊緣保護 (普通高斯模糊)</span>
                      <span>極致邊緣保護 (易殘留噪點)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="3dnr-schematic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                {/* 3DNR Temporal Pipeline */}
                <div className="mb-4 text-center">
                  <span className="bg-purple-500/10 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/20 font-medium">
                    跨影格 (Inter-frame) 時域濾波
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    在時間軸上（不同影格之間）對同一坐標 $P(x,y)$ 的像素進行降噪融合。
                  </p>
                </div>

                {/* Simulated 3 Frame Stack */}
                <div className="relative w-full max-w-md h-52 flex items-center justify-center">
                  
                  {/* Frame T-1 */}
                  <div className="absolute left-6 transform -rotate-12 scale-90 opacity-60 hover:opacity-80 transition-all duration-300">
                    <div className="bg-slate-900 w-36 h-28 rounded-lg border border-purple-800 p-2 shadow-lg relative">
                      <div className="absolute top-1 left-2 text-[10px] font-mono text-slate-500">Frame T-1</div>
                      <div className="w-full h-full border border-dashed border-purple-900/50 rounded flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${simulatedMotion ? 'bg-indigo-500/40 translate-x-[-15px]' : 'bg-indigo-500/40'}`}></div>
                        <div className="absolute w-3 h-3 bg-purple-500/80 rounded-sm top-12 left-16 ring-2 ring-purple-500"></div>
                      </div>
                    </div>
                    <div className="text-center text-xs font-mono text-purple-400/80 mt-1">
                      {"權重 W_(t-1) = " + weights3D.prev}
                    </div>
                  </div>

                  {/* Frame T+1 (Right) */}
                  <div className="absolute right-6 transform rotate-12 scale-90 opacity-60 hover:opacity-80 transition-all duration-300">
                    <div className="bg-slate-900 w-36 h-28 rounded-lg border border-purple-800 p-2 shadow-lg relative">
                      <div className="absolute top-1 left-2 text-[10px] font-mono text-slate-500">Frame T+1</div>
                      <div className="w-full h-full border border-dashed border-purple-900/50 rounded flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${simulatedMotion ? 'bg-indigo-500/40 translate-x-[15px]' : 'bg-indigo-500/40'}`}></div>
                        <div className="absolute w-3 h-3 bg-purple-500/80 rounded-sm top-12 left-16 ring-2 ring-purple-500"></div>
                      </div>
                    </div>
                    <div className="text-center text-xs font-mono text-purple-400/80 mt-1">
                      {"權重 W_(t+1) = " + weights3D.prev}
                    </div>
                  </div>

                  {/* Frame T (Center, Main) */}
                  <div className="absolute z-10 transform scale-105 shadow-2xl">
                    <div className="bg-slate-900 w-44 h-32 rounded-xl border-2 border-purple-500 p-2 relative">
                      <div className="absolute top-1.5 left-2.5 text-[10px] font-mono text-purple-400 font-bold">當前 Frame T</div>
                      <div className="w-full h-full border border-purple-500/30 rounded flex flex-col items-center justify-center">
                        {/* Target pixel marker */}
                        <div className="relative">
                          <div className="w-4 h-4 bg-purple-500 rounded-sm ring-4 ring-purple-500/30 animate-pulse"></div>
                          {/* Laser beam connector effect to background */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 border-t border-dashed border-purple-500/40 -z-10" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-2">目標像素 P(x, y)</span>
                      </div>
                    </div>
                    <div className="text-center text-sm font-bold font-mono text-purple-400 mt-2">
                      權重 $W_t = {weights3D.curr}$
                    </div>
                  </div>
                </div>

                {/* Motion Control for 3DNR Demo */}
                <div className="w-full max-w-md bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                      <AlertCircle className="h-4 w-4 text-purple-400" />
                      運動適應機制 (Motion Adaptive System)
                    </div>
                    
                    {/* Toggle */}
                    <button
                      onClick={() => setSimulatedMotion(!simulatedMotion)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-200 flex items-center gap-1 ${
                        simulatedMotion
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {simulatedMotion ? '模擬運動狀態' : '模擬靜態狀態'}
                    </button>
                  </div>

                  {/* Status Box */}
                  <div className={`p-2 rounded text-xs font-mono mb-3 ${
                    simulatedMotion ? 'bg-amber-950/40 text-amber-300 border border-amber-900/50' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
                  }`}>
                    狀態: {weights3D.status}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    在靜態場景，3DNR 能融合大量前後影格，讓噪點完全消失。但如果<strong>像素發生運動（如開關切換為運動時）</strong>，若不降低時域權重，就會產生嚴重的「鬼影（Ghosting）」。此時 3DNR 必須調高當前影格權重，並與 2DNR 協同工作。
                  </p>

                  {/* Threshold slider */}
                  <div className="mt-3 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">運動檢測靈敏度 (Motion Threshold)</span>
                      <span className="text-purple-400 font-mono">{motionThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={motionThreshold}
                      onChange={(e) => setMotionThreshold(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>高靈敏 (易把噪點誤判為運動，效果變弱)</span>
                      <span>低靈敏 (容易殘留鬼影)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Math & Dynamic Equation Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          {/* Comparison Concept Box */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex-1">
            <h3 className="text-slate-200 font-semibold mb-3 text-sm flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-400" />
              核心運算公式對比
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold mb-1">2DNR (空間雙邊濾波公式):</div>
                <div className="text-slate-300 py-1.5 px-2 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-[11px]">
                  P_out(x,y) = ∑ (W_s * W_r * P(i,j)) / ∑ (W_s * W_r)
                </div>
                <ul className="list-disc list-inside mt-2 text-slate-400 space-y-1 text-[11px]">
                  <li><span className="text-slate-300 font-semibold">W_s (空間權重)</span>: 距離越遠，權重越小。</li>
                  <li><span className="text-slate-300 font-semibold">W_r (灰階差權重)</span>: 亮度差越大（如邊緣），權重越小。</li>
                  <li><span className="text-emerald-400 font-semibold">優點</span>: 保護強邊緣，無任何時間延遲。</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-purple-400 font-bold mb-1">3DNR (運動適應性時域濾波):</div>
                <div className="text-slate-300 py-1.5 px-2 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-[11px]">
                  P_out_t = (1-K) * P_out_t-1 + K * P_t
                </div>
                <ul className="list-disc list-inside mt-2 text-slate-400 space-y-1 text-[11px]">
                  <li><span className="text-slate-300 font-semibold">K (融合係數)</span>: 與前後影格的亮度差呈正相關。</li>
                  <li><span className="text-slate-300 font-semibold">K 趨近 0</span>: 極高融合，消除靜態背景的 99% 雜訊。</li>
                  <li><span className="text-slate-300 font-semibold">K 趨近 1</span>: 降低融合，完全依靠當前影格防鬼影。</li>
                  <li><span className="text-purple-400 font-semibold">優點</span>: 靜態細節毫無損失，背景如水般純淨。</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Real-world analogy */}
          <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-800 text-xs">
            <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-400" />
              生活化類比，秒懂兩大體系！
            </h4>
            <div className="space-y-2 text-slate-400 leading-relaxed">
              <p>
                💡 <strong className="text-indigo-400">2DNR 就像「美顏磨皮」</strong>：它只看這一張照片，如果發現皮膚上有黑點（噪點），就用周圍健康的皮膚把它塗抹均勻。代價是，如果抹得太用力，臉部的線條（邊緣細節）和五官就會變得模糊、像橡皮泥。
              </p>
              <p>
                💡 <strong className="text-purple-400">3DNR 就像「疊圖均值」</strong>：它看著你拍的連拍影片，你的背景桌子一直沒動，那背景上的噪點在每張照片裡跳動的位置都不同。3DNR 把這 10 張照片重疊、取平均值，桌子就變得完美乾淨！但如果你手一晃（物體運動），就會出現「重影疊圖」的殘影。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
