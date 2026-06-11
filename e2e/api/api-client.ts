import { type APIRequestContext } from '@playwright/test';
import type { SyncServerHealthResponse } from '../interfaces/api';

/**
 * ApiClient wraps Playwright's `APIRequestContext` for HTTP interactions
 * with the Actual Budget application.
 *
 * ## Why there is no API seeding for accounts or transactions
 *
 * Actual Budget is a local-first application. All budget data (accounts,
 * transactions, categories) is stored in a SQLite database that lives inside
 * the browser's **Origin Private File System (OPFS)**. The OPFS is completely
 * opaque to HTTP — there is no REST endpoint that reads or writes it.
 *
 * The browser page communicates with the SQLite backend through a private
 * Worker message-passing protocol (`send('api/account-create', ...)`). This
 * protocol is an internal implementation detail; it is not versioned, not
 * documented for external use, and not reachable from outside the browser
 * context.
 *
 * The `@actual-app/api` Node.js package *does* expose `createAccount`,
 * `addTransactions`, `deleteTransaction`, etc., but it depends on
 * `better-sqlite3` (a native binary module) and can only run in a Node.js
 * process. It cannot be imported or called from a browser-based Playwright
 * test context.
 *
 * The sync-server (when running) exposes endpoints for file-level sync
 * (`/sync`, `/sync/upload-user-file`, etc.), but these operate on entire
 * budget files — not individual accounts or transactions.
 *
 * ## What this client is for
 *
 * Use `ApiClient` for lightweight HTTP checks only:
 * - Verify the dev server is reachable before running tests (`isAppReachable`)
 * - Check sync-server health when `E2E_SYNC_SERVER_URL` is set (`syncServerHealth`)
 *
 * All test data setup and teardown must use page objects via the UI.
 * See `best-practices.md §11` for the canonical approach.
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Checks whether the Vite dev server (or built static server) is reachable.
   * Useful in `beforeAll` hooks to fail fast before attempting UI setup.
   */
  async isAppReachable(): Promise<boolean> {
    try {
      const response = await this.request.get(this.baseUrl, {
        timeout: 5_000,
        failOnStatusCode: false,
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Checks the sync-server health endpoint if a sync server URL is configured.
   * Returns `null` when no sync server is configured.
   */
  async syncServerHealth(): Promise<SyncServerHealthResponse | null> {
    const serverUrl = process.env.E2E_SYNC_SERVER_URL;
    if (!serverUrl) return null;

    const response = await this.request.get(`${serverUrl}/health`, {
      timeout: 5_000,
      failOnStatusCode: false,
    });

    if (!response.ok()) return null;

    return response.json() as Promise<SyncServerHealthResponse>;
  }

  /**
   * Fetches the app shell HTML and returns the response status.
   * A 200 confirms the static server is correctly serving the SPA.
   */
  async getAppShellStatus(): Promise<number> {
    const response = await this.request.get(this.baseUrl, { failOnStatusCode: false });
    return response.status();
  }
}
