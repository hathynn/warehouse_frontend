import { defineConfig } from 'vite'                  // Hàm tạo config
import react from '@vitejs/plugin-react'             // Plugin React (JSX, Fast Refresh)
import tailwindcss from '@tailwindcss/vite'          // Plugin TailwindCSS
import checker from 'vite-plugin-checker'            // Plugin TS+ESLint real-time
import path from 'path'                              // Để tạo alias

export default defineConfig({
  plugins: [
    react(),                                        // Kích hoạt React
    tailwindcss(),                                  // Kích hoạt Tailwind
    // checker({                                       // Kích hoạt checker
    //   typescript: true,                             // TypeScript checking
    //   eslint: {                                     // ESLint checking
    //     lintCommand: 'eslint "src/**/*.{js,jsx,ts,tsx}"',
    //     useFlatConfig: true,                        // Use ESLint flat config to avoid invalid options error
    //     dev: { logLevel: ['error','warning'] }      // Hiển thị cả errors & warnings
    //   },
    //   overlay: { position: 'tl' },                  // Overlay ở top-left
    //   terminal: true,                               // In errors lên terminal
    //   enableBuild: false                            // Không check lúc build
    // })
  ],
  resolve: {
    alias: {                                        // Thiết lập import alias
      '@': path.resolve(__dirname,'./src')
    }
  },
  server: {
    hmr: { overlay: true },                          // Overlay khi HMR lỗi
    sourcemapIgnoreList: false,  // Không ignore source maps
  },
  build: {
    sourcemap: true,  // Enable source maps cho production
    rollupOptions: {
      onwarn(warning, warn) {
        warn(warning)  // Chỉ hiển thị warning
      }
    }
  },
  // Quan trọng: Enable source maps cho development
  css: {
    devSourcemap: true
  }
})