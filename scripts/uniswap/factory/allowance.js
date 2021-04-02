const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../../build/');
const { ethProvider } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Pair);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);

const contract = new ethers.Contract(process.env.pair || config.pair, abi, ethProvider);

async function main() {
  console.info('pair UNI-V2 allowance for uniswap router');
  const ownerAllowance = await contract.allowance(config.ownerAddress, uniswapRouter);
  console.info('Owner: ', ownerAllowance.toString());
  const traderAllowance = await contract.allowance(config.traderAddress, uniswapRouter);
  console.info('Trader: ', traderAllowance.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
