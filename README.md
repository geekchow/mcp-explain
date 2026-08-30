# mcp-explain

A learning pack for **MCP (Model Context Protocol，模型上下文协议)**, built with the Why → What → Concept map → Running example → Depth dives → Walkthrough progression, and held together by one realistic piece of work in Claude Code: triaging orders stuck in payment.

**Start here → [mcp-guide/00-overview.md](mcp-guide/00-overview.md)**

```
mcp-guide/
├── 00-overview.md            roadmap + mindmap of the whole territory
├── 01-why.md                 the N x M pain, and why function calling was not enough
├── 02-what.md                definition, boundaries, ecosystem position
├── 03-concept-map.md         8 concepts, 5 key players, coordination at a glance
├── 04-running-example.md     the spine: stuck-orders triage, traced shallowly
├── 05-deep-dives/            one dive per key player, each anchored to the example
│   ├── 01-host-claude-code.md    config scopes, namespacing, the approval gate
│   ├── 02-mcp-client.md          lifecycle, capability negotiation, client primitives
│   ├── 03-transport.md           stdio framing vs Streamable HTTP + SSE
│   ├── 04-mcp-server.md          tools, resources, prompts, and server design rules
│   └── 05-auth-and-trust.md      OAuth 2.1, and the attacks that actually happen
├── 06-walkthrough.md         the example re-run end to end at full depth
├── 07-next-steps.md          self-check, exercises, source entry points
└── examples/                 a RUNNABLE MCP server + Claude Code config
```

The example server in `mcp-guide/examples/orders-db-server/` runs with no database (`npm install && node index.js`) and exposes all three server primitives. Every protocol transcript quoted in the guide was captured from it.
