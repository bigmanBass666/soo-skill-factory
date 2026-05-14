# SOLO Skill 创建指南 — 基于 skill-creator 方法论

本指南源自 trae-device-security、trae-forum-pro 两个生产级 Skill 的创建经验，系统总结从零创建高质量 SOLO Skill 的完整方法论。

---

## 一、skill-creator 方法论核心要点

### 1.1 Progressive Disclosure（渐进式披露）

Skill 信息加载遵循三层递进架构：

**Layer 1：metadata（frontmatter）** — 约 100 词，仅加载 name + description + compatibility，用于快速判断是否激活（< 1ms 决策）。

**Layer 2：SKILL.md body** — < 500 行（理想 400-450 行），加载完整工作流定义、模块说明、输出格式，用于执行具体任务时的步骤指导。

**Layer 3：references/ 目录** — 无行数上限，按需加载参考数据（模板库、数据源、最佳实践），提供深度知识支撑。

设计理念：AI 先看"做什么"→ 再看"怎么做"→ 按需获取"参考数据"，与人类阅读技术文档的习惯一致。

### 1.2 Eval-driven Development（评估驱动开发）

- 每个 Skill 至少 3 个 eval，覆盖不同核心模块
- 每个 eval 包含 5-6 个断言，总计 >= 15 个
- 每个 eval 同时运行 with-skill 和 without-skill（baseline）
- 通过率差值（delta）量化 Skill 的真实价值增量

### 1.3 Benchmark Comparison（基准对比）

- with_skill：加载 SKILL.md 后执行 prompt
- without_skill：直接执行 prompt，不加载任何 Skill
- 目标：with_skill 通过率 > baseline 至少 15%
- 负 delta 需诚实归因（区分"输出质量问题"与"断言设计问题"）

### 1.4 Iterative Improvement Loop（迭代改进循环）

```
创建 Skill → 跑 benchmark → 定位 weak point → 针对性改进 → 重跑 benchmark → 确认有效
```

核心原则：**每次只改一个维度**，改完重跑确认有效再继续。多维度同时修改会导致无法归因。

---

## 二、SKILL.md 写作规范

### 2.1 Frontmatter 规范

```yaml
---
name: {skill-name}
description: >
  {pushy description — 见下方编写策略}
compatibility:
  - {tool-1}
  - {tool-2}
---
```

- **name**：标识符，小写连字符格式（如 `trae-device-security`），与目录名一致
- **description**：Skill 触发的唯一入口，必须采用 pushy 策略
- **compatibility**：列出运行所依赖的工具（如 playwright-mcp、web-search、WebFetch）

### 2.2 Pushy Description 编写策略

description 决定 Skill 能否被正确触发，是最关键的字段之一。

**核心原则：**

1. 覆盖 10+ 触发关键词 — 列举用户可能说的各种表述
2. 包含"即使未明确提及也应激活"指令 — 捕获隐含意图
3. 列举具体使用场景 — 用自然语言描述，而非抽象功能
4. 用自然语言而非关键词堆砌 — 每句话都有信息增量
5. 包含近义词/竞品词 — 如"Skill"≈"技能"≈"能力"≈"工具"
6. 覆盖多种表述方式 — 同一意图的不同说法都应被覆盖

**示例对比：**

| 弱 description | Pushy description |
|---|---|
| "TRAE 论坛助手" | "TRAE 官方论坛的智能社区助手。当用户需要：在TRAE论坛搜索答案、写规范帖子(产品建议/Bug反馈/求助/分享)、了解社区热门话题、跟踪官方动态、格式化论坛内容、找社区解决方案、分析论坛趋势、管理草稿和帖子、获取发帖格式指南、参与TRAE社区讨论时触发此Skill。覆盖'帮我去论坛找找'、'帮我写个帖子'、'最近论坛在讨论什么'等场景。即使没有明确说'论坛'，只要涉及社区互动或信息检索也应激活。" |

**触发词覆盖维度：** 直接意图（"搜索""发帖""反馈"）、隐含意图（"有没有人遇到""别人怎么解决"）、近义词（"Skill"="技能"="工具"）、场景描述（"我想XXX但不知道怎么XXX"）。

### 2.3 正文模块化结构

```
1. Skill 概述（一句话定位 + 核心价值主张）
2. 触发场景列表（>=10 个，含隐含场景）
3. 模块 A（工作流 + 步骤详解 + 输出格式模板 + 边界处理）
4. 模块 B/C/D（同上结构）
5. 输出格式规范总览
6. 最佳实践
```

