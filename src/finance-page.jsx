// finance-page.jsx — 理財規劃頁面
// 版面：左右兩欄（左 財務分析 1.15 / 右 帳目總覽 + 儲蓄目標 1），≤960px 降為單欄堆疊。
import { useState, useEffect, useMemo, useRef } from "react";
import {
  useFinance,
  periodStats,
  trendData,
  categoryBreakdown,
  savingProgress,
} from "./finance-store.jsx";
import { ValueChart, PieDonut } from "./charts.jsx";
import { Modal, useToast, useConfirm, Field, CategoryPicker, fmtMoney } from "./ui.jsx";
import { allCategories, getCategory, finCatVar, finCatSoft } from "./finance-categories.js";

// "YYYY-MM-DD"（本地時間，給日期輸入框預設值用）
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// 從 "YYYY-MM-DD" 取「M/D」顯示（用字串切割避免時區位移）
const mdLabel = (iso) => {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
};

function currentMonthLabel() {
  const d = new Date();
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

/* ====================================================================
   區塊一之一：收支趨勢卡（重點數據列 + 累積淨餘曲線，對齊首頁收支趨勢牌卡）
   ==================================================================== */
function FinanceTrendCard({ chartMode = "area" }) {
  const { transactions } = useFinance();
  const [period, setPeriod] = useState("month"); // week | month | year

  const stats = useMemo(() => periodStats(transactions, period), [transactions, period]);
  const trend = useMemo(() => trendData(transactions, period), [transactions, period]);
  const deltaPos = stats.delta >= 0;

  return (
    <section className="card fin-trend">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-chart-line-up"></i>收支趨勢
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

      {/* 重點數據列：本期淨餘（含 % 變化徽章）/ 收入 / 支出（對齊首頁） */}
      <div className="fin-row">
        <div className="fin-stat">
          <div className="l">本期淨餘（NTD）</div>
          <div className="v">
            <small>$</small>
            {fmtMoney(stats.net)}
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
            {fmtMoney(stats.income)}
          </div>
        </div>
        <div className="fin-stat">
          <div className="l">支出</div>
          <div className="v" style={{ color: "var(--neg)" }}>
            <small>−</small>
            {fmtMoney(stats.expense)}
          </div>
        </div>
      </div>

      {stats.hasData ? (
        <ValueChart
          data={trend}
          mode={chartMode}
          yLabels={true}
          height={170}
          fill
          formatValue={(v) => `NT$ ${fmtMoney(v)}`}
        />
      ) : (
        <div className="chart-empty">這個期間還沒有帳目資料</div>
      )}
    </section>
  );
}

/* ====================================================================
   區塊一之二：收支分類卡（甜甜圈 + 圖例，支出／收入切換、月份切換）
   ==================================================================== */
function FinanceBreakdownCard() {
  const { transactions } = useFinance();
  const today = new Date();
  const [catRef, setCatRef] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [catType, setCatType] = useState("expense"); // expense | income
  const catYear = catRef.getFullYear();
  const catMonth = catRef.getMonth();
  const isCurrentMonth = catYear === today.getFullYear() && catMonth === today.getMonth();
  const shiftMonth = (delta) =>
    setCatRef((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, catYear, catMonth, catType),
    [transactions, catYear, catMonth, catType],
  );
  const isIncome = catType === "income";

  return (
    <section className="card fin-breakdown">
      <div className="card-h">
        <div className="fin-sub-h-l">
          <div className="card-title">
            <i className="ph ph-chart-pie-slice"></i>收支分類
          </div>
          <div className="tab-row">
            <button className={!isIncome ? "on" : ""} onClick={() => setCatType("expense")}>
              支出
            </button>
            <button className={isIncome ? "on" : ""} onClick={() => setCatType("income")}>
              收入
            </button>
          </div>
        </div>
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            style={{ width: 34, height: 34 }}
            onClick={() => shiftMonth(-1)}
            aria-label="上個月"
          >
            <i className="ph ph-caret-left"></i>
          </button>
          <span className="lbl">
            {catYear} / {catMonth + 1}月
          </span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 34, height: 34 }}
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label="下個月"
          >
            <i className="ph ph-caret-right"></i>
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
            size={260}
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
    </section>
  );
}

/* ====================================================================
   區塊二：帳目總覽（列表 + 新增/編輯彈窗）
   ==================================================================== */
