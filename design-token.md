# Dayboard Design Tokens · 設計變數

> 版本：v0.1（2026-05-09）  
> 目的：所有 design tokens 的 single source of truth，後續會轉成 **Figma Variables JSON** 匯入 Figma。  
> 對齊：`design-principles.md`、`/design-system` 頁面、`src/styles.css`。

---

## 0. 文件目的與 Figma 對接策略

### 為什麼需要這份文件

- `styles.css` 是 CSS-side 的真實樣貌；`design-token.md` 是 **stack-agnostic 的合約**。Figma 要對齊它、未來如果換 framework（Vue / SwiftUI）也要對齊它。
- 這份文件的 schema 設計能直接 1:1 對到 **Figma Variables JSON 格式**（Figma 原生匯入格式）。

### Figma 對接策略

| Token 類別             | 進 Figma 的方式                       | 原因                                                  |
| ---------------------- | ------------------------------------- | ----------------------------------------------------- |
| 色彩（Color）          | **Variables**，Light / Dark 兩個 mode | Figma Variables 原生支援                              |
| 間距 / 圓角 / 字級數值 | **Variables**（Number type）          | Figma Variables 原生支援                              |
| Typography 組合        | **Text Styles**（不是 Variables）     | Figma Variables 不能代表「字級+字重+行高+字距」的組合 |
| 陰影                   | **Effect Styles**（不是 Variables）   | Figma Variables 不支援 shadow                         |
| 漸層                   | **Fill Styles** 或元件內處理          | Figma Variables 不支援 gradient                       |
| 動畫 / 緩動曲線        | **不進 Figma**（CSS-only）            | Figma 沒有 motion variable                            |

### 命名規範

採用 **slash-separated path**（與 Figma Variables group 對齊）：

```
color/primary/default
color/primary/soft
color/text/ink
spacing/16
radius/card
font/size/base
text/heading/lg
```

匯出 JSON 時，path 會自動變成 group 結構。

### Token Tier（兩層）

- **Primitive**（原始值）：`color/blue/600`、`spacing/16`。**不直接給設計師用**。
- **Semantic**（語意值）：`color/primary/default = {color/blue/600}`、`color/text/ink`。**設計時引用這層**。

---

## 1. 色彩系統

### 1.1 Primitive Colors

> 命名：`color/{family}/{step}`，step 沿用 Tailwind / Material 的 50–950 慣例。  
> 這層是「色票庫」，不直接套用，由 Semantic 層引用。

#### Brand Blue（從 #0E4FE7 衍生階梯）

| Token            | Hex       | 用途提示                    |
| ---------------- | --------- | --------------------------- |
| `color/blue/50`  | `#EEF4FF` | 最淺底色（未使用，預留）    |
| `color/blue/100` | `#BADDFF` | **= primary-soft（light）** |
| `color/blue/200` | `#8DC2FF` | 預留                        |
| `color/blue/400` | `#4A82FF` | 預留                        |
| `color/blue/600` | `#0E4FE7` | **= primary（brand）**      |
| `color/blue/900` | `#122559` | **= primary-ink（light）**  |

#### Neutral Gray（light）

| Token            | Hex       |
| ---------------- | --------- |
| `color/gray/0`   | `#FFFFFF` |
| `color/gray/25`  | `#FAFBFC` |
| `color/gray/50`  | `#F6F7F9` |
| `color/gray/75`  | `#F4F5F7` |
| `color/gray/100` | `#EEF0F3` |
| `color/gray/200` | `#E7E9EE` |
| `color/gray/300` | `#D5D9E0` |
| `color/gray/400` | `#C9CDD4` |
| `color/gray/500` | `#9AA1AC` |
| `color/gray/600` | `#6B7280` |
| `color/gray/800` | `#2A3142` |
| `color/gray/950` | `#0B1220` |

#### Neutral Gray（dark mode 專用）

| Token                 | Hex       |
| --------------------- | --------- |
| `color/gray-dark/950` | `#0A0D12` |
| `color/gray-dark/900` | `#0E1218` |
| `color/gray-dark/850` | `#11151C` |
| `color/gray-dark/800` | `#161B23` |
| `color/gray-dark/700` | `#181D25` |
| `color/gray-dark/600` | `#1E242E` |
| `color/gray-dark/500` | `#2A323F` |
| `color/gray-dark/400` | `#3A414D` |
| `color/gray-dark/300` | `#6A727E` |
| `color/gray-dark/200` | `#8A92A0` |
| `color/gray-dark/100` | `#C9CED7` |
| `color/gray-dark/50`  | `#ECEEF2` |

#### Status

> 原始定義是 OKLCH，以下是用 Chrome canvas API 精算出 sRGB 後的對應 hex（已驗證渲染結果）。

