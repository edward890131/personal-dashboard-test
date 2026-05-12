# Dayboard Design Principles · 設計原則

> 版本：v0.1（2026-05-09）  
> 適用：Dayboard 個人生活儀表板  
> 對象：未來自己 / 協作者 / AI 助理在做設計或前端決策時，用這份文件對齊基準。

---

## 為什麼需要設計原則

Dayboard 不是 portfolio piece，是 Yuu **每天會主動打開**的日常工具。當「自由度高、需求模糊、自己當客戶」時，最容易飄走的就是設計一致性。原則的作用不是限制創意，是讓每個微小決策（要不要加陰影、要不要加 emoji、按鈕要不要 hover 變色）都能回到同一個立場。

每個原則都包含：**標語、為什麼、怎麼落實、反例**。需要做新元件 / 新頁面前，請先讀過一遍。

---

## 1. Daily Companion · 為日常打開而設計

> **天天打開的工具，跟季度報告 dashboard 不一樣。**

### 為什麼

這是個人 LifeOS，不是給高層看的數據簡報。它的成功標準是「Yuu 早上會主動打開、不打開會覺得少了什麼」。所以視覺上要鮮活、有時間感、有自己的人味；功能上要對「現在」有用，不是「總結過去一季」。

### 怎麼落實

- **時間感**：Hero 問候依時段（早安 / 午安 / 下午好 / 晚安）；KPI 數字 CountUp 動畫；mood heatmap 最後一格即時跟隨今日選擇。
- **個人化的小儀式**：「鎮瑜」後面那個 `.` accent dot 用主色；Avatar 用名字首字（鎮）。這些細節讓畫面感覺是「Yuu's workspace」，不是 generic dashboard template。
- **關注「今日」的權重**：今日待辦、本週行程在主要位置；年度目標 / 月度趨勢往下排。

### 反例 ❌

- ❌ 用「Welcome back, User」這種 generic 問候。
- ❌ 全部是月度 / 季度數字、沒有「今天」的視角。
- ❌ 為了商務感把 accent dot 拿掉。

---

## 2. Information First, Decoration Last · 資訊優先，裝飾其次

> **每個視覺元素都要為資訊服務，否則就是雜訊。**

### 為什麼

Bento 一頁要塞 11 張卡片。如果每張都加漸層、emoji、illustration，整頁就會視覺爆炸。資訊密集的介面，能省的視覺都要省。

### 怎麼落實

- **數字用 tabular-nums**：所有 KPI、金額、百分比都對齊。
- **層級靠字級與顏色，不靠裝飾**：標題 13–14 px / 600、主數字 24–28 px / 600、meta 11.5 px / 500、muted 灰。
- **顏色服務語意**：綠 = 收入 / 正向、紅 = 支出 / 警示、橙 = 提醒、藍 = 主要 / 進度。**不為了好看而上色**。
- **動畫只在「值改變」時動**：CountUp 在數字變化、draw-in 在資料載入；不做純裝飾的 hover 漸變、不做 loop 動畫。

### 反例 ❌

- ❌ 為了「不要太空」加裝飾插圖、emoji、徽章。
- ❌ 用漸層底背景塞滿卡片。
- ❌ 5 種以上不同色彩同時出現在一張卡片。
- ❌ 用 micro-interaction loop（如脈動光點）吸引注意，而那裡沒新資訊。

---

## 3. Calm Density · 冷靜的密度

> **塞得多，但不擁擠。比 Notion 多一點資訊，比 Bloomberg 少一半噪音。**

### 為什麼

個人 dashboard 的價值在「一眼看完」。但塞太多會讓使用者掃不下去；塞太少又每天打開覺得無聊。要走 middle ground — 高密度，但留白足夠讓眼睛喘息。

### 怎麼落實

