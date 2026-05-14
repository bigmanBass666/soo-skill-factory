---
name: trae-workflow-automator
description: >
  SOLO Skill 创建全流程自动化助手 — 从构思到发布一站搞定。当用户需要：创建Skill、写Skill、SOLO技能、技能创作赛、Skill模板、SKILL.md生成、
  参加SOLO创作赛、发帖参赛、Skill脚手架、eval测试、benchmark评估、迭代优化Skill、打包.skill文件、
  想做一个新的SOLO Skill、不知道做什么Skill好、帮我从零创建Skill、Skill写法指南、
  如何设计Skill模块、Skill触发描述怎么写、pushy description、Skill的eval怎么定义、
  怎么跑Skill benchmark、Skill迭代优化方法、Skill参赛帖怎么写时触发此Skill。
  使用此Skill处理一切与SOLO Skill创建、设计、测试、优化、发布相关的任务，
  即使未明确提及'Skill'二字但语境涉及工具创建、工作流自动化、能力封装时也应激活。
compatibility:
  - WebFetch
  - Playwright MCP
  - SearchCodebase/Grep
---

# TRAE Workflow Automator — Skill 创建全流程助手

## 1. Skill 概述

本 Skill 是 SOLO Skill 的元工具——"造 Skill 的 Skill"。它将"从零创建一个 Skill 并发布到 SOLO 技能创作赛"的完整工作流封装为四个阶段：**构思规划**（确定方向与差异化）、**SKILL.md 生成**（按方法论输出完整定义文件）、**Evals 与 Benchmark**（量化验证质量）、**迭代发布**（优化短板并发布参赛）。任何 TRAE 用户都能借此自助创建高质量参赛作品。

## 2. 触发场景

以下任一场景出现时，立即激活本 Skill：

1. **从零创建** — 用户说"我想创建一个 Skill""帮我做一个 SOLO Skill""从零开始做一个技能"
2. **创作赛参赛** — 用户提到"技能创作赛""参加 SOLO 比赛""投稿参赛"
3. **SKILL.md 编写** — 用户需要"写 SKILL.md""Skill 文件怎么写""生成 Skill 定义"
4. **方向构思** — 用户问"做什么 Skill 好""帮我分析 Skill 方向""不知道做什么"
5. **触发描述优化** — 用户说"Skill 触发不了""description 怎么写""pushy description"
6. **Eval 设计** — 用户需要"定义 eval 测试""Skill 怎么测试""写测试用例"
7. **Benchmark 执行** — 用户说"跑 benchmark""评估 Skill 质量""对比测试"
8. **迭代优化** — 用户说"Skill 效果不好""优化 Skill""改进 Skill"
9. **打包发布** — 用户需要"打包 .skill 文件""发布到论坛""参赛帖怎么写"
10. **工作流自动化** — 用户说"帮我全流程搞定""从构思到发布一站搞定"
11. **隐含场景** — 用户描述的需求本质是"把某种能力封装为可复用工具"，即使未提"Skill"
12. **方法论咨询** — 用户问"Skill 有什么写法规范""Progressive Disclosure 是什么"

## 3. 模块 A：Skill 构思与规划

### 工作流

```
痛点识别 → 场景定义 → 能力拆解 → 差异化检查 → 可行性评估
```

**步骤详解：**

1. **痛点识别** — 引导用户回答："你或他人遇到了什么反复出现的问题？"收集具体场景描述，而非抽象需求。

2. **场景定义** — 确定目标用户画像和触发场景列表。每个场景包含：触发信号（用户会说什么）和预期输出（Skill 应该做什么）。

3. **能力拆解** — 将核心能力拆解为 2-4 个模块。每个模块应独立可用且有明确边界。命名公式：`模块字母 + 冒号 + 一句话功能`（如"A：智能搜索助手"）。

4. **差异化检查** — 与已有 Skill 对比，确认新 Skill 的独特价值。检查清单：
   - 是否与已有 Skill 功能重叠？如有，能否合并或重新定位？
   - 是否填补了已有 Skill 未覆盖的空白？
   - 是否有"元"特质（如本 Skill 本身就是"造 Skill 的 Skill"）？

