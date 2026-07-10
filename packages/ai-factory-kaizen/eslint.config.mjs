import baseConfig from '../../eslint.config.mjs';
import pluginSecurity from 'eslint-plugin-security';
import pluginNoSecrets from 'eslint-plugin-no-secrets';
import pluginJest from 'eslint-plugin-jest';

export default [
  ...baseConfig,
  pluginSecurity.configs.recommended,
  {
    plugins: { 'no-secrets': pluginNoSecrets },
    rules: {
      'no-secrets/no-secrets': ['error', { tolerance: 4.2 }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    ...pluginJest.configs['flat/recommended'],
    rules: {
      ...pluginJest.configs['flat/recommended'].rules,
      'jest/no-disabled-tests': 'error',
    },
  },
];