function TxnRow({ txn, onClick }) {
  const cat = getCategory(txn.type, txn.category);
  const isIncome = txn.type === "income";
  return (
    <div className="txn-row" onClick={onClick}>
      <div className="txn-ico" style={{ background: finCatSoft(cat) }}>
        {cat.emoji}
      </div>
      <div className="txn-main">
        <div className="txn-name">{txn.name}</div>
        <div className="txn-sub">
          {cat.name} · {mdLabel(txn.date)}
        </div>
      </div>
      <div className={`txn-amt ${isIncome ? "pos" : "neg"}`}>
        {isIncome ? "+" : "−"}
        {fmtMoney(txn.amount)}
      </div>
    </div>
  );
}

// 新增 / 編輯帳目共用彈窗（mode: create | edit）
function TransactionModal({ open, mode, initial, onClose }) {
  const { addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const toast = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => ymd(new Date()));
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name);
      setDate(initial.date);
      setType(initial.type);
      setCategory(initial.category);
      setAmount(String(initial.amount));
    } else {
      setName("");
      setDate(ymd(new Date()));
      setType("expense");
      setCategory("");
      setAmount("");
    }
    setTouched(false);
  }, [open, mode, initial]);

  // 類型切換時，若目前類別不在新類型清單，清空（避免支出類別殘留在收入）
  const onTypeChange = (t) => {
    setType(t);
    if (!allCategories(t).some((c) => c.key === category)) setCategory("");
  };

  const amountNum = Number(amount);
  const errors = {
    name: !name.trim() ? "請輸入項目名稱" : "",
    amount: amount === "" ? "請輸入金額" : !(amountNum > 0) ? "金額需為正數" : "",
    category: !category ? "請選擇類別" : "",
  };
  const valid = !errors.name && !errors.amount && !errors.category;

  const submit = () => {
    if (!valid) {
      setTouched(true);
      return;
    }
    const data = { name: name.trim(), date, type, category, amount: amountNum };
    if (mode === "edit") {
      updateTransaction(initial.id, data);
      toast("編輯成功");
    } else {
      addTransaction(data);
      toast(type === "income" ? "新增收入成功" : "新增支出成功");
    }
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({
      title: "刪除帳目",
      message: `確定要刪除「${initial.name}」這筆帳目嗎？此動作無法復原。`,
      confirmText: "刪除",
      danger: true,
    });
    if (ok) {
      deleteTransaction(initial.id);
      toast("刪除成功");
      onClose();
    }
  };

  const footer =
    mode === "edit" ? (
      <>
        <button type="button" className="btn-danger btn-icon" onClick={remove} aria-label="刪除">
          <i className="ph ph-trash"></i>
        </button>
        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={!valid}
        >
          儲存
        </button>
      </>
    ) : (
      <button
        type="button"
        className="btn-primary"
        style={{ flex: 1 }}
        onClick={submit}
        disabled={!valid}
      >
        新增
      </button>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "編輯帳目" : "新增帳目"}
      footer={footer}
    >
      <Field label="項目名稱" error={touched ? errors.name : ""}>
        <input
          className={`fin-input ${touched && errors.name ? "invalid" : ""}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：Netflix 訂閱費"
        />
      </Field>
      <div className="fin-row-2">
        <Field label="日期">
          <input
            type="date"
            className="fin-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="金額（NT$）" error={touched ? errors.amount : ""}>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className={`fin-input ${touched && errors.amount ? "invalid" : ""}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      <Field label="類型">
        <div className="seg">
          <button
            type="button"
            className={`seg-expense ${type === "expense" ? "on" : ""}`}
            onClick={() => onTypeChange("expense")}
          >
            支出
          </button>
          <button
            type="button"
            className={`seg-income ${type === "income" ? "on" : ""}`}
            onClick={() => onTypeChange("income")}
          >
            收入
          </button>
        </div>
      </Field>
      <Field
        label={type === "income" ? "收入類別" : "花費類別"}
        error={touched ? errors.category : ""}
      >
        <CategoryPicker type={type} value={category} onChange={setCategory} />
      </Field>
    </Modal>
  );
}

