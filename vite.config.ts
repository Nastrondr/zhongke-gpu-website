import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 使用相对路径
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'products.html'),
        solutions: resolve(__dirname, 'solutions.html'),
        resources: resolve(__dirname, 'resources.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        'gpu-time': resolve(__dirname, 'gpu-time.html'),
        'bare-metal': resolve(__dirname, 'bare-metal.html'),
        'computing-center': resolve(__dirname, 'computing-center.html'),
        ai: resolve(__dirname, 'ai.html'),
        robot: resolve(__dirname, 'robot.html')
      }
    }
  }
})