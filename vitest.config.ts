import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Strict timeouts for fast feedback
    testTimeout: 2000,      // 2 seconds max per test
    hookTimeout: 3000,      // 3 seconds for setup/teardown
    
    // Performance: Use threads pool for better parallelization
    pool: 'threads',
    fileParallelism: true,   // Run files in parallel
    
    // VS Code Test Explorer compatible reporters
    reporters: ['default'],
    
    // No retries for fast local dev (CI can override)
    retry: 0,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Mock compile-time constants for test environment
    '__SPARK_ENABLED__': JSON.stringify(false),
    '__APP_VERSION__': JSON.stringify('1.0.0-test'),
    '__BUILD_COMMIT__': JSON.stringify('test123'),
    '__BUILD_TIMESTAMP__': JSON.stringify('2025-01-01T00:00:00.000Z'),
    '__BUILD_ENV__': JSON.stringify('test'),
  },
})
