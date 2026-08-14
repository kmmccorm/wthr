import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// The plugin's documented flat-config entry point. Its top-level
// `configs.recommended` is the legacy .eslintrc shape and won't load here.
// Swap for flat['recommended-latest'] to add the experimental void-use-memo rule.
const reactHooksFlat = reactHooks.configs.flat.recommended

export default [
  { ignores: ['dist/**', 'node_modules/**'] },

  // Browser code: the React app.
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      ...reactHooksFlat.plugins,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooksFlat.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Server-side code: the two signing proxies and the Vite config.
  {
    files: [
      'server/**/*.js',
      'netlify/functions/**/*.mjs',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: js.configs.recommended.rules,
  },
]
