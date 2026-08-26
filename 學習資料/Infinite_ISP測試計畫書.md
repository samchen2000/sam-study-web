# Infinite-ISP Tuning Tool v1.1 完整測試計畫書

本測試計畫書旨在針對 **Infinite-ISP Tuning Tool v1.1** 進行全面、系統性的功能性驗證與品質測試 [1]。本工具專門設計用於分析與微調 **Infinite-ISP_ReferenceModel** 影像信號處理器管線中的各個演算法模組 [17-18]。本計畫書將涵蓋所有校準工具、分析工具及組態生成模組的測試案例、輸入需求、操作步驟與預期結果 [19-20, 22-23]。

---

## 1. 測試概觀與環境準備

### 1.1 測試目的
1. 驗證校準工具（Black Level、White Balance、CCM）之演算法計算結果是否精確、合理，且能正確寫入組態 [19, 22]。
2. 驗證分析工具（Gamma 曲線、BNE、LNE）之視覺化圖表與雜訊統計數據是否正確無誤 [19, 23]。
3. 確保組態生成器能正確輸出可用於軟體管線的 `configs.yml` 以及硬體 FPGA 實作的 `isp_init.h` 基準檔 [19-21, 24]。
4. 驗證跨模組通用互動介面（ColorChecker 互動選取框、縮放、滑桿調整）之穩定性與正確性 [33-36]。

### 1.2 測試環境與目錄結構
在執行測試前，請確認測試環境中 `Infinite-ISP_TuningTool` 根目錄下包含以下完整結構 [24]：
```
Infinite-ISP_TuningTool/
├── app_data/                   # CCM 演算法所需之標準 D65 色彩參考檔 [24-25]
│   ├── refD65Lab.txt
│   └── refD65Lin.txt
├── config/                     # 設定檔存放目錄 [25]
│   └── default_configs.yml     # 系統預設之 ISP 參數檔（唯讀，不應手動修改） [20, 25, 28]
├── data_set/                   # 測試用範例 RAW 及 RGB 影像 [26]
│   └── (例如：ColorChecker_2592x1536_12bits_RGGB.raw) [26]
├── src/                        # 原始碼目錄 [24]
│   ├── menu/
│   ├── modules/
│   └── utils/
└── tuning_tool.py              # 主程式進入點 [26]
```

### 1.3 啟動與初始化測試
*   **測試方法**：於終端機執行 `python tuning_tool.py` [26]。
*   **預期結果**：
    1. 系統自動偵測並載入 `default_configs.yml` [20, 28]。
    2. 若偵測到同目錄下已存在先前產生的 `configs.yml`，應彈出詢問視窗，讓測試人員選擇是否載入舊有的客製化參數（"Do you want to load it?"） [21, 28-30]。
    3. 若確認載入或新建後，應成功進入並顯示主選單（Main Menu），可使用鍵盤 **上下方向鍵** 導覽，並按 **Enter** 鍵選取模組 [30]。
    4. 若在 `config/` 中找不到任何預設設定檔，程式應顯示錯誤訊息並安全結束 [30]。

---

## 2. 通用交互功能測試 (Common Functionalities)

通用互動功能橫跨多個校準與分析模組。此部分需在 BLC、WB、CCM、BNE、LNE 等模組啟動時進行交叉驗證 [31-32]。

### 2.1 影像載入安全性測試 [31-32]
*   **測試案例 ID**：`TC_COM_LOAD_01`
*   **測試目的**：驗證非標準檔名、格式不符或取消載入時的系統容錯能力。
*   **輸入條件**：
    1. 不合規的 RAW 檔名（例如：`test_image.raw`，未包含寬、高、位元深度與 Bayer 資訊） [26]。
    2. 格式不相符的檔案（如非 RAW 影像，但使用要求 RAW 的 BNE 模組） [32, 55]。
    3. 彈出選取視窗時直接點擊「取消」或關閉視窗 [32]。
*   **步驟**：
    1. 進入任一需載入影像之模組（如 BNE 模組） [32]。
    2. 分別載入上述三種異常輸入。
