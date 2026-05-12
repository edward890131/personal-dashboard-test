# Dayboard · 個人生活儀表板

Yuu 的個人生活儀表板，從原本的 CDN + Babel Standalone 即時編譯版本，重構成 **Vite + React 18 + Tailwind CSS v4** 正規專案。原本的設計細節（bento 卡片、tweaks panel、圖表動畫、深色模式、主色 hue 切換）一律保留。

## 技術棧

| 類別       | 工具                                                          |
| ---------- | ------------------------------------------------------------- |
| 建構工具   | **Vite 6**                                                    |
| 框架       | **React 18**（JavaScript，不是 TypeScript）                   |
| 樣式（主） | 原本的 `styles.css`（1132 行，OKLCH 色票、設計 tokens）       |
| 樣式（輔） | **Tailwind CSS v4**（透過 `@tailwindcss/vite`）給未來新元件用 |
| Icon       | `@phosphor-icons/web`（regular + bold，從 npm 安裝）          |
| 程式碼品質 | ESLint 9 flat config + Prettier + prettier-plugin-tailwindcss |
| Git hooks  | Husky + lint-staged                                           |
| 測試       | Vitest + React Testing Library + jsdom                        |

## 目錄結構

```
src/
├── main.jsx              # 應用程式入口（載入 styles + tailwind + icons + 渲染 App）
├── App.jsx               # 整個 Dashboard 的組裝點
├── components.jsx        # bento 卡片元件（Sidebar、Topbar、Hero、Kpi、TodoCard…）
├── charts.jsx            # 圖表 primitives（CountUp、ValueChart、PieDonut、Sparkline）
├── tweaks-panel.jsx      # 浮動 Tweaks 面板與表單控制元件
├── styles.css            # 設計系統主體（保持不動）
├── tailwind.css          # Tailwind v4 入口（@import "tailwindcss"）
└── test/
    ├── setup.js          # Vitest 全域 setup
    └── App.test.jsx      # 範例測試
```

## 開發

```bash
# 安裝依賴
npm install

# 啟動 dev server（預設 http://localhost:5173）
npm run dev

# 跑 production build
npm run build

# 預覽 build 結果
npm run preview

# 程式碼品質
npm run lint           # 檢查
npm run lint:fix       # 自動修
npm run format         # Prettier 格式化
npm run format:check   # 只看不改

# 測試
npm test               # watch 模式
npm run test:run       # 跑一次
```

## 從 CDN 版本遷移做了什麼

1. **打包**：CDN-loaded React + `@babel/standalone` 即時編譯 → `vite` 正規 bundle
2. **模組化**：4 個 .jsx 檔之前用 `window.X = X` 共享，現在改成 ES Modules 的 `import`/`export`
3. **React Hooks**：`const { useState } = React;` → 直接 `import { useState } from "react"`
4. **入口**：`ReactDOM.createRoot(...).render(<App />)` 從 `App.jsx` 搬到 `main.jsx`
5. **Phosphor Icons**：原本 `<link href="https://unpkg.com/...">` → npm 安裝後 `import "@phosphor-icons/web/regular"`
6. **字型**：Google Fonts 仍用 CDN（在 index.html 的 `<link>`）
7. **Tailwind**：新增為輔助 utility 框架，不取代 styles.css

## Tweaks 面板

原本的 tweaks 設計透過 `window.parent.postMessage` 與外部 host 溝通（`__activate_edit_mode` 等）。在 Vite 內這些訊息一樣存在，只是沒有 host 接收，所以它本質上等於常駐顯示模式。如果未來想做成「按 G 才開啟」之類的開關，可以改 `useTweaks` 內部的 listener 邏輯。

## 後續建議

- [ ] 把 Tweaks 面板改成快捷鍵召喚（不需要 host）
- [ ] Phosphor Icons 改用 `@phosphor-icons/react`，可以避免載入整個 CSS
- [ ] 加 GitHub Actions CI（build、lint、test）
- [ ] 部署到 Vercel / Netlify / Cloudflare Pages
- [ ] 把幾個假資料抽出來做成可編輯的 JSON，方便日後接 API 或 Notion
