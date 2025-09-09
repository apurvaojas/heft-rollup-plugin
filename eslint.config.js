// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/heft/includes/eslint-config-heft.js');

module.exports = {
  extends: ['@rushstack/eslint-config/profile/node'],
  parserOptions: { tsconfigRootDir: __dirname },

  rules: {
    // This rule doesn't work correctly with TypeScript overloads
    '@typescript-eslint/unified-signatures': 'off'
  }
};