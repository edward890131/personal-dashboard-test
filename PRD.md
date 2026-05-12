# Dayboard PRD · 個人生活儀表板

> 版本：v0.1（2026-05-09 起草）  
> 對象：產品 owner = Yuu，本文件供未來自己 / 協作者 / AI 助理參考。

---

## 1. 產品定位

**Dayboard** 是 Yuu 的個人 LifeOS 入口，把日常生活的多個面向（待辦、行事曆、財務、目標、心情）整合成一張 bento 儀表板。打開瀏覽器一眼能看到「今天該關心什麼」，不需要在 5 個 App 之間切。

### 願景

- **Single source of truth**：日常生活資訊不用分散在 Notion、Google Calendar、Notes、記帳 App。
- **設計師的 daily driver**：兼顧資訊密度與美感，是 Yuu 自己每天會主動打開的工具。
- **可演化的 LifeOS 雛形**：未來能接 API、做 AI 摘要、跨裝置同步。

### 不做什麼（v0.1 範圍外）

- 多用戶 / 帳號系統 — 目前只服務 Yuu 一人。
- 雲端同步 — 資料先 hard-code，之後再接 Notion/Supabase。
- 商業化 / 推廣 — 純個人工具。

---

## 2. 目標用戶

**主要用戶**：楊鎮瑜 Yuu（中階產品設計師、果思設計），每天一杯咖啡 + 早安儀式時打開。

**使用情境**：
| 時段 | 行為 | 主要看什麼 |
|------|------|-----------|
| 早上 | 一杯咖啡時開瀏覽器 | Hero greeting、今日待辦、本週行程、心情 |
| 中午 | 確認下午會議 | Calendar 時間軸 |
| 下班 | 紀錄當天心情 | Mood pick、Quick add |
| 月底 | 看財務 | Finance trend、Spend donut、年度目標達成率 |

---

## 3. 設計原則

1. **資訊密度高，但不擁擠**  
   Bento grid 12 欄，KPI 用 3 欄、主要卡片 4-7 欄。每張卡片自帶留白，hover 微微浮起。

2. **Token 驅動，不寫 magic number**  
   色彩、字級、圓角、陰影全部走 CSS custom properties（`--primary`、`--surface`、`--r-card` ...）。要改主色只動一行 token。

3. **動畫服務資訊，不喧賓奪主**  
   進場 stagger 40 ms、CountUp ease-out 900 ms、圖表 draw-in 1100 ms。只在「值改變」時動。

4. **深色模式不是黑底白字**  
   每個 token 在 `[data-theme="dark"]` 都重新定義，色階關係保持一致。Primary brand 維持同色，soft / ink 用 `color-mix(in oklch, ...)` 自動衍生。

5. **JavaScript 不 TypeScript**  
   Yuu 是設計師，要降低語法心智負擔，用 `jsconfig.json` + ESLint 補型別感。

---

## 4. 資訊架構

### Sidebar 主導覽

| 區塊     | 項目          | 路由                  | 狀態           |
| -------- | ------------- | --------------------- | -------------- |
| 主要功能 | 儀表板        | `/`                   | ✅ 已實作      |
| 主要功能 | 待辦行事曆    | `/todo`（未實作）     | ⏳ Placeholder |
| 主要功能 | 理財規劃      | `/finance`（未實作）  | ⏳ Placeholder |
| 主要功能 | 年度目標      | `/goals`（未實作）    | ⏳ Placeholder |
| 主要功能 | 每日心情      | `/mood`（未實作）     | ⏳ Placeholder |
| 工具     | Design System | `/design-system`      | ✅ 已實作      |
| 工具     | 統計分析      | `/stats`（未實作）    | ⏳ Placeholder |
| 工具     | 日記筆記      | `/journal`（未實作）  | ⏳ Placeholder |
| 工具     | 設定          | `/settings`（未實作） | ⏳ Placeholder |

### Sidebar 底部

- 主題切換（light / dark）
- 使用者卡片（avatar + 名稱 + email）

### Topbar

- 全域搜尋框（⌘K，目前是純展示，未實作搜尋邏輯）
- Filter icon button
- Notification icon button（含未讀紅點）

---

## 5. 現有功能規格

### 5.1 Hero greeting（s-12）

- **顯示**：依時間問候（夜深了 / 早安 / 午安 / 下午好 / 晚安）+ 名字 + 動態 accent dot；右側天氣藥丸（台北 / 26°C）、日期藥丸、新增按鈕。
- **資料來源**：`new Date()` 即時計算。
- **互動**：「+ 新增」目前無動作（Quick Add 卡片補位）。
- **未來**：問候語客製化、天氣接 OpenWeather、日期點擊跳到 Calendar 頁。

