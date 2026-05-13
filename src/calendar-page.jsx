// calendar-page.jsx — 待辦行事曆頁面（/todo）
// 合併自 claude design 下載檔（calendar-data / calendar-todo / calendar-popovers / calendar-grid / calendar-app）
// 原始檔保留在 ~/Downloads/todo&calendar/ 供參考
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";

/* ======================================================================
   1. Data layer — 分類、日期工具、SEED data
   ====================================================================== */

const TODAY = new Date(2026, 4, 13); // 2026-05-13（Wed）— 與 Dayboard hero 對齊

// 分類：bg/ink/dot/border 都引用 CSS var，會跟 theme 自動切換（定義在 styles.css）
const CATEGORIES = [
  {
    id: "work",
    label: "工作",
    bg: "var(--cat-work-bg)",
    ink: "var(--cat-work-ink)",
    dot: "var(--cat-work-dot)",
    border: "var(--cat-work-border)",
  },
  {
    id: "health",
    label: "健康",
    bg: "var(--cat-health-bg)",
    ink: "var(--cat-health-ink)",
    dot: "var(--cat-health-dot)",
    border: "var(--cat-health-border)",
  },
  {
    id: "life",
    label: "生活",
    bg: "var(--cat-life-bg)",
    ink: "var(--cat-life-ink)",
    dot: "var(--cat-life-dot)",
    border: "var(--cat-life-border)",
  },
  {
    id: "study",
    label: "學習",
    bg: "var(--cat-study-bg)",
    ink: "var(--cat-study-ink)",
    dot: "var(--cat-study-dot)",
    border: "var(--cat-study-border)",
  },
  {
    id: "personal",
    label: "個人",
    bg: "var(--cat-personal-bg)",
    ink: "var(--cat-personal-ink)",
    dot: "var(--cat-personal-dot)",
    border: "var(--cat-personal-border)",
  },
];
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// 日期工具
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const startOfWeek = (d) => {
  // 週一為週首
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEK_LABELS_ZH = ["一", "二", "三", "四", "五", "六", "日"];
const WEEK_LABELS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// 時間（用十進位小時表示，9.5 = 09:30）
const fmtTime = (h) => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
const fmt12 = (h) => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  const ap = hh < 12 ? "AM" : "PM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
};
// 首頁 TodoCard 的時間格式（lowercase, 無冒號）："9:00 am" / "6:30 pm"
const fmt12Lower = (h) => {
  if (h == null) return null;
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  const ap = hh < 12 ? "am" : "pm";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
};

// Calendar 分類 → 首頁 .tag class（沿用 design system 既有 7 種 tag 樣式）
// study 沒有專屬 tag，沿用 .tag.learn（同為學習語意，視覺一致）
// personal 沒有專屬 tag，沿用 .tag.default
const TAG_CLASS_BY_CAT = {
  work: "work",
  health: "health",
  life: "life",
  study: "learn",
  personal: "default",
};

// Todo 用的分類色（對齊上面 .tag class 對應的 design system token）
// 跟 calendar event 色塊用的 --cat-*-* 是兩套：tag 走 semantic 色 (primary/warn/pos)、event 走 categorical 色
const TAG_COLOR_BY_CAT = {
  work: { bg: "var(--bg-chart-area)", ink: "var(--primary)" },
  health: { bg: "var(--warn-bg)", ink: "var(--warn)" },
  life: { bg: "var(--pos-bg)", ink: "var(--pos)" },
  study: { bg: "var(--bg-chart-area)", ink: "var(--primary)" },
  personal: { bg: "var(--surface-hover)", ink: "var(--muted)" },
};

// Seed events
const WEEK_START = startOfWeek(TODAY);
const D = (n) => addDays(WEEK_START, n);
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
];

// Seed todos
let _tid = 1;
const t = (o) => ({ id: "t" + _tid++, done: false, ...o });
const SEED_TODOS = [
  // Today
  t({ title: "寫週報草稿", cat: "work", due: D(2), time: 9, done: true }),
  t({ title: "回信給設計團隊", cat: "work", due: D(2), time: 10 }),
  t({ title: "完成 Onboarding step-2 mock", cat: "work", due: D(2), time: 14 }),
  t({ title: "量血壓 + 記錄", cat: "health", due: D(2), time: 8, done: true }),
  t({ title: "訂下週機票", cat: "life", due: D(2), time: 21 }),
  t({ title: "看 Figma 更新筆記", cat: "study", due: D(2), time: 22 }),
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
];

/* ======================================================================
   2. Todo column — 左側待辦欄
   ====================================================================== */

