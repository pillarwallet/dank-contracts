const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendTraderEncodedFunction } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter(m => m.name === 'swapTokensForExactStonks')[0];

async function main() {
  const stonkAmountOut = ethers.BigNumber.from(10).pow(5).mul(5);
  const tokenAmountInMax = ethers.BigNumber.from(10).pow(5).mul(11);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      ethers.utils.hexlify(stonkAmountOut),
      ethers.utils.hexlify(tokenAmountInMax),
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
