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
