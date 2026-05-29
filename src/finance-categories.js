// finance-categories.js — 理財類別「單一來源」
// 全站（帳目列色塊、甜甜圈扇形、圖例圓點、彈窗彩色標籤）一律從這裡引用，
// 確保同一類別在所有視覺元素中顏色一致（對齊 PRD 4.2 / 第 9 節）。
//
// color 欄位指向 styles.css 的 --fin-* CSS 變數；用下方 helper 取色，
// 以便由同一個 token 衍生「實色 / 淡底 / 邊框」三種用途，並自動跟淺/深主題切換。

// 支出類別（共 13 項，順序對齊 PRD 4.2 表格）
export const EXPENSE_CATEGORIES = [
  { key: "food", name: "食物", emoji: "🍜", color: "--fin-food" }, // warning ramp
  { key: "drink", name: "飲品", emoji: "🥤", color: "--fin-drink" }, // amber ramp
  { key: "clothing", name: "服飾", emoji: "👕", color: "--fin-clothing" }, // pink ramp
  { key: "beauty", name: "美妝", emoji: "💄", color: "--fin-beauty" }, // coral ramp
  { key: "health", name: "健康", emoji: "🏥", color: "--fin-health" }, // green ramp
  { key: "transport", name: "交通", emoji: "🚌", color: "--fin-transport" }, // blue ramp
  { key: "entertainment", name: "娛樂", emoji: "🎬", color: "--fin-entertainment" }, // purple ramp
  { key: "study", name: "學習", emoji: "📚", color: "--fin-study" }, // teal ramp
  { key: "home", name: "居家", emoji: "🏠", color: "--fin-home" }, // gray-dark ramp
  { key: "electronics", name: "電子", emoji: "💻", color: "--fin-electronics" }, // blue-dark ramp
  { key: "investment", name: "投資", emoji: "📈", color: "--fin-investment" }, // green-dark ramp
  { key: "insurance", name: "保險", emoji: "🛡️", color: "--fin-insurance" }, // teal-dark ramp
  { key: "other", name: "其他", emoji: "📦", color: "--fin-other" }, // gray ramp
];

// 收入類別（共 4 項）
// 注意：投資的 key 與支出的「投資」相同，但因為查找一律帶 type（type+key 唯一），
// 不會衝突；只是配色 token 不同（收入投資用較亮的 green）。
export const INCOME_CATEGORIES = [
  { key: "salary", name: "薪資", emoji: "💰", color: "--fin-salary" }, // success ramp
  { key: "sidejob", name: "副業", emoji: "🧑‍💻", color: "--fin-sidejob" }, // teal ramp
  { key: "bonus", name: "獎金", emoji: "🎁", color: "--fin-bonus" }, // amber ramp
  { key: "investment", name: "投資", emoji: "📈", color: "--fin-income-investment" }, // green ramp
];

// 取得某 type 的完整類別清單
export function allCategories(type) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// 依 (type, key) 取單一類別；查不到時 fallback 到該 type 的最後一項（其他 / 投資）
export function getCategory(type, key) {
  const list = allCategories(type);
  return list.find((c) => c.key === key) || list[list.length - 1];
}

// 「其他」類別物件（支出分類圖把佔比過小的歸併到這裡時用）
export const OTHER_EXPENSE = EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

// ---- 由類別 color token 衍生三種用途的色（皆走 CSS color-mix，自動跟主題切換）----
// 實色：圖例圓點、甜甜圈扇形、選中標籤邊框
export const finCatVar = (cat) => `var(${cat.color})`;
// 淡底：emoji 色塊底、選中標籤底
export const finCatSoft = (cat) => `color-mix(in oklch, var(${cat.color}) 16%, var(--surface))`;
// 邊框：選中標籤外框（比實色淡一點）
export const finCatBorder = (cat) => `color-mix(in oklch, var(${cat.color}) 55%, transparent)`;
// 標籤文字：每個類別專屬的可讀文字色（--fin-X-ink），淺色模式為深版、深色模式為亮版，
// 各自保留色相又確保在淡底上對比達 AA（見 styles.css 的 --fin-*-ink 定義）
export const finCatInk = (cat) => `var(${cat.color}-ink, var(${cat.color}))`;
