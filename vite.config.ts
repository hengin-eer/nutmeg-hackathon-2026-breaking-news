import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages（https://<user>.github.io/nutmeg-hackathon-2026-breaking-news/）に置くので base をリポジトリ名にする
export default defineConfig({
  base: '/nutmeg-hackathon-2026-breaking-news/',
  plugins: [react(), tailwindcss()],
})
