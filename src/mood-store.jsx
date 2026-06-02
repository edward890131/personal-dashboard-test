// mood-store.jsx — 每日心情的單一資料源（SoT）
// 「每日心情」總覽牆、記錄/編輯彈窗、單日詳情共用同一份 entries，任一處修改即時同步。
// Context 持有狀態，資料直接來自下方 code 內的 SEED_MOODS。
//
// ⚠️ 不使用 localStorage：每次載入都從 SEED 重建，永遠對齊「當月」、永不遺失
//    （與 todo-calendar-store / finance-store 一致，刻意的 demo 行為）。
//    畫面上的新增/編輯/刪除只存在當前 session，重整即還原成 seed。要改資料改 SEED_MOODS 即可。
//
// 心情採五級制，內部分數 0–4（與首頁「今日心情 · 30 天趨勢」小卡同一套），
// 顯示用 emoji；本月平均沿用 0–4 尺標，呈現為「X.X / 4」。
import { createContext, useContext, useState, useCallback } from "react";

/* ============================ 心情定義（五級，index = 分數 0–4） ============================ */
// 對齊 PRD 4.5：😔 低落 / 😐 一般 / 🙂 尚可 / 😄 不錯 / 🤩 極佳
export const MOODS = [
  { score: 0, emoji: "😔", label: "低落" },
  { score: 1, emoji: "😐", label: "一般" },
  { score: 2, emoji: "🙂", label: "尚可" },
  { score: 3, emoji: "😄", label: "不錯" },
  { score: 4, emoji: "🤩", label: "極佳" },
];
export const moodByScore = (s) => MOODS[s] || MOODS[2];

/* ============================ Unsplash 圖片池（僅供 seed 展示用） ============================ */
// 記錄/編輯頁是「使用者自行上傳」照片，不從這裡挑；此池只用來生成總覽牆的 seed 展示圖。
// 主題鎖定生活感（咖啡廳／美食／伴侶／動物／朋友／自然），偏亞洲、簡約乾淨；
// 全部相片 id 取自 Unsplash 並已實測可載入。seed 會用 photoUrl(id) 把 id 組成完整網址存進 entry。
export const UNSPLASH_POOL = [
  { id: "photo-1673867924768-c917f62684da", alt: "咖啡廳一隅" }, // 0 café
  { id: "photo-1560256350-9808f72214da", alt: "夜晚的咖啡館" }, // 1 café
  { id: "photo-1602273660127-a0000560a4c1", alt: "拉麵與小菜" }, // 2 food
  { id: "photo-1611143669185-af224c5e3252", alt: "壽司拼盤" }, // 3 food
  { id: "photo-1614563637806-1d0e645e0940", alt: "半熟蛋拉麵" }, // 4 food
  { id: "photo-1502364271109-0a9a75a2a9df", alt: "料理人" }, // 5 food
  { id: "photo-1569912815867-5580004c13a2", alt: "暖呼呼鍋物" }, // 6 food
  { id: "photo-1660715858388-8deaf653ab2b", alt: "額頭吻" }, // 7 couple
  { id: "photo-1602848137189-ad9301200244", alt: "草地上的兩人" }, // 8 couple
  { id: "photo-1656949894977-798e0222ccec", alt: "與貓的午後" }, // 9 couple/cat
  { id: "photo-1513193563746-fac77a988f8d", alt: "比出愛心" }, // 10 couple
  { id: "photo-1563460716037-460a3ad24ba9", alt: "小狗與貓咪" }, // 11 pet
  { id: "photo-1573435567032-ff5982925350", alt: "並肩的貓狗" }, // 12 pet
  { id: "photo-1517105274840-437212774105", alt: "沙發上的貓狗" }, // 13 pet
  { id: "photo-1529156069898-49953e39b3ac", alt: "頂樓的黃昏聚會" }, // 14 friends
  { id: "photo-1519671282429-b44660ead0a7", alt: "朋友餐桌" }, // 15 friends
  { id: "photo-1530541930197-ff16ac917b0e", alt: "營火夜" }, // 16 friends
  { id: "photo-1483354483454-4cd359948304", alt: "晨霧遠山" }, // 17 nature
  { id: "photo-1518972734183-c5b490a7c637", alt: "雪地孤樹" }, // 18 nature
];
export function photoUrl(id, w = 1000) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

/* ============================ 日期工具 ============================ */
// 「今天」錨點：真實今天本地 00:00（與其他模組一致）。
export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
// Date → "YYYY-MM-DD"（本地時間，避免時區位移）
export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// "YYYY-MM-DD" → 當地 00:00 Date
export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
export const weekdayZh = (iso) => WEEKDAYS[parseDate(iso).getDay()];
// "6 月 8 日" 樣式
export const monthDayZh = (iso) => {
  const d = parseDate(iso);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};
// 今天的 ISO（給「記錄今天」用）
export const todayISO = () => ymd(TODAY);
// 相對 TODAY 的第 n 天（n 為負＝過去）
const dayOffsetISO = (n) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

