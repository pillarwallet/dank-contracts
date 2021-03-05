const { task } = require('hardhat/config');

const TASK_LIST_DEPLOYMENTS = 'list-deployments';

task(TASK_LIST_DEPLOYMENTS, 'List deployed contracts contracts').setAction(async (args, hre) => {
  const {
    network: { name: networkName },
    deployments,
  } = hre;

  const contracts = await deployments.all();
  const entries = Object.entries(contracts);

  console.log(networkName);
  for (const [name, { address, args }] of entries) {
    console.log(name, address, args);
  }
});