### 5.2 KPI × 4（每張 s-3）

四張小卡：待辦完成率、本月餘額、目標達成率、連續打卡。

- **顯示**：icon + label + 大數字（CountUp 動畫）+ delta badge + sparkline。
- **資料來源**：seed values（hard-coded）。
- **互動**：無（純展示）。
- **未來**：點擊跳對應頁面、長按看歷史趨勢。

### 5.3 Today's todos（s-5）

- **顯示**：當日完成率（CountUp + bar）、todo list（含時間、tag = work/life/health、checkbox）、底部新增列。
- **互動**：點 todo toggle done / undone（含 strike-through 動畫）；底部 input 送出新增 todo。
- **狀態**：local React state（`useState`，重新整理會消失）。
- **未來**：持久化到 Notion 或 IndexedDB、依日期篩選、支援拖曳排序、子任務、提醒。

### 5.4 Finance trend（s-7）

- **顯示**：本期淨餘、收入、支出、圖表（line / area / bar，依 Tweaks chartMode）、週/月/年切換。
- **資料來源**：seed dataset（三組假資料）。
- **互動**：tab 切換期間；hover 顯示 tooltip 與垂直 guide line。
- **未來**：接記帳資料（自動從信用卡 csv import / Notion 資料庫 / Splitwise）、預算 vs 實際、類別下鑽。

### 5.5 Calendar week（s-5）

- **顯示**：本週 7 天（含 today highlight、每日事件 dot）、今日事件時間軸（最多 5 筆，含色條 b1/b2/b3）。
- **互動**：日期可點擊（目前無動作）；月份切換按鈕（無動作）。
- **未來**：接 Google Calendar API、月曆檢視、事件編輯。

### 5.6 Spend donut（s-4）

- **顯示**：5 大類別圓餅（餐飲 / 交通 / 娛樂 / 居家 / 其他）+ 中央總額 + 右側 legend with percentage。
- **未來**：類別自訂、月份切換、與 Finance trend 連動。

### 5.7 Annual goals（s-4）

- **顯示**：4 條年度目標（書、存款、跑步、側專案），每條顯示進度條 + 數字 + 落後/超前狀態。
- **互動**：無。
- **未來**：手動更新進度、自動推算（如連動到記帳資料）、目標達成里程碑通知。

### 5.8 Mood + 30 天 heatmap（s-8）

- **顯示**：今天心情 5 級選擇（雨 / 雲 / 日雲 / 晴 / 朝陽）+ 本月平均 + 30 天 heatmap（5 階色階，依本日選擇即時更新最後一格）。
- **互動**：點 mood button 切換。
- **未來**：心情筆記（搭配 journal）、AI 趨勢分析（連續低落超過 X 天提示休息）、生理數據關聯（睡眠、運動）。

### 5.9 Quick add（s-4）

- **顯示**：4 個快捷按鈕（新增待辦、記支出、新增行程、更新目標）。
- **互動**：目前無動作（純展示）。
- **未來**：點擊開對應 modal 或直接新增、Cmd+K palette 整合。

### 5.10 Tweaks panel（floating，右下）

浮動的設計微調面板，原本是給外部 host（編輯模式）用的，目前在 Vite 環境下常駐顯示。

- **項目**：深色模式 toggle / 字體 select（5 種）/ 收支趨勢樣式 radio（line / area / bar）。
- **持久化**：透過 `__edit_mode_set_keys` postMessage（host 收到後改寫 EDITMODE 區塊）。
- **未來**：改成快捷鍵 (G) 召喚、增加自訂 tweaks（density、grid spacing、accent color picker）。

---

## 6. 設計系統

### 6.1 色彩 Tokens

#### Primary（固定 brand 色）

| Token            | Light     | Dark                                                 |
| ---------------- | --------- | ---------------------------------------------------- |
| `--primary`      | `#0E4FE7` | `#0E4FE7`（同色）                                    |
| `--primary-soft` | `#BADDFF` | `color-mix(in oklch, var(--primary) 22%, var(--bg))` |
| `--primary-ink`  | `#122559` | `color-mix(in oklch, var(--primary) 60%, #ffffff)`   |
| `--primary-fg`   | `#ffffff` | `#ffffff`                                            |

#### 中性 / 語意

- Background / Surface（`--bg`、`--surface`、`--surface-2`、`--surface-hover`）
- Text（`--ink`、`--ink-2`、`--muted`、`--muted-2`、`--faint`）
- Border / Divider（`--border`、`--border-strong`、`--divider`）
- Status（`--pos` 收入綠 / `--neg` 支出紅 / `--warn` 提醒橙）

### 6.2 字體

