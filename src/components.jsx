// components.jsx — 儀表板的 bento 卡片元件
import { useState, useMemo, useEffect, useRef } from "react";
import { CountUp, ValueChart, PieDonut, Sparkline } from "./charts.jsx";
// TodoRow 共用元件（首頁 TodoCard 跟 calendar TodoColumn 都用同一個 row 元件，避免兩處維護）
import { TodoRow } from "./calendar-page.jsx";

/* ---------------- Sidebar ---------------- */
function Sidebar({
  active,
  setActive,
  theme,
  setTheme,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}) {
  const items = [
    { id: "dashboard", label: "儀表板", icon: "ph-squares-four", badge: null },
    { id: "todo", label: "待辦行事曆", icon: "ph-check-square", badge: "8" },
    { id: "finance", label: "理財規劃", icon: "ph-wallet", badge: null },
    { id: "goals", label: "年度目標", icon: "ph-target", badge: null },
    { id: "mood", label: "每日心情", icon: "ph-smiley", badge: null },
  ];
  const tools = [
    { id: "designSystem", label: "Design System", icon: "ph-palette" },
    { id: "stats", label: "統計分析", icon: "ph-chart-line-up" },
    { id: "journal", label: "日記筆記", icon: "ph-notebook" },
    { id: "set", label: "設定", icon: "ph-gear-six" },
  ];
  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <i className="ph ph-circles-three-plus"></i>
        </div>
        <div className="brand-text">
          <div className="brand-name">Dayboard</div>
          <div className="brand-sub">Yuu&apos;s workspace</div>
        </div>
        {/* 桌面用的收合切換鈕；tablet/mobile 用 CSS 隱藏 */}
        <button
          type="button"
          className="sidebar-collapse-btn"
          aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((v) => !v)}
        >
          <i className={`ph ${collapsed ? "ph-caret-double-right" : "ph-caret-double-left"}`}></i>
        </button>
      </div>

      <div className="nav-section">主要功能</div>
      {items.map((it) => (
        <div
          key={it.id}
          className={`nav-item ${active === it.id ? "active" : ""}`}
          onClick={() => {
            setActive(it.id);
            setMobileOpen(false);
          }}
        >
          <i className={`ph ${it.icon}`}></i>
          <span className="lbl">{it.label}</span>
          {it.badge && <span className="badge">{it.badge}</span>}
        </div>
      ))}

      <div className="nav-section">工具</div>
      {tools.map((it) => (
        <div
          key={it.id}
          className={`nav-item ${active === it.id ? "active" : ""}`}
          onClick={() => {
            setActive(it.id);
            setMobileOpen(false);
          }}
        >
          <i className={`ph ${it.icon}`}></i>
          <span className="lbl">{it.label}</span>
        </div>
      ))}

      <div className="sidebar-foot">
        <div className={`theme-toggle ${theme === "dark" ? "dark" : ""}`}>
          <span className="knob"></span>
          <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>
            <i className="ph ph-sun"></i>
          </button>
          <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>
            <i className="ph ph-moon"></i>
          </button>
        </div>
        <div className="user-row">
          <div className="avatar">鎮</div>
          <div className="user-text">
            <div className="user-name">鎮瑜 Yuu</div>
            <div className="user-mail">yuu@dayboard.app</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Topbar ---------------- */
function Topbar({ onMenu }) {
  // 小網 scroll 隱藏邏輯：下滑藏、上滑顯、到頂強制顯
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const THRESHOLD = 4; // 抖動容忍值，小於這個距離不切換狀態
    const TOP_EDGE = 8; // 接近頂端時強制顯示

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < TOP_EDGE) {
          setHidden(false);
        } else if (y > lastY.current + THRESHOLD) {
          setHidden(true); // 下滑
        } else if (y < lastY.current - THRESHOLD) {
          setHidden(false); // 上滑
        }
        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`topbar ${hidden ? "is-hidden" : ""}`}>
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="menu">
        <i className="ph ph-list"></i>
      </button>
      <div className="search">
        <i className="ph ph-magnifying-glass"></i>
        <input placeholder="搜尋待辦、紀錄、目標…" />
        <span className="kbd">⌘K</span>
      </div>
      <div style={{ flex: 1 }}></div>
      <button className="icon-btn" aria-label="filter">
        <i className="ph ph-funnel"></i>
      </button>
      <button className="icon-btn" aria-label="notifications">
        <i className="ph ph-bell"></i>
        <span className="dot"></span>
      </button>
    </div>
  );
}

