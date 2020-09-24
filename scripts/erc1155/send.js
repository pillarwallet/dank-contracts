const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const {
  sendOwnerEncodedFunction,
  // sendTraderEncodedFunction,
} = require('../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.ERC1155);
const erc1155Address = getContractAddress(ContractNames.ERC1155, networkId);
const method = abi.filter(m => m.name === 'transferFrom')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      config.ownerAddress,
      process.env.to || config.traderAddress,
      process.env.tokenHash || config.tokenHash,
      Math.pow(10, 2)
    ]
  );

  const result = await sendOwnerEncodedFunction(encodedContractFunction, erc1155Address);
  // await sendTraderEncodedFunction(encodedContractFunction, erc1155Address)
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
