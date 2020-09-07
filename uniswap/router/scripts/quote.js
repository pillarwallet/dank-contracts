const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getRouterAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const getPairAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Factory_sol_UniswapV2Pair.abi'));
  return JSON.parse(json.toString());
};

const routerAbi = getRouterAbi();
const routerContract = new ethers.Contract(
  config.uniswapRouter,
  routerAbi,
  ethProvider
);

const pairAbi = getPairAbi();
const pairContract = new ethers.Contract(
  '0x93f38b466bFd2fAF9Fb173872dc3A39b551a08E2',
  pairAbi,
  ethProvider
);

async function main () {
  const reserves = await pairContract.getReserves();
  const [tokenReserve, stonkReserve] = reserves;
  const stonkInputAmount = 10000000000;
  const quote = await routerContract.quote(stonkInputAmount, stonkReserve, tokenReserve);
  console.info('Quote ', quote);
}

main();