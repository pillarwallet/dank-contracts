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
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'addLiquidity')[0];

async function main () {
  const stonkAmountDeposit = 100000000000;
  const tokenAmountDeposit = 10;
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      process.env.tokenHash,
      ethers.utils.hexlify(tokenAmountDeposit),
      ethers.utils.hexlify(stonkAmountDeposit),
      0x0,
      0x0,
      config.ownerAddress,
      new Date().valueOf() + (1000 * 60 * 60 * 10), // 10 hours
    ]
  );

  const wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const transactionCountPromise = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    to: config.uniswapRouter,
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