# Runnable example — the `orders-db` server

> **Where you are:** the hands-on companion to the [running example](../04-running-example.md).
> **After this file you will know:** how to start this server, connect Claude Code to it, and watch every primitive in the guide fire for real.

This is the `orders-db` server from the running example, complete and runnable. It ships an **in-memory dataset**, so there is no database to set up — the two places you would swap in real Postgres are marked `<< REAL DB >>` in `orders-db-server/index.js`.

It exposes all three server primitives on purpose, so one server exercises the whole protocol:

| Primitive | Name | Used at |
|---|---|---|
| Resource | `schema://orders/tables` | example step 4 |
| Tool | `query_orders` (read-only, structured output) | example step 5 |
| Tool | `get_order` (demonstrates a *tool* error written for the model) | — |
| Prompt | `triage-stuck-orders` | the team's procedure, shipped with the integration |

---

## 1. Install

```bash
cd orders-db-server
npm install
```

## 2. Run it under Claude Code

From this `examples/` directory (it contains a `.mcp.json` pointing at the server):

```bash
claude
```

then:

```
> /mcp
  orders-db  ✔ connected (stdio)  2 tools · 1 resource · 1 prompt

> /mcp__orders-db__triage-stuck-orders 24
```

Things worth trying, each of which makes one part of the guide concrete:

| Try this | What you are watching |
|---|---|
| `@orders-db:schema://orders/tables` | a **resource** being attached by the *user*, with no approval prompt — reads are not actions ([dive 04 §2.3](../05-deep-dives/04-mcp-server.md)) |
| "how many orders are stuck in PENDING_PAYMENT over 24h?" | the model choosing `query_orders` from its description, then the **approval gate** ([dive 01 §2.3](../05-deep-dives/01-host-claude-code.md)) |
| "get order ord_9x" | a **tool error** the model recovers from instead of a crash ([dive 04 §2.2](../05-deep-dives/04-mcp-server.md)) |
| `/mcp__orders-db__triage-stuck-orders` | a **prompt** — server-authored expertise, invoked by the human ([dive 04 §2.4](../05-deep-dives/04-mcp-server.md)) |

To register it globally instead of via this directory's `.mcp.json`:

```bash
claude mcp add orders-db --scope local -- node "$PWD/orders-db-server/index.js"
claude mcp list
```

## 3. Or drive the raw protocol yourself

The most instructive five minutes you can spend: talk JSON-RPC to it by hand. Because the transport is stdio, the "client" can be `printf`.

```bash
cd orders-db-server
{
  printf '%s\n' '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","clientInfo":{"name":"probe","version":"1"},"capabilities":{"elicitation":{},"sampling":{},"roots":{"listChanged":true}}}}'
  sleep 0.4
  printf '%s\n' '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  printf '%s\n' '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"query_orders","arguments":{"status":"PENDING_PAYMENT","older_than_hours":24}}}'
  printf '%s\n' '{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"query_orders","arguments":{"status":"pending"}}}'
  sleep 1
} | node index.js
```

Actual output from that probe (abridged, and the source of the transcripts quoted in the guide):

```jsonc
// id=0 — version and capability negotiation ([dive 02 §2.2](../05-deep-dives/02-mcp-client.md))
{"result":{"protocolVersion":"2025-06-18","capabilities":{"resources":{"listChanged":true},"tools":{"listChanged":true},"prompts":{"listChanged":true}},
           "serverInfo":{"name":"orders-db","version":"1.4.0"},"instructions":"Read-only access to …"}}

// id=1 — runtime discovery: nothing was compiled into the client
{"result":{"tools":[{"name":"query_orders",…},{"name":"get_order",…}]}}

// id=4 — text for the model to read + structuredContent for machines
{"result":{"content":[{"type":"text","text":"7 orders in PENDING_PAYMENT older than 24h:\n  ord_88f21     49.99 EUR     31h …"}],
           "structuredContent":{"count":7,"orders":[…]}}}

// id=8 — invalid enum: an isError *result*, so the MODEL sees the allowed values
{"result":{"content":[{"type":"text","text":"MCP error -32602: Input validation error: Invalid arguments for tool query_orders: Invalid enum value. Expected 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'CANCELLED' | 'REFUNDED', received 'pending' at status"}],
           "isError":true}}
```

Meanwhile the server's own logs went to **stderr**, never stdout:

```
[orders-db] ready on stdio (in-memory dataset, no database required)
[orders-db] query_orders status=PENDING_PAYMENT older_than=24h → 7 rows
```

Prove to yourself why that matters: add a `console.log("hello")` to `index.js` and re-run. The session dies on a parse error — the classic first-MCP-server bug, diagnosed in [dive 03 §2.1](../05-deep-dives/03-transport.md).

## 4. The MCP Inspector

```bash
npm run inspect     # npx @modelcontextprotocol/inspector node index.js
```

A browser UI that speaks the protocol for you: list and call tools, read resources, render prompts, and watch every frame. This is the tool to reach for when a server misbehaves under Claude Code and you need to know whether the bug is yours or the host's.

---

## Exercises

1. **Add a tool** `count_by_status` returning one row per status. Notice how you must write the description so the model knows to prefer it over `query_orders` — that prose *is* the API.
2. **Make an error teach.** Change `get_order`'s error text to a bare `"not found"` and watch the model retry the same bad id instead of switching tools.
3. **Add a resource template** `orders://order/{order_id}` and see it appear under `resources/templates/list`.
4. **Break the transport on purpose** with a stray `console.log`, read the failure, then fix it. You will only make that mistake once.
5. **Add elicitation:** a `cancel_order` tool that confirms with the user before acting — the `payments` pattern from [dive 04 §4](../05-deep-dives/04-mcp-server.md), on a server you control.

---

## 📦 Source repository

This page is one part of an open guide pack. The whole serial — every diagram source, and a **runnable MCP server** you can point Claude Code at — lives in one repository:

### → https://github.com/geekchow/mcp-explain

| | |
|---|---|
| This page's source | [`mcp-guide/examples/README.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/examples/README.md) |
| Runnable example server | [`mcp-guide/examples/orders-db-server`](https://github.com/geekchow/mcp-explain/tree/main/mcp-guide/examples/orders-db-server) |
| Start of the serial | [`mcp-guide/00-overview.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/00-overview.md) |

Clone it and follow along:

```bash
git clone https://github.com/geekchow/mcp-explain.git
cd mcp-explain/mcp-guide/examples/orders-db-server && npm install && node index.js
```

Corrections are welcome — open an issue if a protocol detail has drifted with a newer MCP revision.

↑ back to [the running example](../04-running-example.md) · [the guide index](../00-overview.md)
