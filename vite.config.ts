import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const isGitHubActions = !!process.env.GITHUB_ACTIONS
const isSparkDisabled = !!process.env.VITE_SPARK_DISABLED

// Extract git and build metadata
function getGitInfo() {
  try {
    // In GitHub Actions, use environment variables
    if (isGitHubActions) {
      return {
        commit: (process.env.GITHUB_SHA || 'unknown').substring(0, 7),
        branch: process.env.GITHUB_REF_NAME || 'unknown',
      }
    }
    
    // Local development: execute git commands
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    return { commit, branch }
  } catch (error) {
    // Fallback for non-git environments
    console.warn('[vite] Git info unavailable:', error)
    return { commit: 'dev', branch: 'local' }
  }
}

function getBuildTimestamp() {
  return new Date().toISOString()
}

function getPackageVersion() {
  try {
    const packageJsonPath = resolve(projectRoot, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    return packageJson.version || '0.0.0'
  } catch (error) {
    console.warn('[vite] Could not read package version:', error)
    return '0.0.0'
  }
}

// Determine if GitHub Spark should be enabled
// Disabled in: GitHub Actions builds, or when VITE_SPARK_DISABLED is set
function isSparkEnabled(): boolean {
  if (isGitHubActions) return false
  if (isSparkDisabled) return false
  return true
}

// Dynamically load Spark plugins only when enabled
async function getSparkPlugins(): Promise<PluginOption[]> {
  if (!isSparkEnabled()) {
    console.log('[vite] Spark plugins disabled (GitHub Actions or VITE_SPARK_DISABLED)')
    return []
  }
  
  try {
    const { default: sparkPlugin } = await import("@github/spark/spark-vite-plugin")
    const { default: createIconImportProxy } = await import("@github/spark/vitePhosphorIconProxyPlugin")
    console.log('[vite] Spark plugins loaded for development')
    return [
      createIconImportProxy() as PluginOption,
      sparkPlugin() as PluginOption,
    ]
  } catch (e) {
    console.warn('[vite] Spark plugins not available:', e)
    return []
  }
}

// https://vite.dev/config/
export default defineConfig(async () => {
  const sparkPlugins = await getSparkPlugins()
  const gitInfo = getGitInfo()
  const buildTimestamp = getBuildTimestamp()
  const packageVersion = getPackageVersion()
  const buildEnv = isGitHubActions ? 'production' : 'development'
  
  return {
    // Configure base path for GitHub Pages deployment
    base: isGitHubActions ? '/EasingVisualizer/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      ...sparkPlugins,
    ],
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src')
      }
    },
    define: {
      '__SPARK_ENABLED__': JSON.stringify(isSparkEnabled()),
      '__APP_VERSION__': JSON.stringify(packageVersion),
      '__BUILD_COMMIT__': JSON.stringify(gitInfo.commit),
      '__BUILD_TIMESTAMP__': JSON.stringify(buildTimestamp),
      '__BUILD_ENV__': JSON.stringify(buildEnv),
    },
  }
})
