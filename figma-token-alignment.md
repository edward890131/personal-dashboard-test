# Figma ↔ Code Token Alignment Report

> 版本：v0.3（2026-05-13）  
> Figma file：[Personal-Dashboard](https://www.figma.com/design/3n0ftsxOG20Hl214ii5vFL/Personal-Dashboard) · 工作帳號  
> Code 對比基準：`tokens/primitives.json` + `semantics.json` + `device.json`  
> 工具：`npm run figma:diff` → `reports/drift-*.md`

---

## TL;DR

**🎯 193/193 tokens 完全對齊，0 drift。**

| 對齊維度                                                | 狀態                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| 命名規範（`color/blue/600` 這種 slash path）            | ✅ 100% 對齊                                                      |
| Primitives（117 variables）                             | ✅ 100% 對齊                                                      |
| Theme · Light / Dark mode（62 variables）               | ✅ 100% 對齊                                                      |
| Device · Desktop / Tablet / Mobile mode（14 variables） | ✅ 100% 對齊                                                      |
| CSS variables（`src/styles.css`）                       | ✅ 對齊                                                           |
| Component 對應                                          | ✅ 用 `figma-mapping.md` 取代正式 Code Connect（Pro tier 沒權限） |
| 自動化 drift 監測                                       | ✅ `npm run figma:diff`                                           |

**v0.2 → v0.3 主要動作（2026-05-13）：**

1. 補 6 個 Figma 新增的 primitive 進 `tokens/primitives.json`：
   - `color/blue/700`（#0935AD，brand deep）
   - `color/blue-dark/pale`（#0F1E40，dark 模式 brand-pale 襯底）
   - `color/blue/600-a00`、`color/blue/600-a30`（漸層 / focus ring 用 alpha 變體）
   - `color/blue-dark/ink-a40`、`color/blue-dark/ink-a00`（dark 漸層 alpha 變體）
2. 補 8 個 Figma 新增的 theme token 進 `tokens/semantics.json`（light + dark）：
   - `bg/brand-deep`、`bg/brand-pale`、`text/brand-deep`、`text/brand-pale`、`icon/brand-deep`、`icon/brand-pale`
   - `bg/chart-area-start`、`bg/chart-area-end`（圖表面積漸層起終點）
3. 把 dark mode 的 `bg/brand-pale` 和 `text/brand-pale` 從 hard-code hex 改 alias 到 `{color.blue-dark.pale}`，符合「semantic 一律 reference primitive」原則
4. 重新拉 `tokens/figma-snapshot.json`（193 variables，snapshotAt = 2026-05-13）
5. 更新 `figma-mapping.md` Sidebar 條目 → 對應 Component Set `358:1122`（Density variant: Default / Compact）

---

## Collection 對應全貌

### Collection 1: `Primitives`（111 variables · 1 mode "Value"）

對應 code 端 `tokens/primitives.json`。

| 類別                         | Code 端 | Figma 端 | 對齊                |
| ---------------------------- | ------- | -------- | ------------------- |
| color/blue/\*                | 6 個    | 6 個     | ✅                  |
| color/blue-dark/\*           | 2 個    | 2 個     | ✅                  |
| color/neutral/\*             | 12 個   | 12 個    | ✅                  |
| color/neutral-dark/\*        | 12 個   | 12 個    | ✅                  |
| color/{green,red,orange}/500 | 3 個    | 3 個     | ✅                  |
| color/{white,black}          | 2 個    | 2 個     | ✅                  |
| spacing/\*                   | 15 個   | 15 個    | ✅                  |
| radius/\*                    | 9 個    | 9 個     | ✅                  |
| fontSize/\*                  | 9 個    | 9 個     | ✅                  |
| fontWeight/\*                | 5 個    | 5 個     | ✅                  |
| lineHeight/\*                | 5 個    | 5 個     | ✅                  |
| letterSpacing/\*             | 8 個    | 8 個     | ⚠️ 單位差異（見下） |
| borderWidth/\*               | 4 個    | 4 個     | ✅                  |
| opacity/\*                   | 10 個   | 10 個    | ✅                  |
| **iconSize/\***              | ❌ 無   | 7 個     | 📤 Figma-only       |
| **color/blue/600-a8**        | ❌ 無   | 1 個     | 📤 Figma-only       |
| **color/blue-dark/ink-a20**  | ❌ 無   | 1 個     | 📤 Figma-only       |

**單位差異 — letterSpacing**：

- Code（DTCG）：`-0.025em`、`-0.02em`、`-0.01em` 等
- Figma：`-2.5`、`-2`、`-1` 等（看起來是 percent 數值，因為 -0.025em = -2.5%）
- 同步腳本要做單位換算：`em → percent (×100)`。

### Collection 2: `Theme`（54 variables · 2 modes "Light" / "Dark"）

對應 code 端 `tokens/semantics.json` 的 `bg.*`, `text.*`, `border.*`, `badge.*`, `heatmap.*`, `state.*`。

| 群組        | Code 端 | Figma 端                                                                        | 對齊          |
| ----------- | ------- | ------------------------------------------------------------------------------- | ------------- |
| bg/\*       | 6 個    | **8 個**（多 `chart-area`、`inverse`）                                          | ⚠️ 差 2       |
| text/\*     | 10 個   | **11 個**（多 `on-inverse`）                                                    | ⚠️ 差 1       |
| border/\*   | 4 個    | 4 個                                                                            | ✅            |
| badge/\*    | 10 個   | 10 個                                                                           | ✅            |
| heatmap/\*  | 5 個    | 5 個                                                                            | ✅            |
| state/\*    | 8 個    | 8 個                                                                            | ✅            |
| **icon/\*** | ❌ 無   | **8 個**（primary/muted/brand/on-brand/positive/negative/on-inverse/secondary） | 📤 Figma-only |

### Collection 3: `Device`（14 variables · 3 modes "Desktop" / "Tablet" / "Mobile"）

對應 code 端 `semantics.json` 的 `space.*` 與 `corner.*`。**結構差異最大的地方**：

| 群組      | Code 端架構                                              | Figma 端架構                            |
| --------- | -------------------------------------------------------- | --------------------------------------- |
| space/\*  | `light.space.*` + `dark.space.*`（兩邊值相同，重複定義） | 拆出獨立 `Device` collection，3 個 mode |
| corner/\* | 同上                                                     | 同上                                    |

**Figma 端的選擇更乾淨**：space 與 corner 跟 Light/Dark 無關、跟 device 有關，獨立成 collection 是合理設計。

**code 端目前單一套值（Desktop 為主）**，Figma 預設 3 個 mode 但 Tablet/Mobile 值是否有差異需要進一步確認。

---

## 差距明細與處置建議

### 📤 Figma 比 code 多 19 個（建議補進 code）

```
Primitives:
  - iconSize/xs (12), sm (14), md (16), lg (17), xl (18), 2xl (20), 3xl (24)
  - color/blue/600-a8        // primary 8% alpha
  - color/blue-dark/ink-a20  // ink 20% alpha

Theme:
  - bg/chart-area
  - bg/inverse
  - text/on-inverse
  - icon/primary, secondary, muted, brand, on-brand, positive, negative, on-inverse
```

**建議**：補進 `tokens/primitives.json` + `semantics.json`，這樣 Figma 才能維持 SoT 對齊。`icon/*` 看起來是設計師為了用變數綁定 SVG icon 顏色而加的，code 端可能要對應建立 CSS variables（如 `--icon-primary`）。

### 📥 Code 完全沒有「比 Figma 多」的 token

換句話說：**code 端沒有需要 push 到 Figma 的新東西**，差距全是反方向。

### ⚠️ 結構差異 1：letterSpacing 單位

| Token                    | Code（DTCG） | Figma  | 換算                 |
| ------------------------ | ------------ | ------ | -------------------- |
| `letterSpacing/tightest` | `-0.025em`   | `-2.5` | `em × 100 = percent` |
| `letterSpacing/tighter`  | `-0.02em`    | `-2`   | 同上                 |

→ token-adapter 必須做這個換算。

### ⚠️ 結構差異 2：space / corner 的 collection 歸屬

- Code：`semantics.json` 的 `light.space.*` 與 `dark.space.*` 重複定義（值相同）
- Figma：拆到獨立 `Device` collection，3 個 mode（Desktop/Tablet/Mobile）

**這是 Figma 端做得更好的地方。** 兩個處置方向：

| 選項                              | 做法                                                                 | 優缺點                                             |
| --------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| **A. Code 跟著 Figma 重構**       | `semantics.json` 拆出 `device.json`，3 個 mode（值可先全用 Desktop） | 結構對齊 Figma、未來做 RWD 才不用大改              |
| **B. 保持 code 現狀，同步時轉換** | adapter 把 code 的重複 `space.*` 收斂成單一 mode 推到 Figma `Device` | 不動 code，但 Figma 的 Tablet/Mobile mode 會被覆寫 |

---

## 已完成的工作（v0.2）

### Phase 1 · Token 雙向同步工具鏈

- `scripts/token-adapter.mjs` — DTCG / Figma 互轉、alias 解析、em ↔ percent 換算、rgba → hex
- `scripts/check-token-drift.mjs` — 純 Node 腳本，產出 `reports/drift-{date}.md`
- `tokens/figma-snapshot.json` — Figma 端 audit log（AI 透過 MCP 維護）
- `npm run figma:diff` — 一鍵跑

### 已決策的架構選擇

- **Device collection 採用 Figma 結構**：拆出 `tokens/device.json`，3 mode（Desktop / Tablet / Mobile，值先全用 Desktop）
- **CSS 命名混合策略**：既有 CSS variables 保留（`--ink`、`--primary`），新加的用 `--<group>-<name>` 形式（`--icon-primary`、`--bg-chart-area`、`--icon-size-md`）
- **letterSpacing 在 adapter 內做 em × 100 → percent 換算**，code 維持 DTCG `em` 標準
- **Figma-only 的 19 個 token 補進 code**：補齊後 0 drift

### Phase 2 · Component 對應

- ❌ **正式 Code Connect**：GOONS Pro tier 沒權限（需 Org / Enterprise）
- ✅ 改用 `figma-mapping.md` **人類可讀對應表**（11 BentoCard + 26 reusable primitives + 36 icons）

### 已完成的檔案產出

| 檔案                            | 用途                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `tokens/device.json`            | 新增 · 3 mode 結構                                    |
| `tokens/figma-snapshot.json`    | 新增 · Figma 端 audit log                             |
| `scripts/token-adapter.mjs`     | 新增 · 互轉邏輯                                       |
| `scripts/check-token-drift.mjs` | 新增 · diff 腳本                                      |
| `figma-mapping.md`              | 新增 · component 對應字典                             |
| `reports/drift-2026-05-11.md`   | 新增 · 首份 drift 報告（0 drift）                     |
| `tokens/primitives.json`        | 修改 · 補 9 個 token（2 alpha + 7 iconSize）          |
| `tokens/semantics.json`         | 修改 · 補 11 個 icon/inverse token、移除 space/corner |
| `src/styles.css`                | 修改 · 補 18 個 CSS variables                         |
| `src/design-system.jsx`         | 修改 · 補 icon / inverse swatches + Icon Size section |
| `design-principles.md`          | 修改 · 第 7 條補執行流程                              |
| `package.json`                  | 修改 · 加 `figma:diff` script                         |

---

## 附錄 · 完整 Variables 名單（Figma 端）

<details>
<summary>Primitives（111）</summary>

`color/blue/50, 100, 200, 400, 600, 900`
`color/blue-dark/soft, ink`
`color/neutral/0, 25, 50, 75, 100, 200, 300, 400, 500, 600, 800, 950`
`color/neutral-dark/50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950`
`color/green/500, color/red/500, color/orange/500`
`color/white, color/black`
`color/blue/600-a8`
`color/blue-dark/ink-a20`
`spacing/0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 22, 24, 28, 40, 60`
`radius/none, xs, sm, md, lg, lg-2, xl, 2xl, full`
`fontSize/2xs, xs, sm, md, base, lg, xl, 2xl, 3xl`
`fontWeight/regular, book, medium, book-bold, semibold`
`lineHeight/tight, snug, normal, relaxed, loose`
`letterSpacing/tightest, tighter, tight, snug, normal, wide, wider, widest`
`borderWidth/0, hairline, thin, thick`
`opacity/0, 14, 15, 25, 35, 40, 50, 60, 75, 100`
`iconSize/xs, sm, md, lg, xl, 2xl, 3xl`

</details>

<details>
<summary>Theme（54）</summary>

`bg/page, surface, secondary, hover, brand, brand-soft, chart-area, inverse`
`text/primary, secondary, muted, faint, brand, on-brand, positive, negative, warning, link, on-inverse`
`border/default, strong, divider, focus`
`badge/positive, positive-bg, negative, negative-bg, warning, warning-bg, brand, brand-bg, neutral, neutral-bg`
`heatmap/l0, l1, l2, l3, l4`
`state/disabled-bg, disabled-text, disabled-border, scrim, modal-overlay, selection, scrollbar-thumb, scrollbar-hover`
`icon/primary, secondary, muted, brand, on-brand, positive, negative, on-inverse`

</details>

<details>
<summary>Device（14）</summary>

`space/page, section, card, card-gap, grid, inline-sm, inline-md, inline-lg`
`corner/button, card, chip, input, badge, popover`

</details>

---

## 變更紀錄

| 日期       | 版本 | 變更                                                                                                                            |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-11 | v0.1 | 初版對齊報告：分析 Figma 端 179 variables，列出 19 個 Figma-only 差距與 4 個待決策                                              |
| 2026-05-11 | v0.2 | Phase 1 收尾完成：補 20 token、拆 device.json、補 CSS variables、補 design-system.jsx swatches、寫 figma-mapping.md，達 0 drift |
