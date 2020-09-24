const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../../shared');

const { networkId } = config;
const routerAbi = getContractAbi(ContractNames.UniswapV2Router);
const pairAbi = getContractAbi(ContractNames.UniswapV2Pair);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);

const routerContract = new ethers.Contract(
  uniswapRouter,
  routerAbi,
  ethProvider
);
const pairContract = new ethers.Contract(
  process.env.pair || config.pair,
  pairAbi,
  ethProvider
);

async function main() {
  console.info('Pair quote');
  const reserves = await pairContract.getReserves();
  const [tokenReserve, stonkReserve] = reserves;
  console.info('Pair reserves: ')
  console.info('Token: ', tokenReserve.toString())
  console.info('STNK: ', stonkReserve.toString())
  const stonkInputAmount = ethers.BigNumber.from(1024);
  console.info('STNK input: ', stonkInputAmount.toString())
  const quote = await routerContract.quote(stonkInputAmount, stonkReserve, tokenReserve);
  console.info('Quote ', quote.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
