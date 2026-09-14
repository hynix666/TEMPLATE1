export interface Config {
  readonly port: number;
  readonly shutdownTimeoutMs: number;
}

export class ConfigError extends Error {}

const UNIT_MS: Readonly<Record<string, number>> = { h: 3_600_000, m: 60_000, s: 1000, ms: 1 };

/**
 * Go's duration syntax — `10s`, `1m30s`, `1.5s`, `500ms` — for the units a timeout needs, so the
 * value api-go accepts is the value this service accepts. Null when the text is not a duration.
 */
export function parseDurationMs(raw: string): number | null {
  if (!/^(\d+(\.\d+)?(ms|h|m|s))+$/.test(raw)) return null;
  let total = 0;
  for (const [, amount, unit] of raw.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    total += Number(amount) * (UNIT_MS[unit ?? ""] ?? Number.NaN);
  }
  return Math.round(total);
}

/**
 * Reads configuration once, at startup, and refuses values it cannot use rather than falling back
 * silently. Variable names and formats match api-go, so both services deploy the same way.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const rawPort = env["PORT"] ?? "";
  // Digits only, as strconv.Atoi reads them: Number() would also take "0x1F90", "8e3" and " 8080".
  const port = rawPort === "" ? 8080 : /^[+-]?\d+$/.test(rawPort) ? Number(rawPort) : Number.NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be an integer from 1 to 65535, got "${rawPort}"`);
  }

  const rawTimeout = env["SHUTDOWN_TIMEOUT"] ?? "";
  const shutdownTimeoutMs = rawTimeout === "" ? 10_000 : parseDurationMs(rawTimeout);
  if (shutdownTimeoutMs === null || !(shutdownTimeoutMs > 0)) {
    throw new ConfigError(`SHUTDOWN_TIMEOUT must be a positive duration such as 10s, 1m30s or 500ms, got "${rawTimeout}"`);
  }

  return { port, shutdownTimeoutMs };
}
