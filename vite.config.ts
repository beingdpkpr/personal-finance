import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 8081 },
  // On GitHub Actions the workflow sets DEPLOY=gh-pages; locally stays at '/'
  base: mode === 'gh-pages' ? '/personal-finance/' : '/',
}))
