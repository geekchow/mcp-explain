#!/usr/bin/env python3
"""Build CSDN-ready articles from mcp-guide-zh/.

CSDN posts are standalone pages: relative links must become absolute, and every
article needs the serial's common title prefix. Source pages are never modified
(the csdn-publish skill's rule) -- output goes to .csdn-tools/articles/.
"""
import os, re, json, pathlib

ROOT   = pathlib.Path(__file__).resolve().parent.parent
SRC    = ROOT / "mcp-guide-zh"
OUT    = ROOT / "articles" if False else ROOT / ".csdn-tools" / "articles"
REPO   = "https://github.com/geekchow/mcp-explain"
BLOB   = REPO + "/blob/main/"
PREFIX = "MCP 模型上下文协议"

# order -> (source file, article topic used in the title)
SERIAL = [
    ("00-overview.md",                    "一、总览与全景概念图"),
    ("01-why.md",                         "二、它到底解决了什么问题"),
    ("02-what.md",                        "三、定义、边界与生态位"),
    ("03-concept-map.md",                 "四、概念地图 · 八个概念与五个组件"),
    ("04-running-example.md",             "五、贯穿示例 · Claude Code 排查滞留订单"),
    ("05-deep-dives/01-host-claude-code.md", "六、深入宿主 · Claude Code 如何管住 MCP"),
    ("05-deep-dives/02-mcp-client.md",    "七、深入客户端 · 握手与能力协商"),
    ("05-deep-dives/03-transport.md",     "八、深入传输层 · stdio 与 Streamable HTTP"),
    ("05-deep-dives/04-mcp-server.md",    "九、深入服务器 · 工具、资源与提示"),
    ("05-deep-dives/05-auth-and-trust.md","十、授权与信任边界 · OAuth 2.1"),
    ("06-walkthrough.md",                 "十一、完整走查 · 端到端全深度重跑"),
    ("07-next-steps.md",                  "十二、自测、练习与源码入口"),
]

def slug(src):            # 05-deep-dives/01-host.md -> 06-01-host
    return src.replace("/", "__").replace(".md", "")

def absolutize(text, src_rel):
    """Rewrite relative markdown links to absolute GitHub URLs."""
    src_dir = os.path.dirname(src_rel)
    def repl(m):
        label, link = m.group(1), m.group(2)
        if link.startswith(("http", "mailto", "#")):
            return m.group(0)
        anchor = ""
        if "#" in link:
            link, anchor = link.split("#", 1); anchor = "#" + anchor
        target = os.path.normpath(os.path.join("mcp-guide-zh", src_dir, link))
        return f"[{label}]({BLOB}{target}{anchor})"
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', repl, text)

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for i, (rel, topic) in enumerate(SERIAL, start=1):
        text = (SRC / rel).read_text()
        title = f"{PREFIX}：{topic}"
        # replace the H1 with the serial title
        text = re.sub(r'\A# .*?\n', f"# {title}\n", text, count=1)
        text = absolutize(text, rel)
        # the trailing nav line is meaningless on CSDN
        text = re.sub(r'\n(→ 下一篇：|↑ 返回).*$', "\n", text.rstrip()) + "\n"
        name = f"{i:02d}-{slug(rel)}.md"
        (OUT / name).write_text(text)
        manifest.append({"part": i, "file": name, "src": f"mcp-guide-zh/{rel}", "title": title})
    (OUT / "_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    return manifest

if __name__ == "__main__":
    m = build()
    for a in m:
        print(f"{a['part']:>2}  {a['file']:<44} {a['title']}")
