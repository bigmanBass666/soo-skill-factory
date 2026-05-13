# 持久化上下文体系 (Persistent Context) Spec

## Why

AI Agent 的上下文会压缩，导致跨会话的进度、决策和规划丢失。当前项目的"记忆"分散在 `trae-community-action-plan.md`（过时）、`.trae/specs/`（按单个 feature 分散）和对话历史（最脆弱）中，缺少一个"单一真相源"来回答"我们现在在哪、做了什么、下一步做什么"。参考《多AI协作体系文件完全指南》中 Tocket 框架的设计理念——"上下文存在于文件中，而非聊天历史记录里"——建立 `.context/` 目录作为项目级持久化记忆基础设施。

## What Changes

- 创建 `.context/` 目录，采用 Tocket 最小结构（3 个核心文件）
  - `activeContext.md` — 当前焦点、正在做什么、阻塞项
  - `progress.md` — 已完成/进行中/下一步的完整追踪
  - `decisions.md` — 关键决策记录（做了什么选择、为什么）
- 更新 `AGENTS.md`，添加上下文恢复协议（新会话开始时先读 `.context/activeContext.md`）
- 将 `trae-community-action-plan.md` 的内容迁移到 `.context/progress.md`，原文件保留但标注"已迁移到 .context/"
- 在 `.context/` 中记录当前阶段的完整规划（Iteration 2 / 第3个 Skill / 社区运营等候选方向）

## Impact

- 新增文件：`.context/activeContext.md`、`.context/progress.md`、`.context/decisions.md`
- 修改文件：`AGENTS.md`（添加上下文恢复协议）
- 标记文件：`trae-community-action-plan.md`（标注已迁移）
- 不修改任何已有 Skill 代码或 spec 文档

## ADDED Requirements

### Requirement: .context/ 目录结构

项目根目录下 SHALL 存在 `.context/` 目录，包含以下文件：

#### activeContext.md — 当前焦点
- **用途**：AI Agent 新会话开始时首先读取此文件，快速恢复上下文
- **内容要求**：
  - 当前正在做什么（1-3 个活跃任务）
  - 当前阻塞项（如果有）
  - 最近一次更新的时间戳
  - 关键上下文提示（如"Cookie 可能已过期"、"Playwright 用 /opt/google/chrome/chrome"）
- **更新频率**：每次会话结束前或重要状态变更时更新
- **行数限制**：≤ 50 行

#### progress.md — 进度追踪
- **用途**：全局进度看板，记录所有已完成/进行中/计划中的工作
- **内容要求**：
  - 已完成项列表（含产出物链接）
  - 进行中项列表（含当前状态）
  - 下一步候选项列表（含优先级和预估工作量）
  - 时间线总览
- **更新频率**：每次完成或启动新任务时更新
- **行数限制**：≤ 150 行

#### decisions.md — 决策记录
- **用途**：记录关键决策及其理由，防止上下文压缩后"忘记为什么这样做"
- **内容要求**：
  - 每条决策包含：日期、决策内容、理由、替代方案、影响
  - 按时间倒序排列（最新决策在最前）
- **更新频率**：每次做出重要选择时更新
- **行数限制**：≤ 100 行

### Requirement: AGENTS.md 上下文恢复协议

AGENTS.md SHALL 包含以下协议说明：

```
## Context Recovery Protocol

When starting a new session in this workspace:
1. Read `.context/activeContext.md` first — this tells you what's happening now
2. Read `.context/progress.md` for full history and next steps
3. Read `.context/decisions.md` only if you need to understand why something was done
4. Before ending a session, update `.context/activeContext.md` with current state
```

### Requirement: 迁移 trae-community-action-plan.md

- `.context/progress.md` SHALL 包含 `trae-community-action-plan.md` 中的所有有效信息（已完成项、计划项、时间线）
- `trae-community-action-plan.md` 顶部 SHALL 添加迁移标注：`> ⚠️ 本文件内容已迁移到 .context/progress.md，请以 .context/ 为准`
- 原文件不删除（保留历史记录）

### Requirement: 记录当前阶段规划

`.context/progress.md` SHALL 包含以下候选方向的完整记录：

1. **Iteration 2 优化**：重跑两个 Skill 的 eval，目标 100% 通过率
2. **第3个 Skill**：trae-workflow-automator（元 Skill，"造 Skill 的 Skill"）
3. **社区运营**：用 forum-pro 回复帖子、建立存在感
4. **社媒传播**：冲击传播奖（需用户参与）
5. **抽奖问卷提交**：飞书表单（需用户操作）

每个候选方向包含：优先级、预估工作量、是否需要用户参与、预期产出

## MODIFIED Requirements

无（全新基础设施）

## REMOVED Requirements

无
