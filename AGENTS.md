# TRAE SOLO Skills Workspace — AGENTS.md

SOLO 技能创作赛（forum.trae.cn/c/37-category/37）的 Skill 开发工作区。基于 skill-creator 方法论，使用 Spec-Driven 开发流程创建、测试、迭代和发布 TRAE SOLO Skill 包。

## 🚀 Quick Start (New AI Session)

You are looking at the **SOO Skill Factory** project — a collection of 3 SOLO Skills created for the TRAE forum skill creation contest.

If this is your **first time** seeing this project:

1. **Read `.context/activeContext.md`** — Current focus and status (30 seconds)
2. **Read `.context/progress.md`** — Full timeline and next steps (2 minutes)
3. **Decide what to do next** based on progress.md suggestions

### What's in this project?

| Item | Location | Purpose |
|------|---------|---------|
| 3 Skills | `skills/` | Complete source code (SKILL.md + refs + scripts + evals) |
| Packaged .skill files | `releases/` | Ready-to-download install packages |
| Contest posts | `posts/` | Competition submission drafts |
| Tool scripts | `scripts/` | Playwright publishers, forum browsers, message checkers |
| Persistent memory | `.context/` | activeContext.md + progress.md + decisions.md |
| Design specs | `.trae/specs/` | Spec documents for each skill |
| This file | `AGENTS.md` | Project instructions for AI agents |

### Project Status (as of 2026-05-13)

