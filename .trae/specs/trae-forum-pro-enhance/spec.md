# trae-forum-pro 增强版：发帖能力整合 + Iteration 2 验证 Spec

## Why

forum-pro Skill 当前只能"帮用户写好帖子"，但实际发帖需要依赖外部 JS 脚本（`publish-forum-pro.js`）。同时 SKILL.md 在 Iteration 1 后做了优化（正则修复+差异化增强），但未重新跑 eval 验证改进效果。本次增强将：(1) 把已验证的 Playwright 发帖流程写入模块 D，实现从"写帖"到"写帖+发帖"的闭环；(2) 跑 Iteration 2 确认优化生效并拿到干净的 benchmark 数据。

## What Changes

- **修改 `trae-forum-pro/SKILL.md`** — 模块 D 新增"自动发布"子工作流（Cookie 管理 → 编辑器填充 → 标签 → 发布 → 验证），新增"发帖脚本参考"章节
- **新增 `scripts/forum-publish.sh`** — Bash 封装的发帖辅助脚本（读取 cookie → 调用 Node 发帖 → 返回帖子 URL）
- **修改 references/post-templates.md** — 补充"发布前自检"清单
- **运行 Iteration 2 eval** — 复用 iteration-1 的 eval 定义，用优化后的 SKILL.md 重新跑 with-skill，对比 improvement
- **更新参赛帖 #17166** — 如 Iteration 2 数据更好，追加到帖子评论区或更新内容

## Impact

- Affected specs: trae-forum-pro-skill（已有，本次为增强迭代）
- Affected code: `trae-forum-pro/SKILL.md`、`scripts/`、`evals/`
- 不影响 trae-device-security（独立 Skill）

## ADDED Requirements

### Requirement: 模块 D 增强 — 自动发布能力

系统 SHALL 将已验证的 Playwright 发帖流程集成到 Skill 的模块 D 中。

#### 子工作流 D.5: 一键发布到论坛

**前置条件**：
- 用户已确认帖子内容无误
- `cookie.md` 包含有效的 TRAE 论坛 session Cookie
- 环境安装了 playwright（`npm install playwright`）且 Chrome 可用（`/opt/google/chrome/chrome`）

**步骤**：

1. **Cookie 检查** — 读取 `~/.trae/cookie.md` 或 `/workspace/cookie.md`，验证 `_forum_session` 和 `sessionid` 字段存在且未过期。如过期则提示用户重新导出 Cookie
2. **目标页面导航** — 根据帖子类型确定发布板块 URL：
   | 类型 | 板块 URL |
   |------|-----------|
   | 产品建议 | `https://forum.trae.cn/c/8-category/8` |
   | Bug 反馈 | `https://forum.trae.cn/c/22-category/22` |
   | 求助提问 | `https://forum.trae.cn/c/7-category/7` |
   | 经验分享 | `https://forum.trae.cn/c/9-category/9` |
   | 技能创作赛 | `https://forum.trae.cn/c/37-category/37` |
3. **打开编辑器** — 点击 `#create-topic` 按钮，等待编辑器加载
4. **填写标题** — 向 `#reply-title` 输入标题文本
5. **填写正文** — 使用 clipboard 方案（execCommand('copy') + Ctrl+V）向 `.d-editor-input` 粘贴 Markdown 内容。ProseMirror API 作为首选方案（fallback 到 clipboard）
6. **添加标签** — 通过 `.mini-tag-chooser` 添加推荐标签
7. **点击发布** — 点击 `.save-or-cancel .create` 按钮
8. **等待跳转** — 监听 URL 变化为 `/t/topic/` 格式，提取帖子 ID
9. **验证发布** — 访问帖子 URL 确认内容完整（正文长度 > 100 字符）
10. **记录发布** — 将帖子 URL 写入 `~/.trae/forum-drafts/published.json`

#### 输出格式

```
✅ 发布成功！
📎 标题: {title}
📎 URL:  https://forum.trae.cn/t/topic/{ID}
📎 ID:  #{ID}
📎 板块: {category}
```

**失败回退策略**：
- Cookie 过期 → 提示重新导出，保存草稿到 drafts/
- 编辑器未找到 → 截图诊断，提示手动发布
- 发布超时 → 保存草稿，返回可能的错误信息
- 内容验证失败 → 报告正文长度异常，建议检查 Markdown 格式

### Requirement: forum-publish.sh 辅助脚本

系统 SHALL 提供 `scripts/forum-publish.sh` 脚本封装发帖流程：

- **用法**: `./forum-publish.sh <markdown_file> <title> [category]`
- **参数**:
  - `<markdown_file>`: 要发布的 Markdown 文件路径（必填）
  - `<title>`: 帖子标题（必填）
  - `[category]`: 目标板块（可选，默认 `37` 即技能创作赛）
- **功能**:
  - 读取 cookie.md 并验证有效性
  - 调用内部 Node.js Playwright 脚本执行发帖
  - 输出帖子 URL 或失败原因
  - 支持 dry-run 模式（`--dry-run` 只预览不发布）

### Requirement: Iteration 2 Benchmark 验证

系统 SHALL 使用优化后的 SKILL.md 重新运行 eval 测试，验证 Iteration 1 的优化是否生效：

- **复用** `evals/evals.json` 的 3 个测试场景定义不变
- **输出目录**: `trae-forum-pro-workspace/iteration-2/`
- **预期改进**:
  - Eval#1（搜索）: 正则修复后 `output_contains_post_metadata` 应通过，预期 80% → **100%**
  - Eval#2（Bug帖）: 保持 100%
  - Eval#3（趋势）: 差异化增强后应有更多独特内容可断言
- **与 Iteration-1 对比**: 在 benchmark 分析中明确标注 delta 变化
- **成功标准**: 总通过率 ≥ 95%（当前 93.8%，修复 1 个假阴性即可达 100%）

## MODIFIED Requirements

### Requirement: 模块 D 重构

现有模块 D（互动管理工具）保留草稿管理/帖子跟踪/回复辅助三个子能力不变，新增 D.5 自动发布作为第四个子能力。调整模块 D 的输出格式总览表，加入发布相关条目。

### Requirement: post-templates.md 增强

在 `references/post-templates.md` 末尾新增"**发布前自检清单**"章节（5 项）：
- [ ] 标题不含泛化词（"求助"/"一个问题"/"有个bug"）
- [ ] 环境信息完整（≥2 项具体数据）
- [ ] 复现步骤编号清晰（1. 2. 3. 格式）
- [ ] 已选择正确的目标板块
- [ ] 标签推荐合理（2-5 个）

## REMOVED REQUIREMENTS

无。
