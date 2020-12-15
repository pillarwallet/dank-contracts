const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const {
  sendOwnerEncodedFunction,
  sendTraderEncodedFunction
} = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC1155);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const erc1155Address = getContractAddress(ContractNames.ERC1155, networkId);
const method = abi.filter(m => m.name === 'setApprovalForAll')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [uniswapRouter, true]
  );

  await sendOwnerEncodedFunction(encodedContractFunction, erc1155Address);
  await sendTraderEncodedFunction(encodedContractFunction, erc1155Address);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
