'use strict';

module.exports = {
  'allow-uncaught': true,
  diff: true,
  recursive: true,
  reporter: 'spec',
  require: ['hardhat/register'], // ['ts-node/register/transpile-only'], (for yarn link <plugin>)
  slow: 300,
  spec: 'test/**/*.spec.js',
  timeout: 20000,
  ui: 'bdd',
  watch: false,
  'watch-files': ['src/**/*.sol', 'test/**/*.js'],
};
