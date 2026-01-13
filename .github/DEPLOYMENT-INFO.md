# Agentic Ensemble Deployment

## Deployment Information

| Property | Value |
|----------|-------|
| **Project Name** | EasingVisualizer |
| **Project Type** | generic |
| **Deploy Date** | 2026-01-13 15:25:00 |
| **Source** | \\yataka-desk01\libs\agentic-ensemble |
| **Configuration** | Full |
| **E2E Tools** | Not included |

## Quick Start

### Start a Collaborative Session

In VS Code Copilot Chat:

```
#orchestrate-auto [あなたのタスクを記述]
```

### Available Prompts

| Prompt | Description |
|--------|-------------|
| #orchestrate-auto | 汎用の自動協調セッション |
| #execute-as-team | チーム指定で実行 |
| #auto-commit | 変更を自動コミット |
| #create-implementation-plan | 実装計画を作成 |

### Available Agents

| Agent | Description |
|-------|-------------|
| @collaborative-orchestrator | メインオーケストレーター |
| @core-architect | 設計・計画 |
| @core-implementer | 実装 |
| @core-auditor | レビュー・検証 |

## Customization

### Add Project-Specific Knowledge

1. .github/instructions/knowledge/ にマークダウンファイルを追加
2. ファイル先頭に以下のフロントマターを含める:

```yaml
---
applyTo: '**'
description: 'Your knowledge description'
---
```

### Modify Project Instructions

.github/instructions/project-integration.instructions.md を編集してください。

## Update Package

ネットワーク共有から最新版を取得:

```powershell
& "\\yataka-desk01\libs\agentic-ensemble\deploy\Deploy-AgenticEnsemble.ps1" -TargetPath "D:\Repos\BeatSaber\Utilities\EasingVisualizer" -ProjectName "EasingVisualizer" -ProjectType generic -Force
```

## Support

- Documentation: $(\\yataka-desk01\libs\agentic-ensemble)\docs\
- Issues: Check deployment log below

## Deployment Log

```
[2026-01-13 15:24:55] [HEADER] Checking prerequisites...
[2026-01-13 15:24:55] [SUCCESS] Source path: \\yataka-desk01\libs\agentic-ensemble
[2026-01-13 15:24:55] [SUCCESS] Source structure verified
[2026-01-13 15:24:55] [SUCCESS] Target path: D:\Repos\BeatSaber\Utilities\EasingVisualizer
[2026-01-13 15:24:55] [HEADER] Deploying Agentic Ensemble...
[2026-01-13 15:24:55] [INFO] Deploying full configuration...
[2026-01-13 15:24:56] [SUCCESS] Copied 149 files to agents/
[2026-01-13 15:24:58] [SUCCESS] Copied 154 files to prompts/
[2026-01-13 15:25:00] [SUCCESS] Copied 357 files to instructions/
[2026-01-13 15:25:00] [INFO] .gitignore already contains .github/agents/ae.*.agent.md
[2026-01-13 15:25:00] [INFO] .gitignore already contains .github/prompts/ae.*.prompt.md
[2026-01-13 15:25:00] [INFO] .gitignore already contains .github/instructions/ae.*.instructions.md
[2026-01-13 15:25:00] [INFO] .gitignore already contains .github/chatmodes/ae.*.chatmode.md
[2026-01-13 15:25:00] [INFO] .gitignore already contains .github/config/ae.*.json
[2026-01-13 15:25:00] [HEADER] Generating project-specific integration instructions...
[2026-01-13 15:25:00] [SUCCESS] Generated project-integration.instructions.md
[2026-01-13 15:25:00] [HEADER] Configuring VS Code settings...
[2026-01-13 15:25:00] [SUCCESS] Updated .vscode/settings.json
[2026-01-13 15:25:00] [HEADER] Updating .gitignore...
[2026-01-13 15:25:00] [INFO] .gitignore already configured
[2026-01-13 15:25:00] [HEADER] Generating deployment summary...
```
