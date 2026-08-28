## 📊 openISP 項目分析報告  
### 一、項目概覽
openISP (Open Image Signal Processor) 是一個開源的圖像信號處理系統，用於將相機傳感器採集的原始RAW圖像轉換為RGB/YUV格式供進一步處理或顯示。

### 二、文件夾結構分類
文件夾	|功能	|内容|
----|----|----|
model/	|ISP算法實現	|14個Python模塊，每個對應一個處理步驟
config/	|參數配置	|config.csv(主配置)、config_test.csv(測試配置)
raw/	|圖像數據	|test.RAW(10/12位原始圖像)、test_12_bit_img.jpeg
docs/	|文檔資料	|Image Signal Processor.pdf、.xmind(思維導圖)
images/	|流程圖	|isp_pipeline.png、isp_pipeline2.png
------------------------------------------------------

### 三、核心程式模塊 (model/ 目錄)
處理流程順序與功能：
#### 第一階段：RAW域處理 (保持Bayer陣列)

1. DPC - 死像素矯正 (Dead Pixel Correction)
2. BLC - 黑電平補償 (Black Level Compensation)
3. AAF - 防黑混淆濾波 (Anti-Aliasing Filter)
4. WBGC (AWB) - 白平衡增益控制 (Auto White Balance)
5. CNF - 色度噪聲濾波 (Chroma Noise Filter)
#### 第二階段：RGB域處理
6. CFA - 色彩濾波陣列插值/去馬賽克 (Demosaicing)
7. CCM - 色彩校正矩陣 (Color Correction Matrix)
8. GC - 伽馬校正 (Gamma Correction)

#### 第三階段：YUV域處理
9. CSC - 色彩空間轉換 (Color Space Conversion: RGB→YUV)
10. NLM - 非局部均值去噪 (Non-Local Means Denoising)
11. BNF - 雙邊濾波降噪 (Bilateral Noise Filtering)
12. EE - 邊緣增強 (Edge Enhancement)
13. FCS - 假色抑制 (False Color Suppression)
14. HSC - 色調/飽和度控制 (Hue/Saturation Control)
15. BCC - 亮度/對比度控制 (Brightness/Contrast Control)

### 四、程式運作流程

┌─────────────────────────────────────────────────────────────┐  
│ 1. 加載配置 (isp_pipeline.py)                                │  
│    └→ 讀取 config.csv 獲取所有處理參數                       │
├─────────────────────────────────────────────────────────────┤  
│ 2. 加載RAW圖像                                               │  
│    └→ 讀取 test.RAW (1280×720, 16位無符號整數)              │
├─────────────────────────────────────────────────────────────┤  
│ 3. RAW域處理 (Bayer陣列)                                    │  
│    DPC → BLC → AAF → WBGC → CNF                             │
├─────────────────────────────────────────────────────────────┤  
│ 4. RGB域處理                                                │  
│    CFA(去馬賽克) → CCM(色彩校正) → GC(伽馬校正)              │  
├─────────────────────────────────────────────────────────────┤  
│ 5. 色彩空間轉換                                              │  
│    CSC: RGB → YUV                                           │  
├─────────────────────────────────────────────────────────────┤  
│ 6. YUV域處理 (降噪+增強)                                    │  
│    NLM → BNF → EE → FCS → HSC → BCC                         │
├─────────────────────────────────────────────────────────────┤  
│ 7. 輸出最終圖像                                              │  
│    └→ 亮度(Y) + 色度(Cb,Cr) 組合                            │
└─────────────────────────────────────────────────────────────┘

### 五、配置文件分析 (config.csv)
配置參數分類：  
----|----|----|----|  
類別 |	參數	| 示例值	| 說明 | 
----|----|----|----|
RAW圖像	|raw_w, raw_h	|1920×1080	|輸入圖像尺寸
DPC	|dpc_thres, dpc_mode	|30, gradient	|死像素閾值和檢測模式
BLC	|bl_r, bl_gr, bl_gb, bl_b	|0	|各色通道黑電平偏移
AWB	|r_gain, gr_gain, gb_gain, b_gain	|1.5, 1.0, 1.0, 1.1	|白平衡增益
BNF	|bnf_dw (5×5矩陣)	|見config.csv	|距離權重(用於雙邊濾波)
EE	|ee_gain, ee_thres	|[32,128], [32,64]	|邊緣增強增益和閾值
色彩	|hue, saturation	|128, 256	|色調和飽和度調整

