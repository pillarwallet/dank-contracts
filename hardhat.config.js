require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('@nomiclabs/hardhat-etherscan');
require('./extensions');

const defaultMnemonic = 'test test test test test test test test test test test junk';
const getNetworkEnvName = (networkName) => networkName.replace(/([A-Z])+/, '_$1').toUpperCase();

const getAccounts = (networkName) => {
  const networkEnvName = getNetworkEnvName(networkName);
  const mnemonic = process.env[`MNEMONIC_${networkEnvName}`];
  const privateKey = process.env[`PK_${networkEnvName}`];

  if (privateKey) {
    return [privateKey];
  }

  return mnemonic ? { mnemonic } : undefined;
};

const infuraProvider = (networkName) => `https://${networkName}.infura.io/v3/${process.env.INFURA_TOKEN}`;

const setupNetwork = (networkName, chainId, defaultProvider = '') => ({
  [networkName]: {
    url: process.env[`PROVIDER_ENDPOINT_${getNetworkEnvName(networkName)}`] || defaultProvider,
    chainId,
    accounts: getAccounts(networkName),
  },
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  namedAccounts: {
    deployer: 0,
    account: 0,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.HARDHAT_MNEMONIC || defaultMnemonic,
        count: 256,
      },
      chainId: 9999,
      gasPrice: 20000000000,
    },
    ...setupNetwork('localhost', 9999, 'http://localhost:8545'),
    ...setupNetwork('localB', 6666, 'http://localhost:9545'),
    ...setupNetwork('mainnet', 1, infuraProvider('mainnet')),
    ...setupNetwork('ropsten', 3, infuraProvider('ropsten')),
    ...setupNetwork('rinkeby', 4, infuraProvider('rinkeby')),
    ...setupNetwork('goerli', 5, infuraProvider('goerli')),
    ...setupNetwork('kovan', 42, infuraProvider('kovan')),
    ...setupNetwork('xdai', 100, 'https://dai.poa.network'),
    ...setupNetwork('sokol', 77, 'https://sokol.poa.network'),
    ...setupNetwork('bsc', 56, 'https://bsc-dataseed1.binance.org'),
    ...setupNetwork('bscTest', 97, 'https://data-seed-prebsc-1-s1.binance.org:8545'),
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
    tests: 'test',
  },
  mocha: {
    timeout: 0,
  },
  etherscan: {
    apiKey: '',
  },
  /*external: {
    contracts: [
      {
        artifacts: 'etherspot/artifacts',
        deploy: 'etherspot/deploy',
      },
    ],
  },*/
};

module.exports = config;
