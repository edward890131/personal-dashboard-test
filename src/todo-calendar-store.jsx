// todo-calendar-store.jsx — 待辦 + 行事曆的單一資料源（SoT）
// 首頁「今日待辦」「行事曆」牌卡與 /todo 待辦行事曆頁面共用同一份 todos / events，
// 任一處修改即時同步。仿 finance-store.jsx：Context + localStorage 持久化。
//
// 「今天」由 export 的 TODAY 統一定義（真實今天的本地 00:00，與 Hero 顯示一致）；
// 卡片 / 分組要 filter「今天」「本週」時務必用這裡的 TODAY，seed 也依它對齊當週。
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// v1：改 SEED 假資料時要 bump 這個 key，否則開過頁面的瀏覽器讀舊存檔不會生效
// （規則同 finance-store）。之後接資料庫可移除這套 localStorage 機制。
// v3：補充六月第一週的 events / todos 假資料；bump 讓舊存檔重新 seed。
const LS_KEY = "dayboard-todocal-v3";

/* ============================ 日期工具 ============================ */
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfWeek = (d) => {
  // 週一為週首（與 calendar-page 一致）
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
};

// 「今天」錨點：真實今天（取本地 00:00），與 Hero 顯示的日期一致。
// 載入時計算一次即可（dashboard 不需跨午夜即時更新）；seed 會依此對齊當週。
export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const WEEK_START = startOfWeek(TODAY);
const D = (n) => addDays(WEEK_START, n);