export const TodoRow = ({ todo, onToggle, onEdit, onDelete }) => {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [draftCat, setDraftCat] = useState(todo.cat);
  const [draftTime, setDraftTime] = useState(todo.time);
  const cat = CAT_BY_ID[todo.cat];
  const tagClass = TAG_CLASS_BY_CAT[todo.cat] || "default";
  const inputRef = useRef(null);
  const rowRef = useRef(null);
  // 用 ref 追蹤 draft 值，避免 outside-click handler 拿到舊 closure
  const draftRef = useRef({ title: todo.title, cat: todo.cat, time: todo.time });

  useEffect(() => {
    draftRef.current = { title: draftTitle, cat: draftCat, time: draftTime };
  }, [draftTitle, draftCat, draftTime]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const { title, cat: c, time } = draftRef.current;
    const v = title.trim();
    if (!v) {
      // 標題清空 → 取消編輯，不變更
      setDraftTitle(todo.title);
      setEditing(false);
      return;
    }
    if (v !== todo.title || c !== todo.cat || time !== todo.time) {
      onEdit({ ...todo, title: v, cat: c, time });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraftTitle(todo.title);
    setDraftCat(todo.cat);
    setDraftTime(todo.time);
    setEditing(false);
  };

  // 編輯模式：監聽外擊（含 row 跟 picker popup 之外）→ commit
  useEffect(() => {
    if (!editing) return;
    const onDown = (ev) => {
      // 在 row 內或 picker popup 內（picker popup 是 fixed 在 body）都不算外擊
      if (rowRef.current && rowRef.current.contains(ev.target)) return;
      // CatPicker / TimePicker popup 透過 absolute 渲染在 row 內，會被 rowRef 包進去
      commit();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterEdit = () => {
    setDraftTitle(todo.title);
    setDraftCat(todo.cat);
    setDraftTime(todo.time);
    setEditing(true);
  };

  const timeStr = fmt12Lower(todo.time);

  return (
    <div
      ref={rowRef}
      // 線框骨架、padding、hover 變色都由全域 .todo class 處理（跟首頁 TodoCard 共用）
      className={`todo ${todo.done ? "done" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative" }}
    >
      <span
        onClick={(ev) => {
          ev.stopPropagation();
          onToggle(todo);
        }}
        className={`checkbox ${todo.done ? "checked" : ""}`}
        style={{ marginTop: 1 }}
      >
        <i className="ph-bold ph-check"></i>
      </span>
      {/* body 永遠 padding-right 46，預留 hover actions 空間，避免 layout shift */}
      <div className="body" style={{ paddingRight: 46 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(ev) => setDraftTitle(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") commit();
              if (ev.key === "Escape") cancel();
            }}
            style={{
              width: "100%",
              border: 0,
              outline: 0,
              background: "transparent",
              font: "500 14px/1.3 var(--font-sans)",
              color: "var(--ink)",
              padding: 0,
            }}
          />
        ) : (
          <div
            className="title"
            onDoubleClick={enterEdit}
            onClick={(ev) => {
              ev.stopPropagation();
              onToggle(todo);
            }}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {todo.title}
          </div>
        )}
        <div className="meta">
          {editing ? (
            <>
              <CatPicker value={draftCat} onChange={setDraftCat} />
              <TimePicker value={draftTime} onChange={setDraftTime} />
            </>
          ) : (
            <>
              {timeStr && (
                <span className="time">
                  <i className="ph ph-clock" style={{ fontSize: 11, marginRight: 2 }}></i>
                  {timeStr}
                </span>
              )}
              <span className={`tag ${tagClass}`}>{cat.label}</span>
            </>
          )}
        </div>
      </div>
      {/* Hover 操作按鈕 — 右上角絕對定位，不擋 meta（tag 始終可見） */}
      <div
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          display: "flex",
          gap: 2,
          opacity: hover && !editing ? 1 : 0,
          pointerEvents: hover && !editing ? "auto" : "none",
          transition: "opacity 120ms",
        }}
      >
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            enterEdit();
          }}
          title="編輯"
          style={{
            width: 22,
            height: 22,
            padding: 0,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: 5,
            color: "var(--ink-2)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <i className="ph ph-pencil-simple" style={{ fontSize: 11 }}></i>
        </button>
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            onDelete(todo);
          }}
          title="刪除"
          style={{
            width: 22,
            height: 22,
            padding: 0,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: 5,
            color: "var(--ink-2)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <i className="ph ph-trash" style={{ fontSize: 11 }}></i>
        </button>
      </div>
    </div>
  );
};

const TodoGroup = ({ title, count, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 4px 6px",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <i
          className="ph ph-caret-right"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 120ms",
          }}
        ></i>
        <span style={{ font: "600 11.5px/1 var(--font-sans)", color: "var(--ink-2)" }}>
          {title}
        </span>
        <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--muted)" }}>{count}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 6 }}>
          {children}
        </div>
      )}
    </div>
  );
};

// 自製分類下拉，避免原生 <select> blur 整列輸入框
// 配色對齊首頁 .tag CSS class（透過 TAG_COLOR_BY_CAT），讓 picker 跟 row tag 視覺一致
const CatPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const cur = CAT_BY_ID[value];
  const curColor = TAG_COLOR_BY_CAT[value];

  useEffect(() => {
    if (!open) return;
    const onDown = (ev) => {
      if (ref.current && ref.current.contains(ev.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // 開啟時：吃到外層 overflow:auto 會裁掉 absolute 子層，所以改用 fixed + viewport 座標
  // 滾動 / resize 直接關閉，避免 fixed dropdown 跟著 scroll 飄走
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (ev) => {
    ev.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const popH = 160; // 4 個分類，預估高度
      const flipUp = r.bottom + popH + 8 > window.innerHeight;
      setCoords({
        left: r.left,
        top: flipUp ? Math.max(8, r.top - popH - 4) : r.bottom + 4,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 22,
          padding: "0 7px",
          border: 0,
          background: curColor.bg,
          color: curColor.ink,
          borderRadius: 4,
          cursor: "pointer",
          font: "500 11px/1 var(--font-sans)",
        }}
      >
        {cur.label}
        <i
          className="ph ph-caret-down"
          style={{ fontSize: 10, marginLeft: 1, color: curColor.ink, opacity: 0.7 }}
        ></i>
      </button>
      {open && coords && (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 1000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            boxShadow: "var(--shadow-popover)",
            padding: 4,
            minWidth: 110,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {CATEGORIES.map((c) => {
            const color = TAG_COLOR_BY_CAT[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onChange(c.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  border: 0,
                  background: c.id === value ? "var(--surface-hover)" : "transparent",
                  color: "var(--ink)",
                  borderRadius: 5,
                  cursor: "pointer",
                  textAlign: "left",
                  font: "500 12px/1 var(--font-sans)",
                }}
              >
                {/* dot 用首頁 tag 對應色 (ink)，跟按鈕色一致 */}
                <span
                  style={{ width: 8, height: 8, borderRadius: 999, background: color.ink }}
                ></span>
                {c.label}
                {c.id === value && (
                  <i
                    className="ph ph-check"
                    style={{ fontSize: 12, marginLeft: "auto", color: "var(--primary)" }}
                  ></i>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 時間選擇器 — 仿 CatPicker，避免原生 select 觸發外擊 commit
const TimePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  // HOUR_START (7) ~ HOUR_END (23) 每 30 min，共 32 個選項；多一個 null 代表「未排時間」
  const opts = useMemo(() => {
    const out = [null];
    for (let h = 7; h < 23; h += 0.5) out.push(h);
    return out;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev) => {
      if (ref.current && ref.current.contains(ev.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // 滾動 / resize 時關閉，避免 fixed dropdown 跟著畫面飄走
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const display = value == null ? "未排時間" : fmt12Lower(value);

  const toggle = (ev) => {
    ev.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const popH = 240; // 對應 maxHeight
      const flipUp = r.bottom + popH + 8 > window.innerHeight;
      setCoords({
        left: r.left,
        top: flipUp ? Math.max(8, r.top - popH - 4) : r.bottom + 4,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 22,
          padding: "0 7px",
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--ink-2)",
          borderRadius: 4,
          cursor: "pointer",
          font: "500 11px/1 var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <i className="ph ph-clock" style={{ fontSize: 11 }}></i>
        {display}
        <i className="ph ph-caret-down" style={{ fontSize: 10, marginLeft: 1, opacity: 0.7 }}></i>
      </button>
      {open && coords && (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 1000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            boxShadow: "var(--shadow-popover)",
            padding: 4,
            minWidth: 120,
            maxHeight: 240,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {opts.map((h, i) => {
            const selected = h === value;
            return (
              <button
                key={i}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onChange(h);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  border: 0,
                  background: selected ? "var(--surface-hover)" : "transparent",
                  color: h == null ? "var(--muted)" : "var(--ink)",
                  borderRadius: 5,
                  cursor: "pointer",
                  textAlign: "left",
                  font: "500 12px/1 var(--font-sans)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {h == null ? "未排時間" : fmt12Lower(h)}
                {selected && (
                  <i
                    className="ph ph-check"
                    style={{ fontSize: 12, marginLeft: "auto", color: "var(--primary)" }}
                  ></i>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TodoInlineAdd = ({ onAdd, defaultCat = "work", defaultTime = 9 }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cat, setCat] = useState(defaultCat);
  const [time, setTime] = useState(defaultTime);
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({ text: "", cat: defaultCat, time: defaultTime });

  // 透過 ref 追蹤最新值，避免 document listener 拿到舊 closure
  useEffect(() => {
    stateRef.current = { text, cat, time };
  }, [text, cat, time]);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  // 點擊外部時 commit（取代 onBlur，因為點 picker 也會觸發 blur）
  useEffect(() => {
    if (!open) return;
    const onDown = (ev) => {
      if (wrapRef.current && wrapRef.current.contains(ev.target)) return;
      const v = stateRef.current.text.trim();
      if (v) {
        onAdd({
          title: v,
          cat: stateRef.current.cat,
          time: stateRef.current.time,
          done: false,
          due: null,
        });
      }
      setText("");
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onAdd]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 11px",
          background: "transparent",
          border: "1px dashed var(--border-strong)",
          cursor: "pointer",
          color: "var(--muted)",
          font: "500 12px/1 var(--font-sans)",
          borderRadius: 7,
          textAlign: "left",
          width: "100%",
        }}
      >
        <i className="ph ph-plus" style={{ fontSize: 12 }}></i> 新增待辦
      </button>
    );
  }

  const commit = () => {
    const v = text.trim();
    if (v) {
      onAdd({ title: v, cat, time, done: false, due: null });
      setText("");
    }
    setOpen(false);
  };

  return (
    <div
      ref={wrapRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px 6px 6px",
        background: "var(--surface)",
        border: "1px solid var(--primary)",
        borderRadius: 7,
        boxShadow: "0 0 0 3px var(--primary-pale)",
        flexWrap: "wrap",
      }}
    >
      <CatPicker value={cat} onChange={setCat} />
      <TimePicker value={time} onChange={setTime} />
      <input
        ref={ref}
        value={text}
        onChange={(ev) => setText(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") commit();
          if (ev.key === "Escape") {
            setText("");
            setOpen(false);
          }
        }}
        placeholder="輸入待辦，按 Enter 新增"
        style={{
          flex: 1,
          minWidth: 120,
          border: 0,
          outline: 0,
          background: "transparent",
          font: "450 12.5px/1 var(--font-sans)",
          color: "var(--ink)",
        }}
      />
    </div>
  );
};

const FilterChip = ({ label, count, active, dot, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 24,
      padding: "0 9px",
      // active 用 --bg-inverse / --text-on-inverse 才會跟 theme 反相（light: 深底白字、dark: 亮底深字）
      background: active ? "var(--bg-inverse)" : "var(--surface-2)",
      color: active ? "var(--text-on-inverse)" : "var(--ink-2)",
      border: `1px solid ${active ? "var(--bg-inverse)" : "var(--border)"}`,
      borderRadius: 999,
      cursor: "pointer",
      font: "500 11px/1 var(--font-sans)",
    }}
  >
    {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: dot }}></span>}
    {label}
    <span
      style={{
        font: "500 10.5px/1 var(--font-mono)",
        color: active ? "var(--text-on-inverse)" : "var(--muted)",
        opacity: active ? 0.7 : 1,
      }}
    >
      {count}
    </span>
  </button>
);

const EmptyHint = ({ text }) => (
  <div
    style={{ padding: "12px 8px", font: "450 11.5px/1 var(--font-sans)", color: "var(--faint)" }}
  >
    {text}
  </div>
);

const TodoColumn = ({ todos, setTodos }) => {
  const [filter, setFilter] = useState("all"); // 'all' or cat.id

  // 今日完成率
  const todayTodos = todos.filter((t) => t.due && sameDay(t.due, TODAY));
  const doneCount = todayTodos.filter((t) => t.done).length;
  const pct = todayTodos.length ? Math.round((doneCount / todayTodos.length) * 100) : 0;

  const filterMatch = (t) => filter === "all" || t.cat === filter;

  const weekStart = startOfWeek(TODAY);
  const weekEnd = addDays(weekStart, 7);
  const monthEnd = addDays(weekEnd, 21);

  const inThisWeek = (t) => t.due && t.due >= weekStart && t.due < weekEnd;
  const inThisMonth = (t) => t.due && t.due >= weekEnd && t.due < monthEnd;

  const visible = todos.filter(filterMatch);
  const weekList = visible.filter(inThisWeek);
  const monthList = visible.filter(inThisMonth);
  const unscheduledList = visible.filter((t) => !t.due);

  const toggle = (todo) =>
    setTodos((ts) => ts.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
  const edit = (todo) => setTodos((ts) => ts.map((t) => (t.id === todo.id ? todo : t)));
  const remove = (todo) => setTodos((ts) => ts.filter((t) => t.id !== todo.id));
  const add = (todo) => setTodos((ts) => [...ts, { id: "t" + Date.now(), ...todo }]);

  return (
    <aside
      className="calendar-todo-column"
      style={{
        flex: 1,
        minWidth: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--corner-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              font: "600 9.5px/1 var(--font-sans)",
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            TO-DO
          </div>
          <div
            style={{
              marginTop: 6,
              font: "650 18px/1.2 var(--font-sans)",
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            今日待辦
          </div>
          <div
            style={{ font: "500 11px/1.2 var(--font-sans)", color: "var(--muted)", marginTop: 3 }}
          >
            {TODAY.getFullYear()}.{String(TODAY.getMonth() + 1).padStart(2, "0")}.
            {String(TODAY.getDate()).padStart(2, "0")} ・ 週
            {WEEK_LABELS_ZH[(TODAY.getDay() + 6) % 7]}
          </div>
        </div>
        <button className="icon-btn" style={{ width: 28, height: 28 }} title="排序">
          <i className="ph ph-arrows-down-up" style={{ fontSize: 13, color: "var(--ink-2)" }}></i>
        </button>
      </div>

      {/* 完成率區塊 */}
      <div
        style={{
          margin: "0 16px",
          padding: "12px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              font: "650 24px/1 var(--font-sans)",
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {pct}
            <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--muted)" }}>%</span>
          </span>
          <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--muted)" }}>
            今日完成度
          </span>
          <span
            style={{
              marginLeft: "auto",
              font: "500 11px/1 var(--font-mono)",
              color: "var(--muted)",
            }}
          >
            {doneCount}/{todayTodos.length}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            height: 6,
            background: "var(--surface-hover)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--primary)",
              borderRadius: 999,
              transition: "width 240ms var(--ease-out)",
            }}
          ></div>
        </div>
      </div>

      {/* 分類篩選 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 16px 6px" }}>
        <FilterChip
          label="全部"
          count={todos.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {CATEGORIES.map((c) => {
          const n = todos.filter((t) => t.cat === c.id).length;
          return (
            <FilterChip
              key={c.id}
              label={c.label}
              count={n}
              active={filter === c.id}
              dot={c.dot}
              onClick={() => setFilter(c.id)}
            />
          );
        })}
      </div>

      {/* 列表 */}
      <div className="cal-scroll" style={{ flex: 1, overflow: "auto", padding: "4px 12px 16px" }}>
        <TodoGroup title="This week" count={weekList.length}>
          {weekList.length === 0 && <EmptyHint text="本週沒有待辦" />}
          {weekList.map((t) => (
            <TodoRow key={t.id} todo={t} onToggle={toggle} onEdit={edit} onDelete={remove} />
          ))}
          <TodoInlineAdd onAdd={(t) => add({ ...t, due: TODAY })} />
        </TodoGroup>
        <TodoGroup title="This month" count={monthList.length}>
          {monthList.length === 0 && <EmptyHint text="本月沒有更多待辦" />}
          {monthList.map((t) => (
            <TodoRow key={t.id} todo={t} onToggle={toggle} onEdit={edit} onDelete={remove} />
          ))}
          <TodoInlineAdd onAdd={(t) => add({ ...t, due: addDays(TODAY, 7) })} />
        </TodoGroup>
        <TodoGroup title="Unscheduled" count={unscheduledList.length} defaultOpen={false}>
          {unscheduledList.length === 0 && <EmptyHint text="沒有未排期的待辦" />}
          {unscheduledList.map((t) => (
            <TodoRow key={t.id} todo={t} onToggle={toggle} onEdit={edit} onDelete={remove} />
          ))}
          <TodoInlineAdd onAdd={(t) => add(t)} defaultTime={null} />
        </TodoGroup>
      </div>
    </aside>
  );
};

/* ======================================================================
   3. Popovers — hover detail + create/edit modal
   ====================================================================== */

const PopoverRow = ({ icon, label, bg, ink }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <i
      className={`ph ph-${icon}`}
      style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
    ></i>
    {bg ? (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 19,
          padding: "0 8px",
          borderRadius: 4,
          background: bg,
          color: ink,
          font: "500 11px/1 var(--font-sans)",
        }}
      >
        {label}
      </span>
    ) : (
      <span style={{ font: "450 12px/1.3 var(--font-sans)", color: "var(--ink-2)" }}>{label}</span>
    )}
  </div>
);

const EventPopover = ({ event, anchor, onEdit, onDelete, onClose }) => {
  const cat = CAT_BY_ID[event.cat];
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0, placement: "right" });
  // 手機尺寸下用 modal 風格（scrim + 置中），避免 anchor-relative 位置撞出視窗
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const card = ref.current;
    const w = card?.offsetWidth || 280;
    const h = card?.offsetHeight || 240;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    let left = r.right + 8;
    let placement = "right";
    if (left + w > vw - 8) {
      left = r.left - w - 8;
      placement = "left";
    }
    if (left < 8) {
      left = Math.max(8, r.left);
      placement = "over";
    }
    let top = r.top;
    if (top + h > vh - 8) top = Math.max(8, vh - h - 8);
    setPos({ left, top, placement });
  }, [anchor, isMobile]);

  if (!event) return null;

  // 共用的卡片內容（mobile / desktop 都用同一份）
  const card = (
    <div
      ref={ref}
      onMouseEnter={(ev) => ev.stopPropagation()}
      onClick={(ev) => ev.stopPropagation()}
      style={{
        width: isMobile ? "calc(100vw - 32px)" : 296,
        maxWidth: 320,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        boxShadow: "var(--shadow-popover)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: cat.dot,
            marginTop: 7,
            flexShrink: 0,
          }}
        ></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: "650 14px/1.3 var(--font-sans)",
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {event.title}
          </div>
          <div
            style={{ font: "500 11px/1.2 var(--font-sans)", color: "var(--muted)", marginTop: 4 }}
          >
            {event.date.getFullYear()}/{event.date.getMonth() + 1}/{event.date.getDate()} ・{" "}
            {fmt12(event.start)} – {fmt12(event.end)}
          </div>
        </div>
        <button
          onClick={onClose}
          title="關閉"
          style={{
            width: 22,
            height: 22,
            padding: 0,
            border: 0,
            background: "transparent",
            borderRadius: 5,
            color: "var(--muted)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <i className="ph ph-x" style={{ fontSize: 12 }}></i>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <PopoverRow icon="tag" label={cat.label} bg={cat.bg} ink={cat.ink} />
        {event.location && <PopoverRow icon="map-pin" label={event.location} />}
        <PopoverRow icon="bell" label={`提醒・${event.reminder} 分鐘前`} />
        {event.notes && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <i
              className="ph ph-note-pencil"
              style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}
            ></i>
            <div style={{ font: "450 12px/1.5 var(--font-sans)", color: "var(--ink-2)", flex: 1 }}>
              {event.notes}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          paddingTop: 4,
          borderTop: "1px solid var(--divider)",
          marginTop: 2,
        }}
      >
        <button
          onClick={() => onEdit(event)}
          style={{
            flex: 1,
            height: 30,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--ink-2)",
            borderRadius: 6,
            cursor: "pointer",
            font: "500 12px/1 var(--font-sans)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <i className="ph ph-pencil-simple" style={{ fontSize: 12 }}></i> 編輯
        </button>
        <button
          onClick={() => onDelete(event)}
          style={{
            flex: 1,
            height: 30,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--neg)",
            borderRadius: 6,
            cursor: "pointer",
            font: "500 12px/1 var(--font-sans)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <i className="ph ph-trash" style={{ fontSize: 12 }}></i> 刪除
        </button>
      </div>
    </div>
  );

  // Mobile：scrim + 置中 modal 風格（跟 EventModal 一致），避免 anchor 位置擠出視窗
  if (isMobile) {
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--scrim)",
          display: "grid",
          placeItems: "center",
          zIndex: 90,
          padding: 16,
        }}
      >
        {card}
      </div>
    );
  }

  // Desktop：anchor-relative fixed 位置（沿用原本 effect 算出的 pos）
  return <div style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 80 }}>{card}</div>;
};

const inputStyle = {
  height: 34,
  padding: "0 10px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  font: "450 12.5px/1 var(--font-sans)",
  color: "var(--ink)",
  outline: "none",
  width: "100%",
  fontFamily: "var(--font-sans)",
};

const Field = ({ label, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span
      style={{
        font: "500 11px/1 var(--font-sans)",
        color: "var(--muted)",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
    {children}
  </label>
);

const EventModal = ({ initial, onSave, onClose, onDelete }) => {
  const isEdit = initial.mode === "edit";
  const ev0 = initial.event;
  const [title, setTitle] = useState(ev0.title || "");
  const [notes, setNotes] = useState(ev0.notes || "");
  const [location, setLocation] = useState(ev0.location || "");
  const [cat, setCat] = useState(ev0.cat || "work");
  const [date, setDate] = useState(ymd(ev0.date || TODAY));
  const [startH, setStartH] = useState(ev0.start ?? 9);
  const [endH, setEndH] = useState(ev0.end ?? 10);
  const [reminder, setReminder] = useState(ev0.reminder ?? 10);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    const v = title.trim() || "新行程";
    const [y, m, d] = date.split("-").map(Number);
    const out = {
      ...ev0,
      title: v,
      notes,
      location,
      cat,
      date: new Date(y, m - 1, d),
      start: Number(startH),
      end: Math.max(Number(endH), Number(startH) + 0.25),
      reminder: Number(reminder),
    };
    onSave(out);
  };

  const cur = CAT_BY_ID[cat];
  const timeOpts = Array.from({ length: 48 }, (_, i) => i * 0.5);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 32px)",
          background: "var(--surface)",
          borderRadius: 12,
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.32)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 999, background: cur.dot }}></span>
          <span
            style={{
              flex: 1,
              font: "650 14px/1 var(--font-sans)",
              color: "var(--ink)",
              letterSpacing: "-0.005em",
            }}
          >
            {isEdit ? "編輯行程" : "新增行程"}
          </span>
          <button onClick={onClose} className="icon-btn" style={{ width: 26, height: 26 }}>
            <i className="ph ph-x" style={{ fontSize: 13, color: "var(--ink-2)" }}></i>
          </button>
        </div>

        <div
          className="cal-scroll"
          style={{
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "auto",
          }}
        >
          <Field label="行程名稱">
            <input
              ref={titleRef}
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="例：Design review"
              style={inputStyle}
            />
          </Field>

          <Field label="分類">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: cat === c.id ? c.bg : "var(--surface-2)",
                    color: cat === c.id ? c.ink : "var(--ink-2)",
                    border: `1px solid ${cat === c.id ? c.border : "var(--border)"}`,
                    cursor: "pointer",
                    font: "500 11.5px/1 var(--font-sans)",
                  }}
                >
                  <span
                    style={{ width: 7, height: 7, borderRadius: 999, background: c.dot }}
                  ></span>
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10 }}>
            <Field label="日期">
              <input
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="開始">
              <select
                value={startH}
                onChange={(ev) => setStartH(Number(ev.target.value))}
                style={inputStyle}
              >
                {timeOpts.map((t) => (
                  <option key={t} value={t}>
                    {fmtTime(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="結束">
              <select
                value={endH}
                onChange={(ev) => setEndH(Number(ev.target.value))}
                style={inputStyle}
              >
                {timeOpts.map((t) => (
                  <option key={t} value={t}>
                    {fmtTime(t)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
            <Field label="地點 / 連結（選填）">
              <input
                value={location}
                onChange={(ev) => setLocation(ev.target.value)}
                placeholder="例：Zoom · 信義區門市"
                style={inputStyle}
              />
            </Field>
            <Field label="提醒">
              <select
                value={reminder}
                onChange={(ev) => setReminder(Number(ev.target.value))}
                style={inputStyle}
              >
                {[0, 5, 10, 15, 30, 60, 120, 1440].map((m) => (
                  <option key={m} value={m}>
                    {m === 0
                      ? "不提醒"
                      : m === 1440
                        ? "1 天前"
                        : m >= 60
                          ? `${m / 60} 小時前`
                          : `${m} 分鐘前`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="備註">
            <textarea
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              placeholder="補充說明、檢核清單、相關連結…"
              rows={3}
              style={{
                ...inputStyle,
                height: "auto",
                padding: "8px 10px",
                resize: "vertical",
                minHeight: 64,
              }}
            />
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid var(--divider)",
            background: "var(--surface-2)",
          }}
        >
          {isEdit && (
            <button
              onClick={() => onDelete(ev0)}
              style={{
                height: 32,
                padding: "0 12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--neg)",
                borderRadius: 7,
                cursor: "pointer",
                font: "500 12px/1 var(--font-sans)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ph ph-trash" style={{ fontSize: 12 }}></i> 刪除
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button
            onClick={onClose}
            style={{
              height: 32,
              padding: "0 14px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink-2)",
              borderRadius: 7,
              cursor: "pointer",
              font: "500 12px/1 var(--font-sans)",
            }}
          >
            取消
          </button>
          <button onClick={save} className="btn-primary" style={{ height: 32 }}>
            <i className="ph ph-check" style={{ fontSize: 13 }}></i>
            {isEdit ? "儲存" : "建立行程"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================================================================
   4. Calendar grid — week / day / month + drag-to-move / resize
   ====================================================================== */

const HOUR_START = 7; // 07:00
const HOUR_END = 23; // 23:00 (exclusive)
const HOUR_PX = 56; // 每小時高度
const HOUR_COL_W = 56; // 左側時間欄寬
const SNAP = 0.25; // 拖曳吸附 15 分鐘

const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

// 同日 events 的欄位佈局（處理重疊）
function layoutDay(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const groups = [];
  for (const ev of sorted) {
    let placed = false;
    for (const g of groups) {
      if (ev.start < g.end) {
        g.events.push(ev);
        g.end = Math.max(g.end, ev.end);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push({ events: [ev], end: ev.end });
  }
  const out = {};
  for (const g of groups) {
    const cols = [];
    for (const ev of g.events) {
      let col = cols.findIndex((c) => c.end <= ev.start);
      if (col === -1) {
        col = cols.length;
        cols.push({ end: ev.end });
      } else cols[col].end = ev.end;
      out[ev.id] = { col, ncols: 0 };
    }
    g.events.forEach((ev) => {
      out[ev.id].ncols = cols.length;
    });
  }
  return out;
}

const EventBlock = ({
  ev,
  dayIndex,
  totalDays,
  layout,
  onHover,
  onUnhover,
  onClick,
  onUpdate,
  style: cardStyle = "soft",
  getDayAt,
}) => {
  const cat = CAT_BY_ID[ev.cat];
  const blockRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  dragRef.current = drag;

  // 幾何：根據當前 ev 計算（拖曳期間 ev 會樂觀更新）
  const colW = 100 / Math.max(1, totalDays);
  const cellLeft = dayIndex * colW;
  const cellW = colW;
  const lay = layout || { col: 0, ncols: 1 };
  const subW = cellW / lay.ncols;
  const leftPct = cellLeft + lay.col * subW;

  const top = (ev.start - HOUR_START) * HOUR_PX + 1;
  const height = Math.max(20, (ev.end - ev.start) * HOUR_PX - 3);

  const isSoft = cardStyle === "soft";
  const isBar = cardStyle === "bar";
  const isSolid = cardStyle === "solid";
  const bg = isSoft ? cat.bg : isBar ? "var(--surface)" : cat.dot;
  const fg = isSoft ? cat.ink : isBar ? "var(--ink)" : "#fff";
  const subFg = isSoft ? cat.ink : isBar ? "var(--muted)" : "rgba(255,255,255,.82)";
  const compact = height < 38;

  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.target.setPointerCapture === "function" && e.pointerId != null) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        /* 忽略 setPointerCapture 失敗 */
      }
    }
    onUnhover && onUnhover(true); // 拖曳時隱藏 popover
    setDrag({
      mode,
      downX: e.clientX,
      downY: e.clientY,
      origStart: ev.start,
      origEnd: ev.end,
      origDate: ev.date,
      origId: ev.id,
      moved: false,
      pointerType: e.pointerType, // touch / mouse / pen — 給 threshold 用
    });
  };

  useEffect(() => {
    if (!drag) return;
    const snap = (h) => Math.round(h / SNAP) * SNAP;

    // 拖曳判定 threshold：touch 用 10px（手指 tap 抖動 5-10px 常見），mouse 用 4px
    const moveThreshold = drag.pointerType === "touch" ? 10 : 4;

    const onMove = (e) => {
      const dx = e.clientX - drag.downX;
      const dy = e.clientY - drag.downY;
      const moved = dragRef.current.moved || Math.hypot(dx, dy) > moveThreshold;
      const dur = drag.origEnd - drag.origStart;
      let newDate = drag.origDate,
        newStart = drag.origStart,
        newEnd = drag.origEnd;

      if (drag.mode === "move") {
        const target = getDayAt && getDayAt(e.clientX);
        if (target) newDate = target;
        const hourDelta = snap(dy / HOUR_PX);
        newStart = Math.max(HOUR_START, Math.min(HOUR_END - dur, drag.origStart + hourDelta));
        newEnd = newStart + dur;
      } else {
        const hourDelta = snap(dy / HOUR_PX);
        newEnd = Math.max(drag.origStart + SNAP, Math.min(HOUR_END, drag.origEnd + hourDelta));
        newStart = drag.origStart;
      }

      if (moved) onUpdate({ ...ev, date: newDate, start: newStart, end: newEnd });
      dragRef.current = { ...dragRef.current, moved };
    };

    const onUp = () => {
      const wasMoved = dragRef.current?.moved;
      setDrag(null);
      // 沒移動 = 視為 click（觸發 popover）
      if (!wasMoved) onClick && onClick(ev, blockRef.current);
    };

    // pointercancel：mobile 上若被 OS 中斷（例如 system gesture），也視為 tap
    const onCancel = () => {
      const wasMoved = dragRef.current?.moved;
      setDrag(null);
      if (!wasMoved) onClick && onClick(ev, blockRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [drag, getDayAt, onUpdate, ev]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={blockRef}
      onPointerDown={startDrag("move")}
      onPointerEnter={() => !drag && onHover && onHover(ev, blockRef.current)}
      onPointerLeave={() => !drag && onUnhover && onUnhover(false)}
      style={{
        position: "absolute",
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${subW}% - 4px)`,
        background: bg,
        color: fg,
        border: isBar
          ? `1px solid ${cat.border}`
          : `1px solid ${isSoft ? cat.border : "transparent"}`,
        borderLeft: isBar ? `3px solid ${cat.dot}` : undefined,
        borderRadius: 6,
        padding: compact ? "3px 8px 5px" : "6px 9px 8px",
        cursor: drag?.mode === "move" ? "grabbing" : "grab",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        boxShadow: drag ? "0 8px 18px -8px rgba(15,23,42,.25)" : "0 1px 0 rgba(15,23,42,.02)",
        transition: drag ? "none" : "box-shadow 120ms var(--ease-out)",
        userSelect: "none",
        touchAction: "none",
        zIndex: drag ? 5 : 1,
        opacity: drag ? 0.94 : 1,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          font: `600 ${compact ? 11 : 11.5}px/1.2 var(--font-sans)`,
          color: fg,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {ev.title}
      </div>
      {!compact && (
        <div
          style={{
            font: "500 10.5px/1.1 var(--font-sans)",
            color: subFg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtTime(ev.start)} – {fmtTime(ev.end)}
        </div>
      )}
      {/* Resize handle（下緣 6px） */}
      <div
        onPointerDown={startDrag("resize")}
        title="拖曳調整時長"
        style={{
          position: "absolute",
          left: 4,
          right: 4,
          bottom: 0,
          height: 6,
          cursor: "ns-resize",
          borderRadius: 3,
          background: "transparent",
        }}
      />
    </div>
  );
};

const NowLine = () => {
  const liveNow = new Date();
  // 真實時間若不是 2026（demo data），固定釘在 15:20 給 demo 用
  const pinned =
    liveNow.getFullYear() === 2026 ? liveNow.getHours() + liveNow.getMinutes() / 60 : 15.33;
  if (pinned < HOUR_START || pinned > HOUR_END) return null;
  const top = (pinned - HOUR_START) * HOUR_PX;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, pointerEvents: "none", zIndex: 4 }}>
      <div
        style={{
          position: "absolute",
          left: -5,
          top: -4,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--neg)",
        }}
      ></div>
      <div style={{ height: 1.5, background: "var(--neg)" }}></div>
    </div>
  );
};

const DayColRules = ({ date, onSlotClick }) => {
  const handleSlotClick = (ev) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const y = ev.clientY - rect.top;
    const hour = HOUR_START + Math.floor(y / HOUR_PX);
    const minutes = y % HOUR_PX < HOUR_PX / 2 ? 0 : 0.5;
    onSlotClick(date, hour + minutes);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        position: "relative",
        borderRight: "1px solid var(--divider)",
      }}
    >
      {HOURS.map((h, i) => (
        <div
          key={h}
          onClick={handleSlotClick}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: i * HOUR_PX,
            height: HOUR_PX,
            borderTop: i === 0 ? "0" : "1px solid var(--divider)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: HOUR_PX / 2,
              borderTop: "1px dashed var(--divider)",
              opacity: 0.5,
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};

const TimeGridBody = ({
  days,
  events,
  onSlotClick,
  onHover,
  onUnhover,
  onClick,
  onUpdate,
  eventStyle,
}) => {
  const totalH = HOURS.length * HOUR_PX;
  const scrollerRef = useRef(null);
  const daysWrapRef = useRef(null);
  useLayoutEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = (8 - HOUR_START) * HOUR_PX;
  }, []);

  const layoutByEvent = useMemo(() => {
    const out = {};
    for (const d of days) {
      const dayEvents = events.filter((e) => sameDay(e.date, d));
      Object.assign(out, layoutDay(dayEvents));
    }
    return out;
  }, [days, events]);

  const dayIndexOf = (date) => days.findIndex((d) => sameDay(d, date));

  const getDayAt = (clientX) => {
    const el = daysWrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const colW = rect.width / days.length;
    const idx = Math.max(0, Math.min(days.length - 1, Math.floor((clientX - rect.left) / colW)));
    return days[idx];
  };

  return (
    <div
      ref={scrollerRef}
      className="cal-scroll"
      style={{ flex: 1, overflow: "auto", background: "var(--surface)" }}
    >
      <div style={{ display: "flex", minHeight: totalH + 8 }}>
        {/* 時間欄 */}
        <div style={{ width: HOUR_COL_W, flexShrink: 0, position: "relative" }}>
          {HOURS.map((h, i) => (
            <div
              key={h}
              style={{
                position: "absolute",
                right: 8,
                top: i * HOUR_PX - 6,
                font: "500 10.5px/1 var(--font-mono)",
                color: "var(--muted)",
                fontVariantNumeric: "tabular-nums",
                textAlign: "right",
                width: "100%",
              }}
            >
              {`${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>
        {/* Days wrap（rules + event overlay） */}
        <div
          ref={daysWrapRef}
          style={{ flex: 1, position: "relative", borderLeft: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", height: totalH }}>
            {days.map((d) => (
              <DayColRules key={d.toISOString()} date={d} onSlotClick={onSlotClick} />
            ))}
          </div>
          {/* Event overlay — events 放在這層才不會被 day-column 重排打斷拖曳 */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {events.map((ev) => {
              const idx = dayIndexOf(ev.date);
              if (idx < 0) return null;
              return (
                <EventBlock
                  key={ev.id}
                  ev={ev}
                  dayIndex={idx}
                  totalDays={days.length}
                  layout={layoutByEvent[ev.id]}
                  onHover={onHover}
                  onUnhover={onUnhover}
                  onClick={onClick}
                  onUpdate={onUpdate}
                  style={eventStyle}
                  getDayAt={getDayAt}
                />
              );
            })}
          </div>
          {/* Now-line */}
          {days.some((d) => sameDay(d, TODAY)) && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {(() => {
                const idx = days.findIndex((d) => sameDay(d, TODAY));
                const colW = 100 / days.length;
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${idx * colW}%`,
                      width: `${colW}%`,
                      top: 0,
                      bottom: 0,
                    }}
                  >
                    <NowLine />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DayHeader = ({ days }) => (
  <div
    style={{
      display: "flex",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
    }}
  >
    <div style={{ width: HOUR_COL_W, flexShrink: 0 }}></div>
    <div style={{ flex: 1, display: "flex", borderLeft: "1px solid var(--border)" }}>
      {days.map((d) => {
        const isToday = sameDay(d, TODAY);
        const dow = (d.getDay() + 6) % 7;
        const weekend = dow >= 5;
        return (
          <div
            key={d.toISOString()}
            style={{
              flex: 1,
              padding: "10px 0 8px",
              textAlign: "center",
              borderRight: "1px solid var(--divider)",
              background: isToday ? "var(--primary-pale)" : "transparent",
            }}
          >
            <div
              style={{
                font: "600 9.5px/1 var(--font-sans)",
                color: weekend ? "var(--neg)" : "var(--muted)",
                letterSpacing: "0.06em",
              }}
            >
              {WEEK_LABELS_EN[dow]}
            </div>
            <div
              style={{
                marginTop: 6,
                font: "600 18px/1 var(--font-sans)",
                color: isToday ? "var(--primary)" : "var(--ink)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}
            >
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const WeekView = ({
  anchor,
  events,
  onSlotClick,
  onHover,
  onUnhover,
  onClick,
  onUpdate,
  eventStyle,
  showWeekend,
}) => {
  const ws = startOfWeek(anchor);
  const days = Array.from({ length: showWeekend ? 7 : 5 }, (_, i) => addDays(ws, i));
  return (
    <>
      <DayHeader days={days} />
      <TimeGridBody
        days={days}
        events={events}
        onSlotClick={onSlotClick}
        onHover={onHover}
        onUnhover={onUnhover}
        onClick={onClick}
        onUpdate={onUpdate}
        eventStyle={eventStyle}
      />
    </>
  );
};

const DayView = ({
  anchor,
  events,
  onSlotClick,
  onHover,
  onUnhover,
  onClick,
  onUpdate,
  eventStyle,
}) => {
  const days = [new Date(anchor)];
  return (
    <>
      <DayHeader days={days} />
      <TimeGridBody
        days={days}
        events={events}
        onSlotClick={onSlotClick}
        onHover={onHover}
        onUnhover={onUnhover}
        onClick={onClick}
        onUpdate={onUpdate}
        eventStyle={eventStyle}
      />
    </>
  );
};

const MonthView = ({ anchor, events, onSlotClick, onHover, onUnhover, onClick }) => {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const inMonth = (d) => d.getMonth() === anchor.getMonth();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {WEEK_LABELS_EN.map((l, i) => (
          <div
            key={l}
            style={{
              padding: "8px 10px",
              font: "600 9.5px/1 var(--font-sans)",
              color: i >= 5 ? "var(--neg)" : "var(--muted)",
              letterSpacing: "0.06em",
              borderRight: i < 6 ? "1px solid var(--divider)" : "0",
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="cal-scroll" style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gridAutoRows: "minmax(108px, 1fr)",
            height: "100%",
          }}
        >
          {cells.map((d, i) => {
            const dayEvents = events
              .filter((e) => sameDay(e.date, d))
              .sort((a, b) => a.start - b.start);
            const isToday = sameDay(d, TODAY);
            const dow = (d.getDay() + 6) % 7;
            const more = Math.max(0, dayEvents.length - 3);
            return (
              <div
                key={i}
                onClick={() => onSlotClick(d, 9)}
                style={{
                  padding: "6px 6px 6px",
                  borderRight: i % 7 < 6 ? "1px solid var(--divider)" : "0",
                  borderBottom: i < 35 ? "1px solid var(--divider)" : "0",
                  background: !inMonth(d) ? "var(--surface-2)" : "var(--surface)",
                  opacity: !inMonth(d) ? 0.55 : 1,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "2px 4px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-grid",
                      placeItems: "center",
                      minWidth: 22,
                      height: 22,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: isToday ? "var(--primary)" : "transparent",
                      color: isToday ? "#fff" : dow >= 5 ? "var(--neg)" : "var(--ink)",
                      font: "600 11.5px/1 var(--font-sans)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d.getDate()}
                  </span>
                </div>
                {dayEvents.slice(0, 3).map((ev) => {
                  const cat = CAT_BY_ID[ev.cat];
                  return (
                    <div
                      key={ev.id}
                      onPointerEnter={(e) => {
                        e.stopPropagation();
                        onHover && onHover(ev, e.currentTarget);
                      }}
                      onPointerLeave={() => onUnhover && onUnhover(false)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick && onClick(ev, e.currentTarget);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: cat.bg,
                        color: cat.ink,
                        font: "500 10.5px/1.2 var(--font-sans)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: cat.dot,
                          flexShrink: 0,
                        }}
                      ></span>
                      <span
                        style={{ fontVariantNumeric: "tabular-nums", color: cat.ink, opacity: 0.7 }}
                      >
                        {fmtTime(ev.start)}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.title}
                      </span>
                    </div>
                  );
                })}
                {more > 0 && (
                  <div
                    style={{
                      padding: "2px 6px",
                      font: "500 10px/1 var(--font-sans)",
                      color: "var(--muted)",
                    }}
                  >
                    +{more} 更多
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ======================================================================
   5. CalendarPage — 整合的頁面（給 App.jsx 在 active === "todo" 時 render）
   ====================================================================== */

export function CalendarPage({ defaultView = "week", showWeekend = true, eventStyle = "soft" }) {
  const [todos, setTodos] = useState(SEED_TODOS);
  const [events, setEvents] = useState(SEED_EVENTS);
  // 初始 view：手機（<640px）強制用 day，week/month 在窄寬度下擠到不能讀
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "day";
    return defaultView;
  }); // 'day' | 'week' | 'month'
  const [anchor, setAnchor] = useState(new Date(TODAY));

  // 手機寬度偵測：標題在窄寬度下要改為固定文字，否則 Day 模式日期太長會把 segmented control 擠到下一行
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // tweak 改動「預設檢視」時跟著切
  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  // Popover：{ event, anchor, locked }
  const [hovered, setHovered] = useState(null);
  const hoverTimer = useRef(null);

  // Modal：{ mode: 'create'|'edit', event }
  const [modal, setModal] = useState(null);

  const onEventHover = (event, el) => {
    clearTimeout(hoverTimer.current);
    setHovered((h) => (h?.locked ? h : { event, anchor: el, locked: false }));
  };
  const onEventUnhover = (force) => {
    clearTimeout(hoverTimer.current);
    if (force) {
      setHovered(null);
      return;
    }
    setHovered((h) => {
      if (!h || h.locked) return h;
      hoverTimer.current = setTimeout(() => setHovered(null), 180);
      return h;
    });
  };
  const onPopoverEnter = () => clearTimeout(hoverTimer.current);
  const onPopoverLeave = () => onEventUnhover(false);
  const onEventClick = (event, el) => {
    clearTimeout(hoverTimer.current);
    setHovered({ event, anchor: el, locked: true });
  };
  const closePopover = () => {
    clearTimeout(hoverTimer.current);
    setHovered(null);
  };

  const onSlotClick = (date, hour) => {
    closePopover();
    setModal({
      mode: "create",
      event: {
        title: "",
        cat: "work",
        date: new Date(date),
        start: hour,
        end: Math.min(HOUR_END - 0.5, hour + 1),
        reminder: 10,
        location: "",
        notes: "",
      },
    });
  };

  // 樂觀更新：拖曳 / resize 直接改 events
  const onEventUpdate = (ev) => {
    setEvents((es) => es.map((e) => (e.id === ev.id ? ev : e)));
  };

  const saveEvent = (ev) => {
    if (ev.id) setEvents((es) => es.map((e) => (e.id === ev.id ? ev : e)));
    else setEvents((es) => [...es, { ...ev, id: "e" + Date.now() }]);
    setModal(null);
  };
  const removeEvent = (ev) => {
    setEvents((es) => es.filter((e) => e.id !== ev.id));
    setModal(null);
    setHovered(null);
  };

  // 標題列範圍文字 — 手機固定顯示「行事曆」避免擠掉 segmented control
  const rangeLabel = (() => {
    if (isMobile) return "行事曆";
    if (view === "day") {
      return `${anchor.getFullYear()} 年 ${anchor.getMonth() + 1} 月 ${anchor.getDate()} 日 ・ 週${WEEK_LABELS_ZH[(anchor.getDay() + 6) % 7]}`;
    } else if (view === "week") {
      const ws = startOfWeek(anchor);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      return sameMonth
        ? `${ws.getFullYear()} 年 ${ws.getMonth() + 1} 月 ${ws.getDate()} – ${we.getDate()} 日`
        : `${ws.getMonth() + 1}/${ws.getDate()} – ${we.getMonth() + 1}/${we.getDate()}, ${we.getFullYear()}`;
    } else {
      return `${anchor.getFullYear()} 年 ${anchor.getMonth() + 1} 月`;
    }
  })();

  const step = (dir) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };

  return (
    <>
      <div
        className="calendar-page-layout"
        style={{
          display: "flex",
          gap: 14,
          // 扣掉 Topbar 高度 + main padding，讓 calendar 撐到視窗底
          height: "calc(100vh - 2 * var(--pad) - 56px)",
          minHeight: 540,
        }}
      >
        {/* LEFT — Todo bento card */}
        <TodoColumn todos={todos} setTodos={setTodos} />

        {/* RIGHT — Calendar bento card（寬度比 todo:calendar = 1:2） */}
        <section
          className="calendar-grid-section"
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--corner-card)",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "14px 18px 10px",
              borderBottom: "1px solid var(--divider)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Row 1 — 標題 + 檢視切換 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    font: "650 20px/1.2 var(--font-sans)",
                    color: "var(--ink)",
                    letterSpacing: "-0.02em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rangeLabel}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: 2,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  flexShrink: 0,
                }}
              >
                {[
                  { k: "day", l: "Day" },
                  { k: "week", l: "Week" },
                  { k: "month", l: "Month" },
                ].map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setView(o.k)}
                    style={{
                      height: 26,
                      padding: "0 14px",
                      border: 0,
                      borderRadius: 5,
                      cursor: "pointer",
                      background: view === o.k ? "var(--surface)" : "transparent",
                      color: view === o.k ? "var(--ink)" : "var(--muted)",
                      font: "550 12px/1 var(--font-sans)",
                      boxShadow: view === o.k ? "0 1px 2px rgba(0,0,0,.06)" : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2 — Today / 換頁 / legend / 新增 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setAnchor(new Date(TODAY))}
                style={{
                  height: 30,
                  padding: "0 12px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-2)",
                  borderRadius: 7,
                  cursor: "pointer",
                  font: "500 12px/1 var(--font-sans)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Today
              </button>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => step(-1)}
                  className="icon-btn"
                  style={{ width: 30, height: 30 }}
                  aria-label="上一頁"
                >
                  <i
                    className="ph ph-caret-left"
                    style={{ fontSize: 16, color: "var(--ink-2)" }}
                  ></i>
                </button>
                <button
                  onClick={() => step(1)}
                  className="icon-btn"
                  style={{ width: 30, height: 30 }}
                  aria-label="下一頁"
                >
                  <i
                    className="ph ph-caret-right"
                    style={{ fontSize: 16, color: "var(--ink-2)" }}
                  ></i>
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingLeft: 8,
                  marginLeft: 2,
                  borderLeft: "1px solid var(--divider)",
                  flexWrap: "wrap",
                }}
              >
                {CATEGORIES.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      font: "500 11px/1 var(--font-sans)",
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{ width: 7, height: 7, borderRadius: 999, background: c.dot }}
                    ></span>
                    {c.label}
                  </span>
                ))}
              </div>
              <div style={{ flex: 1 }}></div>
              <button
                onClick={() => onSlotClick(TODAY, 9)}
                className="btn-primary"
                style={{ height: 30, whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <i className="ph ph-plus" style={{ fontSize: 13 }}></i> 新增行程
              </button>
            </div>
          </div>

          {/* View body */}
          {view === "week" && (
            <WeekView
              anchor={anchor}
              events={events}
              onSlotClick={onSlotClick}
              onHover={onEventHover}
              onUnhover={onEventUnhover}
              onClick={onEventClick}
              onUpdate={onEventUpdate}
              eventStyle={eventStyle}
              showWeekend={showWeekend}
            />
          )}
          {view === "day" && (
            <DayView
              anchor={anchor}
              events={events}
              onSlotClick={onSlotClick}
              onHover={onEventHover}
              onUnhover={onEventUnhover}
              onClick={onEventClick}
              onUpdate={onEventUpdate}
              eventStyle={eventStyle}
            />
          )}
          {view === "month" && (
            <MonthView
              anchor={anchor}
              events={events}
              onSlotClick={onSlotClick}
              onHover={onEventHover}
              onUnhover={onEventUnhover}
              onClick={onEventClick}
            />
          )}
        </section>
      </div>

      {/* Hover popover（鎖在 fixed） */}
      {hovered && (
        <div onMouseEnter={onPopoverEnter} onMouseLeave={onPopoverLeave}>
          <EventPopover
            event={hovered.event}
            anchor={hovered.anchor}
            onEdit={(ev) => {
              setHovered(null);
              setModal({ mode: "edit", event: ev });
            }}
            onDelete={removeEvent}
            onClose={closePopover}
          />
        </div>
      )}

      {/* Modal */}
      {modal && (
        <EventModal
          initial={modal}
          onSave={saveEvent}
          onClose={() => setModal(null)}
          onDelete={removeEvent}
        />
      )}
    </>
  );
}
