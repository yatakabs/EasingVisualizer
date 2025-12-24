# GitHub Wiki Deployment Guide

This directory contains the source files for the [Easing Visualizer Wiki](https://github.com/yatakabs/EasingVisualizer/wiki).

## Understanding GitHub Wiki

GitHub Wiki is a **separate git repository** from the main project repository. This means:

- Wiki content lives in its own repository
- Changes to `docs/wiki/` in the main repo do NOT automatically update the wiki
- Wiki must be deployed manually or via automation

### Wiki URLs

| Purpose | URL |
|---------|-----|
| **Wiki (read)** | https://github.com/yatakabs/EasingVisualizer/wiki |
| **Wiki git clone** | https://github.com/yatakabs/EasingVisualizer.wiki.git |

## Manual Deployment Steps

### First-Time Setup

1. **Enable Wiki in Repository Settings**
   - Go to repository Settings → Features
   - Check "Wikis" to enable

2. **Initialize the Wiki Repository**
   - Go to the Wiki tab in the repository
   - Click "Create the first page"
   - Add any placeholder content and save
   - This creates the wiki git repository

3. **Clone the Wiki Repository**
   ```bash
   git clone https://github.com/yatakabs/EasingVisualizer.wiki.git
   cd EasingVisualizer.wiki
   ```

### Deploying Updates

4. **Copy Wiki Source Files**
   ```bash
   # From the main repository root
   cp docs/wiki/*.md ../EasingVisualizer.wiki/
   
   # Or use the deployment script
   ./scripts/deploy-wiki.ps1
   ```

5. **Commit and Push**
   ```bash
   cd ../EasingVisualizer.wiki
   git add .
   git commit -m "Update wiki content"
   git push origin master
   ```

## Automated Deployment

### Using the Deployment Script

A PowerShell script is provided for convenience:

```powershell
# Deploy with default settings
./scripts/deploy-wiki.ps1

# Deploy to a different wiki (fork)
./scripts/deploy-wiki.ps1 -WikiRepoUrl "https://github.com/youruser/EasingVisualizer.wiki.git"

# Specify a custom commit message
./scripts/deploy-wiki.ps1 -CommitMessage "docs: update FAQ section"
```

### GitHub Actions (Optional)

You can automate wiki deployment with GitHub Actions. Create `.github/workflows/wiki.yml`:

```yaml
name: Deploy Wiki

on:
  push:
    branches: [main]
    paths:
      - 'docs/wiki/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Wiki
        uses: Andrew-Chen-Wang/github-wiki-action@v4
        with:
          path: docs/wiki
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

> **Note:** The `GITHUB_TOKEN` needs write access to the wiki. For organization repos, you may need a PAT with `repo` scope.

## File Naming Conventions

| Wiki Page | Source File |
|-----------|-------------|
| Home | `Home.md` |
| Getting Started | `Getting-Started.md` |
| Sidebar | `_Sidebar.md` |
| Footer | `_Footer.md` |

- Use **kebab-case** for multi-word page names
- Prefix special pages with underscore (`_Sidebar.md`, `_Footer.md`)
- Japanese translations use `.ja.md` suffix (e.g., `Home.ja.md`)

## Wiki Links

Use double-bracket syntax for wiki links:

```markdown
[[Page-Name]]                    # Link with page name as text
[[Page-Name|Display Text]]       # Link with custom display text
[[Home.ja|日本語]]               # Link to Japanese version
```

## Excluded Files

The following files are NOT deployed to the wiki:

- `README.md` - This deployment guide (wiki-specific)
- Any files in subdirectories (wiki is flat)

## Troubleshooting

### "Wiki not found" error
- Ensure Wiki is enabled in repository settings
- Create at least one page via the GitHub web UI first

### Push permission denied
- Check you have write access to the repository
- For GitHub Actions, verify `GITHUB_TOKEN` permissions

### Changes not appearing
- Wiki may cache pages briefly; refresh with Ctrl+Shift+R
- Verify files were committed to the wiki repo (not main repo)
