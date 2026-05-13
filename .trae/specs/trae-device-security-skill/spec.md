# TRAE 账号安全管家 Skill Spec

## Why
TRAE 社区当前第一大痛点是**多设备登录触发风控限制**（"今天先到这里也不错"报错），大量用户遇到后完全无能为力。官方目前没有设备管理功能。本 Skill 直击这一痛点，将"设备登录追踪 → 风控预警 → 智能诊断 → 一键生成反馈帖 → 论坛自动发布"全流程封装为可复用能力。同时可作为 [SOLO 技能创作赛](https://forum.trae.cn/c/37-category/37) 参赛作品。

## What Changes
- 创建完整的 TRAE SOLO Skill 目录结构：
  ```
  trae-device-security/
  ├── SKILL.md              # Skill 核心定义（<500行）
  ├── references/
  │   ├── forum-data.md     # 社区关键帖子数据引用库
  │   └── best-practices.md # TRAE 账号安全最佳实践
  └── scripts/
      └── device-log.sh     # 设备日志读写辅助脚本
  ```
- 不修改任何现有代码，纯新增 Skill

## Impact
- 全新 Skill，无破坏性变更
- 依赖：TRAE SOLO 环境、Playwright MCP（浏览器自动化）、WebFetch 工具
- 目标产出：可安装的 `.skill` 文件 + 参赛帖

## ADDED Requirements

### Requirement: SKILL.md 核心定义
SKILL.md SHALL 包含以下 frontmatter 和正文：

#### Frontmatter 字段
- `name`: `trae-device-security`
- `description`: 触发描述，需覆盖：多设备登录、风控限制、"今天先到这里"、论坛反馈、账号安全等场景。描述要"pushy"以提高触发率
- `compatibility`: 列出所需工具（Playwright MCP、WebFetch）

#### 正文结构（按 Progressive Disclosure 原则）
1. **Skill 概述** — 一句话说明这个 Skill 做什么
2. **触发场景** — 明确列出何时使用此 Skill
3. **核心工作流** — 分模块描述四大能力：
   - 模块 A：设备登录记录与追踪
   - 模块 B：风控预警与智能诊断
   - 模块 C：反馈帖智能生成器
   - 模块 D：论坛自动化发帖
4. **输出格式规范** — 定义各类输出的模板格式
5. **最佳实践知识库** — 内置 6 条安全建议

### Requirement: 设备登录记录与追踪
系统 SHALL 通过 `~/.trae/device-log.json` 管理设备登录状态。

- **WHEN** 用户在新环境启动 TRAE → 记录设备信息（设备名/时间/IP/OS）
- **WHEN** 用户询问登录设备 → 表格展示 + 状态标注
- **WHEN** 设备数 >= 2 且用户尝试新操作 → 触发预警

### Requirement: 风控预警与诊断
系统 SHALL 主动识别风控风险并提供诊断。

- **WHEN** 检测到"今天先到哪里也不错"提示 → 自动分析原因并给出解除方案
- **WHEN** 设备数超限 → 发出分级警告（提醒/警告/严重）
- **输出格式**：诊断报告包含：触发时间、可能原因（设备数/时长/频率）、推荐操作、预计恢复时间

### Requirement: 反馈帖智能生成器
系统 SHALL 按 TRAE 论坛官方格式自动生成帖子。

- **产品建议帖格式**：标题【产品建议】+ 痛点场景 + 影响范围(含社区数据) + P0/P1/P2 方案 + 预期效果 + 补充说明
- **求助帖格式**：运行环境 + 问题描述 + 复现步骤 + 报错截图指引
- **数据来源**：内置社区关键帖子摘要（#12293/#13482/#11941/#15885/#16802/#16852）
- **用户可编辑**：生成后允许用户修改再确认

### Requirement: 论坛自动化发帖（Playwright MCP）
系统 SHALL 支持通过 Playwright 在 TRAE 论坛自动发帖。

- **正常流程**：打开论坛 → 新话题 → 填写标题/正文/分类/标签 → 发布 → 返回 URL
- **失败回退**：保存草稿到 `~/.trae/drafts/` → 提示手动重试
- **目标板块映射**：产品建议→ /c/8-category/8，帮助与支持→ /c/7-category/7

### Requirement: 测试用例（Evals）
系统 SHALL 定义至少 3 个测试用例：

| ID | 场景 | Prompt 示例 | 预期输出 |
|----|------|------------|---------|
| 1 | 风控诊断 | "我遇到了'今天先到哪里也不错'的提示" | 完整诊断报告 + 解决方案 |
| 2 | 反馈帖生成 | "帮我在 TRAE 论坛发一个产品建议帖，关于设备管理功能" | 符合格式的完整帖子文案 |
| 3 | 安全检查 | "检查我的 TRAE 账号安全状态" | 设备列表 + 风险评估 + 建议 |

### Requirement: 参赛文档
系统 SHALL 生成符合大赛要求的参赛帖。

- 发布位置：https://forum.trae.cn/c/37-category/37
- 格式要求：Skill 介绍 + 使用场景演示 + 核心代码展示 + 截图/GIF 证明
- 抽奖提交：填写飞书问卷链接

## MODIFIED Requirements
无（全新 Skill）

## REMOVED Requirements
无
