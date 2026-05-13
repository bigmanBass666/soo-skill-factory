# Checklist

## Task 1: .context/ 目录和核心文件
- [ ] .context/ 目录已创建
- [ ] activeContext.md 存在且 ≤ 50 行
- [ ] activeContext.md 包含：当前活跃任务、阻塞项、更新时间戳、关键上下文提示
- [ ] progress.md 存在且 ≤ 150 行
- [ ] progress.md 包含：已完成项列表（含产出物链接）、进行中项、下一步候选、时间线
- [ ] progress.md 包含 trae-community-action-plan.md 的所有有效信息
- [ ] progress.md 包含当前阶段 5 个候选方向的完整记录
- [ ] decisions.md 存在且 ≤ 100 行
- [ ] decisions.md 包含至少 5 条关键决策记录（含日期/决策/理由/替代方案/影响）

## Task 2: AGENTS.md 上下文恢复协议
- [ ] AGENTS.md 包含 "Context Recovery Protocol" 章节
- [ ] 协议指定新会话开始时读取 .context/ 的顺序
- [ ] 协议指定会话结束前更新 .context/activeContext.md

## Task 3: 迁移标注
- [ ] trae-community-action-plan.md 顶部有迁移标注
- [ ] 标注指向 .context/progress.md

## 整体验证
- [ ] 一个全新的 AI Agent 仅通过读取 AGENTS.md + .context/ 就能理解项目当前状态
- [ ] .context/ 文件总行数 ≤ 300 行（50+150+100）
