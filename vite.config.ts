import { rmdirSync, rmSync } from "fs"
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // '/' for Cloudflare Pages / a custom domain. The GitHub Pages workflow sets
  // BASE_PATH=/my-360-animation/ for the project-page URL.
  base: process.env.BASE_PATH ?? '/',
  assetsInclude: ['**/*.pdf'],
  plugins: [
    inspectAttr(),
    react(),
    {
      // public/video/crop.mp4 is a 10 MB selfie master (the retired video hero,
      // see animation/video-archive/). Keep it in the repo, but don't ship it.
      name: 'drop-video-master',
      apply: 'build',
      closeBundle() {
        rmSync(path.resolve(__dirname, 'dist/video/crop.mp4'), { force: true })
        try {
          rmdirSync(path.resolve(__dirname, 'dist/video')) // only succeeds if now empty
        } catch {
          /* other files still there, or no folder */
        }
      },
    },
  ],
  server: {
    port: 3000,
    // `npm run worker:dev` serves the API on :8787; proxy it so the browser
    // calls /api/* same-origin, exactly like production.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
