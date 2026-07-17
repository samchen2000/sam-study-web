``` mermaid
graph TD
    %% 定義樣式
    classDef raw fill:#89a759,stroke:#333,color:#fff;
    classDef rgb fill:#779ecb,stroke:#333,color:#fff;
    classDef yuv fill:#d79b9b,stroke:#333,color:#fff;

    %% 第一階段：Raw 處理
    subgraph Raw_Stage [Raw 域]
        direction LR
        Raw_L[Raw L input] -.-> FPN[FPN & BLC0]
        Raw_M[Raw M input] -.-> FPN
        Raw_S[Raw S input] -.-> FPN
        FPN --> Dg[Degamma]
        Dg --> DGW[Dgain & WB0 gain]
        DGW --> DPCC[DPCC & SPC]
        
        %% Stats
        DGW -.-> AWB[AWB Stats]
        DPCC -.-> AE3[AE Stats 3]
        DPCC -.-> AE2[AE Stats 2]
        DPCC -.-> AE1[AE Stats 1]
        DPCC -.-> AE0[AE Stats 0]
        AE3 & AE2 & AE1 & AE0 --> Merge[Merge]
        DPCC --> Merge
    end
    
    class FPN,Dg,DGW,DPCC,Merge,AWB,AE3,AE2,AE1,AE0 raw;

    %% 第二階段：Raw 後續處理
    subgraph Raw_Post [Raw 後處理]
        direction LR
        R2nr[Raw 2dnr / Raw 3dnr] --> CAC[CAC]
        CAC --> LSC[LSC]
        LSC --> DRC[DRC]
        DRC --> GIC[GIC]
    end
    class R2nr,CAC,LSC,DRC,GIC raw;

    %% 第三階段：RGB 處理
    subgraph RGB_Stage [RGB 域]
        direction LR
        Debayer[Debayer] --> CCM[CCM]
        CCM --> Gamma[Gamma]
        Gamma --> Dehaze[Dehaze]
        Gamma --> Enhance[Enhance]
        Dehaze & Enhance --> HistEQ[HistEQ]
        HistEQ --> 3Dlut[3Dlut]
        3Dlut --> LDCH[LDCH]
    end
    class Debayer,CCM,Gamma,Dehaze,Enhance,HistEQ,3Dlut,LDCH rgb;

    %% 第四階段：YUV 處理
    subgraph YUV_Stage [YUV 域]
        direction LR
        CSM[CSM] --> YNR[YNR]
        YUV_In[YUV input] --> YNR
        YNR --> Sharp[Sharp]
        Sharp --> CGC[CGC]
        CSM --> CNR[CNR]
        CNR --> CGC
        CGC --> Crop[CROP & CMSK]
        Crop --> SCL0[SCL 0]
        Crop --> SCL1[SCL 1]
        Crop --> FBC[FBC]
    end
    class CSM,YNR,Sharp,CNR,CGC,Crop,SCL0,SCL1,FBC yuv;

    %% 連接大區塊
    Merge --> R2nr
    GIC --> Debayer
    LDCH --> CSM
    
    %% 輸出
    SCL0 --> Out0[Ch0 output]
    SCL1 --> Out1[Ch1 output]
    FBC --> Out2[Ch2 output]
```