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
    // The waiting screen arrived as a kit. Its rules about refs and effects
    // are load-bearing — the reveal is timed on them — so it is not reshaped
    // to suit our linter; the wiring around it (Preparing.tsx, prepare.ts) is
    // ours and is linted. One deliberate change is marked in the file, at the
    // elapsed clock.
    'src/progress/ProgressScreen.tsx',
    'src/progress/progressBus.ts',
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
