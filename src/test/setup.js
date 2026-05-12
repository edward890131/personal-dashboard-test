// Vitest 全域 setup：
// - 加入 jest-dom 的 matchers，讓測試可以使用 toBeInTheDocument 等斷言
// - 每個測試結束後自動清理 React Testing Library 的 DOM
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom 沒有 ResizeObserver；Sparkline / ValueChart 在 mount 時會用，補一個 stub
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  cleanup();
});
