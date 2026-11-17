# csi_capture.c 程式用途與說明
本檔案是 ESP32 專屬的 CSI（Camera Serial Interface）螢幕捕捉/成像核心模組，負責「相機感測器與 MIPI CSI 傳輸、基於 ISP 影像處理、硬體系統管理、佈建/取用影像緩衝區、快取與中斷同步」等主要流程。

## 1. 檔案總體角色
main/csi_capture.c 的主要功能是：
#### 1. 初始化 CSI 捕捉模組
- 建立設備、I²C 總線、LDO 電源、相機感測器
- 掃描感測器並取得客製化格式
#### 2. 配置與啟動相機管線
- 初始化 MIPI CSI 控制器
- 通過 ESP-IDF 的 esp_isp 模組配置 ISP 處理器
- 選擇 RAW10 / RGB888 等輸出格式
- 啟用或者設置自動對焦（AF）、自動曝光（AE）
- 配置 LSC、CCM 等增益/色彩校正
#### 3. 影像緩衝區管理
- 使用多個同步緩衝區（ring buffer / frame buffer pool）
- 定義狀態機：AVAILABLE、PRODUCER、CONSUMER、READY
- 管理 producer / consumer 之間的緩衝區分享與重複利用
#### 4. 快取與 DMA 同步
- 使用 esp_cache_msync() 於讀取/寫回 DMA 寫入的 SPIRAM 緩衝
- 處理高速相機資料在 CPU 快取與外部 DDR/SPIRAM 之間的一致性
- 實現中斷機制與事件回調
#### 5. 透過 esp_cam_ctlr 接收 CSI 傳輸事件
- 緩衝區輪換、丟棄策略
- 將完成影像包從 DMA 緩衝區送入佇列並標記 READY
## 2. 主要資料結構
- ### 2.1 `csi_capture_t`
這是整個模組的核心控制結構：
```C
typedef struct csi_capture_s {
    i2c_master_bus_handle_t i2c_bus_handle;
    esp_ldo_channel_handle_t mipi_ldo_handle;
    esp_cam_ctlr_handle_t cam_ctlr_handle;
    isp_proc_handle_t isp_proc_handle;
    isp_af_ctlr_t af_ctlr_handle;
    isp_ae_ctlr_t ae_ctlr_handle;

    isp_af_result_t af_latest_result;
    portMUX_TYPE af_result_lock;
    bool af_result_valid;

    isp_ae_result_t ae_latest_result;
    portMUX_TYPE ae_result_lock;
    bool ae_result_valid;

    esp_cam_sensor_device_t *sensor;
    csi_capture_priv_data_t *priv_data;
    SemaphoreHandle_t lock;
    bool ccm_enabled;
    bool lsc_enabled;
    esp_isp_lsc_gain_array_t lsc_gain;
    uint32_t u32StartRequestCount;
    csi_sensor_format_array_t sensor_formats;
    bool sensor_formats_valid;

    bool exposure_user_set;
    uint32_t exposure_user_micros;
    bool gain_user_set;
    PhCsiGainIndex_t gain_user_index_value;
} csi_capture_t;
```
主要用途與意義：
| 欄位　| 作用 |
| ---- | ---- |
| `i2c_bus_handle` | 與感測器通訊的 I²C 總線 |
| `mipi_ldo_handle` | MIPI/CSIM 接口供電的 LDO 管理 |
| `cam_ctlr_handle` | MIPI CSI 控制器控制句柄 |
| `isp_proc_handle` | ISP 影像處理器控制句柄
| `af_ctlr_handle` / `ae_ctlr_handle` | 自動對焦 / 自動曝光控制器
| `af_latest_result` / `ae_latest_result` | 快照快照用之 AF/AE 統計結果
| `lock` | 傳統專用區域佇列/共享資源同步
| `priv_data`	| 緩衝區池、私有資料
| `sensor` | 已配置的相機感測器實體
| `sensor_formats` | 感測器支援的格式列表
| `ccm_enabled, lsc_enabled`	| CCM/LSC 是否已啟用
| `exposure_user_set` / `gain_user_set`	| 用戶是否手動設定曝光/增益
| `u32StartRequestCount` | 追蹤 csi_capture_start() 被呼叫的次數，用於重入控制
- ### 2.2 `csi_capture_priv_data_t`
用於管理影像緩衝區與佇列：
```C
typedef struct {
    uint32_t hres;
    uint32_t vres;
    size_t nbufs;
    csi_capture_fb_t *fbs;

    uint8_t *drop_buf;
    size_t drop_buf_size;

    QueueHandle_t buf_queue;
    uint32_t frame_count;

    portMUX_TYPE lock;
} csi_capture_priv_data_t;
```
其中：
| 欄位	| 作用 |
| ---- | ---- |
| `fbs` | 實際影像緩衝區陣列，每個元素是一個 `csi_capture_fb_t` |
| `drop_buf` | 用於「供應者快取太慢」時的兜底緩衝區 |
| `buf_queue` | 產生者與消費者之間的緩衝區取得/歸還佇列 |
| `frame_count`	| 整個封裝上傳的全域幀號 |
lock	用於保護 fbs 狀態變數的核心系統鎖
- ### 2.3 `csi_capture_fb_t`
```C
typedef struct {
    csi_frame_t frame;
    csi_capture_fb_state_t state;
} csi_capture_fb_t;
frame：包含來自感測器的 CSI 包緩衝區與信號
state：緩衝區可用狀態機
csi_capture_fb_state_t：


enum csi_capture_fb_state_t {
    AVAILABLE = 0,
    PRODUCER,
    CONSUMER,
    READY,
};
```
| 狀態 | 意義 |
| ---- | ---- |
| `AVAILABLE`	| 可寫入 / 可被生產者登記 |
| `PRODUCER` | 生產者已指定某區塊為輸出目 |
| `READY` | 已經產出的影像可供消費者讀取 |
| `CONSUMER` | 消費者正在讀取該緩衝區 |
- ### 2.4 `csi_frame_t`
推測由頭檔 csi_capture.h 定義，內含：
- 影像資料指標 `buf`
- 影像資料長度 `size`
- 寬高 `width` / `height`
- 影像內容類型 `format`
- 在佇列中的 `index`
- 幀號 `frame_num`
- 時間戳 `timestamp`
## 3. 核心行為與流程
## 4. 初始化流程：`csi_capture_init`
```C
csi_capture_handle_t csi_capture_init(PhHalI2cHandle_t *i2c_handle)
```
流程：
#### 1. 檢查 i2c_handle 不為 NULL
#### 2. 配置並取得 MIPI 供電 LDO
    - `chan_id = 3`
    - `voltage_mv = 2500`
