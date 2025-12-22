/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Compile-time constant for GitHub Spark conditional loading
// Set by vite.config.ts define option
declare const __SPARK_ENABLED__: boolean

// Build metadata constants injected at build time
declare const __APP_VERSION__: string
declare const __BUILD_COMMIT__: string
declare const __BUILD_TIMESTAMP__: string
declare const __BUILD_ENV__: string