const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendOwnerEncodedFunction } = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC1155);
const erc1155Address = getContractAddress(ContractNames.ERC1155, networkId);
const method = abi.filter(m => m.name === 'safeTransferFrom')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [
      config.ownerAddress,
      process.env.to,
      process.env.tokenHash,
      1,
      []
    ]
  );

  const result = await sendOwnerEncodedFunction(encodedContractFunction, erc1155Address);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
