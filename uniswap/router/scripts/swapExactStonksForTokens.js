const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const {
  sendTraderEncodedFunction
} = require('../../../utils');

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'swapExactStonksForTokens')[0];

async function main () {
  const stonkAmountIn = ethers.BigNumber.from(10).pow(5);
  const minTokenAmountOut = ethers.BigNumber.from(10).pow(5).mul(2).sub(10000);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      ethers.utils.hexlify(stonkAmountIn),
      ethers.utils.hexlify(minTokenAmountOut),
      process.env.tokenHash || config.tokenHash,
      config.traderAddress,
      new Date().valueOf() + (1000 * 60 * 60 * 10), // 10 hours
    ]
  );

  await sendTraderEncodedFunction(encodedContractFunction, config.uniswapRouter);
}

main();