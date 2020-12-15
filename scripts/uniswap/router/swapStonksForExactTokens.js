const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendTraderEncodedFunction } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter(m => m.name === 'swapStonksForExactTokens')[0];

async function main() {
  const tokenAmountOut = ethers.BigNumber.from(10).pow(5);
  const stonkAmountInMax = ethers.BigNumber.from(10).pow(5).div(2).add(10000);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      ethers.utils.hexlify(tokenAmountOut),
      ethers.utils.hexlify(stonkAmountInMax),
      process.env.tokenHash || config.tokenHash,
      config.traderAddress,
      new Date().valueOf() + (1000 * 60 * 60 * 10), // 10 hours
    ]
  );

  const result = await sendTraderEncodedFunction(encodedContractFunction, uniswapRouter);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
