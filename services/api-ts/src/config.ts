export interface Config {
  readonly port: number;
  readonly shutdownTimeoutMs: number;
}

export class ConfigError extends Error {}

/**
 * Reads configuration once, at startup, and refuses values it cannot use rather than falling back
 * silently. Variable names and formats match api-go, so both services deploy the same way.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const rawPort = env["PORT"] ?? "";
  const port = rawPort === "" ? 8080 : Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be an integer from 1 to 65535, got "${rawPort}"`);
  }

  const rawTimeout = env["SHUTDOWN_TIMEOUT"] ?? "";
  const timeout = /^(\d+)(ms|s)$/.exec(rawTimeout);
  if (rawTimeout !== "" && (timeout === null || Number(timeout[1]) === 0)) {
    throw new ConfigError(`SHUTDOWN_TIMEOUT must be a positive duration such as 10s or 500ms, got "${rawTimeout}"`);
  }
  const shutdownTimeoutMs = timeout === null ? 10_000 : Number(timeout[1]) * (timeout[2] === "s" ? 1000 : 1);

  return { port, shutdownTimeoutMs };
}