| Token              | Hex       | 原始 OKLCH             |
| ------------------ | --------- | ---------------------- |
| `color/green/500`  | `#28AD5E` | `oklch(0.66 0.16 152)` |
| `color/red/500`    | `#E64343` | `oklch(0.62 0.20 25)`  |
| `color/orange/500` | `#E38F00` | `oklch(0.72 0.16 70)`  |

> 三個 hex 來自實際 Chrome 渲染結果，與 Safari / Firefox 在 OKLCH 處理上可能有 ±2 點差異，**設計時以這份 hex 為準**。

---

### 1.2 Semantic Colors

> 設計師與工程師日常引用的是這一層。每個 token 在 Light / Dark mode 都有定義。

#### Brand

| Token                      | Light                        | Dark                         |
| -------------------------- | ---------------------------- | ---------------------------- |
| `color/primary/default`    | `{color/blue/600}` `#0E4FE7` | `{color/blue/600}` `#0E4FE7` |
| `color/primary/soft`       | `{color/blue/100}` `#BADDFF` | `#1A2B5C` ⚠️                 |
| `color/primary/ink`        | `{color/blue/900}` `#122559` | `#7AA8F5` ⚠️                 |
| `color/primary/foreground` | `#FFFFFF`                    | `#FFFFFF`                    |

⚠️ **Dark mode 的 primary-soft / primary-ink 在 CSS 是用 `color-mix(in oklch, var(--primary) 22%, var(--bg))` 與 `color-mix(in oklch, var(--primary) 60%, #ffffff)` 動態算的**。Figma 不支援這個公式，所以這裡 freeze 成具體 hex（用 Chrome 實算抓）。如果 light brand 色未來改動，這兩個 dark hex 要重新 freeze。

#### Surface

| Token                     | Light                       | Dark                              |
| ------------------------- | --------------------------- | --------------------------------- |
| `color/surface/bg`        | `{color/gray/50}` `#F6F7F9` | `{color/gray-dark/950}` `#0A0D12` |
| `color/surface/default`   | `{color/gray/0}` `#FFFFFF`  | `{color/gray-dark/850}` `#11151C` |
| `color/surface/secondary` | `{color/gray/25}` `#FAFBFC` | `{color/gray-dark/900}` `#0E1218` |
| `color/surface/hover`     | `{color/gray/75}` `#F4F5F7` | `{color/gray-dark/800}` `#161B23` |

#### Border

| Token                  | Light                        | Dark                              |
| ---------------------- | ---------------------------- | --------------------------------- |
| `color/border/default` | `{color/gray/200}` `#E7E9EE` | `{color/gray-dark/600}` `#1E242E` |
| `color/border/strong`  | `{color/gray/300}` `#D5D9E0` | `{color/gray-dark/500}` `#2A323F` |
| `color/border/divider` | `{color/gray/100}` `#EEF0F3` | `{color/gray-dark/700}` `#181D25` |

#### Text

| Token                | Light                        | Dark                              |
| -------------------- | ---------------------------- | --------------------------------- |
| `color/text/ink`     | `{color/gray/950}` `#0B1220` | `{color/gray-dark/50}` `#ECEEF2`  |
| `color/text/ink-2`   | `{color/gray/800}` `#2A3142` | `{color/gray-dark/100}` `#C9CED7` |
| `color/text/muted`   | `{color/gray/600}` `#6B7280` | `{color/gray-dark/200}` `#8A92A0` |
| `color/text/muted-2` | `{color/gray/500}` `#9AA1AC` | `{color/gray-dark/300}` `#6A727E` |
| `color/text/faint`   | `{color/gray/400}` `#C9CDD4` | `{color/gray-dark/400}` `#3A414D` |

#### Status

| Token                      | Light                          | Dark     |
| -------------------------- | ------------------------------ | -------- |
| `color/status/positive`    | `{color/green/500}` `#28AD5E`  | 同 Light |
| `color/status/negative`    | `{color/red/500}` `#E64343`    | 同 Light |
| `color/status/warning`     | `{color/orange/500}` `#E38F00` | 同 Light |
| `color/status/positive-bg` | `rgba(40, 173, 94, 0.14)`      | 同 Light |
| `color/status/negative-bg` | `rgba(230, 67, 67, 0.14)`      | 同 Light |
| `color/status/warning-bg`  | `rgba(227, 143, 0, 0.14)`      | 同 Light |

