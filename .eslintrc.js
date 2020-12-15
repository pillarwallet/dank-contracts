module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  globals: {},
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    quotes: [2, 'single'],
    'no-shadow': 0,
    'dot-notation': 0,
    'import/prefer-default-export': 0,
    'no-native-reassign': 1,
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info'],
      },
    ],
    'no-underscore-dangle': [
      2,
      {
        allow: ['_id'],
      },
    ],
    'linebreak-style': ['error', 'unix'],
    'require-atomic-updates': 'off',
    'no-extra-semi': 'error',
    semi: ['error', 'always'],
    'semi-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    'semi-style': ['error', 'last'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': [2, 'always'],
  },
};
