import numpy as np

# 假設影像解析度為 1920x1080
width, height = 3264, 2448

# 使用 uint16 (16位元) 格式讀取二進位檔案
raw_data = np.fromfile('MC635X_raw_3264_2448_BGGR_16bit_20260805105744_dcOut_CWF_1.raw', dtype=np.uint16)

# 重新排列成二維矩陣（畫素矩陣）
image = raw_data.reshape((height, width))

# 此時 image 裡面的每個數字就是 0 ~ 4095 的 12-bit 畫素值
for a in range(15):
    print(image[0, a])