// token-adapter.mjs
// 把 code 端 DTCG（tokens/primitives.json + semantics.json）與
// Figma snapshot（tokens/figma-snapshot.json）都 normalize 成同一份中性 schema，
// 後續 drift 工具用這份 schema 做 diff。

// ---- 中性 schema ----
// {
//   collections: [
//     {
//       name: "Primitives",
//       modes: ["Value"],
//       variables: [
//         {
//           name: "color/blue/600",   // 統一 slash path
//           type: "COLOR" | "FLOAT",
//           values: {
//             "Value": { kind: "literal", value: "#0e4fe7" | 16 } |
//                      { kind: "alias",   ref: "color/blue/600" }
//           }
//         }
//       ]
//     }
//   ]
// }

// 把 DTCG 巢狀路徑展平成 slash path
// 例如 { color: { blue: { 600: { $value: ... } } } } → { "color/blue/600": { value, type, description } }
function flattenDTCG(obj, prefix = "") {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue; // 跳過 $description / $type / $value（單獨的 metadata）
    const path = prefix ? `${prefix}/${key}` : key;
    if (val && typeof val === "object") {
      if ("$value" in val) {
        // 葉節點
        out[path] = {
          value: val.$value,
          type: val.$type,
          description: val.$description || "",
        };
      } else {
        // 中間節點 → 遞迴
        Object.assign(out, flattenDTCG(val, path));
      }
    }
  }
  return out;
}

// rgba(r,g,b,a) → hex with alpha
function rgbaToHex(rgba) {
  const m = rgba.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/
  );
  if (!m) return rgba;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  const toHex = (n) => n.toString(16).padStart(2, "0");
  let hex = "#" + toHex(r) + toHex(g) + toHex(b);
  if (a < 1) hex += toHex(Math.round(a * 255));
  return hex.toLowerCase();
}

// DTCG 值 → 中性 value 物件
function normalizeDTCGValue(rawValue, type) {
  // alias 偵測：字串符合 {xxx} 格式
  if (typeof rawValue === "string" && /^\{[^}]+\}$/.test(rawValue)) {
    let ref = rawValue.slice(1, -1).replace(/\./g, "/");
    // 剝掉 light/ 或 dark/ 前綴：DTCG 內 cross-mode alias 用全路徑（如 {light.text.primary}），
    // 但 Figma Variables 的 alias 是「同 collection 內某 variable 的當前 mode」，沒有 mode 前綴。
    // normalize 兩邊後 ref 都統一為 "text/primary"。
    ref = ref.replace(/^(light|dark|desktop|tablet|mobile)\//, "");
    return { kind: "alias", ref };
  }

  // COLOR
  if (type === "color" && typeof rawValue === "string") {
    if (rawValue.startsWith("rgba(") || rawValue.startsWith("rgb(")) {
      return { kind: "literal", value: rgbaToHex(rawValue) };
    }
    if (rawValue.startsWith("#")) {
      return { kind: "literal", value: rawValue.toLowerCase() };
    }
  }

  // DIMENSION：解析 px / em / 純數字
  if (type === "dimension" && typeof rawValue === "string") {
    if (rawValue.endsWith("px")) {
      return { kind: "literal", value: parseFloat(rawValue) };
    }
    if (rawValue.endsWith("em")) {
      // em × 100 = percent（Figma letterSpacing 用 percent number）
      return { kind: "literal", value: parseFloat(rawValue) * 100 };
    }
    return { kind: "literal", value: parseFloat(rawValue) };
  }

  // 純 number（fontWeight / number / lineHeight unitless）
  if (typeof rawValue === "number") {
    return { kind: "literal", value: rawValue };
  }

  return { kind: "literal", value: rawValue };
}

// DTCG type → Figma type
function mapType(dtcgType) {
  if (dtcgType === "color") return "COLOR";
  return "FLOAT"; // dimension / fontWeight / number → FLOAT
}

