// charts.jsx — 小型圖表元件，含 hover tooltip 與 draw-in 動畫
// 對外輸出：CountUp、ValueChart、Donut、PieDonut、CategoryBars、Sparkline
import { useState, useEffect, useRef, useId } from "react";

/* ---------------- CountUp ---------------- */
function CountUp({ to, duration = 900, decimals = 0, prefix = "", suffix = "", className }) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  const fmt = (n) => {
    const f = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
    return f.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  return (
    <span className={className}>
      {prefix}
      {fmt(v)}
      {suffix}
    </span>
  );
}

/* ---------------- Tooltip hook ---------------- */
function useTooltip() {
  const [tip, setTip] = useState(null); // {x, y, label, value}
  const wrapRef = useRef(null);
  return {
    tip,
    setTip,
    wrapRef,
    Tooltip: () =>
      tip ? (
        <div className="tooltip on" style={{ left: tip.x, top: tip.y }}>
          <div className="lbl">{tip.label}</div>
          <div>{tip.value}</div>
        </div>
      ) : null,
  };
}

/* ---------------- Build smooth path (Catmull-Rom-ish) ---------------- */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/* ---------------- LineChart / AreaChart / BarChart ----------------
   props: data: [{label, value}], height, mode: 'line'|'area'|'bar', formatValue
*/
function ValueChart({
  data,
  height = 180,
  mode = "area",
  formatValue = (v) => v,
  yLabels = false,
  fill = false, // true：以容器實際高度繪圖（viewBox 高度=像素高度，避免 svg 被垂直拉伸變形）
}) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(600);
  const [measuredH, setMeasuredH] = useState(height);
  const [tip, setTip] = useState(null);
  // 每個 ValueChart 用唯一 gradient id，避免多個實例共用造成衝突
  const gradId = `area-grad-${useId().replace(/:/g, "")}`;
  const [drawn, setDrawn] = useState(false);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setW(e.contentRect.width);
      if (fill) setMeasuredH(e.contentRect.height); // fill 模式才追蹤高度
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fill]);

  // 實際繪圖高度：fill 用量測值（隨格高伸縮且不變形），否則用固定 height prop
  const H = fill ? measuredH : height;

  // re-trigger draw when mode changes
  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 30);
    return () => clearTimeout(t);
  }, [mode, data]);

  const padL = yLabels ? 32 : 4;
  const padR = 4;
  const padT = 14;
  const padB = 22;
  const innerW = Math.max(40, w - padL - padR);
  const innerH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  // Y 軸從 actual data 最小值起算（對齊 Figma），而非從 0 開始
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  // 大數字縮寫成 k：43200 → "43k"
  const fmtY = (v) =>
    Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v).toLocaleString();

  const pts = data.map((d, i) => {
    const x = padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padT + innerH - ((d.value - min) / range) * innerH;
    return [x, y];
  });

  const linePath = smoothPath(pts);
  const areaPath = pts.length
    ? `${linePath} L${pts[pts.length - 1][0]},${padT + innerH} L${pts[0][0]},${padT + innerH} Z`
    : "";

  // grid lines
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + innerH * t);

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0,
      dist = Infinity;
    pts.forEach((p, i) => {
      const dx = Math.abs(p[0] * (rect.width / w) - x);
      if (dx < dist) {
        dist = dx;
        nearest = i;
      }
    });
    const p = pts[nearest];
    setTip({
      x: p[0] * (rect.width / w),
      y: p[1] * (rect.height / H),
      label: data[nearest].label,
      value: formatValue(data[nearest].value),
      idx: nearest,
    });
  };

  const lineLen = pts.length
    ? pts.reduce(
        (acc, p, i) => (i ? acc + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0),
        0,
      )
    : 0;

  return (
    <div
      className="chart-wrap"
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => setTip(null)}
    >
      <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="none">
        <defs>
          {/* 垂直線性漸層：頂端 primary 30% alpha → 底端 0%（對齊 Figma Area Chart） */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          {gridY.map((y, i) => (
            <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} />
          ))}
        </g>
        {yLabels && (
          <g className="chart-axis">
            {[0, 0.5, 1].map((t, i) => {
              const v = max - range * t;
              return (
                <text key={i} x={padL - 6} y={padT + innerH * t + 3} textAnchor="end">
                  {fmtY(v)}
                </text>
              );
            })}
          </g>
        )}
        <g className="chart-axis">
          {data.map((d, i) => {
            if (data.length > 12 && i % Math.ceil(data.length / 8) !== 0) return null;
            const x = padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
            return (
              <text key={i} x={x} y={H - 6} textAnchor="middle">
                {d.label}
              </text>
            );
          })}
        </g>

        {(mode === "area" || mode === "line") && (
          <>
            {mode === "area" && drawn && (
              <path
                className="line-fill"
                d={areaPath}
                fill={`url(#${gradId})`}
                style={{ animation: "card-in .5s ease" }}
              />
            )}
            <path
              ref={lineRef}
              className="line-path"
              d={linePath}
              style={
                drawn
                  ? {
                      strokeDasharray: lineLen,
                      strokeDashoffset: 0,
                      transition: "stroke-dashoffset 1.1s cubic-bezier(.4,.05,.2,1)",
                    }
                  : {
                      strokeDasharray: lineLen,
                      strokeDashoffset: lineLen,
                    }
              }
            />
            {tip && pts[tip.idx] && (
              <>
                <line
                  x1={pts[tip.idx][0]}
                  x2={pts[tip.idx][0]}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="var(--border-strong)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <circle cx={pts[tip.idx][0]} cy={pts[tip.idx][1]} r="4" className="dot" />
              </>
            )}
          </>
        )}

        {mode === "bar" &&
          data.map((d, i) => {
            const barW = (innerW / data.length) * 0.55;
            const x = padL + (i / data.length) * innerW + (innerW / data.length - barW) / 2;
            const h = ((d.value - min) / range) * innerH;
            const y = padT + innerH - h;
            return (
              <rect
                key={i}
                className={`bar-rect ${i % 3 === 1 ? "alt" : ""}`}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="2"
                style={{
                  transformOrigin: `center ${padT + innerH}px`,
                  animation: `bar-grow .55s cubic-bezier(.2,.8,.2,1) ${i * 28}ms backwards`,
                }}
              />
            );
          })}
      </svg>
      {tip && (
        <div className="tooltip on" style={{ left: tip.x, top: tip.y }}>
          <div className="lbl">{tip.label}</div>
          <div>{tip.value}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Donut ---------------- */
function Donut({ value = 0, size = 130, stroke = 14, label = "完成率" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--divider)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{
            strokeDashoffset: off,
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,.05,.2,1)",
            animation: `donut-sweep 1.1s cubic-bezier(.4,.05,.2,1)`,
            "--circ": c,
            "--off": off,
          }}
        />
      </svg>
      <div className="donut-center">
        <div className="v">
          <CountUp to={value} suffix="%" />
        </div>
        <div className="l">{label}</div>
      </div>
    </div>
  );
}

