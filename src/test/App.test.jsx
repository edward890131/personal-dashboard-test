// 範例測試：確認 App 可以渲染、抓到 brand 文字
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App.jsx";

describe("App", () => {
  it("會渲染 Dayboard brand", () => {
    render(<App />);
    expect(screen.getByText("Dayboard")).toBeInTheDocument();
  });
});
