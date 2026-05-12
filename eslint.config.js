// ESLint flat config：JavaScript + React 18 + Prettier 整合
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    // 不檢查的目錄
    ignores: ["dist", "node_modules", ".vite", "coverage", "_trash-design-system"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: "18.3" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // 容忍以 _ 開頭的未用變數
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // React 19 不需要 import React，這條警告關掉
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // Prettier 必須最後，覆蓋掉與排版相關的規則
  prettierConfig,
];
