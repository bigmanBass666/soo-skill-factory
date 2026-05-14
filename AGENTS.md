# SOO Skill Factory — AGENTS.md

SOLO 技能创作赛的 Skill 开发工作区。3个已发布的 TRAE SOLO Skill（device-security / forum-pro / workflow-automator），基于 skill-creator Spec-Driven 方法论开发。

**GitHub**: https://github.com/bigmanBass666/soo-skill-factory | **状态**: 见 [`.context/activeContext.md`](./.context/activeContext.md)

## Quick Start (New AI Session)

1. `bash scripts/setup-deps.sh` — 一键恢复所有依赖（chromium + npm + 系统依赖）
2. Read `.context/activeContext.md` — 当前状态和上下文（30秒）
3. Read `.context/progress.md` — 完整时间线和下一步（2分钟）

### Cookie（发帖必需）

论坛发布需要登录凭证，**不在仓库中**。检查 `/workspace/cookie.md` 是否存在，不存在则请用户提供 TRAE forum session cookie（需包含 `_forum_session` 和 `sessionid` 字段，每行一个 `name=value` 对）。

## Dev Environment Tips

```bash
bash scripts/setup-deps.sh          # 一键恢复全部依赖（推荐）
bash scripts/setup-deps.sh --skip-apt  # 跳过系统依赖（仅npm+chromium）
```

Node.js 脚本中 Playwright 启动必须指定:
```javascript
executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'
```

## Build & Test

| 命令 | 用途 |
|------|------|
| `node scripts/publish-forum.js` | 发布 device-security 参赛帖 |
| `node scripts/publish-forum-pro.js` | 发布 forum-pro 参赛帖 |
| `node scripts/publish-workflow-automator.js` | 发布 workflow-automator 参赛帖 |
| `node scripts/find-post.js` | 查找已发布帖子 ID |
| `node scripts/check-messages-api.js` | 检查论坛消息 API 状态 |

**无标准 build/test/lint 流程** — 本项目是脚本驱动的工作区，核心产出是 `.skill` 文件和论坛帖子。

## Project Structure

```
workspace/
├── skills/                        # 3个 SOLO Skill 源码
│   ├── trae-device-security/      # #17079 账号安全管家
│   ├── trae-forum-pro/            # #17166 论坛社区助手
│   └── trae-workflow-automator/   # #17234 工作流自动化
├── releases/                      # 打包好的 .skill 安装包
├── posts/                         # 参赛帖 Markdown 源文件
├── scripts/                       # 工具脚本 (setup-deps.sh / publish-*.js)
├── cache/                         # Playwright chromium 缓存 tar.gz (98MB, clone自带)
├── .context/                      # 持久化上下文 (activeContext + progress + decisions)
├── .trae/specs/                   # Spec 文档 (spec-driven 开发记录)
└── cookie.md                      # 论坛登录 Cookie（不入库, .gitignore排除）
```

每个 Skill 目录结构: `SKILL.md` + `references/(≥2文件)` + `scripts/` + `evals/evals.json`

## Code Style & Conventions

### SKILL.md 写作规范

- **总行数 < 500 行**，理想 400-450 行（Progressive Disclosure）
- **Frontmatter 必填**: name / description / compatibility
- **description 必须 "pushy"** — 覆盖 10+ 触发关键词，让 Claude 主动激活
- **正文结构**: 概述 → 触发场景(≥10) → 核心模块工作流 → 输出格式 → 最佳实践
- 使用祈使语气，解释"为什么"而非只说"做什么"
- 避免 MUST/ALWAYS 全大写，改用自然强调方式

### Eval & Benchmark

- `evals/evals.json`: 每个 eval 含 id/eval_name/prompt/expected_output/assertions
- assertion 类型: contains / contains_any / not_contains_any / contains_regex / contains_count / contains_all
- grading.json 必须含: text / passed / evidence（严格匹配 viewer 格式）
- **Benchmark 流程**: 并行 with-skill vs baseline subagent → grader → benchmark.json → 迭代优化。详见 skill-creator 方法论