- **Bento 12 欄、卡片 spans**：KPI 用 3 欄（4 顆並排）、主要卡片 4–7 欄、Hero/全寬 12 欄。卡片內部 padding 18 px，gap 16 px — 留白足夠但不浪費。
- **4 層 surface**：`--bg`（頁底）→ `--surface`（卡片）→ `--surface-2`（卡片內次層）→ `--surface-hover`（互動）。用層次取代分隔線。
- **互動才浮起**：卡片預設極淡陰影（`--shadow-card`），hover 才浮起（`--shadow-hover`）+ 邊線加深。靜態時保持平靜。
- **漸進揭露**：每張卡片只露最重要的數字 + 一條 sparkline + meta；要看細節點進對應頁面。

### 反例 ❌

- ❌ 為了「設計感」把 padding 加到 32 px、卡片之間留 32 px gap，整頁變稀疏。
- ❌ 反過來把所有卡片都塞滿表格 / 圖表 / 數字，沒有呼吸感。
- ❌ 用粗分隔線、深色卡片邊框切割版面 — 用 surface 層次取代。

---

## 4. Token-Driven, Not Pixel-Pushed · 系統先於畫面

> **改主色只動一行 token。如果發現自己在多個地方寫同一個 hex，就是該抽 token。**

### 為什麼

這是個會持續長大的個人專案，現在 100 行樣式、半年後可能 3000 行。如果一開始就 hard-code 像素 / hex，重構成本會指數級成長。設計系統不是 nice-to-have，是長壽的前提。

### 怎麼落實

- **所有色彩、字級、圓角、陰影走 CSS custom properties**（`--primary`、`--surface`、`--r-card`、`--shadow-card` …）。
- **新元件先檢查 design system 有沒有 token 可用**；要新增 token 就一定要去 `/design-system` 加範例。
- **`/design-system` 頁面是 token 的對外索引**：visual source of truth。任何時候打開都能看到目前真實的 token 樣貌。
- **JS 端的設計參數透過 Tweaks panel 暴露**（深色模式、字體、圖表樣式），讓設計探索是 first-class action 不是改 code。

### 反例 ❌

- ❌ 在元件裡寫 `style={{ color: "#0E4FE7" }}` 而不是 `var(--primary)`。
- ❌ 加新 design token 但沒在 `/design-system` 補範例。
- ❌ 為了「這次特別」直接寫 magic number padding / margin。
- ❌ 同一個 button variant 在三個地方寫了三次樣式而不是抽 class。

---

## 5. Quiet Confidence · 內斂的自信

> **飽和，但克制。明確，但不大聲。**

### 為什麼

這是 Yuu 個人工具，要表達的是「我是一個對細節有想法的設計師」，不是「看我會用多少特效」。視覺上要展現專業度，但不靠浮誇手法。

### 怎麼落實

- **Brand 藍 `#0E4FE7` 飽和但純粹**：不用漸層、不加 glow、不疊半透明圖層。一個顏色就能撐住。
- **Hairline borders**（0.5–1 px）：分隔靠細線而非粗框。
- **Ink 不純黑**（`#0B1220`）、Dark mode bg 不全黑（`#0A0D12`）：黑色太硬，輕微藍灰更柔和。
- **Status 色精準**：只有綠（收入 / 達標）、紅（支出 / 警示）、橙（提醒）三種，每個都有明確語意。不用其他色「換口味」。
- **字體微縮**（letter-spacing -0.005 至 -0.025em）：標題收緊、body 略收，讓排版緊實但不擠。
- **Mono 字體點綴**：JetBrains Mono 只用在 kbd、code、tabular-nums 數字，少量出現製造工程質感。

### 反例 ❌

- ❌ 用霓虹色 / 螢光 / `text-shadow: 0 0 20px` 之類的特效。
- ❌ 用多種品牌色（紫 + 藍 + 粉漸層），一個 brand color 就夠。
- ❌ 用粗 box-shadow、強烈陰影、Material Design 那種多層 elevation。
- ❌ 大寫英文（`UPPERCASE`）通用化 — 只用在 section eyebrow 等微小標籤。
- ❌ 帶顏色的 emoji 當 icon。

---

## 6. Tactile, Not Flat · 有觸感的層次