/* ============================ Seed events（首次載入用） ============================ */
let _eid = 1;
const e = (o) => ({ id: "e" + _eid++, reminder: 10, ...o });
const SEED_EVENTS = [
  // Mon
  e({
    title: "Weekly Standup",
    date: D(0),
    start: 9.5,
    end: 10,
    cat: "work",
    location: "Zoom · #design-sync",
    notes: "回顧上週 OKR、討論 H1 設計目標。",
  }),
  e({
    title: "游泳訓練",
    date: D(0),
    start: 19,
    end: 20.5,
    cat: "health",
    location: "青年公園游泳池",
    notes: "主項 1km + 踢腿 400m。",
  }),
  // Tue
  e({
    title: "1:1 with Lina",
    date: D(1),
    start: 11,
    end: 11.5,
    cat: "work",
    location: "Zoom · 30 mins",
    notes: "Q2 個人發展計畫對焦。",
  }),
  e({
    title: "英文家教",
    date: D(1),
    start: 20,
    end: 21,
    cat: "study",
    location: "Cambly",
    notes: "主題：design portfolio review。",
  }),
  e({
    title: "午餐 with Mark",
    date: D(1),
    start: 12.5,
    end: 13.5,
    cat: "life",
    location: "信義區 · 八兵衛",
    notes: "討論側專案合作。",
  }),
  // Wed (TODAY)
  e({
    title: "Design Review — Onboarding",
    date: D(2),
    start: 14,
    end: 15.5,
    cat: "work",
    location: "Figma · 5 stakeholders",
    notes: "聚焦 step 2 的空狀態與微互動。",
  }),
  e({
    title: "皮膚科回診",
    date: D(2),
    start: 16.5,
    end: 17.5,
    cat: "health",
    location: "長庚醫院 · 林醫師",
    notes: "帶健保卡與上次處方。",
  }),
  e({
    title: "晚餐 with 阿哲",
    date: D(2),
    start: 19,
    end: 21,
    cat: "life",
    location: "永和 · 樂麵屋",
    notes: "生日宴。",
  }),
  e({
    title: "便利商店領貨",
    date: D(2),
    start: 21.5,
    end: 22,
    cat: "personal",
    location: "永騰門市",
    notes: "Shopee 包裹 ×2。",
  }),
  // Thu
  e({
    title: "Sprint Planning",
    date: D(3),
    start: 10,
    end: 11.5,
    cat: "work",
    location: "Linear + Zoom",
    notes: "排定 sprint 27 任務。",
  }),
  e({
    title: "瑜珈課",
    date: D(3),
    start: 18.5,
    end: 20,
    cat: "health",
    location: "Pure Yoga · 信義",
    notes: "Vinyasa Lv.2。",
  }),
  e({
    title: "讀書會：Shape Up",
    date: D(3),
    start: 21,
    end: 22.5,
    cat: "study",
    location: "Discord · #book-club",
    notes: "Ch.5–6 心得交換。",
  }),
  // Fri
  e({
    title: "Portfolio 拍攝",
    date: D(4),
    start: 11,
    end: 13,
    cat: "work",
    location: "中山區 · 攝影棚",
    notes: "帶兩套換洗。",
  }),
  e({
    title: "電影夜",
    date: D(4),
    start: 20,
    end: 22.5,
    cat: "life",
    location: "威秀 · IMAX",
    notes: "Dune 3 首映。",
  }),
  // Sat
  e({
    title: "爬山 — 七星山",
    date: D(5),
    start: 7,
    end: 12,
    cat: "health",
    location: "陽明山 · 苗圃登山口",
    notes: "帶 1.5L 水 + 行動電源。",
  }),
  e({
    title: "家庭聚餐",
    date: D(5),
    start: 18,
    end: 20,
    cat: "life",
    location: "大稻埕 · 永樂台菜",
    notes: "預訂 8 人桌。",
  }),
  // Sun
  e({
    title: "週計畫 + 整理 inbox",
    date: D(6),
    start: 10,
    end: 11,
    cat: "personal",
    location: "家裡 · 書房",
    notes: "清空 inbox、排下週重點。",
  }),
  e({
    title: "Side project — landing",
    date: D(6),
    start: 14,
    end: 17,
    cat: "study",
    location: "咖啡廳 · Goodman",
    notes: "Hero 區 + pricing 區 first pass。",
  }),

  /* ---- 補充：讓六月第一週（D0–D6）更飽滿 ---- */
  // Mon
  e({
    title: "晨間規劃 + 收信",
    date: D(0),
    start: 8.5,
    end: 9,
    cat: "personal",
    location: "家裡",
    notes: "排今日三件最重要的事。",
  }),
  e({
    title: "競品介面拆解",
    date: D(0),
    start: 13.5,
    end: 15,
    cat: "work",
    location: "Figma",
    notes: "拆 3 個 dashboard 競品的資訊架構。",
  }),
  e({
    title: "Coffee chat with PM",
    date: D(0),
    start: 16,
    end: 16.5,
    cat: "work",
    location: "茶水間",
    notes: "聊 Q3 roadmap 方向。",
  }),
  // Tue
  e({
    title: "使用者訪談",
    date: D(1),
    start: 15,
    end: 16,
    cat: "work",
    location: "Zoom · 受訪者 A",
    notes: "Onboarding 流程痛點。",
  }),
  e({
    title: "重訓 — 下肢",
    date: D(1),
    start: 18,
    end: 19,
    cat: "health",
    location: "World Gym",
    notes: "深蹲 + 硬舉。",
  }),
  // Wed
  e({
    title: "每日站會",
    date: D(2),
    start: 9.5,
    end: 10,
    cat: "work",
    location: "Zoom",
    notes: "同步昨日進度與阻礙。",
  }),
  e({
    title: "繳水電費 + 採買",
    date: D(2),
    start: 12.5,
    end: 13.5,
    cat: "personal",
    location: "全聯",
    notes: "順手買晚餐食材。",
  }),
  // Thu
  e({
    title: "午餐 with 設計團隊",
    date: D(3),
    start: 12.5,
    end: 13.5,
    cat: "life",
    location: "公司樓下",
    notes: "慶祝 sprint 結束。",
  }),
  e({
    title: "設計交付文件撰寫",
    date: D(3),
    start: 15,
    end: 17,
    cat: "work",
    location: "Notion",
    notes: "整理 spec 與切版標註。",
  }),
  // Fri
  e({
    title: "週會 Retro",
    date: D(4),
    start: 9.5,
    end: 10.5,
    cat: "work",
    location: "Linear + Zoom",
    notes: "回顧本週、排下週重點。",
  }),
  e({
    title: "剪頭髮",
    date: D(4),
    start: 17,
    end: 18,
    cat: "personal",
    location: "中山區 · 髮廊",
    notes: "預約設計師 Leo。",
  }),
  // Sat
  e({
    title: "早午餐 with 大學朋友",
    date: D(5),
    start: 11,
    end: 12.5,
    cat: "life",
    location: "民生社區 · brunch",
    notes: "好久不見敘舊。",
  }),
  e({
    title: "看展 — 北美館",
    date: D(5),
    start: 14.5,
    end: 16.5,
    cat: "personal",
    location: "台北市立美術館",
    notes: "新媒體藝術特展。",
  }),
  // Sun
  e({
    title: "晨跑 5K",
    date: D(6),
    start: 7.5,
    end: 8.5,
    cat: "health",
    location: "河濱公園",
    notes: "配速 6:00/km。",
  }),
  e({
    title: "線上課程：AI 工具實作",
    date: D(6),
    start: 20,
    end: 21.5,
    cat: "study",
    location: "線上",
    notes: "第 3 章：prompt 設計。",
  }),
];