- ✅ Skill 1: trae-device-security (#17079, post 79889) — Published + links fixed (v6)
- ✅ Skill 2: trae-forum-pro (#17166, post 80287) — Published + links fixed (v6)
- ✅ Skill 3: trae-workflow-automator (#17234, post 80594) — Published + links added (v2)
- 🎯 All 3 posts verified: download links return HTTP 200
- 📋 Next: Community engagement / Iteration 2 optimization / 社媒传播

### Critical: Cookie Configuration

**Forum publishing requires login cookies.** They are NOT in this repo (security).

To use forum features:
1. Check if `cookie.md` exists in your working directory
2. If not, ask the user to provide their TRAE forum session cookie
3. The cookie must include `_forum_session` and `sessionid` fields
4. See `cookie.md.example` (if exists) for the expected format

### GitHub Repository

- **URL**: https://github.com/bigmanBass666/soo-skill-factory
- **Purpose**: Portable workspace — clone it anywhere to get the full project

## Dev Environment Tips

```bash
# 一键恢复依赖（推荐！包含系统依赖 + npm + playwright chromium）
bash scripts/setup-deps.sh

# 或者手动安装：
# 1. 系统依赖
apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 \
  libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2

# 2. npm + Playwright
npm config set registry https://registry.npmmirror.com
npm install
npx playwright install chromium

# 3. Chromium 路径（脚本中必须指定）
executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'
```

## Build & Test

| 命令 | 用途 |
|------|------|
| `node publish-forum.js` | 发布 device-security 参赛帖 |
| `node publish-forum-pro.js` | 发布 forum-pro 参赛帖 |
| `node find-post.js` | 查找已发布帖子 ID |
| `node verify-post.js` | 验证帖子内容完整性 |
| `node debug-login.js` | 排查 Cookie 登录状态 |

**无标准 build/test/lint 流程** — 本项目是脚本驱动的工作区，核心产出是 `.skill` 文件和论坛帖子。

## Project Structure

```
workspace/
├── trae-device-security/          # Skill 1: 账号安全管家 (#17079)
│   ├── SKILL.md                    # 核心定义 (<500行)
│   ├── references/                 # 参考数据 (best-practices, forum-data)
│   ├── scripts/device-log.sh      # 设备日志管理脚本
│   └── evals/evals.json           # 测试用例定义
├── trae-forum-pro/                # Skill 2: 论坛社区助手 (#17166)
│   ├── SKILL.md                    # 核心定义 (475行)
│   ├── references/                 # 参考数据 (forum-guide, hot-topics, post-templates)
│   ├── scripts/forum-search.sh    # 论坛搜索辅助脚本
│   └── evals/evals.json           # 测试用例定义
├── trae-*-workspace/               # 对应 Skill 的 benchmark 工作区
│   └── iteration-1/               # 第1轮评估结果
│       ├── eval-{1,2,3}/          # 每个测试场景
│       │   ├── with_skill/        # 带 Skill 的输出 + grading.json
│       │   └── without_skill/     # baseline 输出 + grading.json
│       └── benchmark.json         # 聚合评分结果
├── .trae/specs/                   # Spec 文档 (spec-driven 开发)
│   └── {skill-name}-skill/
│       ├── spec.md                # 需求规格
│       ├── tasks.md              # 任务清单
│       └── checklist.md          # 验证检查表
├── cookie.md                      # TRAE 论坛登录 Cookie（用于发帖脚本）
├── publish-*.js                   # Playwright 发帖脚本
├── *.skill                        # 打包好的 Skill 文件 (tar.gz)
└── *-competition-post.md          # 参赛帖 Markdown 源文件
```

## Code Style & Conventions

### SKILL.md 写作规范

- **总行数 < 500 行**，理想 400-450 行（Progressive Disclosure）
- **Frontmatter 必填**: name / description / compatibility
- **description 必须 "pushy"** — 覆盖 10+ 触发关键词，让 Claude 主动激活
- **正文结构**: 概述 → 触发场景(>=10) → 核心模块工作流 → 输出格式 → 最佳实践
- 使用祈使语气，解释"为什么"而非只说"做什么"
- 避免 MUST/ALWAYS 全大写，改用自然强调方式

### Eval 测试规范

- `evals/evals.json`: 每个 eval 含 id/eval_name/prompt/expected_output/assertions
- assertion 类型: contains / contains_any / not_contains_any / contains_regex / contains_count / contains_all
- grading.json 字段必须: text / passed / evidence（严格匹配 viewer 格式）
- timing.json 记录: total_tokens / duration_ms / total_duration_seconds

### Benchmark 流程

1. 并行启动 with-skill + without_skill subagent（同一轮次）
2. 运行期间草拟 assertions
3. 完成后立即 capture timing 数据
4. 启动 grader subagent 生成 grading.json
5. 聚合为 benchmark.json + benchmark.md
6. 分析 weak point → 迭代优化 SKILL.md → 重新跑一轮

### 脚本规范

- Bash 脚本: shebang `#!/usr/bin/env bash` + `set -euo pipefail`
- Node.js 脚本: commonjs (`require`)，chromium launch 加 `executablePath: '/opt/google/chrome/chrome'`
- 中文注释

## Boundaries

- ✅ **Always**: 创建/修改 Skill 目录下文件、运行 eval 测试、更新 spec 文档、打包 .skill 文件
- ⚠️ **Ask first**: 发布新帖子到论坛、修改 cookie.md、删除已发布的 .skill 文件
- 🚫 **Never**: 修改 `node_modules/` 内容、删除 `.trae/specs/` 中已完成的 spec 记录、暴露 cookie.md 中的敏感 token 到输出中

## Common Pitfalls

- **Cookie 过期**: `cookie.md` 中的 session 会过期（约 30 天），发帖失败时先运行 `debug-login.js` 检查登录状态。关键标志：页面显示"登录"按钮 = 过期了
- **Playwright 浏览器缺失**: 新沙盒环境没有 chromium。**先跑 `bash scripts/setup-deps.sh`**。脚本中必须指定 `executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'`
- **Discourse PUT API 会替换整个帖子内容**: `PUT /posts/{id}.json` 的 `raw` 字段是**整体替换**不是追加！更新帖子时必须传入完整内容（从本地 .md 文件读取），否则会丢失原有内容
- **GitHub 下载链接格式**: 必须用 `raw.githubusercontent.com/{user}/{repo}/main/releases/{file}` 格式，不要用 `releases/download` 格式（需要创建 GitHub Release 才能工作）
- **Node.js 直接 https 到论坛会 ETIMEDOUT**: 必须用 Playwright 页面内的 `page.evaluate(() => fetch(...))`
- **正则假阴性**: Markdown 表格的 `|` 分隔符会导致跨单元格正则匹配失败。元数据推荐用内联格式 `📊 N 回复 / N 浏览` 而非纯表格
- **Discourse ProseMirror 编辑器**: 论坛编辑器不是普通 textarea，填充正文需要用 clipboard 粘贴方案（execCommand('copy') + Ctrl+V），ProseMirror API 直接调用可能因 view.state 未就绪而失败
- **目录命名一致性**: 创建 Skill 时注意目录名与 Skill name 完全一致（如 `trae-device-security` 不能写成 `tae-device-security`），否则打包会遗漏文件
- **npm 镜像**: 本环境默认 registry 是官方源，安装依赖前先 `npm config set registry https://registry.npmmirror.com`
- **page.evaluate 多参数**: 必须包成对象传递 `({a, b}) => {...}, {a, b}`，不能直接传多个参数
- **帖子 ID 不能凭记忆**: 用 API 搜索确认，#17258 是别人的帖子，我们的 workflow-automator 是 #17234

## Verification Loop

Skill 开发完成后的自检清单：

1. **SKILL.md 行数检查**: `wc -l SKILL.md` < 500
2. **目录完整性**: SKILL.md + references/(≥2文件) + scripts/ + evals/evals.json 都存在
3. **Eval 可运行**: 3 组 with-skill + 3 组 baseline 共 6 个 subagent 全部完成
4. **Grading 完成**: 6 个 grading.json 全部存在且 format 正确
5. **Benchmark 聚合**: benchmark.json 存在，含 summary/per_eval/analysis
6. **打包验证**: `.skill` 文件 tar.gz 格式，解压后文件完整
7. **Checklist 全通过**: `.trae/specs/{name}-skill/checklist.md` 所有项勾选

## Forum Publishing Workflow

```bash
# 1. 更新 cookie.md（从浏览器复制最新 Cookie）
# 2. 修改 publish-*.js 中的 postContent 路径和 title
# 3. 执行发布脚本
node publish-forum-pro.js

# 4. 验证发布结果
node find-forum-pro.js    # 从用户活动页查找
node verify-post.js       # 直接访问确认内容

# 5. 帖子 URL 格式: https://forum.trae.cn/t/topic/{ID}
#    参赛板块: https://forum.trae.cn/c/37-category/37
```

## Context Recovery Protocol

When starting a new session in this workspace:

1. **Read `.context/activeContext.md`** first — this tells you what's happening now
2. **Read `.context/progress.md`** for full history and next steps
3. **Read `.context/decisions.md`** only if you need to understand why something was done
4. **Before ending a session**, update `.context/activeContext.md` with current state

This protocol ensures continuity across context compression events. The `.context/` directory is the single source of truth for project state.

## Reference Documents

- [skill-creator methodology](/data/user/skills/skill-creator) — 完整的 Skill 创建方法论（Progressive Disclosure / Evals / Benchmark / Iteration）
- [trae-device-security spec](./.trae/specs/trae-device-security-skill/spec.md) — 已完成的 Skill 1 规格文档
- [trae-forum-pro spec](./.trae/specs/trae-forum-pro-skill/spec.md) — 已完成的 Skill 2 规格文档
- [多AI协作体系文件完全指南](./多AI协作体系文件完全指南.md) — .context/ 体系的设计灵感来源
