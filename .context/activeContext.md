# Active Context

> 最后更新：2026-05-13 (本次会话结束前)

## 当前状态：全部完成 ✅

三个参赛帖子均已发布，下载链接已修复并验证通过。

## 关键上下文提示

### GitHub 仓库
- **仓库地址**: https://github.com/bigmanBass666/soo-skill-factory
- **结构**: `releases/` 存放 .skill 文件，`posts/` 存放参赛帖 .md
- **Skill 文件下载格式**: 必须用 `raw.githubusercontent.com` 格式（不是 `releases/download`）
  - ✅ 正确: `https://raw.githubusercontent.com/bigmanBass666/soo-skill-factory/main/releases/{skillName}.skill`
  - ❌ 错误: `https://github.com/bigmanBass666/soo-skill-factory/releases/download/main/releases/{skillName}.skill` (404!)

### 论坛帖子（全部已发布+链接已修复）
| Skill | Topic ID | Post ID | 版本 | 状态 |
|-------|----------|---------|------|------|
| trae-device-security | #17079 | 79889 | v6 | ✅ 链接有效 |
| trae-forum-pro | #17166 | 80287 | v6 | ✅ 链接有效 |
| trae-workflow-automator | #17234 | 80594 | v2 | ✅ 链接有效(新添加) |

### Cookie 管理
- 路径: `/workspace/cookie.md`
- 用途: Discourse API 认证（Playwright 浏览器内 fetch 需要）
- 注意: cookie.md **未提交到 Git**（.gitignore 中排除），每次新环境需手动提供

### Playwright 环境（一键恢复！）
- **⭐ 首选方案: `bash scripts/setup-deps.sh`** — 自动检测并安装所有依赖
- **下载优先级**: 仓库tar.gz(0s,clone自带) → jsDelivr CDN(~10-30s) → GitHub Release(~1min) → playwright官方源(~16min兜底)
- **仓库自带缓存**: `cache/playwright-chromium-linux.tar.gz` (98MB, UPX压缩+最小化, 随 clone 自动下载)
- **jsDelivr CDN 地址**: `https://cdn.jsdelivr.net/gh/bigmanBass666/soo-skill-factory@main/cache/playwright-chromium-linux.tar.gz`
- **GitHub Release 备用**: https://github.com/bigmanBass666/soo-skill-factory/releases/tag/v1.0.0-deps (162MB 原始版)
- Chromium 缓存路径: `/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome` (114MB 解压后)
- 启动参数必须带: `executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'`
- **gh CLI 已安装** (v2.92.0), 可用于管理 Release 和其他 GitHub 操作

### Discourse API 经验教训（重要！）
1. **PUT /posts/{id}.json 的 `raw` 字段会替换整个帖子内容**，不是追加！之前因此覆盖了两篇帖子的完整内容
2. 正确做法: 读取本地完整 .md 文件 → 整个作为 raw 推送
3. CSRF Token: 从 `<meta name="csrf-token">` 获取，PUT 时需要 `X-CSRF-Token` header
4. Node.js 直接 https 请求论坛会 ETIMEDOUT → 必须用 Playwright 页面内的 `fetch()`
5. `page.evaluate()` 的多参数要包成对象传递: `({a, b}) => {...}, {a, b}`
6. topic JSON API 通常不返回 raw 字段 → 需要用本地文件作为内容源

### 发帖/更新脚本（按时间顺序）
| 脚本 | 用途 | 状态 |
|------|------|------|
| `update-all-posts.js` | 用本地 .md 完整内容 PUT 更新论坛帖子 | ✅ 可复用 |
| `update-post3.js` | 单独更新第三篇帖子 | ✅ 已完成 |
| `verify-all-posts.js` | 验证三个帖子的链接有效性 | ✅ 可复用 |
| `fix-posts.js` | 从本地文件恢复被覆盖的帖子内容 | ✅ 紧急修复用 |
| `setup-deps.sh` | 一键恢复 Playwright + 系统依赖 | ✅ 新环境必跑 |

### 本地关键文件
| 文件 | 内容 |
|------|------|
| `posts/device-security-competition-post.md` | device-security 参赛帖（含正确链接） |
| `posts/forum-pro-competition-post.md` | forum-pro 参赛帖（含正确链接） |
| `posts/trae-workflow-automator-competition-post.md` | workflow-automator 参赛帖（含正确链接） |

### 下一步建议（供新 AI 参考）
- 🥇 社区运营：用 forum-pro 回复高热度帖子，增加曝光
- 🥈 Iteration 2：优化 Skill benchmark 到更高分
- 🥉 抽奖问卷：用户手动填写 https://bytedance.larkoffice.com/share/base/form/shrcn7YanxCtmlZPmpUJtyhr9Re
- 社媒传播：小红书/B站/抖音 带话题传播冲击传播奖
