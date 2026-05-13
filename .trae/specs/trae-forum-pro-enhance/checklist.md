# Checklist

## Task 1: SKILL.md 模块 D 增强
- [ ] 模块 D 包含 D.5 "一键发布到论坛"子工作流描述
- [ ] D.5 包含完整的 10 步发布流程（Cookie检查→导航→编辑器→标题→正文→标签→发布→跳转→验证→记录）
- [ ] 包含发帖板块 URL 映射表（5种类型对应5个URL）
- [ ] 包含 Cookie 过期检测逻辑说明
- [ ] 包含 4 种失败回退策略（过期/编辑器/超时/验证失败）
- [ ] 发布成功输出格式已定义（标题/URL/ID/板块）
- [ ] 原有 D.1-D.4 子能力（草稿管理/跟踪/回复辅助）保持不变
- [ ] SKILL.md 总行数 < 500 行

## Task 2: forum-publish.sh 脚本
- [ ] scripts/forum-publish.sh 存在且可执行（权限 755）
- [ ] 支持必填参数：markdown_file 和 title
- [ ] 支持可选参数：category（默认37）和 --dry-run
- [ ] 包含 Cookie 有效性验证逻辑
- [ ] 封装了 Node.js Playwright 发帖调用
- [ ] 有明确的成功/失败输出格式

## Task 3: post-templates.md 增强
- [ ] references/post-templates.md 末尾包含"发布前自检清单"
- [ ] 自检清单包含 ≥ 5 个检查项
- [ ] 检查项覆盖：标题质量、环境信息、复现步骤、板块选择、标签推荐

## Task 4: Iteration 2 Benchmark
- [ ] trae-forum-pro-workspace/iteration-2/ 目录存在
- [ ] 3 组 with-skill subagent 已完成（有输出文件和 grading.json）
- [ ] 3 组 baseline subagent 已完成（有输出文件和 grading.json）
- [ ] iteration-2/benchmark.json 存在且格式正确
- [ ] benchmark 包含与 iteration-1 的对比数据
- [ ] Eval#1 通过率 ≥ Iteration-1（正则修复应生效）
- [ ] 总通过率 ≥ 95%（预期修复后达 100% 或接近）

## Task 5: 最终验证
- [ ] SKILL.md 行数 < 500
- [ ] forum-publish.sh 可执行且有完整功能
- [ ] post-templates.md 含发布前自检清单
- [ ] Iteration 2 benchmark 数据已聚合
- [ ] 全部 checklist 项已勾选