> **不擬物（skeuomorphic），但也不純 flat。物件是「可以摸的卡片」，不是「印在紙上的色塊」。**

### 為什麼

2010s 後期 flat design 之後，過度 flat 的介面失去了「這個東西可以互動」的暗示。我們要保留視覺層次，讓 hover、active、focus 有實感反饋，但不走 skeuomorphic 老派風格。

### 怎麼落實

- **4 層 surface 的 z-axis 暗示**：`--bg` 後退、`--surface` 浮起、`--surface-2` 內凹、`--surface-hover` 即將互動。
- **Hover 真的「浮起來」**：`transform: translateY(-2px) + box-shadow 加深 + border 加深`。三個變化同時發生，動 200 ms。
- **Glass 元素留給浮動工具**：Tweaks panel 用 `backdrop-filter: blur(24px) saturate(160%)`。一般卡片不用 glass 維持平實。
- **微小但確定的 motion**：todo 勾選 checkmark cubic-bezier 帶 overshoot；hue toggle knob 用 cubic-bezier(.4,.05,.2,1) 順滑；CountUp ease-out 900 ms。動畫曲線都有「物理感」。
- **Iconography 走 outline**：Phosphor regular 為主、bold 為強調。線條 icon 比 fill icon 更柔和不喧賓奪主。

### 反例 ❌

- ❌ 卡片完全 flat、無陰影、無 hover 反饋。
- ❌ 反過來用 1990s 桌面那種立體 button、內凹外凸 bevel。
- ❌ 動畫用 linear easing — 真實世界沒有 linear 運動。
- ❌ 通篇 fill icon — 太重。

---

## 7. Figma-Code Parity · 設計系統雙向同步

> **Figma 與 Code 是同一套設計系統的兩種呈現。同步時走 Token / Component，不走 hard-coded。**

### 為什麼

第 4 條 Token-Driven 講的是 codebase 內部的紀律；但設計系統的價值，在 **Figma 與 Code 雙向對齊**時才會真正放大。如果把 App 畫面同步到 Figma 時用了 hard-coded 顏色、複製貼上的元件，等於把 codebase 已經建立的 token 紀律重新破壞一次，下次再從 Figma 拉回 code 也會跟著走樣，最後 Figma 與真實產品永遠對不上。

### 怎麼落實

**Code → Figma**（用 `/figma-generate-design`、`use_figma` 等寫入 Figma 畫布的操作）：

- **動工前先盤點**：用 `search_design_system` 或 `get_libraries` 確認 Figma 已有哪些 Variables / Components 可用。
- **顏色、間距、字級、圓角、陰影一律綁定 Figma Variables / Styles**，禁止直接填 hex 或像素值。
- **按鈕、輸入框、卡片、Modal 等元素一律引用既有 Component Library 實例**，不重新繪製或複製貼上。
- **遇到 Figma 沒有定義的 Token / Component**：
  1. **暫停寫入**，不要用 hard-coded 值或自製元件繞過。
  2. **明確告知缺少什麼**（哪個 Token / Component、用在哪、為什麼需要）。
  3. **提出建議方案**（先在 Figma 補建、沿用相近現有 Token、或調整設計匹配既有系統）。
  4. **等 Yuu 決策後再繼續**。

**Figma → Code**（用 `/figma-implement-design` 把設計稿轉成程式碼）：

- **優先使用 codebase 既有 components**（`src/components/...`），不重複造輪子。
- **樣式優先綁 CSS custom properties / token**（`var(--primary)`、`var(--surface)`…），不寫死。
- **若 Figma 端用了 hard-coded 值**，視為設計系統缺漏，回報並建議補上 token 後再實作。

### 反例 ❌

- ❌ 把 App 頁面寫進 Figma 時，矩形填色用 `#0E4FE7` 而不是 `color/primary` variable。
- ❌ Figma 缺少 `Card` component，就在畫布上自己畫一個矩形 + 陰影湊出來。
- ❌ 從 Figma 實作回 code 時，看到設計稿寫 `padding: 12px` 就直接 hard-code，沒回頭問是否該綁 `--space-3`。
- ❌ 為了「先把畫面同步出來」忽略 Token 缺漏，事後再補 —— 結果永遠不會補。

