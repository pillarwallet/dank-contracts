const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const {
  sendOwnerEncodedFunction,
  // sendTraderEncodedFunction
} = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Pair);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter(m => m.name === 'approve')[0];

async function main() {
  console.info('Approving uniswap router for UNI-V2');
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [uniswapRouter, ethers.utils.hexlify(ethers.constants.MaxUint256)]
  );

  await sendOwnerEncodedFunction(encodedContractFunction, process.env.pair || config.pair);
  // await sendTraderEncodedFunction(encodedContractFunction, config.erc20Address);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
