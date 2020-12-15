const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);

const routerContract = new ethers.Contract(
  uniswapRouter,
  abi,
  ethProvider
);

async function main() {
  console.info('Uniswap Router: get token amount out');
  const stonkInputAmount = ethers.BigNumber.from(1024);
  const tokenAmountOut = await routerContract.getTokenAmountOut(ethers.utils.hexlify(stonkInputAmount), process.env.tokenHash || config.tokenHash);
  console.info('Amount: ', tokenAmountOut.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