### 2.4 每个模块的必备要素

**① 工作流步骤（流程图）** — 用简洁流程图开头，让 AI 一眼理解执行逻辑：

```
痛点识别 → 场景定义 → 能力拆解 → 差异化检查 → 可行性评估
```

**② 步骤详解（解释 WHY）** — 每步不仅说"做什么"，更要解释"为什么这样做"。LLM 是智能体而非规则引擎，理解意图比遵循规则更有效：

| 写法 | 效果 |
|------|------|
| "必须先收集用户场景" | 机械执行，不理解目的 |
| "先收集用户场景——因为只有理解真实痛点才能避免构建出没人用的功能" | 理解意图后能自主判断和调整 |

**③ 输出格式模板（Markdown 代码块）** — 用代码块给出具体模板，包含占位符 `{}` 标注可变部分。

**④ 边界情况处理** — 明确无结果/失败/异常时的策略：数据源不可用→降级本地缓存；网络超时→自动重试后保存草稿；权限不足→回退手动操作指引。

### 2.5 行数控制策略

SKILL.md 总行数严格 < 500 行。超限时将详细规范移入 `references/` 目录，SKILL.md 中用 `> 详细规范见 references/{file}.md` 引用。references/ 按职责拆分：templates.md（模板库）、data.md（数据源）、guide.md（使用指南）。

**为什么 < 500 行是硬约束**：SKILL.md 每次激活时全量加载到上下文窗口，过长会挤占推理空间、降低输出质量。references/ 仅在需要时按需读取。

---

## 三、Eval 测试规范

### 3.1 evals.json 结构

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
          "type": "contains",
          "description": "{断言描述}",
          "key_pattern": ["{关键词1}", "{关键词2}"],
          "weight": 1.0
        }
      ]
    }
  ]
}
```

- `prompt`：必须使用用户真实会说的自然语言
- `expected_output`：描述预期输出的内容特征，非精确文本
- 每个 eval 的 assertions 数量：5-6 个，总断言数 >= 15 个

### 3.2 Assertion 类型

| 类型 | 适用场景 | 必填字段 |
|------|---------|---------|
| `contains` | 输出必须包含特定文本 | key_pattern |
| `contains_any` | 输出包含多个候选词之一即可 | key_pattern（数组） |
| `contains_regex` | 需要模式匹配 | regex_pattern |
| `contains_count` | 需要计数验证 | key_pattern + min_count |
| `not_contains_any` | 输出不应包含某些内容 | key_pattern（数组） |
| `contains_all` | 输出必须包含所有指定项 | key_pattern（数组） |

每个 assertion 包含：`id`（命名公式 `output_{type}_{feature}`）、`type`、`description`、`key_pattern` 或 `regex_pattern`、`weight`（默认 1.0）。

### 3.3 grading.json 格式

每个 eval run 生成一个 grading.json：

```json
{
  "expectations": [
    {
      "text": "输出包含风控诊断报告标题",
      "passed": true,
      "evidence": "在输出第3行找到'🔒 TRAE 账号安全诊断报告'"
    }
  ],
  "summary": { "passed": 2, "failed": 1, "total": 3, "pass_rate": 0.67 }
}
```

**严格字段名要求**：expectations 中每个条目必须使用 `text`、`passed`、`evidence` 三字段名，不可替换（如 `description`、`result`、`reason`），viewer 工具依赖这些固定字段名渲染。

### 3.4 benchmark.json 格式

```json
{
  "skill_name": "{skill-name}",
  "iteration": 1,
  "runs": [
    {
      "eval_id": 1,
      "eval_name": "风控诊断",
      "configuration": "with_skill",
      "run_number": 1,
      "result": { "passed": 5, "failed": 0, "total": 5, "pass_rate": 1.0 }
    }
  ],
  "run_summary": {
    "with_skill": { "total_passed": 14, "total_assertions": 16, "overall_pass_rate": 0.875 },
    "without_skill": { "total_passed": 11, "total_assertions": 16, "overall_pass_rate": 0.688 },
    "delta": 0.187
  }
}
```

关键指标：`delta` = with_skill 通过率 - without_skill 通过率，目标 >= 0.15。负 delta 需在 benchmark.md 中诚实归因。

### 3.5 结果目录结构

```
{skill-name}-workspace/
└── iteration-1/
    ├── eval-1/
    │   ├── with_skill/outputs/
    │   ├── without_skill/outputs/
    │   └── grading.json
    ├── eval-2/ ...
    ├── eval-3/ ...
    ├── benchmark.json
    └── benchmark.md