/* ---------------- Pie (segmented donut for category breakdown) ---------------- */
function PieDonut({ data, size = 130, stroke = 18, totalLabel = "支出", formatValue }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  // 金額格式化：未傳就用千分位 + $ 前綴
  const fmt = formatValue || ((v) => `$ ${Math.round(v).toLocaleString("en-US")}`);
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null); // hover 中的區段：{ i, x, y }，座標相對 .donut 容器
  // 滑鼠在區段上移動 → 換算成相對容器的座標，讓 tooltip 跟著游標
  const onMove = (i) => (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    setHover({ i, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  let acc = 0;
  return (
    <div className="donut" ref={wrapRef} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--divider)"
          strokeWidth={stroke}
          style={{ pointerEvents: "none" }}
        />
        {data.map((d, i) => {
          const portion = d.value / total;
          const segLen = c * portion;
          const dash = `${segLen} ${c - segLen}`;
          const offset = c - c * (acc / total) + 0.5;
          acc += d.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              onMouseMove={onMove(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                transition:
                  "stroke-dasharray 1s cubic-bezier(.4,.05,.2,1), stroke-dashoffset 1s cubic-bezier(.4,.05,.2,1)",
                transformOrigin: "center",
                animation: `donut-sweep 1s cubic-bezier(.4,.05,.2,1) ${i * 80}ms backwards`,
                cursor: "pointer",
              }}
            />
          );
        })}
      </svg>
      <div className="donut-center">
        <div className="l">{totalLabel}</div>
        <div className="v">
          <CountUp to={total} prefix="$ " />
        </div>
      </div>
      {hover && data[hover.i] && (
        <div className="tooltip on" style={{ left: hover.x, top: hover.y }}>
          {data[hover.i].label && <div className="lbl">{data[hover.i].label}</div>}
          <div>
            {Math.round((data[hover.i].value / total) * 100)}%{" · "}
            {fmt(data[hover.i].value)}
          </div>
        </div>
      )}
    </div>
  );
}

/* y 軸「以 200 為單位」的整齊刻度：頂端對齊 200 的倍數，step 以 200 為基底，
   資料很大時才放大（400→1000…）避免格線爆量。回傳 { top, ticks }（由 0 遞增到 top）。 */
