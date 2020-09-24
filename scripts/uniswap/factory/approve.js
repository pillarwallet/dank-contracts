const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const {
  sendOwnerEncodedFunction,
  // sendTraderEncodedFunction
} = require('../../../utils');


const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Factory_sol_UniswapV2Pair.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'approve')[0];

async function main () {
  console.info('Approving uniswap router for UNI-V2');
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [config.uniswapRouter, ethers.utils.hexlify(ethers.constants.MaxUint256)]
  );

  await sendOwnerEncodedFunction(encodedContractFunction, config.pair);
  // await sendTraderEncodedFunction(encodedContractFunction, config.erc20Address);
}

main();