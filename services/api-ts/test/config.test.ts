import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigError, loadConfig } from "../src/config.ts";

test("defaults apply when nothing is set", () => {
  assert.deepEqual(loadConfig({}), { port: 8080, shutdownTimeoutMs: 10_000 });
});

test("valid values are read", () => {
  assert.deepEqual(loadConfig({ PORT: "9000", SHUTDOWN_TIMEOUT: "3s" }), { port: 9000, shutdownTimeoutMs: 3000 });
  assert.equal(loadConfig({ SHUTDOWN_TIMEOUT: "500ms" }).shutdownTimeoutMs, 500);
});

test("values that cannot be used are refused", () => {
  for (const env of [{ PORT: "http" }, { PORT: "0" }, { PORT: "65536" }, { PORT: "80.5" }, { SHUTDOWN_TIMEOUT: "10" }, { SHUTDOWN_TIMEOUT: "0s" }]) {
    assert.throws(() => loadConfig(env), ConfigError, JSON.stringify(env));
  }
});
