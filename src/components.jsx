// components.jsx — 儀表板的 bento 卡片元件
import { useState, useMemo, useEffect, useRef } from "react";
import { CountUp, ValueChart, PieDonut, Sparkline } from "./charts.jsx";
// TodoRow / TodoInlineAdd 共用元件（首頁牌卡與 calendar 頁同一套，樣式與操作機制一致，避免兩處維護）
import { TodoRow, TodoInlineAdd } from "./calendar-page.jsx";
// 首頁收支趨勢／分類卡與理財頁共用同一份資料與計算函式（單一來源，數值必然一致）
import { useFinance, periodStats, trendData, categoryBreakdown } from "./finance-store.jsx";
import { finCatVar } from "./finance-categories.js";
import { fmtMoney } from "./ui.jsx";
// 待辦 / 行事曆與 /todo 頁面共用同一份 store（單一來源）；TODAY 為固定「今天」錨點
import { useTodoCalendar, TODAY, useLingeringDone } from "./todo-calendar-store.jsx";

/* ---------------- 待辦 / 行事曆共用小工具 ---------------- */
// 與 calendar-page 一致：週一為週首、十進位小時格式
const tcAddDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const tcStartOfWeek = (d) => {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
};
const tcSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
// 日期 key（週列 cell 與清單 group 用同一把，供點擊→捲動對應）
const tcDayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const tcFmtTime = (h) => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
// 行事曆分類 → .evt-bar 顏色 class（對齊 calendar tag 語意色：work=主色/health=警示/life=正向/study=紫/personal=灰）
const EVT_BAR_BY_CAT = {
  work: "",
  health: "warning",
  life: "positive",
  study: "violet",
  personal: "muted",
};

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
  // 待辦行事曆 badge：今天（TODAY）且未完成的待辦數量；為 0 時不顯示（badge 設 null）
  const { todos } = useTodoCalendar();
  const todoBadge = todos.filter((t) => !t.done && t.due && tcSameDay(t.due, TODAY)).length || null;

  const items = [
    { id: "dashboard", label: "儀表板", icon: "ph-squares-four", badge: null },
    { id: "todo", label: "待辦行事曆", icon: "ph-check-square", badge: todoBadge },
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

      <div className="sidebar-nav">
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
      </div>

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

/* 本月餘額 KPI：用真實理財資料（當月淨餘 + 較上月 %），與收支趨勢卡同源，數值一致 */
function BalanceKpi() {
  const { transactions } = useFinance();
  const stats = useMemo(() => periodStats(transactions, "month"), [transactions]);
  const pos = stats.delta >= 0;
  return (
    <Kpi
      icon="ph-wallet"
      label="本月餘額"
      value={stats.net}
      prefix="NT$"
      delta={stats.pct !== null ? `${pos ? "+" : "−"}${Math.abs(stats.pct).toFixed(1)}%` : null}
      deltaPos={pos}
    />
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

/* ---------------- Today's todos ----------------
   與 /todo 待辦行事曆頁面共用同一份 store；本卡只顯示「今天 due」的待辦，
   勾選 / 編輯 / 刪除 / 新增都直接寫回 store，兩頁即時同步。 */
function TodoCard({ onSeeAll }) {
  const { todos, setTodos } = useTodoCalendar();
  const [status, setStatus] = useState("active"); // active=進行中, done=已完成
  const { lingering, begin, cancel } = useLingeringDone(); // 打勾完成的停留→淡出過場

  // 今日待辦（含已完成）— 供完成度計算（TODAY 為固定錨點，非真實 new Date()）
  const todayTodos = useMemo(() => todos.filter((t) => t.due && tcSameDay(t.due, TODAY)), [todos]);
  const done = todayTodos.filter((t) => t.done).length;
  const rate = todayTodos.length ? Math.round((done / todayTodos.length) * 100) : 0;

  // 進行中：未排（沒選日期）置頂 + 今日待辦（依時間早到晚）；剛打勾、過場中的也暫留
  const activeList = useMemo(() => {
    const byTime = (a, b) => (a.time ?? Infinity) - (b.time ?? Infinity);
    const show = (t) => !t.done || lingering[t.id];
    const unscheduled = todos.filter((t) => !t.due && show(t)).sort(byTime);
    const today = todayTodos.filter(show).sort(byTime);
    return [...unscheduled, ...today];
  }, [todos, todayTodos, lingering]);
  // 已完成：全部已完成（跨日期），依日期 → 時間排序
  const doneList = useMemo(
    () =>
      todos
        .filter((t) => t.done)
        .sort(
          (a, b) =>
            (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity) ||
            (a.time ?? Infinity) - (b.time ?? Infinity),
        ),
    [todos],
  );
  const list = status === "active" ? activeList : doneList;

  // 透過 store 的 setTodos 改全量資料（functional updater，與 calendar TodoColumn 同寫法）
  const toggle = (todo) => {
    const willBeDone = !todo.done;
    setTodos((ts) => ts.map((t) => (t.id === todo.id ? { ...t, done: willBeDone } : t)));
    // 在「進行中」打勾完成 → 先停留再淡出；取消勾選 → 立刻留在清單
    if (status === "active") willBeDone ? begin(todo.id) : cancel(todo.id);
  };
  const edit = (todo) => setTodos((ts) => ts.map((t) => (t.id === todo.id ? todo : t)));
  const remove = (todo) => setTodos((ts) => ts.filter((t) => t.id !== todo.id));
  // 新增的待辦預設掛在 TODAY（出現在本卡），但日期可由 TodoInlineAdd 的 DatePicker 改成其他天
  const add = (t) => setTodos((ts) => [...ts, { id: "t" + Date.now(), ...t }]);

  return (
    <div className="card s-6" style={{ minHeight: 380 }}>
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-check-square"></i>今日待辦
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="tab-row" onClick={(e) => e.stopPropagation()}>
            <button className={status === "active" ? "on" : ""} onClick={() => setStatus("active")}>
              進行中
            </button>
            <button className={status === "done" ? "on" : ""} onClick={() => setStatus("done")}>
              已完成
            </button>
          </div>
          <button className="card-act" onClick={onSeeAll}>
            <i className="ph ph-arrow-up-right"></i>查看全部
          </button>
        </div>
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

      {/* 清單至多顯示 8 筆（每列 63px + gap 6px = 546px），超過於清單內捲動；
          scrollbar 沿用 .todo-list 既有自訂樣式，新增按鈕在清單外、固定卡片底部 */}
      <div className="todo-list" style={{ flex: 1, overflow: "auto", maxHeight: 8 * 63 + 7 * 6 }}>
        {list.length ? (
          list.map((t) => (
            // 過場中（fade）的項目淡出；其餘正常顯示
            <div
              key={t.id}
              style={{
                opacity: lingering[t.id] === "fade" ? 0 : 1,
                transition: "opacity .4s ease",
              }}
            >
              <TodoRow todo={t} onToggle={toggle} onEdit={edit} onDelete={remove} />
            </div>
          ))
        ) : (
          <div className="chart-empty">
            {status === "active" ? "今天沒有待辦事項" : "還沒有已完成的待辦"}
          </div>
        )}
      </div>

      {/* 新增只在「進行中」顯示（已完成是檢視歷史，不提供新增）；預設日期＝今天 */}
      {status === "active" && <TodoInlineAdd onAdd={add} defaultDate={TODAY} />}
    </div>
  );
}

/* ---------------- Finance trend ----------------
   與理財規劃頁「收支趨勢卡」共用同一份 store 資料與 periodStats / trendData 純函式，
   兩頁數值必然一致；差異只在首頁多了 CountUp 動畫、整卡可點進理財頁。 */
function FinanceCard({ chartMode, onOpen }) {
  const { transactions } = useFinance();
  const [period, setPeriod] = useState("month");
  const stats = useMemo(() => periodStats(transactions, period), [transactions, period]);
  const trend = useMemo(() => trendData(transactions, period), [transactions, period]);
  const deltaPos = stats.delta >= 0;
  // 整張卡可點進理財規劃頁；內部的週/月/年切換要 stopPropagation 才不會誤觸導頁
  return (
    <div
      className="card s-6 card-clickable"
      onClick={onOpen}
      role={onOpen ? "link" : undefined}
      title={onOpen ? "查看理財規劃" : undefined}
    >
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-line-up"></i>本月收支趨勢
        </div>
        <div className="tab-row" onClick={(e) => e.stopPropagation()}>
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
            <CountUp to={stats.net} />
          </div>
          {stats.pct !== null && (
            <span className={`delta ${deltaPos ? "pos" : "neg"}`}>
              <i className={`ph ${deltaPos ? "ph-trend-up" : "ph-trend-down"}`}></i>
              {deltaPos ? "+" : "−"}
              {Math.abs(stats.pct).toFixed(2)}%
            </span>
          )}
        </div>
        <div className="fin-stat">
          <div className="l">收入</div>
          <div className="v" style={{ color: "var(--pos)" }}>
            <small>+</small>
            <CountUp to={stats.income} />
          </div>
        </div>
        <div className="fin-stat">
          <div className="l">支出</div>
          <div className="v" style={{ color: "var(--neg)" }}>
            <small>−</small>
            <CountUp to={stats.expense} />
          </div>
        </div>
      </div>

      {stats.hasData ? (
        <ValueChart
          data={trend}
          mode={chartMode}
          formatValue={(v) => `NT$ ${fmtMoney(v)}`}
          yLabels={true}
          height={170}
        />
      ) : (
        <div className="chart-empty">這個期間還沒有帳目資料</div>
      )}
    </div>
  );
}

/* ---------------- Calendar / week schedule ----------------
   與 /todo 待辦行事曆頁面共用同一份 events store；顯示「本週」整週事件，依日期分組、卡片內可捲動。
   週首為週一、以 TODAY（真實今天）對齊；點上方日期會捲動清單到對應日。 */
function CalendarCard({ onSeeAll }) {
  const { events } = useTodoCalendar();
  const dowLabels = ["一", "二", "三", "四", "五", "六", "日"];
  const [selectedKey, setSelectedKey] = useState(() => tcDayKey(TODAY)); // 預設選中今日
  const listRef = useRef(null);

  // 點日期：選中 + 把清單捲到該日 group（無事件的日子沒有 group，僅更新選中）
  const handleDayClick = (d) => {
    setSelectedKey(tcDayKey(d));
    const container = listRef.current;
    const target = container?.querySelector(`[data-day="${tcDayKey(d)}"]`);
    if (container && target) container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  };

  const { week, groups } = useMemo(() => {
    const weekStart = tcStartOfWeek(TODAY);
    const weekEnd = tcAddDays(weekStart, 7); // 下週一 00:00（不含）
    const week = Array.from({ length: 7 }, (_, i) => tcAddDays(weekStart, i));
    // 本週事件，依日期 → 開始時間排序
    const weekEvents = events
      .filter((e) => e.date >= weekStart && e.date < weekEnd)
      .sort((a, b) => a.date - b.date || a.start - b.start);
    // 依日期分組（只保留有事件的日子）
    const groups = week
      .map((d) => ({ day: d, items: weekEvents.filter((e) => tcSameDay(e.date, d)) }))
      .filter((g) => g.items.length);
    return { week, groups };
  }, [events]);

  return (
    <div className="card s-6" style={{ minHeight: 380 }}>
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-calendar-dots"></i>行事曆 · 本週
        </div>
        <button className="card-act" onClick={onSeeAll}>
          <i className="ph ph-arrow-up-right"></i>查看全部
        </button>
      </div>
      <div className="cal-week">
        {week.map((d, i) => {
          const count = events.filter((e) => tcSameDay(e.date, d)).length;
          const isToday = tcSameDay(d, TODAY);
          const isSelected = tcDayKey(d) === selectedKey;
          return (
            <div
              key={i}
              className={`cal-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${count ? "" : "empty"}`}
              onClick={() => handleDayClick(d)}
            >
              <div className="dow">{dowLabels[i]}</div>
              <div className="dnum">{d.getDate()}</div>
              <div className="pips">
                {Array.from({ length: count }, (_, j) => (
                  <span key={j} className="pip"></span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* wrapper 用 flex:1 撐滿剩餘空間，evt-list 絕對定位填滿並捲動：
          這樣事件清單不會把卡片高度撐高，改由左邊今日待辦卡的自然高度決定列高（grid stretch 等高） */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div
          ref={listRef}
          className="evt-list"
          style={{ position: "absolute", inset: 0, overflow: "auto" }}
        >
          {groups.length ? (
            groups.map((g, gi) => (
              <div key={gi} data-day={tcDayKey(g.day)}>
                <div className="evt-day">
                  週{dowLabels[(g.day.getDay() + 6) % 7]} {g.day.getMonth() + 1}/{g.day.getDate()}
                  {tcSameDay(g.day, TODAY) && <span className="evt-day-today">今天</span>}
                </div>
                {g.items.map((e) => (
                  <div key={e.id} className="evt">
                    <div className="evt-time">{tcFmtTime(e.start)}</div>
                    <div className={`evt-bar ${EVT_BAR_BY_CAT[e.cat] || ""}`}></div>
                    <div className="evt-body">
                      <div className="evt-t">{e.title}</div>
                      <div className="evt-s">{e.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="chart-empty">本週沒有行事曆事件</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Spending donut（對齊理財規劃頁「收支分類」卡：真實資料 + 支出／收入切換） ----------------
   與理財頁共用 categoryBreakdown 資料、finCatVar 配色、.fin-donut-row / .fin-legend 版型，確保兩頁一致。
   右上「更多」按鈕點擊進入理財規劃頁。 */
function SpendCard({ onOpen }) {
  const { transactions } = useFinance();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const [catType, setCatType] = useState("expense"); // expense | income
  const isIncome = catType === "income";
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, curYear, curMonth, catType),
    [transactions, curYear, curMonth, catType],
  );
  return (
    <div className="card s-6 spend-card">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-pie-slice"></i>收支分類
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="tab-row">
            <button className={!isIncome ? "on" : ""} onClick={() => setCatType("expense")}>
              支出
            </button>
            <button className={isIncome ? "on" : ""} onClick={() => setCatType("income")}>
              收入
            </button>
          </div>
          <button className="card-act" onClick={onOpen}>
            <i className="ph ph-arrow-up-right"></i>更多
          </button>
        </div>
      </div>
      {breakdown.total > 0 ? (
        <div className="fin-donut-row">
          <PieDonut
            data={breakdown.items.map((it) => ({
              value: it.value,
              color: finCatVar(it.cat),
              label: `${it.cat.emoji} ${it.cat.name}`,
            }))}
            totalLabel={isIncome ? "本月收入（NTD）" : "本月支出（NTD）"}
            size={200}
            stroke={24}
            formatValue={(v) => `$ ${fmtMoney(v)}`}
          />
          <div className="fin-legend">
            {breakdown.items.map((it) => (
              <div className="row" key={it.key}>
                <span className="sq" style={{ background: finCatVar(it.cat) }}></span>
                <span className="nm">{it.cat.name}</span>
                <span className="pct">{Math.round(it.pct)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chart-empty">
          {isIncome ? "這個月還沒有收入紀錄" : "這個月還沒有支出紀錄"}
        </div>
      )}
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
  BalanceKpi,
  KpiTrend,
  TodoCard,
  FinanceCard,
  CalendarCard,
  SpendCard,
  GoalsCard,
  MoodCard,
  QuickAddCard,
};
