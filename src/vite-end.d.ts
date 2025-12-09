/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Compile-time constant for GitHub Spark conditional loading
// Set by vite.config.ts define option
declare const __SPARK_ENABLED__: boolean