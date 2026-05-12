# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案定位

**Dayboard**（package name `dayboard`）是 Yuu 的個人生活儀表板。本專案是從原本的 CDN + `@babel/standalone` 即時編譯版本，重構為 **Vite 6 + React 18 + Tailwind v4** 的正規專案，**保留 100% 原始設計**（bento 卡片、tweaks panel、圖表動畫、深色模式、主色 hue 切換）。

語言為 **JavaScript（非 TypeScript）**，但有 `jsconfig.json` 提供 IDE 支援與 `@/*` → `src/*` path alias。

## 常用指令

```bash
npm run dev          # 啟動 Vite dev server（port 5173，會自動開瀏覽器）
npm run build        # production build → dist/
npm run preview      # 預覽 build 結果
npm run lint         # ESLint 檢查
npm run lint:fix     # 自動修復
npm run format       # Prettier 格式化全部檔案
npm test             # Vitest watch 模式
npm run test:run     # Vitest 跑一次（CI 用）

# 跑單一測試檔案
npx vitest run src/test/App.test.jsx

# 跑符合特定名稱的測試
npx vitest run -t "brand"
```

`prepare` script 會在 `npm install` 後自動安裝 husky hooks。

## Pre-commit hook

`.husky/pre-commit` 跑 `npx lint-staged`，配置見 `package.json`：

- `*.{js,jsx}` → `eslint --fix` + `prettier --write`
- `*.{json,md,css,html}` → `prettier --write`

修改 `package.json` 內 `lint-staged` 區塊就能調整。

## 架構：要讀多個檔案才能理解的部分

### 雙軌樣式系統（重要）

樣式有兩套並存，**改動前要先決定走哪一邊**：

1. **`src/styles.css`**（1100+ 行）— 設計系統主體，**保持不動**。使用 OKLCH 色票、CSS custom properties 與 `[data-theme="dark"]` 切換。所有原本卡片、bento grid、sidebar 的視覺都從這裡來。
2. **`src/tailwind.css`** + `@tailwindcss/vite`（v4）— 只是 `@import "tailwindcss"`，提供 utility classes 給**未來新元件**用，不取代 styles.css。

兩者透過 `src/main.jsx` 一起 import。新元件可選 Tailwind utility 或 design tokens（`var(--primary)` 等），既有元件**不要改寫成 Tailwind**。

### 主題切換的兩條 CSS Custom Property（在 App.jsx）

`App.jsx` 的兩個 `useEffect` 是樣式系統的入口：

| Tweak key | 寫入位置                    | 效果                                              |
| --------- | --------------------------- | ------------------------------------------------- |
| `t.dark`  | `<html data-theme>`         | 觸發 styles.css 內 `[data-theme="dark"]` 全套換色 |
| `t.font`  | `<html style="--ff-sans:">` | 全站字體換掉，候選清單在 App.jsx 的 `TweakSelect` |

**Primary brand 色為固定 hex**（`--primary: #0E4FE7`、`--primary-soft: #BADDFF`、`--primary-ink: #122559`），不再用 OKLCH + hue 動態。深色模式的 `--primary-soft` 與 `--primary-ink` 用 `color-mix(in oklch, ...)` 從 `--primary` 衍生（soft = 與 `--bg` 混深底、ink = 與白混亮字）。

要新增可調項目時，預設值寫在 `App.jsx` 的 `TWEAK_DEFAULTS` 區塊（被 `EDITMODE-BEGIN`/`EDITMODE-END` 包住，**這對註解不能拿掉**，是 host protocol 的鉤子，見下節）。

### Tweaks Panel：外部 host postMessage 協議

`src/tweaks-panel.jsx` 的 `useTweaks` + `TweaksPanel` 是從外部專案搬過來的元件，內建跟 host 視窗的訊息協議：

- 監聽：`__activate_edit_mode` / `__deactivate_edit_mode`
- 廣播：`__edit_mode_available`（mount 時）、`__edit_mode_set_keys`（每次改值，host 會把新值寫回 `EDITMODE-BEGIN/END` 區塊）、`__edit_mode_dismissed`（關閉時）
- 同視窗 `tweakchange` CustomEvent — 給 in-page listener 用

在 Vite 環境**沒有 host 接收這些訊息**，所以面板實質上等於常駐顯示，但訊息照發、不會出錯。如果要改成「按鍵召喚」之類，改 `TweaksPanel` 內監聽 `__activate_edit_mode` 的那段 `useEffect`。

`TweakRadio` 有自動 fallback 機制：選項過長放不下時會退化為 `TweakSelect`（門檻在註解裡：2 選 ≤16 字、3 選 ≤10 字、>3 選一律 select）。

### 元件分層（src/ 一層）

