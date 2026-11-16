# ISP 用 Espressif 影像處理演算法

Espressif 影像處理演算法元件提供一系列影像處理演算法。[![元件登錄檔](https://components.espressif.com/components/espressif/esp_ipa/badge.svg)](https://components.espressif.com/components/espressif/esp_ipa)

## 1. 支援的演算法

| 演算法 | 說明 | 
|:-:|:-|
| 自動色彩校正 | 計算鏡頭陰影校正參數、色彩校正矩陣及飽和度 |
| 自動降噪 | 計算 Bayer 降噪參數及去馬賽克參數 |
| 壞點校正 | 根據感光元件增益計算 ISP 動態壞點校正參數 |
| 自動影像增強 | 計算 GAMMA 表、銳化參數及對比度 |
| 自動增益控制 | 計算曝光與增益 |
| 自動白平衡 | 計算紅色與藍色通道的增益 |
| 影像分析 | 計算影像色溫與亮度 |
| 自動感光元件 AE 目標控制 | 為感光元件本身支援 AEG/AGC 的情況新增 |

## 2. 管線全域變數

此模組可讓同一影像處理管線中的演算法模組共用變數，而不必使用區域快取，例如：

```
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

- 注意：`ipa_1`、`ipa_2` 和 `ipa_3` 必須位於同一個 IPA 管線中。

## 3. JSON 組態

JSON 參數的用法可參考 [esp_cam_sensor](https://github.com/espressif/esp-video-components/tree/master/esp_cam_sensor) 中的組態檔：

- [SC2336](https://github.com/espressif/esp-video-components/blob/master/esp_cam_sensor/sensors/gc2607/cfg/gc2607_default.json)
- [OV5647](https://github.com/espressif/esp-video-components/blob/master/esp_cam_sensor/sensors/ov5647/cfg/ov5647_default.json)
- [OV2710](https://github.com/espressif/esp-video-components/blob/master/esp_cam_sensor/sensors/ov2710/cfg/ov2710_default.json)

### 3.1 全域參數

---

```json
{
    "version": 1,
    "writable": false,
    "description": "0",
    "GC2607": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| version | Integer | >1 | JSON 組態版本；只有在 JSON 組態參數變更時才需要增加此值 |
| writable | Boolean | true/false | 設為 `true` 時，此 JSON 檔產生的 IPA 組態資料不含 `const`（可在執行階段寫入）；預設值／省略時為 `false`（含 `const`） |
| description | String | `[A-Za-z0-9_]+` | 每個檔案的組態識別字，會用於產生的 C 符號（`sensor_description_xxxx`），並存放於 `esp_ipa_config_t.description`。感光元件只出現在一個 JSON 檔時，預設值／省略值為 `"0"`。若同一感光元件出現在多個 JSON 檔中，這些檔案都必須設定 `description`，且同一感光元件的值必須唯一（不同感光元件可使用相同的 `description`）。列舉順序依照 JSON 輸入檔案清單 |
| GC2607 | Object | / | 目標感光元件名稱，例如「GC2607」、「OV5647」等 |

---

### 3.2 演算法參數

#### 3.2.1 自動白平衡

---

```json
"GC2607":
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| awb | Object | / | 自動白平衡組態參數 |
| model | Integer or String | `0` / `1` / `2` / `3` 或別名 | **`0`**：灰世界（預設）。**`1`**：色溫索引。**`2`**：區域分類器。**`3`**：固定色溫（CT，`fixed_ct.presets[]`）。字串別名：`gray_world`、`model_0`、`gw` → 0；`ct_index`、`model_1` → 1；`zone`、`model_2`、`hybrid`、`ct2` → 2；`fixed_ct`、`model_3` → 3 |
|  min_counted | Integer | >0 | 最少白點數：白點數大於或等於此值時，自動白平衡演算法才會執行 |
| min_red_gain_step | Float | >0 | 紅色通道最小增益步進：紅色通道增益步進大於或等於此值時，才會將增益寫入 ISP |
| min_blue_gain_step | Float | >0 | 藍色通道最小增益步進：藍色通道增益步進大於或等於此值時，才會將增益寫入 ISP |
| range | Object | / | AWB 統計參數 |
| green | Object | / | AWB 綠色通道統計參數 |
| max(green) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道亮度上限 |
| min(green) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道亮度下限 |
| rg | Object | / | AWB 紅色與綠色通道比值統計參數 |
| max(rg) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 紅色與綠色通道比值上限 |
| min(rg) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 紅色與綠色通道比值下限 |
| bg | Object | / | AWB 藍色與綠色通道比值統計參數 |
| max(bg) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 藍色與綠色通道比值上限 |
| min(bg) | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 藍色與綠色通道比值下限 |
| green_luma_env | String | / | AWB 綠色通道亮度變數名稱 |
| green_luma_init | Integer | <div style="white-space: nowrap;">(0,255)</div> | AWB 綠色通道初始亮度 |
| green_luma_step_ratio | Float | >0 | AWB 綠色通道最小亮度步進比例 |

**AWB 模型 2（區域）**——將 `model` 設為 `2` 或 `"zone"`。需要設定 **`zones`**（至少一個中性區域）。**`ref_points`** 列出各色溫的校準色度 `(rg, bg)`；演算法會輪替啟用的參考點、累積全域 AWB 統計資料，並將估計結果分類至**中性**區域（`uhct`、`hct`、`mct`、`lct`、`ulct`）。**`green`**／**`skin`** 區域僅用於分類，**不會**作為光源投票。可選的 **`export_ct`** 設為 `true` 時，會將估計色溫（Kelvin）寫入管線變數 **`ct`**（供 ACC 使用）。使用 **`new_w`**／**`prev_w`** 可對色度及匯出的色溫進行時間平滑。

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| zones | Array | 模型 2 時不可為空 | 每個項目包含：**`type`**（`uhct`、`hct`、`mct`、`lct`、`ulct`、`green`、`skin`）、**`rg`** 的 min/max、**`bg`** 的 min/max（**R/G** 與 **B/G** 色度界限），以及 **`enabled`**（選填，預設為 true）。第一個符合條件且已啟用的中性區域將勝出。 |
| ref_points | Array | 模型 2 時 ≥1 | 每個項目包含 **`ct`**（Kelvin）、**`rg`**、**`bg`**、**`radius`**（色度空間中的吸引半徑；`0` 會停用該點的吸附）。 |
| startup_zone | String | `uhct`, `hct`, `mct`, `lct`, `ulct` | 模型 2 的選用啟動區域。使用第一個符合的參考點設定初始增益與色溫，接著繼續自動 AWB。省略時，會維持一般白點掃描，不套用啟動預設值。 |
| startup_hold_frames | Integer | ≥ 0 | 在具有 AWB 統計資料的呼叫中，維持啟動 WBG 的影格數；需要設定 `startup_zone`。AWB 計算、統計掃描及色溫匯出仍會繼續。預設 `0`：不維持。 |
| new_w | Float | ≥ 0 | 平滑色度／色溫時，新影格的 IIR 權重。 |
| prev_w | Float | ≥ 0 | 前一影格的 IIR 權重；若 **`new_w`** 同時為 `0`，則停用該路徑的平滑。 |
| export_ct | Boolean | true or false | 設為 **true** 時，將估計色溫發布至 **`ct`**。 |
| zone_switch_count | Integer | ≥ 1 | 每個參考點時槽停留的影格數，達到後才前進掃描索引（設為 `1` 可最快輪替）。 |
| type_counter_max | Integer | >0 | 各區域命中計數器在衰減前的上限（省略時產生器預設為 20000）。 |
| outlier_rg | Float | ≥ 0 | 子視窗的 \|R/G − 前次值\| 超過此值時予以拒絕；`0` 表示停用。 |
| outlier_bg | Float | ≥ 0 | B/G 的設定方式相同。 |
| zone_hysteresis_ratio | Float | ≥ 0 | 區域切換的遲滯程度；`0` 表示停用。 |

**AWB 模型 2 的啟動白平衡**——可選擇將 `startup_zone` 設為 `uhct`、`hct`、`mct`、`lct` 或 `ulct`。此功能會使用所選啟用區域中的第一個有效參考點初始化增益與色溫，然後繼續執行自動 AWB。省略此參數可維持一般的啟動白點掃描。若找不到符合的參考點，會傳回 `ESP_ERR_INVALID_ARG`。啟動色溫會發布至 **`ct`**；後續色溫更新則需要 `export_ct: true`。

**AWB 模型 3（固定色溫）**——將 `model` 設為 `3` 或 `"fixed_ct"`。此模式不使用 AWB 統計資料，而是套用 `fixed_ct.presets[]` 中啟用的預設值（僅接受完全相符的色溫）。**`fixed_ct.default_ct`** 必須存在於 `presets[]` 中，並於初始化時選取。執行階段切換方式：呼叫 `esp_ipa_awb_set_fixed_ct(handle, <kelvin>)`，接著呼叫 `esp_ipa_pipeline_process()`。若色溫不在預設表中，會傳回 `ESP_ERR_INVALID_ARG`。KV **`ct`** 會發布給 ACC CCM/LSC/SAT 使用。

```json
"awb":
{
    "model": "fixed_ct",
    "min_red_gain_step": 0.05,
    "min_blue_gain_step": 0.05,
    "red_gain_scale": 1.0,
    "blue_gain_scale": 1.0,
    "fixed_ct":
    {
        "default_ct": 5000,
        "presets":
        [
            { "ct": 3000, "rg": 0.52, "bg": 0.58 },
            { "ct": 5000, "rg": 0.5602, "bg": 0.5390 },
            { "ct": 6500, "rg": 0.58, "bg": 0.52 }
        ]
    }
}
```

舊版單一預設值格式（仍受支援）：

```json
"fixed_ct": { "ct": 5000, "rg": 0.5602, "bg": 0.5390 }
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| fixed_ct | Object | 模型 3 必填 | **`esp_ipa_awb_fixed_cfg_t`**：**`default_ct`**（Kelvin，必須符合某個預設值），以及各自包含 **`ct`/`rg`/`bg`**（>0）的 **`presets[]`**。執行階段只能透過 **`esp_ipa_awb_set_fixed_ct()`** 設定色溫（必須完全相符）。舊格式 `{ ct, rg, bg }` 代表單一預設值。產生器仍接受已淘汰的 JSON 欄位 **`fixed`**。 |

---

#### 3.2.2 自動色彩校正

---

```json
"GC2607":
{
    "acc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| acc | Object | / | 自動色彩校正組態參數 |

---

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| saturation | Array | / | 飽和度與色溫對照表，採用最近鄰索引 |
| color_temp | Integer | >0 | 色溫值 |
| value | Integer | <div style="white-space: nowrap;">[0,255]</div> | 飽和度值 |

---

```json
"acc":
{
    "ccm": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| ccm | Object | / | 色彩校正矩陣組態參數 |

---

```json
"ccm":
{
    "model": 1,
    "min_ct_step": 500
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | {0,1} | CCM 資料處理模式 |
| min_ct_step | Integer | >0 | 產生新 CCM 值所需的最小色溫步進 |

---

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| low_luma | Object | / | 低亮度場景下的色彩校正矩陣組態參數 |
| luma_env | String | / | 亮度變數名稱 |
| threshold | Float | >0 | 最低亮度：當 `luma_env` 值低於此值時，將低亮度 CCM 值寫入 ISP |
| matrix | Array | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | 低亮度 CCM 值 |

---

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| table | Array | / | CCM 與色溫對照表，採用最近鄰索引 |
| color_temp | Integer | >0 | 色溫值 |
| matrix | Array | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | CCM 值 |

---

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| gain_lut | Object | / | 選填的增益式 CCM 強度查找表 |
| enable | Bool | true or false | 設為 true 時，使用查找表中的 `strength` 將依色溫選取的 CCM 與單位矩陣混合 |
| table | Array | / | 增益與強度對照表；`strength` 會在項目之間線性插值 |
| gain | Float | >0 | 相機感光元件增益（單位與 `sensor->cur_gain` 相同） |
| strength | Float | [0,1] | `(1-s)*I + s*ccm` 中的混合權重 `s`；0 表示單位矩陣，1 表示完整 CCM |

---

```json
"acc":
{
    "lsc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| lsc | Object | / | 鏡頭陰影校正（LSC）組態參數 |

---

```json
"lsc":
{
    "model": 0,
    "img_w": 1920,
    "img_h": 1080,
    "lsc_tbl_size": 558,
    "table":
    [
        {
            "gain": 1.0,
            "table":
            [
                {
                    "ct": 3350,
                    "calibrations_r_tbl": [ 2.13310074, ... ],
                    "calibrations_gr_tbl": [ 1.92501747, ... ],
                    "calibrations_gb_tbl": [ 1.90096950, ... ],
                    "calibrations_b_tbl": [ 1.67257392, ... ]
                },
                ...
            ]
        },
        {
            "gain": 8.0,
            "scale": 0.8
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | 0 | LSC 資料處理模式 |
| img_w | Integer | >0 | 影像解析度寬度 |
| img_h | Integer | >0 | 影像解析度高度 |
| lsc_tbl_size | Integer | >0 | LSC 資料陣列大小；不同影像解析度會有不同值，例如 1920x1080 解析度的 `lsc_tbl_size` 為 558 |
| table | Array | / | LSC 對照表。建議使用兩層最近鄰索引（感光元件增益 → 色溫）。仍接受舊版僅含色溫的平面表 `[{ct, ...}]`，並會將其對應至 `lsc_gain_table`。選取的項目會直接使用（執行階段不會產生 LSC） |
| gain | Float | >0 | 外層索引節點的相機感光元件增益（舊版平面色溫表中為選填） |
| scale | Float | >=0 | 選填。若增益節點沒有巢狀 `table`，會在產生組態時將基礎 LSC 陣列朝 1.0 混合：`out = 1 + (base - 1) * scale`（以 `round(out * 256)` 儲存）。`scale=1` 會複製基礎表；`scale=0` 會產生全為 1.0 的表。可選擇以 `base_gain` 指定來源節點；否則使用唯一的基礎表節點（或增益較低且最接近的基礎節點） |
| base_gain | Float | >0 | 選填。存在多個完整 `table` 節點時，指定 `scale` 使用的來源增益節點 |
| ct | Integer | >0 | 內層索引節點（或舊版平面表的頂層節點）的色溫值 |
| calibrations_r_tbl | Array[Float] | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 欄位中紅色通道的 LSC 資料陣列 |
| calibrations_gr_tbl | Array[Float] | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 欄位中紅綠（RG）通道的 LSC 資料陣列 |
| calibrations_gb_tbl | Array[Float] | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 欄位中藍綠（BG）通道的 LSC 資料陣列 |
| calibrations_b_tbl | Array[Float] | <div style="white-space: nowrap;">ESP32-P4: (-4,4)</div> | RAW 欄位中藍色通道的 LSC 資料陣列 |

---

```json
"acc":
{
    "blc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| blc | Object | / | 黑階校正（BLC）組態參數 |

---

```json
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

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | 0 | BLC 資料處理模式 |
| stretch | Bool | true or false | RAW Bayer 影像各通道的延展組態 |
| blc_table | Array | / | BLC 參數與增益對照表，採用最近鄰索引 |
| gain | Float | >0 | 感光元件增益 |
| blc_param | Object | / | BLC 參數 |
| blc_top_left | Integer | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像左上通道的黑階閾值 |
| blc_top_right | Integer | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像右上通道的黑階閾值 |
| blc_bottom_left | Integer | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像左下通道的黑階閾值 |
| blc_bottom_right | Integer | <div style="white-space: nowrap;">ESP32-P4: (0,255)</div> | RAW Bayer 影像右下通道的黑階閾值 |

---

#### 3.2.3 自動降噪

---

```json
"GC2607":
{
    "adn": {}
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| adn | Array | / | 自動降噪組態參數 |

---

```json
"adn":
{
    "bf":
    [
        {
            "gain": 1,
            "param":
            {
                "level": 3,
                "matrix":
                [
                    1, 3, 1,
                    3, 5, 3,
                    1, 3, 1
                ],
                "sigma": 1
            }
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| bf | Array | / | Bayer 濾波器參數與感光元件增益對照表，採用最近鄰索引 |
| gain | Float | >0 | 感光元件增益 |
| param | Object | / | Bayer 濾波器參數 |
| level | Integer | <div style="white-space: nowrap;">ESP32-P4: [2,20]</div> | Bayer 濾波器 sigma |
| matrix | Integer | ESP32-P4: [0,15] | Bayer 濾波器矩陣 |
| sigma | Float | >0 | 用來產生高斯矩陣的 sigma 參數 |

* 注意：Bayer 濾波器是雙邊濾波器；`level` 是範圍核心參數，`matrix` 是空間核心參數。
* 注意：若有設定矩陣，JSON 工具會優先使用矩陣；否則使用 sigma。

---

```json
"adn":
{
    "demosaic":
    [
        {
            "gain": 1,
            "gradient_ratio": 1.0
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| demosaic | Array | / | 去馬賽克參數與感光元件增益對照表，採用最近鄰索引 |
| gain | Float | >0 | 感光元件增益 |
| gradient_ratio | Float | <div style="white-space: nowrap;">ESP32-P4: (0,4)</div> | 去馬賽克梯度比例參數 |

---

#### 3.2.4 壞點校正

---

```json
"GC2607":
{
    "dpc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| dpc | Object | / | 壞點校正組態參數 |

---

```json
"dpc":
{
    "model": 0,
    "debounce_gain": 0.1,
    "table":
    [
        {
            "gain": 1.0,
            "param":
            {
                "method": 1,
                "high_threshold": 8,
                "low_threshold": 8
            }
        },
        {
            "gain": 4.0,
            "param":
            {
                "method": 2,
                "first_stage_upper_ratio": 1.0,
                "first_stage_lower_ratio": 0.5,
                "bright_deviation_factor": 0.5,
                "dark_deviation_factor": 0.5
            }
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | {0,1} | DPC 增益對應模式：`0` 選取最近的增益節點（可選擇啟用防抖）；`1` 在相鄰增益節點之間線性插值參數 |
| debounce_gain | Float | ≥0 | 模型 0 的切換防抖閾值，單位為感光元件增益；`0` 表示停用防抖。只有候選節點比目前節點接近超過此值時，才會接受切換 |
| table | Array | ≥1 個項目 | DPC 動態參數與感光元件增益對照表 |
| gain | Float | >0 | 感光元件增益 |
| param | Object | / | 此增益節點的 ISP 動態 DPC 參數 |
| method | Integer | {1,2} | 此節點選用的動態校正方法；不同節點可混用方法 1 和方法 2 |
| high_threshold | Integer | [0,255] | 方法 1：像素值高於 `max8 + high_threshold` 時，視為亮壞點候選 |
| low_threshold | Integer | [0,255] | 方法 1：像素值低於 `min8 - low_threshold` 時，視為暗壞點候選 |
| first_stage_upper_ratio | Float | [0,1] | 方法 2：第一階段正常像素範圍上限；必須大於 `first_stage_lower_ratio` |
| first_stage_lower_ratio | Float | [0,1] | 方法 2：第一階段正常像素範圍下限 |
| bright_deviation_factor | Float | [0,1] | 方法 2：第二階段亮像素靈敏度；值越小，對亮像素的校正越積極 |
| dark_deviation_factor | Float | [0,1] | 方法 2：第二階段暗像素靈敏度；值越小，對暗像素的校正越積極 |

* 注意：模型 0 與 ADN 一樣採用最近鄰索引。模型 1 會在使用相同 `method` 的兩個節點之間連續插值；若相鄰節點使用不同方法，則退回選取較近的節點。
* 注意：方法 1／方法 2 的參數會儲存在 `esp_ipa_dpc_t` 中。方法 2 的比例與偏差因子維持為 [0, 1] 範圍內的浮點數。
* 注意：`model` 也接受別名 `"nearest"`／`"linear"`，`method` 也接受別名 `"method_1"`／`"method_2"`。

---

#### 3.2.5 自動影像增強

---

```json
"GC2607":
{
    "aen": {}
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| aen | Object | / | 自動影像增強組態參數 |

---

```json
"aen":
{
    "gamma":
    {
        "model": 0,
        "use_gamma_param": true,
        "luma_env": "ae.luma.avg",
        "luma_min_step": 16.0,
        "backlight": {}
    },
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| model | Integer | {0,1} | GAMMA 資料處理模式 |
| gamma | Object | / | GAMMA 組態參數物件 |
| use_gamma_param | bool | true/false | true：使用提供的 gamma 參數產生 gamma Y 表；false：使用提供的 gamma Y 表 |
| luma_env | String | / | 亮度變數名稱 |
| luma_min_step | Float | >0 | 最小亮度步進：當 `luma_env` 的步進值大於此值時，才會將新的 GAMMA 表值寫入 ISP |
| backlight | Object | / | 選填的背光增強組態；啟用時會依背光程度選取專用 GAMMA 表 |

---

```json
"gamma":
{
    "table":
    [
        {
            {
                "luma": 31.1,
                "gamma_param": 0.51,
                "y":
                [
                    0, 64, 91, 112, 130, 146, 160, 173, 185, 197, 207, 218, 228, 237, 246, 255
                ]
            },
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| table | Array | / | GAMMA 與亮度對照表，採用線性插值 |
| luma | Float | >0 | 亮度索引值 |
| gamma_param | Float | >0 | 產生 GAMMA Y 陣列的參數 |
| y | <div style="white-space: nowrap;">Array[Integer]</div> | <div style="white-space: nowrap;">ESP32-P4: [0,255]</div> | GAMMA Y 陣列 |

---

```json
"gamma":
{
    "backlight":
    {
        "low_hist_ratio_threshold": 0.2,
        "high_hist_ratio_threshold": 0.15,
        "env_luma_threshold": 5.0,
        "low_index":
        {
            "start": 0,
            "end": 4
        },
        "high_index":
        {
            "start": 14,
            "end": 15
        },
        "luma_env": "env.luma.avg",
        "detect_count_threshold": 3,
        "detect_count_margin": 3,
        "hist_ratio_filter": 0.3,
        "model": 0,
        "luma_min_step": 0.05,
        "table":
        [
            {
                "luma": 0.35,
                "gamma_param": 0.45
            },
            {
                "luma": 0.55,
                "gamma_param": 0.40
            }
        ]
    }
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| backlight | Object | / | 背光增強：依直方圖低／高比例與環境亮度進行偵測，再依程度選取專用 GAMMA 表 |
| low_hist_ratio_threshold | Float | [0, 1] | 直方圖低區段比例閾值；`low > low_hist_ratio_threshold` 時啟用 |
| high_hist_ratio_threshold | Float | [0, 1] | 直方圖高區段比例閾值；`high > high_hist_ratio_threshold` 時啟用 |
| env_luma_threshold | Float | ≥ 0 | 環境亮度閾值；環境亮度 > `env_luma_threshold` 時啟用 |
| low_index | Object | / | 低比例的直方圖索引範圍；預設為 `{start: 0, end: 4}` |
| high_index | Object | / | 高比例的直方圖索引範圍；預設為 `{start: 14, end: 15}` |
| start / end | Integer | [0, 15] | 直方圖區段索引（包含起點和終點） |
| luma_env | String | / | 用於閾值檢查的環境亮度變數名稱 |
| detect_count_threshold | Integer | ≥ 0 | 防止抖動：連續偵測計數 > `detect_count_threshold` 時才啟用背光 |
| detect_count_margin | Integer | ≥ 0 | 選填。高於 `detect_count_threshold` 的額外計數；偵測計數上限為 `detect_count_threshold + detect_count_margin`。省略時等於 `detect_count_threshold` |
| hist_ratio_filter | Float | [0, 1] | 低／高直方圖比例的 IIR 濾波係數 |
| model | Integer | {0,1} | 背光模式使用的 GAMMA 處理模式；預設為 `0` |
| luma_min_step | Float | >0 | 更新 GAMMA 所需的最小背光程度步進；預設為 `0.05` |
| table | Array | / | 以程度（`luma` 或別名 `degree`）為索引的背光 GAMMA 查找表 |

* 注意：`low = sum(hist[low_index]) / sum(hist)`、`high = sum(hist[high_index]) / sum(hist)`，程度 = `low + high`。
* 注意：背光功能啟用時，會以 `backlight.table` 取代一般的 `gamma.table` 路徑。

---

```json
"aen"
{
    "sharpen":
    [
        {
            "gain": 1,
            "param":
            {
                "h_thresh": 16,
                "l_thresh": 3,
                "h_coeff": 2.65,
                "m_coeff": 2.95,
                "matrix":
                [
                    1, 2, 1,
                    2, 2, 2,
                    1, 2, 1
                ]
            }
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| sharpen | Array | / | 銳化參數與感光元件增益對照表，採用最近鄰索引 |
| gain | Float | >0 | 感光元件增益 |
| param | Object | / | 銳化參數 |
| h_thresh | Integer | <div style="white-space: nowrap;">ESP32-P4: [0,255]</div> | 銳化高閾值；濾波後像素值高於此閾值時，會乘上 `h_coeff` |
| l_thresh | Integer | ESP32-P4: [0,255] | 銳化低閾值；濾波後像素值高於此閾值但低於 `h_thresh` 時，會乘上 `m_coeff`；低於此閾值時則設為 0 |
| h_coeff | Float | ESP32-P4: (0,8) | 高頻像素銳化係數 |
| m_coeff | Float | ESP32-P4: (0,8) | 中頻像素銳化係數 |
| matrix | <div style="white-space: nowrap;">Array [Integer]</div> | ESP32-P4: [0,31] | 3x3 低通濾波器矩陣資料 |

---

```json
"aen":
{
    "contrast":
    [
        {
            "gain": 1,
            "value": 130
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| contrast | Array | / | 對比度與感光元件增益對照表，採用最近鄰索引 |
| gain | Float | >0 | 感光元件增益 |
| value | Integer | <div style="white-space: nowrap;">ESP32-P4: [0,255]</div> | 對比度值 |

---

#### 3.2.6 自動增益控制

---

```json
"GC2607":
{
    "agc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| agc | Object | / | 自動增益／曝光控制組態參數 |

---

```json
"agc":
{
    "exposure":
    {
        "frame_delay": 2,
        "adjust_delay": 0
    }
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| exposure | Object | / | 曝光控制組態參數物件 |
| frame_delay | Integer | >0 | 曝光參數生效前的延遲影格數，此值來自感光元件硬體資訊 |
| adjust_delay | Integer | >0 | 計算並設定新曝光參數前的延遲影格數；值越大，亮度變化越慢 |
| fixed_exposure_time | Integer | >0 | 固定曝光時間，單位為微秒。`gain_only` 為 `true` 時必填；否則忽略 |

---

```json
"agc":
{
    "gain_only": true,
    "exposure":
    {
        "frame_delay": 2,
        "adjust_delay": 0,
        "fixed_exposure_time": 20000
    }
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| gain_only | Bool | true or false | 選填。`true`：初始化後 AGC 僅調整增益，並將曝光維持在 `exposure.fixed_exposure_time`；`false` 或省略：照常同時調整曝光與增益 |

* 注意：`gain_only` 為 `true` 時，必須設定 `exposure.fixed_exposure_time`，且其值必須在感光元件的曝光範圍內。
* 注意：若目前感光元件曝光值不同，初始化時仍可能將曝光設定為 `exposure.fixed_exposure_time` 一次。

---

```json
"agc":
{
    "gain":
    {
        "min_step": 0.0001,
        "frame_delay": 2,
        "max": 8.0
    }
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| gain | Object | / | 增益控制組態參數物件 |
| frame_delay | Integer | >0 | 增益參數生效前的延遲影格數，此值來自感光元件硬體資訊 |
| min_step | Float | >0 | 最小增益步進：增益步進大於或等於此值時，才會將增益設定至感光元件 |
| max | Float | ≥ 0 | 選填。**> 0** 時，將 AGC 要求的類比增益限制在此值（套用於感光元件本身的 `min_gain`／`max_gain` 限制之後）。**0** 或省略：不額外限制感光元件能力 |

---

```json
"agc":
{
    "anti_flicker":
    {
        "mode": "full",
        "ac_freq": 50
    },
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| anti_flicker | Object | / | 防閃爍控制組態參數物件 |
| mode | String enumeration | "full"<hr>"part"<hr>"none" | `"full"`：強制使用防閃爍曝光組態。<hr>`"part"`：若可透過增益調整影像亮度，則強制使用防閃爍曝光組態；否則變更曝光並忽略防閃爍。<hr>`"none"`：調整曝光與增益時完全忽略防閃爍 |
| ac_freq | Integer | >0 | 照明電源的交流頻率，一般為 50Hz 或 60Hz |

---

```json
"agc":
{
    "f_n0": 0.32,
    "f_m0": 0.32
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| f_n0 | Float | (0,1) | 控制增益或曝光增加速度的參數；值越大，增加速度越快 |
| f_m0 | Float | (0,1) | 控制增益或曝光減少速度的參數；值越大，減少速度越快 |

---

```json
"agc":
{
    "luma_adjust":
    {
        "target_low": 105,
        "target_high": 121,
        "target": 113,
        "low_threshold": 10,
        "low_regions": 5,
        "high_threshold": 240,
        "high_regions": 3,
        "weight":
        [
            1, 1, 2, 1, 1,
            1, 2, 3, 2, 1,
            1, 3, 5, 3, 1,
            1, 2, 3, 2, 1,
            1, 1, 2, 1, 1
        ]
    }
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| luma_adjust | Object | / | 影像亮度控制組態參數 |
| target_low | Integer | (0,target) | 保持區間下限：亮度位於 [target_low, target_high] 內（會依 PWL／測光目標位移）時，AGC 不會變更曝光或增益 |
| target_high | Integer | (target,255) | 保持區間上限：與 `target_low` 相同；亮度超出此區間時，會朝目標值調整 |
| target | Integer | [3,252] | 亮度超出保持區間時使用的影像亮度目標 |
| low_threshold | Integer | [3,252] | 影像亮度取樣資料下限閾值：取樣亮度低於此值時，低閾值計數器加 1 |
| high_threshold | Integer | [3,252] | 影像亮度取樣資料上限閾值：取樣亮度高於此值時，高閾值計數器加 1 |
| low_regions | Integer | <div style="white-space: nowrap;">ESP32-P4:(0,25)</div> | 低閾值區域數：若低閾值計數器小於此值，則捨棄所有低於 `low_threshold` 的取樣資料 |
| high_regions | Integer | ESP32-P4:(0,25) | 高閾值區域數：若高閾值計數器小於此值，則捨棄所有高於 `high_threshold` 的取樣資料 |
| weight | <div style="white-space: nowrap;">Array[Integer]</div> | [0,255] | 影像亮度取樣權重 |

---

```json
"agc":
{
    "mode": "high_light_priority",
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| mode | String enumeration |"high_light_priority"<hr>"low_light_priority"<hr>"light_threshold_priority" | 測光權重計算模式 |

---

```json
"agc":
{
    "high_light_priority":
    {
        "use_env_luma": true,
        "env_luma_low_threshold": 150.5,
        "env_luma_high_threshold": 250.5,
        "low_threshold": 141,
        "high_threshold": 204,
        "weight_offset": 5,
        "luma_offset": -3
    }
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| high_light_priority | Object | / | 高亮優先組態 |
| use_env_luma | Bool | true or false | 若為 true，使用 `env_luma_low_threshold` 和 `env_luma_high_threshold`；若為 false，使用 `low_threshold` 和 `high_threshold` |
| env_luma_high_threshold | Float | > 0 | 環境亮度上限閾值：環境亮度小於或等於此值時，資料權重與總權重會增加 `weight_offset` |
| env_luma_low_threshold | Float | > 0 | 環境亮度下限閾值：環境亮度大於或等於此值時，資料權重與總權重會增加 `weight_offset` |
| low_threshold | Integer | <div style="white-space: nowrap;">[3,252]</div> | 影像亮度取樣資料下限閾值：某個取樣亮度高於此值時，該資料權重與總權重會增加 `weight_offset` |
| high_threshold | Integer | [3,252] | 影像亮度取樣資料上限閾值：某個取樣亮度低於此值時，該資料權重與總權重會增加 `weight_offset` |
| weight_offset | Integer | [0,255] | 影像亮度取樣資料權重的增加值 |
| luma_offset | Integer | [-127,127] | 某個取樣值介於 `low_threshold` 和 `high_threshold` 之間時，影像亮度目標的增加值 |

* 注意：`mode` 為 `"high_light_priority"` 時，會套用此組態。
* 注意：`use_env_luma` 為 true 時，會使用環境亮度，而非統計資料。

---

```json
"agc":
{
    "low_light_priority":
    {
        "use_env_luma": true,
        "env_luma_high_threshold": 250.5,
        "env_luma_low_threshold": 150.5,
        "low_threshold": 65,
        "high_threshold": 104,
        "weight_offset": 5,
        "luma_offset": 1
    }
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| low_light_priority | Object | / | 低亮優先組態 |
| use_env_luma | Bool | true or false | 若為 true，使用 `env_luma_low_threshold` 和 `env_luma_high_threshold`；若為 false，使用 `low_threshold` 和 `high_threshold` |
| env_luma_high_threshold | Float | > 0 | 環境亮度上限閾值：環境亮度小於或等於此值時，資料權重與總權重會增加 `weight_offset` |
| env_luma_low_threshold | Float | > 0 | 環境亮度下限閾值：環境亮度大於或等於此值時，資料權重與總權重會增加 `weight_offset` |
| low_threshold | Integer | <div style="white-space: nowrap;">[3,252]</div> | 影像亮度取樣資料下限閾值：某個取樣亮度高於此值時，該資料權重與總權重會增加 `weight_offset` |
| high_threshold | Integer | [3,252] | 影像亮度取樣資料上限閾值：某個取樣亮度低於此值時，該資料權重與總權重會增加 `weight_offset` |
| weight_offset | Integer | [0,255] | 影像亮度取樣資料權重的增加值 |
| luma_offset | Integer | [-127,127] | 某個取樣值介於 `low_threshold` 和 `high_threshold` 之間時，影像亮度目標的增加值 |

* 注意：`mode` 為 `"low_light_priority"` 時，會套用此組態。
* 注意：`use_env_luma` 為 true 時，會使用環境亮度，而非統計資料。

---

```json
"agc":
{
    "light_threshold_priority_use_env_luma": true,
    "light_threshold_priority":
    [
        {
            "env_luma_threshold": 30.5,
            "luma_threshold": 20,
            "weight_offset": 1
        },
        ...
    ]
}
```

| 參數 | 型別 | 範圍 | 說明 | 
|:-:|:-:|:-:|:-|
| light_threshold_priority_use_env_luma | Bool | true or false | 若為 true，使用 `env_luma_threshold`；若為 false，使用 `luma_threshold` |
| light_threshold_priority | Object | / | 環境亮度閾值優先組態 |
| env_luma_threshold | Float | > 0 | 環境亮度閾值。環境亮度低於此閾值時，資料權重與總權重會增加 `weight_offset` |
| luma_threshold | Integer | <div style="white-space: nowrap;">[0,255]</div> | 亮度閾值；某個取樣值大於此值且小於下一個閾值時，該資料權重與總權重會增加 `weight_offset` |
| weight_offset | Integer | [0,255] | 影像亮度取樣資料權重的增加值 |

* 注意：`mode` 為 `"light_threshold_priority"` 時，會套用此組態。
* 注意：`use_env_luma` 為 true 時，會使用環境亮度，而非統計資料。

---

```json
"agc":
{
    "luma_pwl":
    {
        "enable": true,
        "table":
        [
            { "env_luma": 500,   "luma_shift": -15  },
            { "env_luma": 2000,  "luma_shift": -5   },
            { "env_luma": 5000,  "luma_shift": 0   },
            { "env_luma": 12000, "luma_shift": -10 }
        ]
    }
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| luma_pwl | Object | / | 環境亮度 → 目標亮度位移的 PWL（分段線性）組態 |
| enable | Bool | true or false | `true`：每個影格讀取 `env.luma.avg`，並從表中插值得到 `luma_shift`；`false`：停用此功能，`luma_target` 不變 |
| table | Array | ≥2 個項目 | 將 `env_luma` 對應至 `luma_shift` 的排序斷點清單；中間值採線性插值，超出範圍時限制為第一個或最後一個項目 |
| env_luma | Float | >0 | 環境亮度斷點，對應管線變數 `env.luma.avg` |
| luma_shift | Integer | [-128, 127] | 環境亮度符合此斷點時套用的目標亮度位移；正值會提高目標亮度，負值會降低目標亮度 |

* 注意：`luma_pwl` 必須依 `env_luma` 遞增排序。
* 注意：有效的 `luma_target` = 組態中的 `target` + 插值得到的 `luma_shift`。
* 注意：`target_low`／`target_high` 保持區間會以相同幅度位移，因此亮度已接近 PWL 目標時，AGC 不會再調整。

---

#### 3.2.7 自動感光元件 AE 目標控制

---

```json
"OV2710":
{
    "atc": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| atc | Object | / | 自動感光元件 AE 目標控制組態參數 |

---

```json
"atc":
{
    "model": 0,
    "init_value": 48,
    "delay_frames": 5,
    "luma_env": "env.luma.avg",
    "min_ae_value_step": 5,
    "luma_lut":
    [
        {
            "luma": 100,
            "ae_value": 75
        },
        {
            "luma": 200,
            "ae_value": 100
        },
        {
            "luma": 300,
            "ae_value": 150
        }
    ]
}
```
| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | {0} | ATC 資料處理模式 |
| init_value | Integer | >0 | 自動感光元件 AE 目標控制初始值 |
| delay_frames | Integer | >0 | AE 目標等級變更之間的影格數 |
| luma_env | String | / | 亮度變數名稱 |
| min_step | Integer | >0 | AE 目標等級最小步進：AE 目標等級步進大於或等於此值時，才會將 AE 目標等級設定至感光元件 |
| luma_lut | Array | / | 亮度值與 AE 目標等級對照表，採用線性插值 |
| luma | Integer | >0 | 亮度閾值 |
| ae_value | Integer | >0 | AE 目標等級值 |
---

#### 3.2.8 自動對焦控制

---

```json
"OV5647":
{
    "af": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| af | Object | / | 自動對焦控制組態參數 |

---

```json
"af":
{
    "model": 0,
    "windows":
 [
 {
            "left": 680,
            "top": 300,
            "width": 390,
            "height": 410
 }
 ],
    "edge_thresh": 32,
    "definition_high_threshold_ratio": 1.3,
    "definition_low_threshold_ratio": 0.7,
    "luminance_high_threshold_ratio": 1.1,
    "luminance_low_threshold_ratio": 0.9,
    "max_change_time": 2000000,
    "l1_scan_points_num": 10,
    "l2_scan_points_num": 10,
    "max_pos": 500
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| model | Integer | 0 | AF 資料處理模式 |
| windows | Array | / | AF 統計視窗區域；ESP32-P4 支援 3 個視窗 |
| left | Integer | / | 視窗左側座標 |
| top | Integer | / | 視窗頂部座標 |
| width | Integer | / | 視窗寬度 |
| height | Integer | / | 視窗高度 |
| edge_thresh | Integer | / | AF 統計閾值；低於此值的資料會被捨棄 |
| definition_high_threshold_ratio | Float | >1.0 | 當（目前清晰度統計值）／（上次對焦清晰度）的比值大於此值時，會觸發新的 AF 流程 |
| definition_low_threshold_ratio | Float | <1.0 | 當（目前清晰度統計值）／（上次對焦清晰度）的比值小於此值時，會觸發新的 AF 流程 |
| luminance_high_threshold_ratio | Float | >1.0 | 當（目前亮度統計值）／（上次對焦亮度）的比值大於此值時，會觸發新的 AF 流程 |
| luminance_low_threshold_ratio | Float | <1.0 | 當（目前亮度統計值）／（上次對焦亮度）的比值小於此值時，會觸發新的 AF 流程 |
| max_change_time | Integer | >0 | AF 統計的清晰度或亮度持續超出閾值的時間，單位為微秒 |
| l1_scan_points_num | Integer | >0 | 第一級掃描點數 |
| l2_scan_points_num | Integer | >0 | 第二級掃描點數 |
| max_pos | Integer | >0 | 最大對焦位置；較小的值可縮短掃描時間，但也會縮短對焦距離 |

---

#### 3.2.9 擴充控制

---

```json
"OV5647":
{
    "ext": {}
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| ext | Object | / | 擴充控制組態參數 |

---

```json
"ext":
{
    "hue": 0,
    "brightness": 0,
    "stats_region":
    {
        "left": 100,
        "top": 100,
        "width": 400,
        "height": 400
    }
}
```

| 參數 | 型別 | 範圍 | 說明 |
|:-:|:-:|:-:|:-|
| hue | Integer | [0,360] | ISP 色相（HUE） |
| brightness | Integer | [-128,127] | ISP 色彩亮度 |
| stats_region | Object | / | ISP 統計區域 |
| left | Integer | / | 視窗左側座標 |
| top | Integer | / | 視窗頂部座標 |
| width | Integer | / | 視窗寬度 |
| height | Integer | / | 視窗高度 |