/* ============================ 小工具 ============================ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowISO = () => new Date().toISOString();
const sortByDateDesc = (arr) => [...arr].sort((a, b) => b.date.localeCompare(a.date));

/* ============================ Seed 假資料（首次載入用） ============================ */
// 以 TODAY 為基準往回鋪近期紀錄；day 為相對今天的偏移（0=今天）。
// 刻意留下「今天」沒紀錄，方便示範「記錄今天 → 新增」流程。
// photos 存「完整圖片網址」（與使用者上傳的 data URL 同型別）；seed 用 photoUrl(P[i]) 把池中 id 轉成網址。
// 張數 1–3 觸發不同拼貼版位，主題與筆記呼應（咖啡廳／美食／伴侶／動物／朋友／自然）。
function seedData() {
  const P = UNSPLASH_POOL.map((p) => p.id);
  const raw = [
    {
      day: -1,
      mood: 3,
      photos: [P[0], P[2]],
      note: "週末睡到自然醒，下午窩在常去的咖啡館，點了拉麵當早午餐，把一本書慢慢讀完。",
    },
    {
      day: -2,
      mood: 4,
      photos: [P[15]],
      note: "和大學朋友約了好久的飯，一桌人從傍晚聊到店要打烊，笑到臉很痠。",
    },
    {
      day: -3,
      mood: 2,
      photos: [P[9]],
      note: "在家耍廢的一天，貓一直賴在腿上不肯走，乾脆什麼都不做陪牠睡了一下午。",
    },
    {
      day: -4,
      mood: 1,
      photos: [P[1]],
      note: "加班到很晚，回家路上經過那間還亮著燈的咖啡館，買了杯熱的才有力氣走完最後一段。",
    },
    {
      day: -5,
      mood: 3,
      photos: [P[7], P[8]],
      note: "和他出去走走，沒有特別計畫，只是並肩走著、拍拍照，這樣就很好。",
    },
    {
      day: -6,
      mood: 0,
      photos: [P[18]],
      note: "心情有點空，一個人去看了很安靜的風景，提醒自己慢一點沒關係。",
    },
    {
      day: -7,
      mood: 2,
      photos: [P[11], P[13]],
      note: "鄰居的狗跟貓今天特別黏人，蹲在地上跟牠們玩了好久，煩惱好像也被舔掉一些。",
    },
    {
      day: -8,
      mood: 4,
      photos: [P[6]],
      note: "降溫的晚上揪了鍋物，熱呼呼吃完整個人都暖了，幸福其實很簡單。",
    },
    {
      day: -9,
      mood: 3,
      photos: [P[3], P[4]],
      note: "犒賞自己的一餐，壽司跟拉麵都點了，吃得心滿意足。",
    },
    {
      day: -10,
      mood: 2,
      photos: [P[16]],
      note: "週末和朋友去露營，圍著營火什麼都聊，抬頭還有星星。",
    },
    { day: -11, mood: 1, photos: [], note: "平常的一天，沒拍什麼照片，照常上下班，晚上早早睡了。" },
    {
      day: -12,
      mood: 3,
      photos: [P[10]],
      note: "紀念日。沒有大驚喜，但比出一個愛心、一起吃頓飯，剛剛好。",
    },
    {
      day: -13,
      mood: 4,
      photos: [P[5], P[4], P[2]],
      note: "去了一間一直想朝聖的小店，看師傅現做的樣子很療癒，味道也沒讓人失望。",
    },
    {
      day: -14,
      mood: 2,
      photos: [P[17]],
      note: "起了個大早往山上跑，山嵐很美，喝著咖啡看雲慢慢散開。",
    },
  ];
  return sortByDateDesc(
    raw.map((r) => {
      const date = dayOffsetISO(r.day);
      const ts = parseDate(date).toISOString();
      return {
        id: uid(),
        date,
        mood: r.mood,
        photos: r.photos.map((id) => photoUrl(id)), // id → 完整網址
        note: r.note,
        createdAt: ts,
        updatedAt: ts,
      };
    }),
  );
}

/* ============================ Context ============================ */
const MoodCtx = createContext(null);

export function MoodProvider({ children }) {
  const [entries, setEntries] = useState(seedData);

  // 一天一筆：同日已有則更新（保留 createdAt、更新 updatedAt），否則新增。
  const upsertEntry = useCallback(({ date, mood, photos = [], note = "" }) => {
    setEntries((list) => {
      const idx = list.findIndex((e) => e.date === date);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], mood, photos, note, updatedAt: nowISO() };
        return sortByDateDesc(next);
      }
      const ts = nowISO();
      return sortByDateDesc([
        ...list,
        { id: uid(), date, mood, photos, note, createdAt: ts, updatedAt: ts },
      ]);
    });
  }, []);

  const deleteEntry = useCallback((date) => {
    setEntries((list) => list.filter((e) => e.date !== date));
  }, []);

  const getEntry = useCallback((date) => entries.find((e) => e.date === date) || null, [entries]);

  // 本月平均心情（0–4 尺標）；無紀錄回 null。
  const monthAvg = useCallback(
    (year = TODAY.getFullYear(), month = TODAY.getMonth()) => {
      const inMonth = entries.filter((e) => {
        const d = parseDate(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      if (!inMonth.length) return null;
      return inMonth.reduce((s, e) => s + e.mood, 0) / inMonth.length;
    },
    [entries],
  );

  // 詳情頁前/後一天切換：在「有紀錄的日期」之間移動。
  // dir = -1 較舊、+1 較新；找不到回 null。
  const adjacentDate = useCallback(
    (date, dir) => {
      const desc = sortByDateDesc(entries); // 新→舊
      const i = desc.findIndex((e) => e.date === date);
      if (i < 0) return null;
      const target = dir > 0 ? desc[i - 1] : desc[i + 1]; // 新在前
      return target ? target.date : null;
    },
    [entries],
  );

  return (
    <MoodCtx.Provider
      value={{ entries, upsertEntry, deleteEntry, getEntry, monthAvg, adjacentDate }}
    >
      {children}
    </MoodCtx.Provider>
  );
}

export const useMood = () => useContext(MoodCtx);
