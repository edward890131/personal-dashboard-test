// ui.jsx — 理財功能共用 UI 元件（單一來源）
// 對外輸出：Modal、ToastProvider/useToast、ConfirmProvider/useConfirm、Field、CategoryPicker、fmtMoney
// 樣式對齊既有設計系統（.icon-btn / .btn-primary / .btn-secondary / var(--scrim) 等）。
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { allCategories, finCatVar, finCatSoft, finCatBorder } from "./finance-categories.js";

/* ---------------- 金額千分位格式化 ----------------
   一律先 Math.round 再格式化，避免浮點殘留（對齊 PRD 第 10 節） */
export function fmtMoney(n) {
  return Math.round(Number(n) || 0).toLocaleString("en-US");
}

/* ---------------- Modal（共用彈窗外殼） ----------------
   置中 + 半透明遮罩，點遮罩或 Esc 關閉；內容區可捲動，footer 放底部按鈕。 */
export function Modal({ open, onClose, title, children, footer, width = 460 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-h">
          <span className="modal-title">{title}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="關閉"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
          >
            <i className="ph ph-x"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Toast（單例，全站共用） ----------------
   useToast() 取得 toast(message, type)；type: 'success' | 'info' | 'error'。
   2.6 秒後自動消失，畫面角落堆疊。 */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);
  const icon = (type) =>
    type === "error" ? "ph-warning-circle" : type === "info" ? "ph-info" : "ph-check-circle";
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`ph ${icon(t.type)}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------------- ConfirmDialog（單例，promise 式） ----------------
   useConfirm() 取得 confirm({ title, message, confirmText, danger }) → Promise<boolean>。
   用於刪除等需要二次確認的操作（對齊 PRD 4.4 / 5.5 / 第 8 節）。 */
const ConfirmCtx = createContext(() => Promise.resolve(false));
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmText, danger, resolve }
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({ confirmText: "確認", danger: false, ...opts, resolve });
      }),
    [],
  );
  const close = (result) => {
    if (state) state.resolve(result);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={state?.title || "確認"}
        width={380}
        footer={
          state && (
            <>
              <button type="button" className="btn-secondary" onClick={() => close(false)}>
                取消
              </button>
              <button
                type="button"
                className={state.danger ? "btn-danger" : "btn-primary"}
                onClick={() => close(true)}
              >
                {state.confirmText}
              </button>
            </>
          )
        }
      >
        <p className="confirm-msg">{state?.message}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/* ---------------- Field（表單欄位：label 在上 + 錯誤提示） ---------------- */
export function Field({ label, error, children, htmlFor }) {
  return (
    <label className="fin-field" htmlFor={htmlFor}>
      <span className="lbl">{label}</span>
      {children}
      {error && <span className="err">{error}</span>}
    </label>
  );
}

/* ---------------- CategoryPicker（彩色類別標籤，單選，全部平鋪可換行） ----------------
   選中態：填入該類別淡底 + 類別色外框（對齊 PRD 4.3 / 參考圖）。 */
export function CategoryPicker({ type, value, onChange }) {
  const cats = allCategories(type);
  return (
    <div className="cat-grid">
      {cats.map((c) => {
        const on = value === c.key;
        return (
          <button
            type="button"
            key={c.key}
            className={`cat-tag ${on ? "on" : ""}`}
            onClick={() => onChange(c.key)}
            style={
              on
                ? {
                    background: finCatSoft(c),
                    borderColor: finCatBorder(c),
                    color: finCatVar(c),
                  }
                : undefined
            }
          >
            <span className="emoji">{c.emoji}</span>
            <span>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