*   **預期結果**：
    1. 若未正確選擇或檔案損壞，終端機/GUI 必須顯示 **"Error! File is not selected."**（或相關載入失敗之錯誤提示） [32]。
    2. 系統不可發生崩潰，且必須重新彈出載入對話框，提示測試人員重新選取符合格式的檔案 [32]。
    3. 對於 RAW 影像，系統必須能從符合規律的命名格式 `Name_WxH_Nbits_Bayer.raw` 中，正確自動解析出 **寬、高、位元深度（Bit depth）** 與 **Bayer 格式** 並顯示於控制台 [26, 42, 46]。

### 2.2 ColorChecker 互動對位與區域選擇測試 [33-36]
*   **測試案例 ID**：`TC_COM_ROI_02`
*   **測試目的**：驗證 24 色卡（ColorChecker）區域標註框的對齊與縮放功能是否精確、易用。
*   **輸入條件**：包含 ColorChecker 標靶的標準測試影像（RAW 或 RGB） [32, 45, 49, 58]。
*   **步驟**：
    1. 進入 WB 或 CCM 模組並載入影像，開啟互動式 ROI 選取視窗 [32, 45, 49]。
    2. **四角對位測試**：使用滑鼠左鍵點選並拖曳紅框的四個端角（左上、右上、左下、右下角點），確認整組 24 格方框會隨之進行平移與透視拉伸，且非拖曳的角點會固定在原處 [33-34]。
    3. **滾輪縮放與滾動條測試**：將滑鼠游標移至色卡處，滾動滑鼠滾輪進行放大（Zoom-in）與縮小（Zoom-out）。確認滾動後可利用底部及左側的滾動條（Scrollbars）移動視窗，精細對齊高解析度下的色塊邊緣 [35]。
    4. **滑桿微調測試**：手動拖曳下方的 `Adjust Size`（調整尺寸）、`Adjust Width`（調整寬度）、`Adjust Height`（調整高度）滑動條 [36]。
    5. **控制按鈕驗證**：點擊 `Redraw` 按鈕，確認方框是否立刻回復到預設初始狀態 [36]。
    6. **執行前確認**：確認最後一排 6 個灰階色塊（Grayscale Patches）均被精確包覆在紅框內部（避免壓到色塊間的黑邊），然後按下 `Continue` [33, 36]。
*   **預期結果**：
    1. 縮放及角點拖曳流暢，無畫面殘影或座標偏移失控。
    2. 滑桿可即時且同比例縮放所有 24 個微型選取框。
    3. 按下 `Continue` 後能成功結束選取畫面並將區域座標數據導向演算法計算 [36]。

---

## 3. 校準工具測試 (Calibration Tools)

校準工具用於生成相機管線所需的基礎硬體與演算法控制參數 [19, 22]。

### 3.1 黑電平校準 (Black Level Calibration - BLC) 測試 [39-43]
*   **測試案例 ID**：`TC_CAL_BLC_01`
*   **測試目的**：驗證全黑環境下感測器偏置（Offset）的計算，以及將黑電平套用至待校影像之線性化功能。
*   **輸入條件**：
    1. 於完全無光（蓋上鏡頭蓋）環境下拍攝的均勻全黑 RAW 影像 [40]。
    2. 一張正常光照下的待校正 RAW 影像 [41]。
*   **步驟**：
    1. 在主選單選取 **"Calibrate Black Levels"** [30]。
    2. **計算流程**：選取計算黑電平並載入上述全黑 RAW 影像 [42]。
    3. 紀錄控制台輸出的 R、Gr、Gb、B 四個通道獨立黑電平數值（例如：R=3, Gr=2, Gb=3, B=2） [42-43]。
    4. **套用流程**：在結尾選單選擇將黑電平套用於另一張正常光照的待校正影像（"Apply Calculated Black Levels"） [41-43]。
    5. 系統會詢問是否進行線性化（Linearization）；選擇 "Yes"，並驗證其是否使用來自組態檔中的飽和度（Saturation）參數進行正規化與裁剪 [42]。
    6. **存檔測試**：選擇 "Save config.yml with Calculated Black Levels"，確認參數成功寫入 [37, 42-43]。
*   **預期結果**：
    1. 控制台成功印出四通道之整數黑電平值，其數值應落在合理區間 [42-43]。
    2. 套用黑電平與線性化後的新圖像應能正確儲存至本機指定路徑，且黑區偏置已被扣除（暗部細節對比拉開）。
    3. 開啟 `configs.yml`，確認其黑電平欄位已寫入對應數值 [37, 43]。