/* ---------------- Hero / greeting ---------------- */
function Hero() {
  const now = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const hour = now.getHours();
  const greet =
    hour < 6 ? "夜深了" : hour < 11 ? "早安" : hour < 14 ? "午安" : hour < 18 ? "下午好" : "晚安";
  return (
    <div className="hero">
      <div className="hero-greet">
        <h1>
          {greet}，鎮瑜<span className="accent">.</span>
        </h1>
        <p>
          你今天還有 <b style={{ color: "var(--ink)" }}>5 件待辦</b>{" "}
          等待完成，本週目標進度持續上升。
        </p>
      </div>
      <div className="hero-meta">
        <div className="weather-pill">
          <div className="ico">
            <i className="ph ph-sun"></i>
          </div>
          <div>
            <div className="meta">台北 · 多雲</div>
            <div className="temp">26°C</div>
          </div>
        </div>
        <div className="date-pill">
          <i className="ph ph-calendar-blank" style={{ color: "var(--muted)" }}></i>
          <div>
            <div className="num">{now.getDate()}</div>
            <div className="lbl">
              {days[now.getDay()]} · {months[now.getMonth()]}
            </div>
          </div>
        </div>
        <button className="btn-primary">
          <i className="ph ph-plus"></i>新增
        </button>
      </div>
    </div>
  );
}

