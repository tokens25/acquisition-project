import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  // console/ holds the four pieces of one HTML page, not four modules — app.js
  // is the inside of an IIFE and ends mid-file. `npm run console` assembles and
  // syntax-checks them; parsing the fragments alone can only ever fail.
  globalIgnores([
    'dist',
    'storybook-static',
    'src/**/*.figma.ts',
    'console/**',
    // coach/ is a frozen snapshot of the hero project's Coach, not part of this app
    'coach/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