#### 3. 建立一個互斥鎖 `xSemaphoreCreateMutex()`
#### 4. 配置並初始化相機感測器
    - 掃描 esp_cam_sensor_detect_fn_array 中所有感測器
    - 取出 MIPI CSI 介面感測器
#### 5. 去詢問感測器支援的影像格式
#### 6. 成功時返回控制結構
#### 7. 失敗時層層清理：
    - 刪除互斥鎖
    - 回收 LM
    - 釋放控制結構
## 5. 關閉流程：`csi_capture_deinit`
`csi_capture_deinit` 要求：
capture 必須在此之前已經 `stop`
做的事情：
#### 1. 檢查 u32StartRequestCount == 0，表示目前沒有正在運行的啟動
#### 2. 釋放緩衝區池
#### 3. 反初始化相機感測器
#### 4. 釋放 MIPI LDO
#### 5. 釋放整個控制結構與互斥鎖
## 6. 開始捕捉：`csi_capture_start`
這是最複雜的一個入口。
- ### 6.1 參數
```C
csi_config_t *config
```
它包含：
`hres` / `vres`：分辨率
`nbufs`：緩衝區數量
`format`：輸出格式，例如 PhCsiCaptureFormat_RAW10 / RGB888
`pipeline`：包含 LSC / CCM 配置
- ### 6.2 參數驗證與轉檔
```C
if (c->u32StartRequestCount > 0) {
    c->u32StartRequestCount++;
    ...
}
```
如果已經開始，則增加計數並返回 OK，表示即使已經在跑也可以再次呼叫。
然後：
#### 1. 檢查 `nbufs` == 0
#### 2. 取得可用的感測器格式：
```C
set_sensor_format(c, config->hres, config->vres)
```
#### 3. 將感測器格式轉成 `cam_ctlr_color_t`
#### 4. 配置 `esp_cam_ctlr_csi_config_t`
#### 5. 建立 MIPI CSI 控制器：
```C
esp_cam_new_csi_ctlr(...)
```
#### 6. 將輸出格式轉成 ISP 格式：
```C
csi_capture_format_to_isp_color(config->format)
```
#### 7. 決定是否 bypass_isp
    - RAW10 時通常關閉 ISP 較大功能
    - 其他格式則透過 ISP 編碼
