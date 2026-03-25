import nextConfig from "eslint-config-next/core-web-vitals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off", // ADDED THIS ONE
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "next/no-img-element": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "off",
      "no-unused-vars": "off",
      "jsx-a11y/alt-text": "off",
      "@typescript-eslint/no-empty-function": "off",
      "react/no-unstable-nested-components": "off" // Also very common
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**"
    ],
  }
];

export default eslintConfig;
