import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: [
      'src/**/*.{js,ts,jsx,tsx}',
      'tests/**/*.{js,ts,jsx,tsx}',
      'eslint.config.js'
    ],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/arrow-spacing': ['error', {
        after: true,
        before: true
      }],
      '@stylistic/block-spacing': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', {
        allowSingleLine: true
      }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/comma-spacing': ['error', {
        after: true,
        before: false
      }],
      '@stylistic/indent': ['error', 2, {
        MemberExpression: 1,
        SwitchCase: 1
      }],
      '@stylistic/padding-line-between-statements': ['error', {
        blankLine: 'always',
        next: '*',
        prev: ['block', 'block-like', 'class', 'directive']
      }, {
        blankLine: 'always',
        next: ['block', 'block-like', 'class', 'return', 'break'],
        prev: '*'
      }, {
        blankLine: 'never',
        next: ['case', 'default'],
        prev: 'case'
      }],
      'key-spacing': ['error', { afterColon: true }],
      'keyword-spacing': ['error', { after: true }],
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'prefer-arrow-callback': ['error'],
      'prefer-const': ['error'],
      'prefer-template': 'error',
      'semi': ['error', 'always'],

      'space-before-blocks': ['error', 'always'],

      'spaced-comment': ['error', 'always', {
        exceptions: ['-', '+']
      }],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true
      }]
    }
  }
]);
