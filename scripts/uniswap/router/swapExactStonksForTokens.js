const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendTraderEncodedFunction } = require('../../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter(m => m.name === 'swapExactStonksForTokens')[0];

async function main() {
  const stonkAmountIn = ethers.BigNumber.from(10).pow(5);
  const minTokenAmountOut = ethers.BigNumber.from(10).pow(5).mul(2).sub(10000);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      ethers.utils.hexlify(stonkAmountIn),
      ethers.utils.hexlify(minTokenAmountOut),
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
