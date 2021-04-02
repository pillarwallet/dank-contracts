const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../../build/');
const { ethProvider } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);

const contract = new ethers.Contract(uniswapRouter, abi, ethProvider);

async function main() {
  console.info('Uniswap router params');
  const factory = await contract.factory();
  console.info('factory: ', factory);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
