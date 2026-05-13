# Checklist

## Task 1: SKILL.md 核心文件
- [x] Skill 目录结构完整（trae-device-security/SKILL.md + references/ + scripts/）
- [x] frontmatter 包含 name/description/compatibility 三个字段
- [x] description 字段包含"pushy"触发关键词（多设备/风控/今天先到这里/论坛反馈/账号安全/设备管理）
- [x] 正文包含 Skill 概述段落
- [x] 正文包含明确的触发场景列表
- [x] 模块 A（设备登录追踪）工作流描述清晰
- [x] 模块 B（风控预警诊断）工作流描述清晰
- [x] 模块 C（反馈帖生成）工作流描述清晰，含输出格式模板
- [x] 模块 D（论坛自动发帖）工作流描述清晰，含 Playwright 步骤
- [x] 最佳实践知识库包含至少 6 条安全建议
- [x] SKILL.md 总行数 < 500 行（实际 479 行）

## Task 2: 参考文件
- [x] references/forum-data.md 存在且包含 >= 6 个社区帖子摘要
- [x] 每个帖子摘要包含：编号、标题、回复数、浏览量、核心结论
- [x] references/best-practices.md 存在且内容详实

## Task 3: 辅助脚本
- [x] scripts/device-log.sh 存在且可执行
- [x] 支持 init/add/list/remove/clean/status 命令

## Task 4: 测试用例
- [x] evals/evals.json 存在且格式正确
- [x] 包含至少 3 个 eval 条目
- [x] 每个 eval 有 id/prompt/expected_output/files 字段
- [x] eval-1 覆盖风控诊断场景
- [x] eval-2 覆盖反馈帖生成场景
- [x] eval-3 覆盖安全检查场景

## Task 5: 测试运行与评估
- [x] 3 组 with-skill subagent 已启动并完成
- [x] 3 组 without_skill/baseline subagent 已启动并完成
- [x] 每个 run 目录有 timing.json（total_tokens + duration_ms）
- [x] assertions 已草拟并写入 eval_metadata.json（16 个断言）
- [x] grading.json 已生成（使用 text/passed/evidence 字段，共 6 个）
- [x] benchmark.json 已聚合生成（with_skill 88.9% vs baseline 62.2%）
- [~] eval viewer — generate_review.py 不可用（headless 环境），已直接呈现 benchmark 结果

## Task 6: 迭代优化
- [x] 基于 benchmark 结果改进 SKILL.md 模块 C（P0/P1/P2 格式强化 + 预期效果段补全）

## Task 7: 参赛帖发布
- [x] 参赛帖按大赛投稿指南格式撰写完成
- [x] 参赛帖包含 Skill 完整介绍（7 大章节）
- [x] 参赛帖包含使用场景演示（3个eval 输出作为示例 + benchmark 数据对比）
- [x] 参赛帖包含核心代码展示（SKILL.md 结构、references 数据源、scripts 工具）
- [x] 参赛帖已发布到 SOLO 技能创作赛专区 (https://forum.trae.cn/t/topic/17079)
- [~] 飞书抽奖问卷 — 需用户自行提交（链接：https://bytedance.larkoffice.com/share/base/form/shrcn7YanxCtmlZPmpUJtyhr9Re）

## Task 8: 打包交付
- [x] .skill 文件已打包生成（tar.gz 格式，24KB）
- [x] 文件路径：/workspace/trae-device-security.skill