#### 8. 建立 ISP 處理器：
```C
esp_isp_new_processor(...)
```
#### 9. 啟用 ISP（若非 bypass）
- ### 6.3 LSU/LSC / CCM 控制
```C
if (config->pipeline.lsc_config.enabled)
```
配置：
```C
esp_isp_lsc_configure(...)
esp_isp_lsc_enable(...)
```
並設定 `c->lsc_enabled = true`
如果配置 CCM：
```C
esp_isp_ccm_configure(...)
esp_isp_ccm_enable(...)
```
- ### 6.4 自動對焦（AF）
如果輸出不是 RAW10：
```C
esp_isp_new_af_controller(...)
esp_isp_af_controller_set_env_detector(...)
esp_isp_af_env_detector_register_event_callbacks(...)
esp_isp_af_controller_enable(...)
esp_isp_af_controller_start_continuous_statistics(...)
```
AF 環境偵測配置：
- 窗口：
    - 中心區域（3 個不同大小的區塊）
- 邊緣閾值：16
- 使用者回調 csi_af_env_statistics_done_cb
- 每隔 ISP_AF_CONFIG_INTERVAL_FRAMES 幀更新統計
- ### 6.5 自動曝光（AE）
```C
esp_isp_new_ae_controller(...)
esp_isp_ae_controller_set_env_detector(...)
esp_isp_ae_env_detector_register_event_callbacks(...)
esp_isp_ae_controller_enable(...)
esp_isp_ae_controller_start_continuous_statistics(...)
```
AE 測量區域：
- 圖片中心 60%
- `sample_point = ISP_AE_SAMPLE_POINT_0`
- 每 ISP_AE_CONFIG_INTERVAL_FRAMES 幀更新
- ### 6.6 事件回調註冊
```C
esp_cam_ctlr_evt_cbs_t cam_evt_cbs = {
    .on_get_new_trans = csi_request_buffer_cb,
    .on_trans_finished = csi_transaction_complete_cb,
};
```
`on_get_new_trans`：需要新的傳輸緩衝區時被呼叫
`on_trans_finished`：一幀傳輸完成時被呼叫
- ### 6.7 啟用 CSI 控制器
```C
esp_cam_ctlr_enable(...)
esp_cam_ctlr_start(...)
```
- ### 6.8 緩衝區管理
```C
bool can_reuse_buffers = (c->priv_data != NULL &&
    c->priv_data->hres == config->hres &&
    ...
    c->priv_data->fbs[0].frame.size == buffer_size);
```
如果緩衝區格式完全一致，則：
- 重設緩衝區狀態：`reset_priv_data()`
否則：
- 釋放舊緩衝區池
- 配置新的緩衝區
```C
c->priv_data = init_priv_data(...);
```
- ### 6.9 啟動感測器串流
```C
esp_cam_sensor_ioctl(c->sensor, ESP_CAM_SENSOR_IOC_S_STREAM, &enable);
```
- ### 6.10 重新應用使用者設定
```C
if (c->exposure_user_set) {
    ...
    esp_cam_sensor_set_para_value(c->sensor, ESP_CAM_SENSOR_EXPOSURE_VAL, &value, sizeof(value));
}
```
```C
if (c->gain_user_set) {
    ...
    esp_cam_sensor_set_para_value(c->sensor, ESP_CAM_SENSOR_GAIN, &value, sizeof(value));
}
```
這裡標註：
AE-driven exposure changes don't set these flags, preventing interference.

- ### 6.11 跳過前幾幀
由於說明文件中提到：
### The GC2607 has again_apply_delay=2: gain/exposure register writes take effect 2 frames after being written.
程式會：
```C
for (int i = 0; i < 2; i++) {
    csi_frame_t skip_frame = { 0 };
    if (csi_capture_get_next_frame(c, &skip_frame, 3000) == ESP_OK) {
        csi_capture_return_frame(c, &skip_frame);
    }
}
```
也就是：
- 第一幀延遲/跳過
- 使得使用者會得到「剛好有寫入「正確曝光/增益」設定後」的影像
- ### 6.12 失敗清理
多個 `cleanup` 標籤：
`cleanup_priv`：釋放 `priv_data`
`cleanup_cam_enabled`：停用 CSI 控制器
`cleanup_pipeline`：關閉 ISP、AF、AE、CCM、LSC
`cleanup_csi_ctlr`：刪除 CSI 控制器
這是典型的中斷式資源清理結構。