- Sans 預設 `Inter`，可切 `Geist` / `IBM Plex Sans` / `Noto Sans TC` / `JetBrains Mono`。
- Mono `JetBrains Mono`（kbd、code、tabular-nums）。
- 字級表完整列在 `/design-system` 頁。

### 6.3 元件清單

所有元件範例見 `/design-system`：

- Button（`.btn-primary` / `.card-act` / `.icon-btn`）
- Card（基底 `.card` + variant `.kpi`）
- Badge / Tag / Delta / Kbd
- Input（`.search` / `.todo-add`）
- Tabs（`.tab-row`）
- Progress bar、Sparkline、CountUp
- Donut / PieDonut、ValueChart（line / area / bar）
- Sidebar nav item

### 6.4 圓角 / 陰影 / 動畫

- 圓角：`--r-card: 8px` / `--r-chip: 6px` / `--r-pill: 999px`
- 陰影：`--shadow-card`（極淺）/ `--shadow-hover`（浮起）
- 進場：`card-in 0.5s` + 子卡 stagger 40 ms
- 圖表：`draw 1.1s` / `bar-grow 0.55s` / `donut-sweep 1s` / `hm-fade 0.35s`

---

## 7. 技術架構

| 類別          | 工具                             | 說明                                   |
| ------------- | -------------------------------- | -------------------------------------- |
| 建構          | Vite 6                           | dev server / production bundle         |
| 框架          | React 18                         | JS 不是 TS，搭 jsconfig                |
| 樣式（主）    | `src/styles.css`                 | 1100+ 行，OKLCH + design tokens        |
| 樣式（輔）    | Tailwind v4                      | utility 給未來新元件                   |
| Icon          | `@phosphor-icons/web`            | regular + bold（從 npm 載入 CSS）      |
| 字型          | Google Fonts CDN                 | 在 index.html `<link>`                 |
| Lint / Format | ESLint 9 flat config + Prettier  | 含 `prettier-plugin-tailwindcss`       |
| Git hooks     | Husky + lint-staged              | pre-commit 自動修                      |
| 測試          | Vitest + Testing Library + jsdom | 設定在 `vite.config.js` 的 `test` 區塊 |

### 路由

**輕量 pathname-based routing**（不引入 react-router）：

- `App.jsx` 內 `PATH_TO_ACTIVE` / `ACTIVE_TO_PATH` 雙向表
- 監聽 `popstate` 同步上一頁/下一頁
- Sidebar 點擊 → `history.pushState` + `setActive`
- Vite SPA fallback 讓 `/design-system` 可直接訪問

### 狀態管理

- 元件 local state（`useState`）
- Tweaks 透過 `useTweaks` hook + host postMessage 持久化
- **目前無全域 store**（v0.1 範圍）

---

## 8. RWD 規範

| 斷點       | 區間         | Sidebar                    | Bento 格                |
| ---------- | ------------ | -------------------------- | ----------------------- |
| Desktop 大 | ≥ 1280 px    | 完整 sidebar 232 px        | 12 欄 bento             |
| Desktop 窄 | 1024–1279 px | 完整 sidebar               | 12 欄、padding 縮小     |
| Tablet     | 768–1023 px  | Icon-only rail（72 px）    | 2 up，KPI 6/6/6/6       |
| Mobile L   | 480–767 px   | 抽屜（off-canvas + scrim） | 全部 1 up               |
| Mobile S   | < 480 px     | 抽屜，搜尋摺疊             | KPI 2 up，Heatmap 10 欄 |

---

## 9. 路由規劃（現況 vs 未來）

| 路由             | 狀態              | 預期內容                                       |
| ---------------- | ----------------- | ---------------------------------------------- |
| `/`              | ✅ Dashboard 首頁 | 11 張 bento 卡片                               |
| `/design-system` | ✅ 已實作         | Token + 元件預覽                               |
| `/todo`          | ⏳                | 完整 todo list（過濾、排序、篩選日期、子任務） |
| `/finance`       | ⏳                | 帳本、分類、預算、月報                         |
| `/goals`         | ⏳                | 年度目標管理、里程碑、子目標                   |
| `/mood`          | ⏳                | 心情詳細記錄、年度 contribution-style heatmap  |
| `/stats`         | ⏳                | Weekly review、跨領域趨勢                      |
| `/journal`       | ⏳                | 日記、Markdown 編輯、AI 摘要                   |
| `/settings`      | ⏳                | 主題進階、資料管理、整合設定                   |

---

## 10. 未來功能（roadmap）

### 短期（v0.2，1–2 週可動）

