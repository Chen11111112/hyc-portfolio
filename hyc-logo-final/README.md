# Hy.C 正式標誌資產

個人網站 [hychen.space](https://hychen.space) 使用。方向 **B**（Geist 600 字標 *Hy.C*，方形句點）＋ **C6**（圓角方塊鏤空 `.C`）。

填色沿用核准示意稿的近黑 **`#111111`**，以及 **`#FFFFFF`**。背景皆為透明。所有字母已轉成路徑，不依賴字型檔。

## 檔案

```
svg/     向量主檔（建議網站優先使用）
  wordmark-black.svg / wordmark-white.svg
  icon-black.svg / icon-white.svg
  lockup-horizontal-black.svg / lockup-horizontal-white.svg

png/     透明點陣（2×／高解析）
  wordmark-*-1200.png          寬 1200px
  icon-*-512.png、*-1024.png、*-180.png
  lockup-horizontal-*-1600.png 寬 1600px

favicon/
  favicon.ico                  16 / 32 / 48（16px 使用優化句點）
  icon.svg                     標準 C6，可作 Next.js `app/icon.svg`
  icon-favicon-optimized.svg   16px 略放大句點的版本（見下方說明）
  apple-icon.png               180×180，實心底（見下方說明）
  icon-192.png、icon-512.png   PWA manifest，實心底
```

淺色背景用黑色版，深色背景用白色版。C6 白色圖標是**白色圓角方塊、透明鏤空**（不是整顆反白的實心塊）；放在深色底上，會透出底色而形成深色 `.C`。

## 最小尺寸

| 用途 | 建議最小（1× CSS 像素） | 舒適尺寸 |
| --- | --- | --- |
| 圖標 C6 | 16px（16px 請改用優化版或 `favicon.ico`） | 24px 以上，頁首 28–32px |
| 字標 B | 寬約 96px（大寫字高約 36px） | 寬 140px 以上 |
| 橫向組合 | 寬約 160px（圖標邊長約 38px） | 寬 200px 以上 |

再小的話，句點方塊會糊成一團，C 的開口也不清楚。

## 預留空間（Clearspace）

四邊預留空間等於**該用途下句點方塊的邊長**：

- 圖標：句點為標誌邊長的 13／80（約 0.16×），例如 32px 圖標預留約 5px。
- 字標／組合：句點邊長約為大寫字高的 0.32 倍。組合中圖標與字標的間距已內建為 **0.5× 圖標邊長**（依墨水邊緣計算），外圍仍請再留一個句點邊長。

不要把其他元素伸進這圈空氣裡。

## 請不要

- 拉伸、壓扁、單獨旋轉，或自行重排字距
- 把方形句點改成圓點，或改掉句點與 C 的相對大小
- 把 C6 再套進另一個圓角方框或圓形（會變成雙重圓角，標誌也會顯小）
- 描邊、陰影、漸層、立體或模糊
- 用 Geist 或其他字型重新打字來代替已出的路徑（方句點的間距是算過的）
- 只截取單一字母，或改變 `#111111` / `#FFFFFF` 以外的單色（例如把黑色版直接改成灰）
- 在淺底使用白色版、在深底使用黑色版
- 網站頁首用小於上表的尺寸

## Favicon 與 App icon

在 16×16 點陣下，標準句點只有約 2.6px， squar 仍可辨但偏弱。因此另外做了 `icon-favicon-optimized.svg`：句點由 13 單位加到 **16** 單位（約 +23%），向左、向上生長，右邊與基線不動，以免碰到 C。此版**只建議用在 16px**；32px 以上請用標準幾何。

`favicon.ico` 的 16px 圖層使用優化版，32 與 48px 圖層使用標準 C6。

`apple-icon.png`、`icon-192.png`、`icon-512.png` 為**滿版實心 `#111111` 方塊＋白色 `.C`**（不是透明鏤空、也不是圓角容器）。iOS／Android 會再套一次自己的圓角或自適應圖示遮罩；若使用透明圓角版，會被裁第二次而顯小，鏤空也會透出主畫面壁紙。

## Next.js（App Router）

把檔案放到專案裡，例如：

```text
app/icon.svg            ← favicon/icon.svg
app/apple-icon.png      ← favicon/apple-icon.png
public/brand/           ← svg/ 與需要的 png/
```

`app/icon.svg` 會由 Next.js 當成 favicon 輸出。若你很在意 1× 的 16px 分頁圖示，可改放 `icon-favicon-optimized.svg`。多數 Retina 分頁實際是 32 實體像素，用標準版即可。

manifest（若有 `app/manifest.ts`）可指向 `icon-192.png`、`icon-512.png`。

頁首建議用橫向組合（淺底用黑色版）：

```tsx
import Image from "next/image";
import lockup from "@/public/brand/lockup-horizontal-black.svg";

export function Logo() {
  return (
    <Image
      src={lockup}
      alt="Hy.C"
      height={32}
      className="h-8 w-auto"
      priority
    />
  );
}
```

深色模式改放 `lockup-horizontal-white.svg`，或把 SVG 內聯後以 CSS 切換。C6 是 `fill-rule="evenodd"` 的鏤空路徑，把 `fill` 設成 `currentColor` 即可隨文字色走；不要只改句點或只改 C。

`favicon.ico` 可放在 `app/favicon.ico`。

## 授權說明（Geist）

字標字母外形取自 **Geist 600**（The Geist Project Authors / Vercel），並已轉成路徑，正式檔不附字型。Geist 以 [SIL Open Font License 1.1](https://openfontlicense.org) 授權。

本機字型的 name table 記載：Copyright 2024 The Geist Project Authors（https://github.com/vercel/geist-font），License 為 SIL OFL 1.1。官方倉庫的 `OFL.txt` 同樣為 OFL 1.1（本機字型目錄沒有另附 `OFL.txt`）。把 OFL 字型的字母轉成路徑、作為標誌的一部分是允許的；這不是在再散布一份衍生字型。若你另外再發布 Geist 字型檔本身，才需要連同 OFL 全文並遵守 reserved font name 等條款。

## 預覽

同資料夾的 `preview.png` 將字標、圖標、組合放在白底、黑底與棋盤格上，並附 favicon 實際尺寸與 16px 句點對照。