## 7. 停止捕捉：csi_capture_stop
流程：
#### 1. 檢查是否已經開始
#### 2. 減少 u32StartRequestCount
#### 3. 如果仍被多人使用，返回 OK，不真的停止
#### 4. 關閉感測器串流：
```C
esp_cam_sensor_ioctl(c->sensor, ESP_CAM_SENSOR_IOC_S_STREAM, &stream_disable);
```
#### 5. 停止、禁用、刪除 CSI 控制器
#### 6. 關閉關掛：
- ccm_enabled
- lsc_enabled
- af_ctlr_handle
- ae_ctlr_handle
- isp_proc_handle
#### 7. 清除所有未讀取的緩衝區：
```C
for (uint32_t i=0; i < c->priv_data->nbufs; i++) {
    size_t sentinel = i;
    xQueueSend(c->priv_data->buf_queue, &sentinel, 0);
}
```
#### 8. 等待所有緩衝區回到 AVAILABLE
#### 9. 回復緩衝區狀態：
```C
reset_priv_data(c->priv_data);
```
## 8. 緩衝區分配與初始化：`init_priv_data`
這個函數負責：
#### 1. 配置 priv
#### 2. 配置 fbs 陣列
#### 3. 為每個緩衝區配置：
- 對齊
- 總大小
- 緩衝區指標
- `csi_frame_t`
#### 4. 分配 `drop_buf`
#### 5. 生成同步佇列 `buf_queue`
#### 6. 設定 `frame_count = 0`
#### 7. 初始化 portMUX_TYPE lock
重要設計：
- 緩衝區在 SPIRAM / DMA 分配
- 並使用 `esp_cache_aligned_calloc()`
- 用 `esp_cache_msync()` 確保 DMA 寫入與 CPU 讀取一致性
## 9. 緩衝區取得：`csi_capture_get_next_frame`
```C
esp_err_t csi_capture_get_next_frame(csi_capture_t *c,
                                      csi_frame_t *frame,
                                      uint32_t timeout_ms)
```
流程：
#### 1. 檢查參數
#### 2. 從 buf_queue 接收一個緩衝區索引
#### 3. 如果超時，返回 ESP_ERR_TIMEOUT
#### 4. 找到該緩衝區
#### 5. 標記 CONSUMER
#### 6. 使用 esp_cache_msync(..., ESP_CACHE_MSYNC_FLAG_DIR_M2C) 清空 CPU 快取，確保讀取 DMA 寫入的數據
#### 7. 複製 csi_frame_t 到使用者記憶體
#### 8. 返回 ESP_OK
使用者注意：
- 這裡回傳的 csi_frame_t 是「用戶複製」出來的副本
- 因此使用者可以安全地修改它
## 10. 緩衝區歸還：csi_capture_return_frame
```C
esp_err_t csi_capture_return_frame(csi_capture_t *c,
                                    csi_frame_t *frame)
```
流程：
#### 1. 根據幀的 index 找緩衝區
#### 2. 標記成為 AVAILABLE
#### 3. 返回 ESP_OK
使用者應在取得緩衝區後處理完成，再把緩衝區還回去。

