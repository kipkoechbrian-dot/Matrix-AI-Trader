import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The market engine is an external store: hooks subscribe and
      // setState from tick callbacks (plus once to sync on mount/symbol
      // change). The strict v7 rule forbids that pattern, but here it is
      // the intended integration point — disabled project-wide.
      'react-hooks/set-state-in-effect': 'off',
      // Context modules export both the context object and its provider
      // component by design (React's canonical context pattern).
      'react-refresh/only-export-components': 'off',
    },
  },
])
