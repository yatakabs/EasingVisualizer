import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

// Conditional Spark runtime import - excluded from production bundle
// __SPARK_ENABLED__ is a compile-time constant defined in vite.config.ts
if (typeof __SPARK_ENABLED__ !== 'undefined' && __SPARK_ENABLED__) {
  import('@github/spark/spark').catch((e) => {
    console.warn('[spark] Spark runtime not available:', e)
  })
}

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
