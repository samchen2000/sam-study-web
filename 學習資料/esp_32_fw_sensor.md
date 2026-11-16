# 開發 ESP32-P4 相機感測器驅動並使用 ESP ISP Tuning Tool 進行影像品質（IQ）調優，整體流程可劃分為 「驅動開發與驗證」、「固件準備與工具連接」 以及 「ISP 模組離線與在線調優」 三大階段。
以下是完整的啟動與執行步驟指南：
## 階段一：感測器驅動開發 (Sensor Driver Development)
在進入 IQ 調優之前，必須先在 ESP-IDF 的 esp_cam_sensor 驅動架構下，完成硬體通訊與出圖功能的驅動編寫。
### 1. 建構驅動模組架構： 依據樂鑫 esp_cam_sensor 組件規範建立目錄結構：
- sc2336.c：驅動主邏輯。
- include/：對外標頭檔 sc2336.h 與型別定義 sc2336_types.h。
- private_include/：暫存器映射 sc2336_regs.h 與初始化設定 sc2336_settings.h。
- cfg/sc2336_default.json：存放圖像處理算法 (IPA) 的預設參數模板。
### 2. 通訊與時鐘配置：
- XCLK 生成：透過 esp_cam_sensor_xclk_ 介面（利用 LEDC 或 ESP_CLOCK 外設）為 Sensor 提供主時鐘。
- 設備發現 (Probe)：實作 SCCB/I2C 讀寫，透過 Sensor ID 辨識檢查硬體連接。
### 3. 格式與控制介面實作：
- 實現 esp_cam_sensor_set_format() 與 esp_cam_sensor_get_format()，設定解析度、幀率與 Bayer 格式（如 RAW8/RAW10/RAW12）。
- 實作 esp_cam_sensor_set_para_value() 與 esp_cam_sensor_get_para_value()，綁定 Exposure（曝光時間）與 Pixel Gain（增益）暫存器的控制邏輯。
- 實作 esp_cam_sensor_ioctl()，支援 ESP_CAM_SENSOR_IOC_S_STREAM 控制數據流開啟與停止。
## 階段二：標定固件準備與工具連接 (Firmware & Live Connection)
### 1. 燒錄專用標定固件：
- 在 ESP-IDF 環境中建置基於 esp-video-components 的標定固件並燒錄至 ESP32-P4 開發板。
- 確保固件中已啟動網路（以太網/Wi-Fi）或 USB 2.0 High-Speed 通訊服務，以及 RTSP 視訊串流服務。
### 2. 啟動 ESP ISP Tuning Tool：
- 在 Windows PC 上直接執行免安裝軟體 ESP-ISP-Tuning-Tool.exe。
- 點擊 New Project，選擇透過 IP 地址 或 USB 建立通訊。
- 點擊 Connect & Get Parameters，工具會自動從設備讀取 Sensor 名稱、解析度、位元深度與 Bayer 格式（如 RAW8 BGGR）。
## 階段三：IQ Tuning 模組調優順序 (Tuning Workflow)
進入工具後，必須遵循嚴格的 ISP 演算法依賴順序依次執行標定與調優：
### 1. 黑電平校正 (BLC Calibration)：
- 操作：完全遮擋鏡頭（暗場環境），在 Live Tuning 擷取不同 Gain 下的 RAW 圖，或在 Automation 執行暗場增益掃描。
- 目的：計算並扣除 R、Gr、Gb、B 四通道的暗電流偏置，將零點精準對齊純黑。
### 2. 鏡頭陰影校正 (LSC Calibration)：
- 前置：必須先套用 BLC 結果。
- 操作：在均勻光源（如燈箱或輝度箱）下拍攝灰白平面 RAW 圖，中心亮度控制在飽和值的 70% 左右。
- 目的：利用 Split-window 網格補償鏡頭光學暗角，輸出四通道增益補償矩陣。
### 3. 白平衡 (WB) 與色彩校正矩陣 (CCM Calibration)：
- 前置：必須先套用 BLC 與 LSC 結果24。
- 操作：在標準光源下拍攝 24 色卡（ColorChecker），順時針點擊 4 個角點框選色塊。填寫實測色溫（Actual CT），點擊 Patch 19–23 灰塊進行 WB 計算，並產生 $3 \times 3$ CCM 矩陣。
### 4. 多色溫白平衡擬合 (WBCT Calibration)：
- 操作：採集多個標準色溫點（如 A、TL84、D50、D65 等）下的 CCM/WB 數據，執行二次或三次擬合，生成 BG/RG FIT 與 CT/(RG,BG) 色溫對應曲線。
### 5. Gamma 曲線與細節/降噪調優 (Gamma, BF & Sharpen)：
- 在 Live Tuning 介面中動態編輯 Gamma 曲線（對比 sRGB $\gamma \approx 2.2$）。
- 配置 Bayer Filter (BF) 降噪強度與 Sharpen 銳化閾值/增益，透過 Capture 或 RTSP 實時視訊串流觀察影像細節與噪點平衡。
### 6. 匯出設定檔與整合：
- 將標定數據寫入 Sensor 的 IPA JSON 配置文件中，或透過工具生成 configs.yml 及 C 語言標頭檔 isp_init.h 供韌體初始化載入。


