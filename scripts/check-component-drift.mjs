#!/usr/bin/env node
// check-component-drift.mjs
// 比對 code 端元件指紋（component-spec.json）與 Figma 端 live 指紋（figma-component-snapshot.json），
// 輸出 markdown 到 reports/component-drift-{YYYY-MM-DD}.md（台北時間）。
//
// 用法：
//   node scripts/check-component-drift.mjs   （或 npm run figma:diff:components）
//
// 前置：figma-component-snapshot.json 要先用 AI 透過 Figma MCP 拉取/更新（get_variable_defs + get_metadata）。
//       refresh prompt 見 figma-mapping.md 第 7 節。
//
// 偵測項目：
//   1. variants 增減（例：Tag Figma 有 personal、code 無）
//   2. states 增減
//   3. radius 綁定不一致（code 的 --r-* 經 $radiusMap 換算後比對；寫死的 literal 會被標出）
//   4. hardcoded — code 端該綁 token 卻寫死的值
//   5. Figma 端綁定 hygiene（advisory）— Figma 元件把顏色綁到 `var(--*)` 命名變數而非語意 token，建議 rebind

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const spec = JSON.parse(readFileSync(join(ROOT, "tokens/component-spec.json"), "utf8"));
const snapshot = JSON.parse(readFileSync(join(ROOT, "tokens/figma-component-snapshot.json"), "utf8"));

const radiusMap = spec.$radiusMap || {};
const codeComps = spec.components || {};
const figmaComps = snapshot.components || {};

// code 端 radius（CSS var 或 literal）解析成 Figma 命名空間
function resolveRadius(v) {
  if (typeof v !== "string") return { resolved: v, hardcoded: false };
  if (v.startsWith("--")) return { resolved: radiusMap[v] || `?${v}`, hardcoded: false };
  return { resolved: v, hardcoded: true }; // literal，例如 "4px"
}
function setDiff(a = [], b = []) {
  const sa = new Set(a), sb = new Set(b);
  return { onlyInCode: a.filter((x) => !sb.has(x)), onlyInFigma: b.filter((x) => !sa.has(x)) };
}

const results = [];
const allKeys = new Set([...Object.keys(codeComps), ...Object.keys(figmaComps)]);

for (const name of [...allKeys].sort()) {
  const c = codeComps[name];
  const f = figmaComps[name];

  if (c && !f) { results.push({ name, structural: ["code 有此元件，Figma snapshot 缺（請補拉）"], missing: true }); continue; }
  if (!c && f) { results.push({ name, structural: ["Figma 有此元件，code 端 spec 缺（新設計尚未實作？）"], missing: true, figmaNode: f.figmaNode }); continue; }

  const structural = [];

  const vd = setDiff(c.variants, f.variants);
  if (vd.onlyInCode.length) structural.push(`variants 多出（code 有 Figma 無）：${vd.onlyInCode.join(", ")}`);
  if (vd.onlyInFigma.length) structural.push(`variants 缺漏（Figma 有 code 無）：${vd.onlyInFigma.join(", ")}`);

  const sd = setDiff(c.states, f.states);
  if (sd.onlyInCode.length) structural.push(`states 多出（code 有 Figma 無）：${sd.onlyInCode.join(", ")}`);
  if (sd.onlyInFigma.length) structural.push(`states 缺漏（Figma 有 code 無）：${sd.onlyInFigma.join(", ")}`);

  const rr = resolveRadius(c.radius);
  if (rr.hardcoded) structural.push(`radius 寫死 \`${c.radius}\`，Figma 綁 \`${f.radius}\`（值相同但 code 沒綁 token）`);
  else if (rr.resolved !== f.radius) structural.push(`radius 不一致：code \`${c.radius}\` → \`${rr.resolved}\` vs Figma \`${f.radius}\``);

  const hardcoded = Array.isArray(c.hardcoded) ? c.hardcoded : [];
  const figmaCssVar = Array.isArray(f.colorCssVarNamed) ? f.colorCssVarNamed : [];

  results.push({ name, figmaNode: f.figmaNode, structural, hardcoded, figmaCssVar });
}

// ---- 統計 ----
const structuralCount = results.filter((r) => r.structural && r.structural.length).length;
const hardcodedCount = results.reduce((n, r) => n + (r.hardcoded ? r.hardcoded.length : 0), 0);
const figmaHygieneComps = results.filter((r) => r.figmaCssVar && r.figmaCssVar.length).length;
const figmaHygieneTotal = results.reduce((n, r) => n + (r.figmaCssVar ? r.figmaCssVar.length : 0), 0);
const cleanCount = results.filter(
  (r) => !r.missing && !(r.structural && r.structural.length) && !(r.hardcoded && r.hardcoded.length)
).length;

