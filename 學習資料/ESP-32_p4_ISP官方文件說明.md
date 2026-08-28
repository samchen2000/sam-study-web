# Espressif ISP 影像處理演算法
Espressif 影像處理演算法元件提供了一套影像處理演算法集。Component Registry  
## 1. 支援的演算法  
| 演算法 | 說明 |
| ---- | ---- |
| 自動色彩校正 (Auto Color Correction) | 計算鏡頭陰影校正參數、色彩校正矩陣 (CCM) 和飽和度值 |
| 自動去噪 (Auto Denoising) | 計算 Bayer 去噪參數和去馬賽克 (demosaic) 參數 |
| 自動增強 (Auto Enhancement) | 計算 GAMMA 表、銳化參數和對比度值 | 
| 自動增益控制 (Auto Gain Control) | 計算曝光和增益 |
| 自動白平衡 (Auto White Balance) | 計算紅色和藍色通道的增益 |
| 影像分析 (Image Analyze) | 計算影像色溫和亮度 (Luma) |
| 自動感測器 AE 目標控制 (Auto Sensor AE Target Control) | 適用於感測器本身支援 AEG/AGC 的情況 |

## 2. 管線全域變數 (Pipeline Global Variable)
此模組用於在一個影像處理管線中的演算法模組之間共享變數，而無需在模組內建立本地快取，例如：
```C
algorithm_1.c

    int color = 15;
    esp_ipa_set_int32(ipa_1, "color", 15);


algorithm_2.c

    if (esp_ipa_has_var(ipa_2, "color")) {
        int color = esp_ipa_get_int32(ipa, "color")
    }

algorithm_3.c

    if (esp_ipa_has_var(ipa_3, "color")) {
        int color = esp_ipa_get_int32(ipa, "color")
    }

......
```
## 注意："ipa_1"、"ipa_2" 和 "ipa_3" 必須位於同一個 IPA 管線中。
## 3. JSON 設定
開發者可參考 esp_cam_sensor 中的設定檔以了解 JSON 參數的使用方式：
SC2336
OV5647
OV2710
- ### 3.1 全域參數
```C
{
    "version": 1,
    "SC2336": {}
}
```
| 參數 | 類型 | 範圍 | 說明 |
| ---- | ---- | ---- | ---- |
| version	| 整數 | >1	| JSON 設定版本，僅在 JSON 設定參數變更時增加此變數 |
| SC2336 | 物件	| /	| 目標感測器名稱，例如 "SC2336"、"OV5647" 等 |
- ### 3.2 演算法參數
    - #### 3.2.1 自動白平衡 (Auto White Balance)
    ```C
    "SC2336":
    {
        "awb":
        {
            "model": 0,
            "min_counted": 2000,
            "min_red_gain_step": 0.034,
            "min_blue_gain_step": 0.034,
            "range":
            {
                "green":
                {
                    "max": 200,
                    "min": 180
                },
                "rg":
                {
                    "max": 1.2,
                    "min": 0.8
                },
                "bg":
                {
                    "max": 1.2,
                    "min": 0.8
                }
            },
            "green_luma_env": "awb_green_luma",
            "green_luma_init": 200,
            "green_luma_step_ratio": 0.3
        }
    }

    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | awb | 物件 | / | 自動白平衡配置參數 |
    | model | 整數或字串 | 0 / 1 / 2 或別名	| 0: 灰色世界 (預設)。1: 色溫索引。2: 區域分類器 (色度區域 + 可選的參考點掃描)。字串別名：gray_world, model_0, gw $\rightarrow$ 0; ct_index, model_1 $\rightarrow$ 1; zone, model_2, hybrid, ct2 $\rightarrow$ 2 |
    | min_counted | 整數 | >0 | 最小白點數：僅當白點數量大於或等於此值時，自動白平衡演算法才會運行 |
    | min_red_gain_step | 浮點數 | >0 | 最小紅色通道增益步進：僅當紅色通道增益步進大於或等於此值時，增益才會設定到 ISP 中 |
    | min_blue_gain_step | 浮點數 | >0 | 最小藍色通道增益步進：僅當藍色通道增益步進大於或等於此值時，增益才會設定到 ISP 中 |
    | range	| 物件 | / | AWB 統計參數 |
    | green | 物件 | / | AWB 綠色通道統計參數 |
    | max(green) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道最大亮度 |
    | min(green) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道最小亮度 |
    | rg | 物件 | / | AWB 紅色通道與綠色通道比例統計參數 |
    | max(rg) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 紅色通道與綠色通道最大比例 |
    | min(rg) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 紅色通道與綠色通道最小比例 |
    | bg | 物件	| /	| AWB 藍色通道與綠色通道比例統計參數 |
    | max(bg) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 藍色通道與綠色通道最大比例 |
    | min(bg) | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 藍色通道與綠色通道最小比例 |
    | green_luma_env | 字串 | /	| AWB 綠色通道亮度變數名稱 |
    | green_luma_init | 整數 | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道初始化亮度 |
    | green_luma_step_ratio	| 浮點數 | >0 | AWB 綠色通道最小亮度步進比例 |
- ### AWB 模式 2 (zone) — 將 model 設定為 2 或 "zone"。需要 zones (至少一個中性盒)。ref_points 列出每個色溫下校準的色度 (rg, bg)；演算法會旋轉活動參考點，累積全域 AWB 統計數據，並將估計值分類到 中性 區域 (uhct, hct, mct, lct, ulct)。green / skin 盒僅用於分類，不參與光源投票。可選的 export_ct: 當為 true 時，將估計的色溫 (Kelvin) 寫入管線變數 ct (供 ACC 使用)。使用 new_w / prev_w 對色度和導出的色溫進行時間平滑處理。
    ```C
    "awb":
    {
        "model": "zone",
        "min_counted": 1000,
        "min_red_gain_step": 0.5,
        "min_blue_gain_step": 0.5,
        "new_w": 1.0,
        "prev_w": 0.0,
        "export_ct": false,
        "zone_switch_count": 1,
        "type_counter_max": 500,
        "outlier_rg": 0.0,
        "outlier_bg": 0.0,
        "zone_hysteresis_ratio": 0.0,
        "zones":
        [
            {
                "type": "mct",
                "rg": { "min": 0.45, "max": 0.70 },
                "bg": { "min": 0.45, "max": 0.70 },
                "enabled": true
            }
        ],
        "ref_points":
        [
            { "ct": 5200, "rg": 0.55, "bg": 0.55, "radius": 0.35 }
        ]
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | zones | 陣列 | 模式 2 必須非空 | 每個項目：type (uhct, hct, mct, lct, ulct, green, skin)，rg.min/max, bg.min/max (R/G 和 B/G 的色度邊界)，enabled (可選，預設 true)。第一個匹配的已啟用中性區將勝出。 |
    | ref_points | 陣列 | 模式 2 需 $\ge 1$	| 每個項目：ct (Kelvin), rg, bg, radius (色度空間中的吸引力；0 禁用該點的吸附)。|
    | new_w | 浮點數 | $\ge 0$ | 平滑色度/色溫時，新幀的 IIR 權重。 |
    | prev_w | 浮點數 | $\ge 0$ | 前一幀的 IIR 權重；與 new_w 搭配，兩者皆為 0 則禁用該路徑的平滑處理。 |
    | export_ct | 布林值 | true 或 false | 若為 true，將估計的色溫發佈至 ct。 |
    | zone_switch_count | 整數 | $\ge 1$ | 在前進掃描索引前，每個參考點插槽的幀數 (使用 1 可最快循環)。 |
    | type_counter_max | 整數 | >0 | 每個區域命中計數器在衰減前的上限 (若省略，產生器預設為 20000)。 |
    | outlier_rg | 浮點數 | $\ge 0$ | 當 $|R/G − prev|$ 超過此值時拒絕子視窗；0 禁用。 |
    | outlier_bg | 浮點數 | $\ge 0$	| B/G 同上。 |
    | zone_hysteresis_ratio | 浮點數 | $\ge 0$ | 區域切換黏性；0 禁用。  
    - ### 3.2.2 自動色彩校正 (Auto Color Correction)
    ```C
    "SC2336":
    {
        "acc": {}
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | acc | 物件 | / | 自動色彩校正配置參數 |
    ```C
    "acc":
    {
        "saturation":
        [
            {
                "color_temp": 0,
                "value": 128
            }
            ...
        ],
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | saturation | 陣列 | / | 飽和度值與色溫映射表，採用最近鄰索引原則 |
    | color_temp | 整數 | >0 | 色溫值 |
    | value | 整數 | <div style="white-space: nowrap;">[0,255]</div> | 飽和度值 |
    ```C
    "acc":
    {
        "ccm": {}
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | ccm | 物件 | / | 色彩校正矩陣 (CCM) 配置參數 |
    ```C
    "ccm":
    {
        "model": 1,
        "min_ct_step": 500
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | model	 | 整數 | {0,1} | CCM 數據處理模型 |
    | min_ct_step | 整數 | >0 | 用於生成新 CCM 值的色溫最小步進值 |
    ```C
    "ccm":
    {
        "low_luma":
        {
            "luma_env": "ae.luma.avg",
            "threshold": 28,
            "matrix":
            [
                1.00,  0.00,  0.00,
                0.00,  1.00,  0.00,
                0.00,  0.00,  1.00
            ]
        },
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | low_luma | 物件 | / | 低亮度場景下的色彩校正矩陣配置參數 |
    | luma_env | 字串 | / | 亮度變數名稱 |
    | threshold | 浮點數 | >0 | 最小亮度：若 "luma_env" 值小於此值，則將低亮度 CCM 值設定到 ISP 中 |
    | matrix | 陣列 | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | 低亮度 CCM 值 |
    ```C
        "ccm":
    {
        "table":
        [
            {
                "color_temp": 2320,
                "matrix":
                [
                     2.0000, -0.1680, -0.8320,
                    -0.3716,  2.0000, -0.6284,
                    -0.7150, -0.2850,  2.0000
                ]
            },
            ...
        ]
    }
 
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | table | 陣列 | / | CCM 與色溫映射表，採用最近鄰索引原則 |
    | color_temp | 整數 | >0 | 色溫值 |
    | matrix | 陣列	| <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | CCM 值 |
    ```C
    "ccm":
    {
        "gain_lut":
        {
            "enable": true,
            "table":
            [
                { "gain": 1.0,  "strength": 1.0 },
                { "gain": 8.0,  "strength": 0.85 },
                { "gain": 16.0, "strength": 0.7 },
                { "gain": 32.0, "strength": 0.5 }
            ]
        }
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | gain_lut | 物件 | / | 可選的基於增益的 CCM 強度查找表 (LUT) |
    | enable | 布林值 | true 或 false | 若為 true，使用 LUT 中的 strength 將色溫選定的 CCM 與恆等矩陣混合 |
    | table | 陣列 | / | 增益與強度的映射表；strength 在項目之間進行線性插值 |
    | gain | 浮點數 | >0 | 相機感測器增益 (與 sensor->cur_gain 單位相同) |
    | strength | 浮點數 | [0,1]	| 在 (1-s)*I + s*ccm 中的混合權重 s；0 表示恆等，1 表示全 CCM |
    ```C
    "acc":
    {
        "lsc": {}
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | lsc | 物件 | / | 鏡頭陰影校正 (LSC) 配置參數 |
    ```C
    "lsc":
    {
        "model": 0,
        "img_w": 1920,
        "img_h": 1080,
        "lsc_tbl_size": 558,
        "table":
        [
            {
                "ct": 3350,
                "calibrations_r_tbl": [ 2.13310074, ... ],
                "calibrations_gr_tbl": [ 1.92501747, ... ],
                "calibrations_gb_tbl": [ 1.90096950, ... ],
                "calibrations_b_tbl": [ 1.67257392, ... ],
            },
            ...
        ]
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | model | 整數 | 0 | LSC 數據處理模型 |
    | img_w | 整數 | >0 | 影像解析度寬度 |
    | img_h | 整數 | >0 | 影像解析度高度 |
    | lsc_tbl_size | 整數 | >0 | LSC 數據陣列大小，不同解析度有不同值，例如 1920x1080 的 "lsc_tbl_size" 為 558
    | table	| 陣列	| /	| LSC 陣列數據與色溫映射表，採用最近鄰索引原則 |
    | ct | 整數	| >0 | 色溫值 |
    | calibrations_r_tbl | 浮點數陣列 | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 域中紅色通道的 LSC 數據陣列 |
    | calibrations_gr_tbl | 浮點數陣列 | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 域中紅綠 (RG) 通道的 LSC 數據陣列 |
    | calibrations_gb_tbl | 浮點數陣列 | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 域中藍綠 (BG) 通道的 LSC 數據陣列 |
    | calibrations_b_tbl | 浮點數陣列 | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 域中藍色通道的 LSC 數據陣列 |
    ```C
    "acc":
    {
        "blc": {}
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | blc | 物件 | / | 黑準位校正 (BLC) 配置參數 |
    ```C
    "lsc":
    {
        "model": 0,
        "stretch": true,
        "blc_table":
        [
            {
                "gain": 1,
                "blc_param": {
                    "blc_top_left": 16,
                    "blc_top_right": 16,
                    "blc_bottom_left": 16,
                    "blc_bottom_right": 16
                }
            },
            ...
        ]
    }
    ```
    | 參數 | 類型 | 範圍 | 說明 |
    | ---- | ---- | ---- | ---- |
    | model | 整數 | 0 | BLC 數據處理模型 |
    | stretch | 布林值 | true 或 false | RAW Bayer 影像每個通道的拉伸 (stretch) 配置 |
    | blc_table | 陣列 | / | BLC 參數與增益映射表，採用最近鄰索引原則 |
    | gain | 浮點數 | >0 | 感測器增益 |
    | blc_param | 物件 | / | BLC 參數 |
    | blc_top_left | 整數 | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像左上通道的黑準位閾值 |
    | blc_top_right | 整數 | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像右上通道的黑準位閾值 |
    | blc_bottom_left | 整數 | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像左下通道的黑準位閾值 |
    | blc_bottom_right | 整數 | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像右下通道的黑準位閾值 |
    - 3.2.3 自動去噪 (Auto Denoising)


