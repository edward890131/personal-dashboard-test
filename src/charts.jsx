// charts.jsx — 小型圖表元件，含 hover tooltip 與 draw-in 動畫
// 對外輸出：CountUp、ValueChart、Donut、PieDonut、Sparkline
import { useState, useEffect, useRef } from "react";

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
}) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(600);
  const [tip, setTip] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

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
  const innerH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

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
      y: p[1] * (rect.height / height),
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
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
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
                  {Math.round(v).toLocaleString()}
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
              <text key={i} x={x} y={height - 6} textAnchor="middle">
                {d.label}
              </text>
            );
          })}
        </g>

        {(mode === "area" || mode === "line") && (
          <>
            {mode === "area" && drawn && (
              <path className="line-fill" d={areaPath} style={{ animation: "card-in .5s ease" }} />
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
function PieDonut({ data, size = 130, stroke = 18, totalLabel = "支出" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
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
              style={{
                transition:
                  "stroke-dasharray 1s cubic-bezier(.4,.05,.2,1), stroke-dashoffset 1s cubic-bezier(.4,.05,.2,1)",
                transformOrigin: "center",
                animation: `donut-sweep 1s cubic-bezier(.4,.05,.2,1) ${i * 80}ms backwards`,
              }}
            />
          );
        })}
      </svg>
      <div className="donut-center">
        <div className="v">
          <CountUp to={total} prefix="$" />
        </div>
        <div className="l">{totalLabel}</div>
      </div>
    </div>
  );
}

/* ---------------- Sparkline ---------------- */
function Sparkline({ values, height = 32 }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(120);
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
        <path className="fill" d={fillPath} />
        <path className="line" d={linePath} />
      </svg>
    </div>
  );
}

export { CountUp, ValueChart, Donut, PieDonut, Sparkline };