### 3.2 白平衡增益計算 (White Balance - WB) 測試 [44-46]
*   **測試案例 ID**：`TC_CAL_WB_02`
*   **測試目的**：驗證利用 ColorChecker 灰階色塊進行光源色溫增益計算的精確度與對比影像輸出。
*   **輸入條件**：包含標準 ColorChecker 的 RAW 或 RGB 影像 [44-45]。
*   **步驟**：
    1. 在主選單選取 **"Calculate ColorChecker White Balance"**。
    2. 載入影像，精確框選 ColorChecker 區域，確保最後一排 6 個灰階色塊正確對位 [45-46]。
    3. 點擊 `Continue`，白平衡演算法應自動利用這 6 個灰階色塊（由白至黑）的 R、G、B 均值來估算 **R gain** 與 **B gain**（Green 通道固定為 1.0） [46]。
    4. **比對介面驗證**：在控制台顯示計算出的 R gain 與 B gain 後，於結束選單選擇 **"Apply White Balance on the Input Image"** 檢視校準對比畫面 [46]。
    5. 確認對比視窗左半邊為 `Before White Balance`（通常有明顯偏綠/偏黃偏色），右半邊為 `After White Balance`（色偏消除，灰色色塊回歸中性灰） [46]。
    6. 點擊 `Save Images` 儲存對比 PNG 圖檔 [38, 46]。點擊設定檔寫入，將增益值寫入 `configs.yml` [37, 46]。
*   **預期結果**：
    1. 控制台正確輸出浮點數 R gain 與 B gain 增益值 [46]。
    2. 對比影像（PNG）成功產出，且在 "After White Balance" 的圖像中，白平衡表現優異，中性灰階無彩色雜訊或殘留色偏。
    3. `configs.yml` 中的白平衡增益參數（r_gain, b_gain）已被正確覆蓋 [37, 46]。

### 3.3 色彩校正矩陣 (Color Correction Matrix - CCM) 測試 [47-52]
*   **測試案例 ID**：`TC_CAL_CCM_03`
*   **測試目的**：驗證在不同色差目標演算法下，3x3 CCM 矩陣的計算與白平衡連鎖控制。
*   **輸入條件**：包含標準 ColorChecker 的 RAW 或 RGB 格式（.png, .jpg, .jpeg）影像 [48-49]。
*   **步驟**：
    1. 在主選單選取 **"Calculate Color Correction Matrix"**。
    2. 載入影像並對齊 ColorChecker [49]。
    3. 演算法啟動前進行交互問答測試：
        *   問題 1：**"Apply White Balance? Yes/No"** -> 選擇 **"Yes"** [50]。
        *   問題 2：**"Error Matrix?"** -> 選擇 **"$\Delta E_{ab}^{00}$"** 或 **"$\Delta C_{ab}^{00}$"**（驗證此兩條不同路徑均能順利跑通演算法） [50]。
        *   問題 3：**"Maintain White Balance? Yes/No"** -> 選擇 **"Yes"**（此時矩陣每一列之和應被約束限制為 1，以確保不會引入額外的色偏） [50-51]。
    4. **計算結果驗證**：演算法執行完畢後，確認控制台是否同時輸出兩種矩陣：
        *   **Floating-point CCM** (浮點數矩陣，用於軟體管線精確運算) [51-52]。
        *   **Integer CCM** (整數型矩陣，數值擴展，用於硬體/FPGA 友善實作) [51-52]。
    5. 透過對比 GUI（Before CCM vs After CCM）確認顏色飽和度與色相已被校正至接近 D65 標準空間 [51]。
    6. 將 CCM 結果儲存至設定檔中 [37, 52]。
*   **預期結果**：
    1. 若選擇 "Maintain White Balance: Yes"，最終產出的 CCM 矩陣中，紅、綠、藍三列各自的元素相加總和必須極度接近 1.0 [50-51]。
    2. 浮點數矩陣與整數型矩陣均正確印出於控制台，且格式無錯位 [51-52]。
    3. 校正後的色彩在主觀對比中，紅色、綠色與藍色色塊鮮明、不偏色且無過度飽和偽影。

---

## 4. 分析工具測試 (Analysis Tools)

分析工具用於提取數據特徵、繪製對比圖，以協助開發人員進行更深層次的 ISP 管線微調 [19, 23]。