/* ============================ Seed todos（首次載入用） ============================ */
let _tid = 1;
const t = (o) => ({ id: "t" + _tid++, done: false, ...o });
const SEED_TODOS = [
  // Today（綁 TODAY，今天是星期幾都會落在「Today」群組）
  t({ title: "寫週報草稿", cat: "work", due: TODAY, time: 9, done: true }),
  t({ title: "回信給設計團隊", cat: "work", due: TODAY, time: 10 }),
  t({ title: "完成 Onboarding step-2 mock", cat: "work", due: TODAY, time: 14 }),
  t({ title: "量血壓 + 記錄", cat: "health", due: TODAY, time: 8, done: true }),
  t({ title: "訂下週機票", cat: "life", due: TODAY, time: 21 }),
  t({ title: "看 Figma 更新筆記", cat: "study", due: TODAY, time: 22 }),
  // This week
  t({ title: "提交報帳單據", cat: "work", due: D(3), time: 11 }),
  t({ title: "更新 portfolio 內頁", cat: "work", due: D(4), time: 16 }),
  t({ title: "預約牙醫洗牙", cat: "health", due: D(5), time: 10 }),
  t({ title: "繳信用卡 5 月帳單", cat: "personal", due: D(4), time: 20 }),
  t({ title: "幫媽媽訂母親節蛋糕", cat: "life", due: D(6), time: 15 }),
  // This month
  t({ title: "H1 OKR 自評", cat: "work", due: addDays(WEEK_START, 12), time: 17 }),
  t({ title: "更新履歷 PDF", cat: "work", due: addDays(WEEK_START, 14), time: 19 }),
  t({ title: "報名 7 月半馬", cat: "health", due: addDays(WEEK_START, 18), time: 21 }),
  // Unscheduled（無 due 就不設 time）
  t({ title: "研究下半年旅遊路線", cat: "life", due: null }),
  t({ title: "整理書櫃、捐二手書", cat: "personal", due: null }),
  t({ title: "看完《Shape Up》", cat: "study", due: null }),

  /* ---- 補充：讓六月第一週更飽滿 ---- */
  // Today
  t({ title: "準備週會簡報", cat: "work", due: TODAY, time: 13 }),
  t({ title: "午休散步 20 分鐘", cat: "health", due: TODAY, time: 12.5 }),
  t({ title: "回覆客戶郵件", cat: "work", due: TODAY, time: 16 }),
  t({ title: "買晚餐食材", cat: "life", due: TODAY, time: 19 }),
  // This week（D1 Tue / D2 Wed 等今天之後）
  t({ title: "校稿設計交付文件", cat: "work", due: D(1), time: 14 }),
  t({ title: "繳房租", cat: "personal", due: D(2), time: 10 }),
  t({ title: "規劃週末出遊行程", cat: "life", due: D(2), time: 21 }),
  t({ title: "健身 — 上半身", cat: "health", due: D(5), time: 9 }),
  // This month
  t({ title: "規劃 Q3 OKR", cat: "work", due: addDays(WEEK_START, 15), time: 14 }),
  t({ title: "預約年度健檢", cat: "health", due: addDays(WEEK_START, 20), time: 11 }),
  // Unscheduled
  t({ title: "整理 Figma 元件庫", cat: "work", due: null }),
  t({ title: "回老家探望爸媽", cat: "life", due: null }),
];

