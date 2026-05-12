#!/usr/bin/env node
// check-token-drift.mjs
// 比對 code 端 tokens（primitives.json + semantics.json）與 Figma snapshot 的差異，
// 輸出 markdown 到 reports/drift-{YYYY-MM-DD}.md。
//
// 用法：
//   node scripts/check-token-drift.mjs
//
// 前置：figma-snapshot.json 要先用 AI 透過 Figma MCP 拉取更新（不是 Node 端能做的）。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeCodeTokens,
  normalizeFigmaSnapshot,
} from "./token-adapter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- 讀 3 份輸入 ----
const primitives = JSON.parse(
  readFileSync(join(ROOT, "tokens/primitives.json"), "utf8")
);
const semantics = JSON.parse(
  readFileSync(join(ROOT, "tokens/semantics.json"), "utf8")
);
const device = JSON.parse(
  readFileSync(join(ROOT, "tokens/device.json"), "utf8")
);
const snapshot = JSON.parse(
  readFileSync(join(ROOT, "tokens/figma-snapshot.json"), "utf8")
);

const codeData = normalizeCodeTokens(primitives, semantics, device);
const figmaData = normalizeFigmaSnapshot(snapshot);

// ---- 建立 (collection, variable) 索引 ----
function makeIndex(data) {
  const idx = new Map();
  for (const c of data.collections) {
    for (const v of c.variables) {
      idx.set(`${c.name}::${v.name}`, {
        collection: c.name,
        variable: v,
        modes: c.modes,
      });
    }
  }
  return idx;
}

const codeIdx = makeIndex(codeData);
const figmaIdx = makeIndex(figmaData);

// ---- 值比對 ----
const EPS = 0.001; // 浮點精度誤差容忍
function valueEqual(va, vb) {
  if (!va || !vb) return va === vb;
  if (va.kind !== vb.kind) return false;
  if (va.kind === "alias") return va.ref === vb.ref;
  if (va.kind === "literal") {
    if (typeof va.value === "string" && typeof vb.value === "string") {
      return va.value.toLowerCase() === vb.value.toLowerCase();
    }
    if (typeof va.value === "number" && typeof vb.value === "number") {
      return Math.abs(va.value - vb.value) < EPS;
    }
    return va.value === vb.value;
  }
  return false;
}

function fmtValue(v) {
  if (!v) return "(none)";
  if (v.kind === "alias") return `→ ${v.ref}`;
  return String(v.value);
}

// ---- 走訪所有 key 並分類 ----
const onlyInCode = [];
const onlyInFigma = [];
const drifted = []; // 兩邊都有但值不一致
const aligned = []; // 完全對齊

const allKeys = new Set([...codeIdx.keys(), ...figmaIdx.keys()]);
for (const key of allKeys) {
  const c = codeIdx.get(key);
  const f = figmaIdx.get(key);

  if (c && !f) {
    onlyInCode.push({ key, entry: c });
    continue;
  }
  if (!c && f) {
    onlyInFigma.push({ key, entry: f });
    continue;
  }

  // 兩邊都有 → 比對 mode 與值
  const modeIssues = [];
  // 以 Figma 端 modes 為基準（code 端可能不完整，特別是 Device collection）
  for (const m of f.modes) {
    const cv = c.variable.values[m];
    const fv = f.variable.values[m];
    if (!cv) {
      modeIssues.push({ mode: m, issue: "code-missing-mode", figma: fv });
    } else if (!valueEqual(cv, fv)) {
      modeIssues.push({ mode: m, issue: "value-mismatch", code: cv, figma: fv });
    }
  }
  if (modeIssues.length === 0) {
    aligned.push({ key });
  } else {
    drifted.push({ key, modeIssues, code: c, figma: f });
  }
}

// ---- 產出 markdown ----
const today = new Date().toISOString().slice(0, 10);
const reportPath = join(ROOT, `reports/drift-${today}.md`);
mkdirSync(dirname(reportPath), { recursive: true });

const lines = [];
lines.push("# Figma ↔ Code Token Drift Report");
lines.push("");
lines.push(`> 產生時間：${today}  `);
lines.push(
  `> Figma file：${snapshot.$metadata.fileName} (\`${snapshot.$metadata.fileKey}\`)  `
);
lines.push(`> Snapshot 時點：${snapshot.$metadata.snapshotAt}`);
lines.push("");

