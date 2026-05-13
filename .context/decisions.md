# Decision Log

> 按时间倒序排列，最新决策在最前

## 2026-05-13 | 修复下载链接 + 更新全部3个帖子
- **决策**: 用 `raw.githubusercontent.com` 格式替换 `releases/download` 格式，通过 Playwright PUT API 推送本地完整 .md 文件
- **理由**: releases/download 需要 GitHub Release（从未创建）→ 404；raw.githubusercontent.com 直接提供原始文件 → 200
- **影响**: 全部3个帖子链接修复验证通过（HTTP 200）

## 2026-05-13 | 建立依赖持久化方案
- **决策**: 将 Playwright chromium 二进制打包为 98MB UPX压缩 tar.gz 放入仓库 `cache/` 目录，创建 `setup-deps.sh` 一键恢复脚本（5级优先级：本地→仓库tar.gz→jsDelivr→Release→官方源）
- **理由**: 每次沙盒重置后重新下载 chromium 需要约16分钟，严重影响效率
- **替代方案**: (1) Docker 镜像预装 (2) 每次重新下载 (3) GitHub Release (4) jsDelivr CDN
- **影响**: 新环境只需跑一次 setup-deps.sh 即可恢复，clone 自带 tar.gz 可实现0秒解压

## 2026-05-13 | 确认第三篇帖子正确 ID
- **决策**: 通过扫描 #17000-17400 范围确认 workflow-automator 帖子 ID 为 **#17234**（不是之前记录的 #17258）
- **理由**: #17258 是别人（beiyuii）的 Personal API 帖子；#17234 才是我们的
- **教训**: 不能凭记忆假设帖子 ID，必须搜索验证

## 2026-05-12 | 建立 .context/ 持久化上下文体系
- **决策**：采用 Tocket 最小结构（activeContext + progress + decisions）建立 .context/ 目录
- **理由**：AI Agent 上下文会压缩，导致跨会话进度丢失。需要文件级持久化记忆
- **替代方案**：(1) 只用 AGENTS.md 记录一切 (2) 用 .trae/specs/ 统一管理 (3) Context0 版本化记忆系统
- **影响**：新会话的 AI Agent 可通过读取 .context/ 快速恢复上下文

## 2026-05-12 | 创建 forum-pro 作为第二个 Skill
- **决策**：选择"TRAE 论坛社区助手"作为第二个参赛 Skill
- **理由**：与 device-security（账号安全）形成互补（社区效率），覆盖不同 eval 场景，多投多得
- **替代方案**：(1) 代码审查 Skill (2) 社区分类器 Skill (3) 深度优化 device-security
- **影响**：两个差异化 Skill 参赛，覆盖安全+社区两个方向

## 2026-05-12 | 使用 Playwright 脚本而非 MCP 发帖
- **决策**：通过 Node.js Playwright 脚本 + Cookie 注入实现论坛发帖
- **理由**：Playwright MCP 需要登录态但无法在 headless 环境完成登录流程；脚本方案可复用、可自动化
- **替代方案**：(1) Playwright MCP 手动操作 (2) Discourse API（需 API Key）(3) 用户手动发帖
- **影响**：建立了可重复使用的发帖脚本链路（cookie.md → publish-*.js → find-*.js → verify-*.js）

## 2026-05-12 | 采用 skill-creator 方法论创建 Skill
- **决策**：严格遵循 skill-creator 的 Progressive Disclosure / Evals / Benchmark / Iteration 流程
- **理由**：用户明确要求"记得使用 skill creator 来创建 skill"；方法论确保 Skill 质量可量化
- **替代方案**：自由发挥写 SKILL.md，不做 benchmark 对比
- **影响**：两个 Skill 都有量化 benchmark 数据支撑参赛帖

## 2026-05-12 | 选择 device-security 作为第一个 Skill
- **决策**：选择"多设备登录安全管家"作为第一个参赛 Skill
- **理由**：直击社区最大痛点（风控问题），有真实实战经验（用户亲身遇到），社区共鸣极强
- **替代方案**：(1) 论坛发帖助手 (2) 代码规范审查 (3) 社区分类器
- **影响**：+26.7% benchmark 提升，参赛帖 #17079
