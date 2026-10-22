// Fast lint tier. Everything here runs without type information, which is
// what keeps it quick enough for a pre-commit hook. The rules that need the
// type checker live in eslint.typed.config.mjs and run on their own script.
//
// Rule files in eslint-rules/ are copied verbatim from
// soumatheusgomes/vibe-coding-toolkit (templates/eslint). Do not edit them in
// place; recopy all three from one revision when updating.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX, { createNodeResolver } from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

const testFiles = [
  "**/*{.,-}{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
  "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
];

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
      // The worker, hooks, CLI and scripts run on Node and Bun. The viewer
      // gets browser globals in its own block below.
      globals: {
        ...globals.node,
        Bun: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strict,

  {
    // The viewer is a browser bundle (see src/ui/viewer/tsconfig.json).
    files: ["src/ui/viewer/**/*.{ts,tsx}", "tests/ui/viewer/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    // Curated subset rather than the whole preset; the viewer source already
    // carries eslint-disable comments for exhaustive-deps.
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    // import-x resolves TypeScript paths so no-unresolved is accurate. The
    // no-restricted-paths zone is the architecture boundary: the browser
    // viewer talks to the worker over HTTP and must never import server-side
    // code (storage, services, server, supervisor) directly.
    plugins: { "import-x": importX },
    settings: {
      // The Node resolver is a fallback for packages whose wildcard
      // "exports" subpaths the TypeScript resolver misses (@modelcontextprotocol/sdk).
      "import-x/resolver-next": [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
    },
    rules: {
      // bun:* modules are runtime built-ins with nothing on disk to resolve.
      "import-x/no-unresolved": ["error", { ignore: ["^bun:"] }],
      "import-x/no-duplicates": "error",
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/ui/viewer/**/*",
              from: [
                "./src/storage/**/*",
                "./src/services/**/*",
                "./src/server/**/*",
                "./src/supervisor/**/*",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The size and complexity budget is all "warn" on purpose. These
      // numbers are a conversation starter about factoring, not a gate --
      // promote one to "error" once the count for it reaches zero.
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-params": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["warn", 3],
      "quality/max-lines": ["error", { max: 350 }],
      "quality/no-direct-console": [
        "error",
        { logger: "logger from src/utils/logger.ts" },
      ],
      // There is no single exported DB client; data access goes through the
      // raw drivers (bun:sqlite Database, pg Pool/Client) wrapped by
      // repositories in src/storage and src/services/sqlite. The viewer is
      // the only presentation layer and must never touch a driver.
      "quality/no-direct-data-access": [
        "error",
        {
          modules: ["bun:sqlite", "pg"],
          bindings: ["Database", "Pool", "Client"],
          layers: ["/src/ui/viewer/"],
          extensions: [".tsx"],
        },
      ],
    },
  },
  // Measured adoption baseline (2026-10-22, first run of `npm run lint`).
  // Every rule here had violations when the gate was installed, so it starts
  // at "warn" with the count beside it. A rule goes back to "error" once its
  // count reaches zero. Rules not listed had zero violations and stay
  // "error". Both blocks sit BEFORE the "off" overrides below so those
  // overrides still win.
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    rules: {
      "quality/max-lines": "warn", // baseline: 102 files over 350 lines
      "quality/no-direct-console": "warn", // baseline: 663
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // baseline: 2026
      "@typescript-eslint/no-non-null-assertion": "warn", // baseline: 906
      "prefer-const": "warn", // baseline: 609
      "@typescript-eslint/no-unused-vars": "warn", // baseline: 232
      "@typescript-eslint/no-unused-expressions": "warn", // baseline: 168
      "@typescript-eslint/no-dynamic-delete": "warn", // baseline: 132
      "@typescript-eslint/no-require-imports": "warn", // baseline: 52
      "no-var": "warn", // baseline: 43
      "no-empty": "warn", // baseline: 33
      "@typescript-eslint/no-unsafe-function-type": "warn", // baseline: 24
      "import-x/no-duplicates": "warn", // baseline: 20
      "no-control-regex": "warn", // baseline: 19
      "@typescript-eslint/no-invalid-void-type": "warn", // baseline: 11
      "no-useless-escape": "warn", // baseline: 10
      "@typescript-eslint/no-useless-constructor": "warn", // baseline: 5
      "@typescript-eslint/no-extraneous-class": "warn", // baseline: 5
      "no-irregular-whitespace": "warn", // baseline: 3
      "@typescript-eslint/no-this-alias": "warn", // baseline: 3
      "no-fallthrough": "warn", // baseline: 3
      "@typescript-eslint/ban-ts-comment": "warn", // baseline: 2
      "no-func-assign": "warn", // baseline: 1
      "no-unexpected-multiline": "warn", // baseline: 1
      "no-unsafe-finally": "warn", // baseline: 1
      "require-yield": "warn", // baseline: 1
    },
  },
  {
    // The log adapter itself. This block MUST come after the block that turns
    // the rule on: for a file matched by both, flat config applies the later
    // block's rules last, so an "off" placed earlier is silently overridden.
    files: ["src/utils/logger.ts"],
    rules: {
      "quality/no-direct-console": "off",
    },
  },
  {
    // Config change, not a cleanup: in the CLI commands and the per-IDE
    // installers, console output IS the user-facing terminal output, not
    // logging. Same ordering requirement as the block above.
    files: [
      "src/npx-cli/**/*.{ts,tsx,js,mjs,cjs}",
      "src/services/integrations/*Installer*.ts",
    ],
    rules: {
      "quality/no-direct-console": "off",
    },
  },
  {
    // The same file budget for test files, at "warn". Also placed after the
    // "error" block for the same ordering reason. Two glob branches, because
    // a file counts as a test either by suffix or by directory -- and the
    // suffix branch alone misses test-support files that live in __tests__/
    // without being *.test.ts themselves.
    files: testFiles,
    plugins: { quality },
    rules: {
      "quality/max-lines": ["warn", { max: 350, includeTests: true }],
    },
  },
  {
    files: testFiles,
    rules: {
      // These three fire heavily on describe/it nesting and on long arrange
      // sections without pointing at a real problem. complexity, max-depth
      // and max-params stay on for tests -- they were not part of the noise.
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
      // no-restricted-paths has no concept of a test file the way the
      // quality/* rules do.
      "import-x/no-restricted-paths": "off",
    },
  },
  {
    // Config change: CommonJS files cannot use `import`, so the rule has no
    // valid fix there. Applies to every *.cjs file in the repo.
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.commonjs },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".claude/**",
    ".github/agents/**",
    ".github/hooks/**",
    ".github/skills/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.tsbuildinfo",
    "package-lock.json",
    // Built plugin output (committed bundles produced by npm run build).
    "plugin/**",
    // Vendored, minified third-party bundle (see vendor/provenance.json).
    "src/integrations/dsh-plugin/vendor/**",
    // Separate packages with their own package.json and dependencies.
    "dsh/**",
    "openclaw/**",
    "services/sync-api/**",
    "workers/sync-hub/**",
  ]),
]);