/* ============================ 持久化（含 Date 還原） ============================ */
// events.date 與 todos.due 是 Date 物件，JSON.stringify 會轉成字串，load 時要還原回 Date，
// 否則 sameDay() 之類呼叫 .getFullYear() 會炸。
function revive(state) {
  return {
    todos: (state.todos || []).map((td) => ({
      ...td,
      due: td.due ? new Date(td.due) : null,
    })),
    events: (state.events || []).map((ev) => ({
      ...ev,
      date: new Date(ev.date),
    })),
  };
}
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return revive(JSON.parse(raw));
  } catch {
    /* 解析失敗就用 seed */
  }
  return null;
}

/* ============================ Provider ============================ */
const TodoCalCtx = createContext(null);

export function TodoCalendarProvider({ children }) {
  const initial = load();
  const [todos, setTodos] = useState(initial?.todos ?? SEED_TODOS);
  const [events, setEvents] = useState(initial?.events ?? SEED_EVENTS);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ todos, events }));
    } catch {
      /* localStorage 滿了就略過，不影響使用 */
    }
  }, [todos, events]);

  const value = { todos, setTodos, events, setEvents };
  return <TodoCalCtx.Provider value={value}>{children}</TodoCalCtx.Provider>;
}

export const useTodoCalendar = () => useContext(TodoCalCtx);

/* ============================ 「進行中」打勾完成的過場 ============================ */
// 在「進行中」清單打勾完成時，項目本身立刻標記 done（完成度即時更新），但在清單裡先停留
// holdMs 顯示已完成樣式、再 fade 淡出 fadeMs，最後才移出清單，避免「一打勾就瞬間消失」看不到。
// 回傳 lingering（id -> 'hold' | 'fade'）：清單篩選時把這些 id 暫時保留，render 時依 'fade' 做淡出。
export function useLingeringDone(holdMs = 3000, fadeMs = 400) {
  const [lingering, setLingering] = useState({});
  const timers = useRef({});

  const clear = (id) => {
    const t = timers.current[id];
    if (t) {
      clearTimeout(t.fade);
      clearTimeout(t.remove);
      delete timers.current[id];
    }
  };

  // 打勾完成 → 進入 hold，holdMs 後轉 fade，再 fadeMs 後移除
  const begin = (id) => {
    clear(id); // 連點 / 重複打勾先清舊計時器
    setLingering((m) => ({ ...m, [id]: "hold" }));
    const fade = setTimeout(
      () => setLingering((m) => (id in m ? { ...m, [id]: "fade" } : m)),
      holdMs,
    );
    const remove = setTimeout(() => {
      setLingering((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
      delete timers.current[id];
    }, holdMs + fadeMs);
    timers.current[id] = { fade, remove };
  };

  // 取消勾選 → 立刻留在清單，清掉過場
  const cancel = (id) => {
    clear(id);
    setLingering((m) => {
      if (!(id in m)) return m;
      const n = { ...m };
      delete n[id];
      return n;
    });
  };

  // 卸載時清掉所有計時器
  useEffect(
    () => () =>
      Object.values(timers.current).forEach((t) => {
        clearTimeout(t.fade);
        clearTimeout(t.remove);
      }),
    [],
  );

  return { lingering, begin, cancel };
}
