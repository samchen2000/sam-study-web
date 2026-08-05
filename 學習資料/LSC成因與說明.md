#  LSC（鏡頭陰影校正）
## 影像調整中 LSC (Lens Shading Correction) 的原因與校正指南在影像訊號處理（ISP）中，鏡頭陰影校正（LSC, Lens Shading Correction）是提升影像品質非常關鍵的一步。如果沒有經過 LSC 校正，拍出來的照片就會出現「中心亮、四周暗」（暗角）或是「中心與四周顏色不一致」（色偏）的問題。
## 一、 鏡頭陰影（Lens Shading）產生的原因鏡頭陰影主要可以分為兩大類：
### 亮度陰影（Lens Shading）與色彩陰影（Color Shading）。
### 1. 亮度陰影（Luma Shading / Vignetting）光學暗角（Cos4th Law）：
這是物理上不可避免的現象。根據光學理論，到達感光元件（Sensor）表面的光線強度，與光線入射角 θ 的餘弦四次方
**$cos^4 \theta$** 成正比。  
影像中心入射角為 $\theta$，而四周入射角大，導致邊緣進光量大幅衰減，形成中心亮、四周暗的暗角。   
機械暗角：鏡頭內部的鏡筒、光圈葉片或濾鏡邊緣阻擋了部分斜向入射的光線，使得邊緣感光元件接收到的光量減少。
### 2. 色彩陰影（Color Shading）CRA（Chief Ray Angle）主光線角不匹配：
感光元件微透鏡（Micro-lens）的設計有其接收光線的最大角度（CRA）。如果鏡頭出射的 CRA 與 Sensor 的 CRA 不匹配，斜向入射到邊緣的光線就會產生折射偏差，導致光線漏到隔壁的像素（Crosstalk，串擾）。波長與折射率差異：RGB 三原色的波長不同，在鏡頭邊緣折射與穿透微透鏡的效率也不同。這會導致邊緣的 RGB 衰減比例不一致，使照片不只變暗，四周還會泛綠、泛紅或泛紫（即色偏）。
## 二、 鏡頭陰影的校正方式（LSC 演算法與調整步驟）
LSC 的核心原理是：透過演算法對影像的四周進行「補償加權（Gain）」，將邊緣的亮度與顏色拉高，使其與中心區域一致。
### 1. 校正環境與測試圖卡（Setup）在進行硬體校正（Calibration）前，必須準備標準環境：
- 燈箱：使用均勻度極高（通常要求 >95% 或 98%）的均勻光源燈箱（如 D65, A 光源, TL84）。
- 圖卡：使用一張沒有任何圖案的純白卡（White Card）或純灰卡（Gray Card）填滿整個鏡頭畫面。
### 2. 獲取校正資料（Calibration Process）
 1. 拍攝 Raw 圖：在均勻燈箱下，拍攝未經過任何處理的 Raw 影像。
 2. 網格化（Mesh Grid）處理：ISP 硬體為了節省記憶體，不會對每個像素單獨存一個補償值。通常會將影像劃分為網格（例如 16 × 16, 32 × 32 或 64 × 64）。
 3. 計算中心點：尋找影像中亮度最高的點，通常作為光學中心點（Optical Center）。
 4. 計算各節點增益（Gain）：
    - 計算網格中各個節點的 R, Gr, Gb, B 四個通道的平均亮度。
    - 增益公式：$$\text{Gain}=\frac{\text{中心點亮度}}{\text{當前節點亮度}}$$
    - 中心點的 Gain 為 1.0，越往四周邊緣，Gain 值越大（例如 1.5, 2.0 甚至更高）。
### 3. 補償曲線與數學模型得到網格的 Gain 值後，ISP晶片內部通常會用以下兩種方式來套用校正：
- Mesh LSC（網格校正）：直接將各節點的 Gain 數值做成一個查詢表（LUT）。當影像通過時，利用雙線性插值（Bilinear Interpolation）計算出網格中每個像素點的精確 Gain 值並乘上去。這是目前手機與高階相機最主流、效果最好的做法，因為它可以校正非對稱性的陰影。
- Polynomial LSC（多項式校正）：使用數學函數（如四階或六階的圓對稱多項式 f(r) = 1 + ar² + br⁴ + cr⁶， r 為距中心的距離）來擬合曲線。這種方式佔用記憶體極小，但無法完美校正非對稱的陰影（例如鏡頭組裝偏心導致的陰影偏移）。
## 三、 LSC 調整時的工程調校權衡（Trade-offs）在實際調校（Tuning）LSC 時，並不是「校正到 100% 完全均勻」就是最好的，通常需要妥協與折衷：
### 1. 噪點與畫質劣化（Noise Amplification）邊緣的 Gain 值如果補償過大（例如邊緣暗角太嚴重，強行乘以 2.0 或 3.0 倍），邊緣的雜訊（Noise）也會被同步放大 2 到 3 倍。這會導致照片中心很乾淨，但四周邊緣顆粒感極重、畫質崩潰。業界做法：通常不會 100% 完美校正，邊緣通常會刻意保留 10% ~ 20% 的自然暗角（Shading Target 設在 80% ~ 85%），在視覺上較自然，且能抑止邊緣噪點。
### 2. 動態範圍損失（Dynamic Range Loss）
- 強行拉高邊緣亮度會導致邊緣的有效動態範圍下降，容易在邊緣引入過曝或雜色。
### 3. 多光源校正（Multi-light LSC）
- 不同光源（如黃光 A 光源、日光 D65、日光燈 TL84）下，Sensor 的 Color Shading 表現完全不同。
- 業界做法：工程師會針對 3 到 5 種標準光源單獨做 LSC Calibration，並在 ISP 中存入多組 LSC 矩陣。當手機拍照時，自動白平衡（AWB）會判斷當前環境色溫，並在不同光源的 LSC 矩陣之間進行線性插值（Interpolation），以達到最準確的色彩還原。