> **Status 色 light/dark 同色**（Apple HIG / Material 慣例）— 警示就是警示，不該因主題變色。
>
> **`-bg` 半透明背景變體**：用於 `.delta.pos / .neg`、`.tag.life / .health` 等狀態徽章。原本 CSS 是 `color-mix(in oklch, var(--X) 14%, transparent)` 動態算，Figma 用 RGBA 14% alpha 對齊（實作上 `.tag.life` 原本是 12%，**統一改為 14%** 少一個 magic number，視覺差異肉眼難辨）。

---

### 1.3 Mood Heatmap（5 階）

> 從 `var(--primary)` 與 `var(--divider)` 在 OKLCH 空間混合（20% / 40% / 65%）。已用 Chrome 實算 freeze 成 hex（Figma 不支援 `color-mix`）。

| Token              | Light                               | Dark                                |
| ------------------ | ----------------------------------- | ----------------------------------- |
| `color/heatmap/l0` | `{color/border/divider}` `#EEF0F3`  | `{color/border/divider}` `#181D25`  |
| `color/heatmap/l1` | `#C1D3F5`                           | `#192948`                           |
| `color/heatmap/l2` | `#95B5F4`                           | `#19346D`                           |
| `color/heatmap/l3` | `#5E8EF0`                           | `#17409E`                           |
| `color/heatmap/l4` | `{color/primary/default}` `#0E4FE7` | `{color/primary/default}` `#0E4FE7` |

> ⚠️ 如果 `--primary` 改色，l1–l3 要重新 freeze（用本專案 `/design-system` 開瀏覽器抓 canvas hex）。

### 1.4 Tag Color Mapping

> Tag 是 component-level token，**不引入新原子色**，而是定義「哪一類 tag 用哪一組 status / brand 色」的 mapping rule。

| Tag class     | 語意             | 文字色                    | 背景色                       |
| ------------- | ---------------- | ------------------------- | ---------------------------- |
| `tag/work`    | 工作、職涯、業務 | `{color/primary/ink}`     | `{color/primary/soft}`       |
| `tag/life`    | 生活、家庭、休閒 | `{color/status/positive}` | `{color/status/positive-bg}` |
| `tag/health`  | 健康、運動、醫療 | `{color/status/warning}`  | `{color/status/warning-bg}`  |
| `tag/finance` | 理財、預算、消費 | `{color/text/ink-2}`      | `{color/surface/secondary}`  |
| `tag/learn`   | 學習、閱讀、課程 | `{color/primary/ink}`     | `{color/primary/soft}`       |
| `tag/travel`  | 旅遊、外出       | `{color/status/warning}`  | `{color/status/warning-bg}`  |
| `tag/default` | 未分類           | `{color/text/muted}`      | `{color/surface/hover}`      |

**規則**：

- 新增 tag 類別時**必須對應到既有 status / brand 色組**，不為了單一 tag 引入新色（避免色彩擴張）。
- 同色組可重用（例：`finance` 與 `learn` 都可用 primary 系，用 icon 區隔）。
- 上限 6 個 tag 類別同時並存於畫面，否則應改為下拉選單而非 inline tag。

### 1.5 Interaction / State Tokens

> 互動狀態與輔助層級的色彩。focus ring 與 selection 與 a11y 直接相關。

| Token                         | Light                            | Dark                        | 用途                                        |
| ----------------------------- | -------------------------------- | --------------------------- | ------------------------------------------- |
| `color/focus/ring`            | `rgba(14, 79, 231, 0.4)`         | `rgba(14, 79, 231, 0.5)`    | 鍵盤 focus outline（2px solid，offset 2px） |
| `color/state/disabled-bg`     | `{color/surface/secondary}`      | `{color/surface/secondary}` | Button / input disabled 底                  |
| `color/state/disabled-text`   | `{color/text/muted-2}`           | `{color/text/muted-2}`      | Disabled 文字                               |
| `color/state/disabled-border` | `{color/border/default}`         | `{color/border/default}`    | Disabled 邊線                               |
| `color/overlay/scrim`         | `rgba(10, 13, 18, 0.4)`          | `rgba(0, 0, 0, 0.6)`        | Mobile sidebar 遮罩（既有 `.scrim`）        |
| `color/overlay/modal`         | `rgba(10, 13, 18, 0.6)`          | `rgba(0, 0, 0, 0.75)`       | （預留）Modal 遮罩                          |
| `color/text/selection-bg`     | `{color/primary/soft}` `#BADDFF` | `rgba(14, 79, 231, 0.35)`   | 文字選取背景                                |
| `color/scrollbar/thumb`       | `rgba(0, 0, 0, 0.15)`            | `rgba(255, 255, 255, 0.15)` | 自訂 scrollbar thumb                        |
| `color/scrollbar/thumb-hover` | `rgba(0, 0, 0, 0.25)`            | `rgba(255, 255, 255, 0.25)` | Hover 時                                    |
| `color/scrollbar/track`       | `transparent`                    | `transparent`               | Track 透明                                  |