# 針對您目前使用 GalaxyCore GC2607 (2MP CMOS Image Sensor) 在 ESP32-P4 平台上進行驅動開發與 ESP ISP Tuning Tool 調優的需求，為您整理 GC2607 的關鍵硬體參數、驅動對接要點與 IQ 調優專屬注意事項：
## 一、 GC2607 關鍵規格與驅動參數對照根據 GC2607 Datasheet 與 ESP32-P4 驅動架構，開發與工具初始化需設定的參數如下：

| 規格項目 | GC2607 晶片參數 | ESP32-P4 驅動 / Tuning Tool 設定值 |
| ---- | ---- | ---- |
| 感測器 ID (Sensor ID) | 0x03F0 (0x26), 0x03F1 (0x07) | 讀取兩暫存器組合驗證 0x2607 |
| I2C / SCCB 設備位址 | Write: 0x6E / Read: 0x6F | 7-bit Address: 0x37 |
| 有效像素解析度 | Active Array: 1920 (H) × 1080 (V) | Width: 1920, Height: 1080 |
| 輸出介面與格式 | MIPI CSI-2 (1 或 2 Lanes) / RAW10 | Bit Depth: 10 (10-bit RAW) |
| Bayer Pattern (鏡頭未翻轉預設) | Register 0x0101[1:0] 預設 00 (First Pixel: Gr) | 預設為 GRBG (如圖檔翻轉可設 bggr, rggb 等) |
| 鏡頭主光線角 (CRA) | 33.658° (Non-linear) | LSC 鏡頭陰影校正重要參考依據 |
| 核心電源配置 | AVDD: 2.8V / DVDD: 1.2V / IOVDD: 1.8V | 硬體電源板腳位驗證 |
## 二、 GC2607 驅動開發實作要點 (ESP32-P4 esp_cam_sensor)
在編寫 esp_cam_sensor 驅動程式時，需完成以下三個核心控制 API 的綁定：
### 1. 設備探測 (Device Probe & ID Verification)：
- 透過 SCCB 在位址 0x37 發起通訊，讀取 0x03F0 與 0x03F1，確認晶片回應 0x26 與 0x07。
### 2. 曝光時間控制 API (Exposure Control)：
- GC2607 曝光時間由 Shutter Time 暫存器控制：
    - High Byte: Register 0x0202[6:0] (Exposure time [14:8])
    - Low Byte: Register 0x0203[7:0] (Exposure time [7:0])
- 將傳入的微秒 ($\mu s$) 轉換為 Line/Shutter 數值並寫入暫存器。
### 3. 增益控制 API (Pixel / Gain Control)：
- GC2607 支援 Analog PGA Gain 與 Pregain：
    - Analog PGA Gain: Register 0x02B3 (High) / 0x02B4 (Low)
    - Global Gain: Register 0x009E (High) / 0x009F (Low)
- 實作 esp_cam_sensor_set_para_value() 將放大倍數寫入增益暫存器。
## 三、 使用 ESP ISP Tuning Tool 開啟專案與驗證
### 1. 專案初始化設定 (Sensor Info)：
- 開啟 ESP-ISP-Tuning-Tool 後建立新專案，並連線至 ESP32-P4 開發板。
- 在 Update Sensor Info 或選單介面中確認感測器參數為：
    - Width: 1920
    - Height: 1080
    - Bit Depth: 10
    - Bayer Pattern: 選取 grbg（若出圖色偏，可在 Preview Raw 點擊 Demosaic 切換 bggr 或 rggb 進行確認）。
### 2. 圖像即時擷取與曝光驗證：
- 在 Live Tuning 頁面點擊 Capture。
- 測試微調 Exposure（例如輸入 10000 $\mu s$）與 Pixel Gain，點擊 Send 寫入設備，確認畫面亮度有即時變化，驗證驅動暫存器控制邏輯正確。
## 四、 GC2607 IQ Tuning 調優順序與注意事項
### 1. 黑電平校正 (BLC)：
- GC2607 晶片內部雖然具備自動黑電平校正（Optical Black Array），但在 10-bit RAW 模式下仍有基礎 offset。
- 蓋上鏡頭蓋完全遮光，在 Live Tuning 擷取暗場影像，計算出四通道偏置數值並暫存寫入。
### 2. 鏡頭陰影校正 (LSC)：
- 由於 GC2607 的 CRA 為 33.658°，若搭配的鏡頭 CRA 不匹配，畫面四角容易出現較明顯的光學暗角與色偏。
- 在輝度箱/均勻光源下，調整亮度使 1920x1080 影像中心 G 通道達到 70% 飽和度，計算 4 通道 Split-window 增益矩陣。
### 3. 白平衡 (WB) 與色彩校正 (CCM)：
- 拍攝 24 色卡，順時針點選 4 角點，填入實測色溫（如 D65 6504K）。
- 選取灰塊（Patch 19–23）導出 WB Gain，並算出一組專屬 GC2607 的 $3 \times 3$ CCM 矩陣。
### 4. 生成初始化設定檔：
- 調優完成後，導出 configs.yml（軟體 pipeline）與 isp_init.h（ESP32-P4 硬體/FPGA 暫存器初始化檔）。