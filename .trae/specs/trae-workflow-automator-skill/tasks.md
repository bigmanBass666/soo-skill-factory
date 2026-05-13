# Tasks

- [x] Task 1: 创建 Skill 目录结构与 SKILL.md 核心文件
  - [x] 创建 `trae-workflow-automator/` 目录及子目录（references/、scripts/、evals/）
  - [x] 编写 SKILL.md frontmatter（name/description/compatibility）
  - [x] 编写 SKILL.md 正文 — Skill 概述 + 触发场景列表（12个）
  - [x] 编写模块 A：Skill 构思与规划工作流（需求分析5步 + 构思报告模板）
  - [x] 编写模块 B：SKILL.md 生成引擎工作流（4步生成策略 + pushy description 编写策略）
  - [x] 编写模块 C：Evals 定义与 Benchmark 执行工作流（evals设计 + benchmark5步 + 目标+15%）
  - [x] 编写模块 D：迭代优化与发布工作流（weak point分析 + 参赛帖7章模板 + Playwright发布 + 打包）
  - [x] 编写输出格式规范与最佳实践
  - [x] 确保 SKILL.md 总行数 < 500 行（实际378行）

- [x] Task 2: 创建 references/ 参考文件
  - [x] 编写 `references/skill-creation-guide.md`（292行）— Skill 创建完整指南
  - [x] 编写 `references/contest-rules.md`（143行）— SOLO 技能创作赛规则与投稿指南

- [x] Task 3: 创建 scripts/ 辅助脚本
  - [x] 编写 `scripts/skill-scaffold.sh` — Skill 脚手架生成脚本（init/check/pack/eval-init）

- [x] Task 4: 定义测试用例 evals
  - [x] 创建 `evals/evals.json`，定义 3 个测试用例 + 18个断言

- [x] Task 5: 运行测试用例（with-skill + baseline 并行评估）
  - [x] 启动 6 个并行 subagent（3 with-skill + 3 baseline）
  - [x] 执行 grading — 生成 6 个 grading.json
  - [x] 聚合 benchmark 数据 — benchmark.json
  - [x] 结果：with_skill 100% vs baseline 50%，delta +50%（远超+15%目标）

- [x] Task 6: 根据 benchmark 反馈迭代优化 Skill
  - [x] 分析：with_skill 100%通过率，无需迭代优化

- [x] Task 7: 撰写参赛帖并发布到 SOLO 技能创作赛
  - [x] 按大赛投稿指南格式撰写参赛帖子（7章标准格式）
  - [x] 通过 Playwright 发布到 https://forum.trae.cn/c/37-category/37
  - [x] 发布状态：✅ 已提交，等待版主审核（"帖子需要审批"确认弹窗）
  - [ ] 记录发布后的帖子编号和 URL（审核通过后更新）

- [x] Task 8: 打包 Skill 文件并做最终验证
  - [x] 打包为 trae-workflow-automator.skill (17KB tar.gz)
  - [x] 全量 checklist 验证通过

# Task Dependencies
- [Task 2, Task 3] can run in parallel after [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] can start after [Task 5]
- [Task 8] depends on [Task 6, Task 7]
