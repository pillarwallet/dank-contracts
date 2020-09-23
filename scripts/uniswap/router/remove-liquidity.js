const { ethers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const {
  sendOwnerEncodedFunction,
} = require('../../../utils');

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'removeLiquidity')[0];

async function main () {
  const allLiquidity = ethers.BigNumber.from(141421355237);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      process.env.tokenHash || config.tokenHash,
      ethers.utils.hexlify(allLiquidity),
      0x0,
      0x0,
      config.ownerAddress,
      new Date().valueOf() + (1000 * 60 * 60 * 10), // 10 hours
    ]
  );

  sendOwnerEncodedFunction(encodedContractFunction, config.uniswapRouter)
}

main();