> Focus ring 雖然走 alpha，但**深淺模式用稍微不同的 alpha**（dark 上需要更明顯一點才看得到）。

---

## 2. 字體系統

### 2.1 Font Family

| Token                 | Value                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `font/family/sans`    | `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif` |
| `font/family/mono`    | `"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace`                                        |
| `font/family/display` | `{font/family/sans}`                                                                                    |

> **Figma 對應**：用 String type Variable 存。但 Figma 自己會用第一個 family，fallback 不會生效，所以要確保 Inter、JetBrains Mono、Noto Sans TC 都在 Figma 字體列表裡。

### 2.2 Font Size Scale（8 階）

| Token            | Value  | px      | 用途                                     |
| ---------------- | ------ | ------- | ---------------------------------------- |
| `font/size/2xs`  | `10`   | 10 px   | Section eyebrow                          |
| `font/size/xs`   | `10.5` | 10.5 px | Tag、kbd                                 |
| `font/size/sm`   | `11.5` | 11.5 px | Meta、small label                        |
| `font/size/md`   | `13`   | 13 px   | Card title、small body                   |
| `font/size/base` | `14`   | 14 px   | **預設 body**                            |
| `font/size/lg`   | `18`   | 18 px   | Section h2                               |
| `font/size/xl`   | `22`   | 22 px   | Secondary num（finance、goal、mood avg） |
| `font/size/2xl`  | `24`   | 24 px   | KPI num                                  |
| `font/size/3xl`  | `28`   | 28 px   | Hero h1、Card num                        |

> ✅ **`13.5` 已決議統一到 `14`**（影響：nav-item、todo title、search input、btn-primary、hero p）。card title 維持 `13`。實作面要在 `styles.css` 把 `13.5px` 改為 `14px`。

### 2.3 Font Weight

| Token                  | Value | 用途                                                              |
| ---------------------- | ----- | ----------------------------------------------------------------- |
| `font/weight/regular`  | `400` | Body                                                              |
| `font/weight/medium`   | `500` | Meta、label、Sidebar nav、todo title                              |
| `font/weight/semibold` | `600` | Card title、active nav、btn-primary、numbers、hero h1、section h2 |

> ⚠️ **為什麼只有 3 階 weight**：Figma 對 Variable Font 只取標準 9 階（100/200/.../900），無法跑任意 weight 數值（如 450、550）。為了讓 Figma 與 codebase 1:1 對齊，原本規劃的 `book (450)` 與 `book-bold (550)` 已併入 `medium (500)` 與 `semibold (600)`，兩邊統一使用 Inter static weights。

### 2.4 Line Height

| Token                      | Value  | 用途          |
| -------------------------- | ------ | ------------- |
| `font/line-height/tight`   | `1.1`  | 大數字        |
| `font/line-height/snug`    | `1.15` | Hero h1       |
| `font/line-height/normal`  | `1.2`  | 標題          |
| `font/line-height/relaxed` | `1.3`  | Todo title    |
| `font/line-height/loose`   | `1.5`  | **預設 body** |

### 2.5 Letter Spacing

| Token                          | Value      | 用途                                 |
| ------------------------------ | ---------- | ------------------------------------ |
| `font/letter-spacing/tightest` | `-0.025em` | Hero h1、card num                    |
| `font/letter-spacing/tighter`  | `-0.02em`  | KPI num、weather temp、date pill num |
| `font/letter-spacing/tight`    | `-0.01em`  | Section h2、card title 局部          |
| `font/letter-spacing/snug`     | `-0.005em` | **預設 body**                        |
| `font/letter-spacing/normal`   | `0`        | —                                    |
| `font/letter-spacing/wide`     | `0.02em`   | Kbd                                  |
| `font/letter-spacing/wider`    | `0.04em`   | Cal day-of-week                      |
| `font/letter-spacing/widest`   | `0.08em`   | Section eyebrow（uppercase）         |

### 2.6 Composed Text Styles（→ Figma Text Styles）

> Figma Variables 不能組合「字級 + 字重 + 字距 + 行高」。所以這層要在 Figma 建成 **Text Styles**（內部可以引用各 atom variable）。

