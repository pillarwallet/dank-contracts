const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendOwnerEncodedFunction } = require('../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.ERC721);
const erc721Address = getContractAddress(ContractNames.ERC721, networkId);
const erc1155Address = getContractAddress(ContractNames.ERC1155, networkId);
const method = abi.filter(m => m.name === 'safeTransferFrom')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [config.ownerAddress, erc1155Address, process.env.id]
  );

  const result = await sendOwnerEncodedFunction(encodedContractFunction, erc721Address);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
