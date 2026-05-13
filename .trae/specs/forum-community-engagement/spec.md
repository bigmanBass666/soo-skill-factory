# 论坛社区运营 Spec — 热门帖评论 + 自家帖子增料

## Why

当前三个参赛帖中，#17079 device-security 有 3 条回复（含版主互动），但 #17166 forum-pro 零回复、#17234 workflow-automator 审核中。社区曝光度不足直接影响评审关注度和传播奖竞争力。

同时论坛上存在一个超高热度帖子 [SpecForge (#2000)](https://forum.trae.cn/t/topic/2000)，80 回复、被标记为精华神帖，是全社区最火的 Skill 相关讨论。在该帖下留高质量评论是性价比最高的自然引流方式。

## What Changes

- **在 SpecForge #2000 帖子下发布一条高质量评论** —— 分享 SOO Skill Factory 的"递归自举"独特视角 + 量化 benchmark 数据，自然引流到三个参赛帖
- **更新 #17166 forum-pro 参赛帖内容** —— 补充实战案例、解决社区痛点（skill 调用难/格式不规范），提升帖子的信息密度和吸引力
- **新增 `scripts/forum-reply.js` 脚本** —— 基于现有 Playwright 发帖基础设施，实现论坛评论发布能力

## Impact

- Affected specs: 无已有 spec 受影响（纯运营操作）
- Affected code: `scripts/forum-reply.js`（新增）、`posts/forum-pro-competition-post.md`（更新）
- 论坛帖子：#2000（新增评论）、#17166（内容更新）

## ADDED Requirements

### Requirement: SpecForge 热门帖高质量评论

系统 SHALL 在 [SpecForge #2000](https://forum.trae.cn/t/topic/2000) 帖子下发布一条高质量评论。

#### 评论内容要求

- **WHEN** 用户确认发送
- **THEN** 评论应满足以下标准：

1. **有实质内容**（≥ 300 字）：不是简单的"厉害""学习了"，而是基于对原帖内容的真实理解和延伸思考
2. **展示独特视角**：从"递归自举"角度分享 SOO Skill Factory 的经验 —— 用 SOLO 创造 SOLO Skill，第三个 Skill (workflow-automator) 用自身方法论创建了自己
3. **附带量化数据**：提及 benchmark 数据（+26.7% / +16.7% / +50%），用数字说话
4. **自然引流**：在评论末尾或相关上下文中自然提及三个参赛帖链接，不生硬不 spam
5. **语气真诚**：像一个真实的社区参与者，不是营销号

#### 评论结构建议

```
[对原帖的认可 + 具体引用点]
[自己的实践补充（递归自举经验）]
[数据支撑（benchmark 结果）]
[延伸思考/提问（引发进一步讨论）]
[低调的自我介绍 + 链接]
```

### Requirement: forum-pro 参赛帖 #17166 内容增补

系统 SHALL 更新 #17166 帖子内容，增加信息密度和吸引力。

#### 增补内容要求

1. **实战案例章节**：补充 1-2 个具体使用场景示例（如"如何在论坛搜到精确答案"、"如何写出一篇不会被忽略的技术帖"）
2. **社区痛点回应**：针对论坛上常见抱怨（"skill 不按要求执行""调用方式不好用"），说明 forum-pro 如何帮助改善这些体验
3. **与其他 Skill 的协同**：说明 forum-pro 与 device-security / workflow-automator 如何组合使用，形成完整工具链
4. **视觉优化**：如有必要，调整排版使关键信息（下载链接/benchmark 数据/使用场景）更突出

#### 场景: 帖子更新成功

- **WHEN** 通过 Playwright PUT API 推送更新后的完整 Markdown 到 #17166
- **THEN** 帖子内容包含增补章节，原有内容完整保留，下载链接有效

### Requirement: forum-reply.js 评论脚本

系统 SHALL 提供 `scripts/forum-reply.js` 脚本用于在指定帖子下发表评论：

- **用法**: `node scripts/forum-reply.js <topicId> <contentFile>`
- **参数**:
  - `<topicId>`: 目标帖子 ID（如 `2000`）
  - `<contentFile>`: 评论内容的 Markdown 文件路径
- **功能**:
  - 读取 cookie.md 获取登录态
  - 使用 Playwright 打开目标帖子
  - 定位到回复编辑器区域
  - 通过 clipboard 方案粘贴评论内容
  - 点击回复按钮
  - 验证评论发布成功（检查页面出现新回复）
  - 输出评论 URL

## MODIFIED Requirements

无。

## REMOVED Requirements

无。