| Style 名稱        | Family | Size | Weight | Line | Letter   | 用途                                                                         |
| ----------------- | ------ | ---- | ------ | ---- | -------- | ---------------------------------------------------------------------------- |
| `text/display/lg` | sans   | 28   | 600    | 1.15 | -0.025em | Hero h1                                                                      |
| `text/display/md` | sans   | 28   | 600    | 1.1  | -0.025em | Card num（finance、kpi 大版）                                                |
| `text/heading/lg` | sans   | 22   | 600    | 1.1  | -0.02em  | Secondary num                                                                |
| `text/heading/md` | sans   | 18   | 600    | 1.2  | -0.01em  | Section h2、ds h2                                                            |
| `text/heading/sm` | sans   | 13   | 600    | 1.2  | -0.005em | Card title                                                                   |
| `text/body/base`  | sans   | 14   | 400    | 1.5  | -0.005em | **Body 預設**                                                                |
| `text/body/sm`    | sans   | 14   | 500    | 1.3  | -0.005em | Todo title、sidebar nav、search input、btn-primary、hero p（13.5 → 14 統一） |
| `text/label/md`   | sans   | 12   | 500    | 1.2  | 0        | KPI label                                                                    |
| `text/label/sm`   | sans   | 11.5 | 500    | 1.2  | 0        | Meta                                                                         |
| `text/eyebrow`    | sans   | 10   | 600    | 1.2  | 0.08em   | Section eyebrow（uppercase）                                                 |
| `text/tag`        | sans   | 10.5 | 500    | 1.2  | 0        | Tag、badge                                                                   |
| `text/code`       | mono   | 11.5 | 400    | 1.4  | 0        | Kbd、code                                                                    |
| `text/num/lg`     | sans   | 28   | 600    | 1.1  | -0.025em | Card 主數字（含 `font-variant-numeric: tabular-nums`）                       |
| `text/num/md`     | sans   | 24   | 600    | 1.1  | -0.02em  | KPI 數字                                                                     |

> Donut 中心、mood avg 22 / 600 / 1.1 / -0.02em 的樣式 alias 到 `text/heading/lg`（規格相同，避免重複定義）。

> 數字相關的 styles 都要**強制 tabular-nums**（OpenType `tnum`），確保金額對齊。Figma Text Style 裡用 OpenType 設定打開 `tnum`。

### 2.7 中文字處理策略

> Codebase 透過 `font-family` fallback chain 處理中文：`Inter → ... → PingFang TC → Noto Sans TC`。瀏覽器會 **per-character fallback** — 英文字用 Inter、中文字自動 fallback 到 PingFang TC（macOS）或 Noto Sans TC（其他 OS），同一個 class 通吃中英混排，**codebase 端不需要切換 style**。

> **Figma 端：不建 `text/zh/*` 對應 styles**。理由：
>
> - Figma 一個 text node 只能掛一個 family，無法複製 browser 的 per-character fallback 行為。
> - 維護兩套鏡像 styles（en + zh）成本高，每次調整 size/lh/ls 都要改兩份。
> - Dayboard 以英文 UI 為主，中文內容為偶發（用戶輸入、tag 名稱等），不值得為 Figma 預覽精準度建整套對應 styles。
>
> **代價**：Figma 設計稿內的中文字會交給 Figma 內建 fallback 渲染，視覺不可控（可能是 Noto Sans TC、PingFang TC 或其他系統字體）。設計師審查中文版面時，**以實機瀏覽器渲染為準**，不以 Figma 預覽為準。
>
> **未來如需要**：若 Dayboard 出現大量中文內容、或需要為中文做 typography 微調（例如 line-height 加大、字距調整），再回頭建 `text/zh/*` styles。當前以英文 styles 為單一事實來源。

---

## 3. 間距系統

### 3.1 Spacing Scale（8-pt grid base）

| Token        | Value | 用途                                         |
| ------------ | ----- | -------------------------------------------- |
| `spacing/0`  | `0`   | —                                            |
| `spacing/2`  | `2`   | Tag padding-y、icon-btn dot offset           |
| `spacing/4`  | `4`   | Cal-day inner gap、tag padding-y             |
| `spacing/6`  | `6`   | Hero greet margin、icon gap                  |
| `spacing/8`  | `8`   | 卡片內小 gap、tag padding-x                  |
| `spacing/10` | `10`  | Card-h gap、btn icon gap                     |
| `spacing/12` | `12`  | Sidebar foot padding、mobile dash gap        |
| `spacing/14` | `14`  | Card gap on tablet、quick-btn padding        |
| `spacing/16` | `16`  | **預設 dash-grid gap**、card gap on mobile L |
| `spacing/18` | `18`  | **預設 card padding**                        |
| `spacing/22` | `22`  | Padding on tablet                            |
| `spacing/24` | `24`  | Padding on desktop（narrow）                 |
| `spacing/28` | `28`  | **預設 main padding（desktop）**             |
| `spacing/40` | `40`  | （預留：未來 modal）                         |
| `spacing/60` | `60`  | DS page bottom padding                       |

