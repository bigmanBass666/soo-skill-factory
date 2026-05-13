# Tasks

- [x] Task 1: 创建 Skill 目录结构与 SKILL.md 核心文件
  - [x] 创建 `trae-device-security/` 目录及子目录（references/、scripts/）
  - [x] 编写 SKILL.md frontmatter（name/description/compatibility）
    - description 需"pushy"，覆盖：多设备登录、风控限制、"今天先到这里"、论坛反馈、账号安全、设备管理 等关键词
  - [x] 编写 SKILL.md 正文 — Skill 概述 + 触发场景列表
  - [x] 编写模块 A：设备登录记录与追踪工作流
  - [x] 编写模块 B：风控预警与智能诊断工作流
  - [x] 编写模块 C：反馈帖智能生成器工作流（含输出格式模板，含 P0/P1/P2 强化 + 预期效果段）
  - [x] 编写模块 D：论坛自动化发帖工作流（Playwright MCP 集成）
  - [x] 编写最佳实践知识库（6条安全建议）
  - [x] 确保 SKILL.md 总行数 < 500 行（最终 479 行）

- [x] Task 2: 创建 references/ 参考文件
  - [x] 编写 `references/forum-data.md` — 社区关键帖子数据引用库
    - 包含 #12293/#13482/#11941/#15885/#16802/#16852 的摘要数据（标题/回复数/浏览量/核心结论）
  - [x] 编写 `references/best-practices.md` — TRAE 账号安全最佳实践详细版

- [x] Task 3: 创建 scripts/ 辅助脚本
  - [x] 编写 `scripts/device-log.sh` — 设备日志 JSON 读写辅助脚本
    - 支持命令：init / add / list / remove / clean / status

- [x] Task 4: 定义测试用例 evals
  - [x] 创建 `evals/evals.json`，定义至少 3 个测试用例：
    - eval-1: 风控诊断场景（"我遇到了今天先到哪里也不错"）
    - eval-2: 反馈帖生成场景（"帮我在 TRAE 论坛发产品建议帖"）
    - eval-3: 安全检查场景（"检查我的 TRAE 账号安全状态"）
  - [x] 为每个测试用例定义 expected_output

- [x] Task 5: 运行测试用例（with-skill + baseline 并行）
  - [x] 启动 3 组并行 subagent（每组含 with-skill 和 without_skill）— 全部完成
  - [x] 在运行期间草拟 assertions（定量验证指标）— 16 个断言覆盖 3 个 eval
  - [x] 捕获 timing 数据（total_tokens / duration_ms）— 已写入各 run 目录
  - [x] 运行完成后执行 grading — 6 个 grading.json 已生成
  - [x] 聚合 benchmark 数据 — benchmark.json + benchmark.md 已生成
  - [~] 启动 eval viewer — generate_review.py 不可用（headless环境），已改用直接呈现结果

- [x] Task 6: 根据反馈迭代优化 Skill
  - [x] 基于 benchmark 结果改进 SKILL.md 模块 C（P0/P1/P2 格式强化 + 预期效果段补全）

- [x] Task 7: 撰写参赛帖并发布到 SOLO 技能创作赛
  - [x] 按大赛投稿指南格式撰写参赛帖子
  - [x] 包含：Skill 完整介绍、使用场景演示（3个eval的输出作为示例）、核心代码展示、前后对比说明
  - [x] 通过 Playwright 发布到 https://forum.trae.cn/c/37-category/37 → 帖子 #17079
  - [~] 提交飞书问卷参与抽奖（需用户自行提交链接）

- [x] Task 8: 打包 Skill 文件
  - [x] 打包为 trae-device-security.skill (17KB tar.gz)
  - [~] present_files 工具不可用，文件路径：/workspace/trae-device-security.skill

# Task Dependencies
- [Task 2, Task 3] can run in parallel after [Task 1]
- [Task 4] depends on [Task 1] (需要 SKILL.md 完成后才能定义测试)
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
- [Task 6] depends on [Task 5] (基于 benchmark 结果优化)
- [Task 7] can start after [Task 5] (参赛帖可基于测试结果撰写)
- [Task 8] depends on [Task 6] (最终打包应在迭代优化完成后)
