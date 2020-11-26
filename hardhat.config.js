require('hardhat-deploy');
require('hardhat-deploy-ethers');

const mnemonic = process.env.MNEMONIC || 'test test test test test test test test test test test junk';
const accounts = mnemonic ? { mnemonic } : undefined;

const setupInfura = (networkName, chainId, accounts) => ({
  url: `https://${networkName}.infura.io/v3/${process.env.INFURA_TOKEN}`,
  chainId,
  accounts,
})

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      accounts,
      chainId: 9999,
    },
    localhost: {
      url: 'http://localhost:8545',
      accounts,
    },
    mainnet: setupInfura('mainnet', 1),
    ropsten: setupInfura('ropsten', 3),
    rinkeby: setupInfura('rinkeby', 4),
    kovan: setupInfura('kovan', 42),
    goerli: setupInfura('goerli', 5),
  },
  solidity: {
    version: '0.6.12',
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  paths: {
    sources: 'src',
    cache: '.hardhat/cache',
    artifacts: '.hardhat/artifacts',
    deploy: 'deploy',
    deployments: 'deployments',
  },
};

module.exports = config;
