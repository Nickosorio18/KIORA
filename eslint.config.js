import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules"] },

  // Node.js files (Vite config + serverless API)
  {
    files: ["vite.config.js", "api/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // React / browser source files
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react: reactPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Mark JSX element identifiers as "used" so they aren't flagged
      "react/jsx-uses-vars": "error",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Context files export both Provider + hook — this pattern is intentional
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },

  // Context/hooks files export both Provider + hook — react-refresh warning is a false positive here
  // Must come AFTER the main React config block so it overrides the warn set above
  {
    files: ["src/context/**/*.{js,jsx}", "src/hooks/**/*.{js,jsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
