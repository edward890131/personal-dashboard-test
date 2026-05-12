import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// 樣式：Tailwind 與原本 styles.css 一併載入
// Phosphor Icons：原本是 CDN，現在改用 npm 安裝的 CSS
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/bold";
import "./styles.css";
import "./tailwind.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