### 六、核心算法示例
1. DPC (死像素矯正) - dpc.py
- 使用梯度檢測方法
- 檢查周圍8個像素(3×3窗口)的梯度
- 若中心像素與周圍差異超過閾值，替換為鄰近值
- 采用反射填充避免邊界問題
2. CFA (去馬賽克) - cfa.py
- 支持 Malvar 插值算法
- 處理RGGB Bayer陣列中4種像素類型：
    - Red (R)：紅色像素
    - Green-Red (Gr)：紅色行綠色像素
    - Green-Blue (Gb)：藍色行綠色像素
    - Blue (B)：藍色像素
- 每種類型使用不同的插值公式
3. BNF (雙邊濾波) - bnf.py
核心邏輯：
- 計算5×5窗口內每個像素與中心像素的色差 (radiometric difference)
- 根據色差分檔選擇権重 (rw[0-3])
- 將色差權重與距離權重相乘 (距離權重: dw矩陣)
- 加權平均計算輸出像素值

### 七、測試文件 (test_bnf.py)
用於單獨測試BNF模塊：

- 使用縮小的圖像 (128×72) 加快測試
- 使用 config_test.csv 配置
- 大多數模塊被註釋，只測試BNF功能
- 用於開發時調試和驗證

### 八、數據流向圖
test.RAW (原始圖像)  
    ↓  
config.csv (參數)  
    ↓  
[DPC] → [BLC] → [AAF] → [WBGC] → [CNF]  
    ↓  
[CFA去馬賽克]  
    ↓  
[CCM色彩校正] → [GC伽馬校正]  
    ↓  
[CSC色彩空間轉換]  
    ↓  
[NLM] → [BNF] → [EE] → [FCS]  
    ↓  
[HSC] + [BCC]  
    ↓  
最終YUV圖像輸出  

### 九、技術亮點
1. **模塊化設計**：每個算法獨立為一個類，易於集成和調試
2. **參數可配置**：所有參數通過CSV文件管理，無需修改代碼
3. **多域處理**：結合RAW、RGB、YUV三個域的優勢
4. **降噪策略**：使用非局部均值 + 雙邊濾波的兩層降噪
5. **硬體友好**：設計參考硬體實現，包含邊界和溢出處理