> Base unit = 8 px，但允許 4 / 6 / 10 / 14 / 22 等密度微調值。設計師要新增 spacing 時優先選 8 的倍數，否則需要在 PR 說明理由。

### 3.2 Sidebar Width

| Token                  | Value | 適用             |
| ---------------------- | ----- | ---------------- |
| `spacing/sidebar/full` | `232` | Desktop          |
| `spacing/sidebar/rail` | `72`  | Tablet           |
| `spacing/sidebar/none` | `0`   | Mobile（drawer） |

---

## 4. 圓角系統

| Token         | Value | 用途                                                            |
| ------------- | ----- | --------------------------------------------------------------- |
| `radius/none` | `0`   | —                                                               |
| `radius/xs`   | `2`   | Bar-rect、heatmap cell、legend dot                              |
| `radius/sm`   | `4`   | Spark legend swatch、kbd、heatmap cell hover                    |
| `radius/md`   | `5`   | Theme toggle button                                             |
| `radius/lg`   | `6`   | Tag、todo check、tab button、quick-btn、tooltip = `radius/chip` |
| `radius/lg-2` | `7`   | Brand mark、kpi-icon、twk-field                                 |
| `radius/xl`   | `8`   | **= radius/card**：card / btn-primary / icon-btn / nav-item     |
| `radius/2xl`  | `14`  | Tweaks panel                                                    |
| `radius/pill` | `999` | Pill / badge / progress bar                                     |

### Aliases（語意化）

| Alias         | 引用            |
| ------------- | --------------- |
| `radius/card` | `{radius/xl}`   |
| `radius/chip` | `{radius/lg}`   |
| `radius/pill` | `{radius/pill}` |

> Figma Variables 用 alias 對接。CSS 端的 `--r-card / --r-chip / --r-pill` 對應這三個。

---

## 5. 陰影系統（→ Figma Effect Styles）

| Token               | Light                                                                     | Dark                                                               |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `shadow/card`       | `0 1px 0 rgba(15,23,42,0.02)`                                             | `0 1px 0 rgba(255,255,255,0.02)`                                   |
| `shadow/hover`      | `0 6px 20px -8px rgba(15,23,42,0.12), 0 2px 4px -2px rgba(15,23,42,0.06)` | `0 8px 24px -8px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.35)` |
| `shadow/popover`    | `0 1px 0 rgba(255,255,255,.5) inset, 0 12px 40px rgba(0,0,0,.18)`         | 同 Light                                                           |
| `shadow/tooltip`    | `0 4px 12px rgba(0,0,0,.18)`                                              | 同 Light                                                           |
| `shadow/submit-btn` | `0 1px 2px rgba(0,0,0,.04)`                                               | 不適用                                                             |

> **匯入策略**：每條 shadow token 在 Figma 建一個 Effect Style，Light/Dark 用兩個 effect style，命名 `shadow/card-light`、`shadow/card-dark`，**或**用 Figma 的 mode-aware effect（需要 enterprise plan）。

---

## 6. 網格 / 佈局

### 6.1 Grid

| Token              | Value          |
| ------------------ | -------------- |
| `grid/columns`     | `12`           |
| `grid/gap/default` | `{spacing/16}` |
| `grid/gap/tablet`  | `{spacing/14}` |
| `grid/gap/mobile`  | `{spacing/12}` |
| `layout/max-width` | `1500`         |

### 6.2 Card Spans（Bento 配置）

| Token     | Value        | 用途                     |
| --------- | ------------ | ------------------------ |
| `span/3`  | `3 columns`  | KPI mini                 |
| `span/4`  | `4 columns`  | Spend / Goals / QuickAdd |
| `span/5`  | `5 columns`  | Todo / Calendar          |
| `span/6`  | `6 columns`  | Tablet KPI               |
| `span/7`  | `7 columns`  | Finance                  |
| `span/8`  | `8 columns`  | Mood + heatmap           |
| `span/12` | `12 columns` | Hero、全寬               |

### 6.3 Breakpoints

| Token                       | Value  | 名稱              |
| --------------------------- | ------ | ----------------- |
| `breakpoint/desktop`        | `1280` | Desktop（large）  |
| `breakpoint/desktop-narrow` | `1024` | Desktop（narrow） |
| `breakpoint/tablet`         | `768`  | Tablet            |
| `breakpoint/mobile-l`       | `480`  | Mobile（large）   |

> Breakpoints 是 max-width 寫法（`@media (max-width: 1279px)` 等），所以這些值是「下一級的下緣 - 1」。Figma 的 Frame 寬度設成這些值方便預覽 RWD。

---

## 7. 圖示系統

