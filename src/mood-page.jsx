// mood-page.jsx — 每日心情頁面（總覽牆 / 記錄·編輯彈窗 / 單日詳情）
// 沿用既有設計系統：Modal / Field / useToast / useConfirm（ui.jsx）、.btn-primary / .card
// 等 class，樣式 token 全綁 styles.css 的 CSS 變數。資料來自 mood-store.jsx（in-memory）。
//
// 照片：記錄/編輯改為「使用者自行上傳」（轉 data URL 暫存於記憶體，與 seed 的 Unsplash 網址同型別）。
// 牌卡心情以「emoji + 文字」tag 呈現，配色採語意冷暖色（低落偏冷 → 極佳偏暖）。
// 牌卡提供 4 種 layout（照片主導 / 緊湊清單 / 拍立得 / 大圖疊字），由頁首左側下拉切換。
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  useMood,
  MOODS,
  moodByScore,
  todayISO,
  weekdayZh,
  monthDayZh,
  TODAY,
} from "./mood-store.jsx";
import { Modal, Field, useToast, useConfirm } from "./ui.jsx";

/* ====================================================================
   共用：心情 tag（emoji + 文字，語意冷暖色，色階由 .m{score} 控制）
   ==================================================================== */
function MoodTag({ score, lg = false }) {
  const m = moodByScore(score);
  return (
    <span className={`mp-tag m${score} ${lg ? "lg" : ""}`}>
      <span className="e">{m.emoji}</span>
      {m.label}
    </span>
  );
}

/* ====================================================================
   共用：照片拼貼（1 滿版 / 2 對半 / 3 左大右二），版位由 data-count 決定（PRD 4.4）
   photos 為圖片網址陣列（Unsplash 網址或上傳的 data URL）；無照片退回大 emoji 底卡。
   ==================================================================== */
