# Figma ↔ Code Component Mapping

> 版本：v0.3（2026-05-13）  
> Figma file：[Personal-Dashboard](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/Personal-Dashboard) · 工作帳號  
> Codebase：`/Users/goons/Documents/personal-dashboard-test`

## 為什麼有這份檔

正式的 [Figma Code Connect](https://www.figma.com/code-connect-docs/) 需要 **Developer seat（Org/Enterprise plan）**，GOONS 目前 Pro tier 還沒這個權限。所以改用這份**人類可讀對應表**當 design-to-code 翻譯字典：

- 給 **AI**（Claude Code / `/figma-implement-design`）在從 Figma 拉設計稿時當 prompt 參考，避免重複造輪子。
- 給**設計師**檢查每個 Figma component 是否有對應的 codebase 實作。
- 給**未來的 Yuu** 維持系統對齊。

> ⚠️ 之後 Figma plan 升級到 Org/Enterprise 後，可改用正式 Code Connect（用 Figma MCP 的 `add_code_connect_map` / `send_code_connect_mappings`），inspect panel 會自動顯示 code path，不必看這份檔。

---

## AI 使用指引

在從 Figma 拉設計稿（用 `/figma-implement-design` 或 `get_design_context`）**動工前**：

1. **先查這份對應表**：把 Figma node 對應的 codebase component 找出來。
2. **import 既有 component**，不要重新繪製或複製貼上。
3. 若 Figma node **找不到對應**（例如新加的設計）：
   - 暫停實作，告訴 Yuu「Figma 端的 X 在 codebase 沒有對應」。
   - 提建議：要在 codebase 新增、用既有相近 component、或不實作。
   - 等 Yuu 決策後再繼續。
4. **Props mapping** 看下面表格的「Code Props」欄位，自動帶入。
5. **CSS class** 直接用，不要重新寫 styled-components。

這個流程跟 `design-principles.md` 第 7 條「Figma-Code Parity」一致。

---

## 1. BentoCard / Layout 主元件（11 個）

| Figma Component | Figma Node                                                                          | Code Export                           | CSS Class       | Props                                                                                        | 備註                                                                                                                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------------------- | --------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sidebar`       | [`358:1122`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=358-1122) | `Sidebar` @ `src/components.jsx`      | `.sidebar`      | `{ active, setActive, theme, setTheme, mobileOpen, setMobileOpen, collapsed, setCollapsed }` | Component Set：`Density` variant（Default=展開 232×700 / Compact=收合 64×700）。內含 Brand / NavItem×9 / ThemeToggle / UserRow。Default 子元件 [`204:366`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=204-366)、Compact 子元件 [`358:843`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=358-843) |
| `Topbar`        | [`204:420`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=204-420)   | `Topbar` @ `src/components.jsx`       | `.topbar`       | `{ onMenu }`                                                                                 | 內含 Search Input、Icon Button、Kbd                                                                                                                                                                                                                                                                                                |
| `Hero`          | [`204:441`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=204-441)   | `Hero` @ `src/components.jsx`         | `.hero-bento`   | _(無)_                                                                                       | 問候依時段自動切換（早/午/下午/晚），用 CountUp 動畫                                                                                                                                                                                                                                                                               |
| `KPI Card`      | [`193:113`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=193-113)   | `Kpi` @ `src/components.jsx`          | `.kpi-card`     | `{ icon, label, value, prefix, suffix, delta, deltaPos=true, spark, decimals }`              | 富 props；含 CountUp + Sparkline                                                                                                                                                                                                                                                                                                   |
| `Todo Card`     | [`196:192`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=196-192)   | `TodoCard` @ `src/components.jsx`     | `.todo-card`    | _(無)_                                                                                       | 內部 state（todos array）                                                                                                                                                                                                                                                                                                          |
| `Finance Card`  | [`198:347`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=198-347)   | `FinanceCard` @ `src/components.jsx`  | `.finance-card` | `{ chartMode }`                                                                              | chartMode 來自 tweaks panel                                                                                                                                                                                                                                                                                                        |
| `Calendar Card` | [`197:246`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=197-246)   | `CalendarCard` @ `src/components.jsx` | `.cal-card`     | _(無)_                                                                                       | 顯示本週行程                                                                                                                                                                                                                                                                                                                       |
| `Spend Card`    | [`198:397`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=198-397)   | `SpendCard` @ `src/components.jsx`    | `.spend-card`   | _(無)_                                                                                       | 含 PieDonut                                                                                                                                                                                                                                                                                                                        |
| `Goals Card`    | [`197:338`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=197-338)   | `GoalsCard` @ `src/components.jsx`    | `.goals-card`   | _(無)_                                                                                       | 年度目標進度                                                                                                                                                                                                                                                                                                                       |
| `Mood Card`     | [`194:148`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=194-148)   | `MoodCard` @ `src/components.jsx`     | `.mood-card`    | _(無)_                                                                                       | 含 5 階 heatmap                                                                                                                                                                                                                                                                                                                    |
| `QuickAdd Card` | [`193:129`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=193-129)   | `QuickAddCard` @ `src/components.jsx` | `.quick-card`   | _(無)_                                                                                       | 快速新增按鈕集                                                                                                                                                                                                                                                                                                                     |

---

## 2. Chart Primitives（4 個）

| Figma Component   | Figma Node                                                                        | Code Export             | 路徑             | Props                                            |
| ----------------- | --------------------------------------------------------------------------------- | ----------------------- | ---------------- | ------------------------------------------------ |
| `Line/Area Chart` | [`217:598`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=217-598) | `ValueChart`            | `src/charts.jsx` | `{ data, mode, ... }`（mode 由 tweaks panel 控） |
| `Donut`           | [`217:599`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=217-599) | `PieDonut`              | `src/charts.jsx` | `{ data, ... }`                                  |
| `Bar Chart`       | [`236:616`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=236-616) | `ValueChart mode="bar"` | `src/charts.jsx` | `{ data, mode: "bar", ... }`                     |
| `Sparkline`       | [`154:68`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=154-68)   | `Sparkline`             | `src/charts.jsx` | `{ data, color, ... }`                           |
| `Heatmap Cell`    | [`217:612`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=217-612) | _(MoodCard 內 inline)_  | —                | 用 `--heatmap-l0` ~ `l4` token                   |

---

## 3. Reusable Primitives（CSS-only，不是 React component）

這些在 **Figma 端是 component**，但 **code 端是 CSS class**（沒對應的 React component export），可直接用 className 寫 inline JSX：

| Figma Component       | Figma Node                                                                        | Code 對應                                                                       | 用法範例                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`              | [`146:709`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=146-709) | `.btn-primary` / `.btn-secondary` + `.btn-sm` modifier                          | `<button className="btn-primary">Primary</button>` 或 `<button className="btn-secondary btn-sm" disabled>Small</button>` · 5 states 由 `:hover/:active/:focus-visible/:disabled` 自動處理 |
| `Icon Button`         | [`151:791`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=151-791) | `.icon-btn`                                                                     | `<button className="icon-btn"><i className="ph ph-bell" /></button>`                                                                                                                      |
| `Card Action Button`  | [`151:743`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=151-743) | `.card-action`                                                                  | 卡片右上角小按鈕                                                                                                                                                                          |
| `Kbd`                 | [`151:795`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=151-795) | `.kbd`                                                                          | `<span className="kbd">⌘K</span>`                                                                                                                                                         |
| `Tag`                 | [`153:785`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=153-785) | `.tag` + `.tag.{work\|life\|health\|finance\|study\|travel\|default\|personal}` | `<span className="tag finance">理財</span>` · 8 類映射到既有 status / brand 色組（study=紫、personal=中性，同 default）                                                                   |
| `Badge`               | [`153:793`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=153-793) | `.badge` / `.badge.subtle`                                                      | `<span className="badge">8</span>`（primary 計數）· `<span className="badge subtle">NEW</span>`（淺底標示）·nav-item 內預設 subtle，active 時翻回 primary                                 |
| `Delta Badge`         | [`153:767`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=153-767) | `.delta.pos` / `.delta.neg`                                                     | KPI 卡的趨勢箭頭 + 百分比                                                                                                                                                                 |
| `Avatar`              | [`154:62`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=154-62)   | `.avatar`                                                                       | Sidebar 底部 user row 用                                                                                                                                                                  |
| `Progress Bar`        | [`154:80`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=154-80)   | `.progress` / `.progress-bar`                                                   | GoalsCard 內                                                                                                                                                                              |
| `Search Input`        | [`155:785`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=155-785) | `.search`                                                                       | Topbar 內                                                                                                                                                                                 |
| `Todo Add Input`      | [`155:825`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=155-825) | `.todo-add`                                                                     | TodoCard 內                                                                                                                                                                               |
| `Tab Button`          | [`155:839`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=155-839) | `.tab-btn`                                                                      | 切換 view 用                                                                                                                                                                              |
| `Card`                | [`167:91`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=167:91)   | `.card`                                                                         | 所有 bento 卡的基底                                                                                                                                                                       |
| `Calendar Day`        | [`172:110`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=172-110) | `.cal-day`                                                                      | CalendarCard 內                                                                                                                                                                           |
| `Calendar Event`      | [`187:130`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=187-130) | `.evt` + `.evt-bar.positive` / `.evt-bar.warning`                               | bar 預設 primary（藍）、`.positive` 綠、`.warning` 橘。舊 `.b2/.b3` alias 保留向後相容                                                                                                    |
| `Checkbox`            | [`376:986`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=376-986) | `.checkbox` / `.checkbox.checked` / `.checkbox.disabled`                        | `<span className={\`checkbox ${done ? "checked" : ""}\`}><i className="ph-bold ph-check"></i></span>` · 18×18 / radius/md 5px / border 1.5px · 同時用於 TodoCard 與獨立場景               |
| `Mood Picker Button`  | [`172:126`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=172-126) | `.mood-btn`                                                                     | MoodCard 內                                                                                                                                                                               |
| `Goal Item`           | [`187:137`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=187-137) | `.goal-item`                                                                    | GoalsCard 內                                                                                                                                                                              |
| `Todo Item`           | [`174:121`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=174-121) | `.todo-item`                                                                    | TodoCard 內                                                                                                                                                                               |
| `Quick Action Button` | [`173:101`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=173-101) | `.quick-btn`                                                                    | QuickAddCard 內                                                                                                                                                                           |
| `Nav Item`            | [`199:383`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=199-383) | `.nav-item`                                                                     | Sidebar 內                                                                                                                                                                                |
| `Brand`               | [`199:384`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=199-384) | `.brand` + `.brand-mark` + `.brand-text`                                        | Sidebar 頂部                                                                                                                                                                              |
| `Theme Toggle`        | [`199:400`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=199-400) | `.theme-toggle`                                                                 | Sidebar 底部                                                                                                                                                                              |
| `User Row`            | [`199:413`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=199-413) | `.user-row`                                                                     | Sidebar 底部                                                                                                                                                                              |
| `Date Pill`           | [`203:361`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=203-361) | `.date-pill`                                                                    | Hero 內                                                                                                                                                                                   |
| `Weather Pill`        | [`203:364`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=203-364) | `.weather-pill`                                                                 | Hero 內                                                                                                                                                                                   |
| `Tooltip`             | [`226:560`](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/?node-id=226-560) | `.tooltip`                                                                      | chart hover 用                                                                                                                                                                            |

**規則**：實作這些 primitives 時，**永遠用 CSS class，不要包成 React component**，除非 Yuu 明確要求。原因：這些是輕量視覺元素，包 component 會增加無意義的抽象層。

---

## 4. Icon Mapping

Figma `Homepage` page 內 36 個 `icon/*` component **全部 alias 到 Phosphor Icons CDN**。Code 端用 `<i className="ph ph-xxx" />`：

| Figma                    | Code                                        |
| ------------------------ | ------------------------------------------- |
| `icon/arrow-right`       | `<i className="ph ph-arrow-right" />`       |
| `icon/bell`              | `<i className="ph ph-bell" />`              |
| `icon/calendar-blank`    | `<i className="ph ph-calendar-blank" />`    |
| `icon/check`             | `<i className="ph ph-check" />`             |
| `icon/check-square`      | `<i className="ph ph-check-square" />`      |
| `icon/chart-line-up`     | `<i className="ph ph-chart-line-up" />`     |
| `icon/dots-three`        | `<i className="ph ph-dots-three" />`        |
| `icon/gear-six`          | `<i className="ph ph-gear-six" />`          |
| `icon/magnifying-glass`  | `<i className="ph ph-magnifying-glass" />`  |
| `icon/moon`              | `<i className="ph ph-moon" />`              |
| `icon/sun`               | `<i className="ph ph-sun" />`               |
| `icon/target`            | `<i className="ph ph-target" />`            |
| `icon/wallet`            | `<i className="ph ph-wallet" />`            |
| _(其餘 23 個同 pattern)_ | 把 Figma 命名的 `icon/xxx` 改成 `ph ph-xxx` |

**規則**：一律用 Phosphor，不要把 Figma 內 icon 當 SVG 匯出。

---

## 5. 已知缺口

實作時若用到下面這些 Figma 元件，**code 端目前還沒有**，要先問 Yuu：

- _(目前 v0.2 已全部對齊；未來新增的設計若不在這份表內請更新本表)_

---

## 7. Component Drift 偵測機制（半自動）

Token 有 `npm run figma:diff` 會跳紅燈，但 component 過去只靠人記得比對。現在補上對應機制，**鏡像 token 流程**：

| Token 系統                                        | Component 系統                                              |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `tokens/*.json`（code 真相）                      | `tokens/component-spec.json`（code 真相）                   |
| `tokens/figma-snapshot.json`（Figma 真相，AI 拉） | `tokens/figma-component-snapshot.json`（Figma 真相，AI 拉） |
| `scripts/check-token-drift.mjs`                   | `scripts/check-component-drift.mjs`                         |
| `npm run figma:diff`                              | `npm run figma:diff:components`                             |

**偵測什麼**：variants 增減、states 增減、radius 綁定不一致、該綁 token 卻寫死（hardcoded）、顏色解析後不一致（人工複查）。
**涵蓋範圍 v1**：本檔第 3 節的 10 個易變原子元件（Button / IconButton / SearchInput / Kbd / Card / Badge / DeltaBadge / Checkbox / Tag / DatePill）。
**指紋原理**：不比畫面，只比「每個屬性綁哪個 token」。`component-spec.json` 的 `$radiusMap` / `$colorMap` 負責把 code 的 CSS var 換算到 Figma 命名空間後比對。
**報告**：`reports/component-drift-{date}.md`，有結構漂移 / 寫死 / 缺漏時 exit 1（可進 CI）。

### 標準流程（Figma 改了 component → 檢視 code）

1. AI 用 Figma MCP 重拉各 figmaNode 的 token 綁定 → 覆寫 `tokens/figma-component-snapshot.json`
2. `npm run figma:diff:components`
3. 看報告：哪些元件結構變了、新綁/少綁什麼、哪些還寫死
4. 對齊 `src/styles.css` → 更新 `tokens/component-spec.json`
5. 再跑一次驗證歸零

> ✅ `figma-component-snapshot.json` 已是 **live 拉取**（2026-06-01，Figma MCP `get_variable_defs` + `get_metadata`）。首次 live 比對的成果：修正了 Kbd 圓角寫死 → 綁 `--r-sm`、Button focus ring → 抽 `--focus-ring` token、移除冗餘的 dark btn-primary 寫死、Tag 補上 Figma 既有的 `personal` 變體。剩下的 49 處 `var(--*)` 綁定是 **Figma 端** hygiene（元件沒接語意 token），列為 advisory 待 Figma 端 rebind。
>
> ⚠️ 注意 live 推翻了舊文件：Figma 的 Tag 變體本來就是 `study`（不是本檔曾寫的 `learn`）、圓角是 `radius/sm`（不是 `design-token.md §4` 寫的 `radius/chip`）。文件比 Figma 舊，以 live snapshot 為準。

### Refresh prompt（重拉 Figma 端基準時複製）

```
用 Figma MCP 重新拉 figma-mapping.md 第 3 節這 10 個原子元件
（Button 146:709、IconButton 151:791、SearchInput 155:785、Kbd 151:795、
 Card 167:91、Badge 153:793、DeltaBadge 153:767、Checkbox 376:986、
 Tag 153:785、DatePill 203:361）在 Figma 端的 token 綁定，
照 tokens/figma-component-snapshot.json 既有 schema
（variants / states / radius / colorSemantic / colorCssVarNamed，用 Figma token path）覆寫該檔。
get_metadata 拿 variants/states，get_variable_defs 拿 radius/color 綁定；
綁到 var(--*) 的歸 colorCssVarNamed、綁到語意 token 的歸 colorSemantic。
拉完跑 npm run figma:diff:components，
把報告的「結構漂移」與「寫死」列給我，先別改 code，等我決定怎麼對齊。
```

---

## 6. 維護紀錄

| 日期       | 版本 | 變更                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-11 | v0.1 | 初版。原計畫用 Figma Code Connect，但 Pro tier 沒權限，改用人類可讀對應表                                                                                                                                                                                                                                                                                          |
| 2026-05-12 | v0.2 | 同步 Figma Components page (397:5705) v2 變更：Button 加 Secondary + Small + 完整 5 states、新增 Checkbox 元件、Tag 從 3 類擴充到 7 類、Badge 升格為通用 primitive、Calendar Event 加 `.positive` / `.warning` 條色語意 alias、Bar Chart 確認已實作於 `ValueChart mode="bar"`、新增 `--r-sm` / `--r-md` 與 `--state-disabled-*` token、tablet sidebar 寬度 72→64px |
| 2026-06-01 | v0.4 | 新增第 7 節 Component Drift 偵測機制：`component-spec.json` + `figma-component-snapshot.json` + `check-component-drift.mjs` + `npm run figma:diff:components`，v1 涵蓋 10 個原子元件                                                                                                                                                                               |
| 2026-06-01 | v0.5 | snapshot 改 **live 拉取**（get_variable_defs + get_metadata）。比對模型改為結構 + 寫死 + Figma 綁定 hygiene。依報告修 code：Kbd 圓角綁 `--r-sm`、Button focus ring 抽 `--focus-ring`、移除冗餘 dark btn-primary、`.tag.personal` 補齊。兩支腳本改台北時間。Tag 變體更正為 `study`/`personal`（舊文件 `learn` 作廢）                                                |
