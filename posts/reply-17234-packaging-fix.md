感谢反馈！你发现的问题非常精准 👏

## 问题确认

你说得完全正确——之前 `skill-scaffold.sh` 的 `pack` 命令使用 `tar czf`（tar.gz 格式）打包，配合 `-C parent` + `$(basename $dir)` 的工作方式，会导致解压时产生一层嵌套目录：

```
xxx.skill → 解压 → xxx.skill/xxx.skill/SKILL.md  ❌
```

而 `.skill` 文件本质上需要 **双击/直接解压后 SKILL.md 就在根目录**，7z 等工具对 tar.gz 的处理恰好会多套一层。

## 已完成的修复

| 修复项 | 状态 |
|--------|------|
| `skill-scaffold.sh` pack 命令 | `tar czf` → `zip -r` ✅ |
| 全部 6 个文档同步更新 | ✅ |
| 3 个 .skill 文件重新打包 | 全部改为 zip 格式 ✅ |
| 验证：unzip / zipfile / file / 结构对比 / grep | **14/14 全通过** ✅ |

**关键验证结果：**
- `unzip -t` : No errors detected
- `python zipfile` 模块: 结构合法
- `file` 命令: 正确识别为 Zip
- **SKILL.md 在根目录下** ✅ ← 这就是你说的核心修复点

## 更新后的下载

GitHub Releases 已全部替换为 zip 格式的 .skill 文件，可以直接下载使用：

🔗 [Releases 下载页面](https://github.com/solo-skills/community-skills/releases)

再次感谢细致的测试反馈！这种打包格式兼容性问题确实容易在跨平台工具链中遗漏，你的排查过程非常清晰。
