# Next steps — exercises, source entry points, further reading

> **Where you are:** past the six stages. This file is a launch pad, not a lesson.

---

## 1. Check yourself

You have finished the pack if you can answer these without looking:

1. Why does MCP put the approval gate in the **host** rather than in the server or the protocol?
2. What exactly does capability negotiation at `initialize` buy you that runtime feature-detection would not?
3. A server needs the user to pick between three options mid-operation. Which primitive, and what must have happened earlier for it to be legal?
4. When should a failure be a JSON-RPC error and when should it be `isError: true`? Which one does a bad enum value produce with the TypeScript SDK — and why is that the right call?
5. Your server returns 5,000 rows and the model gets confused. Name three fixes, in order of how much they help.
6. What stops a token issued for server A from being replayed against server B?
7. Why must a stdio server never write to stdout, and what symptom does violating it produce?
8. `resources` or `tools` — where does "the current on-call rotation" belong, and why?

Answers are in [dive 01 §2.3](05-deep-dives/01-host-claude-code.md), [dive 02 §2.2](05-deep-dives/02-mcp-client.md), [dive 04 §2.5](05-deep-dives/04-mcp-server.md), [dive 04 §2.2](05-deep-dives/04-mcp-server.md), [dive 04 §2.6](05-deep-dives/04-mcp-server.md), [dive 05 §2.1](05-deep-dives/05-auth-and-trust.md), [dive 03 §2.1](05-deep-dives/03-transport.md), [dive 04 §2.1](05-deep-dives/04-mcp-server.md).

## 2. Build something, in this order

1. **Run the example.** [examples/README.md](examples/README.md) — install, connect Claude Code, then drive the raw protocol with `printf` until the frames stop looking mysterious.
2. **Write a 40-line server** for something you actually need: your team's runbook as a resource, one query tool against a dev database, one prompt encoding a procedure you repeat.
3. **Give it a bad description on purpose**, watch the model misuse it, then fix the prose. Nothing teaches tool design faster.
4. **Add elicitation** to a tool that changes something, and feel the difference between "the model asked" and "the server insisted".
5. **Move it to Streamable HTTP** and add OAuth. This is where a hobby server becomes an org-wide one, and where [dive 05](05-deep-dives/05-auth-and-trust.md) stops being theory.

## 3. Source entry points

When the spec and reality disagree, read the code in this order:

| What you want to understand | Where to look |
|---|---|
| The normative protocol | The specification on `modelcontextprotocol.io` — read *lifecycle*, then *tools*, then *authorization*; skim the rest |
| How a server is actually assembled | `@modelcontextprotocol/sdk` (TypeScript) — `server/mcp.ts` for `registerTool`/`registerResource`/`registerPrompt`, `server/stdio.ts` and `server/streamableHttp.ts` for the transports |
| How a client drives a session | The same SDK's `client/index.ts` — the request table, timeouts, progress and cancellation live here |
| What frames really cross the wire | The **MCP Inspector** (`npx @modelcontextprotocol/inspector <your server command>`) |
| Host-side configuration and permissions | `claude mcp --help`, `claude mcp list`, and your `settings.json` `permissions` block — plus `/mcp` inside a session |
| Reference server implementations | The `modelcontextprotocol/servers` repository — read the small ones first; the filesystem server is a good model of tool granularity |

## 4. Further reading, ranked by return on effort

1. **The specification's *Authorization* page.** Short, and the part most implementations get wrong.
2. **The *Security best practices* page.** Confused deputy, token passthrough, session hijacking — the attacks named in [dive 05](05-deep-dives/05-auth-and-trust.md), stated normatively.
3. **The Claude Code MCP documentation.** Scopes, `.mcp.json`, `--mcp-config`, `--strict-mcp-config`, `MAX_MCP_OUTPUT_TOKENS`, plugin-bundled servers.
4. **The LSP (Language Server Protocol) specification.** MCP's ancestor. Reading the two side by side makes MCP's choices look inevitable rather than arbitrary.
5. **Any two reference servers, diffed.** Tool granularity is a taste you acquire by comparison, not by rule.

## 5. Where this pack deliberately stopped

So you know what you still do not know:

- **Protocol revisions after `2025-06-18`.** The concepts here are stable, but newer revisions add features; check what your SDK negotiates and read that revision's changelog.
- **Server-side scaling.** Session affinity, stateless mode behind a load balancer, and connection limits are deployment topics this pack only gestured at ([dive 03 §2.2](05-deep-dives/03-transport.md)).
- **Registries and distribution.** How servers get discovered, published and version-pinned across an org.
- **Evaluating tool design.** Measuring whether a model actually uses your server well — the discipline that turns a working server into a good one.

---

## 📦 Source repository

This page is one part of an open guide pack. The whole serial — every diagram source, and a **runnable MCP server** you can point Claude Code at — lives in one repository:

### → https://github.com/geekchow/mcp-explain

| | |
|---|---|
| This page's source | [`mcp-guide/07-next-steps.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/07-next-steps.md) |
| Runnable example server | [`mcp-guide/examples/orders-db-server`](https://github.com/geekchow/mcp-explain/tree/main/mcp-guide/examples/orders-db-server) |
| Start of the serial | [`mcp-guide/00-overview.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/00-overview.md) |

Clone it and follow along:

```bash
git clone https://github.com/geekchow/mcp-explain.git
cd mcp-explain/mcp-guide/examples/orders-db-server && npm install && node index.js
```

Corrections are welcome — open an issue if a protocol detail has drifted with a newer MCP revision.

↑ back to [00-overview.md](00-overview.md)