```

---

## 四、常见陷阱与最佳实践

### 陷阱 1：Markdown 表格分隔符导致正则假阴性

`contains_regex` 正则如 `\d+\s*(回复|浏览)` 期望匹配"34 回复"，但 Markdown 表格 `| 34 | 54 |` 中 `|` 阻断了匹配。**修复**：元数据用行内格式 `**帖子 #1** (📊 34 回复 / 512 浏览)` 替代纯表格，或双保险同时输出两种格式。（来源：trae-forum-pro eval-1，正则假阴性导致 -20% delta）

### 陷阱 2：Description 触发力不足导致欠触发

Skill 在应激活场景下未被触发。**修复**：采用 pushy description，覆盖 10+ 触发关键词，包含"即使未明确提及也应激活"指令，列举 5+ 种用户表述、隐含场景、近义词覆盖。（来源：trae-device-security 覆盖 10+ 触发信号 + 12 种激活场景）

### 陷阱 3：SKILL.md 超过 500 行

内容过多挤占上下文窗口，降低推理质量。**修复**：严格执行 Progressive Disclosure，SKILL.md 只保留工作流和关键模板，详细规范移入 references/，用 `> 详细规范见 references/{file}.md` 引用。（来源：trae-forum-pro SKILL.md 475 行 + references/ 1022 行）

### 陷阱 4：ProseMirror 编辑器填充失败

Discourse 论坛使用 ProseMirror 富文本编辑器，非普通 textarea，直接调用 API 会因 view.state 未就绪而失败。**修复**：使用剪贴板粘贴方案 — `execCommand('copy')` + `Ctrl+V`：

```javascript
await page.evaluate((text) => {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}, markdownContent);
await page.keyboard.press('Control+v');
```

### 陷阱 5：Cookie 过期导致发帖失败

Session Cookie 有效期约 30 天，过期后所有自动化操作无效。**修复**：发帖前检查 `_forum_session` + `sessionid` 字段是否存在（字段缺失一定无效），失败时运行 debug 脚本排查，关键标志：页面显示"登录"按钮 = 已过期。

### 陷阱 6：Playwright chromium 找不到

`chromium.launch()` 默认找 headless_shell 但环境中未安装。**修复**：先运行 `bash scripts/setup-deps.sh` 安装依赖，然后指定 `executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'`。

### 最佳实践 1：解释 WHY 而非只说 WHAT

LLM 具备推理能力，"先检查 Cookie——因为过期 Cookie 会导致后续所有操作静默失败"比"必须先检查 Cookie"更有效。避免 MUST/ALWAYS/NEVER 全大写，改用自然语言解释原因。

### 最佳实践 2：每次只迭代一个维度

多维度同时修改导致无法归因。正确做法：从 benchmark.json 定位最低通过率断言 → 追溯到 SKILL.md 对应模块 → 只修改该模块 → 重跑 benchmark 验证 → 确认有效再处理下一个。

### 最佳实践 3：Progressive Disclosure 保持 SKILL.md 精简

SKILL.md 是"操作手册"不是"百科全书"：工作流和关键模板放 SKILL.md，详细数据/模板/最佳实践放 references/ 按需加载。额外好处：references/ 可独立更新，数据源变化时只需更新对应文件。

---

## 五、Skill 创建自检清单

1. SKILL.md 行数：`wc -l SKILL.md` < 500
2. 目录完整性：SKILL.md + references/(>=2 文件) + scripts/ + evals/evals.json 都存在
3. Frontmatter：name / description / compatibility 三字段完整
4. Description：覆盖 10+ 触发关键词，包含"即使未明确提及也应激活"指令
5. 触发场景：>= 10 个，含隐含场景
6. 模块结构：每个模块包含工作流 + 步骤详解 + 输出模板 + 边界处理
7. Eval 数量：>= 3 个 eval，>= 15 个总断言
8. grading.json：使用 text/passed/evidence 严格字段名
9. benchmark.json：含 run_summary.with_skill/without_skill/delta
10. .skill 打包：zip 格式，解压后 SKILL.md 在根目录
