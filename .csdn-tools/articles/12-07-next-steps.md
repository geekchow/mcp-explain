# MCP 模型上下文协议：十二、自测、练习与源码入口

> 🇬🇧 English version: [mcp-guide/07-next-steps.md](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/07-next-steps.md) ｜ 📦 GitHub: <https://github.com/geekchow/mcp-explain>

> **你在哪里：** 六个阶段之后。这一篇是发射台，不是课程。

---

## 一、自测

如果下面这些你能不翻书答上来，这个系列你就算读完了：

1. MCP 为什么把审批闸门放在**宿主**，而不是服务器或协议里？
2. initialize 时的能力协商，究竟买到了运行时特性探测买不到的什么？
3. 某个服务器需要用户在操作中途从三个选项里挑一个。用哪个原语？而且**在此之前**必须发生过什么，它才是合法的？
4. 什么时候该用 JSON-RPC 错误，什么时候该用 `isError: true`？在 TypeScript SDK 里，一个非法的枚举值会产生哪一种——为什么那才是对的选择？
5. 你的服务器返回了 5000 行，模型被绕晕了。按帮助程度从大到小说出三个修法。
6. 是什么阻止了签发给服务器 A 的令牌被重放到服务器 B？
7. stdio 服务器为什么绝不能往 stdout 写东西？违反了会表现出什么症状？
8. "当前值班排班表"该做成**资源**还是**工具**？为什么？

答案分别在[深入 01 §2.3](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/01-host-claude-code.md)、[深入 02 §2.2](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/02-mcp-client.md)、[深入 04 §2.5](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/04-mcp-server.md)、[深入 04 §2.2](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/04-mcp-server.md)、[深入 04 §2.6](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/04-mcp-server.md)、[深入 05 §2.1](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/05-auth-and-trust.md)、[深入 03 §2.1](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/03-transport.md)、[深入 04 §2.1](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/04-mcp-server.md)。

## 二、动手做，按这个顺序

1. **把示例跑起来。** 见 [examples/README.md](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/examples/README.md)——安装、连上 Claude Code，然后用 `printf` 直接手搓协议，直到那些报文不再神秘。
2. **写一个 40 行的服务器**，做你真正需要的事：把团队的操作手册做成资源、一个针对开发库的查询工具、一个把你反复重复的流程编码下来的提示。
3. **故意给它写一段糟糕的描述**，看着模型用错，然后改好那段文字。没有比这更快的工具设计教学法。
4. **给一个会改动状态的工具加上征询**，亲身体会"模型问了一下"和"服务器坚持要问"之间的差别。
5. **把它迁到 Streamable HTTP 并加上 OAuth。** 这是一个玩具服务器变成组织级服务器的分水岭，也是[深入 05](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/05-auth-and-trust.md)不再是理论的时刻。

## 三、源码入口

当规范和现实打架时，按这个顺序读代码：

| 你想搞懂什么 | 去哪看 |
|---|---|
| 规范本身 | `modelcontextprotocol.io` 上的规范——先读 *lifecycle*，再读 *tools*，然后 *authorization*；其余略读 |
| 一个服务器实际是怎么组装的 | `@modelcontextprotocol/sdk`（TypeScript）——`server/mcp.ts` 看 `registerTool`/`registerResource`/`registerPrompt`，`server/stdio.ts` 和 `server/streamableHttp.ts` 看传输 |
| 客户端如何驱动一个会话 | 同一个 SDK 的 `client/index.ts`——请求表、超时、进度与取消都在这里 |
| 线上到底跑的是什么报文 | **MCP Inspector**（`npx @modelcontextprotocol/inspector <你的服务器命令>`） |
| 宿主侧的配置与权限 | `claude mcp --help`、`claude mcp list`，以及你 `settings.json` 里的 `permissions` 块——再加上会话里的 `/mcp` |
| 参考实现 | `modelcontextprotocol/servers` 仓库——先读小的；filesystem 服务器是工具粒度的好范本 |

## 四、延伸阅读（按投入产出排序）

1. **规范的 *Authorization* 那一页。** 很短，而且是绝大多数实现做错的那部分。
2. **规范的 *Security best practices* 那一页。** 混淆代理、令牌透传、会话劫持——[深入 05](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/05-auth-and-trust.md)点名过的攻击，在这里有规范性的表述。
3. **Claude Code 的 MCP 文档。** 作用域、`.mcp.json`、`--mcp-config`、`--strict-mcp-config`、`MAX_MCP_OUTPUT_TOKENS`、插件打包的服务器。
4. **LSP（Language Server Protocol，语言服务器协议）规范。** MCP 的前辈。两份规范并排读，会让 MCP 的选择显得必然，而不是任意。
5. **随便挑两个参考服务器做 diff。** 工具粒度是一种靠比较养成的品味，不是靠规则。

## 五、本系列刻意停在哪里

好让你知道自己还不知道什么：

- **`2025-06-18` 之后的协议修订版。** 这里的概念是稳定的，但更新的修订版会加特性；查一下你的 SDK 协商的是哪个版本，读那个版本的变更说明。
- **服务端扩缩容。** 会话亲和性、负载均衡后的无状态模式、连接数限制，这些部署话题本系列只是点到（[深入 03 §2.2](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/05-deep-dives/03-transport.md)）。
- **注册中心与分发。** 服务器如何在一个组织内被发现、发布和版本锁定。
- **评估工具设计。** 衡量模型是否真的用好了你的服务器——这门功夫才能把一个能跑的服务器变成一个好服务器。

---

## 📦 配套代码仓库

本文是一个开源指南系列的一部分。整个系列、全部图表源码，以及一个可以直接让 Claude Code 连上去的**可运行 MCP 服务器**，都在同一个仓库里：

### → https://github.com/geekchow/mcp-explain

| | |
|---|---|
| 本页源文件 | [`mcp-guide-zh/07-next-steps.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/07-next-steps.md) |
| 英文原版 | [`mcp-guide/07-next-steps.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide/07-next-steps.md) |
| 可运行示例服务器 | [`mcp-guide/examples/orders-db-server`](https://github.com/geekchow/mcp-explain/tree/main/mcp-guide/examples/orders-db-server) |
| 系列起点 | [`mcp-guide-zh/00-overview.md`](https://github.com/geekchow/mcp-explain/blob/main/mcp-guide-zh/00-overview.md) |

欢迎指正——如果某个协议细节随新版本发生了变化，欢迎提 issue。


