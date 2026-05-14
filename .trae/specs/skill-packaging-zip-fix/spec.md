# Skill 打包格式修复：tar.gz → zip Spec

## Why

用户反馈（#17234/2）：`skill-scaffold.sh pack` 使用 `tar czf` 打包 `.skill` 文件时，`-C parent_dir + skill_name/` 会将目录名作为顶层路径打入包。用户用 7z 解压时出现双层嵌套：`xxx.skill → solo-skill-scout/ → SKILL.md`，导致 TRAE IDE 导入时报错 **"SKILL.md 不在根目录下"**。

**根因**：`tar czf output -C parent skill_name/` 的 `-C` 切换目录 + 目录名参数，使 `skill_name/` 成为归档内的顶层路径。zip 格式天然不存在此问题（直接打包目录内容），且跨平台兼容性更佳。

## What Changes

- **修改 `skills/trae-workflow-automator/scripts/skill-scaffold.sh`** — `cmd_pack()` 函数从 `tar czf` 改为 `zip -r`
- **重打 `releases/` 下 3 个 .skill 文件** — 从 tar.gz 格式改为 zip 格式
- **同步更新所有引用 tar.gz 的文档** — 确保一致性

### 涉及文件清单（按优先级）

| # | 文件 | 改动类型 | 说明 |
|---|------|---------|------|
| 1 | `skills/trae-workflow-automator/scripts/skill-scaffold.sh:230` | **核心修复** | `tar czf` → `zip -r` |
| 2 | `skills/trae-workflow-automator/SKILL.md:325-331` | 文档更新 | D.5 打包命令示例 |
| 3 | `skills/trae-workflow-automator/references/contest-rules.md:54,136` | 文档更新 | 规则描述 + checklist |
| 4 | `skills/trae-workflow-automator/references/skill-creation-guide.md:292` | 文档更新 | 打包格式说明 |
| 5 | `INSTALL.md:69` | 文档更新 | FAQ 格式说明 |
| 6 | `AGENTS.md:113` | 文档更新 | Verification Loop 条目 |
| 7 | `releases/trae-device-security.skill` | **重打包** | tar.gz → zip |
| 8 | `releases/trae-forum-pro.skill` | **重打包** | tar.gz → zip |
| 9 | `releases/trae-workflow-automator.skill` | **重打包** | tar.gz → zip |

## Impact

- Affected specs: 无已有 spec 受影响（纯修复任务）
- Affected code: `scripts/skill-scaffold.sh`、3 个 `.skill` 二进制文件、6 个文档文件
- **BREAKING**: 已下载旧版 tar.gz 格式 .skill 文件的用户需重新下载 zip 版本（但旧格式本身就有 bug，所以这是修复而非破坏）

## ADDED Requirements

### Requirement: zip 格式打包命令

系统 SHALL 使用 `zip -r` 替代 `tar czf` 作为 .skill 文件的打包格式。

#### 核心改动：cmd_pack()

```bash
# 旧代码（有 bug）
tar czf "$output_file" -C "$parent_dir" "$skill_name/"

# 新代码（修复后）
(cd "$parent_dir/$skill_name" && zip -rq "$output_file" .) || \
  zip -rq "$output_file" -j "$parent_dir/$skill_name"/*
```

#### 场景: 正确的内部结构

- **WHEN** 用户在 Skill 目录内执行 `./skill-scaffold.sh pack`
- **THEN** 生成的 `{name}.skill` 文件解压后根目录直接包含：
  ```
  SKILL.md          ← 必须在根级别
  references/
    ├── file1.md
    └── file2.md
  scripts/
    └── xxx.sh
  evals/
    └── evals.json
  ```

#### 验证标准

1. `unzip -l {name}.skill` 输出的路径列表中，所有文件路径**不应包含前缀目录名**
2. `unzip -p {name}.skill SKILL.md` 能直接提取到 SKILL.md 内容（证明在根级别）
3. 用 `python3 zipfile` 模块能读取且 `namelist()` 中无嵌套目录层
4. 在 macOS Finder 双击 .skill 文件可直接预览内容
5. 在 Windows 资源管理器中打开 .skill 文件可直接看到内部文件

### Requirement: 全量文档同步

所有提及 `tar.gz` 或 `tar czf` 作为 .skill 打包格式的文档 SHALL 更新为 `zip` 格式：

| 文件 | 原文 | 改为 |
|------|------|------|
| SKILL.md D.5 | `tar czf {skill-name}.skill -C /path/to/parent {skill-name}/` | `cd {skill-dir} && zip -r {name}.skill .` |
| contest-rules.md | `.skill 文件采用 tar.gz 格式打包` | `.skill 文件采用 zip 格式打包` |
| contest-rules.md checklist | `.skill 文件已打包为 tar.gz 格式` | `.skill 文件已打包为 zip 格式` |
| skill-creation-guide.md | `tar.gz 格式，解压后文件完整` | `zip 格式，解压后 SKILL.md 在根目录` |
| INSTALL.md FAQ | `tar.gz 压缩包，内含 SKILL.md + ...` | `zip 压缩包，内含 SKILL.md + ...` |
| AGENTS.md Verification | `.skill 文件 tar.gz 格式` | `.skill 文件 zip 格式` |

### Requirement: 已有 .skill 文件重打包

系统 SHALL 将 `releases/` 下 3 个已有的 .skill 文件从 tar.gz 重打包为 zip 格式：

| 文件 | 当前格式 | 目标格式 |
|------|---------|---------|
| `releases/trae-device-security.skill` | tar.gz (24KB) | zip |
| `releases/trae-forum-pro.skill` | tar.gz (31KB) | zip |
| `releases/trae-workflow-automator.skill` | tar.gz (17KB) | zip |

每个重打包后的文件必须通过上述"验证标准"的全部 5 项检查。

## MODIFIED Requirements

### Requirement: skill-scaffold.sh 兼容性

现有 `cmd_pack()` 函数保持接口不变（仍在 Skill 内执行 `pack` 子命令），仅改变内部实现：

- **输入不变**：从当前目录名推断 skill 名，输出到父目录
- **输出格式变更**：从 `.tar.gz` 变为 `.zip`
- **依赖变化**：需要系统安装 `zip` 命令（Linux/macOS/Windows 均默认可用）

新增前置检查：如果 `zip` 命令不可用，提示用户安装并 fallback 到 `tar czf`（带警告）。

## REMOVED Requirements

无。