### 十、主要文件速覽
文件	|大小	|用途
----|----|----|
isp_pipeline.py	|~326行	|完整ISP流水線主程序
test_bnf.py	|~337行	|BNF算法單元測試
model/*.py	|各式規模	|14個ISP模塊實現
config.csv	|112行	|完整參數配置表  

## 資料夾概覽
分析目錄：model/

此資料夾包含 15 個 Python ISP 模組，每個檔案實作一個影像訊號處理階段。整體用途是將相機感測器取得的 Bayer RAW 影像，逐步轉換為 RGB/YUV 影像。

__pycache__ 中的 .pyc 是 Python 編譯快取，不是主要原始碼。

### 一、依影像處理領域分類
| 處理領域 | 處理階段 | Python 檔案 | 主要用途 |
| ---- | ---- | ---- | ---- |
| RAW / Bayer 域 | DPC | dpc.py | 修正壞點、死像素 |
| RAW / Bayer 域 | BLC | blc.py	| 黑電平補償 |
| RAW / Bayer 域 | AAF | aaf.py	| 抗混疊濾波 |
| RAW / Bayer 域 | AWB | awb.py	| 白平衡增益調整 |
| RAW / Bayer 域 | CNF | cnf.py	| 色度雜訊抑制 |
| RAW → RGB	| CFA | cfa.py | Bayer 去馬賽克、產生 RGB |
| RGB 域 | CCM | ccm.py | 色彩矩陣校正 |
| RGB 域 | Gamma | gac.py | Gamma 曲線校正 |
| RGB → YUV | CSC | csc.py | 色彩空間轉換 |
| YUV / 亮度域 | NLM | nlm.py | 非局部均值降噪 |
| YUV / 亮度域 | BNF | bnf.py | 雙邊濾波降噪 |
| YUV / 亮度域 | EE | eeh.py | 邊緣增強 |
| YUV / 色度域 | FCS | fcs.py | 抑制假色 |
| YUV / 色度域 | HSC | hsc.py | 色調與飽和度調整 |
| YUV / 亮度域 | BCC | bcc.py | 亮度與對比度調整 |
### 二、各 Python 檔案功能說明
| 檔案 | 類別 | 主要功能 | 核心處理方式 | 輸入與輸出 |
| ---- | ---- | ---- | ---- | ---- |
| dpc.py | DPC | Dead Pixel Correction，死像素修正 | 比較中心像素與周圍 8 個像素，使用 mean 或 gradient 模式替換異常值 | Bayer 單通道 → Bayer 單通道 |
| blc.py | BLC | Black Level Compensation，黑電平補償 | 分別對 R、Gr、Gb、B 加上黑電平參數，並依亮度進行補償 | Bayer → Bayer |
| aaf.py | AAF | Anti-Aliasing Filter，抗混疊濾波 | 使用 5×5 濾波核心進行空間濾波 | Bayer → Bayer |
| awb.py | WBGC | Auto White Balance Gain Control，白平衡增益 | 依 Bayer pattern 對 R、Gr、Gb、B 套用不同增益 | Bayer → Bayer |
| cnf.py | CNF | Chroma Noise Filtering，色度降噪 | 偵測色彩像素是否偏離周圍綠色與色度平均值，再進行衰減修正 | Bayer → Bayer |
| cfa.py | CFA | Color Filter Array Interpolation，去馬賽克 | 使用 Malvar 插值演算法，從 Bayer 像素估算完整 | RGB	Bayer → RGB 三通道 |
| ccm.py | CCM | Color Correction Matrix，色彩校正 | 使用 3×4 矩陣對 RGB 像素進行線性轉換與偏移 | RGB → RGB |
| gac.py | GC | Gamma Correction，Gamma 校正 | 使用 LUT 查表方式調整 RGB 或 YUV 的非線性亮度 | RGB/YUV → RGB/YUV |
| csc.py | CSC | Color Space Conversion，色彩空間轉換 | 使用 3×4 矩陣將 RGB 轉換為 YUV | RGB → YUV |
| nlm.py | NLM | Non-Local Means，非局部均值降噪 | 在搜尋視窗中比較相似區塊，依相似度加權平均 | 單通道亮度 → 單通道亮度 |
| bnf.py | BNF | Bilateral Noise Filtering，雙邊濾波 | 同時考慮空間距離與像素值差異，保留邊緣並降低雜訊 | 單通道 → 單通道 |
| eeh.py | EE | Edge Enhancement，邊緣增強 | 使用邊緣濾波器產生 edge map，再依門檻與增益增強邊緣 | 單通道 → 增強影像 + edge map |
| fcs.py | FCS | False Color Suppression，假色抑制 | 根據 edge map 降低高對比區域中的色度訊號 | 色度通道 → 色度通道 |
| hsc.py | HSC | Hue/Saturation Control | 使用正弦、餘弦查表調整色調，並依倍率調整飽和度 | 色度通道 → 色度通道 |
| bcc.py | BCC | Brightness/Contrast Control | 加上 brightness，並以對比度倍率調整像素 | 亮度通道 → 亮度通道 |
### 三、主要執行流程
在 ```isp_pipeline.py``` 中，處理順序大致如下：

RAW Bayer  
  ↓  
DPC → BLC → AAF → AWB → CNF  
  ↓  
CFA 去馬賽克  
  ↓  
CCM → Gamma  
  ↓  
CSC：RGB → YUV  
  ↓  
NLM → BNF → EE  
  ↓  
FCS → HSC → BCC  
  ↓  
輸出 YUV 影像

各階段目的
1. RAW/Bayer 域：修正感測器資料與 Bayer 雜訊。
2. RGB 域：完成去馬賽克與色彩校正。
3. YUV 域：分別處理亮度與色度，進行降噪和影像增強。
4. 輸出階段：將 Y、Cb、Cr 三個通道重新組合成影像。
### 四、共同程式設計模式
大部分類別採用相同的使用方式：
```
processor = SomeClass(image, parameters)
result = processor.execute()
```
### 共同特點：
- ```__init__()```：接收影像與演算法參數。
- ```padding()```：使用反射邊界補值，避免邊界處理問題。
- ```clipping()```：限制像素值範圍，避免溢位。
- ```execute()```：執行主要影像處理流程。
- 使用 NumPy 進行陣列與像素運算。
- Bayer 相關模組支援：
    - ```rggb```
    - ```bggr```
    - ```gbrg```
    - ```grbg```
### 五、程式實作注意事項
| 項目 | 說明 |
| ---- | ---- |
| 檔名與類別名稱不同 | gac.py 中的類別是 GC，eeh.py 中的類別是 EE，awb.py 中的類別是 WBGC |
| AAF.padding()	| 雖然建立了 padding 影像，但 execute() 實際濾波時使用的是原始影像 |
| BNF 除錯輸出 | bnf.py 會在每個像素位置印出座標，執行大型影像時可能非常慢 |
| HSC 計算順序 | 色調旋轉結果後，又重新寫入飽和度結果，可能使前面的色調計算被覆蓋 |
| 資料型別 | 部分模組使用 uint8、uint16、int16，參數或影像值過大時需注意溢位與截斷 |
| 未使用的 import | aaf.py 與 csc.py 匯入了 correlate，但部分程式中未實際使用 |