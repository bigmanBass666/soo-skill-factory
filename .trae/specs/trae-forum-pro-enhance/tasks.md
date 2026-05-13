# Tasks

- [ ] Task 1: 增强 SKILL.md 模块 D — 新增自动发布能力
  - [ ] 在模块 D 中新增 D.5 子工作流"一键发布到论坛"（10步完整流程）
  - [ ] 新增发帖板块 URL 映射表（5种帖子类型 → 5个目标板块）
  - [ ] 定义 Cookie 检查与过期处理逻辑
  - [ ] 定义失败回退策略（4种场景：过期/编辑器/超时/验证失败）
  - [ ] 更新输出格式规范总览表，加入发布相关条目
  - [ ] 确保 SKILL.md 总行数 < 500 行

- [ ] Task 2: 创建 scripts/forum-publish.sh 发帖辅助脚本
  - [ ] 实现参数解析（markdown_file / title / category / --dry-run）
  - [ ] 实现 Cookie 读取与有效性验证
  - [ ] 封装 Node.js Playwright 发帖调用
  - [ ] 实现输出格式化（成功返回 URL，失败返回原因）
  - [ ] 设置可执行权限

- [ ] Task 3: 增强 references/post-templates.md
  - [ ] 在文件末尾新增"发布前自检清单"章节（5项检查点）

- [ ] Task 4: 运行 Iteration 2 Benchmark 验证
  - [ ] 复用 evals/evals.json 的 3 个测试场景定义
  - [ ] 启动 3 组 with-skill subagent（使用优化后的 SKILL.md）
  - [ ] 启动 3 组 baseline subagent（复用 iteration-1 的 baseline 输出或重新跑）
  - [ ] 草拟 assertions 并生成 grading.json（6个）
  - [ ] 聚合为 iteration-2/benchmark.json + benchmark.md
  - [ ] 与 iteration-1 对比分析 delta 变化

- [ ] Task 5: 最终验证与交付
  - [ ] 全量 checklist 验证通过
  - [ ] 确认 SKILL.md < 500 行
  - [ ] 确认 forum-publish.sh 可执行
  - [ ] 确认 Iteration 2 benchmark 数据合理（预期总通过率 ≥ 95%）

# Task Dependencies
- [Task 2, Task 3] can run in parallel after [Task 1]
- [Task 4] depends on [Task 1] (需要优化后的 SKILL.md)
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
