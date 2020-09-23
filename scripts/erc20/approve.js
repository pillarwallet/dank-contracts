const { ethers, providers } = require('ethers');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../config');
const {
  sendOwnerEncodedFunction,
  sendTraderEncodedFunction
} = require('../utils');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc20/build/_ERC20_sol_ERC20.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'approve')[0];

async function main () {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [config.uniswapRouter, ethers.utils.hexlify(ethers.constants.MaxUint256)]
  );

  await sendOwnerEncodedFunction(encodedContractFunction, config.erc20Address);
  await sendTraderEncodedFunction(encodedContractFunction, config.erc20Address);
}

main();