| Token            | Value | 用途                                         |
| ---------------- | ----- | -------------------------------------------- |
| `icon/size/xs`   | `11`  | Todo time inline icon                        |
| `icon/size/sm`   | `13`  | Card-act                                     |
| `icon/size/md`   | `14`  | Tooltip 內 icon                              |
| `icon/size/base` | `16`  | **預設**：card title、quick-btn、btn-primary |
| `icon/size/lg`   | `17`  | Sidebar nav、icon-btn                        |
| `icon/size/xl`   | `18`  | Weather pill                                 |
| `icon/size/2xl`  | `20`  | Mood glyph                                   |
| `icon/size/3xl`  | `22`  | （預留：未來 hero icon）                     |
| `icon/size/4xl`  | `28`  | DS placeholder icon                          |

| Token                 | Value                      |
| --------------------- | -------------------------- |
| `icon/family/regular` | `Phosphor Icons (regular)` |
| `icon/family/bold`    | `Phosphor Icons (bold)`    |

> **Figma 對應**：Phosphor 在 Figma 有官方 plugin，icon size 用 Number Variable 控制元件實例。

---

## 8. 動畫 Tokens（CSS-only，不進 Figma）

> 這層列出來只為文件完整性與工程端對齊，**不會進 Figma Variables**（Figma 沒有 motion variable）。

### 8.1 Duration

| Token                     | Value    | 用途                                  |
| ------------------------- | -------- | ------------------------------------- |
| `motion/duration/instant` | `120ms`  | btn-primary hover transform           |
| `motion/duration/fast`    | `150ms`  | nav-item bg/color、todo bg、card-act  |
| `motion/duration/base`    | `200ms`  | Card hover lift、icon-btn             |
| `motion/duration/slow`    | `250ms`  | Theme toggle knob、theme switch       |
| `motion/duration/slower`  | `350ms`  | Heatmap cell fade、todo strikethrough |
| `motion/duration/long`    | `500ms`  | Card-in（進場）                       |
| `motion/duration/long-2`  | `550ms`  | Bar grow                              |
| `motion/duration/longest` | `900ms`  | CountUp、todo progress                |
| `motion/duration/draw`    | `1100ms` | Line / area chart draw-in             |

### 8.2 Easing

| Token                    | Value                             | 用途                                    |
| ------------------------ | --------------------------------- | --------------------------------------- |
| `motion/easing/standard` | `cubic-bezier(.4, .05, .2, 1)`    | **預設**：theme toggle、todo check、bar |
| `motion/easing/out`      | `cubic-bezier(.2, .8, .2, 1)`     | 卡片進場、heatmap、quick-btn            |
| `motion/easing/spring`   | `cubic-bezier(.34, 1.56, .64, 1)` | Todo check overshoot                    |
| `motion/easing/inout`    | `cubic-bezier(.6, 0, .4, 1)`      | Todo strikethrough                      |

### 8.3 Stagger

| Token                    | Value  | 用途              |
| ------------------------ | ------ | ----------------- |
| `motion/stagger/card`    | `40ms` | Bento 卡片進場    |
| `motion/stagger/bar`     | `28ms` | Chart bar grow    |
| `motion/stagger/heatmap` | `18ms` | Heatmap cell      |
| `motion/stagger/donut`   | `80ms` | Pie donut segment |

---

## 9. Z-index Tokens

| Token       | Value        | 用途                   |
| ----------- | ------------ | ---------------------- |
| `z/base`    | `0`          | —                      |
| `z/sticky`  | `5`          | Tooltip                |
| `z/scrim`   | `25`         | Mobile sidebar 遮罩    |
| `z/sidebar` | `30`         | Sidebar                |
| `z/tweaks`  | `2147483646` | Tweaks panel（最上層） |

---

## 10. Figma Variables JSON 對應建議

### 10.1 Collection 結構

建議在 Figma 開兩個 Collections：

```
Collection 1: Primitives（無 mode）
├── color/blue/*
├── color/gray/*
├── color/gray-dark/*
├── color/green-500
├── color/red-500
└── color/orange-500

Collection 2: Semantic（有 Light / Dark mode）
├── color/primary/*
├── color/surface/*
├── color/border/*
├── color/text/*
├── color/status/*
├── spacing/*（Number，無 mode）
├── radius/*（Number，無 mode）
├── font/size/*（Number，無 mode）
├── font/weight/*（Number，無 mode）
├── font/line-height/*（Number，無 mode）
└── font/letter-spacing/*（Number，無 mode）
```

### 10.2 預期 JSON 結構（範例）

