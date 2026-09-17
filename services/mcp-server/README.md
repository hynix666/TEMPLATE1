# mcp-server

An [MCP](https://modelcontextprotocol.io) server that gives an AI assistant three tools over the task API: `list_tasks`, `create_task` and `move_task`. It speaks the protocol over stdio, so a client starts it as a subprocess.

It is the same architecture as the services beside it, with the transport changed ([ADR-0007](../../docs/adr/0007-mcp-server-as-an-adapter.md)): `src/domain` holds the rules, `src/application` the use cases behind an outbound port, `src/adapters` the two things that touch the outside world — the HTTP client that calls the task API, and the MCP layer that publishes the use cases as tools — and `src/main.ts` wires them. `npm run check:boundaries` fails the build when a layer reaches past its allowlist.

The rules are repeated here rather than imported from another module ([ADR-0004](../../docs/adr/0004-independent-modules.md)), and they earn their place: an illegal status move is refused here, with the legal moves named, instead of reaching the model as a 409 it usually retries.

## Run it

```bash
npm install
npm start          # serves over stdio; the task API must be running
```

Register it with a client — for Claude Code, `claude mcp add tasks -- node /absolute/path/to/services/mcp-server/src/main.ts`, or the equivalent entry in another client's configuration:

```json
{
  "mcpServers": {
    "tasks": {
      "command": "node",
      "args": ["/absolute/path/to/services/mcp-server/src/main.ts"],
      "env": { "TASK_API_URL": "http://localhost:8080" }
    }
  }
}
```

| Variable | Default | Meaning |
|---|---|---|
| `TASK_API_URL` | `http://localhost:8080` | Where the task API is. Must be an absolute http or https URL |
| `TASK_API_TIMEOUT_MS` | `10000` | How long one API call may take before it is abandoned |

A value it cannot use stops the process at startup. A server that starts and then fails every tool call is worse than one that never started: the model keeps trying.

**Nothing is ever written to stdout.** On a stdio server stdout is the protocol channel, and one stray `console.log` corrupts the stream. Diagnostics go to stderr.

## Tools

| Tool | Input | Answers with |
|---|---|---|
| `list_tasks` | — | Every task, its status, and the moves that status allows |
| `create_task` | `title` | The created task, in `todo` |
| `move_task` | `id`, `status` | The moved task, or which moves are legal from where it is |

A failure the caller can act on — a broken rule, an unreachable API — comes back as a tool result with `isError: true` and the reason. Only a bug here throws, because a thrown error reaches the model as a protocol error it cannot inspect.

## Check

```bash
npm run verify    # import boundaries, type-check, tests
```

The tests drive the server through a real MCP client over an in-memory transport pair, so a tool that is registered but unreachable — a bad schema, a handler that throws — fails here rather than in someone's editor.

## Container

```bash
docker build --tag mcp-server .
docker run --rm -i --env TASK_API_URL=http://host.docker.internal:8080 mcp-server
```

`-i` matters: the protocol is stdin and stdout.
