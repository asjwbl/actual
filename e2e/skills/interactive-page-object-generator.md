# Skill: Interactive Page Object Generator

Guided, interactive workflow for creating a new Playwright page object and matching spec file for an Actual Budget feature. The agent asks targeted questions, optionally inspects the running app with Playwright MCP, generates the files, and runs lint and type checks before finishing.

---

## How to invoke

```
/interactive-page-object-generator
```

No arguments needed — the skill asks everything it needs interactively.

---

## Agent instructions

### Phase 1: Information gathering

Ask the following questions **one at a time**. Wait for the user's answer before asking the next.

1. **Target feature and route**
   > "What feature or UI section do you want to test? Include the URL route if you know it (e.g., 'Schedules page at `/schedules`')."

2. **User steps**
   > "List the user actions the test should perform, in order. For example: 1. Click 'Add new schedule'. 2. Fill in payee 'Netflix'. 3. Click 'Save'."

3. **Assertions**
   > "What should be true after each step? List the assertions (e.g., 'The schedule row for Netflix appears in the list')."

4. **Reference files** *(optional)*
   > "Are there existing page objects or tests I should follow as a pattern? Leave blank to use `pages/budget-page.ts` and `tests/account-transaction-balance.spec.ts` as defaults."

Read the reference files the user names (or the defaults) before generating any code. They establish the naming and structural conventions to replicate.

---

### Phase 2: Browser inspection

**If Playwright MCP is available:**

1. Navigate to the target route: `http://localhost:3001<route>`
2. For each element mentioned in the user's steps and assertions, capture:
   - Its `data-testid` attribute (preferred)
   - Its ARIA role and accessible name (fallback)
   - Its label text (for form inputs)
3. Note any React Aria patterns that may require special interaction helpers (see `utils/react-helpers.ts`)

**If Playwright MCP is not available:**

Ask the user:
> "I don't have browser access. Can you paste the relevant `data-testid` values or HTML snippets for the elements I'll need to interact with? Or share a screenshot if that's easier."

Do not proceed to Phase 3 without at least the element identifiers needed to build the locators.

---

### Phase 3: Generation

#### 3a. Page object — `pages/<feature>-page.ts`

Follow this structure exactly (see `pages/budget-page.ts` for a complete example):

```typescript
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class <Feature>Page extends BasePage {
  // Declare all locators as readonly fields
  readonly <locatorName>: Locator;

  constructor(page: Page) {
    super(page);
    // Assign independent locators first
    this.<locatorName> = this.getByTestId('<testid>');
    // Assign dependent locators (those that chain another) after their parent
  }

  // Action methods: async, explicit Promise<void> return type, no expect()
  async <actionName>(<params>): Promise<void> {
    // ...
  }
}
```

Rules:
- Locators are `readonly` fields, not `get` properties
- No `expect()` calls anywhere in the page object
- Use `this.getByTestId()` / `this.getByRole()` / `this.getByLabel()` from `BasePage`
- File name: kebab-case (e.g., `schedules-page.ts`)
- If interacting with React Aria components, import helpers from `../utils/react-helpers`

#### 3b. Test spec — `tests/<feature>.spec.ts`

Follow this structure:

```typescript
import { test, expect } from '../fixtures/test-fixtures';
// Import any data generators needed
import { generateAccountData } from '../test-data/test-data';

test.describe('<Feature description>', () => {
  // Track created entity names for cleanup
  let created<Entity>Name: string;

  test.afterEach(async ({ <relevantPage>, page }) => {
    // Cleanup: best-effort, don't mask original failure
    if (created<Entity>Name && /* url check */) {
      await <relevantPage>.<cleanupMethod>().catch(() => {});
    }
  });

  test('<scenario description>', async ({ budgetPage, <feature>Page }) => {
    // Arrange: generate unique test data
    const data = { name: `<Entity> ${Date.now()}`, ... };
    created<Entity>Name = data.name;

    // Act → Assert in sequence
    // ...
  });
});
```

Rules:
- Import `test` and `expect` from `../fixtures/test-fixtures`, never from `@playwright/test`
- Entity names always include `Date.now()` for parallel safety
- All assertions live in the spec, never in page objects
- Cleanup runs in `afterEach` with `.catch(() => {})`

#### 3c. Fixture entry (if needed)

If the new page object should be available as a named fixture, add it to `fixtures/test-fixtures.ts` following the existing pattern:

```typescript
<featurePage>: async ({ page }, use) => {
  await use(new <Feature>Page(page));
},
```

#### 3d. Setup and cleanup strategy

- **API setup available** (`ApiClient` has a relevant endpoint): use `apiClient` fixture for setup/teardown — it's faster and more reliable than UI setup
- **No stable API**: use `navigateToBudget` pattern from `fixtures/test-fixtures.ts` + UI actions in `beforeEach`
- **OPFS data** (budget, accounts, transactions): always UI-driven since OPFS is not exposed via API

---

### Phase 4: Post-generation checks

Run these commands from `e2e/` in order:

```bash
npm run typecheck   # must exit 0
npm run lint        # must exit 0
```

If the app is running on `localhost:3001`, also run:

```bash
npx playwright test tests/<feature>.spec.ts
```

Fix any TypeScript errors, lint errors, or test failures before reporting completion. Do not hand back a result with known broken code.

---

### Phase 5: Report

After all checks pass, report:

```
## Files created
- pages/<feature>-page.ts
- tests/<feature>.spec.ts
- [fixtures/test-fixtures.ts — updated] (if applicable)

## Locators used
| Element | Strategy | Selector |
| --- | --- | --- |
| ... | testid / role / label | ... |

## Lint result
✅ 0 errors, 0 warnings

## TypeScript result
✅ No errors

## Test result
✅ N passed (or: ⚠️ app not running — run `npx playwright test tests/<feature>.spec.ts` manually)
```

---

## Constraints

- Do not modify application source code (`packages/`, `src/` outside `e2e/`)
- Keep all changes under `actual/e2e/`
- Follow [best-practices.md](../best-practices.md) for all generated code
- Do not add `// @ts-strict-ignore` to any new file
