#!/usr/bin/env node
/**
 * orders-db — the MCP server from the running example in ../../04-running-example.md
 *
 * Offers all three server primitives so you can exercise the whole protocol:
 *   tools     : query_orders, get_order
 *   resources : schema://orders/tables
 *   prompts   : triage-stuck-orders
 *
 * It ships with an in-memory seed dataset so it runs with no database. The two
 * places you would swap in real Postgres are marked with  << REAL DB >>.
 *
 * Transport: stdio. Therefore the iron rule of this file:
 *   stdout belongs to the protocol. Every log line goes to stderr.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const log = (...args) => console.error("[orders-db]", ...args); // stderr, never stdout

// ─────────────────────────────────────────────────────────────────────────────
// Seed data  << REAL DB >>  replace with a read-only pg pool
// ─────────────────────────────────────────────────────────────────────────────

const HOUR = 3600 * 1000;
const ago = (h) => new Date(Date.now() - h * HOUR).toISOString();

const ORDERS = [
  { order_id: "ord_88f21", status: "PENDING_PAYMENT", amount_cents: 4999, currency: "EUR", customer: "c_1042", created_at: ago(31) },
  { order_id: "ord_88e04", status: "PENDING_PAYMENT", amount_cents: 1750, currency: "EUR", customer: "c_2210", created_at: ago(29) },
  { order_id: "ord_87ff2", status: "PENDING_PAYMENT", amount_cents: 8200, currency: "EUR", customer: "c_0087", created_at: ago(26) },
  { order_id: "ord_87c19", status: "PENDING_PAYMENT", amount_cents: 2399, currency: "EUR", customer: "c_3391", created_at: ago(25) },
  { order_id: "ord_87b03", status: "PENDING_PAYMENT", amount_cents:  990, currency: "EUR", customer: "c_1187", created_at: ago(25) },
  { order_id: "ord_879aa", status: "PENDING_PAYMENT", amount_cents: 13500, currency: "EUR", customer: "c_4402", created_at: ago(24.5) },
  { order_id: "ord_8798c", status: "PENDING_PAYMENT", amount_cents: 3100, currency: "EUR", customer: "c_0912", created_at: ago(24.2) },
  { order_id: "ord_8801a", status: "PENDING_PAYMENT", amount_cents: 6400, currency: "EUR", customer: "c_5510", created_at: ago(3) },
  { order_id: "ord_881bb", status: "PAID",            amount_cents: 2200, currency: "EUR", customer: "c_6621", created_at: ago(12) },
  { order_id: "ord_86aa1", status: "SHIPPED",         amount_cents: 7150, currency: "EUR", customer: "c_7732", created_at: ago(96) },
];

const SCHEMA_DDL = `-- shop.orders (read-only role: shop_ro)
CREATE TABLE orders (
  order_id     text PRIMARY KEY,           -- 'ord_' + 5 hex chars
  status       text NOT NULL,              -- PENDING_PAYMENT | PAID | SHIPPED | CANCELLED | REFUNDED
  amount_cents integer NOT NULL,           -- minor units; never a float
  currency     char(3) NOT NULL,
  customer     text NOT NULL REFERENCES customers(customer_id),
  created_at   timestamptz NOT NULL        -- order creation, NOT payment time
);
CREATE INDEX orders_status_created_idx ON orders (status, created_at);

-- Note: an order sitting in PENDING_PAYMENT means checkout completed but the
-- gateway never reported a capture. Always confirm with the payments service
-- before treating it as unpaid.`;

const STATUSES = ["PENDING_PAYMENT", "PAID", "SHIPPED", "CANCELLED", "REFUNDED"];

const ageHours = (o) => (Date.now() - Date.parse(o.created_at)) / HOUR;

const toRow = (o) => ({
  order_id: o.order_id,
  status: o.status,
  amount_cents: o.amount_cents,
  currency: o.currency,
  created_at: o.created_at,
  age_hours: Math.round(ageHours(o) * 10) / 10,
});

const renderTable = (rows) =>
  rows
    .map(
      (r) =>
        `  ${r.order_id}  ${(r.amount_cents / 100).toFixed(2).padStart(8)} ${r.currency}` +
        `  ${String(r.age_hours).padStart(5)}h  created ${r.created_at}`
    )
    .join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// Server
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "orders-db", version: "1.4.0" },
  {
    instructions:
      "Read-only access to the shop orders database. Prefer query_orders for " +
      "exploratory questions and get_order when you already know an order id. " +
      "PENDING_PAYMENT never means 'unpaid' on its own — confirm with the payments service.",
  }
);

// ── Resource: the schema the model reads before it queries (example step 4) ──
server.registerResource(
  "orders-schema",
  "schema://orders/tables",
  {
    title: "Orders database schema",
    description: "DDL and semantics for the orders table. Read this before writing filters.",
    mimeType: "text/plain",
  },
  async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/plain", text: SCHEMA_DDL }] })
);

// ── Tool: the query the model calls (example step 5) ─────────────────────────
server.registerTool(
  "query_orders",
  {
    title: "Query orders",
    description:
      "Find orders by status and age. Returns at most `limit` rows, oldest first. " +
      "Use for questions about which or how many orders are in a state; " +
      "use get_order when you already know one order id.",
    inputSchema: {
      status: z.enum(STATUSES).describe("Exact order status to match."),
      older_than_hours: z.number().min(0).optional().describe("Only orders created at least this many hours ago."),
      limit: z.number().min(1).max(200).default(50),
    },
    outputSchema: {
      count: z.number(),
      orders: z.array(
        z.object({
          order_id: z.string(),
          status: z.string(),
          amount_cents: z.number(),
          currency: z.string(),
          created_at: z.string(),
          age_hours: z.number(),
        })
      ),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  },
  async ({ status, older_than_hours = 0, limit }) => {
    // << REAL DB >> one parameterized statement, never string concatenation:
    //   SELECT ... FROM orders
    //    WHERE status = $1 AND created_at < now() - ($2 || ' hours')::interval
    //    ORDER BY created_at ASC LIMIT $3
    const rows = ORDERS.filter((o) => o.status === status && ageHours(o) >= older_than_hours)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      .slice(0, limit)
      .map(toRow);

    log(`query_orders status=${status} older_than=${older_than_hours}h → ${rows.length} rows`);

    const header =
      rows.length === 0
        ? `No orders in ${status}${older_than_hours ? ` older than ${older_than_hours}h` : ""}.`
        : `${rows.length} orders in ${status}${older_than_hours ? ` older than ${older_than_hours}h` : ""}:`;

    return {
      content: [{ type: "text", text: rows.length ? `${header}\n${renderTable(rows)}` : header }],
      structuredContent: { count: rows.length, orders: rows },
    };
  }
);

// ── Tool: single lookup, and a tool error written for the model to recover from
server.registerTool(
  "get_order",
  {
    title: "Get one order",
    description: "Fetch a single order by its exact id. Use query_orders if you do not have an id yet.",
    inputSchema: { order_id: z.string().describe("An order id, e.g. 'ord_88f21'.") },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  },
  async ({ order_id }) => {
    const o = ORDERS.find((x) => x.order_id === order_id);
    if (!o) {
      // A *tool* error, not a protocol error: the call was well-formed, the
      // operation failed, and the model can act on this message.
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              `No order '${order_id}'. Order ids look like 'ord_' followed by 5 hex ` +
              `characters. Use query_orders to list candidates by status.`,
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ ...toRow(o), customer: o.customer }, null, 2) }],
      structuredContent: { ...toRow(o), customer: o.customer },
    };
  }
);

// ── Prompt: the team's triage procedure, shipped with the integration ────────
server.registerPrompt(
  "triage-stuck-orders",
  {
    title: "Triage stuck orders",
    description: "The standard procedure for orders stuck in PENDING_PAYMENT.",
    argsSchema: { hours: z.string().optional().describe("Age threshold in hours (default 24).") },
  },
  ({ hours }) => {
    const h = hours ?? "24";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Triage orders stuck in PENDING_PAYMENT for more than ${h} hours.\n\n` +
              `Procedure — follow it in order:\n` +
              `1. Read schema://orders/tables so you use the right columns.\n` +
              `2. query_orders(status="PENDING_PAYMENT", older_than_hours=${h}).\n` +
              `3. For each order, check the charge state with the payments server BEFORE ` +
              `concluding anything. PENDING_PAYMENT does not mean unpaid.\n` +
              `4. Refund only charges the gateway reports as never captured. A settled ` +
              `charge with a stale order row goes to the finance reversal process instead — ` +
              `flag it, do not refund it.\n` +
              `5. Ask me before every refund, and report what you did and did not do.`,
          },
        },
      ],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
log("ready on stdio (in-memory dataset, no database required)");
