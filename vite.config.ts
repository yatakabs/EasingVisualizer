import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const isGitHubActions = !!process.env.GITHUB_ACTIONS
const isSparkDisabled = !!process.env.VITE_SPARK_DISABLED

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
    },
  }
})
