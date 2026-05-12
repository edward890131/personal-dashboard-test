// components.jsx — 儀表板的 bento 卡片元件
import { useState, useMemo } from "react";
import { CountUp, ValueChart, PieDonut, Sparkline } from "./charts.jsx";

/* ---------------- Sidebar ---------------- */
function Sidebar({ active, setActive, theme, setTheme, mobileOpen, setMobileOpen }) {
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
  return (
    <div className="topbar">
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
function Kpi({ icon, label, value, prefix, suffix, delta, deltaPos = true, spark, decimals }) {
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
const seedTodos = [
  { id: 1, title: "Sprint 規劃會議準備", time: "10:00", tag: "work", done: true },
  { id: 2, title: "回覆設計部 PR 修改", time: "11:30", tag: "work", done: true },
  { id: 3, title: "健身房・腿部訓練", time: "18:00", tag: "health", done: false },
  { id: 4, title: "看《設計心理學》第 5 章", time: "21:00", tag: "life", done: false },
  { id: 5, title: "整理本週開銷", time: "22:00", tag: "life", done: false },
  { id: 6, title: "與媽媽通電話", time: "20:00", tag: "life", done: false },
];
const tagLabel = { work: "工作", health: "健康", life: "生活" };

function TodoCard() {
  const [todos, setTodos] = useState(seedTodos);
  const [draft, setDraft] = useState("");
  const done = todos.filter((t) => t.done).length;
  const rate = Math.round((done / todos.length) * 100);

  const toggle = (id) => setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setTodos([...todos, { id: Date.now(), title: v, time: "今日", tag: "life", done: false }]);
    setDraft("");
  };

  return (
    <div className="card s-5" style={{ minHeight: 380 }}>
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-check-square"></i>今日待辦
        </div>
        <button className="card-act">
          <i className="ph ph-arrow-up-right"></i>查看全部
        </button>
      </div>

      <div className="todo-progress">
        <div className="rate">
          <CountUp to={rate} suffix="%" />
          <small>
            {" "}
            · {done}/{todos.length}
          </small>
        </div>
        <div style={{ flex: 1 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>
            今日完成度
          </div>
          <div className="bar">
            <span
              style={{
                transform: `scaleX(${rate / 100})`,
                transition: "transform .9s cubic-bezier(.4,.05,.2,1)",
              }}
            ></span>
          </div>
        </div>
      </div>

      <div className="todo-list" style={{ flex: 1, overflow: "auto" }}>
        {todos.map((t) => (
          <div key={t.id} className={`todo ${t.done ? "done" : ""}`} onClick={() => toggle(t.id)}>
            <span className={`checkbox ${t.done ? "checked" : ""}`}>
              <i className="ph-bold ph-check"></i>
            </span>
            <div className="body">
              <div className="title">{t.title}</div>
              <div className="meta">
                <span className="time">
                  <i className="ph ph-clock" style={{ fontSize: 11, marginRight: 2 }}></i>
                  {t.time}
                </span>
                <span className={`tag ${t.tag}`}>{tagLabel[t.tag]}</span>
              </div>
            </div>
          </div>
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
    <div className="card s-7">
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
          <div className="l">本期淨餘</div>
          <div className="v">
            <small>NT$</small>
            <CountUp to={43200} />
          </div>
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
        <span className="delta pos" style={{ marginBottom: 4 }}>
          <i className="ph ph-trend-up"></i>+8.34%
        </span>
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
  ];
  return (
    <div className="card s-5">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-calendar-dots"></i>本週行程
        </div>
        <button className="card-act">
          五月 2026 <i className="ph ph-caret-down"></i>
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
    <div className="card s-4">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-pie-slice"></i>支出分類
        </div>
        <button className="card-act">
          <i className="ph ph-dots-three"></i>
        </button>
      </div>
      <div className="donut-wrap">
        <PieDonut data={cat.map((c) => ({ value: c.v, color: c.color }))} totalLabel="本月支出" />
        <div className="legend">
          {cat.map((c, i) => (
            <div key={i} className="legend-row">
              <span className="legend-dot" style={{ background: c.color }}></span>
              <span className="lbl">{c.lbl}</span>
              <span className="val">{Math.round((c.v / total) * 100)}%</span>
            </div>
          ))}
        </div>
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
                  <b>{g.now.toLocaleString()}</b>
                  {g.unit}{" "}
                  <span style={{ opacity: 0.6 }}>
                    / {g.of.toLocaleString()}
                    {g.unit}
                  </span>
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
    <div className="card s-8">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-smiley"></i>今日心情 · 30 天趨勢
        </div>
        <button className="card-act">
          本月 <i className="ph ph-caret-down"></i>
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>
            今天感覺如何？
          </div>
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
  TodoCard,
  FinanceCard,
  CalendarCard,
  SpendCard,
  GoalsCard,
  MoodCard,
  QuickAddCard,
};
