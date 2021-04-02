const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendOwnerEncodedFunction, sendTraderEncodedFunction } = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC20);
const erc20Address = getContractAddress(ContractNames.ERC20, networkId);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter((m) => m.name === 'approve')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(method, [
    uniswapRouter,
    ethers.utils.hexlify(ethers.constants.MaxUint256),
  ]);

  await sendOwnerEncodedFunction(encodedContractFunction, erc20Address);
  await sendTraderEncodedFunction(encodedContractFunction, erc20Address);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
