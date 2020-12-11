module.exports = {
  arrowParens: 'always',
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  bracketSpacing: true,
  overrides: [
    {
      files: '*.sol',
      options: {
        printWidth: 120,
        tabWidth: 4,
        singleQuote: false,
        explicitTypes: 'always',
      },
    },
  ],
};
