// design-system.jsx
// Design System 預覽頁，列出所有 design tokens 與元件範例。
// 受 Tweaks 面板（dark / hue / font / chartMode）即時影響，方便預覽不同情境下的樣式。
import { useEffect, useState } from "react";
import { CountUp, PieDonut, Sparkline, ValueChart } from "./charts.jsx";

/* ---------------- 讀 CSS 變數的 computed 值 ----------------
 * 監聽 <html> 上的 data-theme 與 style 變化，theme/hue 一改就重新讀。
 */
function useComputedVar(varName) {
  const [val, setVal] = useState("");
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const v = getComputedStyle(root).getPropertyValue(varName).trim();
      setVal(v);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "style"] });
    return () => observer.disconnect();
  }, [varName]);
  return val;
}

/* ---------------- 共用區塊 ---------------- */
function Section({ title, subtitle, children }) {
  return (
    <section className="ds-section">
      <div className="ds-section-h">
        <h2>{title}</h2>
        {subtitle && <div className="ds-note">{subtitle}</div>}
      </div>
      <div className="ds-section-body">{children}</div>
    </section>
  );
}

function DSCard({ title, note, children }) {
  return (
    <div className="ds-card">
      <div className="ds-card-h">
        <h3>{title}</h3>
        {note && <div className="ds-note">{note}</div>}
      </div>
      {children}
    </div>
  );
}

/* ---------------- 顏色 ---------------- */
function Swatch({ varName, label }) {
  const computed = useComputedVar(varName);
  return (
    <div className="ds-swatch">
      <div className="ds-swatch-color" style={{ background: `var(${varName})` }}></div>
      <div className="ds-swatch-meta">
        <div className="ds-swatch-label">{label}</div>
        <code className="ds-mono">{varName}</code>
        <code className="ds-mono ds-muted">{computed || "—"}</code>
      </div>
    </div>
  );
}

function ColorGroup({ title, note, items }) {
  return (
    <DSCard title={title} note={note}>
      <div className="ds-swatch-grid">
        {items.map((it) => (
          <Swatch key={it.var} varName={it.var} label={it.label} />
        ))}
      </div>
    </DSCard>
  );
}

const SWATCHES = {
  primary: [
    { var: "--primary", label: "Primary（brand 色）" },
    { var: "--primary-soft", label: "Primary soft（淺底）" },
    { var: "--primary-ink", label: "Primary ink（深字）" },
    { var: "--primary-fg", label: "Primary foreground" },
  ],
  surface: [
    { var: "--bg", label: "Page background" },
    { var: "--surface", label: "Surface（卡片底色）" },
    { var: "--surface-2", label: "Surface 2（次層）" },
    { var: "--surface-hover", label: "Surface hover" },
  ],
  ink: [
    { var: "--ink", label: "Ink（主要文字）" },
    { var: "--ink-2", label: "Ink 2（次要）" },
    { var: "--muted", label: "Muted" },
    { var: "--muted-2", label: "Muted 2" },
    { var: "--faint", label: "Faint" },
  ],
  border: [
    { var: "--border", label: "Border" },
    { var: "--border-strong", label: "Border strong" },
    { var: "--divider", label: "Divider（內部分隔）" },
  ],
  status: [
    { var: "--pos", label: "Positive（收入 / 正向）" },
    { var: "--neg", label: "Negative（支出 / 警示）" },
    { var: "--warn", label: "Warn（提醒）" },
    { var: "--pos-bg", label: "Positive bg（14% alpha）" },
    { var: "--neg-bg", label: "Negative bg（14% alpha）" },
    { var: "--warn-bg", label: "Warn bg（14% alpha）" },
  ],
  icon: [
    { var: "--icon-primary", label: "Icon primary（= --ink）" },
    { var: "--icon-secondary", label: "Icon secondary（= --ink-2）" },
    { var: "--icon-muted", label: "Icon muted" },
    { var: "--icon-brand", label: "Icon brand（= primary-ink）" },
    { var: "--icon-on-brand", label: "Icon on brand（白色）" },
    { var: "--icon-positive", label: "Icon positive" },
    { var: "--icon-negative", label: "Icon negative" },
    { var: "--icon-on-inverse", label: "Icon on inverse" },
  ],
  inverse: [
    { var: "--bg-inverse", label: "Inverse 背景（如 tooltip）" },
    { var: "--text-on-inverse", label: "Inverse 背景上的字色" },
    { var: "--bg-chart-area", label: "Chart area（brand 半透明）" },
  ],
};

