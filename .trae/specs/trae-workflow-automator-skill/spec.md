# trae-workflow-automator (元 Skill) Spec

## Why

SOLO 技能创作赛已有两个垂直领域 Skill（device-security 账号安全 + forum-pro 社区效率），但缺少一个展示"SOLO 递归能力"的作品。将"从零创建 Skill 并发布到论坛"的完整工作流封装为 Skill 本身，既是对 skill-creator 方法论的极致实践，也是"用 SOLO 创造 SOLO Skill"的概念创新——任何 TRAE 用户都能借此自助创建高质量参赛作品。

## What Changes

- 创建全新的 SOLO Skill 目录结构：
  ```
  trae-workflow-automator/
  ├── SKILL.md                    # Skill 核心定义（<500行）
  ├── references/
  │   ├── skill-creation-guide.md # Skill 创建完整指南（基于 skill-creator 方法论）
  │   └── contest-rules.md        # SOLO 技能创作赛规则与投稿指南
  ├── scripts/
  │   └── skill-scaffold.sh       # Skill 脚手架生成脚本
  └── evals/
      └── evals.json              # 测试用例定义
  ```

## Impact

- 全新 Skill，无破坏性变更
- 依赖：WebFetch（抓取大赛规则）、Playwright MCP（发布参赛帖）、SearchCodebase/Grep
- 目标产出：`.skill` 文件 + 参赛帖（发布到 #17079/#17166 同一赛区）
- 与前两个 Skill 的关系：互补定位（安全→社区→元工具），无代码依赖

## ADDED Requirements

### Requirement: SKILL.md 核心定义

SKILL.md SHALL 包含以下 frontmatter 和正文：

#### Frontmatter
- `name`: `trae-workflow-automator`
- `description`: pushy 触发描述，覆盖关键词：创建Skill/写Skill/SOLO技能/技能创作赛/Skill模板/SKILL.md/参赛/发帖/Skill脚手架/eval测试/benchmark/迭代优化
- `compatibility`: WebFetch, Playwright MCP, SearchCodebase/Grep

#### 正文结构（Progressive Disclosure，<500行）

1. **Skill 概述** — 一句话：SOLO Skill 创建全流程自动化助手，从构思到发布一站搞定
2. **触发场景列表** — >=10 个场景
3. **模块 A：Skill 构思与规划** — 帮助用户确定 Skill 方向、定位、差异化
   - 需求分析框架（痛点→场景→能力→差异化）
   - 与已有 Skill 的互补性检查
   - 可行性快速评估
4. **模块 B：SKILL.md 生成引擎** — 按 skill-creator 方法论生成完整 SKILL.md
   - Frontmatter 生成（name/description/compatibility）
   - Pushy description 编写策略
   - 模块化正文结构设计
   - 输出格式规范定义
   - 最佳实践章节
5. **模块 C：Evals 定义与 Benchmark 执行** — 自动定义测试用例并执行对比评估
   - evals.json 结构设计（3个场景 + assertions）
   - with-skill / baseline 并行运行策略
   - grading.json 评分标准
   - benchmark.json 聚合与解读
6. **模块 D：迭代优化与发布** — 基于 benchmark 结果优化并发布到论坛
   - Weak point 分析策略
   - SKILL.md 针对性改进
   - 参赛帖撰写模板（7章节标准格式）
   - Playwright MCP 自动发布流程
   - .skill 文件打包

### Requirement: 模块 A — Skill 构思与规划

系统 SHALL 帮助用户从零开始确定 Skill 方向：

- **WHEN** 用户说"我想创建一个 Skill" → 引导需求分析
  - Step 1：识别痛点场景（"你或他人遇到了什么问题？"）
  - Step 2：确定目标用户和触发场景
  - Step 3：定义核心能力（2-4 个模块）
  - Step 4：差异化检查（与已有 Skill 对比）
  - Step 5：可行性评估（技术依赖、数据可用性）
- **输出格式**：Skill 构思报告
  - Skill 名称和一句话定位
  - 目标用户画像
  - 核心能力列表（含模块名和一句话描述）
  - 差异化分析表（与已有 Skill 对比）
  - 技术可行性评估

### Requirement: 模块 B — SKILL.md 生成引擎

系统 SHALL 按 skill-creator 方法论生成完整的 SKILL.md：

- **WHEN** 用户确认 Skill 方向 → 自动生成 SKILL.md 草稿
- **生成策略**：
  1. 先生成 frontmatter（name + pushy description + compatibility）
  2. 再生成正文框架（概述 → 触发场景 → 核心模块 → 输出格式 → 最佳实践）
  3. 每个模块包含：工作流步骤 + 输出格式模板 + 边界情况处理
  4. 总行数控制在 <500 行