// ---- 產出 markdown（台北時間 UTC+8）----
const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
const reportPath = join(ROOT, `reports/component-drift-${today}.md`);
mkdirSync(dirname(reportPath), { recursive: true });

const L = [];
L.push("# Figma ↔ Code Component Drift Report");
L.push("");
L.push(`> 產生時間：${today}（台北時間）  `);
L.push(`> Figma file：${snapshot.$metadata.fileName} (\`${snapshot.$metadata.fileKey}\`)  `);
L.push(`> Snapshot：${snapshot.$metadata.snapshotAt} · 來源 ${snapshot.$metadata.source}  `);
L.push(`> 涵蓋：${Object.keys(codeComps).length} 個原子元件`);
L.push("");
L.push("## TL;DR");
L.push("");
L.push("| 類別 | 數量 |");
L.push("|---|---|");
L.push(`| ✅ 乾淨（結構對齊、無寫死） | ${cleanCount} |`);
L.push(`| ⚠️ 結構漂移（variants / states / radius） | ${structuralCount} |`);
L.push(`| 🔧 寫死待 tokenize（code 端） | ${hardcodedCount} |`);
L.push(`| 🎨 Figma 綁 \`var(--*)\` 非語意 token（advisory） | ${figmaHygieneTotal}（${figmaHygieneComps} 個元件） |`);
L.push("");

const structuralRows = results.filter((r) => r.structural && r.structural.length);
if (structuralRows.length) {
  L.push("## ⚠️ 結構漂移 / 缺漏");
  L.push("");
  for (const r of structuralRows) {
    L.push(`### ${r.name}${r.figmaNode ? ` （Figma \`${r.figmaNode}\`）` : ""}`);
    L.push("");
    for (const s of r.structural) L.push(`- ${s}`);
    L.push("");
  }
}

const hcRows = results.filter((r) => r.hardcoded && r.hardcoded.length);
if (hcRows.length) {
  L.push("## 🔧 寫死待 tokenize（code 端）");
  L.push("");
  L.push("| 元件 | 屬性 | 寫死值 | 說明 |");
  L.push("|---|---|---|---|");
  for (const r of hcRows) for (const h of r.hardcoded) L.push(`| ${r.name} | ${h.prop} | \`${h.value}\` | ${h.note || ""} |`);
  L.push("");
}

const hygRows = results.filter((r) => r.figmaCssVar && r.figmaCssVar.length);
if (hygRows.length) {
  L.push("## 🎨 Figma 端綁定 hygiene（advisory，不擋 CI）");
  L.push("");
  L.push("> 以下元件在 Figma 把顏色綁到 `var(--*)` 命名的變數，而非語意 token（`bg/*`、`text/*` 等）。");
  L.push("> 值通常正確，但元件庫等於沒接上 Theme collection，建議在 Figma 把這些屬性 rebind 到語意 token，讓元件與 token 系統單一事實來源。");
  L.push("");
  L.push("| 元件 | 綁 var(--*) 的顏色數 | 清單 |");
  L.push("|---|---|---|");
  for (const r of hygRows) L.push(`| ${r.name} | ${r.figmaCssVar.length} | ${r.figmaCssVar.map((x) => `\`${x}\``).join(", ")} |`);
  L.push("");
}

L.push("## ✅ 乾淨元件");
L.push("");
const cleanNames = results
  .filter((r) => !r.missing && !(r.structural && r.structural.length) && !(r.hardcoded && r.hardcoded.length))
  .map((r) => r.name);
L.push(cleanNames.length ? cleanNames.map((n) => `\`${n}\``).join(", ") : "（無）");
L.push("");

writeFileSync(reportPath, L.join("\n"));

console.log(`\nComponent drift report → ${reportPath}\n`);
console.log(
  `Summary: ✅ ${cleanCount} clean · ⚠️ ${structuralCount} structural · 🔧 ${hardcodedCount} hardcoded · 🎨 ${figmaHygieneTotal} figma-var-bound\n`
);

// 結構漂移 / 寫死 / 缺漏 → exit 1（給 CI）；Figma hygiene 為 advisory，不擋
if (structuralCount > 0 || hardcodedCount > 0) process.exitCode = 1;
