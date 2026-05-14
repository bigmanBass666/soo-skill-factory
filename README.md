# 🏭 SOO Skill Factory

## 一句话
用 SOLO 创造 SOLO Skill 的递归自举作品集 —— 三个 Skill，覆盖 TRAE 用户完整生命周期。

## 📦 三个 Skill

### 1️⃣ trae-device-security — 账号安全管家
- **定位**：解决"今天先到这里也不错"风控锁定的账号安全工具
- **核心能力**：设备管理诊断 + 风控状态检测 + 安全建议 + 论坛一键发帖
- **Benchmark**：with_skill 93.8% vs baseline 67.1%（**+26.7%**）
- **参赛帖**：[#17079](https://forum.trae.cn/t/topic/17079)
- **适用场景**：多设备登录被锁、想了解风控机制、需要快速发产品建议帖

### 2️⃣ trae-forum-pro — 论坛社区全能助手
- **定位**：TRAE 官方论坛的智能搜索、格式化、趋势分析工具
- **核心能力**：智能搜索(4模式) + 帖子格式化(4模板) + 社区趋势分析 + 互动管理
- **Benchmark**：with_skill 100% vs baseline 83.3%（**+16.7%**）
- **参赛帖**：[#17166](https://forum.trae.cn/t/topic/17166)
- **适用场景**：在论坛搜答案、写高质量帖子、跟踪社区动态

### 3️⃣ trae-workflow-automator — Skill 创建元工具 ⭐
- **定位**："造 Skill 的 Skill"——从构思到发布一站搞定
- **核心能力**：4模块工作流(A:构思规划 → B:SKILL.md生成 → C:Evals/Benchmark → D:迭代/发布)
- **Benchmark**：with_skill 100% vs baseline 50%（**+50%**，超额3.3倍）
- **参赛帖**：[#17234](https://forum.trae.cn/t/topic/17234)
- **适用场景**：从零创建Skill、写SKILL.md、跑benchmark、参加创作赛

## 🔥 核心亮点：递归自举

第三个 Skill（workflow-automator）是用它自己的方法论创建的。

就像一把锤子，用它自己造出了自己。这验证了 SOLO 平台的能力边界——**AI 不只是执行者，更是工具制造者。**

## 📊 Benchmark 总览

| Skill | with_skill | baseline | 提升 | 状态 |
|-------|-----------|----------|------|------|
| device-security | 93.8% | 67.1% | **+26.7%** | ✅ 已发布 |
| forum-pro | 100% | 83.3% | **+16.7%** | ✅ 已发布（已增料 v2） |
| workflow-automator | 100% | 50% | **+50%** | ✅ 已发布 |

测试方法：每个 eval 同时运行 with-skill 和 without-skill(baseline) 两组 subagent，通过断言评分后聚合。

## 🎯 使用场景矩阵

| 你的需求 | 推荐组合 |
|---------|---------|
| 多设备登录被锁？ | device-security |
| 想在论坛搜答案/发帖？ | forum-pro |
| 想从零创建新 Skill？ | workflow-automator |
| 全流程（构思→发布）？ | 三个组合使用！ |
| 参加 SOLO 技能创作赛？ | workflow-automator 一键生成 |

## 📥 获取 Skill

### 方式一：直接下载 .skill 文件
[releases/](./releases/) 目录下有打包好的 .skill 文件，直接下载即可：

- [trae-device-security.skill](./releases/trae-device-security.skill) (27KB zip)
- [trae-forum-pro.skill](./releases/trae-forum-pro.skill) (42KB zip)
- [trae-workflow-automator.skill](./releases/trae-workflow-automator.skill) (21KB zip)

### 方式二：查看源码
[skills/](./skills/) 目录下是完整的 Skill 源码，含 SKILL.md、references、scripts、evals。

### 安装方式
详见 [INSTALL.md](./INSTALL.md)

## 🔗 相关链接

- **SOLO 技能创作赛**：https://forum.trae.cn/c/37-category/37
- **作者主页**：https://forum.trae.cn/u/157977cf60964130f3ab09543a932a5e
- **抽奖问卷**：https://bytedance.larkoffice.com/share/base/form/shrcn7YanxCtmlZPmpUJtyhr9Re

## 🏆 技术栈

- SKILL.md Progressive Disclosure 三层加载架构
- Eval-driven Development（18+ assertions per skill）
- Pushy Description 触发优化策略
- Playwright 自动化论坛发布/评论
- Bash 脚手架工具链
- Discourse API 帖子更新（PUT raw）

## 📢 社区运营

| 动作 | 状态 | 链接 |
|------|------|------|
| SpecForge #2000 评论 | ✅ 已发布 | [#55377](https://forum.trae.cn/t/topic/2000) |
| forum-pro #17166 增料 | ✅ v2 上线 | 实战案例 + 社区痛点 + 协同组合 |

---

*SOO Skill Factory by bigmanBass666 | 2026 SOLO 技能创作赛 | [TRAE 官方社区](https://forum.trae.cn)*
