# SOLO Skill 安装指南

## 前置条件
- TRAE IDE（桌面端或网页端）
- 已安装的 SOLO 功能（支持自定义 Skill）

## 安装方式一：使用 .skill 文件（推荐）

### Step 1：下载 .skill 文件
从 [releases/](./releases/) 目录下载对应的 .skill 文件

### Step 2：导入到 TRAE IDE
- 打开 TRAE IDE
- 进入设置/Skills 管理/自定义 Skill 页面
- 选择"导入 Skill"或"添加本地 Skill"
- 选择下载的 .skill 文件
- 确认导入成功

### Step 3：验证安装
- 在对话中尝试触发该 Skill（参考各 Skill 的触发关键词）
- 如果 Skill 正确响应 = 安装成功

## 安装方式二：手动部署源码

### Step 1：Clone 或下载 skills/ 目录
```bash
git clone https://github.com/bigmanBass666/soo-skill-factory.git
```

### Step 2：将目标 Skill 目录放到 TRAE 的 Skill 加载路径
- 找到 TRAE 的 custom-skills 目录（通常在用户配置目录下）
- 将 skills/ 下对应 Skill 的整个文件夹复制过去
- 重启 TRAE 或刷新 Skill 列表

### Step 3：验证（同上）

## 各 Skill 触发示例

### trae-device-security
```
"我的 TRAE 被锁了，帮我检查一下"
"多设备登录风控怎么办"
"我想发一个产品建议帖"
```

### trae-forum-pro
```
"帮我在论坛搜一下 xxx"
"帮我格式化一篇帖子"
"最近论坛有什么热门话题"
```

### trae-workflow-automator
```
"我想创建一个新的 Skill"
"帮我写一个 SKILL.md"
"从零开始做一个 Skill 并发布到比赛"
```

## 常见问题

**Q: 导入后 Skill 不触发？**
A: 检查 description 中的触发关键词是否覆盖了你的表达方式。也可以直接说"使用 xxx Skill"来强制触发。

**Q: 可以同时安装多个 Skill 吗？**
A: 可以！三个 Skill 互补不冲突。推荐全部安装以获得最佳体验。

**Q: .skill 文件是什么格式？**
A: tar.gz 压缩包，内含 SKILL.md + references/ + scripts/ + evals/。TRAE IDE 可直接识别。

**Q: 安装后可以修改吗？**
A: 可以！所有源码都在 skills/ 目录下，你可以根据自己的需求定制。

## 需要帮助？

- 在本仓库提 Issue
- 到 [TRAE 论坛](https://forum.trae.cn) 发帖求助
- 查看 [AGENTS.md](./AGENTS.md) 了解项目详情