## 11. 事件回調
### 11.1 `csi_request_buffer_cb`
在 CSI 控制器需要新的輸出緩衝區時被呼叫。
流程：
#### 1. 尋找 AVAILABLE 狀態的緩衝區
#### 2. 若找到，標記 PRODUCER
#### 3. 如果沒有可用的，從 buf_queue 取出一個緩衝區，標籤 PRODUCER
#### 4. 若仍找不到，則使用 drop_buf
返回值：
- 若成功回傳 `true`
- 失敗則回傳 `false`
### 11.2 `csi_transaction_complete_cb`
在某個影像傳輸完成後被呼叫。
做的事情：
#### 1. 取得緩衝區指標
#### 2. 取得當前時間 `esp_timer_get_time()`
#### 3. 填寫 `timestamp`
#### 4. 更新 `frame_num` 與 `state = READY`
#### 5. 將 `frame.index` 推送到 `buf_queue`，供使用者取得
## 12. 自動對焦 / 曝光統計獲取
### 12.1 AF 統計：
```C
esp_err_t csi_capture_af_get_statistics(...)
```
- 讀取 af_latest_result
- 複製到 csi_af_result_t
流程用到：
- `af_result_lock`
- `af_result_valid`
### 12.2 AE 統計：
```C
esp_err_t csi_capture_ae_get_statistics(...)
```
- 取得 ae_latest_result
- 複製到 csi_ae_result_t
## 13. 曝光相關 API
### 13.1 設定曝光
```C
PErr_t csi_capture_exposure_set(...)
```
- 寫入 `ESP_CAM_SENSOR_EXPOSURE_VAL`
- 轉換為微秒值儲存
- 設定 `exposure_user_set = true`
### 13.2 取得曝光
```C
PErr_t csi_capture_exposure_get(...)
```
- 從感測器讀取曝光值
- 寫入使用者提供的指標
### 13.3 最大/最小曝光查詢
```C
PhCsiExposureValue_t csi_capture_exposure_max_get(...)
PhCsiExposureValue_t csi_capture_exposure_min_get(...)
```
- 動態從感測器永續訊息查詢暴露範圍
### 13.4 轉換工具
```C
static uint32_t exposure_us_to_value(...)
static uint32_t exposure_value_to_us(...)
```
- 曝光值與以微秒為單位的時間互相轉換
- 依賴感測器 isp_info->isp_v1_info
推導公式大致如下：
```md
value = us * EXPOSURE_SUB_LINE_STEPS * pclk / (hts * US_PER_SECOND)
us   = value * hts * US_PER_SECOND / (EXPOSURE_SUB_LINE_STEPS * pclk)
```
其中：
- `EXPOSURE_SUB_LINE_STEPS = 16`
- 每一行曝光單位是 1/16 路徑
## 14. 相關數值：`get_buffer_size / get_buffer_alignment`
```C
static inline size_t get_buffer_alignment(void) { ... }
```
取得：
- DMA 嚴格對齊：4
- 快取對齊：`esp_cache_get_alignment(MALLOC_CAP_SPIRAM | MALLOC_CAP_DMA, ...)`
```C
static inline size_t get_buffer_size(uint32_t hres, uint32_t vres, size_t bpp) {
    size_t size = (hres * vres * bpp) / 8;
    size_t alignment = get_buffer_alignment();
    return (size + alignment - 1) & ~(alignment - 1);
}
```
- 映像大小 = `width * height * bpp / 8`
- 然後向上對齊到 alignment
## 15. 字色格式轉換
15.1 感測器 Bayer 取樣順序
```C
static color_raw_element_order_t get_color_raw_element_order(esp_cam_sensor_bayer_pattern_t bayer_type)
```
- RGGB → COLOR_RAW_ELEMENT_ORDER_RGGB
- GBRG → COLOR_RAW_ELEMENT_ORDER_GBRG
- GRBG → COLOR_RAW_ELEMENT_ORDER_GRBG
- BGGR → COLOR_RAW_ELEMENT_ORDER_BGGR
### 15.2 格式到 `cam_ctlr_color_t`
- RGB888 → CAM_CTLR_COLOR_RGB888
- RAW8 → CAM_CTLR_COLOR_RAW8
- RAW10 → CAM_CTLR_COLOR_RAW10
### 15.3 `cam_ctlr_color_t` 到 `isp_color_t`
- RAW10 → ISP_COLOR_RAW10
- RAW8 → ISP_COLOR_RAW8
- RGB888 → ISP_COLOR_RGB888
### 15.4 `csi_capture_format_to_isp_color`
- PhCsiCaptureFormat_RAW10 → ISP_COLOR_RAW10
- PhCsiCaptureFormat_RGB888 → ISP_COLOR_RGB888
## 16. 快取同步策略
在 `csi_capture_get_next_frame`：
```C
esp_cache_msync(fb->frame.buf, fb->frame.size, ESP_CACHE_MSYNC_FLAG_DIR_M2C);
```
意義：
- 向總線/處理器告知「要從外部 DMA 資料記憶體讀取資料」
- 使 CPU 快取可看到 DMA 寫入的值
在 `init_priv_data`:
```C
esp_cache_msync(buf, size, ESP_CACHE_MSYNC_FLAG_DIR_C2M);
```
意義：
- 對於之前可能還未同步的緩衝區，確保向 DMA/外圍寫入可見
這是 ESP32 高速外設緩衝區使用的重要機制，避免 CPU 快取與 DMA/共用記憶體不可見而導致映像資料不正確。
## 17. 錯誤處理策略
整體錯誤處理具有這幾種特色：
#### 1. 盡早回傳 ESP_FAIL / ESP_ERR_...
#### 2. 使用 goto cleanup_* 集中釋放資源
#### 3. 對每一種核心資源都有對應的反初始化
#### 4. 對於非致命情況記錄 WARN / INFO，決定是否崩潰
例如：
```C
ESP_LOGE(TAG, "unable to initialize ...");
goto cleanup;
```
## 18. 重要設計模式與架構
### 18.1 狀態機緩衝池
這是一種經典的「多緩衝區生成者—消費者」設計：
- 學習者 / 驅動程式取得緩衝區
- ISP / CSI / DMA 產出影像
- 應用程式讀取影像
- 使用完畢回傳
狀態機：
```C
AVAILABLE → PRODUCER → READY → CONSUMER → AVAILABLE
```
### 18.2 動態重新配置
csi_capture_start 的緩衝區不可用時：
```C
can_reuse_buffers == false
```
會重新配置：
- 釋放舊 priv_data
- 新建新的緩衝區
因此可在不重啟整個模組的情況下，改變：
- 視窗
- 任務
- 緩衝區數
- 輸出格式
### 18.3 透明於中斷的 DMA 控制器
使用：
- `esp_cam_ctlr`
- `esp_isp`
- `esp_cam_sensor`
這類 ESP-IDF 高層相機框架，使得這個檔案能處理：
- DSI/MIPI 控制器
- 影像處理器
- 感測器控制
- 快取同步
- 事件路由
## 19. 主要方法清單
| 方法 | 作用 |
| ---- | ---- |
| `csi_capture_init` | 初始化模組 |
| `csi_capture_deinit` | 反初始化 |
| `csi_capture_start`	| 開始捕捉 |
| `csi_capture_stop` | 停止捕捉 |
| `csi_capture_is_started` | 查詢是否運行中 |
| `csi_capture_get_next_frame` | 獲取下一幀 |
| `csi_capture_return_frame` | 歸還緩衝區 | 
| `csi_capture_color_correction_set` | 設定 CCM / 色彩校正 |
| `csi_capture_exposure_set` | 設定曝光值 | 
| `csi_capture_exposure_get` | 取得曝光值 |
| `csi_capture_exposure_max_get` | 最大曝光 |
| `csi_capture_exposure_min_get` | 最小曝光 |
| `csi_capture_exposure_set_ms` | 設定曝光（毫秒） |
| `csi_capture_exposure_mark_user_set` | 標記曝光為使用者設定 |
| `csi_capture_gain_set` | 設定增益 |
| `csi_capture_gain_mark_user_set` | 標記增益為使用者設定 |
| `csi_capture_gain_get` | 取得增益 |
| `csi_capture_gain_max_index_get` | 最大增益索引 |
| `csi_capture_af_get_statistics` | 取得 AF 統計 |
| `csi_capture_ae_get_statistics` | 取得 AE 統計 |
| `csi_capture_get_sensor_formats` | 取得感測器支持的格式 |
## 20. 從業務與使用者角度的摘要
這是一個完整的 CSI 影像捕捉模組，主要目的是：
#### 1. 在 ESP32 上透過 MIPI CSI 連接相機感測器
#### 2. 控制高階影像處理器（ISP）
#### 3. 啟用或停用：
- 自動對焦
- 自動曝光
- 色彩校正（CCM）
- 線性色彩增強（LSC）
#### 4. 管理一組直接對接 SPI RAM 的影像緩衝區
#### 5. 支援界面/應用程序取用、歸還與輪轉緩衝區
#### 6. 處理快取與 DMA 之間的記憶體一致性
#### 7. 提供高層曝光、增益、AF、AE 等管理介面
## 21. 簡短一句話總結
### `main/csi_capture.c` 是一個 ESP-IDF 平台上用於 **MIPI CSI 數位相機捕捉** 的核心驅動程式庫，主要管理相機感測器、影像處理器、自動對焦/曝光、影像緩衝池、DMA 快取同步、多緩衝輪轉和資源生命週期控制。