// finance-store.jsx — 理財資料的單一 store
// 三組資料（帳目 transactions / 存入 deposits / 目標 goal）集中於此，以 localStorage 持久化。
// 衍生數值（淨餘、佔比、達成率、趨勢）一律用下方純函式即時計算，不另存（對齊 PRD 6.4 / 第 10 節）。
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCategory, OTHER_EXPENSE, EXPENSE_CATEGORIES } from "./finance-categories.js";

const LS_KEY = "dayboard-finance-v1";

/* ============================ 小工具 ============================ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowISO = () => new Date().toISOString();
// "YYYY-MM-DD"（本地時間）
const ds = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
// 把 "YYYY-MM-DD" 轉成當地 00:00 的 Date（避免時區位移）
const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const sortByDateDesc = (arr) =>
  [...arr].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""),
  );
const mkTxn = (d) => {
  const ts = nowISO();
  return {
    id: uid(),
    name: d.name,
    date: d.date,
    type: d.type,
    category: d.category,
    amount: Math.round(Number(d.amount)),
    createdAt: ts,
    updatedAt: ts,
  };
};
const mkDeposit = (d) => {
  const ts = nowISO();
  return {
    id: uid(),
    amount: Math.round(Number(d.amount)),
    date: d.date,
    createdAt: ts,
    updatedAt: ts,
  };
};

/* ============================ Mock 假資料（首次載入用） ============================ */
function seedData() {
  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth();
  const tx = [];
  const dep = [];
  const at = (monthOffset, day) => ds(new Date(Y, M + monthOffset, day));
  const addTx = (name, type, category, amount, monthOffset, day) =>
    tx.push(mkTxn({ name, type, category, amount, date: at(monthOffset, day) }));

  // 每月固定收支模板（近 6 個月），讓趨勢圖與「較上月」有資料
  const expenseTemplate = [
    ["午餐便當", "food", 110, 2],
    ["晚餐", "food", 320, 7],
    ["早午餐", "food", 260, 16],
    ["手搖飲", "drink", 75, 9],
    ["咖啡", "drink", 150, 19],
    ["捷運儲值", "transport", 1000, 1],
    ["計程車", "transport", 260, 13],
    ["加油", "transport", 900, 21],
    ["串流訂閱", "entertainment", 390, 12],
    ["電影票", "entertainment", 620, 18],
    ["線上課程", "study", 1800, 8],
    ["書籍", "study", 480, 22],
    ["日用品", "home", 420, 5],
    ["保養品", "beauty", 680, 10],
  ];
  for (let k = 0; k < 6; k++) {
    addTx(
      k === 0 ? "五月薪資" : "月薪",
      "income",
      "salary",
      k === 0 ? 68000 : 64000 + (5 - k) * 800,
      -k,
      10,
    );
    expenseTemplate.forEach(([name, cat, amt, day], i) => {
      const v = Math.round(amt * (1 + (((k + i) % 5) - 2) * 0.06)); // 各月微幅變化，趨勢更自然
      addTx(name, "expense", cat, v, -k, day);
    });
  }
  // 偶發收入
  addTx("年中獎金", "income", "bonus", 12000, 0, 5);
  addTx("接案尾款", "income", "sidejob", 9800, -1, 24);
  addTx("股息", "income", "investment", 3600, -2, 15);

  // 本月專屬（對齊參考圖）＋ 一筆極小額測試「其他」歸併
  addTx("Netflix 訂閱費", "expense", "entertainment", 390, 0, 14);
  addTx("午餐 拉麵", "expense", "food", 280, 0, 14);
  addTx("UNIQLO 外套", "expense", "clothing", 1290, 0, 6);
  addTx("超商雜支", "expense", "other", 95, 0, 23);
  // 本週（今天往前幾天）讓「週」檢視有資料
  addTx("便利商店", "expense", "food", 86, 0, Math.max(1, now.getDate() - 2));
  addTx("午餐", "expense", "food", 130, 0, Math.max(1, now.getDate() - 1));
  addTx("咖啡", "expense", "drink", 150, 0, now.getDate());

  // 存入記錄（近 10 個月），合計約 360,000 的 61%
  [
    [20000, 0],
    [18000, -1],
    [22000, -2],
    [20000, -3],
    [25000, -4],
    [21000, -5],
    [21000, -6],
    [22000, -7],
    [30000, -8],
    [20600, -9],
  ].forEach(([amount, mo]) => dep.push(mkDeposit({ amount, date: at(mo, 1) })));

  return {
    transactions: sortByDateDesc(tx),
    deposits: sortByDateDesc(dep),
    goal: { year: Y, targetAmount: 360000, updatedAt: nowISO() },
  };
}

