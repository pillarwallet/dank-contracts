const { ethers, providers } = require('ethers');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc20/build/_ERC20_sol_ERC20.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();

const contract = new ethers.Contract(
  config.erc20Address,
  abi,
  ethProvider
);

async function main () {
  console.info('Uniswap router allowance');
  const ownerAllowance = await contract.allowance(config.ownerAddress, config.uniswapRouter);
  console.info(`Owner: `, ownerAllowance.toString());
  const traderAllowance = await contract.allowance(config.traderAddress, config.uniswapRouter);
  console.info(`Trader: `, traderAllowance.toString());
}

main();