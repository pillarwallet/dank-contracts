const { ethers } = require('ethers');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.ERC20);
const erc20Address = getContractAddress(ContractNames.ERC20, networkId);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);

const contract = new ethers.Contract(
  erc20Address,
  abi,
  ethProvider
);

async function main() {
  console.info('Uniswap router allowance');
  const ownerAllowance = await contract.allowance(config.ownerAddress, uniswapRouter);
  console.info(`Owner: `, ownerAllowance.toString());
  const traderAllowance = await contract.allowance(config.traderAddress, uniswapRouter);
  console.info(`Trader: `, traderAllowance.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