### 4.1 Gamma 曲線分析測試 [52-53]
*   **測試案例 ID**：`TC_ANA_GAM_01`
*   **測試目的**：驗證自訂 Gamma 曲線與標準 sRGB 空間 $\gamma = 2.2$ 曲線之載入、比較與可視化。
*   **輸入條件**：於 `configs.yml` 中預先定義一組非線性的 Gamma 數據點 [52-53]。
*   **步驟**：
    1. 在主選單選取 **"Generate Gamma Curves"**（或 Gamma 模組選單中的比較曲線） [30, 53]。
    2. 觀察開啟的 Gamma 曲線比較圖表 [53]。
    3. 確認圖表內包含兩條曲線圖例：
        *   一條為紅點藍線，標註為 **User-defined Gamma**（使用者自訂 Gamma） [53]。
        *   另一條為黑星綠線，標註為 **Gamma 2.2**（標準曲線） [53]。
    4. 確認圖表上方有標註感測器的當前位元深度（例如：`Bits depth = 12`） [53]。
    5. 點擊圖表下方的 **"Save Graphs"** 按鈕將圖表儲存為 PNG [53]。
*   **預期結果**：
    1. 視窗順利開啟，正確繪製出兩條曲線，且 X 軸（Intensity Levels 階度強度）與 Y 軸（Gamma 響應值）標籤與格線清晰可辨。
    2. 儲存之 PNG 檔案解析度高、無切邊且曲線資訊完整。

### 4.2 Bayer 域雜訊估算 (Bayer Noise Estimation - BNE) 測試 [54-56]
*   **測試案例 ID**：`TC_ANA_BNE_02`
*   **測試目的**：評估 RAW Bayer 影像在灰色色塊上的通道獨立雜訊標準差 [54]。
*   **輸入條件**：包含 ColorChecker 標靶的原始 RAW 格式影像 [32, 55]。
*   **步驟**：
    1. 在主選單選取 **"Estimate Bayer Noise Levels"** [30]。
    2. 載入 RAW 影像，並框選 ColorChecker，確保最後一排 6 個灰階色塊被紅框完全包含 [32, 55-56]。
    3. 按下 `Continue` 開始計算，演算法將 RAW 影像拆分為 R、G (Gr/Gb) 及 B 三個獨立 Bayer 通道 [55-56]。
    4. 計算 6 個灰色色塊在各通道中的像素值標準差（Standard Deviation） [56]。
    5. 觀察彈出的 "Bayer Noise Levels" 數據視窗，確認表格中列出 **Patch 1 至 6** 分別於 R, G, B 的 Std 數值，以及最下方的平均值 **Mean Std** [56]。
    6. 點擊 **"Save"** 按鈕，將此表格匯出為 **CSV 檔案** [56]。
*   **預期結果**：
    1. 對於均勻的灰色色塊，Std 代表雜訊。由於灰色色塊的亮度是由淺到深，因此雜訊 Std 值應呈現與亮度強度相關的合理分佈規律 [56]。
    2. 匯出的 CSV 檔案應包含清晰的通道與 Patch 標頭，且各單元格數據與 GUI 顯示完全一致 [56]。

### 4.3 亮度雜訊估算 (Luminance Noise Estimation - LNE) 測試 [57-59]
*   **測試案例 ID**：`TC_ANA_LNE_03`
*   **測試目的**：評估影像轉換至亮度通道後之雜訊分佈，並用以與 RAW 域（BNE）進行雜訊放大比對。
*   **輸入條件**：包含 ColorChecker 的同一張 RAW（或轉換後的 RGB）影像 [58]。
*   **步驟**：
    1. 在主選單選取 **"Estimate Luminance Noise Levels"**。
    2. 載入影像，框選對齊 ColorChecker 區域並按 `Continue` [58]。
    3. 系統彈出提示：**"Apply White Balance? Yes/No"**：
        *   測試 1：選擇 **"No"**，計算並匯出 CSV [58-59]。
        *   測試 2：選擇 **"Yes"**，計算並匯出另一份 CSV，觀察白平衡增益對亮度雜訊的放大效果 [58-59]。
    4. 觀察彈出的 "Luma Noise Levels" 數據視窗，表格中應包含 6 個灰色色塊的**局部縮圖**，以及對應的 `std` 數值與整體的 `Mean std` [59]。
