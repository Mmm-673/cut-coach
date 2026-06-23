# AI Coding Center Base - 中央规范仓库

> **本仓库作为 `ai-coding-team-base` 中的普通文件夹存在，随 team-base 一起分发和更新，不能单独使用。**

## 定位

```
ai-coding-team-base/           # 小组规范仓库（主仓库）
├── ai-coding-center-base/     # ← 本仓库（普通文件夹 - 中央规范）
│   ├── .claude/
│   │   ├── commands/jt/     # jt:* 工作流命令（步骤内联，主 agent 直接执行）
│   │   ├── agents/           # trellis pipeline agent（dispatch, plan）
│   │   └── skills/           # Skills（如 repo-init）
│   └── openspec/
│       └── specs/            # 中央级通用规范
│           ├── backend/       # 后端规范
│           └── frontend/      # 前端规范
└── openspec/
    ├── specs/
    │   ├── common/          # 小组公共规范
    │   └── {project}/       # 项目特定规范（可覆盖中央）
    └── changes/             # 需求变更目录
```

## 规范层级

| 层级 | 位置 | 说明 |
|-----|------|------|
| **中央规范** | `ai-coding-center-base/openspec/` | 各小组共享，不可覆盖 |
| **小组规范** | `ai-coding-team-base/openspec/specs/common/` | 小组公共规范 |
| **项目规范** | `ai-coding-team-base/openspec/specs/{project}/` | 可覆盖上层规范 |

**覆盖优先级**：项目 > 小组 > 中央

## 工具命令

### jt:* 工作流命令

| 命令 | 说明 |
|------|------|
| `/jt:explore <需求>` | 探索需求，澄清问题（不写代码） |
| `/jt:propose <name>` | 创建变更提案（proposal + design + tasks） |
| `/jt:apply <name>` | 按 tasks 实施代码 |
| `/jt:check <name>` | 质量检查 |
| `/jt:debug <name>` | 修复问题 |
| `/jt:archive <name>` | 归档完成变更 |
| `/jt:cr [参数]` | 代码审查 |
| `/jt:ut [参数]` | 单元测试生成 |
| `/jt:ut-branch <branch>` | 分支单元测试生成 |

### repo-init Skill

初始化小组项目仓库：
```
/repo-init
```

执行后会自动：
1. 合并小组配置与中央规范
2. 为项目创建 `.claude` 软链接
3. 初始化 OpenSpec 目录结构

## 中央规范内容

```
openspec/
├── backend/               # 后端开发规范
│   ├── database-guidelines.md
│   ├── directory-structure.md
│   ├── error-handling.md
│   ├── logging-guidelines.md
│   └── quality-guidelines.md
└── frontend/              # 前端开发规范
    ├── component-guidelines.md
    ├── directory-structure.md
    ├── hook-guidelines.md
    ├── quality-guidelines.md
    ├── state-management.md
    └── type-safety.md
```

## 注意事项

- **不要直接克隆本仓库**：本仓库随 `ai-coding-team-base` 一起分发
- **不要单独修改本仓库**：中央规范的修改需要通过 team-base 仓库的 PR 流程
- **jt:* 命令在本仓库定义**：实际执行时会定位到 `ai-coding-team-base/openspec/changes/`

## 联系方式

如有问题，请联系团队 AI 负责人。