```
main.jsx           ← 入口（載 styles + tailwind + phosphor + render <App/>）
App.jsx            ← 組裝 sidebar/topbar/grid + Tweaks defaults + 路由
components.jsx     ← bento 卡片：Sidebar, Topbar, Hero, Kpi, TodoCard,
                     FinanceCard, CalendarCard, SpendCard, GoalsCard,
                     MoodCard, QuickAddCard
charts.jsx         ← 圖表 primitives：CountUp, ValueChart, PieDonut, Sparkline
tweaks-panel.jsx   ← 浮動面板 + 控制元件（見上）
design-system.jsx  ← /design-system 頁面（token swatches + 元件範例）
```

### 輕量路由（pathname-based，不引入 react-router）

`App.jsx` 內 `PATH_TO_ACTIVE` / `ACTIVE_TO_PATH` 是 path ↔ active state 的雙向表，目前只有：

```js
const PATH_TO_ACTIVE = { "/design-system": "designSystem" };
const ACTIVE_TO_PATH = { designSystem: "/design-system" };
```

加新路由就是兩邊各加一行，並在 `<main>` 內加對應 `active === "xxx" ? <XxxPage /> : ...` 的 render 分支。

機制：

- 初始 `active` 從 `window.location.pathname` 讀，所以**直接訪問 `/design-system` URL 也能進**。
- 監聽 `popstate` 同步上一頁/下一頁，避免按瀏覽器返回時 sidebar 沒跟上。
- Sidebar 點擊 → `navigate(id)` → `setActive(id)` + `history.pushState`，**不重新整理頁面**。
- Vite dev server 預設 SPA fallback 會把未知路徑回 `index.html`，所以 `/design-system` 這種路徑可直接訪問。

未實作的頁面（`todo`、`finance`、`goals`、`mood`、`stats`、`journal`、`set`）一樣會被導到 `<Placeholder />`，URL 仍維持 `/`，等之後做完再加進路由表。

### Design System 頁面（`/design-system`）

`src/design-system.jsx` 是一個獨立預覽頁，列出所有 design tokens 與元件範例：

- **`useComputedVar(varName)`** — 讀 `<html>` 的 computed CSS 變數，並用 `MutationObserver` 監聽 `data-theme` 與 `style` 變化，所以**切換深色模式或拉動 hue slider 時，swatch 顯示的 hex 值會即時更新**。
- 頁面樣式用 `ds-*` class，**全部寫在 `design-system.jsx` 底部的 `DS_STYLE` 字串內以 `<style>` 注入**，不汙染 `styles.css`。新增 ds-only 樣式時改那裡，不要寫到 styles.css。
- Token 清單寫在 `SWATCHES` 物件，新增/移除 token 時對應地改它即可。
- 受 Tweaks panel 即時影響（dark / hue / font / chartMode 都會套用），切到這頁時可以開 Tweaks 一邊調一邊看 token 變化。

**原則：當你在 `styles.css` 加新 design token，或在元件層加新 reusable class（例如新的 button variant），請順手在 design-system.jsx 對應 section 加上範例。** 這頁是 token 的對外索引。

各檔之間用標準 ES module `import`/`export`（不是 `window.X = X`，那是舊 CDN 版的做法）。

### Phosphor Icons：從 npm 載入 CSS

`main.jsx` 載 `@phosphor-icons/web/regular` 與 `bold` 的 **CSS 檔案**（不是 React 元件），元件裡用 `<i className="ph ph-xxx" />`。如果未來考慮效能，可以換成 `@phosphor-icons/react` 改成 tree-shake 的 component import — README「後續建議」有提到。

### 字型走 CDN（`index.html`）

Inter / Geist / IBM Plex Sans / Noto Sans TC / JetBrains Mono 從 Google Fonts CDN 載，不是 npm。新增字體要：(1) 改 `index.html` 的 `<link>`、(2) 加進 `App.jsx` 的 `TweakSelect` options。

## 路徑與 alias

`@/*` → `src/*`（同時設在 `vite.config.js` 與 `jsconfig.json`，**改路徑要兩邊一起改**）。測試裡也可用，例如：

```jsx
import App from "@/App.jsx";
```

## 測試

- Vitest 的設定**寫在 `vite.config.js` 的 `test` 區塊**（不是另開 `vitest.config.js`），透過 `/// <reference types="vitest" />` 啟用型別。
- 環境是 jsdom、`globals: true`（不需要 `import { describe, it } from "vitest"` 也行，但專案範例還是顯式 import）。
- `exclude` 把 `_trash-design-system` 排掉（跟 ESLint ignore 對齊），不然會跑到舊版備份的測試。
- `src/test/setup.js` 載入 `@testing-library/jest-dom/vitest`、補一個 **`ResizeObserver` stub**（jsdom 沒有，charts.jsx 的 `Sparkline` / `ValueChart` 在 mount 會用），並在 `afterEach` 自動 `cleanup()`。

