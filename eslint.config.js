import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        NodeJS: 'readonly',
        ScrollBehavior: 'readonly',
        NotificationPermission: 'readonly',
        BufferSource: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'scripts/**',
      '*.config.js',
      '*.config.ts',
      'src/worker.ts',
    ],
  },
];
