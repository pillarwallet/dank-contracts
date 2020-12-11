const chaiModule = require('chai');
const { waffleChai } = require('@ethereum-waffle/chai');

chaiModule.use(waffleChai);

module.exports = chaiModule;