### 執行流程（具體怎麼做）

**檢查 token 對齊：**

```bash
npm run figma:diff
```

讀 `tokens/*.json` 與 `tokens/figma-snapshot.json` 做 diff，輸出 `reports/drift-{YYYY-MM-DD}.md`。**0 個 drift** 才算對齊。

**更新 Figma snapshot**（拉最新 Variables 狀態）：

不是 Node script —— 在對話中跟 AI 說「幫我更新 figma-snapshot」，AI 會透過 Figma MCP 的 `use_figma` 跑 `figma.variables.getLocalVariableCollectionsAsync()`，把結果寫回 `tokens/figma-snapshot.json`。設計師在 Figma 端改完 Variables 後，先更新 snapshot 再跑 diff。

**Figma → Code（拉設計稿做實作）：**

1. 用 `/figma-implement-design` 或 `get_design_context` 取 Figma node。
2. **先讀 `figma-mapping.md`**，找對應的 codebase component。
3. 用既有 component import，**不重新繪製或自製樣式**。
4. 若 Figma node 找不到對應 → 暫停 → 問 Yuu。

**Code → Figma（把畫面同步到 Figma）：**

1. 動工前用 `search_design_system` / `get_libraries` 盤點 Figma 已有的 Variables / Components。
2. 樣式綁定 Figma Variables、元件引用既有 Component Library 實例。
3. 缺漏走上面第 4 個「怎麼落實」內的處理流程。

**相關檔案速查：**

| 檔案                                            | 用途                                    |
| ----------------------------------------------- | --------------------------------------- |
| `tokens/{primitives,semantics,device}.json`     | Code 端 token SoT                       |
| `tokens/figma-snapshot.json`                    | Figma 端 audit log（AI 維護）           |
| `scripts/{token-adapter,check-token-drift}.mjs` | Drift 工具                              |
| `figma-mapping.md`                              | Component 對應字典（取代 Code Connect） |
| `figma-token-alignment.md`                      | 對齊狀態報告（手動更新）                |
| `reports/drift-*.md`                            | Diff 報告（自動產生）                   |

---

## 品牌調性 · Brand Tonality

如果 Dayboard 是一個人，他會是：

- **設計師、工程師混血**：對視覺敏感，也理解資料與系統。
- **30 歲上下、亞洲、住在城市**：Inter + Noto Sans TC 的雙語自然，PingFang fallback 避免中文糊掉。
- **內向但不羞澀**：話不多，但說的每句都清楚。介面靜默運作（不彈通知、不催促），需要時才出聲。
- **重儀式感、不愛喧鬧**：早上打開時的問候、accent dot、CountUp — 這些細節讓使用感受像「咖啡廳常去的位子」，不是「機場 lounge」。
- **誠實，不假**：不會用「Discover the power of...」這種行銷腔。資訊就是資訊，數字就是數字。
- **像 Linear、Notion，不像 SAP / Salesforce**：產品感、密度感、設計感，不是企業表單系統。

### 適合的形容詞

冷靜、清楚、緊實、有質感、可靠、低調、自信、有秩序

### 不適合的形容詞

活潑、可愛、創新、前衛、搞笑、療癒、輕鬆、年輕

---

## 基礎視覺語言 · Visual Language Foundation

完整 token spec 在 `/design-system` 頁面，這裡只列高層原則。

### 色彩

- **單一 brand 色**：`#0E4FE7`（飽和靛藍）。Soft `#BADDFF` 給淺底、Ink `#122559` 給深字。
- **中性色為主**：UI 90% 是灰階（bg / surface 三層、ink 三層、border 三層），只有 10% 是 brand 色與狀態色。
- **狀態色三色**：綠 / 紅 / 橙，承擔「正向 / 警示 / 提醒」三種語意。不擴張到第四色。
- **深色模式不是反色**：每層 token 在 dark 都重新定義；brand 色維持同色，soft / ink 用 `color-mix(in oklch, ...)` 衍生。