5. **可行性评估** — 快速判断技术可行性：
   - 依赖的工具是否可用（WebFetch / Playwright / SearchCodebase）？
   - 数据源是否可访问？
   - 是否需要用户额外配置？

### 输出格式：Skill 构思报告

```markdown
## 💡 Skill 构思报告

**Skill 名称**：{name}
**一句话定位**：{verb + object + value}

### 目标用户
{谁会用这个 Skill，在什么场景下}

### 核心能力
| 模块 | 名称 | 一句话描述 |
|------|------|-----------|
| A | {名称} | {描述} |
| B | {名称} | {描述} |
| C | {名称} | {描述} |
| D | {名称} | {描述} |

### 差异化分析
| 对比维度 | 本 Skill | 已有 Skill X | 已有 Skill Y |
|----------|---------|-------------|-------------|
| 核心定位 | {定位} | {定位} | {定位} |
| 目标用户 | {用户} | {用户} | {用户} |
| 关键差异 | {差异点} | — | — |

### 技术可行性
- 工具依赖：{列出需要的工具及可用性}
- 数据源：{列出数据来源}
- 用户配置：{是否需要额外配置}
- 风险点：{潜在的技术风险}
```

## 4. 模块 B：SKILL.md 生成引擎

### 生成策略（4 步）

**Step 1：Frontmatter 生成**

```yaml
---
name: {skill-name}
description: >
  {pushy description — 参照下方编写策略}
compatibility:
  - {tool-1}
  - {tool-2}
---
```

**Step 2：正文框架生成**

按以下固定结构组织，确保 Progressive Disclosure：

```
1. Skill 概述（一句话定位 + 核心价值）
2. 触发场景列表（>=10 个，含隐含场景）
3. 模块 A（工作流 + 输出格式模板）
4. 模块 B（工作流 + 输出格式模板）
5. 模块 C（工作流 + 输出格式模板）
6. 模块 D（工作流 + 输出格式模板）
7. 输出格式规范总览
8. 最佳实践
```

**Step 3：每个模块的内容生成**

每个模块必须包含：
- 工作流步骤（用 `步骤1 → 步骤2 → ...` 流程图开头）
- 每步的详细说明（解释为什么这样做，而非仅说做什么）
- 输出格式模板（用 Markdown 代码块给出具体模板）
- 边界情况处理（无结果/失败/异常时的策略）

**Step 4：行数控制**

总行数严格 < 500 行。如果内容超限，将详细规范移入 `references/` 文件，在 SKILL.md 中用简短指引替代：
```
> 详细规范见 references/{file}.md
```

### Pushy Description 编写策略

description 是 Skill 触发的唯一入口，必须"pushy"：

1. **覆盖 10+ 触发关键词** — 列举用户可能说的各种表述
2. **包含"即使未明确提及也应激活"指令** — 捕获隐含意图
3. **列举具体使用场景** — 而非抽象描述功能
4. **用自然语言而非关键词堆砌** — 保持可读性
5. **包含竞品/近义词** — 如"Skill"≈"技能"≈"能力"≈"工具"

**示例对比：**

| ❌ 弱 description | ✅ Pushy description |
|---|---|
| "SOLO Skill 创建助手" | "SOLO Skill 创建全流程自动化助手 — 从构思到发布一站搞定。当用户需要：创建Skill、写Skill、SOLO技能...即使未明确提及'Skill'但语境涉及工具创建时也应激活。" |

### 生成后流程

1. 输出完整 SKILL.md 供用户审阅
2. 用户可修改任何部分
3. 确认后写入文件系统

## 5. 模块 C：Evals 定义与 Benchmark 执行

### C.1 evals.json 设计

每个 Skill 至少定义 3 个 eval，覆盖不同模块：

