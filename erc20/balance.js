const { ethers, providers } = require('ethers');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

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
  console.info('STONK balances');
  const ownerBalance = await contract.balanceOf(config.ownerAddress);
  console.info(`Owner: `, ownerBalance.toString());
  const traderBalance = await contract.balanceOf(config.traderAddress);
  console.info(`Trader: `, traderBalance.toString());
}

main();