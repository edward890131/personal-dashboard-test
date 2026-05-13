// App.jsx — 整個 Dashboard 的組裝點
import { useState, useEffect } from "react";
import {
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
} from "./components.jsx";
import {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakToggle,
  TweakSelect,
  TweakRadio,
} from "./tweaks-panel.jsx";
import { DesignSystemPage } from "./design-system.jsx";
import { CalendarPage } from "./calendar-page.jsx";

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  dark: false,
  font: "Inter",
  chartMode: "area",
  // Calendar page tweaks
  calendarView: "week", // 'day' | 'week' | 'month'
  showWeekend: true,
  eventStyle: "soft", // 'soft' | 'bar' | 'solid'
}; /*EDITMODE-END*/

// 路徑 ↔ active 對照（只有非 dashboard 的頁面要列出來）
// 加新路由時：在這裡多一行，並在 main 區塊加對應的 render 分支即可。
const PATH_TO_ACTIVE = { "/design-system": "designSystem", "/todo": "todo" };
const ACTIVE_TO_PATH = { designSystem: "/design-system", todo: "/todo" };

function pathToActive(path) {
  return PATH_TO_ACTIVE[path] || "dashboard";
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useState(() => pathToActive(window.location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  // 側邊欄收合狀態（桌面手動切換，tablet/mobile 由 CSS 各自處理）
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "1",
  );
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // 監聽瀏覽器上一頁 / 下一頁，把 pathname 同步回 active state
  useEffect(() => {
    const onPop = () => setActive(pathToActive(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 切換 active 同時更新 URL（pushState，不重新整理頁面）
  const navigate = (id) => {
    setActive(id);
    const path = ACTIVE_TO_PATH[id] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  // theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.dark ? "dark" : "light");
  }, [t.dark]);
  // font
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ff-sans",
      `'${t.font}', ui-sans-serif, system-ui, -apple-system, "PingFang TC", "Noto Sans TC", sans-serif`,
    );
  }, [t.font]);

  return (
    <div className={`app ${collapsed ? "is-collapsed" : ""}`}>
      <Sidebar
        active={active}
        setActive={navigate}
        theme={t.dark ? "dark" : "light"}
        setTheme={(m) => setTweak("dark", m === "dark")}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`scrim ${mobileOpen ? "on" : ""}`} onClick={() => setMobileOpen(false)}></div>

      <main className="main">
        <Topbar onMenu={() => setMobileOpen(true)} />

        {active === "dashboard" ? (
          <div className="dash-grid">
            <Hero />

            <div className="s-3">
              <Kpi
                icon="ph-check-square"
                label="待辦完成率"
                value={42}
                suffix="%"
                delta="+12%"
                deltaPos={true}
                spark={[3, 4, 5, 4, 6, 7, 8, 7, 9, 10]}
              />
            </div>
            <div className="s-3">
              <Kpi
                icon="ph-wallet"
                label="本月餘額"
                value={43200}
                prefix="NT$"
                delta="+8.3%"
                deltaPos={true}
                spark={[20, 22, 21, 24, 26, 28, 30, 32, 34, 36]}
              />
            </div>
            <div className="s-3">
              <Kpi
                icon="ph-target"
                label="目標達成率"
                value={58}
                suffix="%"
                delta="+4%"
                deltaPos={true}
                spark={[20, 30, 28, 40, 42, 46, 50, 54, 56, 58]}
              />
            </div>
            <div className="s-3">
              <Kpi
                icon="ph-fire"
                label="連續打卡"
                value={27}
                suffix=" 天"
                delta="紀錄新高"
                deltaPos={true}
                spark={[4, 6, 8, 10, 12, 16, 18, 20, 24, 27]}
              />
            </div>

            <FinanceCard chartMode={t.chartMode} />
            <SpendCard />

            <TodoCard />
            <CalendarCard />

            <GoalsCard />
            <MoodCard />
            <QuickAddCard />
          </div>
        ) : active === "designSystem" ? (
          <DesignSystemPage chartMode={t.chartMode} />
        ) : active === "todo" ? (
          <CalendarPage
            defaultView={t.calendarView}
            showWeekend={t.showWeekend}
            eventStyle={t.eventStyle}
          />
        ) : (
          <Placeholder name={active} />
        )}

        <TweaksPanel title="Tweaks">
          <TweakSection label="主題" />
          <TweakToggle label="深色模式" value={t.dark} onChange={(v) => setTweak("dark", v)} />
          <TweakSection label="排版" />
          <TweakSelect
            label="字體"
            value={t.font}
            options={["Inter", "Geist", "IBM Plex Sans", "Noto Sans TC", "JetBrains Mono"]}
            onChange={(v) => setTweak("font", v)}
          />
          <TweakSection label="圖表" />
          <TweakRadio
            label="收支趨勢樣式"
            value={t.chartMode}
            options={["line", "area", "bar"]}
            onChange={(v) => setTweak("chartMode", v)}
          />
          {active === "todo" && (
            <>
              <TweakSection label="行事曆" />
              <TweakRadio
                label="預設檢視"
                value={t.calendarView}
                options={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
                onChange={(v) => setTweak("calendarView", v)}
              />
              <TweakToggle
                label="顯示週末"
                value={t.showWeekend}
                onChange={(v) => setTweak("showWeekend", v)}
              />
              <TweakRadio
                label="行程牌卡風格"
                value={t.eventStyle}
                options={[
                  { value: "soft", label: "柔粉彩" },
                  { value: "bar", label: "左色條" },
                  { value: "solid", label: "飽和填色" },
                ]}
                onChange={(v) => setTweak("eventStyle", v)}
              />
            </>
          )}
        </TweaksPanel>
      </main>
    </div>
  );
}

function Placeholder({ name }) {
  const map = {
    todo: { i: "ph-check-square", t: "待辦行事曆" },
    finance: { i: "ph-wallet", t: "理財規劃" },
    goals: { i: "ph-target", t: "年度目標" },
    mood: { i: "ph-smiley", t: "每日心情" },
    stats: { i: "ph-chart-line-up", t: "統計分析" },
    journal: { i: "ph-notebook", t: "日記筆記" },
    set: { i: "ph-gear-six", t: "設定" },
  };
  const m = map[name] || { i: "ph-circle-dashed", t: name };
  return (
    <div
      className="card"
      style={{
        minHeight: 480,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: "var(--primary-soft)",
          color: "var(--primary-ink)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <i className={`ph ${m.i}`} style={{ fontSize: 28 }}></i>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{m.t}</div>
      <div style={{ color: "var(--muted)", fontSize: 13 }}>
        本頁尚未實作。請從側邊選單回到「儀表板」。
      </div>
    </div>
  );
}

export default App;