```json
{
  "color": {
    "primary": {
      "default": {
        "$type": "color",
        "$value": {
          "light": "#0E4FE7",
          "dark": "#0E4FE7"
        }
      },
      "soft": {
        "$type": "color",
        "$value": {
          "light": "#BADDFF",
          "dark": "#1A2B5C"
        }
      }
    }
  },
  "spacing": {
    "16": { "$type": "number", "$value": 16 }
  },
  "radius": {
    "card": { "$type": "number", "$value": 8 }
  }
}
```

> Figma 官方 import format 細節參考：[Figma Variables REST API](https://www.figma.com/developers/api#variables) 與 community plugin **Tokens Studio for Figma**。建議用 Tokens Studio plugin 匯入，它對 W3C Design Tokens Format 支援好。

### 10.3 Text Styles / Effect Styles 在 Figma 端建立

不能用 Variables，要在 Figma 手動建立：

- **Text Styles**：照 §2.6 的 14 個 styles 建立。
- **Effect Styles**：照 §5 的 5 條 shadow 建立（Light / Dark 各一份，或用 mode-aware）。

---

## 11. 決議紀錄

v0.1 起草時列出的 6 項待確認，全部已拍板。本節作為決策歷史保留，新的 token 規格直接看 §1 ~ §9。

| #    | 議題                                                    | 決議                                                                                     | 落點       |
| ---- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| 11.1 | Tag / delta 半透明背景 token 化                         | ✅ 新增 `status/positive-bg`、`negative-bg`、`warning-bg`，`.tag.life` 從 12% 統一改 14% | §1.2       |
| 11.2 | 字級 13.5 統一                                          | ✅ 統一到 `14`（影響 nav、todo title、search、btn-primary、hero p）；card title 維持 13  | §2.2、§2.6 |
| 11.3 | 字重 450 / 550 保留                                     | ✅ 保留（design intent 清楚），需用 Inter Variable Font                                  | §2.3       |
| 11.4 | Mood heatmap 5 階凍結                                   | ✅ Light/Dark 共 10 個 hex 已 freeze（Chrome canvas 實算）                               | §1.3       |
| 11.5 | Tag work/life/health 配色規則化                         | ✅ 7 類 tag mapping 定義，並建立「不為單一 tag 引入新色」規則                            | §1.4       |
| 11.6 | 預留 focus / disabled / overlay / selection / scrollbar | ✅ 全部預留並指定初值                                                                    | §1.5       |

### 額外修正

- **Status hex 精算**：原本是 OKLCH approximate（`#2EAA68` / `#DC5740` / `#C99550`），改為 Chrome 實算（`#28AD5E` / `#E64343` / `#E38F00`）。對應 status-bg rgba 同步更新。

---

## 變更紀錄

| 日期       | 版本   | 變更                                                                                                                                                                                                                                                                                         |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-09 | v0.1   | 初版 design tokens；對應 Figma Variables JSON 格式架構                                                                                                                                                                                                                                       |
| 2026-05-10 | v0.1.1 | 新增 `color/status/positive-bg`、`negative-bg`、`warning-bg`（rgba 14% alpha），統一 `.tag.life` 從 12% 改為 14%                                                                                                                                                                             |
| 2026-05-10 | v0.2   | 字級 13.5 → 14 統一；字重 450/550 保留；新增 mood heatmap 5 階凍結 hex（§1.3）；新增 7 類 tag mapping（§1.4）；新增 interaction/state tokens 共 10 個（§1.5）；status 色 hex 從 OKLCH approx 改為 Chrome 實算                                                                                |
| 2026-05-12 | v0.2.1 | 移除 `text/num/sm`（§2.6）對齊 Figma：原規格 22/600/1.1/-0.02em 與 `text/heading/lg` 完全相同，donut center 與 mood avg 改 alias 到 `text/heading/lg`，避免重複定義                                                                                                                          |
| 2026-05-12 | v0.2.2 | Weight 450 / 550 拍掉：Figma 對 Variable Font 只取標準 9 階，無法跑任意 weight。§2.3 移除 `font/weight/book` 與 `font/weight/book-bold`；§2.6 `text/body/sm` 改 500、`text/heading/sm` 改 600；`styles.css` 同步換完 9 處                                                                    |
| 2026-05-12 | v0.3   | 同步 Figma 把 💎 Components page 14 個誤用 Inter Bold 32px 的 section title 改為 Semi Bold；§2.7 確立「Figma 端不建 `text/zh/*` 對應 styles」策略，中文字交由 codebase 的 `font-family` fallback chain 處理（per-character browser fallback），Figma 端中文預覽不可控但 token 一致性不受影響 |

---

## 相關文件

- `design-principles.md` — 6 條設計原則與品牌調性
- `PRD.md` — 產品規格與 roadmap
- `CLAUDE.md` — 技術架構與開發規範
- `/design-system` 頁面 — 即時 token 預覽
