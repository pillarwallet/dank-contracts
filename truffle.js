const PrivateKeyProvider = require('truffle-privatekey-provider');
const config = require('./config');

function provider() {
  const providerPrivateKey = config.ownerPrivateKey;
  const providerEndpoint = config.eth_provider;

  if (!config.ownerPrivateKey) {
    throw new Error('Please setup ownerPrivateKey in config');
  }
  if (!config.eth_provider) {
    throw new Error('Please setup eth_provider in config');
  }

  return new PrivateKeyProvider(
    providerPrivateKey.startsWith('0x')
      ? providerPrivateKey.substr(2)
      : providerPrivateKey,
    providerEndpoint,
  );
}

function createNetwork(name, id) {
  return {
    [name]: {
      provider,
      gas: 5000000,
      network_id: `${id}`,
    },
  };
}

module.exports = {
  contracts_directory: './src',
  contracts_build_directory: './compiled',
  networks: {
    ...createNetwork('mainnet', 1),
    ...createNetwork('ropsten', 3),
    ...createNetwork('rinkeby', 4),
    ...createNetwork('goerli', 5),
    ...createNetwork('kovan', 42),
    ...createNetwork('xdai', 100),
    ...createNetwork('local', config.networkId),
    test: {
      host: '127.0.0.1',
      port: 8555,
      gasPrice: 20000000000,
      network_id: '*',
    },
  },
  compilers: {
    solc: {
      version: '0.6.12+commit.27d51765',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: 'istanbul',
        metadata: {
          bytecodeHash: 'none',
        },
      },
    },
  },
};
