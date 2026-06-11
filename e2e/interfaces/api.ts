export interface SyncServerHealthResponse {
  status: 'ok' | 'degraded';
  uptime?: number;
  version?: string;
}