### 字體

- **Sans 主力 Inter**：中性、開放、現代。中文 fallback PingFang TC / Noto Sans TC。
- **Mono 點綴 JetBrains Mono**：kbd、code、tabular-nums 數字。出現量 < 5%。
- **字級階梯**：28 / 24 / 18 / 14 / 13 / 11.5 / 10.5 / 10 — 七階，覆蓋 hero → micro label。
- **字重**：400 / 450 / 500 / 550 / 600 — 五階，主要區別在 nav (450)、card title (550)、num (600)。
- **微縮字距**：標題 -0.025em、body -0.005em。讓排版視覺收緊。

### 形狀 · Shape

- **圓角**：8 px（卡片 / button）、6 px（chip / tag）、999 px（pill / badge）。**不用 4 px 以下的銳角**，也不用全圓 16+ px 的「軟糖感」。
- **邊線**：0.5–1 px hairline。深色模式用較深的 border 維持對比。
- **陰影**：兩階 — `--shadow-card`（極淺，靜態）、`--shadow-hover`（浮起，互動）。**不用 Material Design 五階 elevation**。

### 間距 · Spacing

- **8 點 grid 為基礎**（4 / 8 / 12 / 14 / 16 / 18 / 22 / 28 px）。
- **卡片內 padding 18 px、卡片間 gap 16 px** 為主流。
- **Sidebar 寬 232 px**（desktop），是版面的視覺錨點。

### 動畫 · Motion

- **進場 stagger**：bento 卡片每張延遲 40 ms，第 12 張 440 ms 進完。
- **CountUp ease-out 900 ms**（cubic 曲線）。
- **圖表 draw-in 1100 ms**（line / area），bar grow 550 ms 帶 stagger 28 ms。
- **Hover transition 150–200 ms**（短而確定）。
- **Easing 預設**：`cubic-bezier(.4, .05, .2, 1)` — 接近 ease-out，物理感強。**避免 linear**。

### 圖示 · Iconography

- **Phosphor Icons 統一**：regular（線條）為主、bold 為強調。
- **大小**：16–18 px 配 14 px body、20 px 配大標題、22 px 配 mood pick。
- **不混用其他圖示集**（Lucide / Heroicons / Material），避免線條風格衝突。
- **不用 emoji 當 icon**。

### 排版 · Layout

- **Bento 12 欄 grid**：spans 用 3 / 4 / 5 / 7 / 8 / 12（KPI / 半寬卡片 / 主要卡 / 全寬）。
- **內容區 max-width 1500 px**：避免在大螢幕橫向過寬。
- **RWD 5 個斷點**：見 PRD §8。手機改為單欄、sidebar 變抽屜。

---

## 套用原則的決策路徑

當你（或 AI 助理）面對一個設計決策時，依序問：

1. **這對「天天打開」的體驗有幫助嗎？**（原則 1）
2. **這是為了資訊還是為了裝飾？**（原則 2）
3. **加了這個元素，整頁的密度會變得擁擠嗎？**（原則 3）
4. **這個值是 token 還是 magic number？**（原則 4）
5. **這個視覺手法會不會太大聲？**（原則 5）
6. **互動有沒有合理的物理感反饋？**（原則 6）

六題都過了，就動手。任何一題卡住，先回來討論。

---

## 變更紀錄

| 日期       | 版本 | 變更                                                                              |
| ---------- | ---- | --------------------------------------------------------------------------------- |
| 2026-05-09 | v0.1 | 初版設計原則：6 條核心原則 + 品牌調性 + 基礎視覺語言                              |
| 2026-05-11 | v0.2 | 新增第 7 條原則「Figma-Code Parity · 設計系統雙向同步」，含執行流程與相關檔案速查 |

---

## 相關文件

- `PRD.md` — 產品規格與 roadmap
- `CLAUDE.md` — 技術架構與開發規範
- `/design-system` 頁面 — 即時 token 與元件預覽（執行 `npm run dev` 後訪問）