/* ============================ 持久化 ============================ */
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* 解析失敗就用 seed */
  }
  return null;
}

/* ============================ 衍生計算（純函式，不依賴 store） ============================ */
const sumNet = (list) => list.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
const inRange = (t, start, end) => {
  const d = parseDate(t.date);
  return d >= start && d <= end;
};
// 週一為一週起點
function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // 一=0 … 日=6
  x.setDate(x.getDate() - day);
  return x;
}
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// 依顆粒度求出本期 / 上期區間與標籤
export function periodMeta(period, ref = new Date()) {
  if (period === "week") {
    const start = startOfWeek(ref);
    return {
      start,
      end: endOfDay(addDays(start, 6)),
      prevStart: addDays(start, -7),
      prevEnd: endOfDay(addDays(start, -1)),
      incomeLabel: "本週收入",
      expenseLabel: "本週支出",
      deltaLabel: "較上週",
    };
  }
  if (period === "year") {
    const y = ref.getFullYear();
    return {
      start: new Date(y, 0, 1),
      end: new Date(y, 11, 31, 23, 59, 59),
      prevStart: new Date(y - 1, 0, 1),
      prevEnd: new Date(y - 1, 11, 31, 23, 59, 59),
      incomeLabel: "今年收入",
      expenseLabel: "今年支出",
      deltaLabel: "較去年",
    };
  }
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return {
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 0, 23, 59, 59),
    prevStart: new Date(y, m - 1, 1),
    prevEnd: new Date(y, m, 0, 23, 59, 59),
    incomeLabel: "當月收入",
    expenseLabel: "當月支出",
    deltaLabel: "較上月",
  };
}

// 重點數據列：收入 / 支出 / 淨餘 + 較上期變化（絕對額 delta + 百分比 pct）
export function periodStats(transactions, period, ref = new Date()) {
  const meta = periodMeta(period, ref);
  const cur = transactions.filter((t) => inRange(t, meta.start, meta.end));
  const prev = transactions.filter((t) => inRange(t, meta.prevStart, meta.prevEnd));
  const income = cur.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = cur.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const prevNet = sumNet(prev);
  const delta = net - prevNet;
  const pct = prevNet !== 0 ? (delta / Math.abs(prevNet)) * 100 : null; // null = 上期無資料，不顯示 %
  return {
    income,
    expense,
    net,
    delta,
    pct,
    hasData: cur.length > 0,
    incomeLabel: meta.incomeLabel,
    expenseLabel: meta.expenseLabel,
    deltaLabel: meta.deltaLabel,
  };
}

