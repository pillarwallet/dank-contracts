const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Factory_sol_UniswapV2Pair.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const contract = new ethers.Contract(
  process.env.pair || config.pair,
  abi,
  ethProvider
);

async function main () {
  console.info('Pair reserves');
  const reserves = await contract.getReserves();
  console.info('Token: ', reserves[0].toString());
  console.info('Stonk: ', reserves[1].toString());
}

main();