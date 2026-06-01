# Figma ↔ Code Component Drift Report

> 產生時間：2026-06-01（台北時間）  
> Figma file：Personal-Dashboard (`3n0ftsxOG20Hl214ii5vFL`)  
> Snapshot：2026-06-01 · 來源 live：Figma MCP get_variable_defs + get_metadata 實拉  
> 涵蓋：10 個原子元件

## TL;DR

| 類別                                            | 數量            |
| ----------------------------------------------- | --------------- |
| ✅ 乾淨（結構對齊、無寫死）                     | 10              |
| ⚠️ 結構漂移（variants / states / radius）       | 0               |
| 🔧 寫死待 tokenize（code 端）                   | 0               |
| 🎨 Figma 綁 `var(--*)` 非語意 token（advisory） | 49（10 個元件） |

## 🎨 Figma 端綁定 hygiene（advisory，不擋 CI）

> 以下元件在 Figma 把顏色綁到 `var(--*)` 命名的變數，而非語意 token（`bg/*`、`text/*` 等）。
> 值通常正確，但元件庫等於沒接上 Theme collection，建議在 Figma 把這些屬性 rebind 到語意 token，讓元件與 token 系統單一事實來源。

| 元件        | 綁 var(--\*) 的顏色數 | 清單                                                                                                                                                                           |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Badge       | 4                     | `var(--primary)`, `var(--primary-fg)`, `var(--surface-hover)`, `var(--muted)`                                                                                                  |
| Button      | 6                     | `var(--surface-2)`, `var(--border)`, `var(--ink)`, `var(--surface-hover)`, `var(--border-strong)`, `var(--divider)`                                                            |
| Card        | 3                     | `var(--surface)`, `var(--border)`, `var(--border-strong)`                                                                                                                      |
| Checkbox    | 4                     | `var(--surface)`, `var(--border-strong)`, `var(--primary)`, `var(--primary-fg)`                                                                                                |
| DatePill    | 4                     | `var(--muted)`, `var(--ink)`, `var(--surface)`, `var(--border)`                                                                                                                |
| DeltaBadge  | 4                     | `var(--pos)`, `var(--pos-bg)`, `var(--neg)`, `var(--neg-bg)`                                                                                                                   |
| IconButton  | 5                     | `var(--surface)`, `var(--border)`, `var(--primary)`, `var(--surface-hover)`, `var(--border-strong)`                                                                            |
| Kbd         | 3                     | `var(--muted)`, `var(--surface-2)`, `var(--border)`                                                                                                                            |
| SearchInput | 6                     | `var(--muted)`, `var(--surface-2)`, `var(--border)`, `var(--surface)`, `var(--ink)`, `var(--primary)`                                                                          |
| Tag         | 10                    | `var(--primary)`, `var(--pos)`, `var(--pos-bg)`, `var(--warn)`, `var(--warn-bg)`, `var(--ink-2)`, `var(--surface-2)`, `var(--muted)`, `var(--surface-hover)`, `var(--divider)` |

## ✅ 乾淨元件

`Badge`, `Button`, `Card`, `Checkbox`, `DatePill`, `DeltaBadge`, `IconButton`, `Kbd`, `SearchInput`, `Tag`