- **Pushy description 编写策略**：
  - 覆盖 10+ 触发关键词
  - 包含"即使未明确提及也应激活"的指令
  - 列举具体的使用场景和用户意图
- **用户可编辑**：生成后允许修改再确认

### Requirement: 模块 C — Evals 定义与 Benchmark 执行

系统 SHALL 自动定义测试用例并执行评估：

- **evals.json 设计**：
  - 至少 3 个 eval，每个覆盖不同模块
  - 每个 eval 包含 id/eval_name/prompt/expected_output/assertions
  - assertions 类型覆盖：contains / contains_any / contains_regex / contains_count
  - 总断言数 >= 15 个
- **Benchmark 执行流程**：
  1. 并行启动 with-skill + without_skill subagent
  2. 运行期间草拟 assertions
  3. 完成后 capture timing 数据
  4. 启动 grader 生成 grading.json（text/passed/evidence 字段）
  5. 聚合为 benchmark.json
- **目标**：with_skill 通过率 > baseline 至少 15%

### Requirement: 模块 D — 迭代优化与发布

系统 SHALL 提供从 benchmark 到发布的完整链路：

- **迭代优化**：
  - 分析 benchmark 中得分低的断言
  - 定位 SKILL.md 中的 weak point
  - 针对性改进（补强 references / 调整工作流 / 修复格式问题）
  - 记录优化内容和预期效果
- **参赛帖撰写**：
  - 7 章节标准格式（简介/核心能力/场景演示/benchmark/代码展示/技术亮点/安装使用）
  - 数据驱动（用 benchmark 数字说话）
  - 与其他 Skill 的差异化说明
- **自动发布**：
  - 通过 Playwright MCP 发布到论坛
  - 失败回退：保存草稿 + 提示手动重试
- **打包**：
  - tar.gz 格式打包为 .skill 文件

### Requirement: 参考文件 (references/)

1. **`references/skill-creation-guide.md`** — Skill 创建完整指南
   - skill-creator 方法论核心要点（Progressive Disclosure / Evals / Benchmark / Iteration）
   - SKILL.md 写作规范（frontmatter / pushy description / 模块化结构）
   - Eval 测试规范（assertion 类型 / grading 格式 / benchmark 流程）
   - 常见陷阱与最佳实践（基于 device-security 和 forum-pro 的实战经验）
   - 目标：200-300 行

2. **`references/contest-rules.md`** — SOLO 技能创作赛规则与投稿指南
   - 大赛时间线与奖金池
   - 投稿格式要求
   - 评审标准
   - 参赛帖模板
   - 抽奖问卷链接
   - 目标：100-150 行

### Requirement: 辅助脚本 (scripts/)

- **`scripts/skill-scaffold.sh`** — Skill 脚手架生成脚本
  - 支持 `init <skill-name>` — 创建完整目录结构（SKILL.md + references/ + scripts/ + evals/）
  - 支持 `check` — 验证当前 Skill 目录完整性
  - 支持 `pack` — 打包为 .skill 文件
  - 支持 `eval-init` — 生成 evals.json 模板
  - 彩色终端输出 + 错误处理

### Requirement: 测试用例 (Evals)

| ID | 场景 | Prompt 示例 | 预期输出 |
|----|------|------------|---------|
| 1 | Skill 构思 | "我想参加 SOLO 技能创作赛，但不知道做什么 Skill 好，帮我分析一下" | Skill 构思报告（含需求分析/核心能力/差异化/可行性） |
| 2 | SKILL.md 生成 | "帮我创建一个代码审查 Skill 的 SKILL.md，要能检查代码质量和安全漏洞" | 完整的 SKILL.md 文件（frontmatter + 触发场景 + 核心模块 + 输出格式 + 最佳实践） |
| 3 | 全流程执行 | "我想创建一个 TRAE 使用技巧收集 Skill，从构思到发布全帮我搞定" | 完整的 Skill 产出（SKILL.md + references + evals + benchmark 数据 + 参赛帖草稿） |

### Requirement: 参赛文档

- 发布位置：https://forum.trae.cn/c/37-category/37
- 内容包含：Skill 介绍、递归自举概念说明、3 个 eval 演示、benchmark 数据、与前两个 Skill 的差异化矩阵、核心代码展示

## MODIFIED Requirements

无（全新 Skill）

## REMOVED Requirements

无