### Mesh LSC 內插虛擬碼 (Pseudocode)
``` python
# =====================================================================
# 函式名稱：apply_mesh_lsc
# 功能描述：對整張 Raw 影像進行 Mesh LSC 補償
# 輸入參數：
#   - raw_image: 原始 Raw 影像資料 (寬度 width, 高度 height)
#   - mesh_gain_table: 4個通道(R, Gr, Gb, B)的網格增益表，大小為 [4, M, N]
#   - block_w, block_h: 每個網格宮格的實體像素寬度與高度
# =====================================================================

def apply_mesh_lsc(raw_image, mesh_gain_table, block_w, block_h):
    width = raw_image.width
    height = raw_image.height
    output_image = create_empty_image(width, height)

    for y in range(0, height):
        for x in range(0, width):
            # 1. 判斷當前像素的 Bayer 通道格式 (R, Gr, Gb, 或 B)
            channel_type = get_bayer_channel(x, y)
            
            # 2. 計算當前座標在網格系統中的浮點數位置
            #    注意：硬體上通常以同通道的網格進行計算
            grid_x_float = x / block_w
            grid_y_float = y / block_h
            
            # 3. 找出宮格的左上角節點索引 (整數部分)
            col0 = floor(grid_x_float)
            row0 = floor(grid_y_float)
            
            # 4. 邊界保護：防止右方與下方索引超出網格最大範圍 (M-1, N-1)
            col1 = min(col0 + 1, MAX_MESH_COLS - 1)
            row1 = min(row0 + 1, MAX_MESH_ROWS - 1)
            
            # 5. 計算像素在宮格內部的相對權重比率 (介於 0.0 到 1.0 之間)
            #    dx, dy 代表距離左上角頂點的距離比例
            dx = grid_x_float - col0
            dy = grid_y_float - row0
            
            # 6. 取出四個頂點在該通道下的 Gain 值
            gain_TL = mesh_gain_table[channel_type][row0][col0]  # Top-Left (左上)
            gain_TR = mesh_gain_table[channel_type][row0][col1]  # Top-Right (右上)
            gain_BL = mesh_gain_table[channel_type][row1][col0]  # Bottom-Left (左下)
            gain_BR = mesh_gain_table[channel_type][row1][col1]  # Bottom-Right (右下)
            
            # 7. 雙線性內插運算 (Bilinear Interpolation)
            # 步驟 A: 水平方向內插 (得到頂部邊界與底部邊界的暫存 Gain)
            gain_T = (1.0 - dx) * gain_TL + dx * gain_TR
            gain_B = (1.0 - dx) * gain_BL + dx * gain_BR
            
            # 步驟 B: 垂直方向內插 (得到最終像素點的固定 Gain)
            final_gain = (1.0 - dy) * gain_T + dy * gain_B
            
            # 8. 套用補償值並寫回影像
            original_pixel_value = raw_image[y][x]
            compensated_value = original_pixel_value * final_gain
            
            # 邊界數值裁剪 (防止乘完後超過感光元件最大位元深度，如 10-bit: 1023, 12-bit: 4095)
            output_image[y][x] = clamp(compensated_value, 0, MAX_PIXEL_VALUE)
            
    return output_image

```



### 提示詞製作python 程式
```
請幫我將Mesh LSC 的計算方式,使用 python 寫一個 GUI 介面的程式,
我的需求 : 
1. 可以自己選擇開啟一個 raw 影像,可以設定影像參數 下拉選單設定影像 width與height 解析度列出  3264x2448, 2592x1944, 1920x1080,  色彩排列列出 RGGB , BGGR, 資料深度列出 16-bit , 12-bit, 10-bit .
2. 設定好影像參數後,顯示預期大小, 依照設定的影像參數開啟raw, 如果格式與大小不正確顯示"格式不正確,無法開啟.
3. 開啟的raw 影像,顯示在影像顯示區左側.
4. 設定三個單選按鈕 網格化（Mesh Grid）處理"16 × 16, 32 × 32, 64 × 64", 依照設定的網格使用Mesh LSC 雙線性內插演算法計算修正過的影像,顯示在影像顯示區右側.
5. 修正過的影像可以另存成 raw 檔案.
6. 將計算網格中各個節點的 R, Gr, Gb, B 四個通道補償後的數據生成一個 .csv 檔案.
```