function TransactionOverview() {
  const { transactions } = useFinance();
  const [visible, setVisible] = useState(10);
  const [modal, setModal] = useState(null); // { mode, initial } | null
  const listRef = useRef(null);
  // 點「載入更多」後自動平滑捲到清單最底，省去手動下滑（visible > 10 代表已按過載入更多）
  useEffect(() => {
    if (visible > 10 && listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visible]);

  const shown = transactions.slice(0, visible);
  const hasMore = visible < transactions.length;

  return (
    <section className="card fin-txn">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-list-bullets"></i>帳目總覽
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => setModal({ mode: "create" })}
        >
          <i className="ph ph-plus"></i>新增
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="fin-empty">
          <i className="ph ph-receipt"></i>
          <div className="t">還沒有任何帳目，點右上角新增第一筆</div>
        </div>
      ) : (
        <>
          <div className="txn-list" ref={listRef}>
            {shown.map((t) => (
              <TxnRow key={t.id} txn={t} onClick={() => setModal({ mode: "edit", initial: t })} />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="btn-secondary btn-sm fin-loadmore"
              onClick={() => setVisible((v) => v + 10)}
            >
              載入更多
            </button>
          )}
        </>
      )}

      <TransactionModal
        open={!!modal}
        mode={modal?.mode || "create"}
        initial={modal?.initial}
        onClose={() => setModal(null)}
      />
    </section>
  );
}

/* ====================================================================
   區塊三：儲蓄目標（進度面板 + 存入記錄 + 目標/存入彈窗）
   ==================================================================== */
function DepRow({ dep, onClick }) {
  return (
    <div className="dep-row" onClick={onClick}>
      <div className="dep-ico">💰</div>
      <span className="dep-when">{mdLabel(dep.date)} 存入</span>
      <span className="dep-amt">+{fmtMoney(dep.amount)}</span>
    </div>
  );
}

// 設定年度儲蓄目標
function GoalModal({ open, onClose }) {
  const { goal, setGoal } = useFinance();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(goal?.targetAmount ? String(goal.targetAmount) : "");
      setTouched(false);
    }
  }, [open, goal]);

  const num = Number(amount);
  const err = amount === "" ? "請輸入目標金額" : !(num > 0) ? "金額需為正數" : "";
  const submit = () => {
    if (err) {
      setTouched(true);
      return;
    }
    setGoal(num);
    toast("目標已更新");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="設定年度儲蓄目標"
      width={380}
      footer={
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={!!err}
        >
          儲存
        </button>
      }
    >
      <Field label="年度儲蓄目標金額（NT$）" error={touched ? err : ""}>
        <input
          type="number"
          min="0"
          className={`fin-input ${touched && err ? "invalid" : ""}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="例：360000"
        />
      </Field>
    </Modal>
  );
}

// 新增 / 編輯存入金額（含選填的年度目標欄位，方便首次一次設定）
function DepositModal({ open, mode, initial, onClose }) {
  const { goal, addDeposit, updateDeposit, deleteDeposit, setGoal } = useFinance();
  const toast = useToast();
  const confirm = useConfirm();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => ymd(new Date()));
  const [goalAmount, setGoalAmount] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setAmount(String(initial.amount));
      setDate(initial.date);
    } else {
      setAmount("");
      setDate(ymd(new Date()));
    }
    setGoalAmount(goal?.targetAmount ? String(goal.targetAmount) : "");
    setTouched(false);
  }, [open, mode, initial, goal]);

  const num = Number(amount);
  const err = amount === "" ? "請輸入存入金額" : !(num > 0) ? "金額需為正數" : "";
  const goalNum = Number(goalAmount);

  const submit = () => {
    if (err) {
      setTouched(true);
      return;
    }
    // 選填目標欄位：有填且為正數、且與現值不同才更新
    if (goalAmount !== "" && goalNum > 0 && goalNum !== (goal?.targetAmount || 0)) setGoal(goalNum);
    if (mode === "edit") {
      updateDeposit(initial.id, { amount: num, date });
      toast("編輯成功");
    } else {
      addDeposit({ amount: num, date });
      toast("新增成功");
    }
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({
      title: "刪除存入記錄",
      message: "確定要刪除這筆存入記錄嗎？此動作無法復原。",
      confirmText: "刪除",
      danger: true,
    });
    if (ok) {
      deleteDeposit(initial.id);
      toast("刪除成功");
      onClose();
    }
  };

  const footer =
    mode === "edit" ? (
      <>
        <button type="button" className="btn-danger btn-icon" onClick={remove} aria-label="刪除">
          <i className="ph ph-trash"></i>
        </button>
        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={!!err}
        >
          儲存
        </button>
      </>
    ) : (
      <button
        type="button"
        className="btn-primary"
        style={{ flex: 1 }}
        onClick={submit}
        disabled={!!err}
      >
        新增
      </button>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "編輯存入金額" : "新增存入金額"}
      width={400}
      footer={footer}
    >
      <Field label="存入金額（NT$）" error={touched ? err : ""}>
        <input
          type="number"
          min="0"
          className={`fin-input ${touched && err ? "invalid" : ""}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
      </Field>
      <Field label="存入時間">
        <input
          type="date"
          className="fin-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="年度儲蓄目標（選填）">
        <input
          type="number"
          min="0"
          className="fin-input"
          value={goalAmount}
          onChange={(e) => setGoalAmount(e.target.value)}
          placeholder="例：360000"
        />
      </Field>
    </Modal>
  );
}

