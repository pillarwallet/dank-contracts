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
const routerContract = new ethers.Contract(
  config.uniswapRouter,
  abi,
  ethProvider
);

async function main () {
  const stonkAmountIn = 50000000000;
  const tokenAmountOut = await routerContract.getTokenAmountOut(ethers.utils.hexlify(stonkAmountIn), process.env.tokenHash);
  console.info('tokenAmountOut ', tokenAmountOut);
}

main();