| 功能            | 描述                                                  | 優先   | 工作量 |
| --------------- | ----------------------------------------------------- | ------ | ------ |
| 待辦持久化      | localStorage / IndexedDB 暫存 todos，重新整理不會消失 | ⭐⭐⭐ | S      |
| Cmd+K palette   | 全站搜尋 + 快捷指令（新增 todo、跳頁、切主題）        | ⭐⭐⭐ | M      |
| Tweaks 快捷鍵   | 按 G 召喚 panel，避免常駐占畫面                       | ⭐⭐   | S      |
| Favicon         | 加 brand icon（避免 console 404）                     | ⭐     | XS     |
| 1 件待辦的提醒  | 用 Notification API 在預定時間提醒                    | ⭐⭐   | M      |
| Mood 紀錄持久化 | 至少 30 天 mood 存到 localStorage                     | ⭐⭐⭐ | S      |

### 中期（v0.3–v0.5，1–2 個月）

| 功能                       | 描述                                                            | 優先   | 工作量 |
| -------------------------- | --------------------------------------------------------------- | ------ | ------ |
| Notion 同步                | Todo / Goals / Journal 資料庫雙向同步                           | ⭐⭐⭐ | L      |
| Google Calendar 整合       | Calendar 卡片接真實資料                                         | ⭐⭐⭐ | M      |
| 記帳整合                   | 接 Notion 或 csv import；Spend donut / Finance trend 用真實資料 | ⭐⭐   | L      |
| `/todo`、`/finance` 詳細頁 | 把 placeholder 變成實作                                         | ⭐⭐   | L      |
| AI 晨報                    | 用 Claude API 整合 Gmail + Calendar + Todo 產生 morning brief   | ⭐⭐⭐ | M      |
| PWA                        | 加 manifest，可裝到 Mac dock / iPhone 主畫面                    | ⭐⭐   | S      |
| 部署                       | Vercel / Cloudflare Pages，正式有 URL                           | ⭐⭐   | XS     |

### 長期（v1.0+，3 個月以上）

| 功能          | 描述                                               | 優先 | 工作量 |
| ------------- | -------------------------------------------------- | ---- | ------ |
| 跨裝置同步    | Supabase / Cloudflare D1 後端，手機 / 平板可看     | ⭐⭐ | XL     |
| AI 心情教練   | 連續低落自動建議休息 / 安排運動                    | ⭐   | L      |
| AI 目標規劃   | 輸入年度目標自動拆解月 / 週里程碑                  | ⭐⭐ | L      |
| 多語言        | 中 / 英切換（給展示 portfolio 用）                 | ⭐   | M      |
| 主題自訂      | Color picker、density、grid spacing                | ⭐   | M      |
| Widget 模式   | 單一 KPI 抽出來當 macOS menubar widget（用 Tauri） | ⭐   | XL     |
| 自動歸類 todo | 用 AI 從自然語言分到 work / life / health          | ⭐⭐ | M      |
| 健康整合      | Apple Health export → mood 關聯                    | ⭐   | L      |
| 公開分享頁    | 生成靜態 snapshot（如分享本月 mood + goals 進度）  | ⭐   | M      |

---

## 11. 非功能性需求

### 11.1 效能

- 首屏渲染 < 1.5 s（dev 已達成，prod build 會更快）。
- 圖表 / 動畫 60 fps，不阻塞主執行緒。
- Bundle size：v1.0 前不做 code splitting，全部 bundle < 200 kB gzip 為目標。

### 11.2 無障礙

- 鍵盤可操作（Tab / Enter / Esc）— **現況：todo checkbox、tabs 可用，但 sidebar nav 是 div + onClick，未支援鍵盤**。
- 對比度 WCAG AA — 大部分達標，dark mode 的 muted 色待驗證。
- 螢幕閱讀器友善 — 目前 aria-label 用得少，待補。

### 11.3 隱私

- v0.1：所有資料 hard-coded，無外傳。
- 未來接 Notion / Google：OAuth 走標準流程，token 只存 localStorage / Cookie。
- 不送任何 telemetry / analytics。

### 11.4 瀏覽器支援

- 主力：Safari 17+ / Chrome 120+（OKLCH、`color-mix(in oklch)`、`@import "tailwindcss"` v4 都需要新版）。
- 不支援 IE / 舊 Edge。

---

## 12. 變更紀錄

| 日期       | 版本 | 變更                                                                                  |
| ---------- | ---- | ------------------------------------------------------------------------------------- |
| 2026-05-09 | v0.1 | 初版 PRD；現況 = Vite 重構完成，Design System 頁面落地，Brand 色固定為 `#0E4FE7` 系列 |

---

## 附錄：相關文件

- `CLAUDE.md` — 專案技術細節與開發規範（給 AI 助理 / 協作者看）
- `README.md` — 專案安裝與基本操作
- `/design-system` 頁面 — 即時的 token 與元件預覽