// 把 code 端的 3 份 token JSON 轉成中性 schema
// - primitivesJson → Primitives collection
// - semanticsJson  → Theme collection（light/dark 合併成 2 個 mode）
// - deviceJson     → Device collection（desktop/tablet/mobile 合併成 3 個 mode）
export function normalizeCodeTokens(primitivesJson, semanticsJson, deviceJson) {
  // ---- Primitives collection ----
  const primFlat = flattenDTCG(primitivesJson);
  const primitivesVars = Object.entries(primFlat).map(([name, info]) => ({
    name,
    type: mapType(info.type),
    values: { Value: normalizeDTCGValue(info.value, info.type) },
    description: info.description,
  }));

  // ---- Theme collection（light + dark 合併）----
  const lightFlat = flattenDTCG(semanticsJson.light || {});
  const darkFlat = flattenDTCG(semanticsJson.dark || {});
  const allThemeKeys = new Set([
    ...Object.keys(lightFlat),
    ...Object.keys(darkFlat),
  ]);

  const themeVars = [];
  for (const key of allThemeKeys) {
    const lightInfo = lightFlat[key];
    const darkInfo = darkFlat[key];
    const info = lightInfo || darkInfo;
    if (!info) continue;
    const values = {};
    if (lightInfo)
      values.Light = normalizeDTCGValue(lightInfo.value, lightInfo.type);
    if (darkInfo)
      values.Dark = normalizeDTCGValue(darkInfo.value, darkInfo.type);
    themeVars.push({
      name: key,
      type: mapType(info.type),
      values,
      description: info.description,
    });
  }

  // ---- Device collection（desktop + tablet + mobile 合併成 3 個 mode）----
  const desktopFlat = flattenDTCG(deviceJson.desktop || {});
  const tabletFlat = flattenDTCG(deviceJson.tablet || {});
  const mobileFlat = flattenDTCG(deviceJson.mobile || {});
  const allDeviceKeys = new Set([
    ...Object.keys(desktopFlat),
    ...Object.keys(tabletFlat),
    ...Object.keys(mobileFlat),
  ]);

  const deviceVars = [];
  for (const key of allDeviceKeys) {
    const dInfo = desktopFlat[key];
    const tInfo = tabletFlat[key];
    const mInfo = mobileFlat[key];
    const info = dInfo || tInfo || mInfo;
    if (!info) continue;
    const values = {};
    if (dInfo) values.Desktop = normalizeDTCGValue(dInfo.value, dInfo.type);
    if (tInfo) values.Tablet = normalizeDTCGValue(tInfo.value, tInfo.type);
    if (mInfo) values.Mobile = normalizeDTCGValue(mInfo.value, mInfo.type);
    deviceVars.push({
      name: key,
      type: mapType(info.type),
      values,
      description: info.description,
    });
  }

  return {
    collections: [
      { name: "Primitives", modes: ["Value"], variables: primitivesVars },
      { name: "Theme", modes: ["Light", "Dark"], variables: themeVars },
      {
        name: "Device",
        modes: ["Desktop", "Tablet", "Mobile"],
        variables: deviceVars,
      },
    ],
  };
}

// 把 figma-snapshot.json 轉成中性 schema
export function normalizeFigmaSnapshot(snapshotJson) {
  return {
    collections: snapshotJson.collections.map((c) => ({
      name: c.name,
      modes: c.modes,
      variables: c.variables.map((v) => {
        const values = {};
        for (const [modeName, rawVal] of Object.entries(v.values)) {
          if (typeof rawVal === "string" && rawVal.startsWith("→ ")) {
            values[modeName] = { kind: "alias", ref: rawVal.slice(2).trim() };
          } else if (typeof rawVal === "string") {
            values[modeName] = {
              kind: "literal",
              value: rawVal.toLowerCase(),
            };
          } else {
            values[modeName] = { kind: "literal", value: rawVal };
          }
        }
        return {
          name: v.name,
          type: v.type,
          values,
          description: v.description || "",
        };
      }),
    })),
  };
}
