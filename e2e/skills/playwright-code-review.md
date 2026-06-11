# Skill: Playwright Code Review

Review the `actual/e2e/` Playwright framework for correctness, reliability, and convention compliance. Report findings by risk level. Do not modify any file unless the user explicitly says "fix it."

---

## How to invoke

```
/playwright-code-review [scope]
```

- **No argument** — reviews all of `e2e/` (excluding `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `.auth/`)
- **File or glob** — e.g., `/playwright-code-review pages/` or `/playwright-code-review tests/account-transaction-balance.spec.ts`

---

## Agent instructions

### 1. Resolve scope

If the user supplied a path or glob, read only those files. Otherwise read:

- `pages/*.ts`
- `tests/*.spec.ts`
- `fixtures/test-fixtures.ts`
- `utils/*.ts`
- `api/*.ts`

Do not read `node_modules/`, `dist/`, `.auth/`, or any generated report directory.

### 2. Apply the review checklist

Go through every category below. Record each finding as a bullet with the file path, the offending line or pattern, and a one-sentence explanation.

---

#### Page objects (`pages/`)

| Check | Pass condition |
| --- | --- |
| No `expect()` calls | Page objects expose actions only; all assertions live in spec files |
| Locators are `readonly` fields | Assigned in the constructor; not `get` accessor properties |
| Extends `BasePage` | Every page class calls `super(page)` and uses `this.getByTestId` / `this.getByRole` |
| Action methods return `Promise<void>` | Explicit return type on every `async` method |
| No direct `@playwright/test` imports for locators | Uses helpers from `BasePage` instead |
| Constructor assigns dependent locators in order | A locator that chains another (e.g., `this.rows = this.table.getByTestId('row')`) comes after its parent |

#### Tests (`tests/*.spec.ts`)

| Check | Pass condition |
| --- | --- |
| Imports `test` and `expect` from `../fixtures/test-fixtures` | Never from `@playwright/test` directly |
| Cleanup in `afterEach`, not in test body | Ensures cleanup runs even on failure |
| Cleanup wrapped in `.catch(() => {})` | Prevents cleanup errors masking the original failure |
| Entity names include `Date.now()` | Prevents collisions across parallel workers |
| No `test.only` or `test.skip` committed | Focused/skipped tests must not reach the repository |
| No `test.describe.configure({ mode: 'serial' })` | Serial mode defeats parallelism; refactor instead |

#### Locator strategy

| Check | Pass condition |
| --- | --- |
| `data-testid` preferred | `getByTestId` used where the attribute is available |
| ARIA role + name as fallback | `getByRole('button', { name: '...' })` over CSS |
| No positional CSS selectors | No `.nth-child`, `:nth-of-type`, or positional XPath |
| No text match on financial amounts | `$500.00` text varies with locale/rounding |
| Locators scoped to a parent when multiple matches exist | `table.getByTestId('row')` not `page.getByTestId('row')` |

#### Waits and timing

| Check | Pass condition |
| --- | --- |
| No `page.waitForTimeout()` | Use `waitFor({ state })`, `waitForURL`, `waitForLoadState`, or `expect(locator).toBeVisible()` |
| `waitFor()` used before reading locator text | Ensures async data fetch completes before assertion |
| Timeouts use the config defaults | Local magic numbers (`timeout: 5000`) avoided unless config value is insufficient |

#### Assertions

| Check | Pass condition |
| --- | --- |
| All async assertions awaited | `await expect(locator).toBeVisible()` — missing `await` is a silent no-op |
| No `expect()` outside test / hook body | `playwright/no-standalone-expect` must pass |
| Assertions placed after the action they verify | Read top-to-bottom: act → assert |

#### TypeScript

| Check | Pass condition |
| --- | --- |
| No `any` (explicit or implicit) | `@typescript-eslint/no-explicit-any` must pass |
| Explicit return types on public methods | `async createAccount(): Promise<void>` not inferred |
| `interface` for data model shapes | Not `type` aliases |
| `import { type Foo }` for type-only imports | Erased at runtime; keeps bundle clean |
| No non-null assertions (`!`) | Use proper guards or `await expect(el).toBeVisible()` before access |

#### Parallel safety

| Check | Pass condition |
| --- | --- |
| No module-level mutable state | Variables shared across tests in the same module must be `let` inside `describe` and reset in `beforeEach` |
| `Date.now()` in every generated entity name | Account names, payee names, etc. |
| No reliance on demo budget having specific pre-existing data | Tests create their own accounts |

---

### 3. Output format

Group all findings under three headings. If a category has no findings, write "None."

```
## 🔴 High — will cause test failures or data corruption
- [file:line] Description of the issue

## 🟡 Medium — likely flakiness or maintainability issue
- [file:line] Description of the issue

## 🟢 Low — style or convention gap
- [file:line] Description of the issue

## Summary
X High, Y Medium, Z Low findings across N files.
```

### 4. Non-modification guarantee

After reporting findings, stop. Do **not** edit, create, or delete any file.

If the user responds with "fix it" (or "fix all", or references specific findings), proceed to fix only the issues mentioned, following the same constraints that apply to the rest of `actual/e2e/`:
- Do not modify application source code
- Keep all changes under `actual/e2e/`
- Run `npm run typecheck && npm run lint` after any edits and report the result