```json
{
  "skill_name": "{skill-name}",
  "evals": [
    {
      "id": 1,
      "eval_name": "{descriptive-name}",
      "prompt": "{用户真实会说的自然语言}",
      "expected_output": "{预期输出的描述}",
      "files": [],
      "assertions": [
        {
          "id": "output_contains_{feature}",
          "type": "contains|contains_any|contains_regex|contains_count|not_contains_any|contains_all",
          "description": "{断言描述}",
          "key_pattern": ["{关键词列表}"],
          "regex_pattern": "{正则表达式}",
          "min_count": 2,
          "weight": 1.0
        }
      ]
    }
  ]
}
```

**Assertion 类型选择指南：**

| 类型 | 适用场景 | 示例 |
|------|---------|------|
| `contains` | 输出必须包含特定文本 | "包含搜索报告标题" |
| `contains_any` | 输出包含多个候选词之一 | "包含方案/解决/建议之一" |
| `contains_regex` | 需要模式匹配 | "包含数字+回复/浏览" |
| `contains_count` | 需要计数验证 | "包含>=2个帖子条目" |
| `not_contains_any` | 输出不应包含某些内容 | "不包含错误格式" |
| `contains_all` | 输出必须包含所有指定项 | "同时包含标题+环境+步骤" |

**总断言数 >= 15 个**，每个 eval 5-6 个断言。

### C.2 Benchmark 执行流程（5 步）

```
并行启动 → 断言草拟 → 计时捕获 → 评分聚合 → 分析解读
```

1. **并行启动** — 每个 eval 同时启动 with-skill 和 without-skill（baseline）两个 subagent
   - with-skill：加载 SKILL.md 后执行 prompt
   - without-skill：直接执行 prompt，不加载任何 Skill

2. **断言草拟** — 运行期间，基于 evals.json 中的 assertions 准备 grading 清单

3. **计时捕获** — 每个 subagent 完成时立即记录 `timing.json`：
   ```json
   {"total_tokens": N, "duration_ms": N, "total_duration_seconds": N}
   ```

4. **评分聚合** — 对每个 run 生成 `grading.json`，使用 `text/passed/evidence` 三字段格式：
   ```json
   {
     "expectations": [
       {"text": "断言描述", "passed": true, "evidence": "在输出第X行找到..."}
     ],
     "summary": {"passed": N, "failed": N, "total": N, "pass_rate": 0.XX}
   }
   ```

5. **分析解读** — 聚合为 benchmark.json，计算 with_skill vs baseline 的通过率差值

**目标**：with_skill 通过率 > baseline 至少 15%

### C.3 结果目录结构

```
{skill-name}-workspace/
└── iteration-1/
    ├── eval-1/
    │   ├── with_skill/outputs/
    │   ├── without_skill/outputs/
    │   ├── eval_metadata.json
    │   └── grading.json (per run)
    ├── eval-2/ ...
    ├── eval-3/ ...
    ├── benchmark.json
    └── benchmark.md
```

## 6. 模块 D：迭代优化与发布

### D.1 Weak Point 分析

从 benchmark.json 中定位得分低的断言：

1. 找出 with_skill 通过率 < 80% 的断言
2. 追溯到 SKILL.md 中对应的模块
3. 分析根因：是工作流不清晰？输出格式定义不明确？还是 references 缺少关键信息？
4. 制定针对性改进方案

### D.2 迭代改进策略

| 问题类型 | 改进方法 |
|----------|---------|
| 工作流不清晰 | 增加步骤间的逻辑说明，解释"为什么"而非仅"做什么" |
| 输出格式模糊 | 提供更具体的模板，用示例替代抽象描述 |
| 触发不足 | 扩展 description 中的关键词和场景覆盖 |
| references 缺失 | 补充参考文件，在 SKILL.md 中添加引用指引 |
| 正则误判 | 调整输出格式（如从表格改为 inline），避免 Markdown 语法干扰 |

**迭代原则**：每次只改一个维度，改完重跑 benchmark，确认改进有效再继续。

### D.3 参赛帖撰写模板（7 章标准格式）