// 趨勢曲線：本期內逐時間點的「累積淨餘」
export function trendData(transactions, period, ref = new Date()) {
  const meta = periodMeta(period, ref);
  if (period === "week") {
    const labels = ["一", "二", "三", "四", "五", "六", "日"];
    return labels.map((label, i) => ({
      label,
      value: sumNet(
        transactions.filter((t) => inRange(t, meta.start, endOfDay(addDays(meta.start, i)))),
      ),
    }));
  }
  if (period === "year") {
    const y = ref.getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}月`,
      value: sumNet(
        transactions.filter((t) => inRange(t, meta.start, new Date(y, i + 1, 0, 23, 59, 59))),
      ),
    }));
  }
  // month：1 ~ 月底，每天累積
  const lastDay = meta.end.getDate();
  return Array.from({ length: lastDay }, (_, i) => ({
    label: String(i + 1),
    value: sumNet(
      transactions.filter((t) =>
        inRange(
          t,
          meta.start,
          new Date(meta.start.getFullYear(), meta.start.getMonth(), i + 1, 23, 59, 59),
        ),
      ),
    ),
  }));
}

// 支出分類佔比（指定年月）；佔比 < 3% 歸併「其他」
export function categoryBreakdown(transactions, year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  const exp = transactions.filter((t) => t.type === "expense" && inRange(t, start, end));
  const total = exp.reduce((s, t) => s + t.amount, 0);

  const map = new Map();
  exp.forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
  let items = [...map.entries()].map(([key, value]) => ({
    key,
    value,
    cat: getCategory("expense", key),
  }));

  // 佔比 < 3% 的（「其他」本身除外）歸併進「其他」
  if (total > 0) {
    const big = [];
    let otherSum = 0;
    items.forEach((it) => {
      if (it.key !== "other" && it.value / total < 0.03) otherSum += it.value;
      else big.push(it);
    });
    if (otherSum > 0) {
      const existing = big.find((b) => b.key === "other");
      if (existing) existing.value += otherSum;
      else big.push({ key: "other", value: otherSum, cat: OTHER_EXPENSE });
    }
    items = big;
  }
  // 依分類定義順序排序（食物→其他），不再依金額大小
  const catOrder = EXPENSE_CATEGORIES.map((c) => c.key);
  items.sort((a, b) => catOrder.indexOf(a.key) - catOrder.indexOf(b.key));
  return {
    total,
    items: items.map((it) => ({ ...it, pct: total > 0 ? (it.value / total) * 100 : 0 })),
  };
}

// 儲蓄達成
export function savingProgress(deposits, goal) {
  const saved = deposits.reduce((s, d) => s + d.amount, 0);
  const target = goal?.targetAmount || 0;
  const pct = target > 0 ? (saved / target) * 100 : null; // null = 尚未設定目標
  return { saved, target, pct };
}

/* ============================ Provider ============================ */
const FinanceCtx = createContext(null);

export function FinanceProvider({ children }) {
  const [state, setState] = useState(() => load() || seedData());

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* localStorage 滿了就略過，不影響使用 */
    }
  }, [state]);

  const addTransaction = useCallback((data) => {
    setState((s) => ({ ...s, transactions: sortByDateDesc([mkTxn(data), ...s.transactions]) }));
  }, []);
  const updateTransaction = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      transactions: sortByDateDesc(
        s.transactions.map((t) =>
          t.id === id
            ? {
                ...t,
                ...data,
                amount: Math.round(Number(data.amount ?? t.amount)),
                updatedAt: nowISO(),
              }
            : t,
        ),
      ),
    }));
  }, []);
  const deleteTransaction = useCallback((id) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, []);

  const addDeposit = useCallback((data) => {
    setState((s) => ({ ...s, deposits: sortByDateDesc([mkDeposit(data), ...s.deposits]) }));
  }, []);
  const updateDeposit = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      deposits: sortByDateDesc(
        s.deposits.map((d) =>
          d.id === id
            ? {
                ...d,
                ...data,
                amount: Math.round(Number(data.amount ?? d.amount)),
                updatedAt: nowISO(),
              }
            : d,
        ),
      ),
    }));
  }, []);
  const deleteDeposit = useCallback((id) => {
    setState((s) => ({ ...s, deposits: s.deposits.filter((d) => d.id !== id) }));
  }, []);

  const setGoal = useCallback((targetAmount) => {
    setState((s) => ({
      ...s,
      goal: {
        year: s.goal?.year || new Date().getFullYear(),
        targetAmount: Math.round(Number(targetAmount)),
        updatedAt: nowISO(),
      },
    }));
  }, []);

  const value = {
    transactions: state.transactions,
    deposits: state.deposits,
    goal: state.goal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    setGoal,
  };
  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>;
}

export const useFinance = () => useContext(FinanceCtx);