/* ---------------- KPI mini cards ---------------- */
// 基礎 KPI 卡片：僅顯示 icon / label / 數字 / delta，無趨勢圖
function Kpi({ icon, label, value, prefix, suffix, delta, deltaPos = true, decimals }) {
  return (
    <div className="card kpi">
      <div className="row">
        <div className="kpi-icon">
          <i className={`ph ${icon}`}></i>
        </div>
        {delta != null && (
          <span className={`delta ${deltaPos ? "pos" : "neg"}`}>
            <i className={`ph ${deltaPos ? "ph-arrow-up-right" : "ph-arrow-down-right"}`}></i>
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="num">
          {prefix && <span className="currency">{prefix}</span>}
          <CountUp to={value} suffix={suffix || ""} decimals={decimals || 0} />
        </div>
      </div>
    </div>
  );
}

// 帶趨勢圖的 KPI 卡片：在基礎版本下方附加 Sparkline
function KpiTrend({ icon, label, value, prefix, suffix, delta, deltaPos = true, spark, decimals }) {
  return (
    <div className="card kpi">
      <div className="row">
        <div className="kpi-icon">
          <i className={`ph ${icon}`}></i>
        </div>
        {delta != null && (
          <span className={`delta ${deltaPos ? "pos" : "neg"}`}>
            <i className={`ph ${deltaPos ? "ph-arrow-up-right" : "ph-arrow-down-right"}`}></i>
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="num">
          {prefix && <span className="currency">{prefix}</span>}
          <CountUp to={value} suffix={suffix || ""} decimals={decimals || 0} />
        </div>
      </div>
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

/* ---------------- Today's todos ---------------- */
// 資料結構對齊 calendar SEED_TODOS：{ id, title, cat, time(數字), done }
const seedTodos = [
  { id: 1, title: "Sprint 規劃會議準備", cat: "work", time: 10, done: true },
  { id: 2, title: "回覆設計部 PR 修改", cat: "work", time: 11.5, done: true },
  { id: 3, title: "健身房・腿部訓練", cat: "health", time: 18, done: false },
  { id: 4, title: "看《設計心理學》第 5 章", cat: "life", time: 21, done: false },
  { id: 5, title: "整理本週開銷", cat: "life", time: 22, done: false },
  { id: 6, title: "與媽媽通電話", cat: "life", time: 20, done: false },
];

function TodoCard({ onSeeAll }) {
  const [todos, setTodos] = useState(seedTodos);
  const [draft, setDraft] = useState("");
  const done = todos.filter((t) => t.done).length;
  const rate = Math.round((done / todos.length) * 100);

  const toggle = (todo) =>
    setTodos((ts) => ts.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
  const edit = (todo) => setTodos((ts) => ts.map((t) => (t.id === todo.id ? todo : t)));
  const remove = (todo) => setTodos((ts) => ts.filter((t) => t.id !== todo.id));
  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setTodos([...todos, { id: Date.now(), title: v, cat: "life", time: null, done: false }]);
    setDraft("");
  };

  return (
    <div className="card s-6" style={{ minHeight: 380 }}>
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-check-square"></i>今日待辦
        </div>
        <button className="card-act" onClick={onSeeAll}>
          <i className="ph ph-arrow-up-right"></i>查看全部
        </button>
      </div>

      <div className="todo-progress">
        <div className="rate">
          <CountUp to={rate} suffix="%" />
        </div>
        <div className="lbl">今日完成度</div>
        <div className="bar" style={{ flex: 1 }}>
          <span
            style={{
              transform: `scaleX(${rate / 100})`,
              transition: "transform .9s cubic-bezier(.4,.05,.2,1)",
            }}
          ></span>
        </div>
      </div>

      <div className="todo-list" style={{ flex: 1, overflow: "auto" }}>
        {todos.map((t) => (
          <TodoRow key={t.id} todo={t} onToggle={toggle} onEdit={edit} onDelete={remove} />
        ))}
      </div>

      <form className="todo-add" onSubmit={submit}>
        <i className="ph ph-plus-circle" style={{ color: "var(--muted)" }}></i>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="新增待辦事項…"
        />
        <button className="submit" type="submit">
          <i className="ph ph-arrow-right"></i>
        </button>
      </form>
    </div>
  );
}

/* ---------------- Finance trend ---------------- */
function FinanceCard({ chartMode }) {
  const [period, setPeriod] = useState("month");
  const month = [
    { label: "1", value: 32400 },
    { label: "5", value: 35100 },
    { label: "10", value: 33800 },
    { label: "15", value: 38200 },
    { label: "20", value: 41600 },
    { label: "25", value: 39400 },
    { label: "30", value: 43200 },
  ];
  const week = [
    { label: "一", value: 1240 },
    { label: "二", value: 980 },
    { label: "三", value: 2180 },
    { label: "四", value: 1560 },
    { label: "五", value: 2640 },
    { label: "六", value: 3120 },
    { label: "日", value: 1840 },
  ];
  const year = [
    { label: "Jan", value: 28000 },
    { label: "Feb", value: 30200 },
    { label: "Mar", value: 33000 },
    { label: "Apr", value: 31800 },
    { label: "May", value: 36500 },
    { label: "Jun", value: 39200 },
    { label: "Jul", value: 41000 },
    { label: "Aug", value: 38600 },
    { label: "Sep", value: 42100 },
    { label: "Oct", value: 40500 },
    { label: "Nov", value: 43800 },
    { label: "Dec", value: 43200 },
  ];
  const data = period === "week" ? week : period === "year" ? year : month;
  return (
    <div className="card s-6">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-line-up"></i>本月收支趨勢
        </div>
        <div className="tab-row">
          <button className={period === "week" ? "on" : ""} onClick={() => setPeriod("week")}>
            週
          </button>
          <button className={period === "month" ? "on" : ""} onClick={() => setPeriod("month")}>
            月
          </button>
          <button className={period === "year" ? "on" : ""} onClick={() => setPeriod("year")}>
            年
          </button>
        </div>
      </div>

      <div className="fin-row">
        <div className="fin-stat">
          <div className="l">本期淨餘（NTD）</div>
          <div className="v">
            <small>$</small>
            <CountUp to={43200} />
          </div>
          <span className="delta pos">
            <i className="ph ph-trend-up"></i>+8.34%
          </span>
        </div>
        <div className="fin-stat">
          <div className="l">收入</div>
          <div className="v" style={{ color: "var(--pos)" }}>
            <small>+</small>
            <CountUp to={68200} />
          </div>
        </div>
        <div className="fin-stat">
          <div className="l">支出</div>
          <div className="v" style={{ color: "var(--neg)" }}>
            <small>−</small>
            <CountUp to={25000} />
          </div>
        </div>
      </div>

      <ValueChart
        data={data}
        mode={chartMode}
        formatValue={(v) => `NT$ ${v.toLocaleString()}`}
        yLabels={true}
        height={170}
      />
    </div>
  );
}

/* ---------------- Calendar / week schedule ---------------- */
function CalendarCard() {
  const today = new Date();
  const dow = today.getDay();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d;
  });
  const dowLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const eventDots = [1, 3, 2, 4, 1, 0, 2]; // events per day
  const events = [
    { time: "09:00", title: "Daily standup", sub: "Engineering · Zoom", bar: "" },
    { time: "11:30", title: "1:1 with Lina", sub: "Career sync · 30 mins", bar: "positive" },
    { time: "14:00", title: "Design review – Onboarding", sub: "5 stakeholders · Figma", bar: "" },
    { time: "16:30", title: "回診皮膚科", sub: "提醒・帶健保卡", bar: "warning" },
    { time: "19:00", title: "晚餐 with 阿哲", sub: "信義區・八兵衛", bar: "positive" },
    { time: "21:00", title: "便利商店領貨", sub: "永和區・永騰門市", bar: "" },
  ];
  return (
    <div className="card s-6">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-calendar-dots"></i>行事曆 · 本週
        </div>
        <button className="card-act">
          <i className="ph ph-arrow-up-right"></i>這月
        </button>
      </div>
      <div className="cal-week">
        {week.map((d, i) => (
          <div key={i} className={`cal-day ${i === dow ? "today" : ""}`}>
            <div className="dow">{dowLabels[i]}</div>
            <div className="dnum">{d.getDate()}</div>
            <div className="pips">
              {Array.from({ length: eventDots[i] }, (_, j) => (
                <span key={j} className="pip"></span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="evt-list">
        {events.map((e, i) => (
          <div key={i} className="evt">
            <div className="evt-time">{e.time}</div>
            <div className={`evt-bar ${e.bar}`}></div>
            <div className="evt-body">
              <div className="evt-t">{e.title}</div>
              <div className="evt-s">{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Spending donut ---------------- */
function SpendCard() {
  const cat = [
    { lbl: "餐飲", v: 8400, color: "var(--primary)" },
    { lbl: "交通", v: 3200, color: "color-mix(in oklch, var(--primary) 60%, var(--surface))" },
    { lbl: "娛樂", v: 5600, color: "color-mix(in oklch, var(--primary) 35%, var(--surface))" },
    { lbl: "居家", v: 4800, color: "color-mix(in oklch, var(--ink) 70%, var(--surface))" },
    { lbl: "其他", v: 3000, color: "var(--faint)" },
  ];
  const total = cat.reduce((s, c) => s + c.v, 0);
  return (
    <div className="card s-6 spend-card">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-pie-slice"></i>支出分類
        </div>
        <button className="icon-btn" aria-label="notifications">
          <i className="ph ph-bell"></i>
        </button>
      </div>
      <div className="spend-donut">
        <PieDonut
          data={cat.map((c) => ({ value: c.v, color: c.color }))}
          totalLabel="本月支出（NTD）"
          size={200}
          stroke={24}
        />
      </div>
      <div className="spend-legend">
        {cat.map((c, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: c.color }}></span>
            <span className="lbl">{c.lbl}</span>
            <span className="val">{Math.round((c.v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Annual goals ---------------- */
function GoalsCard() {
  const goals = [
    { t: "閱讀 24 本書", now: 11, of: 24, unit: "本", meta: "進度超前 · 5 月" },
    { t: "存款 NT$ 360,000", now: 218000, of: 360000, unit: "", meta: "61% · 預計 11 月達標" },
    { t: "跑步 1,000 公里", now: 412, of: 1000, unit: "km", meta: "落後 8% · 加把勁" },
    { t: "完成側專案 v2", now: 6, of: 10, unit: "節", meta: "第 6 / 10 章" },
  ];
  const overall = Math.round((goals.reduce((s, g) => s + g.now / g.of, 0) / goals.length) * 100);
  return (
    <div className="card s-4">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-target"></i>年度目標
        </div>
        <span className="delta pos">
          <i className="ph ph-trend-up"></i>+4 本週
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <CountUp to={overall} suffix="%" />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>整體達成率</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
        {goals.map((g, i) => {
          const pct = Math.min(100, (g.now / g.of) * 100);
          return (
            <div key={i} className="goal">
              <div className="goal-h">
                <div className="goal-t">{g.t}</div>
                <div className="goal-v">
                  {g.now.toLocaleString()}
                  {g.unit && ` ${g.unit}`} / {g.of.toLocaleString()}
                  {g.unit && ` ${g.unit}`}
                </div>
              </div>
              <div className="bar">
                <span
                  style={{
                    transform: `scaleX(${pct / 100})`,
                    transition: `transform 1s cubic-bezier(.4,.05,.2,1) ${i * 100}ms`,
                  }}
                ></span>
              </div>
              <div className="goal-meta">{g.meta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Mood ---------------- */
function MoodCard() {
  const [picked, setPicked] = useState(3);
  const moods = [
    { i: "ph-cloud-rain", l: "低落" },
    { i: "ph-cloud", l: "一般" },
    { i: "ph-cloud-sun", l: "尚可" },
    { i: "ph-sun", l: "不錯" },
    { i: "ph-sun-horizon", l: "極佳" },
  ];

  // 30-day mood values 0..4
  const days = useMemo(() => {
    const seed = [
      2,
      3,
      3,
      2,
      4,
      3,
      4,
      3,
      2,
      1,
      2,
      3,
      4,
      4,
      3,
      2,
      3,
      4,
      3,
      2,
      1,
      2,
      3,
      4,
      4,
      3,
      3,
      4,
      3,
      picked,
    ];
    return seed;
  }, [picked]);
  const avg = days.reduce((s, v) => s + v, 0) / days.length;
  const labels = ["低", "1", "2", "3", "好"];

  return (
    <div className="card s-4">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-smiley"></i>今日心情 · 30 天趨勢
        </div>
        <button className="card-act">
          本月 <i className="ph ph-caret-down"></i>
        </button>
      </div>

      <div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>今天感覺如何？</div>
        <div className="mood-pick">
          {moods.map((m, i) => (
            <button
              key={i}
              className={`mood-btn ${i === picked ? "on" : ""}`}
              onClick={() => setPicked(i)}
            >
              <span className="glyph">
                <i className={`ph ${m.i}`}></i>
              </span>
              <span>{m.l}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>本月平均</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <CountUp to={avg} decimals={1} suffix=" / 4" />
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <div className="heatmap">
          {days.map((v, i) => (
            <div
              key={i}
              className={`hm-cell l${v}`}
              title={`第 ${i + 1} 天`}
              style={{ animationDelay: `${i * 18}ms` }}
            ></div>
          ))}
        </div>
        <div className="hm-legend">
          <span>30 天前</span>
          <span className="scale">
            <span>低</span>
            <span className="sw l0"></span>
            <span
              className="sw l1"
              style={{ background: "color-mix(in oklch, var(--primary) 20%, var(--divider))" }}
            ></span>
            <span
              className="sw l2"
              style={{ background: "color-mix(in oklch, var(--primary) 40%, var(--divider))" }}
            ></span>
            <span
              className="sw l3"
              style={{ background: "color-mix(in oklch, var(--primary) 65%, var(--divider))" }}
            ></span>
            <span className="sw l4" style={{ background: "var(--primary)" }}></span>
            <span>好</span>
          </span>
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Quick add ---------------- */
function QuickAddCard() {
  const items = [
    { i: "ph-check-square", l: "新增待辦", s: "Cmd ⌘ + N" },
    { i: "ph-receipt", l: "記一筆支出", s: "快速記帳" },
    { i: "ph-calendar-plus", l: "新增行程", s: "排入下週" },
    { i: "ph-target", l: "更新目標", s: "推進進度" },
  ];
  return (
    <div className="card s-4">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-lightning"></i>快速新增
        </div>
      </div>
      <div className="quick-grid">
        {items.map((it, i) => (
          <button key={i} className="quick-btn">
            <div className="ico">
              <i className={`ph ${it.i}`}></i>
            </div>
            <div>
              <div className="lbl">{it.l}</div>
              <div className="sub">{it.s}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export {
  Sidebar,
  Topbar,
  Hero,
  Kpi,
  KpiTrend,
  TodoCard,
  FinanceCard,
  CalendarCard,
  SpendCard,
  GoalsCard,
  MoodCard,
  QuickAddCard,
};