```markdown
# 🛠️ {Skill 名称} — {一句话定位}

## 一、Skill 简介
{50字以内的核心价值描述}

## 二、核心能力
{4个模块的简要介绍，每个2-3行}

## 三、场景演示
{3个 eval 的 prompt + 输出截图/示例}

## 四、Benchmark 数据
{with_skill vs baseline 对比表 + 通过率差值}

## 五、核心代码展示
{SKILL.md 关键片段 + scripts 亮点}

## 六、技术亮点
{递归自举/Progressive Disclosure/pushy description 等方法论亮点}

## 七、安装使用
{安装 .skill 文件的步骤 + 触发示例}
```

### D.4 论坛发布流程

**发布位置**：https://forum.trae.cn/c/37-category/37（SOLO 技能创作赛专区）

**发布方式**：使用 Playwright MCP 或 Node.js Playwright 脚本

**关键步骤**：
1. 读取 cookie.md 验证登录态（需 `_forum_session` + `sessionid`）
2. 导航到目标板块 → 点击 #create-topic
3. 填写标题 → 粘贴正文（clipboard paste 方案）
4. 添加标签 → 点击发布
5. 验证发布成功 → 记录帖子 ID 和 URL

**失败回退**：保存草稿到本地 + 提供手动发布指引

### D.5 .skill 文件打包

```bash
zip -r {skill-name}.skill {skill-name}/
```

打包内容：SKILL.md + references/ + scripts/ + evals/

## 7. 输出格式规范总览

| 输出类型 | 格式要求 | 使用场景 |
|----------|----------|---------|
| 构思报告 | Markdown 表格 + 结构化章节 | 模块 A 输出 |
| SKILL.md | YAML frontmatter + Markdown 正文 | 模块 B 输出 |
| evals.json | 标准 JSON（含 assertions） | 模块 C 输出 |
| benchmark 报告 | JSON + Markdown 摘要 | 模块 C 评估结果 |
| 参赛帖 | 7 章标准格式 Markdown | 模块 D 发布内容 |
| 发布结果 | ✅成功 / ❌失败 + 详情 | 模块 D 发布反馈 |

**通用排版规则：**
- 使用 emoji 作为视觉锚点（💡 🔍 📊 ✅ ❌ ⚠️），每节不超过 3 个
- 重要信息用粗体 `**` 或引用块 `>` 强调
- 代码块标注语言类型以启用语法高亮
- 长内容使用 `<details>` 折叠保持整洁

## 8. 最佳实践

### 1. 先构思，再动手

不要跳过模块 A 直接写 SKILL.md。一个方向不清晰的 Skill，写再多内容也是南辕北辙。花 10 分钟做构思报告，能省下后面数小时的返工。

### 2. Pushy 不是啰嗦

description 要覆盖足够多的触发词，但每句话都应有信息增量。避免重复表达同一意图——"创建Skill""写Skill""做Skill"三个词只需出现一次，用逗号分隔即可。

### 3. 解释为什么，而非只说做什么

LLM 是智能体，不是规则引擎。告诉它"为什么这个步骤重要"比"必须这样做"更有效。用理论心智（theory of mind）来写指令，而非堆砌 MUST/NEVER。

### 4. Eval 是质量保险

没有 eval 的 Skill 就像没有测试的代码。3 个 eval 覆盖不同模块，15 个断言确保关键输出不遗漏。benchmark 不是为了证明 Skill 完美，而是为了量化改进。

### 5. 迭代优于一次完美

第一版 Skill 不需要 100% 通过率。先跑 benchmark 找到短板，针对性改进，重跑验证——这个循环比一次性写完所有内容更高效。

### 6. Progressive Disclosure 是你的朋友

SKILL.md < 500 行是硬约束。把详细规范移入 references/，SKILL.md 只保留工作流和关键模板。模型会在需要时自动读取参考文件。

---

*SKILL Version: 1.0 | Last Updated: 2026-05-12 | 递归自举：用 SOLO 创造 SOLO Skill*
