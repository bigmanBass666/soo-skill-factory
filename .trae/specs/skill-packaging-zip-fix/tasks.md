# Tasks

- [ ] Task 1: 修复 skill-scaffold.sh cmd_pack() 核心打包命令
  - [ ] 修改 `skills/trae-workflow-automator/scripts/skill-scaffold.sh` 第 230 行
  - [ ] 将 `tar czf "$output_file" -C "$parent_dir" "$skill_name/"` 改为 zip 格式打包
  - [ ] 新增 `zip` 命令可用性前置检查（不可用时 fallback + 警告）
  - [ ] 确保解压后 SKILL.md 在根目录，无多余目录层嵌套

- [ ] Task 2: 同步更新所有引用 tar.gz 的文档（6 个文件）
  - [ ] 更新 `skills/trae-workflow-automator/SKILL.md` D.5 打包示例（约 L325-331）
  - [ ] 更新 `skills/trae-workflow-automator/references/contest-rules.md` 两处 tar.gz 引用（L54, L136）
  - [ ] 更新 `skills/trae-workflow-automator/references/skill-creation-guide.md` 打包格式说明（L292）
  - [ ] 更新 `INSTALL.md` FAQ 中格式描述（L69）
  - [ ] 更新 `AGENTS.md` Verification Loop 条目（L113）

- [ ] Task 3: 重打 releases/ 下 3 个 .skill 文件为 zip 格式
  - [ ] 用修复后的 pack 命令重打 `releases/trae-device-security.skill`
  - [ ] 用修复后的 pack 命令重打 `releases/trae-forum-pro.skill`
  - [ ] 用修复后的 pack 命令重打 `releases/trae-workflow-automator.skill`

- [ ] Task 4: 全量验证 — 确保所有产出物正确
  - [ ] 验证 skill-scaffold.sh 的 pack 命令输出正确的 zip 结构
  - [ ] 验证 3 个新 .skill 文件的内部结构（SKILL.md 在根目录、无嵌套层）
  - [ ] 验证 unzip / python zipfile / file 三种方式均可读取
  - [ ] 验证所有文档中无残留的 tar.gz 引用（全局 grep 确认）
  - [ ] 对比新旧 .skill 文件大小差异在合理范围内

- [ ] Task 5: 回复用户反馈帖 #17234/2
  - [ ] 在 #17234 帖子下回复，告知问题已修复
  - [ ] 说明修复内容（tar.gz → zip）和原因
  - [ ] 提供更新后的下载链接

# Task Dependencies
- [Task 1] 必须最先完成（Task 2/3 都依赖它）
- [Task 2] 和 [Task 3] 可并行执行（都依赖 Task 1 完成后）
- [Task 4] 依赖 [Task 1, 2, 3] 全部完成
- [Task 5] 依赖 [Task 4] 验证通过
