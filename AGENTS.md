# AGENTS.md - Command 与 Agent 架构说明

> 定义 jt:* 工作流的执行架构、命令职责和调用关系。

---

## 架构说明

jt:* 工作流命令由**主 agent 直接执行**，步骤内联在各 command 文件中。

唯一例外：`/jt:explore` 的代码调研阶段使用 `Explore` subagent 隔离上下文膨胀。

### 为什么不全部使用 subagent

1. Claude Code 仅支持预定义的 subagent_type（`general-purpose`、`Explore`、`Plan` 等），不支持自定义类型
2. subagent 无法与用户交互（如澄清问题、确认操作）
3. subagent 拿不到主会话上下文，信息传递需要额外机制
4. 对于线性流程（propose → apply → check → archive），主 agent 直接执行更可靠

---

## 命令索引

| 命令 | 执行方式 | 说明 |
|------|---------|------|
| `/jt:explore <需求>` | Explore subagent + 主 agent | 需求澄清，代码调研（不写代码） |
| `/jt:propose <name>` | 主 agent 直接执行 | 创建 proposal + design + tasks |
| `/jt:apply <name>` | 主 agent 直接执行 | 按 tasks 实施代码 |
| `/jt:check <name>` | 主 agent 直接执行 | 代码质量检查 |
| `/jt:debug <name>` | 主 agent 直接执行 | 修复检查出的问题 |
| `/jt:archive <name>` | 主 agent 直接执行 | 归档完成变更 |
| `/jt:cr [参数]` | 主 agent 直接执行 | 代码审查 |
| `/jt:ut [参数]` | 主 agent 直接执行 | 单元测试生成 |
| `/jt:ut-branch <branch>` | 主 agent 直接执行 | 分支单元测试生成 |

---

## 命令间数据传递

不同命令是独立调用，**不共享上下文**，通过文件桥接：

```
/jt:explore add-user-auth
  → 写入 openspec/explorations/add-user-auth.md

/jt:propose add-user-auth
  → 读取 openspec/explorations/add-user-auth.md（如果存在）
  → 写入 openspec/changes/add-user-auth/proposal.md, design.md, tasks.md

/jt:apply add-user-auth
  → 读取 openspec/changes/add-user-auth/tasks.md, design.md
  → 实施代码
```

---

## 工作流调用链

```
需求输入
    ↓
/jt:explore  ← 探索需求（可选，用 Explore subagent 调研代码）
    ↓ 写入 explorations/<change>.md
/jt:propose  ← 读取探索结论，创建提案 + tasks
    ↓ 写入 changes/<change>/proposal.md, design.md, tasks.md
/jt:apply    ← 按 tasks 实施
    ↓
/jt:check    ← 质量检查
    ↓
    ├── 通过 → /jt:archive
    └── 失败 → /jt:debug → /jt:check（重检）
```

---

## 保留的 Agent 文件

以下 agent 文件属于 **trellis Multi-Agent Pipeline**，与 jt:* 工作流无关：

| 文件 | 用途 |
|------|------|
| `agents/dispatch.md` | trellis pipeline 调度器 |
| `agents/plan.md` | trellis pipeline 规划器 |

这两个文件有正确的 frontmatter（tools/model 定义），通过 trellis:parallel skill 调用。