/* ---------------- 字體 ---------------- */
function TypographySpec() {
  // 從 styles.css 整理出來的實際使用字級
  const specs = [
    { l: "Hero h1", c: 28, w: 600, s: "-0.025em" },
    { l: "Card num", c: 28, w: 600, s: "-0.025em" },
    { l: "KPI num", c: 24, w: 600, s: "-0.02em" },
    { l: "Section h2", c: 18, w: 600, s: "-0.01em" },
    { l: "Body / Default", c: 14, w: 400 },
    { l: "Sidebar nav", c: 14, w: 450 },
    { l: "Card title", c: 13, w: 550 },
    { l: "Meta", c: 11.5, w: 500 },
    { l: "Tag / Kbd", c: 10.5, w: 500 },
    { l: "Section eyebrow", c: 10, w: 600, s: "0.08em", upper: true },
  ];
  return (
    <DSCard title="字級表">
      <div className="ds-type-list">
        {specs.map((s, i) => (
          <div key={i} className="ds-type-row">
            <div
              style={{
                fontSize: s.c,
                fontWeight: s.w,
                letterSpacing: s.s,
                textTransform: s.upper ? "uppercase" : "none",
                lineHeight: 1.2,
                color: "var(--ink)",
              }}
            >
              {s.l}
            </div>
            <code className="ds-mono ds-muted">
              {s.c}px / {s.w}
              {s.s ? ` / ${s.s}` : ""}
            </code>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

function FontFamilies() {
  const families = [
    { v: "--ff-sans", l: "Sans（受 Tweaks 面板字體切換）" },
    { v: "--ff-mono", l: "Mono（數字、kbd、code）" },
    { v: "--ff-display", l: "Display（目前 = sans）" },
  ];
  return (
    <DSCard title="字體家族">
      <div className="ds-type-list">
        {families.map((f) => (
          <div key={f.v} className="ds-type-row">
            <div style={{ fontFamily: `var(${f.v})`, fontSize: 18 }}>
              鎮瑜 Yuu · Personal Dashboard 0123
            </div>
            <code className="ds-mono ds-muted">
              {f.v} · {f.l}
            </code>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

/* ---------------- 圓角 / 陰影 ---------------- */
function RadiusGroup() {
  const items = [
    { v: "--r-sm", l: "Small（4px）· Tag / chip" },
    { v: "--r-md", l: "Medium（5px）· Checkbox" },
    { v: "--r-chip", l: "Chip（6px）" },
    { v: "--r-card", l: "Card / Button（8px）" },
    { v: "--r-pill", l: "Pill（999px）" },
  ];
  return (
    <DSCard title="圓角">
      <div className="ds-grid-cells">
        {items.map((r) => (
          <div key={r.v} className="ds-cell">
            <div
              className="ds-radius-box"
              style={{
                borderRadius: `var(${r.v})`,
                background: "var(--primary-soft)",
                border: "1px solid var(--border)",
              }}
            ></div>
            <code className="ds-mono">{r.v}</code>
            <div className="ds-note">{r.l}</div>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

function IconSizeGroup() {
  // Phosphor icon 配各尺寸 token，可視覺對照
  const sizes = [
    { v: "--icon-size-xs", l: "xs · 12px" },
    { v: "--icon-size-sm", l: "sm · 14px" },
    { v: "--icon-size-md", l: "md · 16px（預設）" },
    { v: "--icon-size-lg", l: "lg · 17px" },
    { v: "--icon-size-xl", l: "xl · 18px" },
    { v: "--icon-size-2xl", l: "2xl · 20px" },
    { v: "--icon-size-3xl", l: "3xl · 24px" },
  ];
  return (
    <DSCard title="Icon Size" note="對應 Phosphor icon 的 width / height">
      <div className="ds-grid-cells">
        {sizes.map((s) => (
          <div key={s.v} className="ds-cell">
            <i
              className="ph ph-circles-three-plus"
              style={{
                fontSize: `var(${s.v})`,
                color: "var(--primary)",
                lineHeight: 1,
              }}
            ></i>
            <code className="ds-mono">{s.v}</code>
            <div className="ds-note">{s.l}</div>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

function ShadowGroup() {
  const items = [
    { v: "--shadow-card", l: "Card 預設（極淺）" },
    { v: "--shadow-hover", l: "Card hover（浮起）" },
  ];
  return (
    <DSCard title="陰影">
      <div className="ds-grid-cells">
        {items.map((s) => (
          <div key={s.v} className="ds-cell">
            <div
              className="ds-shadow-box"
              style={{
                boxShadow: `var(${s.v})`,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-card)",
              }}
            ></div>
            <code className="ds-mono">{s.v}</code>
            <div className="ds-note">{s.l}</div>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

/* ---------------- 元件範例 ---------------- */
function ButtonsDemo() {
  return (
    <DSCard
      title="按鈕 Button"
      note="Primary / Secondary × Default(44h) / Small(32h) · Hover / Active / Focus 為 CSS pseudo-state（試 hover 或 Tab 進來看）"
    >
      {/* Default size · Primary + Secondary */}
      <div className="ds-btn-row">
        <span className="ds-mono ds-muted ds-btn-label">Default · Primary</span>
        <button className="btn-primary" type="button">
          <i className="ph ph-plus"></i>Primary
        </button>
        <button className="btn-primary" type="button" disabled>
          <i className="ph ph-plus"></i>已停用
        </button>
      </div>
      <div className="ds-btn-row">
        <span className="ds-mono ds-muted ds-btn-label">Default · Secondary</span>
        <button className="btn-secondary" type="button">
          <i className="ph ph-plus"></i>Secondary
        </button>
        <button className="btn-secondary" type="button" disabled>
          <i className="ph ph-plus"></i>已停用
        </button>
      </div>
      {/* Small size · Primary + Secondary */}
      <div className="ds-btn-row">
        <span className="ds-mono ds-muted ds-btn-label">Small · Primary</span>
        <button className="btn-primary btn-sm" type="button">
          <i className="ph ph-plus"></i>Primary
        </button>
        <button className="btn-primary btn-sm" type="button" disabled>
          <i className="ph ph-plus"></i>已停用
        </button>
      </div>
      <div className="ds-btn-row">
        <span className="ds-mono ds-muted ds-btn-label">Small · Secondary</span>
        <button className="btn-secondary btn-sm" type="button">
          <i className="ph ph-plus"></i>Secondary
        </button>
        <button className="btn-secondary btn-sm" type="button" disabled>
          <i className="ph ph-plus"></i>已停用
        </button>
      </div>
      {/* Auxiliary buttons */}
      <div className="ds-btn-row">
        <span className="ds-mono ds-muted ds-btn-label">Auxiliary</span>
        <button className="card-act" type="button">
          <i className="ph ph-arrow-up-right"></i>Card action
        </button>
        <button className="icon-btn" type="button" aria-label="bell">
          <i className="ph ph-bell"></i>
        </button>
        <button className="icon-btn" type="button" aria-label="notification">
          <i className="ph ph-bell"></i>
          <span className="dot"></span>
        </button>
      </div>
      <div className="ds-note">
        <code className="ds-mono">.btn-primary</code> /{" "}
        <code className="ds-mono">.btn-secondary</code> 主要動作；加{" "}
        <code className="ds-mono">.btn-sm</code> 切到 small size ·{" "}
        <code className="ds-mono">.card-act</code> 卡片右上 quiet ·{" "}
        <code className="ds-mono">.icon-btn</code> Topbar 圓角容器（可加 .dot 通知點）
      </div>
    </DSCard>
  );
}

function CheckboxesDemo() {
  return (
    <DSCard
      title="Checkbox"
      note="18×18 / radius/md 5px / border 1.5px — 同時用於 .todo 內的 checkbox 與獨立場景"
    >
      <div className="ds-checkbox-grid">
        <div className="ds-checkbox-cell">
          <span className="checkbox" style={{ cursor: "default" }}>
            <i className="ph-bold ph-check"></i>
          </span>
          <code className="ds-mono">.checkbox</code>
          <div className="ds-note">Unchecked</div>
        </div>
        <div className="ds-checkbox-cell">
          <span className="checkbox checked" style={{ cursor: "default" }}>
            <i className="ph-bold ph-check"></i>
          </span>
          <code className="ds-mono">.checkbox.checked</code>
          <div className="ds-note">Checked</div>
        </div>
        <div className="ds-checkbox-cell">
          <span className="checkbox disabled" style={{ cursor: "default" }}>
            <i className="ph-bold ph-check"></i>
          </span>
          <code className="ds-mono">.checkbox.disabled</code>
          <div className="ds-note">Disabled</div>
        </div>
      </div>
    </DSCard>
  );
}

function BadgesDemo() {
  return (
    <DSCard title="Badge / Delta / Kbd">
      <div className="ds-row-wrap">
        <span className="badge">8</span>
        <span className="badge subtle">NEW</span>
        <span className="delta pos">
          <i className="ph ph-arrow-up-right"></i>+12%
        </span>
        <span className="delta neg">
          <i className="ph ph-arrow-down-right"></i>−4.2%
        </span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="ds-note">
        <code className="ds-mono">.badge</code> = Primary（藍底白字計數）·{" "}
        <code className="ds-mono">.badge.subtle</code> = Subtle（淺底灰字標示）·{" "}
        <code className="ds-mono">.delta.pos / .neg</code> = 漲跌徽章（pill, color-mix 衍生）·{" "}
        <code className="ds-mono">.kbd</code> = 鍵盤快捷鍵 mono 字。Tag 在下方 Tag Mapping 區。
      </div>
    </DSCard>
  );
}

function CardDemo() {
  return (
    <DSCard title="卡片">
      <div className="ds-card-demo-grid">
        {/* 一般 card */}
        <div className="card">
          <div className="card-h">
            <div className="card-title">
              <i className="ph ph-info"></i>標準卡片
            </div>
            <button className="card-act" type="button">
              <i className="ph ph-dots-three"></i>
            </button>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            最常用的容器。hover 會微微浮起並加深邊線、加深陰影。
          </div>
        </div>
        {/* KPI 卡片 */}
        <div className="card kpi">
          <div className="row">
            <div className="kpi-icon">
              <i className="ph ph-target"></i>
            </div>
            <span className="delta pos">
              <i className="ph ph-arrow-up-right"></i>+8%
            </span>
          </div>
          <div>
            <div className="kpi-lbl">KPI 範例</div>
            <div className="num">
              <CountUp to={42} suffix="%" />
            </div>
          </div>
          <Sparkline values={[3, 4, 5, 4, 6, 7, 8, 7, 9, 10]} />
        </div>
      </div>
      <div className="ds-note">
        <code className="ds-mono">.card</code> 是基底；加 <code className="ds-mono">.kpi</code> 進入
        KPI 變體（含 .row / .kpi-icon / .kpi-lbl / .num / Sparkline）
      </div>
    </DSCard>
  );
}

function InputsDemo() {
  return (
    <DSCard title="輸入欄位">
      <div className="search" style={{ maxWidth: "100%" }}>
        <i className="ph ph-magnifying-glass"></i>
        <input placeholder="搜尋待辦、紀錄、目標…" />
        <span className="kbd">⌘K</span>
      </div>
      <form
        className="todo-add"
        style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}
        onSubmit={(e) => e.preventDefault()}
      >
        <i className="ph ph-plus-circle" style={{ color: "var(--muted)" }}></i>
        <input placeholder="新增待辦事項…" />
        <button className="submit" type="submit">
          <i className="ph ph-arrow-right"></i>
        </button>
      </form>
      <div className="ds-note">
        <code className="ds-mono">.search</code> Topbar 搜尋（focus 時邊線變主色）·{" "}
        <code className="ds-mono">.todo-add</code> Todo 卡片底部新增列。
      </div>
    </DSCard>
  );
}

function TabsDemo() {
  const [tab, setTab] = useState("month");
  return (
    <DSCard title="Tabs（segmented）">
      <div className="tab-row">
        {["week", "month", "year"].map((tk) => (
          <button
            key={tk}
            type="button"
            className={tab === tk ? "on" : ""}
            onClick={() => setTab(tk)}
          >
            {tk}
          </button>
        ))}
      </div>
      <div className="ds-note">
        <code className="ds-mono">.tab-row</code> + <code className="ds-mono">button.on</code> —
        範例同 Finance 卡片的「週/月/年」切換。
      </div>
    </DSCard>
  );
}

function ProgressDemo() {
  const [pct, setPct] = useState(42);
  return (
    <DSCard title="進度條 / Sparkline / CountUp">
      <div className="bar">
        <span
          style={{
            transform: `scaleX(${pct / 100})`,
            transition: "transform .9s cubic-bezier(.4,.05,.2,1)",
          }}
        ></span>
      </div>
      <div className="ds-row-wrap" style={{ alignItems: "center" }}>
        <button
          className="card-act"
          type="button"
          onClick={() => setPct(Math.round(Math.random() * 100))}
        >
          <i className="ph ph-arrows-clockwise"></i>重新動畫
        </button>
        <span className="ds-mono ds-muted">{pct}%</span>
      </div>
      <div style={{ width: "100%", maxWidth: 240 }}>
        <Sparkline values={[3, 4, 5, 4, 6, 7, 8, 7, 9, 10, 9, 11, 12]} />
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <CountUp to={43200} prefix="NT$ " />
      </div>
      <div className="ds-note">
        <code className="ds-mono">.bar &gt; span</code> 用 transform: scaleX 做進度動畫；
        <code className="ds-mono">CountUp</code> 對 to 變化做 cubic ease-out 補間。
      </div>
    </DSCard>
  );
}

function ChartsDemo({ chartMode }) {
  const data = [
    { label: "1", value: 32400 },
    { label: "5", value: 35100 },
    { label: "10", value: 33800 },
    { label: "15", value: 38200 },
    { label: "20", value: 41600 },
    { label: "25", value: 39400 },
    { label: "30", value: 43200 },
  ];
  const cat = [
    { value: 8400, color: "var(--primary)" },
    { value: 3200, color: "color-mix(in oklch, var(--primary) 60%, var(--surface))" },
    { value: 5600, color: "color-mix(in oklch, var(--primary) 35%, var(--surface))" },
    { value: 4800, color: "color-mix(in oklch, var(--ink) 70%, var(--surface))" },
    { value: 3000, color: "var(--faint)" },
  ];
  return (
    <DSCard title="圖表" note={`ValueChart 跟 Tweaks 面板的 chartMode 連動（目前：${chartMode}）`}>
      <ValueChart
        data={data}
        mode={chartMode}
        formatValue={(v) => `NT$ ${v.toLocaleString()}`}
        yLabels={true}
        height={170}
      />
      <div className="donut-wrap" style={{ marginTop: 8 }}>
        <PieDonut data={cat} totalLabel="本月支出" />
        <div className="ds-note" style={{ flex: 1 }}>
          PieDonut 各 segment 用 color-mix 從 --primary 衍生濃淡，最後一段用 --faint。
          切換深色模式時所有顏色會自動跟著重新解析。
        </div>
      </div>
    </DSCard>
  );
}

function HeatmapDemo() {
  // 對齊 styles.css 的 .hm-cell.l0 ~ .l4
  return (
    <DSCard
      title="Mood Heatmap 5 階"
      note="從 --primary 與 --divider 用 color-mix(in oklch) 漸進混合（CSS 端維持公式；Figma 端要 freeze 為 hex）"
    >
      <div className="ds-row-wrap" style={{ gap: 8 }}>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div
              className={`hm-cell l${lvl}`}
              style={{ width: 56, height: 56, borderRadius: 4, animation: "none" }}
            ></div>
            <code className="ds-mono">l{lvl}</code>
          </div>
        ))}
      </div>
      <div className="ds-note">
        <code className="ds-mono">l0 = divider</code> ·{" "}
        <code className="ds-mono">l4 = primary</code> · l1/l2/l3 = primary 與 divider 混合 20% / 40%
        / 65%。
      </div>
    </DSCard>
  );
}

function TagMappingDemo() {
  const map = [
    { id: "work", label: "工作", token: "primary 系 · chart-area 底（8% alpha）" },
    { id: "life", label: "生活", token: "positive 系" },
    { id: "health", label: "健康", token: "warning 系" },
    { id: "finance", label: "理財", token: "neutral 系（surface-2 底）" },
    { id: "study", label: "學習", token: "violet 系 · chart-area-violet 底（8% alpha）" },
    { id: "travel", label: "旅遊", token: "warning 系（同 health）" },
    { id: "default", label: "未分類", token: "neutral 系（surface-hover + divider 邊）" },
  ];
  return (
    <DSCard
      title="Tag Mapping（7 類）"
      note="新增 tag 類別必須對應到既有 status / brand 色組，不為單一 tag 引入新色"
    >
      <div className="ds-tag-grid">
        {map.map((t) => (
          <div key={t.id} className="ds-tag-row">
            <span className={`tag ${t.id}`}>{t.label}</span>
            <code className="ds-mono">.tag.{t.id}</code>
            <code className="ds-mono ds-muted">→ {t.token}</code>
          </div>
        ))}
      </div>
    </DSCard>
  );
}

function StateDemo() {
  return (
    <DSCard
      title="Interaction / State Tokens"
      note="Focus ring、disabled、overlay、selection、scrollbar 的標準樣式"
    >
      {/* Focus ring 範例 */}
      <div>
        <div className="ds-note" style={{ marginBottom: 6 }}>
          <code className="ds-mono">:focus-visible</code> · 鍵盤 Tab 進來會自動套用；下方為視覺 mock
        </div>
        <button
          className="btn-primary"
          type="button"
          style={{
            boxShadow: "0 0 0 3px rgba(14, 79, 231, 0.4)",
          }}
        >
          Focused button（visual mock）
        </button>
      </div>

      {/* Disabled 範例 */}
      <div>
        <div className="ds-note" style={{ marginBottom: 6 }}>
          <code className="ds-mono">--state-disabled-bg / -border / -text</code> · 由{" "}
          <code className="ds-mono">.btn-primary:disabled</code> 自動帶入
        </div>
        <div className="ds-row-wrap">
          <button className="btn-primary" type="button" disabled>
            Disabled button
          </button>
          <button className="btn-secondary" type="button" disabled>
            Disabled secondary
          </button>
          <input
            type="text"
            disabled
            placeholder="Disabled input"
            style={{
              background: "var(--state-disabled-bg)",
              color: "var(--state-disabled-text)",
              border: "1px solid var(--state-disabled-border)",
              padding: "8px 12px",
              borderRadius: "var(--r-card)",
              fontSize: 14,
              cursor: "not-allowed",
            }}
          />
        </div>
      </div>

      {/* Overlay scrim 範例 */}
      <div>
        <div className="ds-note" style={{ marginBottom: 6 }}>
          <code className="ds-mono">color/overlay/scrim</code> · Mobile sidebar 用
        </div>
        <div
          style={{
            position: "relative",
            height: 80,
            borderRadius: "var(--r-card)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10, 13, 18, 0.4)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            scrim · rgba(10, 13, 18, 0.4)
          </div>
        </div>
      </div>

      {/* Selection 範例 */}
      <div>
        <div className="ds-note" style={{ marginBottom: 6 }}>
          <code className="ds-mono">color/text/selection-bg</code> · 試著選取下方文字
        </div>
        <div
          style={{
            padding: 12,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-card)",
            fontSize: 14,
            color: "var(--ink)",
          }}
        >
          <span style={{ background: "var(--primary-soft)", color: "var(--primary-ink)" }}>
            這段文字模擬選取狀態
          </span>
          <span style={{ color: "var(--muted)" }}>，背景使用 --primary-soft。</span>
        </div>
      </div>

      {/* Scrollbar 範例 */}
      <div>
        <div className="ds-note" style={{ marginBottom: 6 }}>
          <code className="ds-mono">color/scrollbar/*</code> · 自訂 thumb / track（需溢出觸發）
        </div>
        <div
          style={{
            height: 80,
            padding: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-card)",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.15) transparent",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--ink-2)",
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i}>第 {i + 1} 行內容，用來觸發 scrollbar 顯示。</div>
          ))}
        </div>
      </div>
    </DSCard>
  );
}

function SidebarPreview() {
  const items = [
    { i: "ph-squares-four", l: "儀表板", on: false },
    { i: "ph-check-square", l: "待辦行事曆", on: true, badge: "8" },
    { i: "ph-wallet", l: "理財規劃", on: false },
    { i: "ph-target", l: "年度目標", on: false },
  ];
  return (
    <DSCard title="Sidebar nav 樣式">
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-card)",
          padding: 12,
          maxWidth: 260,
        }}
      >
        {items.map((it, i) => (
          <div
            key={i}
            className={`nav-item ${it.on ? "active" : ""}`}
            style={{ cursor: "default" }}
          >
            <i className={`ph ${it.i}`}></i>
            <span className="lbl">{it.l}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </div>
        ))}
      </div>
      <div className="ds-note">
        <code className="ds-mono">.nav-item.active</code> 用{" "}
        <code className="ds-mono">--primary-soft</code> 當底、{" "}
        <code className="ds-mono">--primary-ink</code> 當字。
      </div>
    </DSCard>
  );
}

/* ---------------- 主元件 ---------------- */
function DesignSystemPage({ chartMode = "area" }) {
  return (
    <div className="ds-page">
      <style>{DS_STYLE}</style>

      <header className="ds-header">
        <div className="nav-section" style={{ padding: 0 }}>
          Design System
        </div>
        <h1>Dayboard 設計系統</h1>
        <p>
          所有目前介面用到的 design tokens 與元件範例。 Tweaks
          面板的主題、hue、字體、圖表模式設定會即時套用到本頁， 切換時可以同步預覽 token
          在不同情境下的樣子。
        </p>
      </header>

      <Section
        title="色彩 Colors"
        subtitle="Primary 為固定 brand hex；深色模式的 soft / ink 用 color-mix 從 --primary 衍生"
      >
        <ColorGroup title="Primary" items={SWATCHES.primary} />
        <ColorGroup title="Surface / Background" items={SWATCHES.surface} />
        <ColorGroup title="Ink / Text" items={SWATCHES.ink} />
        <ColorGroup title="Border / Divider" items={SWATCHES.border} />
        <ColorGroup title="Status" items={SWATCHES.status} />
        <ColorGroup
          title="Icon"
          items={SWATCHES.icon}
          note="多數 alias 到對應文字色，跟 light/dark 自動切換"
        />
        <ColorGroup
          title="Inverse / Chart"
          items={SWATCHES.inverse}
          note="反相群組與圖表面積底色"
        />
      </Section>

      <Section title="字體 Typography">
        <TypographySpec />
        <FontFamilies />
      </Section>

      <Section title="圓角 Radius">
        <RadiusGroup />
      </Section>

      <Section title="Icon Size">
        <IconSizeGroup />
      </Section>

      <Section title="陰影 Shadow">
        <ShadowGroup />
      </Section>

      <Section title="按鈕 Buttons">
        <ButtonsDemo />
      </Section>

      <Section title="勾選 Checkbox">
        <CheckboxesDemo />
      </Section>

      <Section title="標籤 Badge / Delta / Kbd">
        <BadgesDemo />
      </Section>

      <Section title="卡片 Card">
        <CardDemo />
      </Section>

      <Section title="輸入 Input">
        <InputsDemo />
      </Section>

      <Section title="Tabs">
        <TabsDemo />
      </Section>

      <Section title="進度 / Sparkline / CountUp">
        <ProgressDemo />
      </Section>

      <Section title="圖表 Chart / Donut">
        <ChartsDemo chartMode={chartMode} />
      </Section>

      <Section title="Mood Heatmap 5 階">
        <HeatmapDemo />
      </Section>

      <Section title="Tag Mapping">
        <TagMappingDemo />
      </Section>

      <Section title="Interaction / State">
        <StateDemo />
      </Section>

      <Section title="Sidebar nav">
        <SidebarPreview />
      </Section>
    </div>
  );
}

/* ---------------- Page-scoped styles ----------------
 * 設計系統頁面專屬，不汙染 styles.css。所有 ds-* class 只在這個頁面用。
 */
const DS_STYLE = `
.ds-page { display: flex; flex-direction: column; gap: 28px; padding-bottom: 60px; }
.ds-header h1 {
  margin: 4px 0 6px; font-size: 24px; font-weight: 600; letter-spacing: -0.02em;
}
.ds-header p {
  margin: 0; color: var(--muted); font-size: 13.5px; max-width: 640px;
}
.ds-section { display: flex; flex-direction: column; gap: 12px; }
.ds-section-h { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ds-section-h h2 {
  margin: 0; font-size: 18px; font-weight: 600;
  letter-spacing: -0.01em; color: var(--ink);
}
.ds-section-body { display: flex; flex-direction: column; gap: 12px; }
.ds-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.ds-card-h { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ds-card-h h3 {
  margin: 0; font-size: 13.5px; font-weight: 600; color: var(--ink-2);
}
.ds-note { color: var(--muted); font-size: 12px; line-height: 1.5; }
.ds-mono {
  font-family: var(--ff-mono); font-size: 11.5px; color: var(--ink-2);
}
.ds-muted { color: var(--muted); }
.ds-row-wrap { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

.ds-swatch-grid {
  display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}
.ds-swatch {
  display: flex; flex-direction: column; gap: 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  background: var(--surface-2);
}
.ds-swatch-color {
  width: 100%; height: 56px; border-radius: 4px;
  border: 1px solid var(--border);
}
.ds-swatch-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ds-swatch-label {
  font-size: 12px; font-weight: 600; color: var(--ink-2);
}
.ds-swatch-meta code { word-break: break-all; }

.ds-type-list { display: flex; flex-direction: column; gap: 14px; }
.ds-type-row {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 16px; flex-wrap: wrap;
}

.ds-grid-cells {
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.ds-cell {
  display: flex; flex-direction: column; gap: 6px; align-items: flex-start;
}
.ds-radius-box, .ds-shadow-box { width: 100%; height: 64px; }

.ds-card-demo-grid {
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.ds-tag-grid {
  display: flex; flex-direction: column; gap: 8px;
}
.ds-tag-row {
  display: grid;
  grid-template-columns: 80px 120px 1fr;
  align-items: center; gap: 12px;
}

.ds-btn-row {
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
}
.ds-btn-label {
  width: 140px; flex-shrink: 0;
}

.ds-checkbox-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.ds-checkbox-cell {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  background: var(--surface-2);
}
`;

export { DesignSystemPage };
