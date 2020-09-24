const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Factory_sol_UniswapV2Factory.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'createPair')[0];

async function main () {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [process.env.tokenHash || config.tokenHash]
  );

  const wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const transactionCountPromise = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    to: config.uniswapFactory,
    nonce: transactionCountPromise,
    gasLimit: '0x5F5E10',
    gasPrice: '0xa',
    data: encodedContractFunction,
    value: 0,
    chainId: config.networkId,
  });
  console.info(result);
}

main();