function SavingGoalSection() {
  const { deposits, goal } = useFinance();
  const [visible, setVisible] = useState(10);
  const [goalModal, setGoalModal] = useState(false);
  const [depModal, setDepModal] = useState(null); // { mode, initial } | null
  const listRef = useRef(null);
  // 點「載入更多」後自動平滑捲到清單最底
  useEffect(() => {
    if (visible > 10 && listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visible]);

  const prog = useMemo(() => savingProgress(deposits, goal), [deposits, goal]);
  const hasGoal = prog.target > 0;
  const pctClamped = prog.pct != null ? Math.min(100, prog.pct) : 0;
  const reached = prog.pct != null && prog.pct >= 100;

  const shown = deposits.slice(0, visible);
  const hasMore = visible < deposits.length;

  return (
    <section className="card fin-save">
      <div className="card-h">
        <div className="card-title">
          <i className="ph ph-piggy-bank"></i>儲蓄目標
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setGoalModal(true)}>
            <i className="ph ph-target"></i>設定目標
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => setDepModal({ mode: "create" })}
          >
            <i className="ph ph-plus"></i>存入
          </button>
        </div>
      </div>

      {hasGoal ? (
        <div className="save-panel">
          <div className="save-top">
            <span className="save-target">
              目標 <b>{fmtMoney(prog.target)}</b>
            </span>
            <span className="save-pct">{Math.round(prog.pct)}%</span>
          </div>
          <div className="bar">
            <span
              style={{
                transform: `scaleX(${pctClamped / 100})`,
                transition: "transform 1s cubic-bezier(.4,.05,.2,1)",
              }}
            ></span>
          </div>
          <span className="save-encourage">
            {reached ? "你超級棒，成功達成目標！" : "每月存一點，越來越有錢！"}
          </span>
        </div>
      ) : (
        <div className="save-panel">
          <span className="save-hint">先設定年度儲蓄目標，開始追蹤你的存款進度。</span>
          <button
            type="button"
            className="btn-secondary btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={() => setGoalModal(true)}
          >
            <i className="ph ph-target"></i>設定年度目標
          </button>
        </div>
      )}

      {deposits.length === 0 ? (
        <div className="fin-empty">
          <i className="ph ph-coins"></i>
          <div className="t">還沒有存入記錄，開始你的第一筆儲蓄吧</div>
        </div>
      ) : (
        <>
          <div className="txn-list" ref={listRef}>
            {shown.map((d) => (
              <DepRow
                key={d.id}
                dep={d}
                onClick={() => setDepModal({ mode: "edit", initial: d })}
              />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="btn-secondary btn-sm fin-loadmore"
              onClick={() => setVisible((v) => v + 10)}
            >
              載入更多
            </button>
          )}
        </>
      )}

      <GoalModal open={goalModal} onClose={() => setGoalModal(false)} />
      <DepositModal
        open={!!depModal}
        mode={depModal?.mode || "create"}
        initial={depModal?.initial}
        onClose={() => setDepModal(null)}
      />
    </section>
  );
}

/* ==================================================================== */
export function FinancePage({ chartMode = "area" }) {
  const fin = useFinance();
  if (!fin) return null;

  return (
    <div className="fin-page">
      <div className="fin-page-head">
        <h1 className="fin-page-title">理財規劃</h1>
        <span className="fin-page-month">{currentMonthLabel()}</span>
      </div>

      {/* 左欄兩卡（趨勢/分類）等高堆疊；右欄用絕對定位把高度綁定左欄、上下平分，
          兩欄接縫因此對齊。左欄趨勢卡的折線圖會 flex 填滿，與分類卡同高。 */}
      <div className="fin-page-grid">
        <div className="fin-col fin-col-left">
          <FinanceTrendCard chartMode={chartMode} />
          <FinanceBreakdownCard />
        </div>
        <div className="fin-col-right">
          <div className="fin-col-right-inner">
            <TransactionOverview />
            <SavingGoalSection />
          </div>
        </div>
      </div>
    </div>
  );
}
