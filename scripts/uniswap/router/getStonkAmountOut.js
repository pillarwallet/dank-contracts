const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

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
  console.info('Uniswap Router: get stonk amount out')
  const stonkInputAmount = ethers.BigNumber.from(10).pow(6);
  const tokenAmountOut = await routerContract.getStonkAmountOut(ethers.utils.hexlify(stonkInputAmount), process.env.tokenHash || config.tokenHash);
  console.info('Amount: ', tokenAmountOut.toString());
}

main();