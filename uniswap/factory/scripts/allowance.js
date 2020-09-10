const { ethers, providers } = require('ethers');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const {
  sendOwnerEncodedFunction,
  // sendTraderEncodedFunction
} = require('../../../utils');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Factory_sol_UniswapV2Pair.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const contract = new ethers.Contract(
  config.pair,
  abi,
  ethProvider
);

const method = abi.filter(m => m.name === 'approve')[0];

async function main () {
  console.info('pair UNI-V2 allowance for uniswap router');
  const ownerAllowance = await contract.allowance(config.ownerAddress, config.uniswapRouter);
  console.info(`Owner: `, ownerAllowance.toString());
  const traderAllowance = await contract.allowance(config.traderAddress, config.uniswapRouter);
  console.info(`Trader: `, traderAllowance.toString());
}

main();