## ESLint flat config 注意事項

`eslint.config.js` 是 ESLint 9 flat config，不是舊版 `.eslintrc`：

- `prettierConfig` **必須放在陣列最後**，覆蓋掉所有跟排版相關的規則。
- 已關掉 `react/react-in-jsx-scope` 與 `react/prop-types`。
- `_` 開頭變數允許未使用。
- ignore 清單包含 **`_trash-design-system`**（專案根目錄裡的舊版備份，**不要改它**）。

## 常見陷阱

- 不要把 `styles.css` 改寫成 Tailwind — 設計細節靠 OKLCH tokens 與 1100+ 行 CSS 撐起來，重寫等於砍掉設計系統。
- `EDITMODE-BEGIN`/`EDITMODE-END` 註解標記**不能刪**，否則外部 host 沒辦法持久化 tweaks。
- 改 path alias 時 `vite.config.js` 與 `jsconfig.json` 都要改。
- 單測要 import 元件時用 `@/` alias，路徑比較不會壞。
- 加新 design token 或 reusable class 時，順手在 `design-system.jsx` 加範例 — 這頁是視覺索引。
- 加新頁面（路由）要同時改 `App.jsx` 的 `PATH_TO_ACTIVE` / `ACTIVE_TO_PATH`、`<main>` 內的 render 分支、以及 `components.jsx` 的 `tools` 陣列（如果要進 sidebar）。

## Figma 同步工作流

Code 端 token + component 與 Figma file [`Personal-Dashboard`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/Personal-Dashboard)（工作帳號）的雙向對齊系統。**詳細執行流程見 `design-principles.md` 第 7 條 Figma-Code Parity**。

### 工具速查

| 檔案 / 指令                                 | 用途                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `tokens/{primitives,semantics,device}.json` | 三層 token SoT。改 token 從這裡開始                                                  |
| `tokens/figma-snapshot.json`                | Figma 端 Variables 快照（audit log），AI 透過 Figma MCP 維護                         |
| `scripts/token-adapter.mjs`                 | DTCG ↔ Figma 互轉（alias / em↔percent / rgba→hex）                                   |
| `scripts/check-token-drift.mjs`             | 純 Node diff 腳本                                                                    |
| `npm run figma:diff`                        | 一鍵跑對齊檢查 → `reports/drift-{date}.md`                                           |
| `figma-mapping.md`                          | Component 對應字典（11 BentoCard + 26 primitives + 36 icons），取代正式 Code Connect |
| `figma-token-alignment.md`                  | 對齊狀態總覽（人工維護）                                                             |

### 三層 token 對應 Figma Variables Collection

| Code                     | Figma Collection | Modes                                                     |
| ------------------------ | ---------------- | --------------------------------------------------------- |
| `tokens/primitives.json` | Primitives       | Value（單一）                                             |
| `tokens/semantics.json`  | Theme            | Light / Dark                                              |
| `tokens/device.json`     | Device           | Desktop / Tablet / Mobile（Tablet/Mobile 目前同 Desktop） |

### 常見場景

**設計師在 Figma 改了 token**：

1. 跟 AI 說「幫我更新 figma-snapshot」 → 重新拉 Variables 寫回 `tokens/figma-snapshot.json`
2. `npm run figma:diff` 看 drift
3. 補對應 token 到 `tokens/*.json` + `src/styles.css` + `src/design-system.jsx` swatch
4. 再 `npm run figma:diff` 驗證歸零

**Figma → Code** 拉設計稿實作：先讀 `figma-mapping.md` 找對應元件，不重新繪製。

**Code → Figma** 把畫面同步到 Figma：嚴禁 hard-coded、引用既有 Variables / Components（依 `design-principles.md` 第 7 條）。

### 帳號注意

- File 在**工作帳號**（`yuu@goonsdesign.com` / GOONS 團隊 Pro tier）
- Claude.ai Figma MCP 接 `goonsdesign.co@gmail.com`（同團隊，有存取權）
- **Code Connect 需 Org/Enterprise plan，Pro tier 沒權限** → 改用 `figma-mapping.md`

### 維護紀律（重要）

加新 design token 時的順序：

```
tokens/*.json  →  跑 npm run figma:diff（看 Figma 端是否也要補）
              →  src/styles.css（加 --xxx CSS variable）
              →  src/design-system.jsx（加 swatch / IconSize cell）
              →  npm run build 驗證
```

**不要跳步**。少做 design-system.jsx 那步，token 就會變成「合約裡存在但設計頁看不到」的孤兒。
