const { task } = require('hardhat/config');

const TASK_VERIFY = 'verify';
const TASK_VERIFY_ALL = 'verify-all';

task(TASK_VERIFY_ALL, 'Verify all contracts').setAction(async (args, hre) => {
  const {
    run,
    network: { name: networkName },
    deployments,
  } = hre;

  const contracts = await deployments.all();
  const entries = Object.entries(contracts);

  switch (networkName) {
    case 'bsc':
    case 'mainnet':
    case 'ropsten':
    case 'rinkeby':
    case 'goerli':
    case 'kovan': {
      for (const [name, { address, args }] of entries) {
        const verifyArgs = {
          address,
          constructorArgsParams: args,
        };
        // console.log('contracts', name, address, args);
        try {
          await run(TASK_VERIFY, verifyArgs);
        } catch (err) {
          console.warn(err);
        }
      }
      break;
    }
  }
});