*   **預期結果**：
    1. "Apply White Balance: Yes" 計算出的 Luma Noise 應顯著高於 "No" 的版本，這證明了白平衡通道增益（如 R gain、B gain）在拉高色溫的同時亦放大了雜訊。
    2. 與 BNE 結果比對：若去馬賽克（Demosaicing）或 CCM 計算不當，LNE 的整體 Mean std 可能會出現異常陡增，此測試結果可做為降噪（Denoising）與銳化模組調整的重要指引。

---

## 5. 設定與基準檔生成測試 (Generate Configuration Files)

測試組態生成與感測器資訊更新功能，確保生成的組態能無縫導入後續的軟硬體管線中 [20, 60-61]。

### 5.1 感測器資訊更新與寫入測試 [62-63]
*   **測試案例 ID**：`TC_GEN_SENS_01`
*   **測試目的**：驗證更新感測器基礎參數（Bayer 格式、位元深度、寬、高）時，設定檔能正確被複寫。
*   **步驟**：
    1. 在主選單選擇 **"Generate Configuration Files"** [30]。
    2. 控制台將顯示目前載入的 Sensor Info 欄位 [62]。
    3. 選取 **"Update Sensor Info"** [62]。
    4. 依提示手動輸入修改後之參數：
        *   Select the Bayer Pattern: `rggb` [63]
        *   Select the Bit Depth: `12` [63]
        *   Enter width: `1920` [63]
        *   Enter height: `1080` [63]
    5. 確認控制台印出 "Updated Sensor Info!" 並顯示新設定 [63]。
*   **預期結果**：
    1. 設定完成後，返回上一層或重新進入，顯示的 Sensor 欄位資訊必須與新輸入的值完全一致 [62]。

### 5.2 軟硬體組態檔匯出測試 [60-62]
*   **測試案例 ID**：`TC_GEN_OUT_02`
*   **測試目的**：驗證生成 Infinite-ISP_ReferenceModel 專用的 `configs.yml` 與 FPGA 用的 `isp_init.h` 基準檔 [20, 60-61]。
*   **步驟**：
    1. 進入生成檔案選單後，選取 **"Generate configs.yml"** [60]。
    2. 接著選取 **"Generate isp_init.h"** [61]。
    3. 退出工具，檢查目錄下的 `config/configs.yml` 檔案以及新生成的 `isp_init.h` 檔案 [25, 29, 61]。
*   **預期結果**：
    1. `configs.yml` 內容格式必須合規，並確實保存了在 BLC、WB、CCM、Sensor Info 中調整或計算出的所有數值 [29, 61]。
    2. `isp_init.h` 必須生成成功，其內容應為 C/C++ 相容之標頭檔格式，其中包含將 `configs.yml` 的浮點數與各模組參數映射為 FPGA 暫存器所需的整數配置 [61-62]。

---

## 6. 測試結論與異常狀況處理 (Troubleshooting)

| 異常現象 | 可能原因 | 建議排除步驟 |
| :--- | :--- | :--- |
| **影像載入時顯示 `Error! File is not selected.`** [32] | 1. 於彈出檔案對話框中點擊了取消 [32]。<br>2. 檔案格式不合（例如非 24 色卡影像） [32, 55]。<br>3. RAW 影像命名未遵循標準格式 [26]。 | 1. 確認重新載入時點擊「開啟/OK」 [32]。<br>2. 檢查 RAW 影像檔名是否嚴格遵循 `Name_WxH_Nbits_Bayer.raw` 格式 [26]。 |
| **對齊 ColorChecker 時按 `Continue` 無反應** [36] | 1. 選取框位置或角點被拉伸至畫面邊界外，導致座標溢出。<br>2. UI 視窗卡死。 | 1. 點擊 `Redraw` 按鈕，將方框重設至中央預設位置 [36]。<br>2. 配合 `Adjust Size` 滑桿將整體方框調小後再進行角點對齊 [36]。 |
| **主選單或設定載入失敗** [30] | `config/` 目錄下缺少預設的 `default_configs.yml` 檔案 [30]。 | 自 Infinite-ISP Reference Model 中複製原始的 `default_configs.yml` 至 `config/` 資料夾下，然後重啟 `tuning_tool.py` [20, 25-26, 28, 30]。 |
