const { networkId } = require('../../config');
const contracts = require('../../build/contracts');

Object.entries(contracts).forEach(([contractName, contractData]) => {
  if (!Object.keys(contractData.addresses).length) return;

  console.log(`${contractName}:`, contractData.addresses[networkId] || '');
});