function niceScale200(max) {
  const mults = [1, 2, 5, 10, 20, 50]; // step = m × 200 的候選
  let step = 200;
  for (const m of mults) {
    step = m * 200;
    if (Math.ceil(max / step) <= 12) break;
  }
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = [];
  for (let v = 0; v <= top + 1e-6; v += step) ticks.push(v);
  return { top, ticks };
}

/* ---------------- CategoryBars（收支分類金額長條圖）----------------
   props: data: [{ label, name, value, color }], height, formatValue
   特性：y 軸從 0 起算、刻度以 100 為單位對齊（不同於趨勢用 ValueChart 從最小值起算）、
        x 軸為分類名稱、每根長條綁分類色、hover 顯示「分類名稱 + 金額」。
*/
function CategoryBars({ data, height = 300, formatValue = (v) => v }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(400);
  const [hover, setHover] = useState(null); // { i, x, y }（座標相對容器）
  const [drawn, setDrawn] = useState(false); // 控制長條由下往上生長動畫

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // 換月份 / 切換收入支出時，重播生長動畫
  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 30);
    return () => clearTimeout(t);
  }, [data]);

  const H = height;
  const padL = 40; // 左側留給 y 軸金額刻度
  const padR = 8;
  const padT = 14;
  const padB = 30; // 底部留給 x 軸 emoji
  const innerW = Math.max(40, w - padL - padR);
  const innerH = H - padT - padB;
  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const { top, ticks } = niceScale200(rawMax); // 長條圖從 0 起算、頂端對齊 200 的倍數
  // 金額刻度文字：≥1000 縮寫成 k（整數不帶小數，如 2k；非整如 1.5k），否則千分位整數
  const fmtY = (v) => {
    if (v >= 1000) {
      const k = v / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return Math.round(v).toLocaleString();
  };

  return (
    <div className="chart-wrap cat-bars" ref={wrapRef} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="none">
        <g className="chart-grid">
          {ticks.map((v, i) => {
            const y = padT + innerH * (1 - v / top);
            return <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} />;
          })}
        </g>
        {/* y 軸金額刻度（每個 100 倍數刻度一個標籤） */}
        <g className="chart-axis">
          {ticks.map((v, i) => (
            <text key={i} x={padL - 6} y={padT + innerH * (1 - v / top) + 3} textAnchor="end">
              {fmtY(v)}
            </text>
          ))}
        </g>
        {/* x 軸分類名稱 */}
        <g className="chart-axis cat-x">
          {data.map((d, i) => {
            const band = innerW / data.length;
            const x = padL + band * i + band / 2;
            return (
              <text key={i} x={x} y={H - 8} textAnchor="middle">
                {d.name}
              </text>
            );
          })}
        </g>
        {/* 長條：未 drawn 時高度 0 貼底，drawn 後過渡到實際高度（由下往上長） */}
        {data.map((d, i) => {
          const band = innerW / data.length;
          const barW = Math.min(band * 0.4, 26);
          const x = padL + band * i + (band - barW) / 2;
          const fullH = (d.value / top) * innerH;
          const h = drawn ? fullH : 0;
          const y = padT + innerH - h;
          const ease = `cubic-bezier(.2,.8,.2,1) ${i * 40}ms`;
          return (
            <rect
              key={i}
              className="cat-bar"
              x={x}
              y={y}
              width={barW}
              height={h}
              fill={d.color}
              onMouseMove={(e) => {
                const rect = wrapRef.current.getBoundingClientRect();
                setHover({ i, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHover(null)}
              style={{
                transition: `height .5s ${ease}, y .5s ${ease}, opacity .15s`,
                cursor: "pointer",
              }}
            />
          );
        })}
      </svg>
      {hover && data[hover.i] && (
        <div className="tooltip on" style={{ left: hover.x, top: hover.y }}>
          <div className="lbl">{data[hover.i].label}</div>
          <div>{formatValue(data[hover.i].value)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Sparkline ---------------- */
function Sparkline({ values, height = 32 }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(120);
  // 每個 Sparkline 用唯一 gradient id，避免多個實例共用造成衝突
  const gradId = `spark-grad-${useId().replace(/:/g, "")}`;
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...values),
    min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    height - ((v - min) / range) * (height - 6) - 3,
  ]);
  const linePath = smoothPath(pts);
  const fillPath = `${linePath} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        <defs>
          {/* 垂直線性漸層：頂端 primary 30% alpha → 底端 0%（對齊 Figma Sparkline） */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="fill" d={fillPath} fill={`url(#${gradId})`} />
        <path className="line" d={linePath} />
      </svg>
    </div>
  );
}

export { CountUp, ValueChart, Donut, PieDonut, CategoryBars, Sparkline };
