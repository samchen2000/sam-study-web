# Infinite-ISP 調適工具 (Tuning Tool) v1.1 使用者指南
Infinite-ISP 調適工具 (Tuning Tool) v1.1 的使用者指南，該軟體專為優化相機影像處理流水線的效能而設計。工具主要分為校準、分析與生成設定檔三大功能，涵蓋黑電位校準、白平衡計算及色彩校正矩陣等關鍵技術。使用者能透過視覺化界面載入 RAW 或 RGB 影像，利用內建的 ColorChecker 選取功能精準分析影像雜訊與伽瑪曲線。最終，系統會產生 configs.yml 與 isp_init.h 檔案，確保軟體模型與 FPGA 硬體之間的參數配置無縫銜接。此手冊詳細說明了從目錄結構、操作流程到資料儲存的完整步驟，協助開發者達成卓越的影像品質。
## 啟動與基本操作流程
- ### 啟動工具：
本校準工具的主程式入口為 ```tuning_tool.py```。啟動時，系統會要求載入預設設定檔 ```default_configs.yml```，並在同目錄下自動創建一個複本 ```configs.yml```。這樣一來，您可以靈活客製化參數，同時確保原始預設設定不被破壞。
- ### 主選單導覽：
在終端機主選單中，您可以使用鍵盤的上下方向鍵移動光標，並按 Enter 鍵選擇所需的校準或分析模組。
- ### 影像命名格式：
若要載入您的感測器影像，RAW 影像必須遵循特定的命名格式，即 ```Name_WxH_Nbits_Bayer.raw```。例如：```ColorChecker_2592x1536_12bits_RGGB.raw```。
## 通用操作：ColorChecker 區域選擇與存檔
在執行白平衡或色彩校正矩陣校準時，系統會開啟影像並要求您選取 ColorChecker 區域：
- ### 精密對位：
介面上會顯示預設的選取框，您可以使用滑鼠拖曳框上的四個角點來精準對齊 ColorChecker 的色塊。
- ### 影像縮放與導覽：
使用滑鼠滾輪可以進行放大/縮小影像，並利用下方及右側的滾動條移動至特定區域。
- ### 尺寸微調：
您可以使用底部的 ```Adjust Size```、```Adjust Width``` 和 ```Adjust Height``` 滑動條來同步調整所有選取方框的大小。對齊完成後按 Continue 執行計算，或按 Redraw 恢復預設框。
- ### 存檔方式：
校準完成後，您有三種儲存數據的方式：
- (1) 直接存入 configs.yml 設定檔、
- (2) 在 GUI 中點擊 "Save" 匯出為 CSV 檔、
- (3) 點擊 "Save Images" 將校準前後的對比圖儲存為 PNG 檔案。
## 三大校準工具的使用步驟. 
### 1. 黑電平校準 (Black Level Calibration, BLC)
- 基本概念：補償感測器的內置偏置（Offset），讓影像在完全無光時的輸出能對齊真正的黑色。
- 輸入需求：
    - 計算黑電平：需使用一張直接從感測器在完全無光環境（例如蓋上鏡頭蓋）下拍攝的均勻黑色 RAW 影像。
    - 套用黑電平：需使用一張待校正的 RAW 影像。
- 操作步驟：
    1. 在主選單選擇「Calibrate Black Levels」。
    2. 系統提供兩個選項：可以直接套用設定檔現有的黑電平（選擇「Apply Black Levels」，並可選擇是否啟用線性化），或者選擇計算黑電平。
    3. 若選擇計算，請載入您的全黑 RAW 影像。
    4. 系統會自動執行演算法，並於終端機顯示 R、Gr、Gb、B 通道的個別黑電平數值。
    5. 最後，您可以選擇將計算結果儲存至 configs.yml，或直接套用這組黑電平數值到其他影像並存檔。 
### 2. 白平衡增益計算 (White Balance Calculation, WB)
- 基本概念：調整紅（R）、綠（G）、藍（B）通道的增益值，使白色物體在不同光源下能呈現真正的白色（消除色偏）。
- 輸入需求：一張包含 ColorChecker 的 RAW 或是 RGB 影像。
- 操作步驟：
    1. 在主選單選擇「Calculate ColorChecker White Balance」。
    2. 載入含 ColorChecker 的影像。
    3. 利用區域選取介面對齊 ColorChecker。演算法會特別利用最後一排的灰色色塊 (grayscale patches) 來進行增益計算。
    4. 按下 Continue 開始計算，終端機隨後會顯示計算出的 R gain 與 B gain 數值。
    5. 您可以選擇將增益值直接儲存至 ```configs.yml``` 設定檔，或選擇在畫面上套用增益，檢視校準前後的對比影像並儲存。
### 3. 色彩校正矩陣計算 (Color Correction Matrix, CCM)
- 基本概念：計算一個 3x3 矩陣，用來將相機捕捉到的顏色映射到目標色彩，以修正色彩偏差和不自然的飽和度。
- 輸入需求：一張包含 ColorChecker 的 RAW 或 RGB 影像（支援 .png、.jpg、.jpeg 格式）。
- 操作步驟：
    1. 在主選單選擇「Calculate Color Correction Matrix」。
    2. 載入影像並精確對齊 ColorChecker 區域。
    3. 對齊後，系統會提示詢問：是否在影像中套用白平衡？（Apply White Balance?）
    4. 接著，系統會要求您選擇誤差矩陣演算法：$\Delta E_{ab}^{00}$ 或是 $\Delta C_{ab}^{00}$。
    5. 最後，系統會詢問：是否在影像中維持白平衡？（Maintain White Balance?）
    6. 執行後，終端機會顯示兩種色彩校正矩陣：
        - 整數型 CCM (Integer CCM)：適合晶片與 FPGA 等硬體實作。
        - 浮點數型 CCM (Floating-point CCM)。
    7. GUI 會顯示校準前後的色彩對比影像，您可以選擇將結果儲存至 ```configs.yml``` 設定檔中。
### 4. Gamma 曲線分析（Gamma Analysis） 
主要用於將使用者自訂的 Gamma 曲線與標準的 sRGB 空間 Gamma 曲線（$\gamma \approx 2.2$）進行視覺化對比12。其具體的調整與分析操作流程如下：
1. 輸入與準備階段自動載入參數：此分析模組不需要載入 RAW 或 RGB 影像34。系統會直接從您載入的設定檔 (configs.yml) 中，自動讀取使用者定義的 Gamma 曲線數據2。準備基準曲線：系統會自動產生一條以 $\gamma = 2.2$ 為基準的標準 Gamma 曲線，用於後續的視覺化對比5。2. 執行分析與對比步驟選單操作：在主選單中，使用鍵盤的上下鍵導覽並選擇 "Generate Gamma Curves"（或從 Gamma 模組選單中選擇比較 Gamma 曲線）56。曲線繪製與檢視：工具會自動開啟一個繪圖面板，並同時繪製出兩條曲線供您對比5：User-defined Gamma（使用者自訂的 Gamma 曲線，通常以藍線與紅點表示）5。Gamma 2.2（標準 Gamma 2.2 曲線，通常以綠線與黑星表示）5。透過此圖表，您可以直觀地觀察自訂 Gamma 曲線在不同輸入強度階（Intensity Levels）下的走勢是否平滑，以及其與標準 sRGB 曲線的偏差程度5。3. 儲存對比結果儲存圖表：在顯示 Gamma 曲線繪圖的面板下方，設有一個 "Save"（或 "Save Graphs"）按鈕5。若您需要記錄此次分析，點擊該按鈕即可將對比圖表結果儲存至您指定的本機位置5。