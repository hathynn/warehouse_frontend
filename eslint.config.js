import js from '@eslint/js'                           // Core ESLint recommended
import globals from 'globals'                        // Danh sách global vars (browser, node…)
import react from 'eslint-plugin-react'               // React-specific rules
import reactHooks from 'eslint-plugin-react-hooks'    // React Hooks rules
import reactRefresh from 'eslint-plugin-react-refresh'// React Refresh lint rules
import tsParser from '@typescript-eslint/parser'      // Parser cho TypeScript
import tsPlugin from '@typescript-eslint/eslint-plugin'// TS-specific lint rules

export default [
  { ignores: ['node_modules','dist','build'] },      // Không lint trong các folder này
  
  // Configuration for Node.js config files
  {
    files: ['*.config.js', 'vite.config.js', 'tailwind.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,                             // Node.js globals (module, __dirname, etc.)
        ...globals.es2021                           // Modern JS globals
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      ...js.configs.recommended.rules
    }
  },
  
  // Configuration for React/browser files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],                 // Áp dụng cho JS/JSX/TS/TSX
    ignores: ['*.config.js', 'vite.config.js', 'tailwind.config.js'], // Exclude config files
    languageOptions: {
      parser: tsParser,                              // Dùng TS parser
      parserOptions: {
        ecmaVersion: 'latest',                       // Hỗ trợ syntax ES mới nhất
        sourceType: 'module',                        // Cho phép import/export
        ecmaFeatures: { jsx: true }                  // Bật JSX
      },
      globals: globals.browser                       // Biến global trình duyệt
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // 1) Base JS rules
      ...js.configs.recommended.rules,               
      // 2) React rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      // 3) Hooks rules
      ...reactHooks.configs.recommended.rules,

      // ← Tắt rule JS trùng với TS
      'no-unused-vars': 'off',                       

      // ← Dùng TS-plugin quản lý unused vars
      '@typescript-eslint/no-unused-vars': ['error',{ args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'warn',   // Warn nếu dùng any

      // Style & best practices
      'prefer-const': 'error',                        // Ưu tiên const
      'no-console': 'warn',                           // Warn khi console.log
      'no-debugger': 'error',                         // Error khi debugger

      // React-specific
      'react/jsx-key': 'error',                       // Yêu cầu key trong danh sách
      'react/jsx-no-target-blank': 'error',           // Nguy cơ bảo mật với target="_blank"
      'react-refresh/only-export-components': ['warn',{ allowConstantExport:true }]
    }
  }
]