### 脚本规范

- Bash: shebang `#!/usr/bin/env bash` + `set -euo pipefail`
- Node.js: commonjs (`require`)，中文注释
- npm 安装前先 `npm config set registry https://registry.npmmirror.com`

## Boundaries

- ✅ **Always**: 创建/修改 Skill 目录下文件、运行 eval 测试、更新 spec 文档、打包 .skill 文件
- ⚠️ **Ask first**: 发布新帖子到论坛、修改 cookie.md、删除已发布的 .skill 文件
- 🚫 **Never**: 修改 `node_modules/` 内容、删除 `.trae/specs/` 中已完成的 spec 记录、暴露 cookie.md 中的敏感 token 到输出中

## Common Pitfalls

- **Cookie 过期**: session 约30天过期，发帖失败先检查 cookie.md 是否有效。页面显示"登录"按钮 = 过期了
- **Playwright 浏览器缺失**: 新沙盒无 chromium。**先跑 `bash scripts/setup-deps.sh`**
- **Discourse PUT API 会替换整个帖子内容**: `PUT /posts/{id}.json` 的 `raw` 是**整体替换**不是追加！必须从本地 .md 读完整内容推送
- **GitHub 下载链接格式**: 必须用 `raw.githubusercontent.com/{user}/{repo}/main/releases/{file}`，不要用 `releases/download`（404）
- **Node.js 直接 https 到论坛会 ETIMEDOUT**: 必须用 `page.evaluate(() => fetch(...))`
- **正则假阴性**: Markdown 表格的 `|` 导致跨单元格匹配失败，元数据用内联格式 `📊 N 回复/N 浏览`
- **Discourse ProseMirror 编辑器**: 不是普通 textarea，用 clipboard 粘贴方案（execCommand('copy') + Ctrl+V）
- **目录命名一致性**: Skill 目录名必须与 name 完全一致（`trae-device-security` ≠ `tae-device-security`），否则打包遗漏文件
- **npm 镜像**: 默认 registry 是官方源，安装前先 `npm config set registry https://registry.npmmirror.com`
- **page.evaluate 多参数**: 必须包成对象 `({a, b}) => {...}, {a, b}`，不能直接传多个参数
- **帖子 ID 不能凭记忆**: #17258 是别人的帖子，我们的 workflow-automator 是 **#17234**

## Verification Loop

Skill 开发完成后的自检清单：

1. `wc -l SKILL.md` < 500
2. 目录完整: SKILL.md + references/(≥2) + scripts/ + evals/evals.json
3. 6组 eval 全部完成 (3 with-skill + 3 baseline)
4. 6个 grading.json 存在且 format 正确
5. benchmark.json 含 summary/per_eval/analysis
6. `.skill` 文件 zip 格式，解压后完整
7. `.trae/specs/{name}-skill/checklist.md` 全通过

## Forum Publishing Workflow

| 步骤 | 命令 |
|------|------|
| 更新 cookie.md | 从浏览器复制最新 Cookie 到 `/workspace/cookie.md` |
| 发布 | `node scripts/publish-forum-pro.js`（在 scripts/ 目录下执行） |
| 验证 | `node scripts/find-post.js` → `curl -sI` 确认链接 HTTP 200 |
| 帖子URL | `https://forum.trae.cn/t/topic/{ID}` |

## Context Recovery Protocol

新会话开始时：`.context/activeContext.md` → `.context/progress.md` → `.context/decisions.md`（按需）。结束前更新 activeContext.md 当前状态。

## Reference Documents

- [trae-device-security spec](./.trae/specs/trae-device-security-skill/spec.md) — Skill 1 规格文档
- [trae-forum-pro spec](./.trae/specs/trae-forum-pro-skill/spec.md) — Skill 2 规格文档
