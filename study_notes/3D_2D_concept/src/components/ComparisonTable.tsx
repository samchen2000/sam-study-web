import React from 'react';
import { Shield, Sparkles, TrendingDown, HelpCircle, HardDrive, CheckCircle2, XCircle } from 'lucide-react';

export default function ComparisonTable() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-400" />
          2DNR 與 3DNR 深度技術維度對比表
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          系統化整理兩大降噪體系在 ISP（影像訊號處理器）晶片內部實現時的關鍵物理與硬體特性對比。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-mono">
              <th className="py-3 px-4 font-semibold uppercase">比較維度</th>
              <th className="py-3 px-4 font-semibold text-indigo-400 uppercase">2DNR 空間域降噪 (Spatial Noise Reduction)</th>
              <th className="py-3 px-4 font-semibold text-purple-400 uppercase">3DNR 時域降噪 (Temporal Noise Reduction)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {/* Row 1 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">基本降噪原理</td>
              <td className="py-4 px-4 leading-relaxed">
                分析<strong>同一張影格 (Intra-frame)</strong> 內部相鄰像素的空間灰階關係，對噪點進行雙邊或高斯等加權平均平滑。
              </td>
              <td className="py-4 px-4 leading-relaxed">
                分析<strong>多個連續影格 (Inter-frame)</strong> 之間的像素演變，對同一坐標上的噪點在時間軸上進行融合平滑。
              </td>
            </tr>

            {/* Row 2 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">硬體與記憶體開銷</td>
              <td className="py-4 px-4 leading-relaxed flex items-start gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>極低。</strong> 僅需在晶片內部快取幾行像素（Line Buffer），不需要大容量外部 RAM。
                </span>
              </td>
              <td className="py-4 px-4 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>極高。</strong> 必須外接 <strong>DDR 記憶體</strong> 用於快取前一幀、後一幀的完整影像數據以供比對。
                  </span>
                </div>
              </td>
            </tr>

            {/* Row 3 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">畫面延遲 (Latency)</td>
              <td className="py-4 px-4 leading-relaxed">
                <strong>零延遲。</strong> 當前影格接收完畢即可直接完成降噪並輸出，無任何時域累積等待。
              </td>
              <td className="py-4 px-4 leading-relaxed text-amber-300">
                <strong>微幅延遲。</strong> 非即時 IIR 濾波下，需要等待後續影格（1~2 幀的時延）才能完美修正，或者需要維持歷史影格序列。
              </td>
            </tr>

            {/* Row 4 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">降噪效率 (對靜態背景)</td>
              <td className="py-4 px-4 leading-relaxed text-slate-400">
                <strong>中等。</strong> 只能抑制部分點狀高頻噪點。如果強度過大，整個背景會產生斑駁塗抹感。
              </td>
              <td className="py-4 px-4 leading-relaxed text-emerald-400 font-medium">
                <strong>近乎完美。</strong> 在背景靜態不動時，時域融合能消除近 100% 的隨機熱雜訊，使背景如水一樣純淨。
              </td>
            </tr>

            {/* Row 5 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">對細節/銳利度的損害</td>
              <td className="py-4 px-4 leading-relaxed text-rose-300">
                <strong>損害嚴重。</strong> 降噪本質是模糊（Blur），必然會使畫面中精細的條紋、字體、毛髮和微弱細節變得平坦模糊。
              </td>
              <td className="py-4 px-4 leading-relaxed text-emerald-300">
                <strong>近乎零損害。</strong> 由於在時間域取均值，在空間域上原圖的每個像素細節皆被 100% 保留，紋理銳利清晰。
              </td>
            </tr>

            {/* Row 6 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">運動物體缺陷</td>
              <td className="py-4 px-4 leading-relaxed">
                <strong>完全無缺陷。</strong> 移動物體邊緣非常清晰，不留任何尾巴或重影。
              </td>
              <td className="py-4 px-4 leading-relaxed text-rose-300">
                <strong>致命傷 - 鬼影 (Ghosting)。</strong> 當物體移動，它在前幾影格的位置像素值會被錯誤地融合進當前畫面，產生半透明拖尾。
              </td>
            </tr>

            {/* Row 7 */}
            <tr className="hover:bg-slate-950/40 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-200">最佳適用場景</td>
              <td className="py-4 px-4 leading-relaxed">
                • 體育運動、公路等高速運動畫面<br />
                • 追求零殘影的監控相機<br />
                • 平價、超低功耗的影像感測晶片
              </td>
              <td className="py-4 px-4 leading-relaxed">
                • 夜間停車場、倉庫、深空攝影等靜態監視<br />
                • 高階星光級 (Starlight) 夜視網路相機<br />
                • 對細節解像力要求極高的專業影帶復原
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Synthesis Summary */}
      <div className="mt-6 bg-slate-950 p-4.5 rounded-xl border border-slate-800 text-sm">
        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 mb-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          現代 ISP 晶片的黃金法則：2DNR + 3DNR 混合降噪體系
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          在實際的安防攝像頭、行車記錄器或智慧型手機 ISP 晶片中，<strong>兩者絕非非黑即白的二選一關係</strong>。現代晶片均採用「混合主動降噪模式」。
          <br /><br />
          系統會在運動檢測模組 (Motion Detection Engine) 的調度下：
          在<strong>靜態背景區域</strong>火力全開使用 <strong>3DNR</strong> 獲取極致純淨的畫質；
          在<strong>運動物體區域</strong>無縫切換為 <strong>2DNR</strong> 加強邊緣保護與防殘影。
          兩者剛柔並濟，方能成就現代超清、低噪、無拖尾的數位影像世界。
        </p>
      </div>
    </div>
  );
}
