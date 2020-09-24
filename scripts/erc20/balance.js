const { ethers } = require('ethers');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC20);
const erc20Address = getContractAddress(ContractNames.ERC20, networkId);

const contract = new ethers.Contract(
  erc20Address,
  abi,
  ethProvider
);

async function main() {
  console.info('STONK balances');
  const ownerBalance = await contract.balanceOf(config.ownerAddress);
  console.info(`Owner: `, ownerBalance.toString());
  const traderBalance = await contract.balanceOf(config.traderAddress);
  console.info(`Trader: `, traderBalance.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