lines.push("## TL;DR");
lines.push("");
lines.push("| 類別 | 數量 |");
lines.push("|---|---|");
lines.push(`| ✅ 對齊 | ${aligned.length} |`);
lines.push(`| 📤 只在 Figma 端（code 缺） | ${onlyInFigma.length} |`);
lines.push(`| 📥 只在 Code 端（Figma 缺） | ${onlyInCode.length} |`);
lines.push(`| ⚠️ 值不一致 | ${drifted.length} |`);
lines.push("");

// ---- 📤 只在 Figma 端 ----
if (onlyInFigma.length) {
  lines.push("## 📤 只在 Figma 端（建議補進 `tokens/*.json`）");
  lines.push("");
  // 依 collection 分組
  const byColl = new Map();
  for (const x of onlyInFigma) {
    const cName = x.entry.collection;
    if (!byColl.has(cName)) byColl.set(cName, []);
    byColl.get(cName).push(x);
  }
  for (const [cName, items] of byColl) {
    lines.push(`### \`${cName}\` collection`);
    lines.push("");
    for (const x of items) {
      const v = x.entry.variable;
      const vals = Object.entries(v.values)
        .map(([m, vv]) => `**${m}**: ${fmtValue(vv)}`)
        .join(" / ");
      lines.push(`- \`${v.name}\` (${v.type}) — ${vals}`);
    }
    lines.push("");
  }
}

// ---- 📥 只在 Code 端 ----
if (onlyInCode.length) {
  lines.push("## 📥 只在 Code 端（建議補進 Figma Variables）");
  lines.push("");
  const byColl = new Map();
  for (const x of onlyInCode) {
    const cName = x.entry.collection;
    if (!byColl.has(cName)) byColl.set(cName, []);
    byColl.get(cName).push(x);
  }
  for (const [cName, items] of byColl) {
    lines.push(`### \`${cName}\` collection`);
    lines.push("");
    for (const x of items) {
      const v = x.entry.variable;
      const vals = Object.entries(v.values)
        .map(([m, vv]) => `**${m}**: ${fmtValue(vv)}`)
        .join(" / ");
      lines.push(`- \`${v.name}\` (${v.type}) — ${vals}`);
    }
    lines.push("");
  }
}

// ---- ⚠️ 值不一致 ----
if (drifted.length) {
  lines.push("## ⚠️ 值不一致");
  lines.push("");
  for (const d of drifted) {
    lines.push(`### \`${d.code.collection}\` :: \`${d.code.variable.name}\``);
    lines.push("");
    lines.push("| Mode | Code | Figma | 狀態 |");
    lines.push("|---|---|---|---|");
    for (const mi of d.modeIssues) {
      if (mi.issue === "code-missing-mode") {
        lines.push(
          `| ${mi.mode} | _(缺)_ | \`${fmtValue(mi.figma)}\` | code 端缺此 mode |`
        );
      } else {
        lines.push(
          `| ${mi.mode} | \`${fmtValue(mi.code)}\` | \`${fmtValue(mi.figma)}\` | 值不同 |`
        );
      }
    }
    lines.push("");
  }
}

// ---- ✅ 對齊清單 ----
lines.push("## ✅ 已對齊");
lines.push("");
lines.push(
  `<details><summary>${aligned.length} 個 tokens（點開展開）</summary>`
);
lines.push("");
const alignedByColl = new Map();
for (const a of aligned) {
  const [cName, vName] = a.key.split("::");
  if (!alignedByColl.has(cName)) alignedByColl.set(cName, []);
  alignedByColl.get(cName).push(vName);
}
for (const [cName, names] of alignedByColl) {
  lines.push(`**${cName}** (${names.length})：`);
  lines.push("");
  lines.push(names.map((n) => `\`${n}\``).join(", "));
  lines.push("");
}
lines.push("</details>");
lines.push("");

writeFileSync(reportPath, lines.join("\n"));

// ---- 終端輸出 summary ----
console.log(`\nDrift report → ${reportPath}\n`);
console.log(
  `Summary: ✅ ${aligned.length} aligned · 📤 ${onlyInFigma.length} figma-only · 📥 ${onlyInCode.length} code-only · ⚠️ ${drifted.length} drifted\n`
);

// 若有任何 drift，exit code 1（給 CI 用）
if (drifted.length > 0 || onlyInCode.length > 0 || onlyInFigma.length > 0) {
  process.exitCode = 1;
}
