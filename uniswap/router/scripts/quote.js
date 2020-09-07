const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getRouterAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const getPairAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, '../factory/build/__build_UniswapV2Factory_sol_UniswapV2Pair.abi'));
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
  process.env.pair || config.pair,
  pairAbi,
  ethProvider
);

async function main () {
  console.info('Pair quote');
  const reserves = await pairContract.getReserves();
  const [tokenReserve, stonkReserve] = reserves;
  console.info('Pair reserves: ')
  console.info('Token: ', tokenReserve)
  console.info('STNK: ', stonkReserve)
  const stonkInputAmount = ethers.BigNumber.from(10).pow(16);
  console.info('STNK input: ', stonkInputAmount)
  const quote = await routerContract.quote(stonkInputAmount, stonkReserve, tokenReserve);
  console.info('Quote ', quote);
}

main();