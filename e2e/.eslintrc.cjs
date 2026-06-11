/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'playwright'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:playwright/recommended',
  ],
  rules: {
    // ── TypeScript rules ──────────────────────────────────────────────────────
    // Enforce explicit return types on functions
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    // Disallow floating promises (critical in async Playwright tests)
    '@typescript-eslint/no-floating-promises': 'error',
    // Enforce awaiting all promises
    '@typescript-eslint/await-thenable': 'error',
    // Disallow explicit 'any'
    '@typescript-eslint/no-explicit-any': 'error',
    // Prefer interfaces over type aliases for object shapes
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    // Enforce consistent import style
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    // Disallow unused variables
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Use ?? instead of || for null/undefined guards
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    // Use ?. instead of && chains for member access
    '@typescript-eslint/prefer-optional-chain': 'error',

    // ── Standard rules ────────────────────────────────────────────────────────
    // No magic numbers (use named constants or test data generators)
    'no-magic-numbers': 'off',
    // Consistent spacing
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    // Enforce trailing commas
    'comma-dangle': ['error', 'always-multiline'],
    // Catch accidental console.log left in tests
    'no-console': 'warn',
    // Prefer const over let when variable is never reassigned
    'prefer-const': 'error',

    // ── Playwright rule overrides ─────────────────────────────────────────────
    // Upgrade from recommended's 'warn' — a focused test must never be committed
    'playwright/no-focused-test': 'error',
    // global.setup.ts uses intentional conditional branching inside the setup test
    // body (server-selection screen detection); this rule is too aggressive there
    'playwright/no-conditional-in-test': 'off',
    // react-helpers.ts uses locator.evaluate() intentionally to work around
    // React Aria DOM detachment under CI load (documented in the file)
    'playwright/no-eval': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'test-results/',
    'playwright-report/',
    '.auth/',
    '*.js',
  ],
};
