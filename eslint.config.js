import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

/** @see https://eslint.style/rules — shared preset via {@link stylistic.configs.customize} */
const stylisticTsAndVue = stylistic.configs.customize({
  jsx: false,
  semi: false,
  quotes: 'single',
  commaDangle: 'always-multiline',
  braceStyle: 'stroustrup',
})

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-client/**',
      '**/node_modules/**',
      '.moon/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'typescript/files',
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'stylistic/typescript',
    files: ['**/*.{ts,mts,cts}'],
    plugins: stylisticTsAndVue.plugins,
    rules: stylisticTsAndVue.rules,
  },
  ...pluginVue.configs['flat/recommended'],
  {
    name: 'vue/typescript',
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.browser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    name: 'stylistic/vue',
    files: ['**/*.vue'],
    plugins: stylisticTsAndVue.plugins,
    rules: stylisticTsAndVue.rules,
  },
)