function PhotoCollage({ photos = [], className = "" }) {
  if (!photos.length) {
    return (
      <div className={`mp-collage mp-collage-empty ${className}`}>
        <span className="mp-no-photo">未上傳</span>
      </div>
    );
  }
  return (
    <div className={`mp-collage ${className}`} data-count={photos.length}>
      {photos.map((src, i) => (
        <div className="mp-cell" key={i}>
          <img src={src} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </div>
  );
}

/* ====================================================================
   牌卡用照片輪播：一次只顯示一張，多張時自動輪播（淡入切換）+ 圓點指示
   單張不顯示圓點、不啟動計時器；hover 時暫停；點圓點不會冒泡觸發開啟詳情。
   ==================================================================== */
function PhotoCarousel({ photos = [], className = "" }) {
  const trackRef = useRef(null);
  const iRef = useRef(0); // 給 interval 讀目前索引，避免閉包取到舊值
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const multi = photos.length > 1;
  iRef.current = i;

  // 照片數變動時回到第一張
  useEffect(() => {
    setI(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [photos.length]);

  // 自動輪播：用程式捲動到下一張（觸發 onScroll 同步索引與圓點）；多張且未暫停才跑
  useEffect(() => {
    if (!multi || paused) return undefined;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const next = (iRef.current + 1) % photos.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 3200);
    return () => clearInterval(id);
  }, [multi, paused, photos.length]);

  // 手動 scroll / 觸控板橫滑：依捲動位置回算目前是第幾張
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== iRef.current) setI(idx);
  };

  // 點圓點：平滑捲到該張
  const goTo = (idx) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setI(idx);
  };

  if (!photos.length) {
    return (
      <div className={`mp-collage mp-collage-empty ${className}`}>
        <span className="mp-no-photo">未上傳</span>
      </div>
    );
  }

  return (
    <div
      className={`mp-carousel ${className}`}
      onMouseEnter={() => multi && setPaused(true)}
      onMouseLeave={() => multi && setPaused(false)}
    >
      <div className="mp-carousel-track" ref={trackRef} onScroll={onScroll}>
        {photos.map((src, idx) => (
          <div className="mp-carousel-slide" key={idx}>
            <img src={src} alt="" draggable={false} />
          </div>
        ))}
      </div>
      {multi && (
        <div className="mp-carousel-dots">
          {photos.map((_, idx) => (
            <span
              key={idx}
              role="button"
              tabIndex={-1}
              className={`mp-dot ${idx === i ? "on" : ""}`}
              aria-label={`第 ${idx + 1} 張`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   總覽牆：單張卡片（依 variant 切換 layout）
   ==================================================================== */
function MoodWallCard({ entry, variant, onOpen }) {
  const open = () => onOpen(entry.date);
  const dateEl = (
    <>
      <span className="mp-date">{monthDayZh(entry.date)}</span>
      <span className="mp-weekday">{weekdayZh(entry.date)}</span>
    </>
  );

  // B 緊湊清單：左縮圖 + 右資訊，橫向一列
  if (variant === "list") {
    return (
      <button type="button" className="mp-card mp-card-list" onClick={open}>
        <PhotoCollage photos={entry.photos} className="mp-list-thumb" />
        <div className="mp-card-body">
          <div className="mp-card-meta">
            {dateEl}
            <MoodTag score={entry.mood} />
          </div>
          <p className="mp-note mp-note-2">{entry.note}</p>
        </div>
      </button>
    );
  }

  // C 拍立得：照片內縮帶白邊，文字置中
  if (variant === "polaroid") {
    return (
      <button type="button" className="mp-card mp-card-polaroid" onClick={open}>
        <PhotoCarousel photos={entry.photos} className="mp-card-photos" />
        <div className="mp-card-body">
          <div className="mp-card-meta">
            {dateEl}
            <MoodTag score={entry.mood} />
          </div>
          <p className="mp-note">{entry.note}</p>
        </div>
      </button>
    );
  }

  // D 大圖疊字：滿版照片 + 底部漸層疊資訊（筆記收到詳情頁）
  if (variant === "cover") {
    return (
      <button type="button" className="mp-card mp-card-cover" onClick={open}>
        <PhotoCarousel photos={entry.photos} className="mp-cover-photos" />
        <div className="mp-cover-overlay">
          <div className="mp-card-meta">
            {dateEl}
            <MoodTag score={entry.mood} />
          </div>
          {entry.note && <p className="mp-note mp-note-2 mp-cover-note">{entry.note}</p>}
        </div>
      </button>
    );
  }

  // A 照片主導（預設）
  return (
    <button type="button" className="mp-card mp-card-photo" onClick={open}>
      <PhotoCarousel photos={entry.photos} className="mp-card-photos" />
      <div className="mp-card-body">
        <div className="mp-card-meta">
          {dateEl}
          <MoodTag score={entry.mood} />
        </div>
        {entry.note && <p className="mp-note">{entry.note}</p>}
      </div>
    </button>
  );
}

/* ====================================================================
   通用下拉（頁首用）：心情篩選 + layout 切換共用同一外觀
   ==================================================================== */
function Dropdown({ label, icon, children, align = "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mp-dd">
      <button type="button" className="mp-dd-btn" onClick={() => setOpen((v) => !v)}>
        {icon && <i className={`ph ${icon}`}></i>}
        <span>{label}</span>
        <i className={`ph ph-caret-${open ? "up" : "down"}`}></i>
      </button>
      {open && (
        <>
          <div className="mp-dd-scrim" onClick={() => setOpen(false)}></div>
          <div className={`mp-dd-menu ${align === "left" ? "to-left" : ""}`} role="listbox">
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

const LAYOUTS = [
  { key: "polaroid", label: "拍立得", icon: "ph-image-square" },
  { key: "cover", label: "大圖疊字", icon: "ph-image" },
];

function LayoutSelect({ value, onChange }) {
  const cur = LAYOUTS.find((l) => l.key === value) || LAYOUTS[0];
  return (
    <Dropdown label={cur.label} icon={cur.icon} align="left">
      {(close) =>
        LAYOUTS.map((l) => (
          <button
            type="button"
            key={l.key}
            className={`mp-dd-opt ${value === l.key ? "on" : ""}`}
            onClick={() => {
              onChange(l.key);
              close();
            }}
          >
            <i className={`ph ${l.icon}`}></i>
            {l.label}
          </button>
        ))
      }
    </Dropdown>
  );
}

function MoodFilter({ value, onChange }) {
  const label =
    value === "all" ? "全部心情" : `${moodByScore(value).emoji} ${moodByScore(value).label}`;
  return (
    <Dropdown label={label}>
      {(close) => (
        <>
          <button
            type="button"
            className={`mp-dd-opt ${value === "all" ? "on" : ""}`}
            onClick={() => {
              onChange("all");
              close();
            }}
          >
            全部心情
          </button>
          {[...MOODS].reverse().map((m) => (
            <button
              type="button"
              key={m.score}
              className={`mp-dd-opt ${value === m.score ? "on" : ""}`}
              onClick={() => {
                onChange(m.score);
                close();
              }}
            >
              <span className="mp-dd-emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </>
      )}
    </Dropdown>
  );
}

/* ====================================================================
   記錄 / 編輯彈窗
   心情必填；照片由使用者上傳（最多 3 張、可移除、可拖曳排序）；筆記 ≤ 200 字。
   同一天已有紀錄 → 進入即編輯模式（PRD 5）。允許補記過去日期，不可記未來。
   ==================================================================== */
const NOTE_MAX = 200;

function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef(null);
  const dragIdx = useRef(null);
  const toast = useToast();

  const addFiles = (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    const room = 3 - photos.length;
    if (room <= 0) {
      toast("最多 3 張照片", "info");
      return;
    }
    const take = files.slice(0, room);
    if (files.length > room) toast("最多 3 張，已略過多餘的", "info");
    Promise.all(
      take.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => setPhotos((cur) => [...cur, ...urls].slice(0, 3)));
  };

  const removeAt = (i) => setPhotos((cur) => cur.filter((_, idx) => idx !== i));
  const onDrop = (i) => {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === i) return;
    setPhotos((cur) => {
      const next = [...cur];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
  };

  return (
    <div className="mp-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // 允許重選同一檔
        }}
      />
      <div className="mp-selected" data-count={photos.length}>
        {photos.map((src, i) => (
          <div
            className="mp-selected-item"
            key={i}
            draggable
            onDragStart={() => (dragIdx.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <img src={src} alt="" draggable={false} />
            <span className="mp-selected-order">{i + 1}</span>
            <button
              type="button"
              className="mp-selected-x"
              aria-label="移除照片"
              onClick={() => removeAt(i)}
            >
              <i className="ph ph-x"></i>
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <button
            type="button"
            className="mp-upload-tile"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <i className="ph ph-plus"></i>
            <span>上傳照片</span>
          </button>
        )}
      </div>
      <div className="mp-upload-hint">支援拖曳排序；可一次選多張，最多 3 張</div>
    </div>
  );
}

function RecordModal({ open, initialDate, onClose }) {
  const { getEntry, upsertEntry, deleteEntry } = useMood();
  const toast = useToast();
  const confirm = useConfirm();

  const [date, setDate] = useState(initialDate || todayISO());
  const [mood, setMood] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState("");
  const maxDate = todayISO();

  const loadFor = useCallback(
    (d) => {
      const e = getEntry(d);
      setMood(e ? e.mood : null);
      setPhotos(e ? [...e.photos] : []);
      setNote(e ? e.note : "");
    },
    [getEntry],
  );

  useEffect(() => {
    if (!open) return;
    const d = initialDate || todayISO();
    setDate(d);
    loadFor(d);
  }, [open, initialDate, loadFor]);

  const existing = getEntry(date);
  const isEdit = !!existing;
  const isToday = date === todayISO();

  const onDateChange = (v) => {
    if (v > maxDate) {
      toast("不可記錄未來日期", "info");
      return;
    }
    setDate(v);
    loadFor(v);
  };

  const save = () => {
    if (mood === null) {
      toast("請先選擇今天的心情", "info");
      return;
    }
    upsertEntry({ date, mood, photos, note: note.trim() });
    toast(isEdit ? "已更新紀錄" : "已記錄今天");
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({
      title: "刪除這天的紀錄",
      message: "確定要刪除這天的心情紀錄嗎？此動作無法復原。",
      confirmText: "刪除",
      danger: true,
    });
    if (ok) {
      deleteEntry(date);
      toast("已刪除紀錄");
      onClose();
    }
  };

  const footer = (
    <>
      {isEdit && (
        <button type="button" className="btn-danger btn-icon" onClick={remove} aria-label="刪除">
          <i className="ph ph-trash"></i>
        </button>
      )}
      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
        取消
      </button>
      <button
        type="button"
        className="btn-primary"
        style={{ flex: 1 }}
        onClick={save}
        disabled={mood === null}
      >
        儲存
      </button>
    </>
  );

  const title = isEdit
    ? isToday
      ? "編輯今天的心情"
      : "編輯紀錄"
    : isToday
      ? "記錄今天"
      : "補記紀錄";

  return (
    <Modal open={open} onClose={onClose} title={title} width={520} footer={footer}>
      <Field label="日期">
        <input
          type="date"
          className="fin-input"
          value={date}
          max={maxDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </Field>

      <Field label="今天的心情">
        <div className="mp-mood-pick">
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.score}
              className={`mp-mood-opt ${mood === m.score ? "on" : ""}`}
              onClick={() => setMood(m.score)}
              aria-pressed={mood === m.score}
            >
              <span className="mp-mood-opt-emoji">{m.emoji}</span>
              <span className="mp-mood-opt-label">{m.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label={`照片 ${photos.length} / 3`}>
        <PhotoUploader photos={photos} setPhotos={setPhotos} />
      </Field>

      <Field label="筆記">
        <textarea
          className="fin-input mp-note-input"
          rows={4}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今天發生了什麼？寫一兩句也好。"
        />
        <span className="mp-note-count">
          {note.length}/{NOTE_MAX}
        </span>
      </Field>
    </Modal>
  );
}

/* ====================================================================
   單日詳情彈窗：放大照片 + 全文 + 前/後一天 + 編輯 + meta
   ==================================================================== */
function fmtDateTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function DetailModal({ date, setDate, onClose, onEdit }) {
  const { getEntry, adjacentDate } = useMood();
  const entry = date ? getEntry(date) : null;
  const prev = date ? adjacentDate(date, -1) : null;
  const next = date ? adjacentDate(date, 1) : null;
  if (!entry) return null;

  const footer = (
    <>
      <button
        type="button"
        className="btn-secondary btn-icon"
        onClick={() => prev && setDate(prev)}
        disabled={!prev}
        aria-label="前一天"
      >
        <i className="ph ph-caret-left"></i>
      </button>
      <button
        type="button"
        className="btn-secondary btn-icon"
        onClick={() => next && setDate(next)}
        disabled={!next}
        aria-label="後一天"
      >
        <i className="ph ph-caret-right"></i>
      </button>
      <div style={{ flex: 1 }}></div>
      <button type="button" className="btn-primary" onClick={() => onEdit(entry.date)}>
        <i className="ph ph-pencil-simple"></i>編輯
      </button>
    </>
  );

  return (
    <Modal
      open={!!date}
      onClose={onClose}
      title={`${monthDayZh(entry.date)} ${weekdayZh(entry.date)}`}
      width={640}
      footer={footer}
    >
      <div className="mp-detail">
        <PhotoCollage photos={entry.photos} className="mp-detail-photos" />
        <MoodTag score={entry.mood} />
        {entry.note && <p className="mp-detail-note">{entry.note}</p>}
        <div className="mp-detail-foot">
          <span>
            <i className="ph ph-image"></i> {entry.photos.length} 張照片
          </span>
          <span>
            <i className="ph ph-clock"></i> 記錄於 {fmtDateTime(entry.updatedAt)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

/* ====================================================================
   主頁面
   ==================================================================== */
export function MoodPage() {
  const { entries, monthAvg } = useMood();
  const [filter, setFilter] = useState("all"); // 'all' | 0..4
  const [layout, setLayout] = useState("polaroid"); // polaroid | cover
  const [view, setView] = useState(() => ({ y: TODAY.getFullYear(), m: TODAY.getMonth() })); // 顯示中的月份
  const [recordDate, setRecordDate] = useState(null);
  const [detailDate, setDetailDate] = useState(null);

  const avg = monthAvg(view.y, view.m);
  const ymPrefix = `${view.y}-${String(view.m + 1).padStart(2, "0")}`; // "YYYY-MM"
  const atCurrentMonth = view.y === TODAY.getFullYear() && view.m === TODAY.getMonth();
  const shiftMonth = (delta) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  // 只顯示「顯示中月份」且符合心情篩選的紀錄
  const filtered = useMemo(
    () =>
      entries.filter((e) => e.date.startsWith(ymPrefix) && (filter === "all" || e.mood === filter)),
    [entries, ymPrefix, filter],
  );

  const todayDone = !!entries.find((e) => e.date === todayISO());
  const openRecordToday = () => setRecordDate(todayISO());
  const openEdit = (d) => {
    setDetailDate(null);
    setRecordDate(d);
  };

  return (
    <div className="mp-page">
      <div className="mp-head">
        <div className="mp-head-l">
          <h1 className="mp-page-title">每日心情</h1>
          <div className="mp-page-sub">本月平均 {avg === null ? "—" : avg.toFixed(1)} / 4</div>
        </div>
        <div className="mp-head-r">
          <div className="mp-month-nav">
            <button
              type="button"
              className="mp-month-btn"
              onClick={() => shiftMonth(-1)}
              aria-label="上個月"
            >
              <i className="ph ph-caret-left"></i>
            </button>
            <span className="mp-month-label">
              {view.y} 年 {view.m + 1} 月
            </span>
            <button
              type="button"
              className="mp-month-btn"
              onClick={() => shiftMonth(1)}
              disabled={atCurrentMonth}
              aria-label="下個月"
            >
              <i className="ph ph-caret-right"></i>
            </button>
          </div>
          <LayoutSelect value={layout} onChange={setLayout} />
          <MoodFilter value={filter} onChange={setFilter} />
          <button type="button" className="btn-primary" onClick={openRecordToday}>
            <i className="ph ph-plus"></i>
            {todayDone ? "編輯今天" : "記錄今天"}
          </button>
        </div>
      </div>

      {filtered.length ? (
        <div className={`mp-wall v-${layout}`}>
          {filtered.map((e) => (
            <MoodWallCard key={e.id} entry={e} variant={layout} onOpen={setDetailDate} />
          ))}
        </div>
      ) : (
        <div className="mp-empty card">
          <div className="mp-empty-icon">
            <i className="ph ph-smiley"></i>
          </div>
          <div className="mp-empty-title">
            {filter === "all" ? "這個月還沒有任何紀錄" : "沒有符合篩選的紀錄"}
          </div>
          <div className="mp-empty-sub">
            {filter === "all"
              ? "從記錄今天的心情開始，留下一張照片、一段話。"
              : "換個心情篩選看看。"}
          </div>
          {filter === "all" && (
            <button type="button" className="btn-primary" onClick={openRecordToday}>
              <i className="ph ph-plus"></i>記錄今天
            </button>
          )}
        </div>
      )}

      <RecordModal
        open={!!recordDate}
        initialDate={recordDate}
        onClose={() => setRecordDate(null)}
      />
      <DetailModal
        date={detailDate}
        setDate={setDetailDate}
        onClose={() => setDetailDate(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
