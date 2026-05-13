# Tasks

- [x] Task 1: 撰写 SpecForge #2000 高质量评论内容
  - [x] 深入阅读 SpecForge 原帖 (#2000)，提取关键观点和亮点
  - [x] 结合 SOO Skill Factory 的"递归自举"特色，撰写 ≥300 字的评论初稿
  - [x] 融入 benchmark 数据（+26.7% / +16.7% / +50%）作为量化支撑
  - [x] 自然植入三个参赛帖链接，确保不显 spam
  - [x] 将最终评论内容保存到 `posts/specforge-reply.md`

- [x] Task 2: 创建 forum-reply.js 评论发布脚本
  - [x] 基于现有 publish-forum-pro.js 的 Playwright 模式，创建 forum-reply.js
  - [x] 实现参数解析：topicId + contentFile
  - [x] 实现 Cookie 注入和登录态验证
  - [x] 实现定位帖子回复编辑器（多策略回退）
  - [x] 通过 clipboard 方案粘贴 Markdown 评论内容
  - [x] 点击回复按钮并等待发布完成
  - [x] 验证评论出现并输出评论 URL

- [x] Task 3: 增补 forum-pro 参赛帖 (#17166) 内容
  - [x] 阅读当前 posts/forum-pro-competition-post.md 全文
  - [x] 搜索论坛社区关于 skill 使用痛点的讨论
  - [x] 撰写实战案例章节（2 个完整输入→输出示例）
  - [x] 撰写社区痛点回应章节（4 大痛点逐一回应）
  - [x] 撰写 Skill 协同使用章节（三 Skill 组合 + 用户故事）
  - [x] 将增补内容合并到完整帖子 Markdown 中，保存为更新版

- [x] Task 4: 执行评论发布到 SpecForge #2000
  - [x] 确认 cookie.md 存在且有效
  - [x] 运行 forum-reply.js 发布评论到 #2000
  - [x] 验证评论成功发布（评论 ID: #55377）
  - [x] 记录评论 URL

- [x] Task 5: 执行 #17166 帖子内容更新
  - [x] 确认 cookie.md 有效
  - [x] 通过 API 将更新后的完整 Markdown 推送到 #17166 (post_id: 80287)
  - [x] 验证更新后帖子 HTTP 200 且正文长度合理（23,719 字符）
  - [x] 确认原有下载链接未丢失

# Task Dependencies
- [Task 2, Task 3] can run in parallel after [Task 1]
- [Task 4] depends on [Task 1, Task 2]（需要评论内容 + 发布脚本）
- [Task 5] depends on [Task 3]（需要增补后的帖子内容）
- [Task 1, Task 2, Task 3] can run in parallel
